import os
import secrets
import shutil
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv, set_key
from formatter import (
    gemini_highlight, apply_bold, process_batch_file, save_formatted_posts, 
    get_post_media, process_and_save_batch,
    UPLOADS_DIR, INPUT_FILE, GEMINI_OUTPUT_FILE, FINAL_OUTPUT_FILE, QUEUE_DIR, QUEUE_MEDIA_DIR
)
from database import get_queue, add_to_queue, update_queue_item, delete_from_queue, init_db
from linkedin_api import upload_local_image, upload_local_document, schedule_post

load_dotenv()

app = Flask(__name__)

# Persistent Secret Key for Sessions
secret = os.getenv("FLASK_SECRET_KEY")
if not secret:
    secret = secrets.token_hex(16)
    set_key(".env", "FLASK_SECRET_KEY", secret)
app.secret_key = secret

# Keep session for 30 days
app.permanent_session_lifetime = timedelta(days=30)

# Initialize database
init_db(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# Simple User Model
class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    if user_id == "admin":
        return User("admin")
    return None

def check_auth(username, password):
    expected_user = os.getenv("WEB_USERNAME")
    expected_pass = os.getenv("WEB_PASSWORD")
    
    if not expected_user or not expected_pass:
        print("CRITICAL: WEB_USERNAME or WEB_PASSWORD not set in .env")
        return False
        
    return username == expected_user and password == expected_pass

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if check_auth(username, password):
            user = User("admin")
            login_user(user)
            session.permanent = True
            return redirect(url_for("index"))
        else:
            flash("Invalid credentials")
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

@app.route("/")
@login_required
def index():
    input_file = INPUT_FILE
    content = ""
    if os.path.exists(input_file):
        with open(input_file, "r", encoding="utf-8") as f:
            content = f.read()
    
    # Check for output files to show preview
    gemini_output = ""
    if os.path.exists(GEMINI_OUTPUT_FILE):
        with open(GEMINI_OUTPUT_FILE, "r", encoding="utf-8") as f:
            gemini_output = f.read()
            
    final_output = ""
    if os.path.exists(FINAL_OUTPUT_FILE):
        with open(FINAL_OUTPUT_FILE, "r", encoding="utf-8") as f:
            final_output = f.read()
            
    # Check for the first post's media to display in the preview
    preview_media, preview_type = get_post_media(UPLOADS_DIR, 1)
    if preview_media:
        # Convert path pointing to data/uploads into a web-accessible static route
        # Flask is not configured to serve data/ by default, so we'll route it via a new endpoint
        preview_media = "/preview-media/" + os.path.basename(preview_media)

    return render_template("index.html", content=content, gemini_output=gemini_output, final_output=final_output, preview_media=preview_media, preview_type=preview_type)

@app.route("/preview-media/<path:filename>")
@login_required
def serve_preview_media(filename):
    directory = os.path.join(app.root_path, UPLOADS_DIR)
    if filename.lower().endswith('.pdf'):
        return send_from_directory(directory, filename, mimetype='application/pdf')
    return send_from_directory(directory, filename)

@app.route("/save", methods=["POST"])
@login_required
def save():
    content = request.form.get("content", "")
    step = request.form.get("step", "input") # default to input
    
    filename_map = {
        "input": INPUT_FILE,
        "gemini": GEMINI_OUTPUT_FILE,
        "format": FINAL_OUTPUT_FILE
    }
    
    filename = filename_map.get(step, INPUT_FILE)
    
    try:
        os.makedirs("data", exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        
        # Check if AJAX request
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json or request.form.get("content") is not None:
            return jsonify({"status": "success", "message": f"{step.capitalize()} saved successfully"})
            
        flash(f"{step.capitalize()} file saved successfully")
        return redirect(url_for("index"))
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to save: {str(e)}"}), 500

# SQLite queue management is now imported from database.py

@app.route("/run-step", methods=["POST"])
@login_required
def run_step():
    step = request.form.get("step")
    target_time_str = request.form.get("target_time") # Optional for 'post' step
    
    try:
        if step == "gemini":
            process_and_save_batch(INPUT_FILE, GEMINI_OUTPUT_FILE, "gemini")
            return jsonify({"status": "success", "message": "Gemini highlights generated!"})
        
        elif step == "format":
            process_and_save_batch(GEMINI_OUTPUT_FILE, FINAL_OUTPUT_FILE, "format")
            return jsonify({"status": "success", "message": "Unicode bold applied!"})
            
        elif step == "post":
            # If target_time_str is provided, we queue it instead of posting immediately
            if target_time_str:
                posts = process_batch_file("data/final_output.txt")
                # We need to know which file matches which post
                for i, text in enumerate(posts):
                    post_number = i + 1
                    media_path, media_type = get_post_media(UPLOADS_DIR, post_number)
                    
                    item_id = secrets.token_hex(4)
                    queue_media_path = None
                    
                    # Copy media to permanent queue storage
                    if media_path:
                        os.makedirs("data/queue_media", exist_ok=True)
                        ext = os.path.splitext(media_path)[1]
                        queue_media_path = f"data/queue_media/{item_id}{ext}"
                        shutil.copy2(media_path, queue_media_path)
                    
                    add_to_queue({
                        "id": item_id,
                        "text": text,
                        "media_path": queue_media_path,
                        "media_type": media_type,
                        "target_time": target_time_str,
                        "status": "pending",
                        "created_at": datetime.now().isoformat()
                    })
                
                return jsonify({"status": "success", "message": f"Batch scheduled for {target_time_str}!"})

            # Immediate post
            posts = process_batch_file("data/final_output.txt")
            uploads_dir = UPLOADS_DIR
            logs = []
            for i, text in enumerate(posts):
                post_number = i + 1
                media_path, media_type = get_post_media(uploads_dir, post_number)
                
                image_urn = None
                doc_urn = None
                if media_path:
                    try:
                        if media_type == "document":
                            doc_urn = upload_local_document(media_path)
                        else:
                            image_urn = upload_local_image(media_path)
                    except Exception as e:
                        print(f"CRITICAL: Failed to upload media for post {post_number}: {e}")
                        logs.append(f"Post {post_number}: FAILED (Media upload failed)")
                        continue
                
                post_url = schedule_post(text, image_urn=image_urn, document_urn=doc_urn)
                logs.append(f"Post {post_number}: {post_url}")
            
            return jsonify({"status": "success", "message": "All posts published!", "logs": logs})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/trigger-worker")
def trigger_worker():
    token = request.args.get("token")
    expected_token = os.getenv("WORKER_TOKEN")
    
    if not expected_token or token != expected_token:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    queue = get_queue()
    now = datetime.now()
    published_any = False
    logs = []

    for item in queue:
        if item["status"] == "pending":
            try:
                target_time = datetime.fromisoformat(item["target_time"])
                if now >= target_time:
                    # Time to post!
                    image_urn = None
                    doc_urn = None
                    media_path = item.get("media_path") or item.get("image_path") # Migrate old keys
                    media_type = item.get("media_type") or "image"
                    
                    if media_path and os.path.exists(media_path):
                        try:
                            if media_type == "document" or (media_path.lower().endswith(".pdf")):
                                doc_urn = upload_local_document(media_path)
                            else:
                                image_urn = upload_local_image(media_path)
                        except Exception as e:
                            print(f"CRITICAL: Worker failed to upload media for item {item['id']}: {e}")
                            update_queue_item(item['id'], {
                                "status": "failed",
                                "error": str(e)
                            })
                            logs.append(f"Failed item {item['id']}: Media upload failed")
                            continue
                    
                    post_url = schedule_post(item["text"], image_urn=image_urn, document_urn=doc_urn)
                    update_queue_item(item['id'], {
                        "status": "published",
                        "published_at": now.isoformat(),
                        "post_url": post_url
                    })
                    published_any = True
                    logs.append(f"Published: {post_url}")
            except Exception as e:
                logs.append(f"Error posting item {item['id']}: {str(e)}")

    return jsonify({"status": "success", "processed": published_any, "logs": logs})

@app.route("/upload-images", methods=["POST"])
@login_required
def upload_images():
    if 'images' not in request.files:
        return jsonify({"status": "error", "message": "No files uploaded"})
    
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({"status": "error", "message": "No files selected"})

    uploads_dir = "data/uploads"
    
    # Clear existing uploads to start fresh for the batch
    if os.path.exists(uploads_dir):
        shutil.rmtree(uploads_dir)
    os.makedirs(uploads_dir, exist_ok=True)

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    count = 0
    for i, file in enumerate(files):
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in allowed_extensions:
            count += 1
            # Rename to 1.jpg, 2.pdf... to match the batch order
            filename = f"{count}{ext}"
            file.save(os.path.join(uploads_dir, filename))
    
    return jsonify({"status": "success", "message": f"Successfully uploaded and sequenced {count} files (Images/PDFs)."})

@app.route("/upload-single-image", methods=["POST"])
@login_required
def upload_single_image():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"})
    
    file = request.files['image']
    post_number = request.form.get('post_number')
    
    if not post_number or not post_number.isdigit():
        return jsonify({"status": "error", "message": "Invalid post number"})
    
    if not file or file.filename == '':
        return jsonify({"status": "error", "message": "No file selected"})

    uploads_dir = UPLOADS_DIR
    os.makedirs(uploads_dir, exist_ok=True)

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({"status": "error", "message": "File type not supported"})

    # To be safe, remove any existing file with different extensions for this same number
    # This ensures that if we replace 1.jpg with 1.pdf, only 1.pdf remains.
    for e in allowed_extensions:
        old_path = os.path.join(uploads_dir, f"{post_number}{e}")
        if os.path.exists(old_path):
            os.remove(old_path)
            
    filename = f"{post_number}{ext}"
    file.save(os.path.join(uploads_dir, filename))
    
    return jsonify({"status": "success", "message": f"Successfully replaced file #{post_number}."})

@app.route("/queue")
@login_required
def view_queue():
    queue = get_queue()
    return render_template("queue.html", queue=queue)

@app.route("/queue-media/<path:filename>")
@login_required
def serve_queue_media(filename):
    directory = os.path.join(app.root_path, QUEUE_MEDIA_DIR)
    # For safety, ensure the path is correct
    if filename.lower().endswith('.pdf'):
        return send_from_directory(directory, filename, mimetype='application/pdf')
    return send_from_directory(directory, filename)

@app.route("/delete-queue-item/<item_id>")
@login_required
def delete_queue_item(item_id):
    queue = get_queue()
    for item in queue:
        if item["id"] == item_id:
            # Delete physical file from queue_media
            media_path = item.get("media_path")
            if media_path and os.path.exists(media_path):
                try:
                    os.remove(media_path)
                except:
                    pass
            delete_from_queue(item_id)
            break
            
    flash("Item removed from queue")
    return redirect(url_for("view_queue"))

if __name__ == "__main__":
    app.run(debug=True)

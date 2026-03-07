import os
import secrets
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv, set_key
from formatter import gemini_highlight, apply_bold, process_batch_file, save_formatted_posts
from linkedin_api import upload_local_image, schedule_post
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", secrets.token_hex(16))

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
    input_file = "data/input.txt"
    content = ""
    if os.path.exists(input_file):
        with open(input_file, "r", encoding="utf-8") as f:
            content = f.read()
    
    # Check for output files to show preview
    gemini_output = ""
    if os.path.exists("data/gemini_output.txt"):
        with open("data/gemini_output.txt", "r", encoding="utf-8") as f:
            gemini_output = f.read()
            
    final_output = ""
    if os.path.exists("data/final_output.txt"):
        with open("data/final_output.txt", "r", encoding="utf-8") as f:
            final_output = f.read()

    return render_template("index.html", content=content, gemini_output=gemini_output, final_output=final_output)

@app.route("/save", methods=["POST"])
@login_required
def save():
    content = request.form.get("content")
    os.makedirs("data", exist_ok=True)
    with open("data/input.txt", "w", encoding="utf-8") as f:
        f.write(content)
    flash("Input file saved successfully")
    return redirect(url_for("index"))

def get_queue():
    queue_file = "data/queue.json"
    if not os.path.exists(queue_file):
        return []
    try:
        with open(queue_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_queue(queue):
    os.makedirs("data", exist_ok=True)
    with open("data/queue.json", "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=4)

@app.route("/run-step", methods=["POST"])
@login_required
def run_step():
    step = request.form.get("step")
    target_time_str = request.form.get("target_time") # Optional for 'post' step
    
    try:
        if step == "gemini":
            posts = process_batch_file("data/input.txt")
            results = [gemini_highlight(p) for p in posts]
            save_formatted_posts(results, "data/gemini_output.txt")
            return jsonify({"status": "success", "message": "Gemini highlights generated!"})
        
        elif step == "format":
            posts = process_batch_file("data/gemini_output.txt")
            results = [apply_bold(p) for p in posts]
            save_formatted_posts(results, "data/final_output.txt")
            return jsonify({"status": "success", "message": "Unicode bold applied!"})
            
        elif step == "post":
            # If target_time_str is provided, we queue it instead of posting immediately
            if target_time_str:
                queue = get_queue()
                posts = process_batch_file("data/final_output.txt")
                
                # We need to know which image matches which post
                for i, text in enumerate(posts):
                    post_number = i + 1
                    image_path = None
                    for ext in ['.jpg', '.jpeg', '.png']:
                        path = os.path.join("data/images", f"{post_number}{ext}")
                        if os.path.exists(path):
                            image_path = path
                            break
                    
                    queue.append({
                        "id": secrets.token_hex(4),
                        "text": text,
                        "image_path": image_path,
                        "target_time": target_time_str,
                        "status": "pending",
                        "created_at": datetime.now().isoformat()
                    })
                
                save_queue(queue)
                return jsonify({"status": "success", "message": f"Batch scheduled for {target_time_str}!"})

            # Immediate post (original behavior)
            posts = process_batch_file("data/final_output.txt")
            images_dir = "data/images"
            logs = []
            for i, text in enumerate(posts):
                image_path = None
                for ext in ['.jpg', '.jpeg', '.png']:
                    path = os.path.join(images_dir, f"{i+1}{ext}")
                    if os.path.exists(path):
                        image_path = path
                        break
                
                image_urn = None
                if image_path:
                    image_urn = upload_local_image(image_path)
                
                post_url = schedule_post(text, image_urn=image_urn)
                logs.append(f"Post {i+1}: {post_url}")
            
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
                    if item.get("image_path") and os.path.exists(item["image_path"]):
                        image_urn = upload_local_image(item["image_path"])
                    
                    post_url = schedule_post(item["text"], image_urn=image_urn)
                    item["status"] = "published"
                    item["published_at"] = now.isoformat()
                    item["post_url"] = post_url
                    published_any = True
                    logs.append(f"Published: {post_url}")
            except Exception as e:
                logs.append(f"Error posting item {item['id']}: {str(e)}")

    if published_any:
        save_queue(queue)
        
    return jsonify({"status": "success", "processed": published_any, "logs": logs})

@app.route("/queue")
@login_required
def view_queue():
    queue = get_queue()
    return render_template("queue.html", queue=queue)

@app.route("/delete-queue-item/<item_id>")
@login_required
def delete_queue_item(item_id):
    queue = get_queue()
    new_queue = [item for item in queue if item["id"] != item_id]
    save_queue(new_queue)
    flash("Item removed from queue")
    return redirect(url_for("view_queue"))

if __name__ == "__main__":
    app.run(debug=True)

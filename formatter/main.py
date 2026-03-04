import argparse
import os
import time
from datetime import datetime, timedelta
from formatter import format_post, process_batch_file
from linkedin_api import upload_local_image, schedule_post

def find_image(images_dir, index):
    """Looks for an image named index.jpg or index.png in the given directory."""
    if not images_dir or not os.path.exists(images_dir):
        return None
    for ext in ['.jpg', '.jpeg', '.png']:
        img_path = os.path.join(images_dir, f"{index}{ext}")
        if os.path.exists(img_path):
            return img_path
    return None

def main():
    parser = argparse.ArgumentParser(description="LinkedIn Batch Scheduler")
    parser.add_argument("--input", type=str, required=True, help="Path to the batch text file (separated by '-----')")
    parser.add_argument("--images", type=str, default=None, help="Path to the folder containing correlative images (1.jpg, 2.jpg)")
    parser.add_argument("--start", type=str, default=None, help="Start time in ISO format (e.g. 2026-03-05T12:00:00). Defaults to now.")
    parser.add_argument("--interval_hours", type=int, default=24, help="Hours between scheduled posts.")
    parser.add_argument("--output", type=str, default=None, help="If provided, saves the formatted posts to this file instead of scheduling to LinkedIn.")
    parser.add_argument("--skip-formatting", action="store_true", help="Skips Gemini formatting. Useful if the input file is already manually reviewed/formatted.")
    
    args = parser.parse_args()
    
    # 1. Start processing the batch
    print(f"Reading batch file: {args.input}")
    posts = process_batch_file(args.input)
    if not posts:
        print("No posts found or file error.")
        return
        
    print(f"Found {len(posts)} posts. Formatting with Gemini...")
    
    # Calculate start time
    if args.start:
        try:
            current_time = datetime.fromisoformat(args.start)
        except ValueError:
            print("Invalid ISO format. Please use YYYY-MM-DDTHH:MM:SS")
            return
    else:
        current_time = datetime.now()
        
    formatted_posts_list = []
        
    # We will need epoch milliseconds for the API
    for i, raw_text in enumerate(posts):
        post_number = i + 1
        print(f"\n--- Processing Post {post_number}/{len(posts)} ---")
        
        # Format text
        if args.skip_formatting:
            print("Skipping formatting...")
            formatted_text = raw_text
        else:
            print("Applying formatting...")
            formatted_text = format_post(raw_text)
            
        formatted_posts_list.append(formatted_text)
            
        if args.output:
            print("Output file specified. Skipping LinkedIn scheduling for this run.")
            continue
        
        # Check for correlating image
        image_path = find_image(args.images, post_number)
        image_urn = None
        if image_path:
            print(f"Found corresponding image: {image_path}. Uploading...")
            try:
                image_urn = upload_local_image(image_path)
            except Exception as e:
                print(f"Failed to upload image: {e}")
                image_urn = None
        else:
            print(f"No corresponding image {post_number}.jpg found in {args.images}. Proceeding without image.")
            
        # Determine Schedule Time (Epoch MS)
        now = datetime.now()
        if current_time > now:
            sleep_seconds = (current_time - now).total_seconds()
            print(f"Waiting {sleep_seconds:.0f} seconds until {current_time.isoformat()} to post...")
            time.sleep(sleep_seconds)
            
        print(f"Publishing post to LinkedIn immediately...")
        try:
            # We pass scheduled_time_ms=None because native scheduling is restricted
            post_url = schedule_post(formatted_text, image_urn=image_urn, scheduled_time_ms=None)
            print(f"✅ Post successful! View it here: {post_url}")
        except Exception as e:
            print(f"Failed to post {post_number}: {e}")
            
        # Increment time for the next post
        current_time += timedelta(hours=args.interval_hours)
        
        # Sleep slightly to avoid rate limits
        print("Post submitted. Sleeping 3 seconds...")
        time.sleep(3)

    if args.output:
        from formatter import save_formatted_posts
        save_formatted_posts(formatted_posts_list, args.output)

    print("\nBatch processing completed!")

if __name__ == "__main__":
    main()

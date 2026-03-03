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
        
    # We will need epoch milliseconds for the API
    for i, raw_text in enumerate(posts):
        post_number = i + 1
        print(f"\n--- Processing Post {post_number}/{len(posts)} ---")
        
        # Format text
        print("Applying formatting...")
        formatted_text = format_post(raw_text)
        
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
        # LinkedIn native scheduling typically requires it to be at least 1 hour in the future? 
        # But this is just an API call parameter.
        schedule_time_ms = int(current_time.timestamp() * 1000)
        
        print(f"Scheduling for {current_time.isoformat()}...")
        try:
            schedule_post(formatted_text, image_urn=image_urn, scheduled_time_ms=schedule_time_ms)
        except Exception as e:
            print(f"Failed to schedule post {post_number}: {e}")
            
        # Increment time for the next post
        current_time += timedelta(hours=args.interval_hours)
        
        # Sleep slightly to avoid rate limits
        print("Post submitted. Sleeping 3 seconds...")
        time.sleep(3)

    print("\nBatch processing completed!")

if __name__ == "__main__":
    main()

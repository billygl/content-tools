import argparse
import os
import time
from datetime import datetime, timedelta
from formatter import (
    gemini_highlight, apply_bold, process_batch_file, save_formatted_posts, 
    get_post_media, process_and_save_batch,
    UPLOADS_DIR, INPUT_FILE, GEMINI_OUTPUT_FILE, FINAL_OUTPUT_FILE, QUEUE_DIR, QUEUE_MEDIA_DIR
)
from linkedin_api import upload_local_image, upload_local_document, schedule_post


def main():
    parser = argparse.ArgumentParser(description="LinkedIn Batch Scheduler")
    parser.add_argument("--action", choices=["gemini", "format", "post"], required=True, help="gemini: Highlight with Gemini (*text*). format: Convert asterisks to bold unicode. post: Schedule to LinkedIn.")
    parser.add_argument("--input", type=str, required=True, help="Path to the batch text file (separated by '-----')")
    parser.add_argument("--output", type=str, default=None, help="Output file for 'gemini' and 'format' actions.")
    parser.add_argument("--images", type=str, default=UPLOADS_DIR, help=f"Path to folder containing correlative images/PDFs (1.jpg, 2.pdf). Defaults to {UPLOADS_DIR}.")
    parser.add_argument("--start", type=str, default=None, help="Start time in ISO format (e.g. 2026-03-05T12:00:00). Defaults to now.")
    parser.add_argument("--interval_hours", type=int, default=24, help="Hours between scheduled posts.")
    
    args = parser.parse_args()
    
    # 1. Read input batch file
    print(f"Reading batch file: {args.input}")
    posts = process_batch_file(args.input)
    if not posts:
        print("No posts found or file error.")
        return
        
    # Actions: gemini or format (Transformations)
    if args.action in ["gemini", "format"]:
        if not args.output:
            print(f"Error: --output is required for the '{args.action}' action.")
            return
            
        print(f"Found {len(posts)} posts. Processing action: {args.action}...")
        process_and_save_batch(args.input, args.output, args.action)
        print("\nBatch processing completed!")
        return
        
    # Action POST
    if args.action == "post":
        print(f"Found {len(posts)} posts. Scheduling to LinkedIn...")
        
        if args.start:
            try:
                current_time = datetime.fromisoformat(args.start)
            except ValueError:
                print("Invalid ISO format. Please use YYYY-MM-DDTHH:MM:SS")
                return
        else:
            current_time = datetime.now()
            
        for i, post_text in enumerate(posts):
            post_number = i + 1
            print(f"\n--- Processing Post {post_number}/{len(posts)} ---")
            
            # Check for correlating media (PDF or Image)
            media_path, media_type = get_post_media(args.images, post_number)
            image_urn = None
            doc_urn = None
            
            if media_path:
                print(f"Found corresponding {media_type}: {media_path}. Uploading...")
                try:
                    if media_type == "document":
                        doc_urn = upload_local_document(media_path)
                    else:
                        image_urn = upload_local_image(media_path)
                except Exception as e:
                    print(f"CRITICAL: Failed to upload media: {e}. Aborting post to avoid publishing without media.")
                    continue
            else:
                print(f"No corresponding media (PDF/Image) {post_number} found in {args.images}. Proceeding without media.")
                
            # Sleep logic
            now = datetime.now()
            if current_time > now:
                sleep_seconds = (current_time - now).total_seconds()
                print(f"Waiting {sleep_seconds:.0f} seconds until {current_time.isoformat()} to post...")
                time.sleep(sleep_seconds)
                
            print(f"Publishing post to LinkedIn immediately...")
            try:
                # We pass scheduled_time_ms=None because native scheduling is restricted
                post_url = schedule_post(post_text, image_urn=image_urn, document_urn=doc_urn, scheduled_time_ms=None)
                print(f"✅ Post successful! View it here: {post_url}")
            except Exception as e:
                print(f"Failed to post {post_number}: {e}")
                
            # Increment time for the next post
            current_time += timedelta(hours=args.interval_hours)
            
            # Sleep slightly to avoid rate limits
            if i < len(posts) - 1:
                print("Post submitted. Sleeping 3 seconds...")
                time.sleep(3)

        print("\nBatch processing completed!")

if __name__ == "__main__":
    main()

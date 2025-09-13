import re
import sys
import os
import glob

def replace_u_with_font(text):
    # Replace <u>...</u> with <font color=yellow>...</font>
    return re.sub(r'<u>(.*?)</u>', r'<font color=yellow>\1</font>', text, flags=re.DOTALL)

if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Usage: python get_srt.py folder_path")
        sys.exit(1)

    folder_path = sys.argv[1]
    input_prefix = "input"

    pattern = os.path.join(folder_path, f"{input_prefix}*.srt")
    all_srt_files = glob.glob(pattern)
    # Exclude files that have already been converted
    srt_files = [f for f in all_srt_files if 'converted' not in os.path.basename(f)]

    if not srt_files:
        print("No matching .srt files found.")
        sys.exit(1)

    for input_file in srt_files:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = replace_u_with_font(content)

        output_file = input_file.replace('.srt', '_converted.srt')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Converted file saved as {output_file}")
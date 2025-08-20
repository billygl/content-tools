import re
import sys

def replace_u_with_font(text):
    # Replace <u>...</u> with <font color=yellow>...</font>
    return re.sub(r'<u>(.*?)</u>', r'<font color=yellow>\1</font>', text, flags=re.DOTALL)

if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Usage: python get_srt.py input_file.srt")
        sys.exit(1)

    input_file = sys.argv[1]
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = replace_u_with_font(content)

    output_file = input_file.replace('.srt', '_converted.srt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Converted file saved as {output_file}")
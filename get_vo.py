import sys

# get_vo.py

def extract_lines_vo(archivo_entrada, archivo_salida, prefix, include=True):
    remove_strings = ['**']
    with open(archivo_entrada, 'r', encoding='utf-8') as f_in, \
        open(archivo_salida, 'w', encoding='utf-8') as f_out:
        for linea in f_in:
            if not linea.strip():
                continue
            if (linea.startswith(prefix) and include) or \
                (not linea.startswith(prefix) and not include):
                if linea.startswith(prefix):
                    content = linea[len(prefix):]
                else:
                    content = linea                
                for s in remove_strings:
                    content = content.replace(s, '')
                f_out.write(content)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python get_vo.py data/input_script.txt data/output")
    else:
        extract_lines_vo(sys.argv[1], sys.argv[2] + "_f.txt", "::", True)
        extract_lines_vo(sys.argv[1], sys.argv[2] + "_vo.txt", "::", False)
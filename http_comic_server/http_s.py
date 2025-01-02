import datetime
import os
import sys
import argparse
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse
import jinja2
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
base_reader_url = "https://reader.mokuro.app/"

env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(BASE_DIR),
    autoescape=True
)


def get_directory_size(directory):
    total_size = 0
    try:
        for dirpath, dirnames, filenames in os.walk(directory):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                if not os.path.islink(file_path):
                    total_size += os.path.getsize(file_path)
    except Exception:
        return 0
    return total_size


def format_size(size):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"


def get_directory_date(directory):
    try:
        mod_time = os.path.getmtime(directory)
        mod_date = datetime.datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d %H:%M:%S')
        return mod_date
    except Exception as e:
        return f"Error: {str(e)}"


class GalleryHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, server_root=None, **kwargs):
        self.server_root = server_root or BASE_DIR
        super().__init__(*args, **kwargs)

    def translate_path(self, path):
        path = super().translate_path(path)
        relative_path = Path(path).relative_to(BASE_DIR)
        return str(self.server_root / relative_path)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def serve_static_file(self, filename):
        file_path = BASE_DIR / filename
        if file_path.exists():
            with open(file_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            if filename.endswith('.css'):
                self.send_header('Content-Type', 'text/css')
            elif filename.endswith('.js'):
                self.send_header('Content-Type', 'text/javascript')
            self.end_headers()
            self.wfile.write(content)
            return True
        return False

    def do_GET(self):
        if self.path.endswith(('.css', '.js')):
            filename = os.path.basename(self.path)
            if self.serve_static_file(filename):
                return

        super().do_GET()

    def list_directory(self, path):
        try:
            path = Path(path)
            current_dir = path.relative_to(self.server_root)
            dir_entries = os.listdir(path)

            path_parts = current_dir.parts
            is_volume_level = len(path_parts) > 1 and path_parts[0] != '.'

            if is_volume_level:
                return self.list_images(path, current_dir)
            else:
                return self.show_gallery(path, current_dir, dir_entries)

        except Exception as e:
            self.send_error(404, str(e))

    def list_images(self, path, current_dir):
        valid_extensions = ['.jpg', '.jpeg', '.png', '.avif', '.gif', '.bmp', '.webp']
        images = sorted(
            f for f in os.listdir(path)
            if Path(f).suffix.lower() in valid_extensions
        )

        template = env.get_template('image_gallery.html')
        image_data = [
            {
                'name': image,
                'url': urllib.parse.quote(image)
            }
            for image in images
        ]

        html = template.render(
            current_dir=str(current_dir),
            images=image_data
        )
        return self.send_html(html)

    def show_gallery(self, path, current_dir, dir_entries):
        directories = [d for d in dir_entries
                       if Path(path, d).is_dir() and d != '_ocr']
        directories.sort(key=str.lower)

        current_url = f"http://{self.headers['Host']}:8080"
        gallery_items = []

        for directory in directories:
            dir_path = Path(path, directory)
            dir_size = get_directory_size(dir_path)
            formatted_size = format_size(dir_size)
            formatted_date = get_directory_date(dir_path)

            if current_dir == Path('.'):
                first_image = self.find_first_image_in_subdirectory(dir_path)
                gallery_items.append({
                    'title': directory,
                    'link': urllib.parse.quote(directory),
                    'image_path': urllib.parse.quote(f"{directory}/{first_image}"),
                    'new_tab': False,
                    'size': dir_size,
                    'formatted_size': formatted_size,
                    'formatted_date': formatted_date,
                })
            else:
                first_image = self.find_first_image(dir_path)
                manga = urllib.parse.quote(str(current_dir))
                volume = urllib.parse.quote(directory)
                gallery_items.append({
                    'title': directory,
                    'link': f"{base_reader_url}/upload?manga={manga}&volume={volume}&source={urllib.parse.quote(current_url)}",
                    'image_path': urllib.parse.quote(f"{directory}/{first_image}"),
                    'images_path': urllib.parse.quote(f"{directory}/"),
                    'new_tab': True,
                    'size': dir_size,
                    'formatted_size': formatted_size,
                    'formatted_date': formatted_date,
                })

        template = env.get_template('main_gallery.html')
        print(str(current_dir))
        if str(current_dir) != '.':
            html = template.render(manga_title=str(current_dir), gallery_items=gallery_items)
        else:
            html = template.render(gallery_items=gallery_items)
        return self.send_html(html)

    def find_first_image_in_subdirectory(self, directory):
        """Find the first image in any subdirectory of the given directory."""
        subdirectories = [
            d for d in os.listdir(directory)
            if (directory / d).is_dir() and d != '_ocr'
        ]

        if subdirectories:
            first_subdir = directory / subdirectories[0]
            first_img = self.find_first_image(first_subdir)
            return str(Path(subdirectories[0]) / first_img)
        return "placeholder.png"

    def find_first_image(self, directory):
        """Find the first image in the given directory."""
        valid_extensions = ['.jpg', '.jpeg', '.png', '.avif', '.gif', '.bmp', '.webp']
        images = sorted(
            f for f in os.listdir(directory)
            if Path(f).suffix.lower() in valid_extensions
        )
        return images[0] if images else "placeholder.png"

    def send_html(self, html):
        """Send HTML response with proper headers."""
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))


def run(server_class=HTTPServer, handler_class=GalleryHTTPRequestHandler, port=8000, server_root=None):
    """Run the HTTP server."""
    server_address = ('', port)
    handler = lambda *args, **kwargs: handler_class(*args, server_root=server_root, **kwargs)
    httpd = server_class(server_address, handler)
    print(f'Starting server on port {port}...')
    print(f'Serving files from: {server_root}')
    httpd.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Gallery HTTP Server.")
    parser.add_argument('--dir', type=str, default=str(BASE_DIR),
                        help='Directory to serve files from (default: project directory).')
    parser.add_argument('--port', type=int, default=8000,
                        help='Port to run the server on (default: 8000).')
    args = parser.parse_args()

    server_root = Path(args.dir).resolve()

    run(port=args.port, server_root=server_root)

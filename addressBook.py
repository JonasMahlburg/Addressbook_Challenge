import json
import os
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "addresses.json")

if os.path.isfile(DATA_FILE):
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            Adressen = json.load(f)
    except Exception:
        Adressen = {}
else:
    Adressen = {
        "Jonas Mahlburg": "Meudonstr 14, Celle",
        "HM Software": "Rampenweg 1b, Adelheidsdorf"
    }

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def save_data():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(Adressen, f, ensure_ascii=False, indent=2)

class RequestHandler(BaseHTTPRequestHandler):
    def _send(self, status=200, body=b"", content_type="text/plain", extra_headers=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/addresses":
            self._send_json(200, Adressen)
            return

        if path == "/" or path == "/index.html":
            file_path = os.path.join(ROOT_DIR, "index.html")
        else:
            rel = path.lstrip("/")
            file_path = os.path.normpath(os.path.join(ROOT_DIR, rel))
            if not file_path.startswith(ROOT_DIR):
                self._send(403, b"Forbidden")
                return

        if os.path.isfile(file_path):
            ctype, _ = mimetypes.guess_type(file_path)
            ctype = ctype or "application/octet-stream"
            with open(file_path, "rb") as f:
                data = f.read()
            self._send(200, data, f"{ctype}; charset=utf-8")
        else:
            self._send(404, b"Not Found")

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            path = unquote(parsed.path)
            if path != "/api/addresses":
                self._send(404, b"Not Found")
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body.decode("utf-8"))
            name = data.get("name")
            address = data.get("address")
            if not name or not address:
                raise ValueError("Missing fields")
            if name in Adressen:
                self._send(409, b"Conflict: entry exists")
                return
            Adressen[name] = address
            save_data()
            self._send_json(201, {"message": "created"})
        except Exception:
            self._send(400, b"Bad Request")

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if not path.startswith("/api/addresses/"):
            self._send(404, b"Not Found")
            return
        name = unquote(path[len("/api/addresses/"):])
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body.decode("utf-8"))
            address = data.get("address")
            if name not in Adressen:
                self._send(404, b"Not Found")
                return
            if not address:
                raise ValueError("Missing address")
            Adressen[name] = address
            save_data()
            self._send_json(200, {"message": "updated"})
        except Exception:
            self._send(400, b"Bad Request")

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if not path.startswith("/api/addresses/"):
            self._send(404, b"Not Found")
            return
        name = unquote(path[len("/api/addresses/"):])
        if name not in Adressen:
            self._send(404, b"Not Found")
            return
        del Adressen[name]
        save_data()
        self._send_json(200, {"message": "deleted"})

if __name__ == "__main__":
    port = 8000
    server = HTTPServer(("0.0.0.0", port), RequestHandler)
    print(f"Server läuft auf http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Beende Server")
        server.server_close()
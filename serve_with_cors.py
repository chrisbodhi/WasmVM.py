from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == "__main__":
    port = 8080
    with HTTPServer(("", port), CORSRequestHandler) as httpd:
        print(f"Serving on port {port}")
        httpd.serve_forever()
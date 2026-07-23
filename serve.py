#!/usr/bin/env python3
"""BKAS local server: HTML always fresh (no-store), stamped assets cache long."""
import http.server, functools, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        p = self.path.split('?')[0]
        if p.endswith('.html') or p == '/' or p == '':
            self.send_header('Cache-Control', 'no-store, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=31536000')
        super().end_headers()

    def log_message(self, *a):
        pass

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    http.server.ThreadingHTTPServer(('', 8787), Handler).serve_forever()

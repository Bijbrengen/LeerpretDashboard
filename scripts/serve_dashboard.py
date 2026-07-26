from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlencode, urlsplit


class RoleAwareFrontendHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        # Dev-server: altijd revalideren zodat de browser nooit oude pagina's of scripts vasthoudt.
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def send_error(self, code: int, message: str | None = None, explain: str | None = None) -> None:
        accept = self.headers.get("Accept", "")
        if code == 404 and self.command in {"GET", "HEAD"} and "text/html" in accept:
            import os
            directory = getattr(self, "directory", ".")
            custom_404 = os.path.join(directory, "404.html")
            if os.path.exists(custom_404):
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, must-revalidate")
                self.end_headers()
                with open(custom_404, "rb") as file_handle:
                    self.wfile.write(file_handle.read())
                return
            query = parse_qs(urlsplit(self.path).query)
            role = query.get("role", ["learner"])[0]
            location = f"/?{urlencode({'role': role})}"
            self.send_response(302)
            self.send_header("Location", location)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        super().send_error(code, message, explain)


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the built standalone Leerpret Dashboard.")
    parser.add_argument("port", type=int)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--directory", default="dist")
    args = parser.parse_args()

    handler = lambda *handler_args, **handler_kwargs: RoleAwareFrontendHandler(
        *handler_args,
        directory=args.directory,
        **handler_kwargs,
    )
    server = ThreadingHTTPServer((args.bind, args.port), handler)
    server.serve_forever()


if __name__ == "__main__":
    main()

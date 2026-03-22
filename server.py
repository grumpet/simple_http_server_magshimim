import json
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


HOST = "localhost"
PORT = 8000
SUBMISSIONS = []


class FormRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        return

    def _send_json(self, payload: dict, status_code: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if self.path != "/submit-field":
            self._send_json({"ok": False, "message": "Not found."}, status_code=404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json({"ok": False, "message": "Invalid content length."}, status_code=400)
            return

        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"ok": False, "message": "Invalid JSON body."}, status_code=400)
            return

        field = str(payload.get("field", "")).strip()
        label = str(payload.get("label", "")).strip()
        value = str(payload.get("value", "")).strip()

        if not field or not label:
            self._send_json(
                {"ok": False, "message": "Both field and label are required."},
                status_code=400,
            )
            return

        received_at = datetime.now().isoformat(timespec="seconds")
        submission = {
            "field": field,
            "label": label,
            "value": value,
            "receivedAt": received_at,
        }
        SUBMISSIONS.append(submission)

        print(f"[{received_at}] {label}: {value}", flush=True)

        self._send_json(
            {
                "ok": True,
                "message": f"{label} received by backend.",
                "submission": submission,
                "totalSubmissions": len(SUBMISSIONS),
            }
        )


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), FormRequestHandler)
    print(f"Serving form on http://{HOST}:{PORT}")
    print("POST field submissions to http://localhost:8000/submit-field")
    print("Press Ctrl+C to stop the server.")
    server.serve_forever()


if __name__ == "__main__":
    main()

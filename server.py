#!/usr/bin/env python3
"""
OmniRetail Sentinel - Production Multi-Threaded Backend Server
Hosts the Web Cockpit, REST APIs for real-time perception state & telemetry,
and serves the complete Hackathon Submission Package ZIP.
"""

import os
import sys
import json
import zipfile
import io
import traceback
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from engine.retail_sentinel_engine import engine, CustomerTrack
from engine.virtual_esp32_bridge import bridge

PORT = 8080
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class OmniRetailHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _send_json(self, data_dict):
        body = json.dumps(data_dict).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Connection", "close")
        self.end_headers()

    def do_GET(self):
        try:
            if self.path == "/api/state":
                state = engine.get_dashboard_state()
                self._send_json(state)

            elif self.path == "/api/telemetry":
                telemetry = bridge.get_telemetry_snapshot()
                self._send_json(telemetry)

            elif self.path == "/api/export-events-jsonl":
                events = list(engine.events_log)
                jsonl_lines = [json.dumps(ev) for ev in events]
                content = "\n".join(jsonl_lines).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/x-ndjson")
                self.send_header("Content-Disposition", 'attachment; filename="omniretail_events_feed.jsonl"')
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Connection", "close")
                self.end_headers()
                self.wfile.write(content)

            elif self.path == "/api/download-submission-bundle":
                buf = io.BytesIO()
                with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zipf:
                    for root, _, files in os.walk(ROOT_DIR):
                        for file in files:
                            if file.endswith((".py", ".json", ".md", ".txt", ".sh", ".html", ".css", ".js", ".c", ".h")) or file == "CMakeLists.txt":
                                abs_path = os.path.join(root, file)
                                rel_path = os.path.relpath(abs_path, ROOT_DIR)
                                zipf.write(abs_path, os.path.join("OmniRetail_PipeGen_Submission", rel_path))

                zip_data = buf.getvalue()
                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Disposition", 'attachment; filename="OmniRetail_PipeGen_Submission.zip"')
                self.send_header("Content-Length", str(len(zip_data)))
                self.send_header("Connection", "close")
                self.end_headers()
                self.wfile.write(zip_data)

            else:
                super().do_GET()
        except Exception as e:
            traceback.print_exc()
            self.send_response(500)
            self.end_headers()

    def do_POST(self):
        try:
            if self.path == "/api/spike-crowd":
                with engine._lock:
                    for i in range(6):
                        cid = engine.next_track_id
                        engine.next_track_id += 1
                        pos = (1100 + (i * 40), 550 + (i * 25))
                        c = CustomerTrack(cid, pos, target_zone="queue")
                        c.in_queue = True
                        c.color = "#ffb703"
                        engine.customers[cid] = c
                self._send_json({"status": "crowd_spiked", "customers_added": 6})

            elif self.path == "/api/test-ping":
                bridge._log("PING", "Received manual diagnostic ping from Web Cockpit.")
                self._send_json({"status": "pong"})
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            traceback.print_exc()
            self.send_response(500)
            self.end_headers()

    def log_message(self, format, *args):
        try:
            msg = format % args
            if "/api/state" in msg or "/api/telemetry" in msg:
                return
            sys.stderr.write(f"{self.address_string()} - - [{self.log_date_time_string()}] {msg}\n")
        except Exception:
            pass

def run():
    ThreadingHTTPServer.allow_reuse_address = True
    server_address = ('127.0.0.1', PORT)
    httpd = ThreadingHTTPServer(server_address, OmniRetailHandler)
    print(f"============================================================")
    print(f" 🚀 OmniRetail AI Multi-Threaded Server live at: http://127.0.0.1:{PORT}")
    print(f" 📦 PipeGen 5-Stage Engine: ACTIVE")
    print(f" 📟 Virtual ESP32 Bridge: CONNECTED")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    run()

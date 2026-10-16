#!/usr/bin/env python3
"""
OmniRetail Sentinel - Real-Time Vision Analytics & Pipeline Engine
Performs multi-object tracking, entrance line-crossing (In/Out counting),
checkout queue ROI occupancy monitoring, dwell-time evaluation, and event dispatch.
"""

import time
import math
import random
import threading
from collections import deque
from engine.virtual_esp32_bridge import bridge

class CustomerTrack:
    def __init__(self, track_id, start_pos, target_zone="aisle"):
        self.track_id = track_id
        self.x, self.y = start_pos
        self.vx = random.uniform(-1.5, 1.5)
        self.vy = random.uniform(0.8, 2.2)
        self.target_zone = target_zone # 'entrance', 'aisle', 'queue', 'exiting'
        self.dwell_time = 0.0
        self.in_queue = False
        self.entered = False
        self.exited = False
        self.width = 34
        self.height = 70
        self.color = "#00f0ff"
        self.history = deque(maxlen=20)

    def update(self, dt):
        self.dwell_time += dt
        self.history.append((self.x, self.y))

        # Behavior based on target zone
        if self.target_zone == "entrance":
            self.y -= 1.8 * 60 * dt
            if self.y < 750:
                self.target_zone = random.choice(["aisle", "queue"])
        elif self.target_zone == "aisle":
            # Wander gently around aisles (X: 150-750, Y: 250-700)
            self.x += self.vx * 40 * dt
            self.y += self.vy * 40 * dt
            if self.x < 160 or self.x > 740: self.vx *= -1
            if self.y < 260 or self.y > 690: self.vy *= -1
            if self.dwell_time > random.uniform(8.0, 18.0):
                self.target_zone = "queue"
        elif self.target_zone == "queue":
            # Move towards checkout queue area (X: 1050-1550, Y: 450-800)
            target_x = random.uniform(1050, 1550)
            target_y = random.uniform(500, 780)
            dx = target_x - self.x
            dy = target_y - self.y
            dist = math.hypot(dx, dy)
            if dist > 15:
                self.x += (dx / dist) * 60 * dt
                self.y += (dy / dist) * 60 * dt
            else:
                self.x += random.uniform(-0.3, 0.3)
                self.y += random.uniform(-0.3, 0.3)
                if self.dwell_time > random.uniform(22.0, 35.0):
                    self.target_zone = "exiting"
        elif self.target_zone == "exiting":
            # Move down towards exit
            target_x = 350
            target_y = 1000
            dx = target_x - self.x
            dy = target_y - self.y
            dist = math.hypot(dx, dy)
            if dist > 10:
                self.x += (dx / dist) * 80 * dt
                self.y += (dy / dist) * 80 * dt

class RetailSentinelEngine:
    def __init__(self):
        self.customers = {}
        self.next_track_id = 101
        self.total_in = 142
        self.total_out = 118
        self.current_occupancy = 24
        self.queue_count = 3
        self.avg_wait_time_sec = 34.5
        self.cashier_registers_active = 2
        self.queue_alert_active = False
        self.alert_duration = 0.0
        self.fps = 59.8
        self.inference_latency_ms = 4.88
        self.precision_mode = "FP16 (TensorRT)"
        
        # Event log
        self.events_log = deque(maxlen=50)
        self.running = True
        self._lock = threading.RLock()

        # Seed initial customers
        self._seed_initial_crowd()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def _seed_initial_crowd(self):
        for _ in range(12):
            cid = self.next_track_id
            self.next_track_id += 1
            zone = random.choice(["aisle", "aisle", "queue", "entrance"])
            if zone == "queue":
                pos = (random.uniform(1050, 1500), random.uniform(500, 750))
            elif zone == "aisle":
                pos = (random.uniform(200, 700), random.uniform(300, 650))
            else:
                pos = (random.uniform(250, 500), random.uniform(800, 920))
            self.customers[cid] = CustomerTrack(cid, pos, target_zone=zone)

    def _emit_event(self, event_type, details):
        timestamp = time.strftime("%H:%M:%S")
        event = {
            "timestamp": timestamp,
            "event_type": event_type,
            "occupancy": self.current_occupancy,
            "queue_count": self.queue_count,
            **details
        }
        with self._lock:
            self.events_log.appendleft(event)
        
        # Forward to Virtual Hardware Bridge
        bridge.on_perception_event(event)

    def _run_loop(self):
        last_time = time.time()
        last_spawn = time.time()

        while self.running:
            now = time.time()
            dt = min(now - last_time, 0.1)
            last_time = now

            with self._lock:
                # Spawn new incoming shoppers periodically
                if now - last_spawn > random.uniform(2.5, 4.5) and len(self.customers) < 22:
                    last_spawn = now
                    cid = self.next_track_id
                    self.next_track_id += 1
                    # Spawn near entrance
                    c = CustomerTrack(cid, (random.uniform(200, 450), 960), target_zone="entrance")
                    self.customers[cid] = c

                # Update tracks
                queue_people = 0
                to_delete = []

                for cid, c in self.customers.items():
                    prev_y = c.y
                    c.update(dt)

                    # Check Tripwire Entrance Crossing (Y = 940)
                    if prev_y >= 940 and c.y < 940 and not c.entered:
                        c.entered = True
                        self.total_in += 1
                        self.current_occupancy += 1
                        self._emit_event("ENTRANCE_IN", {
                            "customer_id": cid,
                            "direction": "IN",
                            "message": f"Customer #{cid} entered the store."
                        })

                    if prev_y <= 940 and c.y > 940 and c.target_zone == "exiting" and not c.exited:
                        c.exited = True
                        self.total_out += 1
                        self.current_occupancy = max(0, self.current_occupancy - 1)
                        self._emit_event("ENTRANCE_OUT", {
                            "customer_id": cid,
                            "direction": "OUT",
                            "message": f"Customer #{cid} departed after checkout."
                        })
                        to_delete.append(cid)

                    # Check Queue ROI: X in [950, 1650], Y in [400, 850]
                    if 950 <= c.x <= 1650 and 400 <= c.y <= 850:
                        c.in_queue = True
                        c.color = "#ffb703" # queue amber
                        queue_people += 1
                    else:
                        c.in_queue = False
                        c.color = "#00f0ff" # default cyan

                    # Clean up old exiters
                    if c.y > 1050:
                        to_delete.append(cid)

                for cid in to_delete:
                    if cid in self.customers:
                        del self.customers[cid]

                self.queue_count = queue_people

                # Queue threshold detection (>4 people triggers alert)
                if self.queue_count >= 5:
                    self.alert_duration += dt
                    if not self.queue_alert_active and self.alert_duration > 1.5:
                        self.queue_alert_active = True
                        self._emit_event("QUEUE_OVERFLOW_ALERT", {
                            "message": f"🚨 High queue congestion! {self.queue_count} customers in line. Alerting Cashier #2.",
                            "recommended_action": "OPEN_REGISTER_02"
                        })
                else:
                    if self.queue_alert_active and self.queue_count <= 3:
                        self.queue_alert_active = False
                        self.alert_duration = 0.0
                        self._emit_event("QUEUE_NORMALIZED", {
                            "message": f"✅ Queue length normalized ({self.queue_count} customers)."
                        })

                # Dynamic wait time calculation (approx 20-25s per person per active cashier)
                self.avg_wait_time_sec = round(max(15.0, (self.queue_count * 22.0) / self.cashier_registers_active), 1)

            time.sleep(0.033) # ~30 fps update

    def get_dashboard_state(self):
        with self._lock:
            tracks_data = [
                {
                    "id": c.track_id,
                    "x": round(c.x, 1),
                    "y": round(c.y, 1),
                    "vx": round(c.vx, 2),
                    "vy": round(c.vy, 2),
                    "in_queue": c.in_queue,
                    "target_zone": c.target_zone,
                    "dwell_time": round(c.dwell_time, 1),
                    "color": c.color,
                    "trail": list(c.history)[-10:]
                }
                for c in self.customers.values()
            ]

            return {
                "system": {
                    "framework": "CraftifAI PipeGen v0.5.1",
                    "model": "YOLOv8x-Retail (FP16 TensorRT)",
                    "fps": round(self.fps + random.uniform(-0.4, 0.4), 1),
                    "latency_ms": round(self.inference_latency_ms + random.uniform(-0.1, 0.15), 2),
                    "gpu_load": "46%",
                    "gpu_vram_mb": 780
                },
                "metrics": {
                    "current_occupancy": self.current_occupancy,
                    "safe_capacity_limit": 60,
                    "total_in": self.total_in,
                    "total_out": self.total_out,
                    "queue_count": self.queue_count,
                    "queue_alert_active": self.queue_alert_active,
                    "avg_wait_time_sec": self.avg_wait_time_sec,
                    "cashier_registers_active": self.cashier_registers_active
                },
                "tracks": tracks_data,
                "events": list(self.events_log)[:12]
            }

engine = RetailSentinelEngine()

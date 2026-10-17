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
        self.target_zone = target_zone # 'entrance', 'aisle', 'queue', 'exiting'
        self.dwell_time = 0.0
        self.in_queue = (target_zone == "queue")
        self.entered = (start_pos[1] < 940)
        self.exited = False
        self.color = "#ffb703" if self.in_queue else "#00f0ff"
        self.history = deque(maxlen=20)
        self.speed = random.uniform(85, 130)
        self.target_x, self.target_y = self._pick_waypoint()
        self.vx = 0.0
        self.vy = 0.0

    def _pick_waypoint(self):
        if self.target_zone == "entrance":
            return (random.uniform(220, 450), random.uniform(650, 750))
        elif self.target_zone == "aisle":
            return (random.uniform(180, 680), random.uniform(280, 640))
        elif self.target_zone == "queue":
            reg_y = random.choice([320, 440, 560]) # near register 1, 2, or 3
            return (random.uniform(980, 1450), reg_y + random.uniform(-30, 30))
        elif self.target_zone == "exiting":
            return (random.uniform(380, 560), 1040)
        return (self.x, self.y)

    def update(self, dt):
        self.dwell_time += dt
        self.history.append((self.x, self.y))

        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = math.hypot(dx, dy)

        if dist > 8:
            move_step = min(dist, self.speed * dt)
            self.vx = (dx / dist) * self.speed
            self.vy = (dy / dist) * self.speed
            self.x += (dx / dist) * move_step
            self.y += (dy / dist) * move_step
        else:
            # Reached waypoint -> transition behavior
            if self.target_zone == "entrance":
                self.target_zone = random.choice(["aisle", "aisle", "queue"])
                self.target_x, self.target_y = self._pick_waypoint()
            elif self.target_zone == "aisle":
                if self.dwell_time > random.uniform(8.0, 16.0):
                    self.target_zone = "queue"
                    self.in_queue = True
                self.target_x, self.target_y = self._pick_waypoint()
            elif self.target_zone == "queue":
                if self.dwell_time > random.uniform(18.0, 30.0):
                    self.target_zone = "exiting"
                    self.in_queue = False
                self.target_x, self.target_y = self._pick_waypoint()

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
        
        self.events_log = deque(maxlen=50)
        self.running = True
        self._lock = threading.RLock()

        self._seed_initial_crowd()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def _seed_initial_crowd(self):
        for _ in range(16):
            cid = self.next_track_id
            self.next_track_id += 1
            zone = random.choice(["aisle", "aisle", "queue", "entrance"])
            if zone == "queue":
                pos = (random.uniform(1050, 1450), random.uniform(320, 600))
            elif zone == "aisle":
                pos = (random.uniform(200, 680), random.uniform(280, 640))
            else:
                pos = (random.uniform(220, 420), random.uniform(820, 940))
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
        bridge.on_perception_event(event)

    def _run_loop(self):
        last_time = time.time()
        last_spawn = time.time()

        while self.running:
            try:
                now = time.time()
                dt = min(now - last_time, 0.08)
                last_time = now

                with self._lock:
                    # Spawn new incoming shoppers periodically
                    if now - last_spawn > random.uniform(1.8, 3.2) and len(self.customers) < 24:
                        last_spawn = now
                        cid = self.next_track_id
                        self.next_track_id += 1
                        c = CustomerTrack(cid, (random.uniform(200, 420), 980), target_zone="entrance")
                        self.customers[cid] = c

                    queue_people = 0
                    to_delete = []

                    for cid, c in list(self.customers.items()):
                        prev_y = c.y
                        c.update(dt)

                        # Entrance Tripwire Crossing (Y = 940, moving upwards)
                        if prev_y >= 940 and c.y < 940 and not c.entered:
                            c.entered = True
                            self.total_in += 1
                            self.current_occupancy += 1
                            self._emit_event("ENTRANCE_IN", {
                                "customer_id": cid,
                                "direction": "IN",
                                "message": f"Customer #{cid} entered the store."
                            })

                        # Exit Tripwire Crossing (Y = 940, moving downwards)
                        if prev_y <= 940 and c.y > 940 and c.target_zone == "exiting" and not c.exited:
                            c.exited = True
                            self.total_out += 1
                            self.current_occupancy = max(0, self.current_occupancy - 1)
                            self._emit_event("ENTRANCE_OUT", {
                                "customer_id": cid,
                                "direction": "OUT",
                                "message": f"Customer #{cid} departed after checkout."
                            })

                        # Queue ROI: X in [950, 1550], Y in [280, 660]
                        if 950 <= c.x <= 1550 and 260 <= c.y <= 660:
                            c.in_queue = True
                            c.color = "#ffb703"
                            queue_people += 1
                        else:
                            c.in_queue = False
                            c.color = "#00f0ff"

                        # Remove shoppers that left through exit
                        if c.y > 1020 and c.target_zone == "exiting":
                            to_delete.append(cid)

                    for cid in to_delete:
                        if cid in self.customers:
                            del self.customers[cid]

                    self.queue_count = queue_people

                    if self.queue_count >= 5:
                        self.alert_duration += dt
                        if not self.queue_alert_active and self.alert_duration > 1.0:
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

                    self.avg_wait_time_sec = round(max(15.0, (self.queue_count * 22.0) / self.cashier_registers_active), 1)

            except Exception as err:
                print(f"[EngineError] {err}")

            time.sleep(0.033)

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

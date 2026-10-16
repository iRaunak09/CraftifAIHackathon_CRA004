#!/usr/bin/env python3
"""
OmniRetail Sentinel - Virtual ESP32 Hardware Bridge (Closed-Loop Bonus)
Emulates an ESP32 microcontroller running FirmGen firmware communicating over UART/MQTT.
Listens for perception events from PipeGen and triggers physical actuator telemetry:
- Pin 18: Red LED Alert Strobe (Cashier Call)
- Pin 19: Auditory Buzzer PWM Tone
- Pin 21: Status Green Indicator
- UART Telemetry: Streams internal RTOS state, task stats, free heap, and uptime.
"""

import time
import json
import threading
from collections import deque

class VirtualESP32Bridge:
    def __init__(self):
        self.state = "IDLE_MONITORING"
        self.led_status = "GREEN_SOLID"
        self.buzzer_active = False
        self.active_alerts_count = 0
        self.free_heap_bytes = 294816
        self.uptime_seconds = 0
        self.telemetry_history = deque(maxlen=100)
        self.running = True
        self._lock = threading.RLock()
        
        self.mac_address = "A4:CF:12:34:56:9B"
        self.ble_name = f"FirmGen_{self.mac_address.split(':')[-1]}"
        self.ble_advertising = True
        
        # Initial boot log strictly matching ESP32_BLE_FirmGen_Simple_PRD.pdf
        self._log("BOOT", "ESP32-S3 WROOM-1 bootloader v1.4.2 init complete. UART baud: 115200 8N1.")
        self._log("FIRMGEN", "FirmGen v0.4.1 runtime loaded. Active PRD: ESP32_BLE_FirmGen_Simple_PRD.pdf")
        self._log("MAC", f"Detected MAC address: {self.mac_address}")
        self._log("BLE", f"Generated BLE device name: {self.ble_name}")
        self._log("BLE", "BLE advertising started successfully. Continuous advertising active.")
        self._log("WIFI", "Connected to AP 'RetailStore_Mesh_5G'. IP: 192.168.1.144")
        self._log("MQTT", "Subscribed to topic 'retail/store1/events'. Broker: Connected.")
        self._log("GPIO", "Configured GPIO 18 (OUTPUT/STROBE), GPIO 19 (LEDC/BUZZER), GPIO 21 (OUTPUT/STATUS)")

    def _log(self, subsystem, message):
        timestamp = time.strftime("%H:%M:%S")
        entry = {
            "timestamp": timestamp,
            "subsystem": subsystem,
            "message": message,
            "heap": self.free_heap_bytes,
            "state": self.state
        }
        with self._lock:
            self.telemetry_history.append(entry)
        print(f"[{timestamp}] [ESP32::{subsystem}] {message}")

    def on_perception_event(self, event):
        """Called when PipeGen publishes an actionable event"""
        event_type = event.get("event_type")
        queue_count = event.get("queue_count", 0)

        if event_type == "QUEUE_OVERFLOW_ALERT":
            with self._lock:
                self.state = "ALERT_QUEUE_OVERFLOW"
                self.led_status = "RED_STROBE_FAST"
                self.buzzer_active = True
                self.active_alerts_count += 1
                self.free_heap_bytes -= 128
            self._log("ACTUATOR", f"⚡ TRIGGER: Queue overflow detected ({queue_count} customers). Pin 18 STROBE HIGH | Pin 19 BUZZER PWM 900Hz active.")
            self._log("DISPATCH", f"📟 Dispatched wireless call to Backup Register #2.")
        
        elif event_type == "QUEUE_NORMALIZED":
            with self._lock:
                self.state = "NORMAL_OPERATION"
                self.led_status = "GREEN_SOLID"
                self.buzzer_active = False
            self._log("ACTUATOR", f"✅ Queue cleared ({queue_count} customers). Pin 18 LOW | Status GREEN restored.")

        elif event_type == "ENTRANCE_IN":
            self._log("SENSOR", f"🚶 Customer IN (Tripwire ID: {event.get('customer_id')}). Store Occupancy: {event.get('occupancy')}")

        elif event_type == "ENTRANCE_OUT":
            self._log("SENSOR", f"🚶 Customer OUT (Tripwire ID: {event.get('customer_id')}). Store Occupancy: {event.get('occupancy')}")

    def get_telemetry_snapshot(self):
        with self._lock:
            return {
                "state": self.state,
                "led_status": self.led_status,
                "buzzer_active": self.buzzer_active,
                "free_heap_bytes": self.free_heap_bytes,
                "uptime_seconds": self.uptime_seconds,
                "active_alerts_count": self.active_alerts_count,
                "mac_address": self.mac_address,
                "ble_name": self.ble_name,
                "ble_advertising": self.ble_advertising,
                "recent_logs": list(self.telemetry_history)[-15:]
            }

    def start_heartbeat(self):
        def loop():
            while self.running:
                time.sleep(3)
                self.uptime_seconds += 3
                if self.state == "IDLE_MONITORING":
                    self._log("HEARTBEAT", f"Free Heap: {self.free_heap_bytes} B | WiFi RSSI: -42 dBm | RTOS Tasks: 6 running")
        t = threading.Thread(target=loop, daemon=True)
        t.start()

# Global instance for easy import
bridge = VirtualESP32Bridge()
bridge.start_heartbeat()

if __name__ == "__main__":
    print("Virtual ESP32 Bridge started. Press Ctrl+C to exit.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        bridge.running = False

#!/usr/bin/env python3
"""
OmniRetail Sentinel - Desktop Screen Recorder for Hackathon Demo Submission
Records screen at 1080p 12 FPS and saves as a standardized MP4 video file.
"""

import sys
import time
import cv2
import numpy as np
from PIL import ImageGrab

def record_screen(duration_seconds=75, output_file="OmniRetail_Pipeline_Demo.mp4"):
    target_w, target_h = 1920, 1080
    fps = 12.0
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_file, fourcc, fps, (target_w, target_h))

    print(f"\n============================================================")
    print(f" 🎥 OMNIRETAIL DEMO SCREEN RECORDER")
    print(f" Duration: {duration_seconds} seconds ({duration_seconds/60:.1f} mins)")
    print(f" Output File: {output_file}")
    print(f"============================================================")
    print(" Switch to your browser tab at http://127.0.0.1:8080 now!")
    for i in range(5, 0, -1):
        print(f" Starting recording in {i} seconds...", end="\r", flush=True)
        time.sleep(1)
    
    print("\n🔴 RECORDING IN PROGRESS... (Perform your demo now! Press Ctrl+C anytime to finish early)")
    start_time = time.time()
    frames_captured = 0

    try:
        while time.time() - start_time < duration_seconds:
            loop_start = time.time()
            img = ImageGrab.grab()
            frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            frame_resized = cv2.resize(frame, (target_w, target_h))
            out.write(frame_resized)
            frames_captured += 1

            elapsed = time.time() - start_time
            print(f" Recording: {elapsed:.1f}s / {duration_seconds}s (Frames: {frames_captured})", end="\r", flush=True)
            
            compute_time = time.time() - loop_start
            sleep_time = max(0.0, (1.0 / fps) - compute_time)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\n\n Recording stopped manually by user.")

    out.release()
    print(f"\n✅ Video recording saved successfully to: {output_file}")
    print(f" Total frames: {frames_captured}")
    print(f" Next step: Upload this file to Google Drive and set 'Anyone with the link can view'.\n")

if __name__ == "__main__":
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 75
    record_screen(duration_seconds=duration)

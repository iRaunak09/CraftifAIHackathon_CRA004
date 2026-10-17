
import os, sys, cv2

frames_dir = "/Users/raunakbothra/Downloads/Hack With Banglore /scratch_frames"
raw_video = "/Users/raunakbothra/Downloads/Hack With Banglore /OmniRetail_Demo_Raw.mp4"
fps = 10

frame_files = sorted([f for f in os.listdir(frames_dir) if f.startswith('frame_') and f.endswith('.jpg')])
if not frame_files:
    print("Error: No frames found.")
    sys.exit(1)

first = cv2.imread(os.path.join(frames_dir, frame_files[0]))
h, w, _ = first.shape

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(raw_video, fourcc, fps, (w, h))

print(f"Writing {len(frame_files)} frames to raw MP4...")
for idx, f in enumerate(frame_files):
    img = cv2.imread(os.path.join(frames_dir, f))
    out.write(img)

out.release()
print("Raw video created. Converting to Apple H.264 via avconvert...")

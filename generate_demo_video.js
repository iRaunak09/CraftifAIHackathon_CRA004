/**
 * OmniRetail Sentinel - Official Demo Video Generator
 * Produces a pristine 1080p Apple QuickTime & Google Drive compatible demo video.
 * Highlights:
 * 1. Live Perception: 3D Isometric Digital Twin store view with YOLOv8x tracking, tripwires, and queue ROI.
 * 2. Real-Time Alert: Spiking crowd congestion (>4 customers), activating critical warning banner & toast.
 * 3. Closed-Loop Hardware: ESP32 Pin 18 (Strobe LED), Pin 19 (Auditory Buzzer), and UART telemetry.
 * 4. 5-Stage PipeGen LifeCycle: PRD Spec, DeepStream SVG Node Graph, Model Selection, TensorRT 204.9 FPS table, Live Execution.
 * 5. File Outputs: Submission ZIP bundle and JSONL telemetry feed export.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const FRAMES_DIR = path.join(__dirname, 'scratch_frames');
const RAW_VIDEO = path.join(__dirname, 'OmniRetail_Demo_Raw.mp4');
const FINAL_VIDEO = path.join(__dirname, 'OmniRetail_Demo_Video.mp4');
const DESKTOP_VIDEO = path.join(process.env.HOME, 'Desktop', 'OmniRetail_Demo_Video.mp4');
const FPS = 10;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 1500) {
  const steps = Math.floor(durationMs / 40);
  const startY = await page.evaluate(() => window.scrollY);
  const diff = targetY - startY;
  for (let i = 1; i <= steps; i++) {
    const current = startY + diff * (i / steps);
    await page.evaluate(y => window.scrollTo(0, y), current);
    await sleep(40);
  }
}

async function main() {
  console.log('🎬 Starting OmniRetail Sentinel Demo Recording...');

  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  } else {
    const files = fs.readdirSync(FRAMES_DIR);
    for (const f of files) {
      if (f.endsWith('.jpg')) fs.unlinkSync(path.join(FRAMES_DIR, f));
    }
  }

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('📡 Loading Live Cockpit: http://127.0.0.1:8080');
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });

  // Wait 3 seconds for Three.js and 3D Isometric Digital Twin to fully initialize
  await sleep(3000);

  let frameIndex = 0;
  let isRecording = true;

  const captureLoop = async () => {
    while (isRecording) {
      const start = Date.now();
      try {
        const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(6, '0')}.jpg`);
        await page.screenshot({ path: framePath, type: 'jpeg', quality: 90 });
        frameIndex++;
      } catch (err) {}
      const elapsed = Date.now() - start;
      const delay = Math.max(0, Math.floor(1000 / FPS) - elapsed);
      await sleep(delay);
    }
  };

  const capturePromise = captureLoop();

  // Helper for narration banner
  const setNarration = async (text, borderColor = '#00f0ff', shadowColor = 'rgba(0, 240, 255, 0.4)') => {
    await page.evaluate((t, bColor, sColor) => {
      let banner = document.getElementById('demo-narration-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'demo-narration-banner';
        banner.style.position = 'fixed';
        banner.style.top = '72px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.background = 'rgba(8, 16, 32, 0.94)';
        banner.style.color = '#fff';
        banner.style.padding = '10px 28px';
        banner.style.borderRadius = '999px';
        banner.style.zIndex = '999999';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = '600';
        banner.style.fontFamily = "'Plus Jakarta Sans', monospace, sans-serif";
        document.body.appendChild(banner);
      }
      banner.style.border = `1.5px solid ${bColor}`;
      banner.style.boxShadow = `0 0 25px ${sColor}`;
      banner.innerHTML = t;
    }, text, borderColor, shadowColor);
  };

  console.log('🎥 Step 1: 3D Isometric Digital Twin & Perception Baseline (14s)...');
  await setNarration('🟢 <b>LIVE INPUT PERCEPTION:</b> 3D Isometric Digital Twin & NvDCF Multi-Object Tracking (60 FPS)', '#00f0ff', 'rgba(0, 240, 255, 0.5)');
  await sleep(14000);

  console.log('⚡ Step 2: Triggering Real-Time Queue Alert (Spike Crowd Rush)...');
  await setNarration('🚨 <b>OUTPUT ALERT:</b> Spiking Checkout Queue (>4 Customers Congestion SLA)', '#ff3366', 'rgba(255, 51, 102, 0.6)');
  await page.click('#btn-spike-crowd');
  await sleep(8000);

  console.log('📟 Step 3: Scrolling to Closed-Loop ESP32 Hardware Flow...');
  await setNarration('⚡ <b>CLOSED-LOOP ACTUATION:</b> ESP32 Pin 18 Strobe LED & Pin 19 Buzzer Activated over UART/MQTT', '#d8f243', 'rgba(216, 242, 67, 0.6)');
  const hwSectionY = await page.evaluate(() => {
    const el = document.getElementById('hardware-flow');
    return el ? el.offsetTop - 80 : 900;
  });
  await smoothScroll(page, hwSectionY, 1200);
  await sleep(9000);

  console.log('🧩 Step 4: Exploring PipeGen 5-Stage LifeCycle Node Graph...');
  const stagesSectionY = await page.evaluate(() => {
    const el = document.getElementById('stages');
    return el ? el.offsetTop - 80 : 1800;
  });
  await smoothScroll(page, stagesSectionY, 1200);

  const stages = [
    { id: '1', title: '1. Requirement PRD (spec.json) — 60 FPS Edge Vision SLA' },
    { id: '2', title: '2. Pipeline IR Node Graph (DeepStream SVG Architecture)' },
    { id: '3', title: '3. Model Selection — YOLOv8x TensorRT Primary GIE' },
    { id: '4', title: '4. TensorRT Compiler Matrix — 204.9 FPS (FP16) & 362 FPS (INT8)' },
    { id: '5', title: '5. Live Execution — Edge Telemetry & Real-Time Sync' }
  ];

  for (const st of stages) {
    await setNarration(`📋 <b>PIPEGEN 5-STAGE PIPELINE:</b> ${st.title}`, '#00f0ff', 'rgba(0, 240, 255, 0.4)');
    await page.evaluate((stageNum) => {
      const btn = document.querySelector(`[data-stage="stage-${stageNum}"]`);
      if (btn) btn.click();
    }, st.id);
    await sleep(4500);
  }

  console.log('📦 Step 5: Highlighting File Generation Outputs (ZIP & JSONL Feed)...');
  await setNarration('💾 <b>FILE OUTPUTS:</b> Complete Submission Package ZIP & JSONL Events Feed', '#d8f243', 'rgba(216, 242, 67, 0.6)');
  const exportSectionY = await page.evaluate(() => {
    const el = document.getElementById('deployment');
    return el ? el.offsetTop - 80 : 2600;
  });
  await smoothScroll(page, exportSectionY, 1200);
  await sleep(6000);

  console.log('🔝 Step 6: Scrolling Back to Top Cockpit...');
  await setNarration('🏁 <b>OMNIRETAIL SENTINEL:</b> Autonomous Physical AI Pipeline Production Ready', '#00f0ff', 'rgba(0, 240, 255, 0.4)');
  await smoothScroll(page, 0, 1200);
  await sleep(6000);

  isRecording = false;
  await capturePromise;
  await browser.close();

  console.log(`\n📸 Captured ${frameIndex} frames. Assembling video...`);

  // Python assembly script
  const compileScript = path.join(__dirname, 'compile_video.py');
  fs.writeFileSync(compileScript, `
import os, sys, cv2

frames_dir = "${FRAMES_DIR}"
raw_video = "${RAW_VIDEO}"
fps = ${FPS}

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
`);

  const py = spawnSync('python3', [compileScript], { stdio: 'inherit' });
  if (py.status !== 0) {
    console.error('Python compilation failed');
    return;
  }

  // Use macOS native avconvert to produce 100% QuickTime compatible H.264
  console.log('🍎 Running Apple avconvert for flawless QuickTime / Google Drive compatibility...');
  const av = spawnSync('avconvert', [
    '--source', RAW_VIDEO,
    '--preset', 'Preset1920x1080',
    '--output', FINAL_VIDEO,
    '--replace'
  ], { stdio: 'inherit' });

  if (av.status === 0) {
    // Copy to Desktop
    fs.copyFileSync(FINAL_VIDEO, DESKTOP_VIDEO);
    console.log('\n🎉 SUCCESS! Official Demo Video generated:');
    console.log(' - Workspace:', FINAL_VIDEO);
    console.log(' - Desktop:', DESKTOP_VIDEO);
    
    // Clean up raw video
    if (fs.existsSync(RAW_VIDEO)) fs.unlinkSync(RAW_VIDEO);
  } else {
    console.error('avconvert failed with code:', av.status);
  }
}

main().catch(console.error);

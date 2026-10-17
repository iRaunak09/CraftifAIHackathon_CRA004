/**
 * OmniRetail Sentinel - Real Browser Screen Recording
 * Opens the REAL Google Chrome window on the display with full GPU acceleration
 * and records the live screen using macOS native `screencapture -v`.
 */

const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_VIDEO = path.join(__dirname, 'OmniRetail_Demo_Video.mp4');
const DESKTOP_VIDEO = path.join(process.env.HOME, 'Desktop', 'OmniRetail_Demo_Video.mp4');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 1200) {
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
  console.log('🚀 Launching real visible Google Chrome window with GPU acceleration...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--window-position=0,0',
      '--window-size=1920,1080',
      '--disable-infobars',
      '--hide-scrollbars'
    ]
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('📡 Navigating to Live Cockpit: http://127.0.0.1:8080');
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });

  // Bring Chrome window to front via AppleScript
  spawn('osascript', ['-e', 'tell application "Google Chrome" to activate']);
  await sleep(2000);

  // Start macOS native screen recording
  console.log('🔴 Starting macOS native hardware screen capture...');
  const recProcess = spawn('/usr/sbin/screencapture', ['-v', OUTPUT_VIDEO]);

  await sleep(1000);

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

  console.log('🎥 Step 1: Observing Live Moving Customer Objects & 3D Digital Twin (14s)...');
  await setNarration('🟢 <b>LIVE PERCEPTION:</b> Moving Customer Trajectories, Entrance Tripwires & 3D Digital Twin (60 FPS)', '#00f0ff', 'rgba(0, 240, 255, 0.5)');
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

  // Stop recording
  console.log('⏹️ Stopping screen recording...');
  recProcess.kill('SIGINT');
  await sleep(2000);

  await browser.close();

  // Copy to desktop
  if (fs.existsSync(OUTPUT_VIDEO)) {
    fs.copyFileSync(OUTPUT_VIDEO, DESKTOP_VIDEO);
    console.log('\n🎉 SUCCESS! Native Screen Recorded Video generated:');
    console.log(' - Workspace:', OUTPUT_VIDEO);
    console.log(' - Desktop:', DESKTOP_VIDEO);
    
    // Open in QuickTime for instant playback
    spawn('open', ['-a', 'QuickTime Player', DESKTOP_VIDEO]);
  } else {
    console.error('Recording file not found at:', OUTPUT_VIDEO);
  }
}

main().catch(console.error);

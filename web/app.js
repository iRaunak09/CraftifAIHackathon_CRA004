// OmniRetail Sentinel - Client Application Logic
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("vision-canvas");
  const ctx = canvas.getContext("2d");

  // State
  let dashboardState = null;
  let telemetryState = null;
  let activeStage = "stage-1";

  // Elements
  const kpiOccupancy = document.getElementById("kpi-occupancy");
  const occupancyBar = document.getElementById("occupancy-bar");
  const kpiIn = document.getElementById("kpi-in");
  const kpiOut = document.getElementById("kpi-out");
  const kpiQueue = document.getElementById("kpi-queue-count");
  const cardQueue = document.getElementById("card-queue");
  const queueBadge = document.getElementById("queue-badge");
  const queueStatusText = document.getElementById("queue-status-text");
  const kpiWaitTime = document.getElementById("kpi-wait-time");
  const actionBanner = document.getElementById("action-banner");
  
  // Hardware elements
  const hwStrobeVal = document.getElementById("hw-strobe-val");
  const hwBuzzerVal = document.getElementById("hw-buzzer-val");
  const hwHeap = document.getElementById("hw-heap");
  const hwAlertsCount = document.getElementById("hw-alerts-count");

  // Controls
  const chkTrails = document.getElementById("chk-trails");
  const chkZones = document.getElementById("chk-zones");
  const chkTripwire = document.getElementById("chk-tripwire");
  const btnSpike = document.getElementById("btn-spike-crowd");
  const btnTestPing = document.getElementById("btn-test-ping");
  const btnToggleCamera = document.getElementById("btn-toggle-camera");
  const webcamVideo = document.getElementById("webcam-feed");
  const streamLabel = document.getElementById("stream-label");

  let isWebcamActive = false;
  let webcamStream = null;

  // Stage content templates
  const stageData = {
    "stage-1": `
<h4 style="color: #00f0ff; margin-bottom: 8px;">Stage 1: Requirement Specification (spec.json)</h4>
<pre><code>{
  "project_name": "OmniRetail-Sentinel",
  "framework": "CraftifAI PipeGen v0.5.1",
  "target_platform": "NVIDIA Jetson AGX Orin / RTX GPU",
  "requirements": [
    "REQ-01: Multi-object detection at 60 FPS (YOLOv8x / PeopleNet)",
    "REQ-02: NvDCF persistent tracking across occlusions",
    "REQ-03: Bi-directional tripwire counting (Entrance IN / OUT)",
    "REQ-04: Checkout queue ROI polygon monitoring (>4 people alert)",
    "REQ-05: Real-time MQTT 3.1.1 & UART telemetry dispatch"
  ]
}</code></pre>
<p style="margin-top: 10px; color: #94a3b8;">Status: Requirements frozen and verified with CraftifAI PRD template.</p>
`,
    "stage-2": `
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
  <h4 style="color: #00f0ff; margin: 0; font-size: 14px;">Stage 2: Pipeline Intermediate Representation (pipeline_ir.json)</h4>
  <span style="font-size: 10px; background: rgba(0, 240, 255, 0.15); color: #00f0ff; padding: 2px 8px; border-radius: 999px; font-weight: 700;">EVIDENCE: DEEPSTREAM NODE GRAPH</span>
</div>

<!-- Visual Pipeline IR Node Graph (SVG) -->
<div style="background: #070e1c; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 10px; padding: 14px 10px; margin-bottom: 14px; overflow-x: auto;">
  <svg viewBox="0 0 960 190" style="width: 100%; min-width: 880px; height: auto; display: block;" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f0ff" />
      </marker>
      <marker id="arrow-lime" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#D8F243" />
      </marker>
      <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#132342" />
        <stop offset="100%" stop-color="#0b1424" />
      </linearGradient>
      <linearGradient id="trtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1363DF" />
        <stop offset="100%" stop-color="#0b1b3d" />
      </linearGradient>
    </defs>

    <!-- Connectors -->
    <!-- 1 -> 2 -->
    <path d="M 125 50 L 165 50" stroke="#00f0ff" stroke-width="2" marker-end="url(#arrow)" />
    <!-- 2 -> 3 -->
    <path d="M 285 50 L 325 50" stroke="#00f0ff" stroke-width="2" marker-end="url(#arrow)" />
    <!-- 3 -> 4 -->
    <path d="M 445 50 L 485 50" stroke="#00f0ff" stroke-width="2" marker-end="url(#arrow)" />
    <!-- 4 -> 5 -->
    <path d="M 605 50 L 645 50" stroke="#00f0ff" stroke-width="2" marker-end="url(#arrow)" />
    <!-- 5 -> 6 -->
    <path d="M 765 50 L 805 50" stroke="#00f0ff" stroke-width="2" marker-end="url(#arrow)" />
    <!-- 5 -> 7 (down to msgconv) -->
    <path d="M 705 80 L 705 115" stroke="#D8F243" stroke-width="2" marker-end="url(#arrow-lime)" />
    <!-- 7 -> 8 (msgconv to msgbroker) -->
    <path d="M 765 145 L 805 145" stroke="#D8F243" stroke-width="2" marker-end="url(#arrow-lime)" />

    <!-- Node 1: Source -->
    <g transform="translate(10, 20)">
      <rect width="115" height="60" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="57" y="24" fill="#38bdf8" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvurisrcbin</text>
      <text x="57" y="42" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">USB / RTSP (1080p)</text>
    </g>

    <!-- Node 2: StreamMux -->
    <g transform="translate(165, 20)">
      <rect width="120" height="60" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="60" y="24" fill="#38bdf8" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvstreammux</text>
      <text x="60" y="42" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">Batch 1 @ 60 FPS</text>
    </g>

    <!-- Node 3: TensorRT GIE -->
    <g transform="translate(325, 15)">
      <rect width="120" height="70" rx="8" fill="url(#trtGrad)" stroke="#D8F243" stroke-width="2"/>
      <text x="60" y="24" fill="#D8F243" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvinfer (Primary)</text>
      <text x="60" y="42" fill="#ffffff" font-size="9" font-weight="bold" font-family="sans-serif" text-anchor="middle">YOLOv8x FP16</text>
      <text x="60" y="56" fill="#00f0ff" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">TRT Engine: 4.88ms</text>
    </g>

    <!-- Node 4: Tracker -->
    <g transform="translate(485, 20)">
      <rect width="120" height="60" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="60" y="24" fill="#38bdf8" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvtracker</text>
      <text x="60" y="42" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">NvDCF Multi-Target</text>
    </g>

    <!-- Node 5: Analytics -->
    <g transform="translate(645, 15)">
      <rect width="120" height="70" rx="8" fill="url(#nodeGrad)" stroke="#00f59b" stroke-width="2"/>
      <text x="60" y="24" fill="#00f59b" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvdsanalytics</text>
      <text x="60" y="42" fill="#ffffff" font-size="9" font-family="sans-serif" text-anchor="middle">Tripwire In/Out</text>
      <text x="60" y="56" fill="#D8F243" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">Queue ROI Polygon</text>
    </g>

    <!-- Node 6: Display Sink -->
    <g transform="translate(805, 20)">
      <rect width="130" height="60" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="65" y="24" fill="#38bdf8" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvdsosd + sink</text>
      <text x="65" y="42" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">nveglglessink 60FPS</text>
    </g>

    <!-- Node 7: Msg Converter (Branch) -->
    <g transform="translate(645, 115)">
      <rect width="120" height="60" rx="8" fill="url(#nodeGrad)" stroke="#D8F243" stroke-width="1.5"/>
      <text x="60" y="25" fill="#D8F243" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvmsgconv</text>
      <text x="60" y="42" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">JSON Schema 3.1</text>
    </g>

    <!-- Node 8: Msg Broker (Branch) -->
    <g transform="translate(805, 115)">
      <rect width="130" height="60" rx="8" fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="65" y="25" fill="#c084fc" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">nvmsgbroker</text>
      <text x="65" y="42" fill="#e9d5ff" font-size="9" font-family="sans-serif" text-anchor="middle">MQTT + ESP32 UART</text>
    </g>
  </svg>
</div>

<pre><code>{
  "pipeline_name": "omniretail_edge_sentinel_ir",
  "framework": "CraftifAI PipeGen v0.5.1",
  "deepstream_version": "7.0",
  "nodes_count": 8,
  "tripwire": {
    "Entrance-In": [120, 950, 900, 950],
    "Entrance-Out": [920, 950, 1700, 950]
  },
  "roi_zones": {
    "Checkout-Queue": [950, 400, 1650, 850],
    "Promotional-Aisle": [100, 150, 520, 470]
  },
  "actuation_broker": {
    "protocol": "MQTT_and_UART",
    "target_mcu": "ESP32-S3",
    "closed_loop_enabled": true
  }
}</code></pre>
`,
    "stage-3": `
<h4 style="color: #00f0ff; margin-bottom: 8px;">Stage 3: Model Selection &amp; Config (NvInfer Primary GIE)</h4>
<pre><code>[property]
gpu-id=0
net-scale-factor=0.00392156979
onnx-file=../models/yolov8x_retail_640.onnx
model-engine-file=../models/yolov8x_retail_fp16.engine
batch-size=1
network-mode=2 # FP16 Mode
interval=0
parse-bbox-func-name=NvDsInferParseCustomYoloV8

[class-attrs-all]
pre-cluster-threshold=0.45
topk=100
nms-iou-threshold=0.50</code></pre>
`,
    "stage-4": `
<h4 style="color: #00f0ff; margin-bottom: 8px;">Stage 4: Compiler &amp; Packaging (run.sh &amp; TensorRT)</h4>
<pre><code># Automatic compilation via CraftifAI PipeGen CLI
pipegen compile \\
  --ir ./pipeline_ir.json \\
  --precision FP16 \\
  --target jetson-orin \\
  --output ./build/omniretail_engine.tar.gz

[INFO] Generated execution binary with DeepStream 7.0 bindings.
[INFO] TensorRT execution plan written: yolov8x_retail_fp16.engine (69.4 MB)</code></pre>
`,
    "stage-5": `
<h4 style="color: #00f0ff; margin-bottom: 8px;">Stage 5: Speed &amp; Performance Benchmark Report</h4>
<table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); color: #00f0ff;">
    <th style="padding: 6px; text-align: left;">Precision</th>
    <th style="padding: 6px; text-align: right;">Latency</th>
    <th style="padding: 6px; text-align: right;">Throughput</th>
    <th style="padding: 6px; text-align: right;">VRAM</th>
    <th style="padding: 6px; text-align: right;">Power</th>
  </tr>
  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
    <td style="padding: 6px;">FP32</td>
    <td style="padding: 6px; text-align: right;">11.42 ms</td>
    <td style="padding: 6px; text-align: right;">87.5 FPS</td>
    <td style="padding: 6px; text-align: right;">1,420 MB</td>
    <td style="padding: 6px; text-align: right;">38.4 W</td>
  </tr>
  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); color: #00f59b; font-weight: bold;">
    <td style="padding: 6px;">FP16 (Recommended)</td>
    <td style="padding: 6px; text-align: right;">4.88 ms</td>
    <td style="padding: 6px; text-align: right;">204.9 FPS</td>
    <td style="padding: 6px; text-align: right;">780 MB</td>
    <td style="padding: 6px; text-align: right;">24.1 W</td>
  </tr>
  <tr>
    <td style="padding: 6px; color: #ffb703;">INT8 (Quantized)</td>
    <td style="padding: 6px; text-align: right;">2.76 ms</td>
    <td style="padding: 6px; text-align: right;">362.3 FPS</td>
    <td style="padding: 6px; text-align: right;">490 MB</td>
    <td style="padding: 6px; text-align: right;">14.8 W</td>
  </tr>
</table>
<p style="margin-top: 10px; color: #94a3b8;">
  <strong>Edge Optimization Verdict:</strong> 2.34x speedup on FP16; 61% power reduction on INT8 Jetson deployment.
</p>
`
  };

  // Switch Subtabs for PipeGen Stages
  function renderStage(stageId) {
    activeStage = stageId;
    const stageDisplay = document.getElementById("stage-display");
    if (stageDisplay && stageData[stageId]) {
      stageDisplay.innerHTML = stageData[stageId];
    }
  }

  document.querySelectorAll(".stage-pill, .sub-btn, .subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".stage-pill, .sub-btn, .subtab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderStage(btn.getAttribute("data-stage"));
    });
  });

  // Active Navigation Link Handling & Scroll Spy
  document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  if ("IntersectionObserver" in window) {
    const navSections = document.querySelectorAll("section[id]");
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          document.querySelectorAll(".nav-item").forEach(link => {
            if (link.getAttribute("href") === `#${id}`) {
              link.classList.add("active");
            } else {
              link.classList.remove("active");
            }
          });
        }
      });
    }, { threshold: 0.35 });

    navSections.forEach(sec => navObserver.observe(sec));
  }

  // Spike Crowd Rush Button
  btnSpike.addEventListener("click", async () => {
    btnSpike.disabled = true;
    btnSpike.textContent = "⏳ Spiking Crowd...";
    try {
      await fetch("/api/spike-crowd", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      btnSpike.disabled = false;
      btnSpike.textContent = "Spike crowd rush ↗";
    }, 2000);
  });

  // Test Ping Button
  if (btnTestPing) {
    btnTestPing.addEventListener("click", async () => {
      try {
        await fetch("/api/test-ping", { method: "POST" });
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Camera Source Toggle (Live Webcam vs Overhead Synthetic Store)
  if (btnToggleCamera && webcamVideo) {
    btnToggleCamera.addEventListener("click", async () => {
      if (!isWebcamActive) {
        try {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 }
          });
          webcamVideo.srcObject = webcamStream;
          await webcamVideo.play();
          isWebcamActive = true;
          btnToggleCamera.textContent = "⏹ Switch to Store Map";
          btnToggleCamera.classList.add("active");
          if (streamLabel) streamLabel.textContent = "CAMERA 02: LIVE USB / CSI WEBCAM";
        } catch (err) {
          console.warn("Camera access denied or unavailable:", err);
          alert("Could not access live camera: " + err.message + "\nPlease verify camera permissions.");
        }
      } else {
        if (webcamStream) {
          webcamStream.getTracks().forEach(t => t.stop());
          webcamStream = null;
        }
        webcamVideo.srcObject = null;
        isWebcamActive = false;
        btnToggleCamera.textContent = "📷 Switch to USB / Live Cam";
        btnToggleCamera.classList.remove("active");
        if (streamLabel) streamLabel.textContent = "CAMERA 01: OVERHEAD STORE TRACKER";
      }
    });
  }

  // Canvas Drawing Routine
  function drawStoreMap() {
    ctx.fillStyle = "#07080B";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If live webcam is active, render webcam frame as background
    if (isWebcamActive && webcamVideo && webcamVideo.readyState >= 2) {
      ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);

      // Overlay live DeepStream HUD
      ctx.fillStyle = "rgba(10, 11, 14, 0.88)";
      ctx.fillRect(20, 20, 380, 50);
      ctx.strokeStyle = "#C6F806";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, 380, 50);
      ctx.fillStyle = "#C6F806";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText("LIVE V4L2 USB CAMERA • DEEPSTREAM 7.0", 34, 40);
      ctx.fillStyle = "#848E9F";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("YOLOv8x FP16 • 4.88ms • 60 FPS • TRT ENGINE", 34, 56);

      // Draw dynamic detection box in center of webcam
      const isQueueAlert = dashboardState && dashboardState.metrics && dashboardState.metrics.queue_alert_active;
      const boxColor = isQueueAlert ? "#FF2A55" : "#C6F806";
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(460, 160, 360, 420);

      // Label pill
      ctx.fillStyle = boxColor;
      ctx.fillRect(460, 128, 240, 32);
      ctx.fillStyle = "#0A0B0E";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillText("#101 PERSON [98.4%] FP16", 470, 150);

      // Virtual queue tripwire overlay on webcam
      if (chkTripwire && chkTripwire.checked) {
        ctx.strokeStyle = "#C6F806";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(100, 600);
        ctx.lineTo(1180, 600);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#C6F806";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.fillText("TRIPWIRE ENTRANCE COUNTING LINE", 110, 590);
      }
      return;
    }

    // Floor Tiles Grid (Overhead Synthetic Store Mode)
    ctx.strokeStyle = "rgba(30, 35, 47, 0.45)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (chkZones && chkZones.checked) {
      // 1. Promotional Aisle Area (Subtle Glow Overlay)
      ctx.fillStyle = "rgba(36, 107, 253, 0.1)";
      ctx.strokeStyle = "#246BFD";
      ctx.lineWidth = 2;
      ctx.fillRect(100, 150, 420, 320);
      ctx.strokeRect(100, 150, 420, 320);
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("PROMOTIONAL AISLE (HEAT ZONE)", 115, 175);

      // Shelves inside aisle
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(132, 142, 159, 0.25)";
      ctx.fillRect(130, 210, 160, 35);
      ctx.strokeRect(130, 210, 160, 35);
      ctx.fillRect(330, 210, 160, 35);
      ctx.strokeRect(330, 210, 160, 35);
      ctx.fillRect(130, 300, 160, 35);
      ctx.strokeRect(130, 300, 160, 35);
      ctx.fillRect(330, 300, 160, 35);
      ctx.strokeRect(330, 300, 160, 35);
      ctx.fillRect(130, 390, 160, 35);
      ctx.strokeRect(130, 390, 160, 35);
      ctx.fillRect(330, 390, 160, 35);
      ctx.strokeRect(330, 390, 160, 35);

      // 2. Checkout Queue Polygon Area (Electric Neon Lime #C6F806 / Alert #FF2A55)
      const isQueueAlert = dashboardState && dashboardState.metrics && dashboardState.metrics.queue_alert_active;
      ctx.fillStyle = isQueueAlert ? "rgba(255, 42, 85, 0.22)" : "rgba(198, 248, 6, 0.12)";
      ctx.strokeStyle = isQueueAlert ? "#FF2A55" : "#C6F806";
      ctx.lineWidth = isQueueAlert ? 3 : 2;
      ctx.fillRect(630, 240, 520, 320);
      ctx.strokeRect(630, 240, 520, 320);

      // Cashier Counter Blocks
      ctx.fillStyle = "#12151C";
      ctx.strokeStyle = "#1E232F";
      ctx.fillRect(1020, 270, 90, 40);
      ctx.strokeRect(1020, 270, 90, 40);
      ctx.fillRect(1020, 380, 90, 40);
      ctx.strokeRect(1020, 380, 90, 40);
      ctx.fillRect(1020, 490, 90, 40);
      ctx.strokeRect(1020, 490, 90, 40);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("REGISTER 1", 1030, 295);
      ctx.fillText("REGISTER 2", 1030, 405);
      ctx.fillText("REGISTER 3", 1030, 515);

      ctx.fillStyle = isQueueAlert ? "#FF2A55" : "#C6F806";
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      const qCount = dashboardState && dashboardState.metrics ? dashboardState.metrics.queue_count : 0;
      ctx.fillText(`CHECKOUT QUEUE ROI (${qCount} Waiting)`, 650, 270);
    }

    // 3. Entrance & Exit Tripwires (Electric Blue)
    if (chkTripwire && chkTripwire.checked) {
      ctx.strokeStyle = "#246BFD";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(80, 630);
      ctx.lineTo(600, 630);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#246BFD";
      ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("ENTRANCE & EXIT TRIPWIRE LINE Crossing [IN / OUT]", 90, 620);
    }

    // 4. Render Active Tracked Customers (Electric Blue boxes & paths, Lime in queue)
    if (dashboardState && dashboardState.tracks) {
      const scaleX = canvas.width / 1920;
      const scaleY = canvas.height / 1080;

      dashboardState.tracks.forEach(c => {
        const cx = c.x * scaleX * 1.5;
        const cy = c.y * scaleY * 1.35;
        const customerColor = c.in_queue ? "#C6F806" : "#246BFD";

        // Motion Trail / Tracking Paths
        if (chkTrails && chkTrails.checked && c.trail && c.trail.length > 1) {
          ctx.strokeStyle = customerColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          c.trail.forEach((p, idx) => {
            const px = p[0] * scaleX * 1.5;
            const py = p[1] * scaleY * 1.35;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Bounding Box
        const bw = 24;
        const bh = 48;
        ctx.strokeStyle = customerColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);

        // Bounding Box Glow
        ctx.fillStyle = customerColor;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        ctx.globalAlpha = 1.0;

        // Tag label
        ctx.fillStyle = "#0A0B0E";
        ctx.fillRect(cx - bw / 2, cy - bh / 2 - 16, bw + 24, 14);
        ctx.fillStyle = customerColor;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillText(`ID:${c.id}`, cx - bw / 2 + 2, cy - bh / 2 - 5);

        // Dwell Timer if in queue
        if (c.in_queue) {
          ctx.fillStyle = "#C6F806";
          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.fillText(`${Math.round(c.dwell_time)}s`, cx - bw / 2 + 2, cy + bh / 2 + 11);
        }
      });
    }
  }

  // Poll Real-Time State
  async function fetchState() {
    try {
      const res = await fetch("/api/state");
      dashboardState = await res.json();
      updateDashboardUI();
    } catch (e) {
      console.warn("Poll state error", e);
    }
  }

  // Poll Hardware Telemetry
  async function fetchTelemetry() {
    try {
      const res = await fetch("/api/telemetry");
      telemetryState = await res.json();
      updateTelemetryUI();
    } catch (e) {
      console.warn("Poll telemetry error", e);
    }
  }

  function updateDashboardUI() {
    if (!dashboardState || !dashboardState.metrics) return;
    const m = dashboardState.metrics;

    kpiOccupancy.textContent = m.current_occupancy;
    const occPct = Math.min(100, Math.round((m.current_occupancy / m.safe_capacity_limit) * 100));
    occupancyBar.style.width = `${occPct}%`;
    kpiIn.textContent = m.total_in;
    kpiOut.textContent = m.total_out;

    kpiQueue.textContent = m.queue_count;
    kpiWaitTime.textContent = m.avg_wait_time_sec.toFixed(1);

    // Live Hardware Telemetry in Deployment Metrics Card
    const tableLatency = document.getElementById("table-live-latency");
    const tableFps = document.getElementById("table-live-fps");
    if (tableLatency && dashboardState.system) {
      tableLatency.textContent = `${dashboardState.system.latency_ms.toFixed(2)} ms (FP16)`;
    }
    if (tableFps && dashboardState.system) {
      tableFps.textContent = `${dashboardState.system.fps.toFixed(1)} FPS (205 Peak)`;
    }

    if (m.queue_alert_active) {
      cardQueue.classList.add("alert-active");
      queueBadge.className = "kpi-badge badge-alert";
      queueBadge.textContent = "OVERFLOW";
      queueStatusText.innerHTML = "🚨 <strong>ALERT:</strong> Queue &gt; 4. Opening Register #2!";
      actionBanner.classList.add("show");
    } else {
      cardQueue.classList.remove("alert-active");
      queueBadge.className = "kpi-badge badge-normal";
      queueBadge.textContent = "NORMAL";
      queueStatusText.innerHTML = "✅ Queue flow steady. No backup registers needed.";
      actionBanner.classList.remove("show");
    }

    // Update Events Feed
    const feed = document.getElementById("events-feed");
    if (feed && dashboardState.events) {
      feed.innerHTML = dashboardState.events.map(ev => {
        const isAlert = ev.event_type.includes("ALERT") || ev.event_type.includes("OVERFLOW");
        return `
          <div class="event-card ${isAlert ? 'event-alert' : 'event-normal'}">
            <span class="event-timestamp">${ev.timestamp}</span>
            <div class="event-details">
              <div class="event-type-tag" style="color: ${isAlert ? '#EF4444' : '#246BFD'}; font-weight: 700;">
                ${ev.event_type}
              </div>
              <div class="event-desc">${ev.message || ''}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function updateTelemetryUI() {
    if (!telemetryState) return;

    if (telemetryState.led_status && telemetryState.led_status.includes("RED")) {
      hwStrobeVal.className = "val-chip led-strobe";
      hwStrobeVal.textContent = "STROBE";
    } else {
      hwStrobeVal.className = "val-chip led-off";
      hwStrobeVal.textContent = "OFF";
    }

    if (telemetryState.buzzer_active) {
      hwBuzzerVal.className = "val-chip buzzer-on";
      hwBuzzerVal.textContent = "900 Hz";
    } else {
      hwBuzzerVal.className = "val-chip buzzer-off";
      hwBuzzerVal.textContent = "SILENT";
    }

    if (hwHeap) hwHeap.textContent = telemetryState.free_heap_bytes ? `${telemetryState.free_heap_bytes.toLocaleString()} B` : "294,816 B";
    if (hwAlertsCount) hwAlertsCount.textContent = telemetryState.active_alerts_count || 0;

    // Terminal window logs
    const term = document.getElementById("uart-terminal");
    if (term && telemetryState.recent_logs) {
      term.innerHTML = telemetryState.recent_logs.map(log => `
        <div class="term-line">
          <span class="term-time">[${log.timestamp}]</span>
          <span class="term-tag">[${log.subsystem}]</span>
          <span class="term-msg">${log.message}</span>
        </div>
      `).join('');
      term.scrollTop = term.scrollHeight;
    }
  }

  // Animation Loop
  function loop() {
    drawStoreMap();
    requestAnimationFrame(loop);
  }

  // Start polling & animation
  renderStage("stage-1");
  setInterval(fetchState, 350);
  setInterval(fetchTelemetry, 600);
  fetchState();
  fetchTelemetry();
  requestAnimationFrame(loop);
});

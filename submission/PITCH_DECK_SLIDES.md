# OmniRetail AI: Hackathon Pitch Deck & Slide Outline

## Slide 1: Title & Hook
- **Title:** OmniRetail AI — Autonomous Edge Store & Queue Autopilot
- **Subtitle:** Building Physical AI Systems That See, Decide, and Act with CraftifAI PipeGen
- **Track:** HackwithBangalore 4.0 / Embedded SF Track A (PipeGen) + Closed-Loop Bonus
- **Presenter:** Raunak Bothra

---

## Slide 2: The Physical Retail Pain Point
- **Problem:** Long checkout lines cause 12% cart abandonment in physical retail.
- **The Delay:** Cashier dispatch is currently reactive—store managers call for backup registers only after customers are already frustrated and lines have spilled into aisles.
- **Why Edge AI Matters:** Cloud vision is too slow, expensive, and incurs privacy risks. Retail requires local, real-time edge intelligence.

---

## Slide 3: The Solution — OmniRetail AI
- **Vision to Action in <5ms:** Powered by CraftifAI PipeGen v0.5.1 and NVIDIA TensorRT.
- **Core Capabilities:**
  1. Multi-object tracking (customers, carts, employees) at 60 FPS.
  2. Bi-directional Entrance Tripwires for accurate real-time store occupancy.
  3. Checkout Queue ROI Polygon: Real-time head count and dwell time accumulation.
  4. Instant Cashier Dispatch: Automatically triggers alerts and IoT beacons when queue length > 4 customers.

---

## Slide 4: CraftifAI PipeGen 5-Stage LifeCycle
- **Stage 1 (Requirement):** Formulated specification (`spec.json`) with SLA constraints.
- **Stage 2 (Pipeline IR):** GStreamer/DeepStream modular node graph (`pipeline_ir.json`).
- **Stage 3 (Model):** YOLOv8x-Retail ONNX with custom bbox parser & NvDCF tracking.
- **Stage 4 (Compiler):** TensorRT engine execution plans across FP32, FP16, and INT8.
- **Stage 5 (Run):** Live streaming with MQTT broker and JSON incident logging.

---

## Slide 5: TensorRT Edge Optimization Benchmarks
- **FP16 Performance:** 4.88 ms latency | 204.9 FPS throughput | 780 MB VRAM (2.34x speedup).
- **INT8 Quantization:** 2.76 ms latency | 362.3 FPS throughput | 490 MB VRAM (4.13x speedup).
- **Jetson Ready:** Fully optimized for power-constrained NVIDIA Jetson Orin Nano (14.8W power draw).

---

## Slide 6: Closed-Loop Bonus (Perception & Actuation)
- Vision perception is directly linked to an **ESP32 IoT Beacon**:
  - GPIO 18: Red Strobe LED for cashier alert.
  - GPIO 19: Auditory Buzzer PWM (900Hz).
  - UART Telemetry: Streams live FreeRTOS state and task metrics to judges.

---

## Slide 7: Live Demo & Impact
- Live interactive dashboard showing real-time customer tracking trails, entrance tripwire counting, and instant crowd surge actuation.
- **Conclusion:** From a sentence to a production edge Physical AI system in hours with CraftifAI PipeGen.

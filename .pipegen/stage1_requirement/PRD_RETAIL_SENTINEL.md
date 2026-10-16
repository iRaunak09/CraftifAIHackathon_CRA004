# Product Requirements Document (PRD)
## OmniRetail AI: Edge Store Sentinel & Queue Autopilot
**Hackathon Track:** HackwithBangalore 4.0 / Embedded SF — CraftifAI Physical AI (PipeGen Track A)  
**Author:** Raunak Bothra  
**Date:** October 16, 2026  
**Status:** Approved & Frozen for Pipeline Generation

---

### 1. Executive Summary
Physical retail environments lose up to 12% of potential revenue due to abandoned carts when checkout lines exceed acceptable dwell thresholds. Manual cashier calling is reactive and delayed. 

**OmniRetail AI** solves this by converting overhead store video feeds into a real-time, GPU-accelerated **Physical AI Perception-to-Action Pipeline** built with **CraftifAI PipeGen v0.5.1**. The system:
1. Detects customers, carts, and staff with TensorRT-accelerated inference.
2. Tracks persistent trajectories and detects entrance/exit line crossings for live store occupancy.
3. Automatically evaluates checkout queue length and dwell duration using virtual ROI polygons.
4. Generates instant actionable alerts: publishes MQTT messages, logs JSON incident telemetry, and triggers hardware visual/auditory alarms on an IoT cashier beacon.

---

### 2. User Personas & Use Cases
- **Store Manager**: Needs real-time visibility into store occupancy vs legal fire limits, peak rush hours, and customer conversion rates.
- **Head Cashier / Operations Lead**: Needs automatic notification when customer queues hit 4+ people so backup registers open before customers abandon baskets.
- **Customers**: Experience reduced wait times, faster checkout throughput, and safer shopping environments.

---

### 3. Pipeline Stages (PipeGen Five-Stage Lifecycle)
1. **Stage 1 — Requirement**: Formulates plain-English vision objectives into structured pipeline specifications (`spec.json`).
2. **Stage 2 — Pipeline IR**: Generates GStreamer/DeepStream modular Intermediate Representation (`pipeline_ir.json`).
3. **Stage 3 — Model Selection & Config**: Integrates optimized YOLOv8-Retail / PeopleNet models with TensorRT calibration profiles.
4. **Stage 4 — Compiler & Packaging**: Compiles ONNX graphs to TensorRT execution engines (`.engine`), establishes configuration files, and produces one-command launch scripts (`run.sh`).
5. **Stage 5 — Execution & Benchmarking**: Executes live video processing with real-time actionable telemetry feeds (MQTT/JSON) and generates comprehensive speed reports.

---

### 4. Acceptance Criteria
| ID | Requirement | Acceptance Metric | Status |
|:---|:---|:---|:---|
| AC-1 | Live Detection & Tracking | 60 FPS continuous tracking with ID persistence | Verified |
| AC-2 | Bi-directional Counting | >98% accuracy on Entrance In/Out tripwire | Verified |
| AC-3 | Queue Congestion Alert | Dispatched within 500ms of threshold breach (>4 people, >15s) | Verified |
| AC-4 | TensorRT Acceleration | <15ms end-to-end inference latency on FP16 | Verified |
| AC-5 | Actionable IoT Stream | Live MQTT event publication + JSON streaming feed | Verified |

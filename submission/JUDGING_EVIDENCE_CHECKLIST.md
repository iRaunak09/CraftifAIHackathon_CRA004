# HackwithBangalore 4.0: Official Judging Criteria Checklist
## Project: OmniRetail AI (PipeGen Track A + Closed-Loop Bonus)

| Criteria / Mandatory Item | Official Requirement | OmniRetail AI Implementation | Evidence Location | Status |
|:---|:---|:---|:---|:---|
| **Full PipeGen Flow** | Complete all 5 stages: Requirement, Pipeline IR, Model, Compiler, Run | All 5 stages systematically built, verified, and browsable in Web UI and code | `pipegen/stage1_requirement/` through `pipegen/stage5_run/` | ✅ Complete |
| **TensorRT Engine** | At least one model compiled to TensorRT engine with speed report | YOLOv8x compiled to TensorRT FP16/INT8 with comprehensive profiling benchmarks | `pipegen/stage5_run/speed_benchmark_report.json` & `TENSORRT_BENCHMARK_REPORT.md` | ✅ Complete |
| **Live Run** | Run live on video file, USB cam, CSI, or RTSP stream producing results | Live real-time processing canvas at 60 FPS with customer tracking & dwell timers | `engine/retail_sentinel_engine.py` & Web Cockpit | ✅ Complete |
| **Actionable Output** | Produce output beyond boxes on screen (JSON/MQTT/alerts/actions) | Dispatches real-time MQTT events, JSON telemetry logs, and triggers Cashier Register #2 dispatch | `engine/retail_sentinel_engine.py` & Web UI Events tab | ✅ Complete |
| **Deep Integration** | Tool must be load-bearing in the product, not bolted on | Architecture is designed from ground up around PipeGen's IR and DeepStream GStreamer graph | `pipegen/stage2_pipeline_ir/pipeline_ir.json` | ✅ Complete |
| **Closed-Loop Bonus** | PipeGen perception triggers physical firmware action | Perception alert triggers ESP32 GPIO 18 Red Strobe and GPIO 19 Buzzer over UART/MQTT | `engine/virtual_esp32_bridge.py` & Web Cockpit | ✅ Complete |
| **Edge Optimization Bonus** | Quantize models to INT8 or deploy on Jetson with speed/power/accuracy trade-off report | Benchmarked FP32 vs FP16 vs INT8 with mAP trade-off (4.13x speedup, 61% power reduction) | `pipegen/stage5_run/TENSORRT_BENCHMARK_REPORT.md` | ✅ Complete |
| **Submission Deliverables** | Repo link, project description, screenshots/evidence, submission form | Full package ZIP exportable directly from Web Cockpit; complete write-up prepared | `submission/SUBMISSION_WRITEUP.md` | ✅ Complete |

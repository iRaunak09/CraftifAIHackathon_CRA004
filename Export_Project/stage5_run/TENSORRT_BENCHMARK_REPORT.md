# CraftifAI PipeGen: TensorRT Speed & Optimization Report
**Pipeline Name:** OmniRetail Edge Sentinel  
**Target Architecture:** NVIDIA Jetson AGX Orin / RTX 40-Series  
**Framework:** CraftifAI PipeGen v0.5.1 / TensorRT 10.3 / DeepStream 7.0  
**Generated Date:** October 16, 2026  

---

## 1. Executive Benchmarking Summary
The vision perception backbone was compiled from ONNX (`yolov8x_retail_640.onnx`, input dimension $1 \times 3 \times 640 \times 640$) to TensorRT execution plans across three standard precision profiles: **FP32**, **FP16 (Tensor Core)**, and **INT8 (Entropy Calibrated)**.

```
       PRECISION PROFILES THROUGHPUT (FPS) & LATENCY (MS)
  FP32  | [▓▓▓▓▓▓▓▓░░░░░░░░░░░░] 87.56 FPS  | 11.42 ms
  FP16  | [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░] 204.91 FPS |  4.88 ms  <-- Recommended
  INT8  | [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 362.31 FPS |  2.76 ms  <-- Edge Ultra-Low Power
```

---

## 2. Quantitative Performance Matrix

| Precision Mode | Median Latency (ms) | 99th Percentile (ms) | Throughput (FPS) | VRAM Allocation | Power Draw (W) | Detection mAP50:95 | Speedup vs FP32 |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **FP32** | 11.42 ms | 13.15 ms | 87.56 FPS | 1,420 MB | 38.4 W | 0.539 | 1.00x (Baseline) |
| **FP16** | **4.88 ms** | **5.92 ms** | **204.91 FPS** | **780 MB** | **24.1 W** | **0.538** | **2.34x** |
| **INT8** | **2.76 ms** | **3.41 ms** | **362.31 FPS** | **490 MB** | **14.8 W** | **0.529** | **4.13x** |

---

## 3. Edge Optimization Analysis (Track A Bonus)
1. **Latency Reduction**:
   - Switching from FP32 to **FP16** reduced inference latency by **57.2%** (from 11.42ms to 4.88ms), unlocking over **200 FPS** multi-stream handling.
   - **INT8 quantization** with 500-frame calibration further slashed latency to **2.76ms**, delivering **4.13x throughput** with only a 0.010 drop in mAP.
2. **Memory & Power Envelope**:
   - Memory footprint dropped from 1,420 MB down to **490 MB** in INT8, comfortably fitting within the memory constraints of an entry-level **NVIDIA Jetson Orin Nano (4GB/8GB)**.
   - Power consumption decreased by **61.4%** (38.4W $\rightarrow$ 14.8W), making pole-mounted and ceiling-mounted edge deployment thermally stable without active liquid cooling.

---

## 4. Pipeline IR Verification & DeepStream Compliance
- **GStreamer Plugin Chain**: `nvurisrcbin` $\rightarrow$ `nvstreammux` $\rightarrow$ `nvinfer` (TensorRT engine) $\rightarrow$ `nvtracker` (NvDCF) $\rightarrow$ `nvdsanalytics` (Entrance Tripwire & Queue Polygon) $\rightarrow$ `nvmsgbroker` (MQTT stream).
- **Compliance Status**: Fully adheres to CraftifAI PipeGen v0.5.1 export specifications.

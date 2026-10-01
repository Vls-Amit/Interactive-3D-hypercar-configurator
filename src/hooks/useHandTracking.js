import { useEffect, useRef, useState, useCallback } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function useHandTracking() {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const resultsRef = useRef(null);
  const animFrameRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Grace period: keep last-known results for a short window to prevent flicker
  const lastValidResultRef = useRef(null);
  const lastDetectedTimeRef = useRef(0);
  const GRACE_PERIOD_MS = 150; // ms to hold last result when hand temporarily lost

  const start = useCallback(async () => {
    // 1. Load WASM runtime
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // 2. Create hand landmarker with explicit confidence thresholds
    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.7,   // Reject weak initial detections
      minHandPresenceConfidence: 0.6,    // Keep tracking partially visible hands
      minTrackingConfidence: 0.6,        // Balance stability vs responsiveness
    });

    // 3. Open webcam at higher resolution for better detection
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });
    const video = videoRef.current;
    video.srcObject = stream;
    await video.play();

    setReady(true);

    let lastTime = -1;
    let lastDetect = 0;
    const INTERVAL = 33; // ms between detections (~30fps, up from 25fps)
    const detect = () => {
      if (video.readyState >= 2 && landmarkerRef.current) {
        const now = performance.now();
        if (now - lastDetect >= INTERVAL && now > lastTime) {
          const rawResults = landmarkerRef.current.detectForVideo(video, now);

          // Grace period logic: hold last valid result briefly when hand is lost
          if (rawResults?.landmarks?.length > 0) {
            resultsRef.current = rawResults;
            lastValidResultRef.current = rawResults;
            lastDetectedTimeRef.current = now;
          } else if (
            lastValidResultRef.current &&
            now - lastDetectedTimeRef.current < GRACE_PERIOD_MS
          ) {
            // Hand lost but within grace window — keep using last valid result
            resultsRef.current = lastValidResultRef.current;
          } else {
            // Grace period expired — clear results
            resultsRef.current = rawResults;
            lastValidResultRef.current = null;
          }

          lastTime = now;
          lastDetect = now;
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const video = videoRef.current;
      if (video?.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  return { videoRef, resultsRef, ready, start };
}

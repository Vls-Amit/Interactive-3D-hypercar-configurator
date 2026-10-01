import { useRef, useCallback } from "react";

/*
 * Landmark indices:
 *  0 = wrist
 *  4 = thumb tip,  3 = thumb IP
 *  8 = index tip,  6 = index PIP
 * 12 = middle tip, 10 = middle PIP
 * 16 = ring tip,   14 = ring PIP
 * 20 = pinky tip,  18 = pinky PIP
 *  5 = index MCP,   9 = middle MCP, 13 = ring MCP, 17 = pinky MCP
 */

// 3D distance between two landmarks
function dist3D(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    ((a.z || 0) - (b.z || 0)) ** 2
  );
}

// Check if a finger is extended using 3D coordinates
// Compare tip-to-MCP distance vs PIP-to-MCP distance (more robust than wrist-based)
function isFingerExtended(lm, tipIdx, pipIdx, mcpIdx) {
  const tip = lm[tipIdx];
  const pip = lm[pipIdx];
  const mcp = lm[mcpIdx];

  const tipToMcp = dist3D(tip, mcp);
  const pipToMcp = dist3D(pip, mcp);

  // Tip should be significantly farther from MCP than PIP is
  return tipToMcp > pipToMcp * 1.05;
}

function isThumbExtended(lm) {
  // Thumb: tip (4) should be farther from palm center than IP joint (3)
  // Use 3D palm center for robustness
  const palmX = (lm[0].x + lm[5].x + lm[17].x) / 3;
  const palmY = (lm[0].y + lm[5].y + lm[17].y) / 3;
  const palmZ = ((lm[0].z || 0) + (lm[5].z || 0) + (lm[17].z || 0)) / 3;

  const tipDist = Math.sqrt(
    (lm[4].x - palmX) ** 2 +
    (lm[4].y - palmY) ** 2 +
    ((lm[4].z || 0) - palmZ) ** 2
  );
  const ipDist = Math.sqrt(
    (lm[3].x - palmX) ** 2 +
    (lm[3].y - palmY) ** 2 +
    ((lm[3].z || 0) - palmZ) ** 2
  );
  return tipDist > ipDist * 1.1;
}

function countExtendedFingers(lm) {
  let count = 0;
  if (isThumbExtended(lm)) count++;
  if (isFingerExtended(lm, 8, 6, 5)) count++;    // index (MCP=5)
  if (isFingerExtended(lm, 12, 10, 9)) count++;   // middle (MCP=9)
  if (isFingerExtended(lm, 16, 14, 13)) count++;   // ring (MCP=13)
  if (isFingerExtended(lm, 20, 18, 17)) count++;   // pinky (MCP=17)
  return count;
}

function getPalmSize(lm) {
  // Use 3D distance for more accurate palm size
  const length = dist3D(lm[0], lm[9]);
  const width = dist3D(lm[5], lm[17]);
  return (length + width) / 2;
}

function getPalmCenter(lm) {
  return {
    x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
    y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
  };
}

// ── Gesture hysteresis: require N consistent frames before switching ──
const HYSTERESIS_FRAMES = 3;

function classifyGesture(extendedCount, wasFist) {
  if (extendedCount <= 1) return "fist";
  if (wasFist && extendedCount >= 4) return "reset";
  if (extendedCount >= 3) return "active";
  return "idle";
}

export default function useGestureControls() {
  const gestureRef = useRef({
    type: "idle",          // current gesture
    azimuth: 0,            // horizontal angle (radians)
    polar: Math.PI / 4,    // vertical angle (radians)
    distance: 7,           // camera distance
    // Tracking state
    smoothPalmX: null,
    smoothPalmY: null,
    smoothPalmSize: null,
    wasFist: false,
    resetTriggered: false,
    // Hysteresis state
    pendingGesture: "idle",
    pendingCount: 0,
  });

  const processLandmarks = useCallback((resultsRef) => {
    const g = gestureRef.current;
    const results = resultsRef.current;

    if (!results?.landmarks?.[0]) {
      g.type = "idle";
      g.smoothPalmX = null;
      g.smoothPalmY = null;
      g.smoothPalmSize = null;
      g.pendingGesture = "idle";
      g.pendingCount = 0;
      return;
    }

    const lm = results.landmarks[0];
    const extendedCount = countExtendedFingers(lm);
    const rawPalm = getPalmCenter(lm);
    const rawSize = getPalmSize(lm);

    // ── Classify gesture with hysteresis ─────────────
    const rawGesture = classifyGesture(extendedCount, g.wasFist);

    // Track consecutive frames of the same gesture
    if (rawGesture === g.pendingGesture) {
      g.pendingCount++;
    } else {
      g.pendingGesture = rawGesture;
      g.pendingCount = 1;
    }

    // Only switch gesture type after N consistent frames
    const confirmedGesture =
      g.pendingCount >= HYSTERESIS_FRAMES ? g.pendingGesture : g.type;

    // ── Fist detection ───────────────────────────────
    if (confirmedGesture === "fist") {
      g.type = "fist";
      g.wasFist = true;
      g.smoothPalmX = null;
      g.smoothPalmY = null;
      g.smoothPalmSize = null;
      g.resetTriggered = false;
      return;
    }

    // ── Fist → Open = Reset ─────────────────────────
    if (confirmedGesture === "reset") {
      g.wasFist = false;
      g.resetTriggered = true;
      g.type = "reset";
      g.smoothPalmX = null;
      g.smoothPalmY = null;
      g.smoothPalmSize = null;

      // Reset camera to defaults
      g.azimuth = 0;
      g.polar = Math.PI / 4;
      g.distance = 7;
      return;
    }

    if (g.resetTriggered) {
      g.resetTriggered = false;
    }

    // ── Open hand: Palm Movement = Rotate + Depth Zoom ─────────────
    if (confirmedGesture === "active") {
      g.type = "active";
      g.wasFist = false;

      if (g.smoothPalmX === null || g.smoothPalmY === null || g.smoothPalmSize === null) {
        g.smoothPalmX = rawPalm.x;
        g.smoothPalmY = rawPalm.y;
        g.smoothPalmSize = rawSize;
      } else {
        // Exponential moving average filter — lower alpha = smoother
        const alpha = 0.3;
        const newSmoothX = g.smoothPalmX + (rawPalm.x - g.smoothPalmX) * alpha;
        const newSmoothY = g.smoothPalmY + (rawPalm.y - g.smoothPalmY) * alpha;
        const newSmoothSize = g.smoothPalmSize + (rawSize - g.smoothPalmSize) * alpha;

        // Invert X because camera is mirrored
        const dx = -(newSmoothX - g.smoothPalmX);
        const dy = newSmoothY - g.smoothPalmY;
        const dSize = newSmoothSize - g.smoothPalmSize;

        // 1. Rotation (X/Y movement) — increased dead-zone, tuned sensitivity
        const dist = Math.hypot(dx, dy);
        if (dist > 0.003) {
          g.azimuth += dx * 2.8;
          g.polar = Math.max(0.2, Math.min(Math.PI / 2.1, g.polar + dy * 2.0));
        }

        // 2. Proximity Zoom — increased dead-zone, tuned sensitivity
        if (Math.abs(dSize) > 0.004) {
          g.distance = Math.max(2.8, Math.min(11, g.distance - dSize * 18));
        }

        g.smoothPalmX = newSmoothX;
        g.smoothPalmY = newSmoothY;
        g.smoothPalmSize = newSmoothSize;
      }
      return;
    }

    // Default → idle
    g.type = "idle";
    g.smoothPalmX = null;
    g.smoothPalmY = null;
    g.smoothPalmSize = null;
  }, []);

  return { gestureRef, processLandmarks };
}

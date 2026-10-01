import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const DEFAULT_TARGET = new THREE.Vector3(0, 0.5, 0);

export default function GestureCamera({ gestureRef, resultsRef, processLandmarks, active }) {
  const { camera } = useThree();
  const smoothAzimuth = useRef(0);
  const smoothPolar = useRef(Math.PI / 4);
  const smoothDistance = useRef(7);

  // Velocity tracking for momentum/coasting on release
  const velocityAzimuth = useRef(0);
  const velocityPolar = useRef(0);
  const velocityDistance = useRef(0);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!active) return;

    // 1. Process latest landmarks → update gestureRef
    processLandmarks(resultsRef);

    const g = gestureRef.current;
    const isActive = g.type === "active";

    // ── Differentiated lerp rates per axis ──
    const azimuthLerp = 0.12;    // rotations: responsive
    const polarLerp = 0.10;      // vertical: smoother to prevent jank
    const distanceLerp = 0.08;   // zoom: slowest — prevents jarring depth changes

    if (isActive) {
      // Track velocity while actively controlling
      velocityAzimuth.current = g.azimuth - smoothAzimuth.current;
      velocityPolar.current = g.polar - smoothPolar.current;
      velocityDistance.current = g.distance - smoothDistance.current;

      // Smoothly interpolate toward target values
      smoothAzimuth.current += velocityAzimuth.current * azimuthLerp;
      smoothPolar.current += velocityPolar.current * polarLerp;
      smoothDistance.current += velocityDistance.current * distanceLerp;

      wasActive.current = true;
    } else {
      // ── Velocity damping: coast to a stop instead of snapping ──
      if (wasActive.current) {
        // Scale down velocity so it decays over ~200ms
        const dampFactor = Math.max(0, 1 - delta * 5);

        velocityAzimuth.current *= dampFactor;
        velocityPolar.current *= dampFactor;
        velocityDistance.current *= dampFactor;

        // Apply residual velocity
        smoothAzimuth.current += velocityAzimuth.current * azimuthLerp;
        smoothPolar.current += velocityPolar.current * polarLerp;
        smoothDistance.current += velocityDistance.current * distanceLerp;

        // Clamp polar angle
        smoothPolar.current = Math.max(0.2, Math.min(Math.PI / 2.1, smoothPolar.current));
        smoothDistance.current = Math.max(2.8, Math.min(11, smoothDistance.current));

        // Stop coasting when velocity is negligible
        const totalVel =
          Math.abs(velocityAzimuth.current) +
          Math.abs(velocityPolar.current) +
          Math.abs(velocityDistance.current);
        if (totalVel < 0.0001) {
          wasActive.current = false;
        }
      } else {
        // Normal idle/reset: still lerp toward target for smooth reset
        smoothAzimuth.current += (g.azimuth - smoothAzimuth.current) * azimuthLerp;
        smoothPolar.current += (g.polar - smoothPolar.current) * polarLerp;
        smoothDistance.current += (g.distance - smoothDistance.current) * distanceLerp;
      }
    }

    // 3. Convert spherical → cartesian
    const r = smoothDistance.current;
    const phi = smoothPolar.current;   // vertical angle
    const theta = smoothAzimuth.current; // horizontal angle

    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta) + DEFAULT_TARGET.x,
      r * Math.cos(phi) + DEFAULT_TARGET.y,
      r * Math.sin(phi) * Math.cos(theta) + DEFAULT_TARGET.z
    );

    camera.lookAt(DEFAULT_TARGET);
  });

  return null;
}

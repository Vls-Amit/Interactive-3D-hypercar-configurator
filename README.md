# Interactive 3D Hypercar Configurator

> A browser-based 3D hypercar configurator with real-time hand tracking and gesture-controlled camera interaction.

[![Three.js](https://img.shields.io/badge/Three.js-3D-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Computer%20Vision-4285F4?style=for-the-badge)](https://ai.google.dev/edge/mediapipe/solutions/guide)

---

## Live Demo

### 🚗 [Launch Obsidian Garage](https://vls-amit.github.io/obsidian-garage/)

Explore the car using traditional mouse controls or interact with the 3D scene using real-time hand gestures through your webcam.

> **Note:** Hand-tracking features require webcam permission and a modern browser.

---

## Overview

**Obsidian Garage** is an interactive browser-based 3D automotive experience that combines real-time computer vision with WebGL rendering.

The application presents a detailed hypercar inside a virtual garage and allows users to inspect the vehicle using traditional mouse controls or webcam-based hand gestures.

The project combines:

- Real-time hand tracking
- Gesture recognition
- 3D rendering
- Interactive camera control
- GLB/GLTF model loading
- Dynamic material manipulation
- Responsive web UI
- Browser-based computer vision

The goal was to explore how computer vision can be used as an alternative input mechanism for an interactive 3D web application.

---

# ✨ Features

## 🏎️ Interactive 3D Car Viewer

- Real-time 3D rendering using Three.js
- React-based scene management with React Three Fiber
- GLB model loading
- Interactive camera controls
- Smooth camera transitions
- Detailed automotive materials

## 🖐️ Real-Time Hand Tracking

The application uses **MediaPipe Hand Landmarker** to detect hand landmarks from the user's webcam.

The system tracks hand position and derives interaction parameters from the detected landmarks.

### Supported interactions

| Gesture / Movement | Action |
|---|---|
| Move hand horizontally | Rotate camera horizontally |
| Move hand vertically | Rotate camera vertically |
| Move hand closer | Zoom in |
| Move hand farther away | Zoom out |
| Make a fist | Enter reset state |
| Open hand after fist | Reset camera |

---

## 🎨 Dynamic Car Configuration

The application supports changing the vehicle's body paint while preserving the appearance of other vehicle components.

The renderer distinguishes between different material groups such as:

- Body paint
- Glass
- Wheels
- Lights
- Carbon fiber
- Interior components

This allows the body material to be modified without affecting unrelated parts of the model.

---

## 📷 Webcam HUD

When hand tracking is enabled, the interface provides visual feedback from the webcam including:

- Hand landmarks
- Detected hand state
- Gesture state
- Camera interaction status

This makes the computer-vision pipeline visible to the user instead of treating it as a hidden input system.

---

# 🧠 How It Works

The application can be viewed as four major stages:

```text
              ┌───────────────┐
              │    Webcam     │
              └───────┬───────┘
                      │
                      ▼
            ┌───────────────────┐
            │ MediaPipe Hand    │
            │    Landmarker     │
            └────────┬──────────┘
                     │
                     ▼
            ┌───────────────────┐
            │  Hand Landmarks   │
            │    21 points      │
            └────────┬──────────┘
                     │
                     ▼
            ┌───────────────────┐
            │ Gesture Processing │
            └────────┬──────────┘
                     │
                     ▼
            ┌───────────────────┐
            │ Camera Controller │
            └────────┬──────────┘
                     │
                     ▼
            ┌───────────────────┐
            │   Three.js Scene  │
            └───────────────────┘

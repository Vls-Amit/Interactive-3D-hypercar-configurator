# Interactive 3D Hypercar Configurator

> An interactive 3D hypercar experience built with React, Three.js, React Three Fiber, MediaPipe, and GSAP, featuring real-time hand tracking and gesture-controlled camera interaction.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://vls-amit.github.io/Interactive-3D-hypercar-configurator/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hand%20Tracking-FF6F00)](https://ai.google.dev/edge/mediapipe/solutions/guide)
[![Vite](https://img.shields.io/badge/Vite-Fast%20Builds-646CFF?logo=vite)](https://vite.dev/)

---

## 🚗 Live Demo

**[Launch the Interactive Hypercar Configurator](https://vls-amit.github.io/Interactive-3D-hypercar-configurator/)**

> Allow camera access to experience the gesture-controlled interaction.

---

## 📌 Overview

**Interactive 3D Hypercar Configurator** is a browser-based 3D experience that combines real-time computer vision with interactive WebGL rendering.

The application allows users to explore a detailed 3D hypercar, interact with the camera using hand gestures, change the vehicle's appearance, and control the experience through a webcam.

The project combines:

- 3D rendering
- Real-time hand tracking
- Gesture recognition
- Camera control
- Interactive materials
- Animation
- Computer vision
- Web-based graphics

The goal was to experiment with bringing **natural human interaction into a 3D web environment** without requiring a mouse or keyboard for the primary interaction.

---

## ✨ Features

### 🏎️ Interactive 3D Hypercar

- Real-time 3D vehicle rendering
- Detailed exterior model
- Interactive camera
- Dynamic lighting
- Reflections and shadows
- Post-processing effects
- Smooth camera transitions

### ✋ Real-Time Hand Tracking

The application uses **MediaPipe Hand Landmarker** to detect hand landmarks through the webcam.

The detected hand position is processed in real time and converted into camera interactions.

### 🎮 Gesture-Based Camera Control

Users can interact with the 3D environment using their hand.

| Gesture / Movement | Interaction |
|---|---|
| Move palm | Rotate camera |
| Open hand | Normal interaction |
| Fist | Reset camera |
| Hand movement | Control viewing direction |
| Camera interaction | Explore the vehicle |

The gesture system is designed to make the 3D experience feel more natural and immersive.

### 🎨 Dynamic Vehicle Configuration

The configurator supports changing the vehicle's appearance through interactive controls.

Vehicle materials are updated dynamically without reloading the 3D scene.

### 📷 Webcam HUD

A webcam interface displays:

- Live camera feed
- Detected hand landmarks
- Tracking status
- Gesture interaction feedback

This makes the computer-vision system visible rather than treating it as a hidden background process.

### 🖱️ Fallback Controls

Traditional mouse-based controls are available so the 3D model can still be explored when hand tracking is unavailable.

---

# 🧠 How It Works

The application follows a pipeline:

```text
Webcam
   ↓
MediaPipe Hand Landmarker
   ↓
Hand Landmark Detection
   ↓
Gesture Processing
   ↓
Gesture Interpretation
   ↓
Camera / UI Controls
   ↓
Three.js 3D Scene

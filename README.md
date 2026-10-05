# 🎙️ VoiceAuth — Voice Controller Authentication System

A full-stack, futuristic biometric authentication and voice controller system built with **React**, **Express**, **MongoDB (Mongoose)**, and **JWT (JSON Web Tokens)**.

---

## 🌟 Key Features

### 1. 📝 Biometric Voice Sign-Up
- **Step 1 — Master Credentials**: Account setup with full name, email, and password.
- **Step 2 — Voice Biometric Enrollment**:
  - Live microphone activation via Web Audio API.
  - Interactive pulsing microphone trigger with real-time waveform oscilloscope and frequency spectrum visualizer.
  - Speech-to-text transcription powered by the Web Speech API.
  - Real-time acoustic biometric profile extraction (cadence duration, spectral centroid pitch center, zero-crossing rate, energy RMS).
  - Customizable or recommended security passphrase (*"My voice is my secure key for authentication"*).
  - Issues signed JWT token upon registration with celebratory particle effects.

### 2. 🔐 Voice Controller Login & Authentication
- **Dual Mode Gatekeeper**:
  - **Voice Biometric Login (Primary)**:
    - User provides their email; the system dynamically fetches the enrolled security passphrase hint.
    - User clicks the glowing microphone button and speaks their passphrase.
    - Live audio canvas pulses in sync with the user's voice frequencies.
    - Server verifies phonetic phrase alignment (Levenshtein distance & token overlap) combined with acoustic biometric resonance against enrolled profile.
    - Renders a real-time **Voice Confidence Meter** showing total match percentage, required threshold indicator, and breakdown.
    - Spoken Text-To-Speech (TTS) confirmation (*"Voice verified. Welcome back, [Name]"*).
  - **Password Fallback Mode**:
    - Instant tab switch for traditional email & password credentials verification.

### 3. 🛡️ Protected Voice Controller Dashboard
- **Guarded Session Route**:
  - Accessible only with a valid Bearer JWT token.
- **Voice Command Terminal**:
  - Live microphone controller with continuous or push-to-talk listening.
  - Dispatches voice commands to the Express backend.
  - Spoken audio voice feedback (TTS synthesized voice responses).
  - Supported Voice Commands:
    - `"System status"` — Queries real-time system metrics, database connectivity, and operational flags.
    - `"Activate firewall"` / `"Enable shield"` — Engages defensive security perimeter.
    - `"Deactivate firewall"` — Disengages perimeter shield.
    - `"Toggle stealth mode"` — Toggles stealth protocol.
    - `"Emergency lockdown"` — Heightens clearance security state.
    - `"Purge telemetry"` — Purges session telemetry and biometric cache.
    - `"Lock workstation"` — Instantly locks session and returns to login gatekeeper.
- **Voice Biometric Calibration**:
  - Live threshold slider (adjust sensitivity between 45% and 90%).
  - Passphrase editor to update security phrases.
  - TTS voice response toggle.
- **Security Audit Trail**:
  - Complete tamper-evident log of all authentication events, voice match scores, and executed voice commands with timestamps.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti |
| **Audio & Speech** | Web Speech API (`SpeechRecognition`, `speechSynthesis`), Web Audio API (`AudioContext`, `AnalyserNode`) |
| **Backend** | Node.js, Express 4, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv` |
| **Database** | MongoDB with Mongoose ODM (`User` & `AuditLog` schemas) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/voiceauth`) or a cloud MongoDB Atlas URI.

### 2. Environment Configuration
The backend configuration is located in `server/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/voiceauth
JWT_SECRET=voiceauth_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
```

### 3. Start MongoDB
If using Homebrew on macOS:
```bash
brew services start mongodb/brew/mongodb-community
```
Or start `mongod` manually:
```bash
mongod --config /opt/homebrew/etc/mongod.conf
```

### 4. Run the Application

#### Option A: Run Server & Client Simultaneously
From the root directory:
```bash
# Terminal 1: Start Express Backend
npm run server

# Terminal 2: Start React Client
npm run client
```

#### Option B: Run Individually
```bash
# Backend (Port 5001)
cd server
npm start

# Frontend (Port 3000)
cd client
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🎙️ Testing the Voice Authentication
1. Navigate to **Sign Up** (`http://localhost:3000/signup`).
2. Enter your name, email, and password.
3. On Step 2, click the circular microphone button and speak:  
   *"My voice is my secure key for authentication"*
4. Notice the live oscilloscope audio visualizer and speech transcription. Click again to complete calibration.
5. Click **Complete Enrollment & Enter Dashboard**.
6. In the **Dashboard**, test the Voice Command Terminal by clicking the mic and saying:  
   *"System status"* or *"Activate firewall"*.
7. Test logging out and logging in using the **Voice Biometric Gatekeeper** on the Login screen!

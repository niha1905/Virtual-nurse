
# 🩺 Virtual Nurse AI  
**An Intelligent, Voice-Enabled Healthcare Assistant**

[![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-Backend-lightgrey?logo=flask)](https://flask.palletsprojects.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-ML-orange?logo=tensorflow)](https://www.tensorflow.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-yellow?logo=firebase)](https://firebase.google.com/)
[![Twilio](https://img.shields.io/badge/Twilio-Alerts-red?logo=twilio)](https://www.twilio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> “Making healthcare smarter, safer, and more human.”

---

## 🧠 Overview
**Virtual Nurse AI** is an **AI-powered healthcare companion** designed to monitor patients, detect emergencies, and assist in daily medical routines through an intelligent, voice-driven interface.

It combines **deep learning**, **speech recognition**, **context-aware NLP**, and **IoT integration** to deliver real-time monitoring, fall and cough detection, medication reminders, and emergency alerts — all while keeping data secure and explainable.

---

## ⚙️ Features

✅ **Real-Time Health Monitoring** – Track vitals (SpO₂, heart rate, motion, activity).  
🗣️ **Voice-Based Assistant** – Conversational interaction using NLP & speech recognition.  
🧩 **Fall Detection** – LSTM-based AI model for detecting and alerting sudden falls.  
😷 **Cough Detection** – MobileNet-based model for cough recognition and respiratory pattern analysis.  
📱 **Smart Alerts** – Real-time push notifications, Twilio calls, and Firebase alerts.  
💬 **Explainable AI (XAI)** – Transparent reasoning for every medical decision.  
☁️ **Cloud Sync** – Secure cloud backup via Firebase.  
👨‍⚕️ **Role-Based Dashboards** – Interfaces for patients, doctors, and caregivers.  

---

## 🏗️ System Architecture

```text
Patient Sensors → AI Layer → Explainable Engine → Cloud Sync (Firebase)
            ↓                         ↓
     Voice/NLP Interface ←→ Emergency Escalation System (Twilio, FCM)
````

---

## 🧰 Tech Stack

| Component            | Technology                                       |
| -------------------- | ------------------------------------------------ |
| **Frontend**         | HTML, CSS, JavaScript                            |
| **Backend**          | Flask (Python)                                   |
| **Machine Learning** | TensorFlow, PyTorch                              |
| **Database**         | Firebase Realtime Database                       |
| **APIs & Tools**     | Google Fit API, Twilio, Firebase Cloud Messaging |
| **Deployment**       | Google Cloud Platform                            |

---

## 🧬 Machine Learning Models

| Model                       | Function                 | Dataset          | Accuracy |
| --------------------------- | ------------------------ | ---------------- | -------- |
| **LSTM Model**              | Fall Detection           | KFall Dataset    | 94%      |
| **MobileNetV2**             | Cough Detection          | COUGHVID Dataset | 87%      |
| **CNN (Vitals Classifier)** | Health Anomaly Detection | Custom Dataset   | 90%+     |

🧠 *All models were trained and tested on real-world and open-source datasets for reliability.*

---

## 🩺 Explainability (XAI)

Every AI decision is backed by contextual reasoning:

> “Alert triggered due to heart rate 122 bpm and SpO₂ < 90%.”

* Logs stored in Firebase
* Visualized in Dashboard for doctors
* Clinician-readable explanations improve transparency

---

## 🚨 Emergency Workflow

1️⃣ Detect anomaly (fall, cough, vitals irregularity)
2️⃣ Generate XAI explanation
3️⃣ Push alert via **Firebase Cloud Messaging**
4️⃣ If unacknowledged → **Twilio voice call**
5️⃣ Final step → **SMS fallback to emergency contact**

---

## 📈 Performance Highlights

| Metric              | Value      |
| ------------------- | ---------- |
| Model Latency       | < 1 second |
| Alert Delivery Rate | 99.9%      |
| Detection Accuracy  | 90–94%     |
| Cloud Sync Delay    | ~200ms     |

---

## 💻 Installation Guide

### 🧩 1. Clone Repository

```bash
git clone https://github.com/niha1905/DAIP-PROJECT.git
cd DAIP-PROJECT
```

### 🧩 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 🧩 3. Set up Firebase & Twilio

* Create Firebase project → Get API key & credentials
* Add Twilio account SID, Auth Token, and phone number

### 🧩 4. Run Flask Server

```bash
python app.py
```

### 🧩 5. Access Dashboard

Open browser → [http://localhost:5000](http://localhost:5000)

---

## 🧠 Future Enhancements

* 🌍 Multilingual voice support
* 🧩 Integration with **Gemini AI / Med-PaLM 2**
* 💡 Predictive health analytics
* 📲 Edge optimization for mobile/IoT devices
* 🧬 Federated Learning for privacy-first model training

---

## 🧑‍💻 Contributor

**👩‍💻 Nihaarika S**
Department of Computer Science and Engineering
SRM Institute of Science and Technology, Chennai, India
📧 [ns1490@srmist.edu.in](mailto:ns1490@srmist.edu.in)
🌐 [LinkedIn](https://www.linkedin.com/in/nihaarika-s-23033a259/)

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🩹 Acknowledgements

Special thanks to:

* **Google Fit API**, **Twilio**, and **Firebase** teams
* Open datasets: **KFall**, **COUGHVID**, **Coswara**
* Research from **Nature Medicine**, **npj Digital Medicine**, and **The Lancet Digital Health**


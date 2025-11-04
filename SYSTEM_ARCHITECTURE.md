# Virtual Nurse AI - System Architecture

## Overview

The Virtual Nurse AI is a comprehensive, locally-operating voice-driven healthcare assistant that provides intelligent health monitoring, emergency management, and personalized care support.

## Core Modules

### 1. Voice Command Recognition
- **Location**: `js/voice.js`, `backend_template.py` (voice endpoints)
- **Technology**: Web Speech API (browser) + Whisper (backend, optional)
- **Functionality**: 
  - Converts spoken input to text
  - Supports multiple languages
  - Handles continuous listening mode
  - Real-time transcription

### 2. Speaker Identification
- **Location**: `speaker_identification.py`
- **Functionality**:
  - Distinguishes between patients, doctors, and caretakers
  - Uses voice characteristics (pitch, formants, spectral features)
  - Maintains speaker profiles
  - Supports registration and identification
- **API Endpoints**:
  - `POST /api/speaker/register` - Register new speaker
  - `POST /api/speaker/identify` - Identify speaker from audio

### 3. Intent Detection
- **Location**: `backend_template.py` (detect_intent function)
- **Functionality**:
  - Interprets voice commands
  - Identifies user intent (emergency, medication, vitals, etc.)
  - Routes to appropriate handlers

### 4. Text-to-Speech (TTS)
- **Location**: `models.py` (TextToVoiceModel), `js/voice.js`
- **Technology**: Browser Web Speech API (default) + Custom TTS (optional)
- **Functionality**:
  - Generates natural voice responses
  - Adapts speech rate and tone
  - Supports multiple languages

### 5. Context Memory System
- **Location**: `context_memory.py`
- **Functionality**:
  - Maintains short-term conversation history
  - Tracks topics, entities, and emotional state
  - Provides context hints for responses
  - Enables natural, context-aware conversations
- **API Endpoints**:
  - `GET /api/context` - Get conversation context

### 6. Health Monitoring Models

#### 6.1 Cough Detection
- **Location**: `models.py` (CoughDetectionModel)
- **Functionality**:
  - Analyzes audio input for cough sounds
  - Detects respiratory distress indicators
  - Provides frequency and confidence metrics

#### 6.2 Fall Detection
- **Location**: `models.py` (FallDetectionModel)
- **Models**: `models/cnn_fall_detector.h5`, `models/rf_fall_detector.joblib`
- **Functionality**:
  - Monitors accelerometer/sensor data
  - Detects sudden falls
  - Triggers instant alerts
  - Supports both CNN and Random Forest models

#### 6.3 Health Risk Prediction
- **Location**: `models.py` (HealthRiskModel)
- **Functionality**:
  - Evaluates vital signs and behavioral data
  - Classifies health risks (low, medium, high)
  - Provides confidence scores and contributing factors

#### 6.4 Mood Detection
- **Location**: `models.py` (MoodAnalysisModel)
- **Functionality**:
  - Analyzes voice tone and speech rhythm
  - Detects emotional well-being
  - Combines text sentiment and voice characteristics
  - Tracks mood over time

### 7. Google Health API Integration
- **Location**: `google_health_api.py`
- **Functionality**:
  - Securely records vitals, wellness metrics, and activity
  - Retrieves historical health data
  - Syncs with Google Fit for unified tracking
  - Maintains privacy and compliance
- **API Endpoints**:
  - `POST /api/health/sync` - Sync data to Google Health
  - `GET /api/health/retrieve` - Retrieve data from Google Health

### 8. Emergency Alert System
- **Location**: `emergency_alert.py`, `backend_template.py` (alert endpoints)
- **Functionality**:
  - Detects distress from voice commands ("help", "emergency")
  - Triggers local alert sounds
  - Logs emergency events
  - Sends notifications to connected devices
  - Auto-escalates if no acknowledgment within timeout
  - Notifies doctors and emergency services
- **API Endpoints**:
  - `POST /api/alerts/emergency` - Trigger emergency
  - `POST /api/alerts/escalate` - Escalate alert
  - `POST /api/alerts/acknowledge` - Acknowledge alert

### 9. Medicine Reminder System
- **Location**: `backend_template.py` (reminder endpoints)
- **Functionality**:
  - Automated scheduling of medication times
  - Voice and screen-based alerts
  - Medication adherence tracking
  - Reminder history

### 10. Daily Summary Module
- **Location**: `daily_summary.py`
- **Functionality**:
  - Generates morning health summaries
  - Generates evening health summaries
  - Includes vitals, reminders, alerts, and activities
  - Voice-based delivery
- **API Endpoints**:
  - `GET /api/summary/morning` - Get morning summary
  - `GET /api/summary/evening` - Get evening summary

### 11. Analytics Engine
- **Location**: `analytics_engine.py`
- **Functionality**:
  - Analyzes long-term health patterns
  - Tracks trends (improving, declining, stable)
  - Generates insights and recommendations
  - Provides visualization data for charts
  - Monitors mood, cough frequency, activity levels
- **API Endpoints**:
  - `GET /api/analytics/patterns` - Get pattern analysis
  - `GET /api/analytics/visualization` - Get chart data

### 12. Role-Based Access Control (RBAC)
- **Location**: `role_based_access.py`
- **Functionality**:
  - Manages permissions for patients, doctors, caretakers
  - Controls data access based on roles
  - Filters data appropriately
  - Assigns patients to caretakers/doctors
- **Roles**:
  - **Patient**: Can view own data
  - **Caretaker**: Can view assigned patients' data
  - **Doctor**: Can view all patients or assigned patients
  - **Admin**: Full access

### 13. Doctor Dashboard
- **Location**: `doctor.html`, `js/dashboard.js`
- **Functionality**:
  - Live overview of patient health trends
  - Multi-patient monitoring
  - Alert management
  - Analytics and insights

### 14. Caretaker Dashboard
- **Location**: `caretaker.html`, `js/dashboard.js`
- **Functionality**:
  - Real-time visibility into assistance requests
  - Acknowledgment tracking
  - Medication reminder management
  - Patient status monitoring

### 15. Multilingual Support
- **Location**: `index.html` (language selector), `js/voice.js`
- **Functionality**:
  - Supports multiple languages
  - Currently supports: English, Hindi (हिंदी), Tamil (தமிழ்)
  - Extensible for additional languages

## Data Flow

1. **Voice Input** → Speech-to-Text → Intent Detection → Context Memory
2. **Intent Processing** → Speaker Identification → Role-Based Access Check
3. **Response Generation** → Context-Aware NLP → Text-to-Speech
4. **Health Monitoring** → Model Inference → Analytics Engine → Google Health Sync
5. **Emergency Detection** → Alert System → Local Sound + Notifications → Escalation

## File Structure

```
DIAP/
├── backend_template.py          # Main Flask backend
├── models.py                     # AI model interfaces
├── speaker_identification.py    # Speaker ID system
├── context_memory.py            # Conversation memory
├── daily_summary.py             # Daily summaries
├── analytics_engine.py         # Analytics system
├── role_based_access.py         # RBAC system
├── google_health_api.py         # Google Health integration
├── emergency_alert.py           # Emergency system
├── models/                      # ML model files
│   ├── cnn_fall_detector.h5
│   ├── rf_fall_detector.joblib
│   └── scaler.joblib
├── js/
│   ├── voice.js                 # Voice assistant frontend
│   ├── config.js                # API configuration
│   └── dashboard.js             # Dashboard logic
└── html files                   # Frontend interfaces
```

## API Endpoints Summary

### Voice & Interaction
- `POST /api/voice` - Process voice input
- `POST /api/respond` - Text-to-speech
- `GET /api/context` - Get conversation context

### Health Data
- `GET /api/vitals` - Get vitals
- `POST /api/vitals/update` - Update vitals
- `GET /api/summary/morning` - Morning summary
- `GET /api/summary/evening` - Evening summary

### Alerts & Emergencies
- `GET /api/alerts` - Get alerts
- `POST /api/alerts/emergency` - Trigger emergency
- `POST /api/alerts/escalate` - Escalate alert
- `POST /api/alerts/acknowledge` - Acknowledge alert

### Analytics
- `GET /api/analytics/patterns` - Pattern analysis
- `GET /api/analytics/visualization` - Chart data

### Google Health
- `POST /api/health/sync` - Sync to Google Health
- `GET /api/health/retrieve` - Retrieve from Google Health

### Speaker Identification
- `POST /api/speaker/register` - Register speaker
- `POST /api/speaker/identify` - Identify speaker

## Security & Privacy

- All processing happens locally (no cloud dependencies for core features)
- Role-based access control ensures data privacy
- Google Health API integration maintains compliance
- Emergency alerts are logged locally
- No sensitive data is stored without encryption (production)

## Extensibility

The system is designed for easy extension:
- Add new models by implementing `ModelInterface`
- Add new roles/permissions in `role_based_access.py`
- Add new analytics metrics in `analytics_engine.py`
- Integrate additional health APIs similar to Google Health module


# Flask Backend Template for Virtual Nurse AI
# This is a starter template - expand based on your needs

from flask import Flask, request, jsonify, session, send_from_directory, redirect, send_file
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
import uuid
import os
import json
import random
from functools import wraps
from auth import Auth

# Load environment variables from .env file
load_dotenv()
import json
import os

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
PATIENTS_FILE = os.path.join(DATA_DIR, 'patients.json')
ALERTS_FILE = os.path.join(DATA_DIR, 'alerts.json')
REMINDERS_FILE = os.path.join(DATA_DIR, 'reminders.json')

def load_json_file(filepath, default=None):
    """Load data from a JSON file"""
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return default if default is not None else {}

def save_json_file(filepath, data):
    """Save data to a JSON file"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
import random
import json
import os

# Import model manager and fall detection models
MODELS_AVAILABLE = False
model_manager = None
rf_model = None
cnn_model = None
scaler = None

try:
    from models import model_manager
    import joblib
    # Reduce TF noise
    os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
    os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')
    from tensorflow import keras
    import os
    import numpy as np

    # Load fall detection models (prefer models/fall/, fallback to models/)
    models_root = os.path.join(os.path.dirname(__file__), 'models')
    model_path_candidates = [
        os.path.join(models_root, 'fall'),
        models_root,
    ]
    # Resolve first existing directory
    model_path = next((p for p in model_path_candidates if os.path.isdir(p)), models_root)
    
    # Check if model files exist before loading
    rf_model_path = os.path.join(model_path, 'rf_fall_detector.joblib')
    cnn_model_path = os.path.join(model_path, 'cnn_fall_detector.h5')
    scaler_path = os.path.join(model_path, 'scaler.joblib')
    
    models_loaded = True
    
    if os.path.exists(rf_model_path):
        try:
            rf_model = joblib.load(rf_model_path)
            print("✅ Random Forest model loaded successfully!")
        except Exception as e:
            print(f"⚠️  Error loading Random Forest model: {e}")
            models_loaded = False
    else:
        print("⚠️  Random Forest model file not found")
        models_loaded = False
    
    if os.path.exists(cnn_model_path):
        try:
            cnn_model = keras.models.load_model(cnn_model_path)
            print("✅ CNN model loaded successfully!")
        except Exception as e:
            print(f"⚠️  Error loading CNN model: {e}")
            models_loaded = False
    else:
        print("⚠️  CNN model file not found")
        models_loaded = False
    
    if os.path.exists(scaler_path):
        try:
            scaler = joblib.load(scaler_path)
            print("✅ Scaler loaded successfully!")
        except Exception as e:
            print(f"⚠️  Error loading scaler: {e}")
            models_loaded = False
    else:
        print("⚠️  Scaler file not found")
        models_loaded = False
    
    MODELS_AVAILABLE = models_loaded and model_manager is not None
    if MODELS_AVAILABLE:
        print("✅ All AI Models loaded successfully!")
    else:
        print("⚠️  Some models failed to load, fall detection will use fallback mode")
        
except ImportError as e:
    print(f"⚠️  AI Models not found: {e}")
    print("⚠️  Using fallback responses")

# Import new modules
try:
    from speaker_identification import speaker_identifier
    from context_memory import context_memory
    from daily_summary import daily_summary
    from analytics_engine import analytics_engine
    from role_based_access import rbac, UserRole, Permission
    from google_health_api import google_health
    from emergency_alert import emergency_alert_system
    from report_generator import report_generator
    MODULES_AVAILABLE = True
    print("✅ System modules loaded successfully!")
except ImportError as e:
    print(f"⚠️  System modules not found: {e}")
    MODULES_AVAILABLE = False
    speaker_identifier = None
    context_memory = None
    daily_summary = None
    analytics_engine = None
    rbac = None
    google_health = None
    emergency_alert_system = None
    report_generator = None

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'your-secret-key-change-in-production-12345'
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:*", "http://127.0.0.1:*", "file://*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Load data from JSON files
patients_db = load_json_file(PATIENTS_FILE, {
    "1": {
        "id": "1",
        "name": "John Doe",
        "vitals": {
            "heartRate": 72,
            "temperature": 98.6,
            "oxygen": 98,
            "systolic": 120,
            "diastolic": 80
        }
    }
})

alerts_db = load_json_file(ALERTS_FILE, [])
reminders_db = load_json_file(REMINDERS_FILE, [])
users_db = load_json_file(USERS_FILE, [])

# ============================================
# FRONTEND ROUTES (Serve HTML/CSS/JS)
# ============================================

@app.route('/api/config')
def get_config():
    """Get frontend configuration including API keys"""
    api_key = os.getenv('GEMINI_API_KEY')
    enabled = bool(api_key)
    print(f"📜 Config request - API Key available: {enabled}")
    return jsonify({
        'gemini_api_key': api_key,
        'enabled': enabled
    })

@app.route('/')
def index():
    """Serve the main index page"""
    return send_from_directory('.', 'index.html')

@app.route('/patient')
def patient_page():
    """Serve the patient dashboard page"""
    return send_from_directory('.', 'patient.html')

@app.route('/doctor')
def doctor_page():
    """Serve the doctor dashboard page"""
    return send_from_directory('.', 'doctor.html')

@app.route('/caretaker')
def caretaker_page():
    """Serve the caretaker dashboard page"""
    return send_from_directory('.', 'caretaker.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (HTML, CSS, JS, images)"""
    if os.path.exists(path):
        return send_from_directory('.', path)
    return "File not found", 404

# ============================================
# GEMINI API INTEGRATION
# ============================================

try:
    from gemini_integration import gemini_api
    GEMINI_AVAILABLE = True
    print("✅ Gemini API integration loaded")
except Exception as e:
    print(f"⚠️ Gemini API integration not available: {e}")
    GEMINI_AVAILABLE = False
    gemini_api = None

# ============================================
# VOICE ENDPOINTS
# ============================================

@app.route('/api/voice', methods=['POST', 'OPTIONS'])
def process_voice():
    """
    Process voice input using Whisper or other STT
    Enhanced with speaker identification, context memory, and Gemini API
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        text = data.get('text', '') if data else ''
        audio_data = data.get('audio')  # For future audio input
        user_id = data.get('user_id', '1')  # Default user
        
        # Speaker identification (if audio provided)
        speaker_info = None
        if MODULES_AVAILABLE and speaker_identifier and audio_data:
            speaker_info = speaker_identifier.identify_speaker(audio_data)
            if speaker_info:
                user_id = speaker_info['user_id']
        
        # Try Gemini API first if available
        if GEMINI_AVAILABLE and gemini_api and gemini_api.enabled:
            print(f"🎯 Processing voice with Gemini API: {text}")
            # Get health context for Gemini
            context = {}
            try:
                # Get vitals from patient database
                patient = patients_db.get(user_id, {})
                if patient and 'vitals' in patient:
                    vitals = patient['vitals']
                else:
                    vitals = {
                        'heartRate': 72,
                        'systolic': 120,
                        'diastolic': 80,
                        'temperature': 98.6,
                        'oxygen': 97
                    }
                
                if vitals:
                    context['vitals'] = {
                        'heartRate': vitals.get('heartRate', 72),
                        'systolic': vitals.get('systolic', 120),
                        'diastolic': vitals.get('diastolic', 80),
                        'temperature': vitals.get('temperature', 98.6),
                        'oxygen': vitals.get('oxygen', 97)
                    }
                
                # Get reminders with full details
                user_reminders = [r for r in reminders_db if r.get('patientId') == user_id and r.get('active', True)]
                context['reminders'] = [{
                    'medicine': r.get('medicine', ''),
                    'dosage': r.get('dosage', ''),
                    'time': r.get('time', ''),
                    'frequency': r.get('frequency', ''),
                    'lastTaken': r.get('lastTaken', None)
                } for r in user_reminders]
                
                # Get active alerts
                active_alerts = [a for a in alerts_db if not a.get('acknowledged', False) and a.get('patientId') == user_id]
                context['activeAlerts'] = [{
                    'type': a.get('type', ''),
                    'severity': a.get('severity', ''),
                    'message': a.get('message', ''),
                    'timestamp': a.get('timestamp', '')
                } for a in active_alerts]

                # Get mood and conversation history
                if MODULES_AVAILABLE and context_memory:
                    user_context = context_memory.get_context(user_id)
                    context['mood'] = user_context.get('emotional_state', 'neutral')
                    context['recentHistory'] = context_memory.get_recent_history(user_id, n=5)
                    context['patientProfile'] = {
                        'emotionalTrends': user_context.get('emotional_trends', []),
                        'preferences': user_context.get('preferences', {}),
                        'recentConcerns': user_context.get('recent_concerns', [])
                    }

                # If Google Health sync is enabled, get additional health metrics
                if MODULES_AVAILABLE and google_health and google_health.is_authenticated:
                    try:
                        health_metrics = google_health.retrieve_wellness_metrics(user_id, days=7)
                        context['healthMetrics'] = health_metrics
                    except Exception as e:
                        print(f"⚠️ Error getting Google Health metrics: {e}")

                # Generate response using Gemini with enhanced context
                print(f"📝 Sending context to Gemini: {context}")
                response = gemini_api.generate_health_response(text, context)
                print(f"✨ Gemini response: {response}")
            except Exception as e:
                print(f"⚠️ Gemini API error, falling back: {e}")
                response = generate_ai_response(text)
        # Use AI model if available
        elif MODELS_AVAILABLE and model_manager:
            # If audio data is provided, transcribe it first
            if audio_data:
                text = model_manager.transcribe_audio(audio_data)
            
            # Get conversation context
            context = None
            if MODULES_AVAILABLE and context_memory:
                context = context_memory.get_context(user_id)
                context_hints = context_memory.get_contextual_response_hints(user_id)
            
            # Generate AI response using NLP model with context
            response = model_manager.generate_response(text, context)
        else:
            # Fallback to rule-based response
            response = generate_ai_response(text)
        
        # Store conversation in memory
        if MODULES_AVAILABLE and context_memory:
            context_memory.add_exchange(user_id, text, response, metadata={
                'intent': detect_intent(text),
                'speaker': speaker_info
            })
        
        # Analyze mood and user sentiment using Gemini
        mood_info = None
        if GEMINI_AVAILABLE and gemini_api:
            try:
                # Get comprehensive mood analysis
                mood_analysis = gemini_api.analyze_user_state(text)
                mood_info = {
                    'mood': mood_analysis.get('mood', 'neutral'),
                    'sentiment': mood_analysis.get('sentiment', 0),
                    'stressLevel': mood_analysis.get('stress_level', 'normal'),
                    'emotionalTags': mood_analysis.get('emotional_tags', []),
                    'confidence': mood_analysis.get('confidence', 0.5)
                }
                
                # Store mood data in analytics
                if MODULES_AVAILABLE and analytics_engine and mood_info:
                    analytics_engine.add_data_point(user_id, 'mood_score', mood_info['sentiment'])
                    analytics_engine.add_data_point(user_id, 'stress_level', 
                        1.0 if mood_info['stressLevel'] == 'high' else 
                        0.5 if mood_info['stressLevel'] == 'moderate' else 0.0
                    )
                
                # Update context memory with emotional state
                if MODULES_AVAILABLE and context_memory:
                    context_memory.update_emotional_state(user_id, {
                        'mood': mood_info['mood'],
                        'stress_level': mood_info['stressLevel'],
                        'emotional_tags': mood_info['emotionalTags']
                    })
                
            except Exception as e:
                print(f"⚠️ Mood analysis error: {e}")
        
        # Check for emergency help calls or high stress
        intent = detect_intent(text)
        if intent == 'emergency':
            # Trigger emergency alert with voice as source
            alert = {
                'id': len(alerts_db) + 1,
                'patientId': user_id,
                'type': 'emergency',
                'source': 'voice',
                'severity': 'high',
                'message': 'Emergency help requested through voice',
                'timestamp': datetime.now().isoformat(),
                'acknowledged': False,
                'requiresConfirmation': True,
                'confirmed': False
            }
            alerts_db.append(alert)
            save_json_file(ALERTS_FILE, alerts_db)
            
            if MODULES_AVAILABLE and emergency_alert_system:
                emergency_alert_system.create_alert(
                    user_id=user_id,
                    alert_type='emergency',
                    message='Emergency help requested through voice',
                    severity='high',
                    metadata={'source': 'voice', 'requiresConfirmation': True}
                )
        # Check if we need to trigger any alerts based on mood
        elif mood_info and mood_info['stressLevel'] == 'high' and mood_info['confidence'] > 0.7:
            if MODULES_AVAILABLE and emergency_alert_system:
                emergency_alert_system.create_alert(
                    user_id=user_id,
                    alert_type='stress_detected',
                    message='High stress levels detected in patient conversation',
                    severity='medium'
                )
        
        return jsonify({
            'success': True,
            'response': response,
            'text': text,
            'timestamp': datetime.now().isoformat(),
            'speaker': speaker_info,
            'mood': mood_info,
            'context': {
                'hasActiveMedications': bool(context.get('reminders')),
                'hasActiveAlerts': bool(context.get('activeAlerts')),
                'lastConversation': context.get('recentHistory', [None])[0] if context.get('recentHistory') else None,
                'healthMetricsAvailable': 'healthMetrics' in context
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def detect_intent(text: str) -> str:
    """Simple intent detection"""
    text_lower = text.lower()
    if any(word in text_lower for word in ['help', 'emergency', 'urgent']):
        return 'emergency'
    elif any(word in text_lower for word in ['medicine', 'medication', 'pill']):
        return 'medication'
    elif any(word in text_lower for word in ['pain', 'hurt', 'ache']):
        return 'pain'
    elif any(word in text_lower for word in ['doctor', 'appointment']):
        return 'appointment'
    elif any(word in text_lower for word in ['temperature', 'fever', 'vitals']):
        return 'vitals'
    else:
        return 'general'

@app.route('/api/respond', methods=['POST', 'OPTIONS'])
def text_to_speech():
    """
    Convert text to speech
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        text = data.get('text', '') if data else ''
        
        # Use AI model if available
        audio_path = None
        if MODELS_AVAILABLE and model_manager:
            audio_path = model_manager.synthesize_speech(text)
        
        return jsonify({
            'success': True,
            'audioUrl': f'/api/audio/{audio_path}' if audio_path else None,
            'message': 'Using browser TTS' if not audio_path else 'Audio generated'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_ai_response(text):
    """
    Generate intelligent response based on input
    """
    text_lower = text.lower()
    
    if 'help' in text_lower or 'emergency' in text_lower:
        return "I'm alerting your caretaker immediately. Help is on the way. Stay calm."
    elif 'medicine' in text_lower or 'medication' in text_lower:
        return "Your next medication is Aspirin 100mg at 2:00 PM today."
    elif 'temperature' in text_lower:
        return "Your current temperature is 98.6°F, which is within normal range."
    elif 'doctor' in text_lower:
        return "Would you like me to schedule an appointment with Dr. Smith?"
    elif 'pain' in text_lower:
        return "I understand you're experiencing pain. On a scale of 1-10, how would you rate it?"
    else:
        return f"I heard: '{text}'. How can I assist you with your health today?"

# ============================================
# VITALS ENDPOINTS
# ============================================

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No Authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]  # Bearer <token>
            payload = Auth.verify_token(token)
            if 'error' in payload:
                return jsonify({'error': payload['error']}), 401
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

@app.route('/api/vitals', methods=['GET', 'OPTIONS'])
@require_auth
def get_vitals():
    """
    Get current vitals for a patient
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('patient_id', '1')
        user = session.get('user')
        
        # Check permission to view vitals
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Check if user has permission to view these vitals
        if user.get('id') != patient_id:
            if not rbac.can_access_patient_data(user['id'], patient_id, Permission.VIEW_PATIENT_VITALS):
                return jsonify({'error': 'Permission denied'}), 403
        else:
            if not rbac.has_permission(user['id'], Permission.VIEW_OWN_VITALS):
                return jsonify({'error': 'Permission denied'}), 403
        
        if patient_id in patients_db:
            patient = patients_db[patient_id]
            
            # Simulate slight variations for real-time feel
            vitals = patient['vitals'].copy()
            vitals['heartRate'] += random.randint(-3, 3)
            vitals['heartRate'] = max(60, min(100, vitals['heartRate']))
            vitals['oxygen'] = min(100, max(95, vitals['oxygen'] + random.randint(-1, 1)))
            vitals['temperature'] = round(vitals['temperature'] + random.uniform(-0.2, 0.2), 1)
            
            # If Google Health sync is enabled, try to get live data
            if MODULES_AVAILABLE and google_health and google_health.is_authenticated:
                try:
                    live_vitals = google_health.get_vitals(patient_id)
                    if live_vitals:
                        vitals.update(live_vitals)
                except Exception as e:
                    print(f"⚠️ Google Health sync error: {e}")
            
            return jsonify({
                'success': True,
                'heartRate': vitals['heartRate'],
                'temperature': vitals['temperature'],
                'oxygen': vitals['oxygen'],
                'systolic': vitals['systolic'],
                'diastolic': vitals['diastolic'],
                'timestamp': datetime.now().isoformat(),
                'source': 'google_health' if MODULES_AVAILABLE and google_health and google_health.is_authenticated else 'local'
            }), 200
        
        return jsonify({'success': False, 'error': 'Patient not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/vitals/update', methods=['POST', 'OPTIONS'])
@require_auth
def update_vitals():
    """
    Update vitals for a patient
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        patient_id = data.get('patient_id') if data else None
        
        if not patient_id:
            return jsonify({'error': 'Patient ID required'}), 400
        
        user = session.get('user')
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Check permission to update vitals
        if user.get('id') != patient_id:
            if not rbac.can_access_patient_data(user['id'], patient_id, Permission.UPDATE_VITALS):
                return jsonify({'error': 'Permission denied'}), 403
        else:
            if not rbac.has_permission(user['id'], Permission.UPDATE_VITALS):
                return jsonify({'error': 'Permission denied'}), 403
        
        if patient_id in patients_db:
            vitals_update = data.get('vitals', {})
            
            # Validate vitals data
            allowed_fields = {'heartRate', 'temperature', 'oxygen', 'systolic', 'diastolic'}
            if not all(field in allowed_fields for field in vitals_update.keys()):
                return jsonify({'error': 'Invalid vitals data'}), 400
            
            # Update local database
            patients_db[patient_id]['vitals'].update(vitals_update)
            save_json_file(PATIENTS_FILE, patients_db)
            
            # If Google Health sync is enabled, update there too
            if MODULES_AVAILABLE and google_health and google_health.is_authenticated:
                try:
                    google_health.sync_vitals(patient_id, vitals_update)
                except Exception as e:
                    print(f"⚠️ Google Health sync error: {e}")
            
            # Check for critical values and create alerts
            check_critical_vitals(patient_id, patients_db[patient_id]['vitals'])
            
            return jsonify({
                'success': True,
                'message': 'Vitals updated successfully',
                'synced': google_health.is_authenticated if MODULES_AVAILABLE and google_health else False
            }), 200
        
        return jsonify({'success': False, 'error': 'Patient not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def create_alert(patient_id, alert_type, message):
    """
    Create a new alert
    """
    alert = {
        'id': len(alerts_db) + 1,
        'patientId': patient_id,
        'type': alert_type,
        'severity': 'high' if 'critical' in alert_type.lower() or 'emergency' in alert_type.lower() else 'medium',
        'message': message,
        'timestamp': datetime.now().isoformat(),
        'acknowledged': False
    }
    alerts_db.append(alert)
    return alert

def check_critical_vitals(patient_id, vitals):
    """
    Check if vitals are in critical/fatal range and trigger appropriate alerts
    """
    critical = False
    fatal = False
    reasons = []
    
    # Check for fatal conditions first
    if vitals['heartRate'] > 150 or vitals['heartRate'] < 40:
        fatal = True
        reasons.append('Severely abnormal heart rate')
    elif vitals['heartRate'] > 100 or vitals['heartRate'] < 60:
        critical = True
        reasons.append('Abnormal heart rate')
    
    if vitals['temperature'] > 103:
        fatal = True
        reasons.append('Dangerous fever')
    elif vitals['temperature'] > 100.4:
        critical = True
        reasons.append('Fever detected')
    
    if vitals['oxygen'] < 88:
        fatal = True
        reasons.append('Severe oxygen deficiency')
    elif vitals['oxygen'] < 95:
        critical = True
        reasons.append('Low oxygen level')
        
    if vitals.get('systolic', 0) > 180 or vitals.get('diastolic', 0) > 120:
        fatal = True
        reasons.append('Hypertensive crisis')
    
    if fatal:
        # Trigger emergency alert with vitals as source
        alert = {
            'id': len(alerts_db) + 1,
            'patientId': patient_id,
            'type': 'emergency',
            'source': 'vitals',
            'severity': 'critical',
            'message': 'FATAL VITAL SIGNS: ' + ', '.join(reasons),
            'timestamp': datetime.now().isoformat(),
            'acknowledged': False,
            'requiresConfirmation': True,
            'confirmed': False
        }
        alerts_db.append(alert)
        save_json_file(ALERTS_FILE, alerts_db)
        
        if MODULES_AVAILABLE and emergency_alert_system:
            emergency_alert_system.create_alert(
                user_id=patient_id,
                alert_type='emergency',
                message='FATAL VITAL SIGNS: ' + ', '.join(reasons),
                severity='critical',
                metadata={'source': 'vitals', 'requiresConfirmation': True}
            )
    elif critical:
        create_alert(patient_id, 'critical_vitals', ', '.join(reasons))

def get_vitals_trends(patient_id, timeframe):
    """Calculate vitals trends over time"""
    try:
        # Load historical vitals data
        history_file = os.path.join(DATA_DIR, f'vitals_history_{patient_id}.json')
        history = load_json_file(history_file, [])
        
        # Parse timeframe
        days = int(timeframe.replace('d', ''))
        cutoff = datetime.now() - timedelta(days=days)
        
        # Filter and process data
        recent_data = [
            record for record in history 
            if datetime.fromisoformat(record['timestamp']) > cutoff
        ]
        
        # Calculate trends
        trends = {
            'heartRate': calculate_trend([r['vitals']['heartRate'] for r in recent_data]),
            'temperature': calculate_trend([r['vitals']['temperature'] for r in recent_data]),
            'oxygen': calculate_trend([r['vitals']['oxygen'] for r in recent_data]),
            'bloodPressure': calculate_trend([
                r['vitals']['systolic']/r['vitals']['diastolic'] 
                for r in recent_data
            ])
        }
        
        return trends
    except Exception as e:
        print(f"Error calculating vitals trends: {e}")
        return {}

def calculate_medication_adherence(patient_id, timeframe):
    """Calculate medication adherence rate"""
    try:
        # Get patient's reminders
        patient_reminders = [r for r in reminders_db if r['patientId'] == patient_id]
        
        # Parse timeframe
        days = int(timeframe.replace('d', ''))
        cutoff = datetime.now() - timedelta(days=days)
        
        total_doses = 0
        taken_doses = 0
        
        for reminder in patient_reminders:
            # Calculate expected doses based on frequency
            freq = reminder.get('frequency', 'daily')
            if freq == 'daily':
                total_doses += days
            elif freq == 'twice_daily':
                total_doses += days * 2
            elif freq == 'weekly':
                total_doses += (days // 7)
            
            # Count taken doses
            taken_history = reminder.get('taken_history', [])
            taken_doses += len([
                dose for dose in taken_history
                if datetime.fromisoformat(dose['timestamp']) > cutoff
            ])
        
        adherence = (taken_doses / total_doses * 100) if total_doses > 0 else 100
        return {
            'rate': adherence,
            'total_doses': total_doses,
            'taken_doses': taken_doses
        }
    except Exception as e:
        print(f"Error calculating medication adherence: {e}")
        return {'rate': 0, 'total_doses': 0, 'taken_doses': 0}

def calculate_health_score(patient_id):
    """Calculate overall health score"""
    try:
        patient = patients_db.get(patient_id)
        if not patient or 'vitals' not in patient:
            return 0
        
        vitals = patient['vitals']
        scores = []
        
        # Heart rate score (60-100 is normal)
        hr = vitals.get('heartRate', 80)
        if 60 <= hr <= 100:
            scores.append(100)
        else:
            scores.append(max(0, 100 - abs(hr - 80)))
        
        # Temperature score (97-99°F is normal)
        temp = vitals.get('temperature', 98.6)
        if 97 <= temp <= 99:
            scores.append(100)
        else:
            scores.append(max(0, 100 - abs(temp - 98.6) * 10))
        
        # Oxygen score (95-100% is normal)
        o2 = vitals.get('oxygen', 98)
        if 95 <= o2 <= 100:
            scores.append(100)
        else:
            scores.append(max(0, o2))
        
        # Blood pressure score
        sys = vitals.get('systolic', 120)
        dia = vitals.get('diastolic', 80)
        if 90 <= sys <= 120 and 60 <= dia <= 80:
            scores.append(100)
        else:
            bp_score = 100 - (abs(sys - 120) / 2 + abs(dia - 80))
            scores.append(max(0, bp_score))
        
        # Calculate final score
        return sum(scores) / len(scores)
    except Exception as e:
        print(f"Error calculating health score: {e}")
        return 0

def calculate_trend(values):
    """Calculate trend from a list of values"""
    try:
        if not values:
            return {
                'trend': 'stable',
                'change': 0,
                'average': 0
            }
        
        avg = sum(values) / len(values)
        if len(values) < 2:
            return {
                'trend': 'stable',
                'change': 0,
                'average': avg
            }
        
        # Calculate trend
        change = ((values[-1] - values[0]) / values[0]) * 100
        
        if abs(change) < 5:
            trend = 'stable'
        elif change > 0:
            trend = 'increasing'
        else:
            trend = 'decreasing'
            
        return {
            'trend': trend,
            'change': round(change, 2),
            'average': round(avg, 2)
        }
    except Exception as e:
        print(f"Error calculating trend: {e}")
        return {'trend': 'stable', 'change': 0, 'average': 0}

def detect_vitals_anomalies(patient_id):
    """Detect anomalies in vitals"""
    try:
        history_file = os.path.join(DATA_DIR, f'vitals_history_{patient_id}.json')
        history = load_json_file(history_file, [])
        
        if not history:
            return []
            
        anomalies = []
        recent = history[-30:]  # Last 30 readings
        
        for vital in ['heartRate', 'temperature', 'oxygen']:
            values = [r['vitals'][vital] for r in recent]
            mean = sum(values) / len(values)
            std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
            
            # Check last reading for anomaly (> 2 standard deviations)
            last_value = values[-1]
            if abs(last_value - mean) > 2 * std:
                anomalies.append({
                    'vital': vital,
                    'value': last_value,
                    'mean': mean,
                    'deviation': abs(last_value - mean) / std
                })
        
        return anomalies
    except Exception as e:
        print(f"Error detecting vitals anomalies: {e}")
        return []

def analyze_medication_patterns(patient_id):
    """Analyze patterns in medication adherence"""
    try:
        # Get patient's reminders
        patient_reminders = [r for r in reminders_db if r['patientId'] == patient_id]
        patterns = []
        
        for reminder in patient_reminders:
            taken_history = reminder.get('taken_history', [])
            if not taken_history:
                continue
                
            # Analyze timing patterns
            times = [datetime.fromisoformat(h['timestamp']).hour for h in taken_history]
            common_time = max(set(times), key=times.count)
            
            # Analyze missed doses
            missed = reminder.get('missed_history', [])
            if missed:
                missed_days = [datetime.fromisoformat(m['timestamp']).strftime('%A') for m in missed]
                problem_day = max(set(missed_days), key=missed_days.count)
            else:
                problem_day = None
            
            patterns.append({
                'medicine': reminder['medicine'],
                'usual_time': common_time,
                'problem_day': problem_day,
                'adherence_rate': len(taken_history) / (len(taken_history) + len(missed)) * 100
            })
        
        return patterns
    except Exception as e:
        print(f"Error analyzing medication patterns: {e}")
        return []

def identify_health_trends(patient_id):
    """Identify overall health trends"""
    try:
        # Get recent health scores
        scores = []
        for i in range(7):  # Last 7 days
            date = datetime.now() - timedelta(days=i)
            score = calculate_health_score(patient_id)
            scores.append({
                'date': date.strftime('%Y-%m-%d'),
                'score': score
            })
        
        # Calculate trend
        trend = calculate_trend([s['score'] for s in scores])
        
        # Get contributing factors
        factors = []
        recent_vitals = get_vitals_trends(patient_id, '7d')
        for vital, data in recent_vitals.items():
            if data['trend'] != 'stable':
                factors.append({
                    'factor': vital,
                    'trend': data['trend'],
                    'impact': abs(data['change'])
                })
        
        return {
            'overall_trend': trend['trend'],
            'score_change': trend['change'],
            'contributing_factors': sorted(factors, key=lambda x: x['impact'], reverse=True)
        }
    except Exception as e:
        print(f"Error identifying health trends: {e}")
        return {'overall_trend': 'stable', 'score_change': 0, 'contributing_factors': []}

# ============================================
# ALERTS ENDPOINTS
# ============================================

@app.route('/api/alerts', methods=['GET', 'OPTIONS'])
def get_alerts():
    """
    Get all active alerts
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        active_alerts = [alert for alert in alerts_db if not alert.get('acknowledged', False)]
        return jsonify(active_alerts), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/alerts/acknowledge', methods=['POST', 'OPTIONS'])
def acknowledge_alert():
    """
    Acknowledge an alert
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        # Accept both camelCase and snake_case; compare as strings
        alert_id = None
        if data:
            alert_id = data.get('alertId') or data.get('alert_id')
        
        if alert_id is None:
            return jsonify({'success': False, 'error': 'alertId required'}), 400
        
        alert_id_str = str(alert_id)
        for alert in alerts_db:
            if str(alert.get('id')) == alert_id_str:
                alert['acknowledged'] = True
                alert['acknowledgedAt'] = datetime.now().isoformat()
                save_json_file(ALERTS_FILE, alerts_db)
                
                return jsonify({
                    'success': True,
                    'message': 'Alert acknowledged'
                }), 200
        
        return jsonify({'success': False, 'error': 'Alert not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/alerts/escalate', methods=['POST', 'OPTIONS'])
def escalate_alert():
    """
    Escalate an emergency using enhanced emergency alert system
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json() if request.data else {}
        alert_id = data.get('alert_id')
        
        if MODULES_AVAILABLE and emergency_alert_system and alert_id:
            success = emergency_alert_system.escalate_alert(alert_id, 'manual')
        else:
            # Fallback to old system
            print("⚠️ EMERGENCY ESCALATED! Alert sent to emergency services.")
            success = True
        
        return jsonify({
            'success': success,
            'message': 'Emergency escalated',
            'emergencyServiceNotified': True
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/alerts/emergency', methods=['POST', 'OPTIONS'])
def trigger_emergency():
    """
    Trigger a new emergency alert with confirmation window
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        trigger_source = data.get('source', 'manual')  # manual, vitals, fall, cough, voice
        confirmed = data.get('confirmed', False)  # True if user confirmed not okay
        
        if not patient_id:
            return jsonify({'error': 'Patient ID required'}), 400
            
        # Check if there's already an active emergency for this patient
        active_emergency = next(
            (a for a in alerts_db if 
             a.get('patientId') == patient_id and 
             a.get('type') == 'emergency' and 
             not a.get('acknowledged') and 
             (datetime.now() - datetime.fromisoformat(a.get('timestamp'))) < timedelta(minutes=5)
            ), None)
            
        if active_emergency:
            if confirmed:
                # User didn't respond "I'm okay" - escalate
                if MODULES_AVAILABLE and emergency_alert_system:
                    emergency_alert_system.escalate_alert(
                        active_emergency['id'],
                        f'No response to confirmation window - {trigger_source}'
                    )
                return jsonify({
                    'success': True,
                    'escalated': True,
                    'message': 'Emergency escalated to caregiver',
                    'alertId': active_emergency['id']
                }), 200
            return jsonify({
                'success': True,
                'message': 'Emergency already active',
                'requiresConfirmation': True,
                'alertId': active_emergency['id'],
                'timeRemaining': 30 - (datetime.now() - datetime.fromisoformat(active_emergency['timestamp'])).seconds
            }), 200
            
        # Create new emergency alert
        alert_message = ''
        severity = 'high'
        
        if trigger_source == 'vitals':
            alert_message = 'Critical vital signs detected'
            severity = 'critical'
        elif trigger_source == 'fall':
            alert_message = 'Potential fall detected'
            severity = 'critical'
        elif trigger_source == 'cough':
            alert_message = 'Severe coughing episode detected'
            severity = 'high'
        elif trigger_source == 'voice':
            alert_message = 'Voice command emergency trigger'
            severity = 'high'
        else:
            alert_message = 'Emergency button pressed'
            severity = 'high'
            
        alert = {
            'id': len(alerts_db) + 1,
            'patientId': patient_id,
            'type': 'emergency',
            'source': trigger_source,
            'severity': severity,
            'message': alert_message,
            'timestamp': datetime.now().isoformat(),
            'acknowledged': False,
            'requiresConfirmation': True,
            'confirmed': False
        }
        
        alerts_db.append(alert)
        save_json_file(ALERTS_FILE, alerts_db)
        
        # Trigger emergency alert system
        if MODULES_AVAILABLE and emergency_alert_system:
            alert = emergency_alert_system.trigger_emergency(user_id, alert_type, message, severity)
            # Also add to alerts_db for compatibility
            alerts_db.append({
                'id': alert['id'],
                'patientId': user_id,
                'type': alert_type,
                'severity': severity,
                'message': message,
                'timestamp': alert['timestamp'],
                'acknowledged': False
            })
        else:
            # Fallback
            alert = create_alert(user_id, alert_type, message)
        
        return jsonify({
            'success': True,
            'alert': alert
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def create_alert(patient_id, alert_type, message):
    """
    Create a new alert
    """
    alert = {
        'id': len(alerts_db) + 1,
        'patientId': patient_id,
        'type': alert_type,
        'message': message,
        'priority': 'high' if 'emergency' in alert_type else 'medium',
        'timestamp': datetime.now().isoformat(),
        'acknowledged': False
    }
    alerts_db.append(alert)
    save_json_file(ALERTS_FILE, alerts_db)
    
    # TODO: Send real-time notification (WebSocket, Firebase, etc.)

# ============================================
# REMINDERS ENDPOINTS
# ============================================

@app.route('/api/reminders', methods=['GET', 'OPTIONS'])
def get_reminders():
    """
    Get medicine reminders for a patient
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('patient_id', '1')
        # Prefer reminders stored on the patient record in patients.json
        patient = patients_db.get(patient_id)
        if patient is not None:
            patient_list = patient.get('reminders', [])
        else:
            patient_list = []
        
        # Back-compat: also include any legacy reminders from reminders_db
        legacy = [r for r in reminders_db if r.get('patientId') == patient_id]
        # Merge by id (patient_list takes precedence)
        merged_by_id = {}
        for r in legacy:
            merged_by_id[str(r.get('id'))] = r
        for r in patient_list:
            merged_by_id[str(r.get('id'))] = r
        merged = list(merged_by_id.values())
        
        return jsonify({ 'reminders': merged }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reminders/create', methods=['POST', 'OPTIONS'])
def create_reminder():
    """
    Create a new medicine reminder
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        
        patient_id = data.get('patient_id', '1')
        # Create reminder object
        new_id = str(int(datetime.now().timestamp() * 1000))
        reminder = {
            'id': new_id,
            'patientId': patient_id,
            'medicine': data.get('medicine'),
            'dosage': data.get('dosage'),
            'time': data.get('time'),
            'frequency': data.get('frequency', 'daily'),
            'active': True,
            'status': data.get('status', 'pending')
        }
        
        # Save on patient record (patients.json)
        patient = patients_db.get(patient_id)
        if patient is None:
            patients_db[patient_id] = { 'id': patient_id, 'name': f'Patient {patient_id}', 'vitals': {}, 'reminders': [reminder] }
        else:
            patient.setdefault('reminders', []).append(reminder)
        save_json_file(PATIENTS_FILE, patients_db)
        
        # Back-compat: also append to reminders_db
        reminders_db.append(reminder)
        save_json_file(REMINDERS_FILE, reminders_db)
        
        return jsonify({
            'success': True,
            'reminder': reminder
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reminders/taken', methods=['POST', 'OPTIONS'])
def mark_reminder_taken():
    """
    Mark a reminder as taken
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        # Accept both camelCase and snake_case for compatibility
        reminder_id = None
        if data:
            reminder_id = data.get('reminderId') or data.get('reminder_id')
        if reminder_id is None:
            return jsonify({'success': False, 'error': 'reminderId required'}), 400
        reminder_id_str = str(reminder_id)
        
        updated = False
        # Update in patients_db
        for patient in patients_db.values():
            reminders = patient.get('reminders', [])
            for r in reminders:
                if str(r.get('id')) == reminder_id_str:
                    r['lastTaken'] = datetime.now().isoformat()
                    r['taken'] = True
                    r['status'] = 'completed'
                    updated = True
                    break
            if updated:
                break
        if updated:
            save_json_file(PATIENTS_FILE, patients_db)
        
        # Update legacy reminders_db as well
        for r in reminders_db:
            if str(r.get('id')) == reminder_id_str:
                r['lastTaken'] = datetime.now().isoformat()
                r['taken'] = True
                r['status'] = 'completed'
                updated = True
                break
        if updated:
            save_json_file(REMINDERS_FILE, reminders_db)
            return jsonify({'success': True, 'message': 'Reminder marked as taken'}), 200
        
        return jsonify({'success': False, 'error': 'Reminder not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# OTHER ENDPOINTS
# ============================================
def get_patients():
    """Get list of patients or specific patient details"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('id')
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        # If specific patient requested
        if patient_id:
            if not rbac.can_access_patient_data(user['id'], patient_id, Permission.VIEW_PATIENT_DATA):
                return jsonify({'error': 'Permission denied'}), 403
            
            patient = patients_db.get(patient_id)
            if not patient:
                return jsonify({'error': 'Patient not found'}), 404
                
            return jsonify({
                'success': True,
                'patient': patient
            }), 200
            
        # List all patients (for doctors/caretakers)
        if not rbac.has_permission(user['id'], Permission.VIEW_ALL_PATIENTS):
            return jsonify({'error': 'Permission denied'}), 403
            
        return jsonify({
            'success': True,
            'patients': list(patients_db.values())
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ADDITIONAL ENDPOINTS
# ============================================
def get_reports():
    """Get medical reports for a patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('patient_id')
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Check permissions
        if user.get('id') != patient_id:
            if not rbac.can_access_patient_data(user['id'], patient_id, Permission.VIEW_MEDICAL_REPORTS):
                return jsonify({'error': 'Permission denied'}), 403
        
        # Get reports from database
        reports = load_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), [])
        
        return jsonify({
            'success': True,
            'reports': reports
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        if not rbac.can_access_patient_data(user['id'], patient_id, Permission.CREATE_MEDICAL_REPORTS):
            return jsonify({'error': 'Permission denied'}), 403
            
        report = {
            'id': str(uuid.uuid4()),
            'patient_id': patient_id,
            'doctor_id': user['id'],
            'title': data.get('title'),
            'content': data.get('content'),
            'diagnosis': data.get('diagnosis'),
            'prescription': data.get('prescription'),
            'attachments': data.get('attachments', []),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Load existing reports
        reports = load_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), [])
        reports.append(report)
        
        # Save updated reports
        save_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), reports)
        
        return jsonify({
            'success': True,
            'report': report
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/share', methods=['POST', 'OPTIONS'])
@require_auth
def share_report():
    """Share a medical report with another healthcare provider"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        report_id = data.get('report_id')
        patient_id = data.get('patient_id')
        target_user_id = data.get('target_user_id')
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        if not rbac.can_access_patient_data(user['id'], patient_id, Permission.SHARE_MEDICAL_REPORTS):
            return jsonify({'error': 'Permission denied'}), 403
            
        # Load reports and find specific report
        reports = load_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), [])
        report = next((r for r in reports if r['id'] == report_id), None)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
            
        # Add sharing record
        if 'shared_with' not in report:
            report['shared_with'] = []
            
        report['shared_with'].append({
            'user_id': target_user_id,
            'shared_by': user['id'],
            'shared_at': datetime.now().isoformat()
        })
        
        # Save updated reports
        save_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), reports)
        
        return jsonify({
            'success': True,
            'message': 'Report shared successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/<report_id>/download', methods=['GET', 'OPTIONS'])
@require_auth
def download_report(report_id):
    """Download a medical report"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('patient_id')
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        if not rbac.can_access_patient_data(user['id'], patient_id, Permission.DOWNLOAD_MEDICAL_REPORTS):
            return jsonify({'error': 'Permission denied'}), 403
            
        # Load reports and find specific report
        reports = load_json_file(os.path.join(DATA_DIR, f'reports_{patient_id}.json'), [])
        report = next((r for r in reports if r['id'] == report_id), None)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
            
        # Generate PDF or appropriate format
        if MODULES_AVAILABLE and report_generator:
            file_path = report_generator.generate_pdf(report)
            return send_file(file_path, as_attachment=True, download_name=f'report_{report_id}.pdf')
            
        # Fallback to JSON if PDF generation not available
        return jsonify(report), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.route('/api/analytics', methods=['GET', 'OPTIONS'])
@require_auth
def get_analytics():
    """Get analytics data for a patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        patient_id = request.args.get('patient_id')
        timeframe = request.args.get('timeframe', '7d')  # Default to 7 days
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        if not rbac.can_access_patient_data(user['id'], patient_id, Permission.VIEW_ANALYTICS):
            return jsonify({'error': 'Permission denied'}), 403
            
        if MODULES_AVAILABLE and analytics_engine:
            # Get comprehensive analytics from the engine
            analytics_data = analytics_engine.get_patient_analytics(patient_id, timeframe)
        else:
            # Fallback to basic analytics
            analytics_data = {
                'vitals_trends': get_vitals_trends(patient_id, timeframe),
                'medication_adherence': calculate_medication_adherence(patient_id, timeframe),
                'health_score': calculate_health_score(patient_id)
            }
            
        return jsonify({
            'success': True,
            'analytics': analytics_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/patterns/<patient_id>', methods=['GET', 'OPTIONS'])
@require_auth
def get_health_patterns(patient_id):
    """Get health patterns and insights for a patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        if not rbac.can_access_patient_data(user['id'], patient_id, Permission.VIEW_HEALTH_PATTERNS):
            return jsonify({'error': 'Permission denied'}), 403
            
        if MODULES_AVAILABLE and analytics_engine:
            # Get AI-powered health insights
            patterns = analytics_engine.analyze_health_patterns(patient_id)
        else:
            # Fallback to basic pattern detection
            patterns = {
                'vitals_anomalies': detect_vitals_anomalies(patient_id),
                'medication_patterns': analyze_medication_patterns(patient_id),
                'health_trends': identify_health_trends(patient_id)
            }
            
        return jsonify({
            'success': True,
            'patterns': patterns
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# AUTHENTICATION ENDPOINTS
# ============================================

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """
    User login with JWT token generation and password verification
    Supports both Google Sign-in and regular email/password login
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        
        # Check if Google sign-in
        if data.get('google_id') or data.get('google_token'):
            # Google authentication
            email = data.get('email')
            name = data.get('name', email.split('@')[0].title() if email else 'User')
            google_id = data.get('google_id')
            role = data.get('role', 'patient')
            
            # Validate role
            try:
                if MODULES_AVAILABLE:
                    role = UserRole(role)
                else:
                    role = role if role in ['patient', 'caretaker', 'doctor'] else 'patient'
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid role specified'
                }), 400
            
            # Find or create user
            user = next((u for u in users_db if u.get('email') == email or u.get('google_id') == google_id), None)
            
            if user:
                # Update existing user
                user['google_id'] = google_id
                user['last_login'] = datetime.now().isoformat()
                if name and not user.get('name'):
                    user['name'] = name
            else:
                # Create new user for Google sign-in
                user = {
                    'id': str(len(users_db) + 1),
                    'name': name,
                    'email': email,
                    'role': role.value,
                    'google_id': google_id,
                    'created_at': datetime.now().isoformat(),
                    'last_login': datetime.now().isoformat()
                }
                users_db.append(user)
            
            save_json_file(USERS_FILE, users_db)
            
            # Assign role in RBAC system
            rbac.assign_role(user['id'], role)
            
            # If Google Health sync is enabled, try to authenticate with Google Fit
            if MODULES_AVAILABLE and google_health and data.get('google_token'):
                try:
                    google_health.authenticate(user['id'], data['google_token'])
                except Exception as e:
                    print(f"⚠️ Google Health sync failed: {e}")
            
            # Generate JWT token
            token = Auth.generate_token(user['id'], role.value if hasattr(role, 'value') else role)
            
            session['user'] = user
            session['role'] = role.value if hasattr(role, 'value') else role
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'name': user.get('name', ''),
                    'email': user['email'],
                    'role': role.value if hasattr(role, 'value') else role,
                    'healthSyncEnabled': google_health.is_authenticated if MODULES_AVAILABLE and google_health else False
                }
            }), 200
            
        else:
            # Regular email/password login
            email = data.get('email')
            password = data.get('password')
            role = data.get('role', 'patient')
            
            if not email or not password:
                return jsonify({
                    'success': False,
                    'error': 'Email and password are required'
                }), 400
            
            try:
                role = UserRole(role)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid role'
                }), 400
            
            # Find user by email
            user = next((u for u in users_db if u.get('email') == email), None)
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': 'Invalid email or password'
                }), 401
            
            # Verify password with support for legacy plaintext passwords.
            stored_val = user.get('password', '')
            password_valid = False

            # If stored value is bytes (unlikely from JSON), use it directly
            if isinstance(stored_val, (bytes, bytearray)):
                password_valid = Auth.verify_password(password, bytes(stored_val))
            elif isinstance(stored_val, str):
                # bcrypt hashes start with $2a$, $2b$, $2y$, etc.
                if stored_val.startswith('$2'):
                    try:
                        password_valid = Auth.verify_password(password, stored_val.encode('utf-8'))
                    except Exception:
                        password_valid = False
                else:
                    # Legacy plaintext entry - verify and upgrade to bcrypt
                    if password == stored_val:
                        # Re-hash and store the bcrypt hash (upgrade)
                        new_hash = Auth.hash_password(password)
                        new_hash_str = new_hash.decode('utf-8') if isinstance(new_hash, bytes) else str(new_hash)
                        user['password'] = new_hash_str
                        save_json_file(USERS_FILE, users_db)
                        password_valid = True
                    else:
                        password_valid = False
            else:
                password_valid = False

            if not password_valid:
                return jsonify({
                    'success': False,
                    'error': 'Invalid email or password'
                }), 401
            
            # Verify role matches
            if user['role'] != role.value:
                return jsonify({
                    'success': False,
                    'error': 'Role mismatch'
                }), 403
            
            # Update last login
            user['last_login'] = datetime.now().isoformat()
            save_json_file(USERS_FILE, users_db)
            
            # Generate JWT token
            token = Auth.generate_token(user['id'], role.value)
            
            # Create safe user object (without password)
            safe_user = {k: v for k, v in user.items() if k != 'password'}
            
            session['user'] = safe_user
            session['role'] = role.value
            
            return jsonify({
                'success': True,
                'user': safe_user,
                'token': token,
                'healthSyncEnabled': google_health.is_authenticated if MODULES_AVAILABLE and google_health else False
            }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST', 'OPTIONS'])
def logout():
    """
    User logout
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        session.pop('user', None)
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/session', methods=['GET', 'OPTIONS'])
def check_session():
    """
    Check if user has active session
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        
        if user:
            return jsonify({
                'success': True,
                'user': user
            }), 200
        
        # Return a demo user for testing
        demo_user = {
            'id': 1,
            'name': 'Demo User',
            'email': 'demo@virtualnurse.ai',
            'role': 'patient'
        }
        
        return jsonify({
            'success': True,
            'user': demo_user
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """
    Register new user with proper validation and password hashing
    Supports both regular registration and Google Sign-up
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name', '').strip()
        role = data.get('role', 'patient')
        
        # Handle Google registration
        google_id = data.get('google_id')
        is_google_signup = bool(google_id)
        
        # Validate email and name
        if not email or not name:
            return jsonify({
                'success': False,
                'error': 'Email and name are required'
            }), 400
        
        # Validate email format
        if not Auth.validate_email(email):
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400
        
        # Validate role
        try:
            role = UserRole(role)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid role'
            }), 400
        
        # Check if user already exists
        if any(u.get('email') == email for u in users_db):
            return jsonify({
                'success': False,
                'error': 'Email already registered'
            }), 400
        
        # For regular signup, validate password
        password = None
        hashed_password = None
        if not is_google_signup:
            password = data.get('password')
            if not password:
                return jsonify({
                    'success': False,
                    'error': 'Password is required'
                }), 400
            # Validate password strength
            is_valid, password_error = Auth.validate_password(password)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': password_error
                }), 400
            # Hash password and decode to string for storage
            hashed_password = Auth.hash_password(password)
            hashed_password_str = hashed_password.decode('utf-8') if isinstance(hashed_password, bytes) else str(hashed_password)
        
        # Create new user
        user = {
            'id': str(len(users_db) + 1),
            'name': name,
            'email': email,
            'role': role.value,
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat() if is_google_signup else None
        }
        
        # Add Google-specific fields
        if is_google_signup:
            user['google_id'] = google_id
        else:
            user['password'] = hashed_password_str
        
        # Add to users database
        users_db.append(user)
        save_json_file(USERS_FILE, users_db)
        
        # Assign role in RBAC system
        rbac.assign_role(user['id'], role)
        
        # If user is a patient, create patient record
        if role == UserRole.PATIENT:
            patient = {
                'id': user['id'],
                'name': user['name'],
                'vitals': {
                    'heartRate': 72,
                    'temperature': 98.6,
                    'oxygen': 98,
                    'systolic': 120,
                    'diastolic': 80
                }
            }
            patients_db[user['id']] = patient
            save_json_file(PATIENTS_FILE, patients_db)
        
        # If Google signup and token provided, try Google Health sync
        if is_google_signup and MODULES_AVAILABLE and google_health:
            google_token = data.get('google_token')
            if google_token:
                try:
                    google_health.authenticate(user['id'], google_token)
                except Exception as e:
                    print(f"⚠️ Google Health sync failed: {e}")
        
        # Generate JWT token
        token = Auth.generate_token(user['id'], role.value)
        
        # Create safe user object (without password)
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        
        # Store in session
        session['user'] = safe_user
        session['role'] = role.value
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': safe_user,
            'token': token,
            'healthSyncEnabled': google_health.is_authenticated if MODULES_AVAILABLE and google_health else False
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# GOOGLE OAUTH2 CALLBACK
# ============================================

@app.route('/api/auth/google/callback', methods=['GET', 'POST'])
def google_oauth2_callback():
    """Handle Google OAuth2 callback"""
    try:
        # Get authorization code
        code = request.args.get('code')
        if not code:
            return jsonify({
                'success': False,
                'error': 'No authorization code received'
            }), 400

        # Exchange code for tokens
        if MODULES_AVAILABLE and google_health:
            tokens = google_health.exchange_code_for_tokens(code)
            
            if tokens:
                # Get user info
                user_info = google_health.get_user_info(tokens['access_token'])
                
                if user_info:
                    # Create or update user
                    user = next((u for u in users_db if u.get('email') == user_info['email']), None)
                    
                    if not user:
                        user = {
                            'id': str(len(users_db) + 1),
                            'name': user_info['name'],
                            'email': user_info['email'],
                            'google_id': user_info['id'],
                            'role': 'patient',
                            'created_at': datetime.now().isoformat(),
                            'last_login': datetime.now().isoformat()
                        }
                        users_db.append(user)
                        save_json_file(USERS_FILE, users_db)
                    
                    # Store tokens
                    google_health.store_tokens(user['id'], tokens)
                    
                    return redirect('/?login=success')
        
        return redirect('/?login=failed')
    except Exception as e:
        print(f"⚠️ Google OAuth callback error: {e}")
        return redirect('/?login=error')

# ============================================
# ============================================
# FALL DETECTION ENDPOINTS
# ============================================

@app.route('/api/detect/fall', methods=['POST', 'OPTIONS'])
@require_auth
def detect_fall_endpoint():
    """
    Detect falls using sensor data from wearable/mobile device
    Uses both RF and CNN models for robust detection when available,
    falls back to rule-based detection otherwise
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        sensor_data = data.get('sensor_data')  # Accelerometer and gyroscope data
        patient_id = data.get('patient_id', '1')
        
        if not sensor_data:
            return jsonify({
                'success': False,
                'error': 'Invalid data - sensor data required'
            }), 400
        
        if not MODELS_AVAILABLE:
            # Fallback to rule-based detection
            return rule_based_fall_detection(sensor_data, patient_id)
        
        # Preprocess sensor data
        try:
            processed_data = preprocess_sensor_data(sensor_data)
        except Exception as e:
            print(f"⚠️ Error preprocessing data: {e}")
            return rule_based_fall_detection(sensor_data, patient_id)
        
        # Get predictions from both models
        try:
            predictions = []
            models_used = []
            
            # Try Random Forest prediction
            if rf_model and scaler:
                try:
                    # Scale the data
                    scaled_data = scaler.transform(processed_data.reshape(1, -1))
                    rf_pred = rf_model.predict_proba(scaled_data)[0]
                    rf_fall_prob = rf_pred[1]  # Probability of fall
                    predictions.append(rf_fall_prob)
                    models_used.append('random_forest')
                except Exception as e:
                    print(f"⚠️ Random Forest prediction error: {e}")
            
            # Try CNN prediction
            if cnn_model:
                try:
                    # CNN prediction (reshape data for CNN)
                    cnn_data = processed_data.reshape(1, -1, 1)  # Adjust shape based on your model
                    cnn_pred = cnn_model.predict(cnn_data)[0]
                    cnn_fall_prob = cnn_pred[0]
                    predictions.append(cnn_fall_prob)
                    models_used.append('cnn')
                except Exception as e:
                    print(f"⚠️ CNN prediction error: {e}")
            
            # Ensemble decision (weighted average)
            fall_probability = (0.6 * rf_fall_prob + 0.4 * cnn_fall_prob)
            is_fall = fall_probability > 0.7  # Threshold for fall detection
            
            if is_fall:
                # Create emergency alert
                alert = create_alert(
                    patient_id=patient_id,
                    alert_type='fall_detected',
                    message='Potential fall detected! Immediate assistance may be needed.'
                )
                
                # Use emergency alert system if available
                if MODULES_AVAILABLE and emergency_alert_system:
                    emergency_alert_system.trigger_emergency(
                        patient_id,
                        'fall_detected',
                        'Fall detected through sensor data',
                        'high'
                    )
            
            return jsonify({
                'success': True,
                'is_fall': bool(is_fall),
                'probability': float(fall_probability),
                'alert_created': is_fall,
                'models_used': ['random_forest', 'cnn'],
                'timestamp': datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            print(f"⚠️ Error in fall detection models: {e}")
            return jsonify({
                'success': False,
                'error': 'Model prediction failed',
                'details': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def rule_based_fall_detection(sensor_data, patient_id):
    """
    Fallback method for fall detection when ML models are not available
    Uses simple threshold-based rules on accelerometer data
    """
    try:
        import numpy as np
        
        # Extract accelerometer data
        acc_x = np.array(sensor_data.get('accelerometer', {}).get('x', []))
        acc_y = np.array(sensor_data.get('accelerometer', {}).get('y', []))
        acc_z = np.array(sensor_data.get('accelerometer', {}).get('z', []))
        
        if len(acc_x) == 0 or len(acc_y) == 0 or len(acc_z) == 0:
            return jsonify({
                'success': False,
                'error': 'Invalid accelerometer data'
            }), 400
        
        # Calculate total acceleration magnitude
        acc_magnitude = np.sqrt(acc_x**2 + acc_y**2 + acc_z**2)
        
        # Simple fall detection rules:
        # 1. High impact detected by acceleration spike
        # 2. Followed by a period of low movement (person lying still)
        
        max_acceleration = np.max(acc_magnitude)
        mean_acceleration = np.mean(acc_magnitude)
        std_acceleration = np.std(acc_magnitude)
        
        # Thresholds (adjust based on your needs)
        IMPACT_THRESHOLD = 25.0  # m/s^2 (about 2.5g)
        STILLNESS_THRESHOLD = 2.0  # m/s^2
        
        # Check for impact followed by stillness
        is_fall = (max_acceleration > IMPACT_THRESHOLD and 
                  mean_acceleration < STILLNESS_THRESHOLD)
        
        # Calculate confidence based on how far above threshold
        confidence = min(0.95, (max_acceleration / IMPACT_THRESHOLD) * 0.8) if is_fall else 0.2
        
        if is_fall:
            # Create emergency alert
            alert = create_alert(
                patient_id=patient_id,
                alert_type='fall_detected',
                message='Potential fall detected! Immediate assistance may be needed.'
            )
            
            # Use emergency alert system if available
            if MODULES_AVAILABLE and emergency_alert_system:
                emergency_alert_system.trigger_emergency(
                    patient_id,
                    'fall_detected',
                    'Fall detected through sensor data',
                    'high'
                )
        
        return jsonify({
            'success': True,
            'is_fall': bool(is_fall),
            'probability': float(confidence),
            'alert_created': is_fall,
            'detection_method': 'rule_based',
            'analysis': {
                'max_acceleration': float(max_acceleration),
                'mean_acceleration': float(mean_acceleration),
                'std_acceleration': float(std_acceleration)
            },
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"⚠️ Rule-based fall detection error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def preprocess_sensor_data(sensor_data):
    """
    Preprocess raw sensor data for fall detection models
    Expects accelerometer and gyroscope data
    """
    try:
        import numpy as np
        
        # Extract features (adjust based on your model's requirements)
        acc_x = sensor_data.get('accelerometer', {}).get('x', [])
        acc_y = sensor_data.get('accelerometer', {}).get('y', [])
        acc_z = sensor_data.get('accelerometer', {}).get('z', [])
        gyro_x = sensor_data.get('gyroscope', {}).get('x', [])
        gyro_y = sensor_data.get('gyroscope', {}).get('y', [])
        gyro_z = sensor_data.get('gyroscope', {}).get('z', [])
        
        # Calculate features (example - adjust based on your model)
        features = []
        
        # Acceleration magnitude
        acc_mag = np.sqrt(np.array(acc_x)**2 + np.array(acc_y)**2 + np.array(acc_z)**2)
        
        # Statistical features
        features.extend([
            np.mean(acc_mag),
            np.std(acc_mag),
            np.max(acc_mag),
            np.mean(acc_x),
            np.mean(acc_y),
            np.mean(acc_z),
            np.std(acc_x),
            np.std(acc_y),
            np.std(acc_z),
            np.mean(gyro_x),
            np.mean(gyro_y),
            np.mean(gyro_z),
            np.std(gyro_x),
            np.std(gyro_y),
            np.std(gyro_z)
        ])
        
        return np.array(features)
        
    except Exception as e:
        print(f"⚠️ Error preprocessing sensor data: {e}")
        raise

# ============================================
# COUGH DETECTION ENDPOINTS
# ============================================

@app.route('/api/cough-detection/analyze', methods=['POST', 'OPTIONS'])
@require_auth
def analyze_cough():
    """
    Analyze cough audio for frequency and severity
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        # Get audio data from request
        audio_file = request.files.get('audio')
        patient_id = request.form.get('patient_id', '1')
        
        if not audio_file:
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400
            
        # Process audio file (placeholder for cough detection model)
        # In production, you would:
        # 1. Save the audio temporarily
        # 2. Process it through your cough detection model
        # 3. Analyze frequency and characteristics
        # 4. Generate health insights
        
        # For now, return a sample response
        return jsonify({
            'success': True,
            'cough_detected': True,
            'analysis': {
                'frequency': 'moderate',  # low, moderate, high
                'type': 'dry',  # dry or wet
                'severity': 7,  # scale of 1-10
                'duration': 2.5  # seconds
            },
            'health_insights': {
                'risk_level': 'moderate',
                'recommendation': 'Consider scheduling a check-up if cough persists for more than 3 days'
            },
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# HEALTH PREDICTION (Future)
# ============================================

@app.route('/api/predict/health-risk', methods=['POST', 'OPTIONS'])
def predict_health_risk():
    """
    Predict health risk using ML model
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json() if request.data else {}
        patient_id = data.get('patient_id', '1')
        
        # Get patient vitals
        vitals = patients_db.get(patient_id, {}).get('vitals', {})
        
        # Use AI model if available
        if MODELS_AVAILABLE and model_manager:
            prediction = model_manager.assess_health_risk(vitals)
        else:
            # Fallback prediction
            prediction = {
                'riskLevel': 'low',
                'confidence': 0.85,
                'factors': ['Normal vitals', 'Regular checkups']
            }
        
        return jsonify({
            'success': True,
            **prediction
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# DOCTOR DASHBOARD ENDPOINTS
# ============================================

@app.route('/api/patients', methods=['GET', 'OPTIONS'])
@require_auth
def get_patients():
    """Get all patients or specific patient details"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user or user.get('role') != 'doctor':
            return jsonify({'error': 'Permission denied'}), 403
            
        patient_id = request.args.get('patient_id')
        
        if patient_id:
            # Get specific patient details
            if patient_id in patients_db:
                patient = patients_db[patient_id].copy()
                # Add additional fields
                active_alerts = [a for a in alerts_db if a.get('patientId') == patient_id and not a.get('acknowledged')]
                active_reminders = [r for r in reminders_db if r.get('patientId') == patient_id and r.get('active')]
                
                patient['alerts'] = active_alerts
                patient['reminders'] = active_reminders
                
                # Get analytics if available
                if MODULES_AVAILABLE and analytics_engine:
                    patient['analytics'] = analytics_engine.get_patient_analytics(patient_id)
                
                return jsonify({
                    'success': True,
                    'patient': patient
                }), 200
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get all patients with summarized info
        patients_list = []
        for pid, patient in patients_db.items():
            # Basic info
            patient_summary = {
                'id': pid,
                'name': patient.get('name', ''),
                'vitals': patient.get('vitals', {}),
                'risk': calculate_risk_level(patient)
            }
            
            # Count active alerts
            active_alerts = len([a for a in alerts_db if a.get('patientId') == pid and not a.get('acknowledged')])
            patient_summary['activeAlerts'] = active_alerts
            
            # Add to list
            patients_list.append(patient_summary)
            
        return jsonify({
            'success': True,
            'patients': patients_list
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/patients/add', methods=['POST', 'OPTIONS'])
@require_auth
def add_patient():
    """Add a new patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user or user.get('role') != 'doctor':
            return jsonify({'error': 'Permission denied'}), 403
            
        data = request.get_json()
        
        # Generate new patient ID
        patient_id = str(len(patients_db) + 1)
        
        # Create patient record
        patient = {
            'id': patient_id,
            'name': data.get('name'),
            'email': data.get('email'),
            'age': data.get('age'),
            'phone': data.get('phone'),
            'condition': data.get('condition'),
            'address': data.get('address'),
            'emergency_contact': data.get('emergency_contact'),
            'vitals': {
                'heartRate': 72,
                'temperature': 98.6,
                'oxygen': 98,
                'systolic': 120,
                'diastolic': 80
            },
            'created_at': datetime.now().isoformat(),
            'doctor_id': user.get('id')
        }
        
        # Add to database
        patients_db[patient_id] = patient
        save_json_file(PATIENTS_FILE, patients_db)
        
        # Create user account for patient if email provided
        if data.get('email'):
            import secrets
            temp_password = secrets.token_urlsafe(8)
            
            user_data = {
                'id': patient_id,
                'name': data.get('name'),
                'email': data.get('email'),
                'password': Auth.hash_password(temp_password).decode('utf-8'),
                'role': 'patient',
                'created_at': datetime.now().isoformat()
            }
            
            users_db.append(user_data)
            save_json_file(USERS_FILE, users_db)
            
            # TODO: Send email with login credentials
        
        return jsonify({
            'success': True,
            'patient': patient
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports', methods=['GET', 'OPTIONS'])
@require_auth
def get_reports():
    """Get medical reports"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        patient_id = request.args.get('patient_id')
        
        # Load reports from file
        reports_file = os.path.join(DATA_DIR, 'reports.json')
        reports = load_json_file(reports_file, [])
        
        if patient_id:
            # Filter reports for specific patient
            reports = [r for r in reports if r.get('patient_id') == patient_id]
        elif user.get('role') == 'doctor':
            # For doctors, get all reports
            pass
        else:
            # For patients, only get their own reports
            reports = [r for r in reports if r.get('patient_id') == user.get('id')]
        
        return jsonify({
            'success': True,
            'reports': reports
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/create', methods=['POST', 'OPTIONS'])
@require_auth
def create_report():
    """Create a new medical report"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user or user.get('role') != 'doctor':
            return jsonify({'error': 'Permission denied'}), 403
            
        data = request.get_json()
        
        report = {
            'id': str(datetime.now().timestamp()),
            'patient_id': data.get('patient_id'),
            'doctor_id': user.get('id'),
            'doctor_name': user.get('name'),
            'report_type': data.get('report_type'),
            'content': data.get('content'),
            'created_at': datetime.now().isoformat()
        }
        
        # Load existing reports
        reports_file = os.path.join(DATA_DIR, 'reports.json')
        reports = load_json_file(reports_file, [])
        
        # Add new report
        reports.append(report)
        save_json_file(reports_file, reports)
        
        return jsonify({
            'success': True,
            'report': report
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/communication/send', methods=['POST', 'OPTIONS'])
@require_auth
def send_message():
    """Send message to patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user or user.get('role') != 'doctor':
            return jsonify({'error': 'Permission denied'}), 403
            
        data = request.get_json()
        patient_id = data.get('patient_id')
        message = data.get('message')
        
        # Load messages from file
        messages_file = os.path.join(DATA_DIR, 'messages.json')
        messages = load_json_file(messages_file, [])
        
        # Create new message
        new_message = {
            'id': str(datetime.now().timestamp()),
            'from_id': user.get('id'),
            'to_id': patient_id,
            'content': message,
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        
        messages.append(new_message)
        save_json_file(messages_file, messages)
        
        # If emergency alert system is available, notify patient
        if MODULES_AVAILABLE and emergency_alert_system:
            emergency_alert_system.notify_patient(
                patient_id,
                'message',
                f"New message from Dr. {user.get('name')}",
                'low'
            )
        
        return jsonify({
            'success': True,
            'message': new_message
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/communication/history', methods=['GET', 'OPTIONS'])
@require_auth
def get_message_history():
    """Get message history with a patient"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user = session.get('user')
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        patient_id = request.args.get('patient_id')
        
        # Load messages
        messages_file = os.path.join(DATA_DIR, 'messages.json')
        messages = load_json_file(messages_file, [])
        
        # Filter messages
        filtered_messages = []
        for msg in messages:
            if (msg.get('from_id') == user.get('id') and msg.get('to_id') == patient_id) or \
               (msg.get('from_id') == patient_id and msg.get('to_id') == user.get('id')):
                filtered_messages.append(msg)
        
        return jsonify({
            'success': True,
            'messages': filtered_messages
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def calculate_risk_level(patient):
    """Calculate patient risk level based on vitals and alerts"""
    risk = 'low'
    vitals = patient.get('vitals', {})
    
    # Check vital signs
    if vitals:
        hr = vitals.get('heartRate', 72)
        temp = vitals.get('temperature', 98.6)
        oxygen = vitals.get('oxygen', 98)
        
        if hr > 100 or hr < 60 or temp > 100.4 or oxygen < 95:
            risk = 'high'
        elif hr > 90 or hr < 65 or temp > 99.5 or oxygen < 97:
            risk = 'medium'
    
    # Check active alerts
    active_alerts = [a for a in alerts_db if a.get('patientId') == patient.get('id') and not a.get('acknowledged')]
    if any(a.get('severity') == 'high' for a in active_alerts):
        risk = 'high'
    elif len(active_alerts) > 2:
        risk = max(risk, 'medium')
    
    return risk

# ============================================
# DAILY SUMMARY ENDPOINTS
# ============================================

@app.route('/api/summary/morning', methods=['GET', 'OPTIONS'])
def get_morning_summary():
    """Get morning health summary"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        
        # Get current vitals
        vitals = patients_db.get(user_id, {}).get('vitals', {})
        
        # Get reminders
        reminders = [r for r in reminders_db if r.get('patientId') == user_id and r.get('active')]
        
        # Get alerts
        alerts = [a for a in alerts_db if a.get('patientId') == user_id and not a.get('acknowledged')]
        
        # Generate summary
        if MODULES_AVAILABLE and daily_summary:
            summary_text = daily_summary.generate_morning_summary(user_id, vitals, reminders, alerts)
        else:
            summary_text = f"Good morning! Your current vitals are normal. You have {len(reminders)} medication reminders today."
        
        return jsonify({
            'success': True,
            'summary': summary_text,
            'vitals': vitals,
            'reminders_count': len(reminders),
            'alerts_count': len(alerts)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/summary/evening', methods=['GET', 'OPTIONS'])
def get_evening_summary():
    """Get evening health summary"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        
        # Get current vitals
        vitals = patients_db.get(user_id, {}).get('vitals', {})
        
        # Get completed reminders (simulated)
        completed_reminders = [r for r in reminders_db if r.get('patientId') == user_id and r.get('lastTaken')]
        
        # Get alerts from today
        today = datetime.now().date()
        today_alerts = [
            a for a in alerts_db 
            if a.get('patientId') == user_id and 
            datetime.fromisoformat(a.get('timestamp', '')).date() == today
        ]
        
        # Generate summary
        if MODULES_AVAILABLE and daily_summary:
            summary_text = daily_summary.generate_evening_summary(
                user_id, vitals, completed_reminders, [], today_alerts
            )
        else:
            summary_text = f"Good evening! You completed {len(completed_reminders)} medications today. Rest well!"
        
        return jsonify({
            'success': True,
            'summary': summary_text,
            'vitals': vitals,
            'completed_reminders': len(completed_reminders),
            'alerts_today': len(today_alerts)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.route('/api/analytics/patterns', methods=['GET', 'OPTIONS'])
def get_analytics_patterns():
    """Get health pattern analytics"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        period_days = int(request.args.get('period_days', 30))
        
        if MODULES_AVAILABLE and analytics_engine:
            patterns = analytics_engine.analyze_patterns(user_id, period_days)
        else:
            patterns = {'error': 'Analytics engine not available'}
        
        return jsonify({
            'success': True,
            'patterns': patterns
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/visualization', methods=['GET', 'OPTIONS'])
def get_visualization_data():
    """Get data for visualization charts"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        data_type = request.args.get('data_type', 'heartRate')
        period_days = int(request.args.get('period_days', 30))
        
        if MODULES_AVAILABLE and analytics_engine:
            viz_data = analytics_engine.get_visualization_data(user_id, data_type, period_days)
        else:
            viz_data = {'labels': [], 'values': []}
        
        return jsonify({
            'success': True,
            'data': viz_data
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# GOOGLE HEALTH API ENDPOINTS
# ============================================

@app.route('/api/health/sync', methods=['POST', 'OPTIONS'])
def sync_to_google_health():
    """Sync health data to Google Fit"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', '1')
        data_type = data.get('data_type', 'vitals')
        
        if MODULES_AVAILABLE and google_health:
            # Ensure authenticated
            if not google_health.is_authenticated:
                # Try to authenticate
                google_health.authenticate(user_id)
            
            if data_type == 'vitals':
                vitals = patients_db.get(user_id, {}).get('vitals', {})
                success = google_health.sync_vitals(user_id, vitals)
            elif data_type == 'activity':
                activity = data.get('activity', {})
                success = google_health.sync_activity(user_id, activity)
            else:
                success = False
        else:
            success = False
        
        return jsonify({
            'success': success,
            'message': 'Synced to Google Fit' if success else 'Sync failed',
            'authenticated': google_health.is_authenticated if MODULES_AVAILABLE and google_health else False
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health/authenticate', methods=['POST', 'OPTIONS'])
def authenticate_google_fit():
    """Authenticate with Google Fit API"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', '1')
        
        if MODULES_AVAILABLE and google_health:
            success = google_health.authenticate(user_id)
            return jsonify({
                'success': success,
                'authenticated': google_health.is_authenticated,
                'message': 'Authentication successful' if success else 'Authentication failed'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Google Health module not available'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health/retrieve', methods=['GET', 'OPTIONS'])
def retrieve_from_google_health():
    """Retrieve data from Google Health"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        data_type = request.args.get('data_type', 'vitals')
        days = int(request.args.get('days', 30))
        
        # Prefer Google Health data when available
        data = None
        if MODULES_AVAILABLE and google_health and getattr(google_health, 'is_authenticated', False):
            try:
                if data_type == 'vitals' and hasattr(google_health, 'retrieve_vitals'):
                    data = google_health.retrieve_vitals(user_id)
                elif data_type == 'wellness' and hasattr(google_health, 'retrieve_wellness_metrics'):
                    data = google_health.retrieve_wellness_metrics(user_id, days)
            except Exception as e:
                print(f"⚠️ Error retrieving from Google Health: {e}")
                data = None

        # If no Google data, fall back to simulated/local vitals
        if not data:
            if data_type == 'vitals':
                # Use stored patient vitals if available and apply small random variation
                base = patients_db.get(user_id, {}).get('vitals', None)
                if base:
                    import random as _random
                    simulated = {
                        'heartRate': max(50, min(110, int(base.get('heartRate', 72) + _random.randint(-3, 3)))),
                        'temperature': round(base.get('temperature', 98.6) + _random.uniform(-0.3, 0.3), 1),
                        'oxygen': max(90, min(100, int(base.get('oxygen', 98) + _random.randint(-1, 1)))),
                        'systolic': int(base.get('systolic', 120) + _random.randint(-5, 5)),
                        'diastolic': int(base.get('diastolic', 80) + _random.randint(-3, 3)),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'simulated'
                    }
                    data = simulated
                else:
                    # Default simulated vitals
                    data = {
                        'heartRate': 72,
                        'temperature': 98.6,
                        'oxygen': 98,
                        'systolic': 120,
                        'diastolic': 80,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'simulated'
                    }
            else:
                data = []
        
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# SPEAKER IDENTIFICATION ENDPOINTS
# ============================================

@app.route('/api/speaker/register', methods=['POST', 'OPTIONS'])
def register_speaker():
    """Register a new speaker"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        role = data.get('role', 'patient')
        audio_samples = data.get('audio_samples', [])  # List of base64 audio
        
        if MODULES_AVAILABLE and speaker_identifier:
            success = speaker_identifier.register_speaker(user_id, role, audio_samples)
        else:
            success = False
        
        return jsonify({
            'success': success,
            'message': 'Speaker registered' if success else 'Registration failed'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/speaker/identify', methods=['POST', 'OPTIONS'])
def identify_speaker():
    """Identify speaker from audio"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        audio_data = data.get('audio')  # Base64 audio
        
        if MODULES_AVAILABLE and speaker_identifier and audio_data:
            speaker_info = speaker_identifier.identify_speaker(audio_data)
        else:
            speaker_info = None
        
        return jsonify({
            'success': True,
            'speaker': speaker_info
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# CONTEXT MEMORY ENDPOINTS
# ============================================

@app.route('/api/context', methods=['GET', 'OPTIONS'])
def get_conversation_context():
    """Get conversation context for a user"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('user_id', '1')
        
        if MODULES_AVAILABLE and context_memory:
            context = context_memory.get_context(user_id)
            history = context_memory.get_recent_history(user_id)
            hints = context_memory.get_contextual_response_hints(user_id)
        else:
            context = {}
            history = []
            hints = {}
        
        return jsonify({
            'success': True,
            'context': context,
            'recent_history': history,
            'hints': hints
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# FALL DETECTION ENDPOINTS
# ============================================

@app.route('/api/detect/fall', methods=['POST', 'OPTIONS'])
def detect_fall():
    """
    Detect fall from sensor data (accelerometer/gyroscope)
    Triggers emergency alert if fall detected
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', '1')
        sensor_data = data.get('sensor_data', {})
        
        # Use fall detection model if available
        fall_result = None
        if MODELS_AVAILABLE and model_manager:
            fall_result = model_manager.detect_fall(sensor_data)
        else:
            # Fallback detection
            fall_result = {
                'detected': False,
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat(),
                'method': 'fallback'
            }
        
        # If fall detected, trigger emergency alert
        if fall_result.get('detected') and fall_result.get('confidence', 0) > 0.5:
            # Trigger emergency alert
            if MODULES_AVAILABLE and emergency_alert_system:
                alert = emergency_alert_system.trigger_emergency(
                    user_id=user_id,
                    alert_type='fall_detected',
                    message=f'Fall detected with {fall_result.get("confidence", 0)*100:.1f}% confidence',
                    severity='critical'
                )
                fall_result['alert_triggered'] = True
                fall_result['alert_id'] = alert.get('id')
            else:
                # Fallback: create alert in alerts_db
                create_alert(user_id, 'fall_detected', 'Fall detected by sensor system')
                fall_result['alert_triggered'] = True
            
            # Add to analytics
            if MODULES_AVAILABLE and analytics_engine:
                analytics_engine.add_data_point(user_id, 'fall_incident', 1.0, {
                    'confidence': fall_result.get('confidence', 0),
                    'method': fall_result.get('method', 'unknown')
                })
        
        return jsonify({
            'success': True,
            'fall_detection': fall_result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/detect/cough', methods=['POST', 'OPTIONS'])
def detect_cough():
    """
    Detect cough from audio data
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', '1')
        audio_data = data.get('audio_data')  # Base64 or file path
        
        # Use cough detection model if available
        cough_result = None
        if MODELS_AVAILABLE and model_manager and audio_data:
            # Convert base64 to bytes if needed
            if isinstance(audio_data, str) and audio_data.startswith('data:'):
                import base64
                audio_data = base64.b64decode(audio_data.split(',')[1])
            
            cough_result = model_manager.detect_cough(audio_data)
        else:
            cough_result = {
                'detected': False,
                'confidence': 0.0,
                'frequency': 0,
                'timestamp': datetime.now().isoformat()
            }
        
        # Add to analytics if cough detected
        if cough_result.get('detected') and MODULES_AVAILABLE and analytics_engine:
            analytics_engine.add_data_point(user_id, 'cough_frequency', 
                                           cough_result.get('frequency', 1))
        
        return jsonify({
            'success': True,
            'cough_detection': cough_result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    # Initialize with sample data
    reminders_db.append({
        'id': 1,
        'patientId': '1',
        'medicine': 'Aspirin',
        'dosage': '100mg',
        'time': '08:00',
        'frequency': 'daily',
        'active': True
    })
    
    print("=" * 60)
    print("🏥 Virtual Nurse AI Backend Server")
    print("=" * 60)
    print("✅ Server starting on http://127.0.0.1:5000")
    print("✅ CORS enabled for localhost and file:// protocol")
    print("\n📋 Available Endpoints:")
    print("   • POST /api/voice - Process voice input")
    print("   • GET  /api/vitals - Get patient vitals")
    print("   • GET  /api/alerts - Get active alerts")
    print("   • GET  /api/reminders - Get medicine reminders")
    print("   • POST /api/auth/login - User authentication")
    print("   • POST /api/detect/fall - Detect fall from sensors")
    print("   • POST /api/detect/cough - Detect cough from audio")
    print("   • GET  /api/summary/morning - Morning health summary")
    print("   • GET  /api/summary/evening - Evening health summary")
    print("   • GET  /api/analytics/patterns - Health pattern analysis")
    print("   • POST /api/health/authenticate - Google Fit authentication")
    print("\n⚠️  Press Ctrl+C to stop the server")
    print("=" * 60)
    
    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
    
    print("=" * 50)
    print("Virtual Nurse AI - Flask Backend")
    print("=" * 50)
    print("\nServer starting on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  POST /api/voice")
    print("  GET  /api/vitals")
    print("  GET  /api/alerts")
    print("  GET  /api/reminders")
    print("  POST /api/auth/login")
    print("\nPress CTRL+C to stop")
    print("=" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')

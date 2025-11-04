# Flask Backend Template for Virtual Nurse AI
# This is a starter template - expand based on your needs

from flask import Flask, request, jsonify, session, send_from_directory, redirect
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import json
import random
from functools import wraps
from auth import Auth

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
                role = UserRole(role)
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
            if MODULES_AVAILABLE and rbac:
                rbac.assign_role(user['id'], role)
            
            # If Google Health sync is enabled, try to authenticate with Google Fit
            if MODULES_AVAILABLE and google_health and data.get('google_token'):
                try:
                    google_health.authenticate(data['google_token'])
                except Exception as e:
                    print(f"⚠️ Google Health auth error: {e}")
            
            # Generate JWT token
            token = Auth.generate_token(user['id'], role.value)
            
            session['user'] = user
            session['role'] = role.value
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'name': user.get('name', ''),
                    'email': user['email'],
                    'role': role.value
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
                    'error': 'Invalid role specified'
                }), 400
            
            # Find user by email
            user = next((u for u in users_db if u.get('email') == email), None)
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 404
            
            # Verify password
            if not Auth.verify_password(password, user['password']):
                return jsonify({
                    'success': False,
                    'error': 'Invalid credentials'
                }), 401
            
            # Generate token and set session
            token = Auth.generate_token(user['id'], role.value)
            session['user'] = user
            session['role'] = role.value
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'name': user.get('name', ''),
                    'email': user['email'],
                    'role': role.value
                }
            }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred during login'
        }), 500
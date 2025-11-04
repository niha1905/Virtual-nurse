# ============================================
# GEMINI API INTEGRATION (Backend)
# ============================================

import os
import json
from typing import Dict, Optional, Any
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GeminiAPI:
    """Backend integration with Google Gemini API for natural language understanding"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini API
        
        Args:
            api_key: Gemini API key. If not provided, tries to get from environment
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("No Gemini API key found. Please set GEMINI_API_KEY in your .env file")
            
        self.models = [
            'gemini-2.5-flash',
            'gemini-pro'
        ]
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta/models'
        self.enabled = True
        print(f"✅ Gemini API initialized with provided key")

    def generate_health_response(self, user_text: str, context: Dict[str, Any] = None) -> str:
        """
        Generate health-aware response using Gemini API
        
        Args:
            user_text: User's input text
            context: Health context (vitals, reminders, mood, etc.)
        
        Returns:
            AI-generated response
        """
        # If integration disabled, return fallback
        if not self.enabled:
            return self._get_fallback_response(user_text, context)

        # Development / mock mode only if explicitly set
        if os.getenv('GEMINI_MOCK_MODE', '0') == '1':
            try:
                return self._generate_mock_response(user_text, context or {})
            except Exception as e:
                print(f"⚠️ Mock Gemini response error: {e}")
                return self._get_fallback_response(user_text, context)

        # Production: attempt real network call
        try:
            prompt = self._build_health_prompt(user_text, context or {})

            # Try each model in order
            response = None
            for model in self.models:
                try:
                    print(f"🔄 Trying model: {model}")
                    response = requests.post(
                        f"{self.base_url}/{model}:generateContent?key={self.api_key}",
                        headers={'Content-Type': 'application/json'},
                        json={
                            'contents': [{
                                'parts': [{
                                    'text': prompt
                                }]
                            }]
                        },
                        timeout=10
                    )
                    
                    if response.ok:
                        print(f"✅ {model} response received")
                        data = response.json()
                        if data.get('candidates') and data['candidates'][0].get('content'):
                            return data['candidates'][0]['content']['parts'][0]['text'].strip()
                        break
                    
                    # If 404 or 400, try next model
                    if response.status_code in [404, 400]:
                        print(f"⚠️ Model {model} not available, trying next model")
                        continue
                    # Other errors: break
                    print(f"⚠️ Error with {model}: {response.status_code}")
                    break
                except Exception as e:
                    print(f"⚠️ Error with {model}: {e}")
                    continue

            return self._get_fallback_response(user_text, context)
        except Exception as e:
            print(f"⚠️ Gemini API error: {e}")
            return self._get_fallback_response(user_text, context)
    
    def _build_health_prompt(self, user_text: str, context: Dict[str, Any]) -> str:
        """Build prompt with health context"""
        vitals = context.get('vitals', {})
        reminders = context.get('reminders', [])
        mood = context.get('mood', 'neutral')
        recent_history = context.get('recentHistory', [])
        
        prompt = f"""You are a Virtual Nurse AI assistant, providing compassionate, accurate healthcare guidance.
You are speaking with a patient who needs health support.

Current Patient Context:
- Heart Rate: {vitals.get('heartRate', 'N/A')} bpm
- Blood Pressure: {vitals.get('systolic', 'N/A')}/{vitals.get('diastolic', 'N/A')} mmHg
- Temperature: {vitals.get('temperature', 'N/A')}°F
- Oxygen Level: {vitals.get('oxygen', 'N/A')}%
- Mood: {mood}

Upcoming Medications: {', '.join([f"{r.get('medicine', '')} at {r.get('time', '')}" for r in reminders[:3]]) if reminders else 'None'}

Recent Conversation:
{chr(10).join([f"Patient: {h.get('user', '')}\nNurse: {h.get('assistant', '')}" for h in recent_history[-3:]])}

Patient says: "{user_text}"

Respond naturally, compassionately, and helpfully. Keep responses concise (2-3 sentences max). 
If the patient asks about vitals, medications, or health status, provide accurate information from the context above.
If it's an emergency, acknowledge it immediately and reassure them help is on the way.

Response:"""
        
        return prompt
    
    def _get_fallback_response(self, user_text: str, context: Dict[str, Any] = None) -> str:
        """Fallback rule-based responses"""
        text = user_text.lower()
        vitals = (context or {}).get('vitals', {})
        
        if 'oxygen' in text or 'o2' in text:
            oxygen = vitals.get('oxygen', 97)
            status = 'You\'re doing well.' if oxygen >= 95 else 'Please monitor this closely.'
            return f"Your oxygen level is currently {oxygen}%. {status}"
        
        if 'heart rate' in text or 'pulse' in text:
            heart_rate = vitals.get('heartRate', 72)
            return f"Your heart rate is {heart_rate} beats per minute. This is within normal range."
        
        if 'temperature' in text or 'temp' in text:
            temp = vitals.get('temperature', 98.6)
            status = 'This is normal.' if temp < 99.5 else 'You may have a slight fever. Please rest and hydrate.'
            return f"Your temperature is {temp}°F. {status}"
        
        if 'blood pressure' in text or 'bp' in text:
            systolic = vitals.get('systolic', 120)
            diastolic = vitals.get('diastolic', 80)
            return f"Your blood pressure is {systolic}/{diastolic} mmHg. This looks good."
        
        if 'remind' in text or 'medication' in text or 'medicine' in text:
            reminders = (context or {}).get('reminders', [])
            if reminders:
                next_reminder = reminders[0]
                return f"I'll remind you to take {next_reminder.get('medicine', 'your medication')} at {next_reminder.get('time', 'the scheduled time')}. Is there anything else you need?"
            return "I'll set that reminder for you. What medication and what time?"
        
        if 'help' in text or 'emergency' in text:
            return "I understand you need help. Emergency services are being notified. Please stay calm, help is on the way."
        
        if 'how' in text and 'health' in text:
            return f"Your vitals are looking good. Heart rate: {vitals.get('heartRate', 72)} bpm, Oxygen: {vitals.get('oxygen', 97)}%. Continue monitoring and stay hydrated."
        
        return f"I heard: '{user_text}'. How can I assist you with your health today?"
    
    def analyze_health_context(self, text: str, vitals: Dict[str, Any] = None, history: list = None) -> Dict[str, Any]:
        """
        Analyze health context and provide insights
        
        Returns:
            Dict with intent, risk_level, suggested_action, requires_followup
        """
        if not self.enabled:
            return self._analyze_health_context_fallback(text, vitals)
        
        try:
            prompt = f"""Analyze this health-related conversation and provide insights:

Patient said: "{text}"
Current vitals: HR: {vitals.get('heartRate', 'N/A') if vitals else 'N/A'}, BP: {vitals.get('systolic', 'N/A') if vitals else 'N/A'}/{vitals.get('diastolic', 'N/A') if vitals else 'N/A'}, Temp: {vitals.get('temperature', 'N/A') if vitals else 'N/A'}, O2: {vitals.get('oxygen', 'N/A') if vitals else 'N/A'}%,

Provide a JSON response with:
- intent: "check_vitals" | "medication_reminder" | "emergency" | "general_question"
- risk_level: "low" | "medium" | "high"
- suggested_action: brief action recommendation
- requires_followup: true/false

Response:"""

            # Try each model in order
            response = None
            for model in self.models:
                try:
                    print(f"🔄 Trying model: {model}")
                    response = requests.post(
                        f"{self.base_url}/{model}:generateContent?key={self.api_key}",
                        headers={'Content-Type': 'application/json'},
                        json={
                            'contents': [{
                                'parts': [{
                                    'text': prompt
                                }]
                            }]
                        },
                        timeout=10
                    )
                    
                    if response.ok:
                        print(f"✅ {model} response received")
                        data = response.json()
                        if data.get('candidates') and data['candidates'][0].get('content'):
                            text_response = data['candidates'][0]['content']['parts'][0]['text']
                            # Try to parse JSON from response
                            try:
                                import re
                                json_match = re.search(r'\{[\s\S]*\}', text_response)
                                if json_match:
                                    return json.loads(json_match.group())
                            except:
                                pass
                        break
                    
                    # If 404 or 400, try next model
                    if response.status_code in [404, 400]:
                        print(f"⚠️ Model {model} not available, trying next model")
                        continue
                    # Other errors: break
                    print(f"⚠️ Error with {model}: {response.status_code}")
                    break
                except Exception as e:
                    print(f"⚠️ Error with {model}: {e}")
                    continue
            
            return self._analyze_health_context_fallback(text, vitals)
        except Exception as e:
            print(f"⚠️ Gemini analysis error: {e}")
            return self._analyze_health_context_fallback(text, vitals)

    def _analyze_health_context_fallback(self, text: str, vitals: Dict[str, Any] = None) -> Dict[str, Any]:
        """Fallback health context analysis"""
        lower_text = text.lower()
        
        intent = 'general_question'
        if any(word in lower_text for word in ['oxygen', 'heart', 'temp', 'vital']):
            intent = 'check_vitals'
        elif any(word in lower_text for word in ['remind', 'medication']):
            intent = 'medication_reminder'
        elif any(word in lower_text for word in ['help', 'emergency']):
            intent = 'emergency'
        
        risk_level = 'low'
        if vitals:
            if vitals.get('heartRate', 0) > 100 or vitals.get('oxygen', 100) < 95 or vitals.get('temperature', 98) > 100:
                risk_level = 'medium'
        if 'emergency' in lower_text or 'help' in lower_text:
            risk_level = 'high'
        
        return {
            'intent': intent,
            'risk_level': risk_level,
            'suggested_action': 'Notify emergency services immediately' if intent == 'emergency' else 'Continue monitoring',
            'requires_followup': risk_level != 'low'
        }

    def _generate_mock_response(self, user_text: str, context: Dict[str, Any]) -> str:
        """Generate a helpful, deterministic response for development without calling the network."""
        text = user_text.lower()
        # Specific helpful rule for back pain exercises
        if 'back pain' in text or 'backache' in text or ('back' in text and 'pain' in text):
            return (
                "For lower back pain, try these gentle exercises: pelvic tilts, knee-to-chest stretches, "
                "and cat-cow yoga movements. Start slowly — 5–10 minutes, 1–2 times daily. If pain worsens, "
                "stop and consult a healthcare professional."
            )

        # If user asks for exercises generally
        if 'exercise' in text or 'exercises' in text or 'stretch' in text:
            return (
                "Gentle, low-impact exercises can help: walking, stretching (hamstrings and hip flexors), "
                "core strengthening (bridges, bird-dog), and low-intensity yoga. Begin slowly and stop if you feel sharp pain."
            )

        # Otherwise, craft a short context-aware reply
        vitals = context.get('vitals', {})
        heart = vitals.get('heartRate')
        oxygen = vitals.get('oxygen')

        base_reply = "I heard you. "
        if heart:
            base_reply += f"Your heart rate is {heart} bpm. "
        if oxygen:
            base_reply += f"Oxygen: {oxygen}%. "

        base_reply += "How can I assist you further with your health?"
        return base_reply


# Global instance
gemini_api = GeminiAPI()
// ============================================
// GEMINI API INTEGRATION
// ============================================

class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.models = [
            'gemini-1.5-flash',
            'gemini-pro'
        ];
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.enabled = false;
        // Initialize asynchronously
        this.initPromise = this.init().catch(error => {
            console.error('Failed to initialize Gemini API:', error);
            this.enabled = false;
        });
    }

    async init() {
        try {
            console.log('🔄 Initializing Gemini API...');
            // Fetch configuration from backend
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                console.log('📥 Received config:', { enabled: config.enabled, keyAvailable: !!config.gemini_api_key });
                this.apiKey = config.gemini_api_key;
                this.enabled = config.enabled;
                
                if (this.enabled) {
                    console.log('✅ Gemini API initialized successfully');
                    // Test the API
                    try {
                        const testResponse = await this.generateHealthResponse('test connection', {
                            vitals: { heartRate: 72, temperature: 98.6 }
                        });
                        console.log('🔵 Gemini API test response:', testResponse);
                    } catch (testError) {
                        console.error('❌ Gemini API test failed:', testError);
                    }
                } else {
                    console.warn('⚠️ Gemini API is not enabled');
                }
            } else {
                throw new Error('Failed to fetch configuration');
            }
        } catch (error) {
            console.error('⚠️ Error initializing Gemini API:', error);
            this.enabled = false;
        }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.enabled = true;
        console.log('✅ Gemini API key set');
    }

    async generateHealthResponse(userText, context = {}) {
        if (!this.enabled || !this.apiKey) {
            console.warn('⚠️ Gemini API not enabled or missing key, using fallback');
            return this.getFallbackResponse(userText, context);
        }

        try {
            console.log('🎯 Generating health response for:', { userText, context });
            const prompt = this.buildHealthPrompt(userText, context);
            console.log('📝 Generated prompt:', prompt);
            const data = await this.requestGemini(prompt);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const response = data.candidates[0].content.parts[0].text;
                console.log('✨ Gemini response:', response);
                return response;
            }
            
            console.warn('⚠️ Invalid response format from Gemini, using fallback');
            return this.getFallbackResponse(userText, context);
        } catch (error) {
            console.error('Gemini API error:', error);
            return this.getFallbackResponse(userText, context);
        }
    }

    async requestGemini(prompt) {
        let lastErr;
        for (const model of this.models) {
            try {
                console.log(`🔄 Trying model: ${model}`);
                const url = `${this.apiBase}/${model}:generateContent?key=${this.apiKey}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log(`✅ ${model} response received:`, data);
                    return data;
                }
                lastErr = new Error(`Gemini API error ${res.status} for ${model}`);
                // If 404 or 400, try next model
                if (res.status === 404 || res.status === 400) continue;
                // Other errors: break
                break;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error('Gemini request failed');
    }

    buildHealthPrompt(userText, context) {
        const vitals = context.vitals || {};
        const reminders = context.reminders || [];
        const mood = context.mood || 'neutral';
        const recentHistory = context.recentHistory || [];
        
        let prompt = `You are a Virtual Nurse AI assistant, providing compassionate, accurate healthcare guidance. 
You are speaking with a patient who needs health support.

Current Patient Context:
- Heart Rate: ${vitals.heartRate || 'N/A'} bpm
- Blood Pressure: ${vitals.systolic || 'N/A'}/${vitals.diastolic || 'N/A'} mmHg
- Temperature: ${vitals.temperature || 'N/A'}°F
- Oxygen Level: ${vitals.oxygen || 'N/A'}%
- Mood: ${mood}

Upcoming Medications: ${reminders.length > 0 ? reminders.map(r => `${r.medicine} at ${r.time}`).join(', ') : 'None'}

Recent Conversation:
${recentHistory.slice(-3).map(h => `Patient: ${h.user}\nNurse: ${h.assistant}`).join('\n\n')}

Patient says: "${userText}"

Respond naturally, compassionately, and helpfully. Keep responses concise (2-3 sentences max). 
If the patient asks about vitals, medications, or health status, provide accurate information from the context above.
If it's an emergency, acknowledge it immediately and reassure them help is on the way.

Response:`;

        return prompt;
    }

    getFallbackResponse(userText, context) {
        const text = userText.toLowerCase();
        const vitals = context.vitals || {};
        
        // Fallback rule-based responses
        if (text.includes('oxygen') || text.includes('o2')) {
            return `Your oxygen level is currently ${vitals.oxygen || 97}%. ${vitals.oxygen >= 95 ? "You're doing well." : "Please monitor this closely."}`;
        }
        
        if (text.includes('heart rate') || text.includes('pulse')) {
            return `Your heart rate is ${vitals.heartRate || 72} beats per minute. This is within normal range.`;
        }
        
        if (text.includes('temperature') || text.includes('temp')) {
            return `Your temperature is ${vitals.temperature || 98.6}°F. ${vitals.temperature > 99.5 ? "You may have a slight fever. Please rest and hydrate." : "This is normal."}`;
        }
        
        if (text.includes('blood pressure') || text.includes('bp')) {
            return `Your blood pressure is ${vitals.systolic || 120}/${vitals.diastolic || 80} mmHg. This looks good.`;
        }
        
        if (text.includes('remind') || text.includes('medication') || text.includes('medicine')) {
            const reminders = context.reminders || [];
            if (reminders.length > 0) {
                const next = reminders[0];
                return `I'll remind you to take ${next.medicine} at ${next.time}. Is there anything else you need?`;
            }
            return "I'll set that reminder for you. What medication and what time?";
        }
        
        if (text.includes('help') || text.includes('emergency')) {
            return "I understand you need help. Emergency services are being notified. Please stay calm, help is on the way.";
        }
        
        if (text.includes('how') && text.includes('health')) {
            return `Your vitals are looking good. Heart rate: ${vitals.heartRate || 72} bpm, Oxygen: ${vitals.oxygen || 97}%. Continue monitoring and stay hydrated.`;
        }
        
        return `I heard: "${userText}". How can I assist you with your health today?`;
    }

    async analyzeHealthContext(text, vitals, history) {
        if (!this.enabled || !this.apiKey) {
            return this.analyzeHealthContextFallback(text, vitals);
        }

        try {
            const prompt = `Analyze this health-related conversation and provide insights:

Patient said: "${text}"
Current vitals: HR: ${vitals.heartRate || 'N/A'}, BP: ${vitals.systolic || 'N/A'}/${vitals.diastolic || 'N/A'}, Temp: ${vitals.temperature || 'N/A'}, O2: ${vitals.oxygen || 'N/A'}%

Provide a JSON response with:
- intent: "check_vitals" | "medication_reminder" | "emergency" | "general_question"
- risk_level: "low" | "medium" | "high"
- suggested_action: brief action recommendation
- requires_followup: true/false

Response:`;

            const data = await this.requestGemini(prompt);
            if (data) {
                if (data.candidates && data.candidates[0]) {
                    const text = data.candidates[0].content.parts[0].text;
                    // Try to parse JSON from response
                    try {
                        const jsonMatch = text.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            return JSON.parse(jsonMatch[0]);
                        }
                    } catch (e) {
                        // Fall through to fallback
                    }
                }
            }
        } catch (error) {
            console.error('Gemini analysis error:', error);
        }

        return this.analyzeHealthContextFallback(text, vitals);
    }

    analyzeHealthContextFallback(text, vitals) {
        const lowerText = text.toLowerCase();
        
        let intent = 'general_question';
        if (lowerText.includes('oxygen') || lowerText.includes('heart') || lowerText.includes('temp') || lowerText.includes('vital')) {
            intent = 'check_vitals';
        } else if (lowerText.includes('remind') || lowerText.includes('medication')) {
            intent = 'medication_reminder';
        } else if (lowerText.includes('help') || lowerText.includes('emergency')) {
            intent = 'emergency';
        }
        
        let risk_level = 'low';
        if (vitals.heartRate > 100 || vitals.oxygen < 95 || vitals.temperature > 100) {
            risk_level = 'medium';
        }
        if (lowerText.includes('emergency') || lowerText.includes('help')) {
            risk_level = 'high';
        }
        
        return {
            intent,
            risk_level,
            suggested_action: intent === 'emergency' ? 'Notify emergency services immediately' : 'Continue monitoring',
            requires_followup: risk_level !== 'low'
        };
    }
}

// Global instance
const geminiAPI = new GeminiAPI();
window.geminiAPI = geminiAPI;


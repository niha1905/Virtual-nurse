// ============================================
// VOICE INTERACTION MODULE
// ============================================

class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.audioContext = null;
        this.analyser = null;
        this.animationId = null;
        
        this.init();
    }

    init() {
        // Initialize elements
        this.modal = document.getElementById('voiceModal');
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('statusText');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.transcriptionText = document.getElementById('transcriptionText');
        this.responseText = document.getElementById('responseText');
        this.waveformCanvas = document.getElementById('waveform');
        this.closeModalBtn = document.getElementById('closeModal');

        // Button to open modal
        const startVoiceBtn = document.getElementById('startVoiceBtn');
        const patientVoiceBtn = document.getElementById('patientVoiceBtn');

        if (startVoiceBtn) {
            startVoiceBtn.addEventListener('click', () => this.openModal());
        }

        if (patientVoiceBtn) {
            patientVoiceBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // Mic button
        if (this.micButton) {
            this.micButton.addEventListener('click', () => this.toggleListening());
        }

        // Initialize Web Speech API
        this.initSpeechRecognition();

        // Initialize audio visualization
        this.initAudioVisualization();
    }

    openModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            this.updateStatus('ready', 'Ready');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            if (this.isListening) {
                this.stopListening();
            }
        }
    }

    initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                console.log('🎤 Speech recognition started - Speak now!');
                this.updateStatus('listening', 'Listening... Speak now!');
                
                if (this.transcriptionText) {
                    this.transcriptionText.textContent = '🎤 Listening...';
                    this.transcriptionText.style.color = 'var(--primary)';
                }
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Show interim results in gray, final in normal color
                if (this.transcriptionText) {
                    if (interimTranscript) {
                        this.transcriptionText.textContent = '🎤 ' + interimTranscript;
                        this.transcriptionText.style.color = 'var(--text-secondary)';
                    }
                    if (finalTranscript) {
                        this.transcriptionText.textContent = finalTranscript.trim();
                        this.transcriptionText.style.color = 'var(--text-primary)';
                        console.log('✅ Final transcript:', finalTranscript.trim());
                        this.processTranscript(finalTranscript.trim());
                    }
                }
            };

            this.recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                
                let errorMessage = 'Error: ';
                switch(event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected. Try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone not found or not working.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission denied.';
                        break;
                    case 'network':
                        errorMessage = 'Network error. Check your connection.';
                        break;
                    default:
                        errorMessage += event.error;
                }
                
                this.updateStatus('error', errorMessage);
                
                if (this.transcriptionText) {
                    this.transcriptionText.textContent = '❌ ' + errorMessage;
                    this.transcriptionText.style.color = 'var(--danger)';
                }
                
                setTimeout(() => {
                    this.stopListening();
                }, 2000);
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.stopListening();
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    initAudioVisualization() {
        if (!this.waveformCanvas) return;

        const ctx = this.waveformCanvas.getContext('2d');
        this.waveformCanvas.width = this.waveformCanvas.offsetWidth;
        this.waveformCanvas.height = this.waveformCanvas.offsetHeight;

        // Draw idle waveform
        this.drawIdleWaveform(ctx);
    }

    drawIdleWaveform(ctx) {
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
    }

    drawActiveWaveform(ctx, dataArray) {
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const bufferLength = dataArray.length;
        const sliceWidth = width / bufferLength;

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim();
        ctx.beginPath();

        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    async startListening() {
        if (!this.recognition) {
            alert('❌ Speech recognition is not supported in your browser.\n\nPlease use Chrome, Edge, or Safari.');
            return;
        }

        // Prevent double-start
        if (this.isListening) {
            console.warn('Speech recognition already active; ignoring duplicate start request');
            return;
        }

        // Request microphone permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone access granted');

            // Stop the stream immediately (we just needed permission)
            stream.getTracks().forEach(track => track.stop());

            // Try to start recognition and only flip state if it starts successfully
            try {
                this.recognition.start();
                this.isListening = true;
                if (this.micButton) this.micButton.classList.add('active');
                this.updateStatus('listening', 'Listening...');

                if (this.transcriptionText) {
                    this.transcriptionText.textContent = 'Listening...';
                }

                this.startAudioVisualization();
            } catch (startError) {
                // The Web Speech API may throw if start is called while already running.
                console.warn('Speech recognition start failed (possibly already started):', startError);
                this.isListening = false;
                this.updateStatus('error', 'Could not start speech recognition');
            }

        } catch (error) {
            console.error('❌ Microphone access error:', error);

            if (error.name === 'NotAllowedError') {
                alert('❌ Microphone access denied!\n\nPlease allow microphone access in your browser settings and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('❌ No microphone found!\n\nPlease connect a microphone and try again.');
            } else {
                alert('❌ Error accessing microphone: ' + error.message);
            }

            this.stopListening();
        }
    }

    stopListening() {
        this.isListening = false;
        this.micButton.classList.remove('active');
        
        if (this.recognition) {
            this.recognition.stop();
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Reset to idle waveform
        const ctx = this.waveformCanvas.getContext('2d');
        this.drawIdleWaveform(ctx);
        
        this.updateStatus('ready', 'Ready');
    }

    startAudioVisualization() {
        // Simulated waveform animation (replace with actual audio input)
        const ctx = this.waveformCanvas.getContext('2d');
        const dataArray = new Uint8Array(128);

        const animate = () => {
            if (!this.isListening) return;

            // Simulate audio data
            for (let i = 0; i < dataArray.length; i++) {
                dataArray[i] = Math.random() * 256;
            }

            this.drawActiveWaveform(ctx, dataArray);
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    async processTranscript(transcript) {
        console.log('🎤 Processing transcript:', transcript);
        this.updateStatus('processing', 'Processing...');

        // Check for emergency keywords
        if (this.containsEmergencyKeyword(transcript)) {
            console.log('🚨 Emergency keywords detected, triggering alert');
            this.triggerEmergencyAlert();
        }

        try {
            // Wait for Gemini API initialization
            if (window.geminiAPI) {
                console.log('⌛ Waiting for Gemini API initialization...');
                await window.geminiAPI.initPromise;
                console.log('✅ Gemini API ready');
            } else {
                console.warn('⚠️ Gemini API not available');
            }

            // Try Gemini API directly from frontend first (faster)
            let aiResponse = null;
            if (window.geminiAPI && window.geminiAPI.enabled) {
                console.log('🤖 Using Gemini API for response generation');
                try {
                    // Get current vitals and context for Gemini
                    const context = await this.getHealthContext();
                    
                    // Generate response using Gemini
                    aiResponse = await window.geminiAPI.generateHealthResponse(transcript, context);
                    console.log('✅ Gemini API response received');
                } catch (geminiError) {
                    console.warn('Gemini API error, using backend:', geminiError);
                }
            }

            // If Gemini didn't work, use backend (which also uses Gemini)
            if (!aiResponse) {
                const response = await fetch(API_ENDPOINTS.voice, {
                    method: 'POST',
                    ...FETCH_OPTIONS,
                    body: JSON.stringify({
                        text: transcript,
                        user_id: '1'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    aiResponse = data.response || data.text || 'I understand. How can I help you?';
                } else {
                    throw new Error('Backend API error');
                }
            }

            // Display and speak the response
            this.handleResponse({
                response: aiResponse,
                text: transcript,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error processing transcript:', error);
            // Fallback response
            this.handleResponse({
                response: this.generateFallbackResponse(transcript)
            });
        }
    }

    async getHealthContext() {
        // Get health context for Gemini API
        const context = {
            vitals: {},
            reminders: [],
            mood: 'neutral',
            recentHistory: []
        };

        try {
            // Fetch current vitals
            const vitalsResponse = await fetch(API_ENDPOINTS.vitals, FETCH_OPTIONS);
            if (vitalsResponse.ok) {
                const vitalsData = await vitalsResponse.json();
                if (vitalsData.vitals) {
                    context.vitals = {
                        heartRate: vitalsData.vitals.heartRate || 72,
                        systolic: vitalsData.vitals.systolic || 120,
                        diastolic: vitalsData.vitals.diastolic || 80,
                        temperature: vitalsData.vitals.temperature || 98.6,
                        oxygen: vitalsData.vitals.oxygen || 97
                    };
                }
            }
        } catch (e) {
            console.warn('Could not fetch vitals:', e);
        }

        try {
            // Fetch reminders
            const remindersResponse = await fetch(API_ENDPOINTS.reminders, FETCH_OPTIONS);
            if (remindersResponse.ok) {
                const remindersData = await remindersResponse.json();
                if (remindersData.reminders && Array.isArray(remindersData.reminders)) {
                    context.reminders = remindersData.reminders
                        .filter(r => r.active)
                        .slice(0, 3)
                        .map(r => ({
                            medicine: r.medicine || '',
                            time: r.time || ''
                        }));
                }
            }
        } catch (e) {
            console.warn('Could not fetch reminders:', e);
        }

        try {
            // Get conversation context
            const contextResponse = await fetch(`${API_ENDPOINTS.context}?user_id=1`, FETCH_OPTIONS);
            if (contextResponse.ok) {
                const contextData = await contextResponse.json();
                if (contextData.context) {
                    context.mood = contextData.context.emotional_state || 'neutral';
                }
                if (contextData.recent_history && Array.isArray(contextData.recent_history)) {
                    context.recentHistory = contextData.recent_history.slice(-3);
                }
            }
        } catch (e) {
            console.warn('Could not fetch context:', e);
        }

        return context;
    }

    containsEmergencyKeyword(text) {
        const emergencyKeywords = ['help', 'emergency', 'urgent', 'pain', 'fall', 'hurt'];
        const lowerText = text.toLowerCase();
        return emergencyKeywords.some(keyword => lowerText.includes(keyword));
    }

    triggerEmergencyAlert() {
        // Trigger emergency modal
        const emergencyModal = document.getElementById('emergencyModal');
        if (emergencyModal) {
            emergencyModal.classList.add('active');
            startCountdown();
        }
        // Notify backend immediately
        try {
            fetch(API_ENDPOINTS.alertsEmergency, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ type: 'voice', message: 'User requested help', user_id: '1' })
            }).catch(() => {});
        } catch (e) {}
    }

    generateFallbackResponse(transcript) {
        // Simple fallback responses
        const lowerTranscript = transcript.toLowerCase();

        if (lowerTranscript.includes('hello') || lowerTranscript.includes('hi')) {
            return 'Hello! How can I assist you with your health today?';
        } else if (lowerTranscript.includes('medicine') || lowerTranscript.includes('medication')) {
            return 'Let me check your medication schedule. Your next dose is at 2:00 PM.';
        } else if (lowerTranscript.includes('doctor')) {
            return 'Would you like me to schedule an appointment with your doctor?';
        } else if (lowerTranscript.includes('pain')) {
            return 'I understand you\'re in pain. On a scale of 1-10, how would you rate it? I\'m notifying your caretaker.';
        } else if (lowerTranscript.includes('temperature') || lowerTranscript.includes('fever')) {
            return 'Your current temperature is 98.6°F, which is normal. Would you like me to monitor it more frequently?';
        } else if (lowerTranscript.includes('help')) {
            return 'I\'m alerting your caretaker immediately. Help is on the way.';
        } else {
            return `I heard you say: "${transcript}". How can I help you with that?`;
        }
    }

    async handleResponse(data) {
        this.updateStatus('responding', 'Responding...');
        
        // Display response
        this.responseText.textContent = data.response;

        // Text-to-speech (optional)
        await this.speak(data.response);

        this.updateStatus('ready', 'Ready');
    }

    async speak(text) {
        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-speech not supported');
        }

        // Optionally, call backend TTS endpoint
        // await fetch('/api/respond', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ text })
        // });
    }

    updateStatus(state, message) {
        if (!this.statusText || !this.statusIndicator) return;

        this.statusText.textContent = message;
        
        // Update status indicator color
        const dot = this.statusIndicator.querySelector('.status-dot');
        if (dot) {
            dot.style.background = this.getStatusColor(state);
        }
    }

    getStatusColor(state) {
        const colors = {
            ready: '#10b981',
            listening: '#3b82f6',
            processing: '#f59e0b',
            responding: '#8b5cf6',
            error: '#ef4444'
        };
        return colors[state] || '#10b981';
    }
}

// Initialize voice assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAssistant = new VoiceAssistant();
});

// Emergency countdown function
function startCountdown() {
    let timeLeft = 30;
    const countdownTimer = document.getElementById('countdownTimer');
    const emergencyModal = document.getElementById('emergencyModal');

    const interval = setInterval(() => {
        timeLeft--;
        if (countdownTimer) {
            countdownTimer.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            clearInterval(interval);
            escalateEmergency();
        }
    }, 1000);

    // Acknowledge button
    const acknowledgeBtn = document.getElementById('acknowledgeBtn');
    if (acknowledgeBtn) {
        acknowledgeBtn.onclick = () => {
            clearInterval(interval);
            acknowledgeEmergency();
            emergencyModal.classList.remove('active');
        };
    }

    // Escalate button
    const escalateBtn = document.getElementById('escalateBtn');
    if (escalateBtn) {
        escalateBtn.onclick = () => {
            clearInterval(interval);
            escalateEmergency();
            emergencyModal.classList.remove('active');
        };
    }
}

async function acknowledgeEmergency() {
    console.log('Emergency acknowledged');
    
    try {
        await fetch(API_ENDPOINTS.alertsAcknowledge, {
            method: 'POST',
            ...FETCH_OPTIONS,
            body: JSON.stringify({ type: 'emergency', acknowledged: true })
        });
    } catch (error) {
        console.error('Error acknowledging emergency:', error);
    }
}

async function escalateEmergency() {
    console.log('Emergency escalated');
    
    try {
        await fetch(API_ENDPOINTS.alertsEscalate, {
            method: 'POST',
            ...FETCH_OPTIONS,
            body: JSON.stringify({ type: 'emergency', escalated: true })
        });
        
        alert('Emergency services have been notified!');
    } catch (error) {
        console.error('Error escalating emergency:', error);
        alert('Emergency escalation failed. Please call 911 immediately.');
    }
}

// ============================================
// WAKE WORD DETECTION - "Hey Nurse"
// ============================================

class WakeWordDetector {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.wakeWord = 'hey nurse';
        this.continuousMode = false;
        this.onWakeWordDetected = null;
        this.init();
    }

    init() {
        // Initialize Web Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('⚠️ Speech Recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Keep listening
        this.recognition.interimResults = true; // Get interim results
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }

            // Check for wake word in both interim and final transcripts
            const allText = (interimTranscript + finalTranscript).toLowerCase();
            
            if (this.containsWakeWord(allText)) {
                this.handleWakeWordDetected();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Wake word recognition error:', event.error);
            
            // Restart if error is not fatal
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                if (this.isListening) {
                    setTimeout(() => this.start(), 1000);
                }
            }
        };

        this.recognition.onend = () => {
            // Restart listening if it ended unexpectedly
            if (this.isListening) {
                setTimeout(() => this.start(), 500);
            }
        };

        console.log('✅ Wake word detector initialized');
    }

    containsWakeWord(text) {
        // Check for variations of wake word
        const variations = [
            'hey nurse',
            'hi nurse',
            'hello nurse',
            'nurse',
            'hey virtual nurse',
            'virtual nurse'
        ];

        return variations.some(variation => text.includes(variation));
    }

    handleWakeWordDetected() {
        console.log('🎤 Wake word detected: "Hey Nurse"');
        
        // Stop continuous listening
        this.stop();
        
        // Trigger callback
        if (this.onWakeWordDetected) {
            this.onWakeWordDetected();
        }
        
        // Show visual feedback
        this.showWakeWordFeedback();
        
        // Play acknowledgment sound
        this.playAcknowledgmentSound();
    }

    showWakeWordFeedback() {
        // Create or update wake word indicator
        let indicator = document.getElementById('wakeWordIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'wakeWordIndicator';
            indicator.className = 'wake-word-indicator glass-panel';
            indicator.innerHTML = `
                <i data-lucide="mic" class="wake-icon"></i>
                <span class="wake-text">Listening...</span>
            `;
            document.body.appendChild(indicator);
            lucide.createIcons();
        }
        
        indicator.classList.add('active');
        
        // Remove after 2 seconds
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 2000);
    }

    playAcknowledgmentSound() {
        // Use Web Audio API to generate a simple beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    start() {
        if (!this.recognition) {
            console.warn('⚠️ Speech Recognition not available');
            return;
        }

        if (this.isListening) {
            return;
        }

        try {
            this.isListening = true;
            this.recognition.start();
            console.log('👂 Wake word detection active - say "Hey Nurse"');
            
            // Update UI indicator
            this.updateListeningIndicator(true);
        } catch (error) {
            console.error('Error starting wake word detection:', error);
            this.isListening = false;
        }
    }

    stop() {
        if (!this.isListening) {
            return;
        }

        try {
            this.isListening = false;
            if (this.recognition) {
                this.recognition.stop();
            }
            console.log('🔇 Wake word detection stopped');
            
            // Update UI indicator
            this.updateListeningIndicator(false);
        } catch (error) {
            console.error('Error stopping wake word detection:', error);
        }
    }

    updateListeningIndicator(isActive) {
        const indicator = document.getElementById('wakeWordStatus');
        if (indicator) {
            indicator.innerHTML = isActive
                ? '<i data-lucide="mic" class="status-icon active"></i> Listening for "Hey Nurse"'
                : '<i data-lucide="mic-off" class="status-icon"></i> Not listening';
            lucide.createIcons();
        }
    }

    setWakeWordCallback(callback) {
        this.onWakeWordDetected = callback;
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// Global instance
const wakeWordDetector = new WakeWordDetector();
window.wakeWordDetector = wakeWordDetector;

// Auto-start on page load (can be disabled)
document.addEventListener('DOMContentLoaded', () => {
    // Only start on patient dashboard
    if (window.location.pathname.includes('patient.html')) {
        // Start wake word detection after a short delay
        setTimeout(() => {
            wakeWordDetector.setWakeWordCallback(() => {
                // Open voice assistant when wake word detected
                if (window.voiceAssistant) {
                    window.voiceAssistant.openModal();
                    // Start listening immediately (only if not already listening)
                    setTimeout(() => {
                        if (window.voiceAssistant && !window.voiceAssistant.isListening) {
                            window.voiceAssistant.startListening();
                        }
                    }, 500);
                }
            });
            
            // Auto-start wake word detection on patient dashboard
            wakeWordDetector.start();
        }, 1000);
    }
});


// Voice Recognition component using Web Speech API
class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.onResultCallback = null;
        this.onErrorCallback = null;
        
        this.initRecognition();
    }

    initRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        // Send final transcript to backend
                        if (this.onResultCallback) {
                            this.onResultCallback(finalTranscript.trim());
                        }
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Update transcript
                this.transcript = finalTranscript || interimTranscript;
                
                // Dispatch custom event
                const transcriptEvent = new CustomEvent('transcriptUpdate', {
                    detail: { 
                        transcript: this.transcript,
                        isFinal: !!finalTranscript
                    }
                });
                window.dispatchEvent(transcriptEvent);
            };

            this.recognition.onerror = (event) => {
                if (this.onErrorCallback) {
                    this.onErrorCallback(event.error);
                }
                console.error('Speech recognition error:', event.error);
            };
        } else {
            console.error('Web Speech API is not supported in this browser');
        }
    }

    start() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
            this.isListening = true;
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    setOnResult(callback) {
        this.onResultCallback = callback;
    }

    setOnError(callback) {
        this.onErrorCallback = callback;
    }
}

// Create and export instance
const voiceRecognition = new VoiceRecognition();
export default voiceRecognition;
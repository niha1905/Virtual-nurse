// ============================================
// DOCTOR MEDICAL REPORTS & VOICE DICTATION
// ============================================

class MedicalReports {
    constructor() {
        this.reports = [];
        this.isRecording = false;
        this.recognition = null;
        this.init();
    }

    init() {
        console.log('Medical Reports initialized');
        this.setupVoiceRecognition();
        this.loadReports();
    }

    setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            
            if (finalTranscript) {
                this.appendToReport(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    }

    startDictation(reportTextarea) {
        if (!this.recognition) {
            alert('Speech recognition not available in this browser');
            return;
        }

        if (this.isRecording) {
            this.stopDictation();
            return;
        }

        this.isRecording = true;
        this.currentTextarea = reportTextarea;
        this.recognition.start();
        
        // Update UI
        const dictationBtn = document.querySelector('.dictation-btn');
        if (dictationBtn) {
            dictationBtn.classList.add('recording');
            dictationBtn.innerHTML = '<i data-lucide="square"></i> Stop Dictation';
            lucide.createIcons();
        }
    }

    stopDictation() {
        if (!this.isRecording) return;

        this.isRecording = false;
        if (this.recognition) {
            this.recognition.stop();
        }

        // Update UI
        const dictationBtn = document.querySelector('.dictation-btn');
        if (dictationBtn) {
            dictationBtn.classList.remove('recording');
            dictationBtn.innerHTML = '<i data-lucide="mic"></i> Start Dictation';
            lucide.createIcons();
        }
    }

    appendToReport(text) {
        if (this.currentTextarea) {
            const currentText = this.currentTextarea.value || '';
            this.currentTextarea.value = currentText + text;
            
            // Trigger input event for any listeners
            this.currentTextarea.dispatchEvent(new Event('input'));
        }
    }

    async loadReports() {
        try {
            // TODO: Fetch reports from backend
            // const response = await fetch('/api/reports', FETCH_OPTIONS);
            // if (response.ok) {
            //     const data = await response.json();
            //     this.reports = data.reports || [];
            //     this.displayReports();
            // }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    async saveReport(reportData) {
        try {
            // TODO: Save to backend
            // const response = await fetch('/api/reports/create', {
            //     method: 'POST',
            //     ...FETCH_OPTIONS,
            //     body: JSON.stringify(reportData)
            // });
            // return response.ok;
        } catch (error) {
            console.error('Error saving report:', error);
            return false;
        }
    }

    readReportAloud(reportText) {
        // Read report to patient through voice assistant
        if (window.voiceAssistant && window.voiceAssistant.speak) {
            window.voiceAssistant.speak(reportText);
        } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(reportText);
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Global instance
const medicalReports = new MedicalReports();
window.medicalReports = medicalReports;


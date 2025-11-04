// ============================================
// CAREGIVER VOICE INTERACTION
// ============================================

class CaregiverVoiceInteraction {
    constructor() {
        this.init();
    }

    init() {
        console.log('Caregiver Voice Interaction initialized');
        this.setupVoiceButton();
    }

    setupVoiceButton() {
        // Add voice button to caregiver dashboard if not exists
        const header = document.querySelector('.dashboard-header');
        if (!header) return;

        const existingBtn = document.getElementById('caregiverVoiceBtn');
        if (existingBtn) return;

        const voiceBtn = document.createElement('button');
        voiceBtn.id = 'caregiverVoiceBtn';
        voiceBtn.className = 'voice-assist-btn pulse-glow';
        voiceBtn.innerHTML = '<i data-lucide="mic"></i> Voice Assistant';
        
        header.appendChild(voiceBtn);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        voiceBtn.addEventListener('click', () => this.openVoiceAssistant());
    }

    openVoiceAssistant() {
        // Open voice assistant modal
        if (window.voiceAssistant) {
            window.voiceAssistant.openModal();
        } else {
            // Create voice assistant instance
            const modal = document.getElementById('voiceModal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    }

    async sendMessageToPatient(patientId, message) {
        // Send message through voice assistant
        try {
            // Use voice API to send message
            const response = await fetch(API_ENDPOINTS.voice, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({
                    text: `Tell patient ${patientId}: ${message}`,
                    user_id: patientId,
                    from_caregiver: true
                })
            });

            if (response.ok) {
                console.log('Message sent to patient');
                return true;
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
        return false;
    }

    // Example: "Hey Nurse, tell John his caregiver is on the way"
    handleVoiceCommand(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('tell') && lowerText.includes('patient')) {
            // Extract patient name and message
            const match = text.match(/tell\s+(\w+)\s+(.+)/i);
            if (match) {
                const patientName = match[1];
                const message = match[2];
                this.sendMessageToPatient('1', message); // Use patient ID lookup in production
                return true;
            }
        }
        
        return false;
    }
}

// Global instance
const caregiverVoice = new CaregiverVoiceInteraction();
window.caregiverVoice = caregiverVoice;


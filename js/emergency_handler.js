// Emergency Alert Handler
class EmergencyHandler {
    constructor() {
        this.emergencyPopup = null;
        this.countdownTimer = null;
        this.currentAlertId = null;
        this.currentPatientId = null;
        this.timeRemaining = 30;
        
        // Initialize emergency button
        const emergencyButton = document.getElementById('emergencyButton');
        if (emergencyButton) {
            emergencyButton.addEventListener('click', () => this.triggerEmergency('manual'));
        }
        
        // Start checking for emergency alerts
        this.startAlertPolling();
    }
    
    async triggerEmergency(source) {
        try {
            const patientId = sessionStorage.getItem('userId') || '1'; // Get current user ID
            this.currentPatientId = String(patientId);
            // First get the latest vitals
            const vitalsResp = await fetch('/api/vitals/latest?patient_id=' + patientId);
            const vitalsData = vitalsResp.ok ? await vitalsResp.json() : null;
            
            const response = await fetch('/api/alerts/emergency', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: patientId,
                    source: source,
                    confirmed: false,
                    vitals: vitalsData ? vitalsData.vitals : null
                })
            });
            
            const data = await response.json();
            if (data.success && data.requiresConfirmation) {
                this.showEmergencyConfirmation(data.alertId, data.timeRemaining);
            }
        } catch (error) {
            console.error('Error triggering emergency:', error);
            this.showError('Failed to trigger emergency alert');
        }
    }
    
    showEmergencyConfirmation(alertId, seconds) {
        // Create popup if it doesn't exist
        if (!this.emergencyPopup) {
            this.emergencyPopup = document.createElement('div');
            this.emergencyPopup.className = 'emergency-popup';
            document.body.appendChild(this.emergencyPopup);
        }
        
        this.currentAlertId = alertId;
        this.timeRemaining = seconds || 30;
        
        // Update popup content
        this.emergencyPopup.innerHTML = `
            <div class="emergency-content">
                <h2>⚠️ Emergency Alert</h2>
                <p>Are you okay? Please respond within <span id="countdown">${this.timeRemaining}</span> seconds</p>
                <div class="emergency-buttons">
                    <button class="btn-ok" onclick="emergencyHandler.confirmOkay()">I'm Okay</button>
                    <button class="btn-help" onclick="emergencyHandler.confirmNeedHelp()">I Need Help</button>
                </div>
            </div>
        `;
        
        // Show popup
        this.emergencyPopup.style.display = 'flex';
        
        // Start countdown
        this.startCountdown();
        
        // Play alert sound
        this.playAlertSound();
    }
    
    startCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        const countdownElement = document.getElementById('countdown');
        this.countdownTimer = setInterval(() => {
            this.timeRemaining--;
            if (countdownElement) {
                countdownElement.textContent = this.timeRemaining;
            }
            
            if (this.timeRemaining <= 0) {
                clearInterval(this.countdownTimer);
                this.handleNoResponse();
            }
        }, 1000);
    }
    
    async confirmOkay() {
        if (this.currentAlertId) {
            try {
                const response = await fetch('/api/alerts/acknowledge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        alert_id: this.currentAlertId,
                        status: 'resolved'
                    })
                });
                
                if (response.ok) {
                    this.hideEmergencyPopup();
                }
            } catch (error) {
                console.error('Error acknowledging alert:', error);
            }
        }
        this.hideEmergencyPopup();
    }
    
    async confirmNeedHelp() {
        if (this.currentAlertId) {
            try {
                await fetch('/api/alerts/emergency', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        alert_id: this.currentAlertId,
                        patient_id: this.currentPatientId || sessionStorage.getItem('userId') || '1',
                        source: 'manual',
                        confirmed: true
                    })
                });
                
                this.hideEmergencyPopup();
                this.showMessage('Emergency services have been notified. Help is on the way.', 'critical');
                this.showCallAmbulancePopup();
            } catch (error) {
                console.error('Error confirming emergency:', error);
            }
        }
    }
    
    async handleNoResponse() {
        if (this.currentAlertId) {
            try {
                await fetch('/api/alerts/emergency', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        alert_id: this.currentAlertId,
                        patient_id: this.currentPatientId || sessionStorage.getItem('userId') || '1',
                        source: 'manual',
                        confirmed: true
                    })
                });
                
                this.hideEmergencyPopup();
                this.showMessage('No response received. Emergency services have been notified.', 'critical');
                this.showCallAmbulancePopup();
            } catch (error) {
                console.error('Error handling no response:', error);
            }
        }
    }

    showCallAmbulancePopup() {
        const modal = document.createElement('div');
        modal.className = 'emergency-call-modal';
        modal.innerHTML = `
            <div class="modal-content glass-panel">
                <button class="modal-close" aria-label="Close" title="Close" onclick="this.closest('.emergency-call-modal').remove()">
                    <i data-lucide="x"></i>
                </button>
                <div class="call-ambulance">
                    <i data-lucide="phone-call" class="big"></i>
                    <h2>Call Ambulance</h2>
                    <p>Emergency services have been notified. If the patient is unresponsive, call your local emergency number now.</p>
                    <div class="actions">
                        <a href="tel:112" class="btn-primary">Call 112</a>
                        <a href="tel:911" class="btn-secondary">Call 911</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) {}
        }
    }
    
    hideEmergencyPopup() {
        if (this.emergencyPopup) {
            this.emergencyPopup.style.display = 'none';
        }
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        this.stopAlertSound();
    }
    
    playAlertSound() {
        const alertSound = new Audio('/assets/audio/emergency_alert.mp3');
        alertSound.loop = true;
        alertSound.play().catch(error => {
            console.warn('Could not play alert sound:', error);
        });
        this.currentAlertSound = alertSound;
    }
    
    stopAlertSound() {
        if (this.currentAlertSound) {
            this.currentAlertSound.pause();
            this.currentAlertSound = null;
        }
    }
    
    startAlertPolling() {
        // Poll for new emergency alerts every 5 seconds
        setInterval(async () => {
            if (!this.currentAlertId) { // Only check if no active alert
                try {
                    const response = await fetch('/api/alerts?type=emergency&unacknowledged=true');
                    const data = await response.json();
                    
                    if (data.success && data.alerts && data.alerts.length > 0) {
                        const latestAlert = data.alerts[0];
                        if (latestAlert.requiresConfirmation && !latestAlert.confirmed) {
                            this.showEmergencyConfirmation(
                                latestAlert.id,
                                30 - Math.floor((new Date() - new Date(latestAlert.timestamp)) / 1000)
                            );
                        }
                    }
                } catch (error) {
                    console.error('Error polling for alerts:', error);
                }
            }
        }, 5000);
    }
    
    showMessage(message, type = 'info') {
        // Create or get message container
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Add to container
        messageContainer.appendChild(messageElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize emergency handler when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyHandler = new EmergencyHandler();
});
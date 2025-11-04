// ============================================
// MEDICATION REMINDERS MODULE
// ============================================

class MedicationReminders {
    constructor() {
        this.reminders = [];
        this.nextReminder = null;
        this.currentPatientId = this.resolveCurrentPatientId();
        this.init();
    }

    init() {
        console.log('Medication Reminders initialized');
        this.loadReminders();
        this.setupEventListeners();
        this.startReminderCheck();
    }

    setupEventListeners() {
        // Taken button
        const takenBtn = document.getElementById('medicationTakenBtn');
        if (takenBtn) {
            takenBtn.addEventListener('click', () => this.markAsTaken());
        }

        // Remind Later button
        const remindLaterBtn = document.getElementById('medicationRemindLaterBtn');
        if (remindLaterBtn) {
            remindLaterBtn.addEventListener('click', () => this.remindLater());
        }

        // View All button
        const viewAllBtn = document.getElementById('viewAllMedications');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.showAllMedications());
        }
    }

    async loadReminders() {
        try {
            const url = this.buildRemindersUrl();
            const response = await fetch(url, FETCH_OPTIONS);
            if (response.ok) {
                const data = await response.json();
                this.reminders = Array.isArray(data) ? data : (data.reminders || []);
                this.updateNextReminder();
                this.displayNextReminder();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    }

    resolveCurrentPatientId() {
        try {
            // 1) URL query param takes precedence (patient.html?patient_id=XYZ)
            const params = new URLSearchParams(window.location.search);
            const fromQuery = params.get('patient_id');
            if (fromQuery) return String(fromQuery);
            // 2) sessionStorage (set elsewhere when navigating as a patient)
            const fromSession = sessionStorage.getItem('userId');
            if (fromSession) return String(fromSession);
            // 3) fallback default
            return '1';
        } catch (e) {
            return '1';
        }
    }

    buildRemindersUrl() {
        const base = API_ENDPOINTS.reminders;
        const delimiter = base.includes('?') ? '&' : '?';
        const pid = encodeURIComponent(this.currentPatientId || '1');
        return `${base}${delimiter}patient_id=${pid}`;
    }

    updateNextReminder() {
        const now = new Date();
        const activeReminders = this.reminders
            .filter(r => r.active && !r.taken)
            .sort((a, b) => {
                const timeA = this.parseTime(a.time);
                const timeB = this.parseTime(b.time);
                return timeA - timeB;
            });

        this.nextReminder = activeReminders.length > 0 ? activeReminders[0] : null;
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        if (time < now) {
            time.setDate(time.getDate() + 1);
        }
        return time;
    }

    displayNextReminder() {
        const card = document.getElementById('nextMedicationCard');
        const actions = document.getElementById('medicationActions');

        if (!card) return;

        if (!this.nextReminder) {
            card.innerHTML = `
                <div class="no-medication">
                    <i data-lucide="check-circle"></i>
                    <p>No upcoming medications scheduled</p>
                </div>
            `;
            if (actions) actions.style.display = 'none';
            lucide.createIcons();
            return;
        }

        const timeUntil = this.getTimeUntil(this.nextReminder.time);
        
        card.innerHTML = `
            <div class="medication-info">
                <div class="medication-icon">
                    <i data-lucide="pill"></i>
                </div>
                <div class="medication-details">
                    <h3 class="medication-name">${this.nextReminder.medicine}</h3>
                    <p class="medication-dosage">${this.nextReminder.dosage || 'As prescribed'}</p>
                    <div class="medication-time">
                        <i data-lucide="clock"></i>
                        <span>${this.nextReminder.time}</span>
                        <span class="time-until">${timeUntil}</span>
                    </div>
                </div>
            </div>
        `;

        if (actions) {
            actions.style.display = 'flex';
        }

        lucide.createIcons();

        // Check if it's time for reminder
        if (this.isTimeForReminder(this.nextReminder)) {
            this.triggerVoiceReminder();
        }
    }

    getTimeUntil(timeString) {
        const time = this.parseTime(timeString);
        const now = new Date();
        const diff = time - now;

        if (diff < 0) {
            return 'Overdue';
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `in ${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `in ${minutes} minutes`;
        } else {
            return 'Now';
        }
    }

    isTimeForReminder(reminder) {
        const time = this.parseTime(reminder.time);
        const now = new Date();
        const diff = time - now;
        
        // Trigger 5 minutes before and up to 30 minutes after
        return diff <= 5 * 60 * 1000 && diff >= -30 * 60 * 1000;
    }

    triggerVoiceReminder() {
        if (!this.nextReminder) return;

        const message = `Time to take your medication: ${this.nextReminder.medicine} ${this.nextReminder.dosage || ''}`;
        
        // Use voice assistant to speak
        if (window.voiceAssistant && window.voiceAssistant.speak) {
            window.voiceAssistant.speak(message);
        } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            window.speechSynthesis.speak(utterance);
        }

        // Show notification
        this.showReminderNotification();
    }

    showReminderNotification() {
        const notification = document.createElement('div');
        notification.className = 'medication-notification glass-panel fade-in-up';
        notification.innerHTML = `
            <div class="notification-content">
                <i data-lucide="bell" class="notification-icon"></i>
                <div class="notification-text">
                    <strong>Medication Reminder</strong>
                    <p>${this.nextReminder.medicine} - ${this.nextReminder.time}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        lucide.createIcons();

        setTimeout(() => {
            notification.remove();
        }, 10000);
    }

    async markAsTaken() {
        if (!this.nextReminder) return;

        try {
            const response = await fetch(API_ENDPOINTS.remindersTaken, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({
                    reminderId: this.nextReminder.id
                })
            });

            if (response.ok) {
                this.showMessage('Medication marked as taken', 'success');
                await this.loadReminders();
            } else {
                throw new Error('Failed to mark as taken');
            }
        } catch (error) {
            console.error('Error marking as taken:', error);
            this.showMessage('Error marking medication. Please try again.', 'error');
        }
    }

    async remindLater() {
        if (!this.nextReminder) return;

        // Remind again in 10 minutes
        const remindTime = new Date(Date.now() + 10 * 60 * 1000);
        const timeString = `${remindTime.getHours()}:${String(remindTime.getMinutes()).padStart(2, '0')}`;

        this.showMessage(`I'll remind you again at ${timeString}`, 'info');
        
        // Schedule reminder
        setTimeout(() => {
            if (this.nextReminder && !this.nextReminder.taken) {
                this.triggerVoiceReminder();
            }
        }, 10 * 60 * 1000);
    }

    showAllMedications() {
        // Could open a modal or navigate to full schedule
        console.log('Showing all medications');
        // TODO: Implement full medication schedule view
    }

    startReminderCheck() {
        // Check every minute for upcoming reminders
        setInterval(() => {
            this.updateNextReminder();
            this.displayNextReminder();
        }, 60000); // Check every minute
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type} fade-in-up`;
        messageEl.textContent = message;
        
        const container = document.querySelector('.dashboard-container') || document.body;
        container.insertBefore(messageEl, container.firstChild);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Global instance
const medicationReminders = new MedicationReminders();
window.medicationReminders = medicationReminders;


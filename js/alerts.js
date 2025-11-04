// ============================================
// ALERTS MODULE
// ============================================

class AlertsManager {
    constructor() {
        this.alerts = [];
        this.init();
    }

    init() {
        console.log('Alerts manager initialized');
        this.startMonitoring();
    }

    startMonitoring() {
        // Poll for alerts every 5 seconds
        setInterval(() => {
            this.checkAlerts();
        }, 5000);
    }

    async checkAlerts() {
        try {
            const response = await fetch(API_ENDPOINTS.alerts, {
                ...FETCH_OPTIONS
            });
            
            if (response.ok) {
                const alerts = await response.json();
                this.processAlerts(alerts);
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }

    processAlerts(alerts) {
        alerts.forEach(alert => {
            if (!this.alerts.find(a => a.id === alert.id)) {
                this.showNotification(alert);
                this.alerts.push(alert);
            }
        });
    }

    showNotification(alert) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert-notification alert-${alert.priority}`;
        notification.innerHTML = `
            <div class="alert-notification-content">
                <i data-lucide="alert-circle"></i>
                <div class="alert-notification-text">
                    <strong>${alert.type.toUpperCase()}</strong>
                    <p>${alert.message}</p>
                </div>
            </div>
            <button class="alert-notification-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.remove();
        }, 10000);

        // Play alert sound (optional)
        this.playAlertSound(alert.priority);
    }

    playAlertSound(priority) {
        // Placeholder for alert sound
        // You can add audio files and play them here
        if ('AudioContext' in window) {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = priority === 'high' ? 800 : 400;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    async acknowledgeAlert(alertId) {
        try {
            const response = await fetch(API_ENDPOINTS.alertsAcknowledge, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ alertId })
            });

            if (response.ok) {
                console.log('Alert acknowledged:', alertId);
                this.removeAlert(alertId);
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    }

    removeAlert(alertId) {
        this.alerts = this.alerts.filter(a => a.id !== alertId);
    }
}

// Medicine Reminder System
class ReminderSystem {
    constructor() {
        this.reminders = [];
        this.init();
    }

    init() {
        console.log('Reminder system initialized');
        this.loadReminders();
        this.startMonitoring();
    }

    async loadReminders() {
        try {
            const response = await fetch(API_ENDPOINTS.reminders, {
                ...FETCH_OPTIONS
            });
            
            if (response.ok) {
                this.reminders = await response.json();
                this.scheduleReminders();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            // Use default reminders
            this.reminders = this.getDefaultReminders();
            this.scheduleReminders();
        }
    }

    getDefaultReminders() {
        return [
            {
                id: 1,
                medicine: 'Aspirin',
                dosage: '100mg',
                time: '08:00',
                frequency: 'daily'
            },
            {
                id: 2,
                medicine: 'Metformin',
                dosage: '500mg',
                time: '12:00',
                frequency: 'twice-daily'
            }
        ];
    }

    scheduleReminders() {
        this.reminders.forEach(reminder => {
            const reminderTime = this.parseTime(reminder.time);
            const now = new Date();
            const scheduledTime = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                reminderTime.hours,
                reminderTime.minutes
            );

            if (scheduledTime > now) {
                const delay = scheduledTime - now;
                setTimeout(() => {
                    this.triggerReminder(reminder);
                }, delay);
            }
        });
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return { hours, minutes };
    }

    triggerReminder(reminder) {
        this.showReminderNotification(reminder);
        this.playReminderSound();
    }

    showReminderNotification(reminder) {
        const notification = document.createElement('div');
        notification.className = 'reminder-notification';
        notification.innerHTML = `
            <div class="reminder-notification-content">
                <i data-lucide="pill"></i>
                <div class="reminder-notification-text">
                    <strong>Medicine Reminder</strong>
                    <p>${reminder.medicine} - ${reminder.dosage}</p>
                    <p class="reminder-time">Time: ${reminder.time}</p>
                </div>
            </div>
            <div class="reminder-notification-actions">
                <button class="reminder-taken-btn" onclick="reminderTaken(${reminder.id})">
                    <i data-lucide="check"></i>
                    Taken
                </button>
                <button class="reminder-snooze-btn" onclick="reminderSnooze(${reminder.id})">
                    <i data-lucide="clock"></i>
                    Snooze
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    playReminderSound() {
        // Placeholder for reminder sound
        if ('AudioContext' in window) {
            const audioContext = new AudioContext();
            
            // Create a pleasant notification sound
            [0, 0.2, 0.4].forEach((time, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 600 + (index * 100);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.3);

                oscillator.start(audioContext.currentTime + time);
                oscillator.stop(audioContext.currentTime + time + 0.3);
            });
        }
    }

    startMonitoring() {
        // Check every minute for reminders
        setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            this.reminders.forEach(reminder => {
                if (reminder.time === currentTime && !reminder.triggered) {
                    this.triggerReminder(reminder);
                    reminder.triggered = true;
                }
            });
        }, 60000); // Check every minute
    }

    async markReminderTaken(reminderId) {
        try {
            await fetch(API_ENDPOINTS.remindersTaken, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ reminderId })
            });

            console.log('Reminder marked as taken:', reminderId);
        } catch (error) {
            console.error('Error marking reminder:', error);
        }
    }

    snoozeReminder(reminderId, minutes = 10) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (reminder) {
            setTimeout(() => {
                this.triggerReminder(reminder);
            }, minutes * 60 * 1000);
        }
    }
}

// Global functions for reminder actions
window.reminderTaken = function(reminderId) {
    const notification = event.target.closest('.reminder-notification');
    if (notification) {
        notification.remove();
    }
    
    if (window.reminderSystem) {
        window.reminderSystem.markReminderTaken(reminderId);
    }
};

window.reminderSnooze = function(reminderId) {
    const notification = event.target.closest('.reminder-notification');
    if (notification) {
        notification.remove();
    }
    
    if (window.reminderSystem) {
        window.reminderSystem.snoozeReminder(reminderId, 10);
    }
};

// Initialize systems
document.addEventListener('DOMContentLoaded', () => {
    window.alertsManager = new AlertsManager();
    window.reminderSystem = new ReminderSystem();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .alert-notification,
    .reminder-notification {
        position: fixed;
        top: 100px;
        right: 20px;
        max-width: 400px;
        background: var(--bg-glass);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: notification-slide 0.4s ease;
    }

    .alert-notification.alert-high {
        border-left: 4px solid var(--danger);
    }

    .alert-notification.alert-medium {
        border-left: 4px solid var(--warning);
    }

    .alert-notification.alert-low {
        border-left: 4px solid var(--accent);
    }

    .alert-notification-content,
    .reminder-notification-content {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .alert-notification-content i,
    .reminder-notification-content i {
        width: 24px;
        height: 24px;
        color: var(--primary);
        flex-shrink: 0;
    }

    .alert-notification-text,
    .reminder-notification-text {
        flex: 1;
    }

    .alert-notification-text strong,
    .reminder-notification-text strong {
        display: block;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    .alert-notification-text p,
    .reminder-notification-text p {
        margin: 0.25rem 0;
        color: var(--text-secondary);
    }

    .reminder-time {
        font-size: 0.9rem;
        color: var(--text-light);
    }

    .alert-notification-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .alert-notification-close:hover {
        background: rgba(239, 68, 68, 0.2);
        color: var(--danger);
    }

    .reminder-notification-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .reminder-taken-btn,
    .reminder-snooze-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: none;
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reminder-taken-btn {
        background: rgba(16, 185, 129, 0.2);
        color: var(--accent);
        flex: 1;
    }

    .reminder-taken-btn:hover {
        background: var(--accent);
        color: white;
    }

    .reminder-snooze-btn {
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary);
    }

    .reminder-snooze-btn:hover {
        background: var(--primary);
        color: white;
    }
`;
document.head.appendChild(style);

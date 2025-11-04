// ============================================
// DAILY SUMMARIES MODULE
// ============================================

class DailySummaries {
    constructor() {
        this.currentSummary = null;
        this.init();
    }

    init() {
        console.log('Daily Summaries module initialized');
        
        // Check time of day and show appropriate summary
        this.checkTimeAndShowSummary();
        
        // Set up event listeners
        this.setupEventListeners();
        // Load auto-summary preference
        try {
            const pref = localStorage.getItem('autoSummaryEnabled');
            const autoSummaryToggle = document.getElementById('autoSummaryToggle');
            if (autoSummaryToggle && pref === 'true') {
                autoSummaryToggle.checked = true;
                this.toggleAutoSummary(true);
            }
        } catch (e) {
            console.warn('Could not read auto-summary preference', e);
        }
    }

    setupEventListeners() {
        // Morning summary button
        const morningBtn = document.getElementById('getMorningSummary');
        if (morningBtn) {
            morningBtn.addEventListener('click', () => this.getMorningSummary());
        }

        // Evening summary button
        const eveningBtn = document.getElementById('getEveningSummary');
        if (eveningBtn) {
            eveningBtn.addEventListener('click', () => this.getEveningSummary());
        }

        // Auto-summary toggle
        const autoSummaryToggle = document.getElementById('autoSummaryToggle');
        if (autoSummaryToggle) {
            autoSummaryToggle.addEventListener('change', (e) => {
                this.toggleAutoSummary(e.target.checked);
            });
        }
    }

    checkTimeAndShowSummary() {
        const hour = new Date().getHours();
        const isMorning = hour >= 6 && hour < 12;
        const isEvening = hour >= 18 && hour < 22;

        // Auto-show summary if within time windows
        if (isMorning) {
            // Show morning summary suggestion
            this.showSummarySuggestion('morning');
        } else if (isEvening) {
            // Show evening summary suggestion
            this.showSummarySuggestion('evening');
        }
    }

    showSummarySuggestion(type) {
        const suggestionDiv = document.getElementById('summarySuggestion');
        if (!suggestionDiv) return;

        suggestionDiv.innerHTML = `
            <div class="summary-suggestion glass-panel fade-in-up">
                <i data-lucide="${type === 'morning' ? 'sunrise' : 'moon'}"></i>
                <div class="suggestion-content">
                    <h3>${type === 'morning' ? 'Good Morning!' : 'Good Evening!'}</h3>
                    <p>Would you like to hear your ${type} health summary?</p>
                    <button class="btn-primary" onclick="dailySummaries.get${type.charAt(0).toUpperCase() + type.slice(1)}Summary()">
                        Get ${type === 'morning' ? 'Morning' : 'Evening'} Summary
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    async getMorningSummary(userId = '1') {
        try {
            this.showLoading('Fetching your morning health summary...');

            const response = await fetch(`${API_ENDPOINTS.summaryMorning}?user_id=${userId}`, {
                ...FETCH_OPTIONS
            });

            if (response.ok) {
                const data = await response.json();
                this.displaySummary(data, 'morning');
                
                // Speak the summary
                if (data.summary) {
                    this.speakSummary(data.summary);
                }
            } else {
                this.showError('Failed to fetch morning summary');
            }
        } catch (error) {
            console.error('Error fetching morning summary:', error);
            this.showError('Error fetching summary. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async getEveningSummary(userId = '1') {
        try {
            this.showLoading('Fetching your evening health summary...');

            const response = await fetch(`${API_ENDPOINTS.summaryEvening}?user_id=${userId}`, {
                ...FETCH_OPTIONS
            });

            if (response.ok) {
                const data = await response.json();
                this.displaySummary(data, 'evening');
                
                // Speak the summary
                if (data.summary) {
                    this.speakSummary(data.summary);
                }
            } else {
                this.showError('Failed to fetch evening summary');
            }
        } catch (error) {
            console.error('Error fetching evening summary:', error);
            this.showError('Error fetching summary. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displaySummary(data, type) {
        const summarySection = document.querySelector('.summary-section');
        if (!summarySection) return;

        // Clear previous summary suggestion
        const suggestionDiv = document.getElementById('summarySuggestion');
        if (suggestionDiv) {
            suggestionDiv.innerHTML = '';
        }

        const summaryCard = document.createElement('div');
        summaryCard.id = 'summaryCard';
        summaryCard.className = 'summary-card glass-panel fade-in-up';
        
        summaryCard.innerHTML = `
            <div class="summary-header">
                <i data-lucide="${type === 'morning' ? 'sunrise' : 'moon'}" class="summary-icon"></i>
                <h2>${type === 'morning' ? 'Morning' : 'Evening'} Health Summary</h2>
                <span class="summary-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="summary-content">
                <p class="summary-text">${data.summary || 'No summary available'}</p>
                
                ${data.vitals ? `
                    <div class="summary-vitals">
                        <h3>Current Vitals</h3>
                        <div class="vitals-mini">
                            ${data.vitals.heartRate ? `<span>❤️ Heart Rate: ${data.vitals.heartRate} BPM</span>` : ''}
                            ${data.vitals.temperature ? `<span>🌡️ Temperature: ${data.vitals.temperature}°F</span>` : ''}
                            ${data.vitals.oxygen ? `<span>💨 Oxygen: ${data.vitals.oxygen}%</span>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${data.reminders_count !== undefined ? `
                    <div class="summary-reminders">
                        <i data-lucide="bell"></i>
                        <span>${data.reminders_count} medication reminder${data.reminders_count !== 1 ? 's' : ''} today</span>
                    </div>
                ` : ''}
                
                ${data.alerts_count !== undefined ? `
                    <div class="summary-alerts ${data.alerts_count > 0 ? 'has-alerts' : ''}">
                        <i data-lucide="${data.alerts_count > 0 ? 'alert-triangle' : 'check-circle'}"></i>
                        <span>${data.alerts_count} active alert${data.alerts_count !== 1 ? 's' : ''}</span>
                    </div>
                ` : ''}
            </div>
            <div class="summary-actions">
                <button class="btn-secondary" onclick="dailySummaries.speakSummary('${data.summary.replace(/'/g, "\\'")}')">
                    <i data-lucide="volume-2"></i> Replay
                </button>
                <button class="btn-secondary" onclick="dailySummaries.closeSummary()">
                    <i data-lucide="x"></i> Close
                </button>
            </div>
        `;
        
        summarySection.appendChild(summaryCard);
        lucide.createIcons();
        this.currentSummary = data;
    }

    createSummaryContainer() {
        const body = document.body;
        const container = document.createElement('div');
        container.id = 'summaryContainer';
        container.className = 'summary-container';
        body.appendChild(container);
    }

    speakSummary(text) {
        if ('speechSynthesis' in window) {
            // Stop any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            window.speechSynthesis.speak(utterance);
        }
    }

    closeSummary() {
        const summaryCard = document.getElementById('summaryCard');
        if (summaryCard) {
            summaryCard.remove();
        }
        
        // Stop any ongoing speech
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    showLoading(message) {
        const loadingDiv = document.getElementById('summaryLoading');
        if (!loadingDiv) {
            const div = document.createElement('div');
            div.id = 'summaryLoading';
            div.className = 'loading-indicator glass-panel';
            div.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i><span>${message}</span>`;
            document.body.appendChild(div);
            lucide.createIcons();
        } else {
            loadingDiv.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i><span>${message}</span>`;
            loadingDiv.style.display = 'block';
            lucide.createIcons();
        }
    }

    hideLoading() {
        const loadingDiv = document.getElementById('summaryLoading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error fade-in-up';
        errorDiv.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
        
        const container = document.querySelector('.dashboard-container') || document.body;
        container.insertBefore(errorDiv, container.firstChild);
        
        lucide.createIcons();
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    toggleAutoSummary(enabled) {
        localStorage.setItem('autoSummaryEnabled', enabled);
        
        if (enabled) {
            // Set up scheduled summaries
            this.scheduleSummaries();
        } else {
            // Clear scheduled summaries
            if (this.morningSchedule) clearInterval(this.morningSchedule);
            if (this.eveningSchedule) clearInterval(this.eveningSchedule);
        }
    }

    scheduleSummaries() {
        // Morning summary at 8 AM
        // Evening summary at 8 PM
        // This is a simplified version - in production, use proper scheduling
        console.log('Auto-summary scheduling enabled');
    }
}

// Global instance
const dailySummaries = new DailySummaries();
window.dailySummaries = dailySummaries;


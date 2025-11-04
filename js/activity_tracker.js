// ============================================
// ACTIVITY & SLEEP TRACKER (Google Health)
// ============================================

class ActivityTracker {
    constructor() {
        this.stepsData = [];
        this.sleepData = [];
        this.currentPeriod = 'week';
        this.init();
    }

    init() {
        console.log('Activity Tracker initialized');
        this.setupEventListeners();
        this.loadActivityData();
        this.startAutoUpdate();
    }

    setupEventListeners() {
        // Period toggle buttons
        const toggleBtns = document.querySelectorAll('.toggle-btn[data-period]');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.getAttribute('data-period');
                this.switchPeriod(period);
            });
        });
    }

    switchPeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-period') === period) {
                btn.classList.add('active');
            }
        });

        this.loadActivityData();
    }

    async loadActivityData() {
        try {
            // Try to get from Google Health
            if (window.googleHealthSync && window.googleHealthSync.isAuthenticated) {
                const response = await fetch(API_ENDPOINTS.healthRetrieve, FETCH_OPTIONS);
                if (response.ok) {
                    const data = await response.json();
                    this.processHealthData(data);
                }
            } else {
                // Use sample data or backend vitals
                this.loadSampleData();
            }
        } catch (error) {
            console.error('Error loading activity data:', error);
            this.loadSampleData();
        }
    }

    processHealthData(data) {
        // Process steps data
        if (data.steps) {
            this.stepsData = data.steps;
            this.updateStepsDisplay();
        }

        // Process sleep data
        if (data.sleep) {
            this.sleepData = data.sleep;
            this.updateSleepDisplay();
        }

        this.updateCharts();
    }

    loadSampleData() {
        // Generate sample data for demonstration
        const days = this.currentPeriod === 'week' ? 7 : 30;
        const today = new Date();
        
        this.stepsData = Array.from({ length: days }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - 1 - i));
            return {
                date: date.toISOString().split('T')[0],
                steps: Math.floor(Math.random() * 5000) + 5000
            };
        });

        this.sleepData = Array.from({ length: days }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - 1 - i));
            return {
                date: date.toISOString().split('T')[0],
                hours: Math.floor(Math.random() * 2) + 6.5
            };
        });

        this.updateStepsDisplay();
        this.updateSleepDisplay();
        this.updateCharts();
    }

    updateStepsDisplay() {
        const stepsEl = document.getElementById('stepsCount');
        const trendEl = document.getElementById('stepsTrend');

        if (this.stepsData.length === 0) return;

        const todaySteps = this.stepsData[this.stepsData.length - 1].steps || 0;
        const yesterdaySteps = this.stepsData.length > 1 ? this.stepsData[this.stepsData.length - 2].steps : todaySteps;
        const change = todaySteps - yesterdaySteps;
        const percentChange = yesterdaySteps > 0 ? ((change / yesterdaySteps) * 100).toFixed(1) : 0;

        if (stepsEl) {
            stepsEl.textContent = todaySteps.toLocaleString();
        }

        if (trendEl) {
            const isPositive = change >= 0;
            trendEl.innerHTML = `
                <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i>
                <span>${Math.abs(percentChange)}%</span>
            `;
            trendEl.className = `activity-trend ${isPositive ? 'positive' : 'negative'}`;
            lucide.createIcons();
        }
    }

    updateSleepDisplay() {
        const sleepEl = document.getElementById('sleepHours');
        const trendEl = document.getElementById('sleepTrend');

        if (this.sleepData.length === 0) return;

        const lastNight = this.sleepData[this.sleepData.length - 1].hours || 0;
        const previousNight = this.sleepData.length > 1 ? this.sleepData[this.sleepData.length - 2].hours : lastNight;
        const change = lastNight - previousNight;

        if (sleepEl) {
            sleepEl.innerHTML = `${lastNight.toFixed(1)}<span class="unit">hrs</span>`;
        }

        if (trendEl) {
            const isPositive = change >= 0;
            trendEl.innerHTML = `
                <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i>
                <span>${Math.abs(change).toFixed(1)}hrs</span>
            `;
            trendEl.className = `activity-trend ${isPositive ? 'positive' : 'negative'}`;
            lucide.createIcons();
        }
    }

    updateCharts() {
        const canvas = document.getElementById('activityChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.stepsData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Steps',
                        data: this.stepsData.map(d => d.steps),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Sleep (hours)',
                        data: this.sleepData.map(d => d.hours * 1000), // Scale for visibility
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Steps'
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Sleep (hours)'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value / 1000).toFixed(1) + 'h';
                            }
                        }
                    }
                }
            }
        });
    }

    startAutoUpdate() {
        // Update every 5 minutes
        setInterval(() => {
            this.loadActivityData();
        }, 5 * 60 * 1000);
    }
}

// Global instance
const activityTracker = new ActivityTracker();
window.activityTracker = activityTracker;


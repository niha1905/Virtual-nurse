// ============================================
// DASHBOARD MODULE
// ============================================

class Dashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = null;
        this.init();
    }

    init() {
        console.log('Dashboard initialized');
    }

    // Create chart with default options
    createChart(ctx, type, data, options = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: options.showLegend !== false,
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim()
                    }
                }
            },
            scales: type !== 'pie' && type !== 'doughnut' && type !== 'radar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color').trim()
                    }
                }
            } : {}
        };

        return new Chart(ctx, {
            type,
            data,
            options: { ...defaultOptions, ...options }
        });
    }

    // Simulate real-time data update
    updateVital(elementId, value, unit = '') {
        const element = document.getElementById(elementId);
        if (element) {
            const valueSpan = element.querySelector('.value');
            if (valueSpan) {
                valueSpan.textContent = value;
            }
        }
    }

    // Generate random vital signs
    generateVitals() {
        return {
            heartRate: Math.floor(Math.random() * 30) + 60, // 60-90 BPM
            temperature: (Math.random() * 2 + 97.5).toFixed(1), // 97.5-99.5°F
            oxygen: Math.floor(Math.random() * 5) + 95, // 95-100%
            systolic: Math.floor(Math.random() * 20) + 110, // 110-130
            diastolic: Math.floor(Math.random() * 15) + 70 // 70-85
        };
    }

    // Start auto-update for vitals
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, 5000); // Update every 5 seconds
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    async updateDashboard() {
        try {
            // Fetch vitals from backend
            const response = await fetch(API_ENDPOINTS.vitals, {
                ...FETCH_OPTIONS
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayVitals(data);
            } else {
                // Use simulated data
                const vitals = this.generateVitals();
                this.displayVitals(vitals);
            }
        } catch (error) {
            console.error('Error fetching vitals:', error);
            // Use simulated data
            const vitals = this.generateVitals();
            this.displayVitals(vitals);
        }
    }

    displayVitals(vitals) {
        this.updateVital('heartRate', vitals.heartRate);
        this.updateVital('temperature', vitals.temperature);
        this.updateVital('oxygenLevel', vitals.oxygen);
        this.updateVital('bloodPressure', `${vitals.systolic}/${vitals.diastolic}`);
    }
}

// Lightweight global toast utility
function showToast(message, type = 'info', timeoutMs = 3000) {
    try {
        const toast = document.createElement('div');
        toast.className = `message message-${type} fade-in-up`;
        toast.innerHTML = `${type === 'error' ? '<i data-lucide="alert-triangle"></i>' : '<i data-lucide="check-circle"></i>'} <span>${message}</span>`;
        const container = document.querySelector('.dashboard-container') || document.body;
        container.appendChild(toast);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        setTimeout(() => toast.remove(), timeoutMs);
    } catch (e) { console.error(message); }
}

// Patient Dashboard Initialization
function initializePatientDashboard() {
    try {
        console.log('Initializing Patient Dashboard...');
        
        const dashboard = new Dashboard();

        // Create mini charts for vitals
        createVitalCharts();

        // Create mood waveform
        createMoodWaveform();

        // Create health trends chart
        createHealthTrendsChart();

        // Start auto-update
        dashboard.startAutoUpdate();

        // Initial update
        dashboard.updateDashboard();
        
        console.log('Patient Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showDashboardError('Failed to initialize dashboard. Please refresh the page.');
    }
}

// Show error message on dashboard
function showDashboardError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message message-error';
    errorDiv.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
    
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
        dashboardHeader.after(errorDiv);
        lucide.createIcons();
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function createVitalCharts() {
    // Heart Rate Chart
    const heartRateCtx = document.getElementById('heartRateChart');
    if (heartRateCtx) {
        new Chart(heartRateCtx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', ''],
                datasets: [{
                    data: [70, 72, 71, 75, 73, 72],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }

    // Temperature Chart
    const tempCtx = document.getElementById('tempChart');
    if (tempCtx) {
        new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', ''],
                datasets: [{
                    data: [98.4, 98.6, 98.5, 98.7, 98.6, 98.6],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }

    // Oxygen Chart
    const oxygenCtx = document.getElementById('oxygenChart');
    if (oxygenCtx) {
        new Chart(oxygenCtx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', ''],
                datasets: [{
                    data: [97, 98, 98, 99, 98, 98],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }

    // Blood Pressure Chart
    const bpCtx = document.getElementById('bpChart');
    if (bpCtx) {
        new Chart(bpCtx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', ''],
                datasets: [{
                    data: [120, 118, 122, 119, 121, 120],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }
}

function createMoodWaveform() {
    const ctx = document.getElementById('moodWaveform');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0).map(() => Math.random() * 100),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { display: false }
            },
            animation: {
                duration: 2000,
                loop: true
            }
        }
    });
}

function createHealthTrendsChart() {
    const ctx = document.getElementById('healthTrendsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Heart Rate',
                    data: [72, 75, 73, 76, 74, 72, 71],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Blood Pressure (Sys)',
                    data: [120, 118, 122, 119, 121, 120, 118],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Oxygen Level',
                    data: [97, 98, 98, 99, 98, 98, 97],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Caretaker Dashboard Initialization
function initializeCaretakerDashboard() {
    console.log('Caretaker dashboard initialized');
    
    // Auto-refresh alerts
    setInterval(() => {
        checkForNewAlerts();
    }, 10000); // Check every 10 seconds
}

async function checkForNewAlerts() {
    try {
        const response = await fetch(API_ENDPOINTS.alerts, {
            ...FETCH_OPTIONS
        });
        if (response.ok) {
            const alerts = await response.json();
            if (alerts && alerts.length > 0) {
                updateAlertsCount(alerts.length);
            }
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
}

function updateAlertsCount(count) {
    const badge = document.getElementById('activeAlertsCount');
    if (badge) {
        badge.textContent = count;
    }
}

// Doctor Dashboard Initialization
function initializeDoctorDashboard() {
    console.log('Doctor dashboard initialized');
}

// Update detection statuses
function updateCoughDetection(count, lastTime) {
    const countEl = document.getElementById('coughCount');
    const lastEl = document.getElementById('lastCough');
    
    if (countEl) countEl.textContent = count;
    if (lastEl) lastEl.textContent = lastTime;
}

function updateFallDetection(status, lastCheck, confidence) {
    const statusEl = document.getElementById('fallStatus');
    const lastEl = document.getElementById('lastFallCheck');
    const confidenceEl = document.getElementById('fallConfidence');

    if (statusEl) {
        const statusText = statusEl.querySelector('.detection-text') || statusEl.querySelector('.status-text');
        const statusIcon = statusEl.querySelector('.status-icon');
        if (status === 'detected') {
            statusEl.className = 'detection-status status-alert';
            if (statusText) statusText.textContent = 'Fall Detected!';
            if (statusIcon) {
                statusIcon.setAttribute('data-lucide', 'shield-alert');
                lucide.createIcons();
            }
        } else if (status === 'monitoring') {
            statusEl.className = 'detection-status status-safe';
            if (statusText) statusText.textContent = 'Monitoring';
            if (statusIcon) {
                statusIcon.setAttribute('data-lucide', 'shield-check');
                lucide.createIcons();
            }
        } else {
            statusEl.className = 'detection-status';
            if (statusText) statusText.textContent = 'Not Active';
            if (statusIcon) {
                statusIcon.setAttribute('data-lucide', 'shield-off');
                lucide.createIcons();
            }
        }
    }

    if (lastEl) lastEl.textContent = lastCheck;
    if (confidenceEl) confidenceEl.textContent = confidence;
}

function updateMoodDetection(emoji, mood) {
    const emojiEl = document.querySelector('.mood-emoji');
    const labelEl = document.querySelector('.mood-label');
    
    if (emojiEl) emojiEl.textContent = emoji;
    if (labelEl) labelEl.textContent = mood;
}

// Export functions
window.initializePatientDashboard = initializePatientDashboard;
window.initializeCaretakerDashboard = initializeCaretakerDashboard;
window.initializeDoctorDashboard = initializeDoctorDashboard;
window.updateCoughDetection = updateCoughDetection;
window.updateFallDetection = updateFallDetection;
window.updateMoodDetection = updateMoodDetection;

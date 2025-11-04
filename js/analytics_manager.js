// ============================================
// HEALTH ANALYTICS MANAGEMENT
// ============================================

class AnalyticsManager {
    constructor() {
        this.period = '30';
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Initial load when analytics tab is first shown
        const analyticsTab = document.getElementById('analyticsTab');
        if (analyticsTab.classList.contains('active')) {
            this.loadAnalytics();
        }
    }

    setupEventListeners() {
        const periodSelect = document.getElementById('analyticsPeriod');
        const refreshBtn = document.getElementById('refreshAnalytics');

        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.period = periodSelect.value;
                this.loadAnalytics();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAnalytics());
        }
    }

    async loadAnalytics() {
        try {
            const url = (typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.analytics)
                ? API_ENDPOINTS.analytics + '?period=' + this.period
                : ((typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + '/api/analytics?period=' + this.period);
            const response = await fetch(url, {
                method: 'GET',
                ...(typeof FETCH_OPTIONS === 'object' ? { ...FETCH_OPTIONS, headers: { 'Content-Type': 'application/json', ...(FETCH_OPTIONS.headers || {}) } } : { headers: { 'Content-Type': 'application/json' } })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAnalytics(data);
            } else {
                throw new Error('Failed to load analytics');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            // Fallback sample analytics
            const sample = {
                patterns: [
                    { id: 'pat-1', type: 'health_trend', title: 'Improving heart rate variability', timestamp: new Date().toLocaleString(), confidence: 0.86, description: 'Patient cohort shows improved HRV over last 2 weeks.', factors: [{ name: 'Medication adherence', impact: 'high' }], recommendations: ['Maintain current regimen', 'Increase hydration'] },
                    { id: 'pat-2', type: 'risk_factor', title: 'Elevated BP on Mondays', timestamp: new Date().toLocaleString(), confidence: 0.72, description: 'Spike in systolic BP observed at start of week.', factors: [{ name: 'Stress', impact: 'medium' }], recommendations: ['Mindfulness session on Sunday evening'] }
                ],
                healthTrends: {
                    labels: ['Day 1','Day 5','Day 10','Day 15','Day 20','Day 25','Day 30'],
                    datasets: [
                        { label: 'Avg Heart Rate', data: [78,76,75,74,73,72,72], color: '#ef4444' },
                        { label: 'Avg Oxygen %', data: [96,96,97,97,97,98,98], color: '#3b82f6' }
                    ]
                },
                riskDistribution: { low: 8, medium: 3, high: 1 },
                alertFrequency: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [5,3,4,6,2,1,2] },
                treatmentEffectiveness: { labels: ['W1','W2','W3','W4'], values: [10,25,40,55] }
            };
            this.updateAnalytics(sample);
        }
    }

    updateAnalytics(data) {
        this.updatePatternAnalysis(data.patterns);
        this.updateHealthTrendsChart(data.healthTrends);
        this.updateRiskDistributionChart(data.riskDistribution);
        this.updateAlertFrequencyChart(data.alertFrequency);
        this.updateTreatmentEffectivenessChart(data.treatmentEffectiveness);
    }

    updatePatternAnalysis(patterns) {
        const container = document.getElementById('patternsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!patterns || patterns.length === 0) {
            container.innerHTML = '<p class="empty-state">No significant patterns detected</p>';
            return;
        }

        patterns.forEach((pattern, index) => {
            const card = document.createElement('div');
            card.className = 'pattern-card glass-panel fade-in-up';
            card.style.animationDelay = index * 0.05 + 's';
            card.innerHTML = 
                '<div class="pattern-header">' +
                    '<div class="pattern-icon">' +
                        '<i data-lucide="' + this.getPatternIcon(pattern.type) + '"></i>' +
                    '</div>' +
                    '<div class="pattern-info">' +
                        '<h3>' + pattern.title + '</h3>' +
                        '<span class="pattern-date">' + pattern.timestamp + '</span>' +
                    '</div>' +
                    '<span class="pattern-confidence">' + 
                        Math.round(pattern.confidence * 100) + '% confidence' +
                    '</span>' +
                '</div>' +
                '<div class="pattern-description">' +
                    pattern.description +
                '</div>' +
                '<div class="pattern-actions">' +
                    '<button class="btn-secondary" onclick="analyticsManager.investigatePattern(\'' + pattern.id + '\')">' +
                        '<i data-lucide="search"></i>' +
                        'Investigate' +
                    '</button>' +
                    '<button class="btn-secondary" onclick="analyticsManager.sharePattern(\'' + pattern.id + '\')">' +
                        '<i data-lucide="share"></i>' +
                        'Share' +
                    '</button>' +
                '</div>';
            container.appendChild(card);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    getPatternIcon(type) {
        switch (type.toLowerCase()) {
            case 'health_trend': return 'trending-up';
            case 'risk_factor': return 'alert-triangle';
            case 'medication': return 'pill';
            case 'behavior': return 'activity';
            case 'vital_signs': return 'heart-pulse';
            case 'emergency': return 'siren';
            default: return 'chart';
        }
    }

    updateHealthTrendsChart(data) {
        const ctx = document.getElementById('healthTrendsChart');
        if (!ctx) return;

        if (this.charts.healthTrends) {
            this.charts.healthTrends.destroy();
        }

        this.charts.healthTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data,
                    borderColor: ds.color,
                    tension: 0.4,
                    fill: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateRiskDistributionChart(data) {
        const ctx = document.getElementById('riskDistributionChart');
        if (!ctx) return;

        if (this.charts.riskDistribution) {
            this.charts.riskDistribution.destroy();
        }

        this.charts.riskDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [data.low, data.medium, data.high],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    updateAlertFrequencyChart(data) {
        const ctx = document.getElementById('alertFrequencyChart');
        if (!ctx) return;

        if (this.charts.alertFrequency) {
            this.charts.alertFrequency.destroy();
        }

        this.charts.alertFrequency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Alerts',
                    data: data.values,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateTreatmentEffectivenessChart(data) {
        const ctx = document.getElementById('treatmentChart');
        if (!ctx) return;

        if (this.charts.treatment) {
            this.charts.treatment.destroy();
        }

        this.charts.treatment = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Improvement %',
                    data: data.values,
                    borderColor: '#10b981',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async investigatePattern(patternId) {
        try {
            const response = await fetch('/api/analytics/patterns/' + patternId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showPatternDetails(data);
            } else {
                throw new Error('Failed to load pattern details');
            }
        } catch (error) {
            console.error('Error investigating pattern:', error);
            this.showError('Failed to load pattern details');
        }
    }

    showPatternDetails(pattern) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = 
            '<div class="modal-content glass-panel large-modal">' +
                '<button class="modal-close" onclick="this.closest(\'.modal\').remove()">' +
                    '<i data-lucide="x"></i>' +
                '</button>' +
                '<div class="pattern-detail">' +
                    '<div class="pattern-detail-header">' +
                        '<h2>' +
                            '<i data-lucide="' + this.getPatternIcon(pattern.type) + '"></i>' +
                            pattern.title +
                        '</h2>' +
                        '<div class="pattern-meta">' +
                            '<span class="pattern-type">' + pattern.type + '</span>' +
                            '<span class="pattern-date">' + pattern.timestamp + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pattern-detail-content">' +
                        '<div class="pattern-description glass-panel">' +
                            '<h3>Pattern Description</h3>' +
                            '<p>' + pattern.description + '</p>' +
                        '</div>' +
                        '<div class="pattern-factors glass-panel">' +
                            '<h3>Contributing Factors</h3>' +
                            '<ul class="factors-list">' +
                                pattern.factors.map(factor => 
                                    '<li>' +
                                        '<span class="factor-name">' + factor.name + '</span>' +
                                        '<span class="factor-impact">Impact: ' + factor.impact + '</span>' +
                                    '</li>'
                                ).join('') +
                            '</ul>' +
                        '</div>' +
                        '<div class="pattern-recommendations glass-panel">' +
                            '<h3>Recommendations</h3>' +
                            '<ul class="recommendations-list">' +
                                pattern.recommendations.map(rec => 
                                    '<li>' +
                                        '<i data-lucide="check-circle"></i>' +
                                        '<span>' + rec + '</span>' +
                                    '</li>'
                                ).join('') +
                            '</ul>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pattern-actions">' +
                        '<button class="btn-primary" onclick="analyticsManager.createReport(\'' + pattern.id + '\')">' +
                            '<i data-lucide="file-text"></i>' +
                            'Create Report' +
                        '</button>' +
                        '<button class="btn-secondary" onclick="analyticsManager.sharePattern(\'' + pattern.id + '\')">' +
                            '<i data-lucide="share"></i>' +
                            'Share Analysis' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    async sharePattern(patternId) {
        // Implementation similar to sharing reports
        console.log('Sharing pattern:', patternId);
    }

    async createReport(patternId) {
        // Create a medical report based on the pattern
        if (window.medicalReports) {
            // TODO: Implement report creation based on pattern
            console.log('Creating report for pattern:', patternId);
        }
    }

    showSuccess(message) {
        // Implement toast or notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implement toast or notification
        console.error('Error:', message);
    }
}

// Initialize Analytics Manager
const analyticsManager = new AnalyticsManager();
window.analyticsManager = analyticsManager;
// ============================================
// ANALYTICS MODULE
// ============================================

class AnalyticsManager {
    constructor() {
        this.patterns = null;
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Analytics Manager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Analytics tab button
        const analyticsTab = document.querySelector('[data-tab="analytics"]');
        if (analyticsTab) {
            analyticsTab.addEventListener('click', () => {
                setTimeout(() => this.loadAnalytics(), 100);
            });
        }

        // Refresh analytics button
        const refreshBtn = document.getElementById('refreshAnalytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAnalytics());
        }

        // Period selector
        const periodSelect = document.getElementById('analyticsPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.loadAnalytics(e.target.value);
            });
        }
    }

    async loadAnalytics(periodDays = 30, userId = '1') {
        try {
            this.showLoading();

            // Load patterns
            await this.loadPatterns(periodDays, userId);
            
            // Load visualization data
            await this.loadVisualizationData(periodDays, userId);
            
            // Update charts
            this.updateCharts();
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        } finally {
            this.hideLoading();
        }
    }

    async loadPatterns(periodDays, userId) {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.analyticsPatterns}?user_id=${userId}&period_days=${periodDays}`,
                { ...FETCH_OPTIONS }
            );

            if (response.ok) {
                const data = await response.json();
                this.patterns = data.patterns;
                this.displayPatterns(data.patterns);
            } else {
                throw new Error('Failed to fetch patterns');
            }
        } catch (error) {
            console.error('Error loading patterns:', error);
            throw error;
        }
    }

    async loadVisualizationData(periodDays, userId) {
        const dataTypes = ['heartRate', 'temperature', 'oxygen', 'mood_score'];
        
        for (const dataType of dataTypes) {
            try {
                const response = await fetch(
                    `${API_ENDPOINTS.analyticsVisualization}?user_id=${userId}&data_type=${dataType}&period_days=${periodDays}`,
                    { ...FETCH_OPTIONS }
                );

                if (response.ok) {
                    const data = await response.json();
                    this.updateChart(dataType, data.data);
                }
            } catch (error) {
                console.error(`Error loading ${dataType} visualization:`, error);
            }
        }
    }

    displayPatterns(patterns) {
        const patternsContainer = document.getElementById('patternsContainer');
        if (!patternsContainer) return;

        if (!patterns || patterns.error) {
            patternsContainer.innerHTML = `
                <div class="message message-info">
                    <i data-lucide="info"></i> No pattern data available yet. Data will appear as more information is collected.
                </div>
            `;
            lucide.createIcons();
            return;
        }

        let html = '<div class="patterns-grid">';

        // Display overall trend
        if (patterns.trends) {
            const trend = patterns.trends.overall || 'unknown';
            const trendClass = this.getTrendClass(trend);
            html += `
                <div class="pattern-card glass-panel">
                    <h3><i data-lucide="trending-up"></i> Overall Health Trend</h3>
                    <div class="trend-indicator ${trendClass}">
                        <span class="trend-value">${trend.replace('_', ' ').toUpperCase()}</span>
                        <span class="trend-score">Score: ${(patterns.trends.score * 100).toFixed(1)}%</span>
                    </div>
                    <p class="trend-recommendation">${patterns.trends.recommendation || ''}</p>
                </div>
            `;
        }

        // Display insights
        if (patterns.insights && patterns.insights.length > 0) {
            html += `
                <div class="pattern-card glass-panel">
                    <h3><i data-lucide="lightbulb"></i> Health Insights</h3>
                    <ul class="insights-list">
                        ${patterns.insights.map(insight => `
                            <li><i data-lucide="check-circle"></i> ${insight}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // Display patterns for each data type
        if (patterns.patterns) {
            for (const [dataType, pattern] of Object.entries(patterns.patterns)) {
                html += `
                    <div class="pattern-card glass-panel">
                        <h3><i data-lucide="${this.getDataTypeIcon(dataType)}"></i> ${this.formatDataType(dataType)}</h3>
                        <div class="pattern-stats">
                            <div class="stat-item">
                                <span class="stat-label">Average</span>
                                <span class="stat-value">${pattern.mean.toFixed(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Range</span>
                                <span class="stat-value">${pattern.min.toFixed(1)} - ${pattern.max.toFixed(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Trend</span>
                                <span class="stat-value trend-${pattern.trend}">${pattern.trend}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
        patternsContainer.innerHTML = html;
        lucide.createIcons();
    }

    updateChart(dataType, chartData) {
        if (!chartData || !chartData.labels || !chartData.values) return;

        const canvasId = `${dataType}Chart`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            // Create chart canvas if it doesn't exist
            this.createChartCanvas(canvasId, dataType);
        }

        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts[dataType]) {
            this.charts[dataType].destroy();
        }

        // Create new chart
        this.charts[dataType] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels.map(label => {
                    const date = new Date(label);
                    return date.toLocaleDateString();
                }),
                datasets: [{
                    label: this.formatDataType(dataType),
                    data: chartData.values,
                    borderColor: this.getDataTypeColor(dataType),
                    backgroundColor: this.getDataTypeColor(dataType, 0.1),
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    createChartCanvas(canvasId, dataType) {
        const chartsContainer = document.getElementById('chartsContainer');
        if (!chartsContainer) {
            // Create container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'chartsContainer';
            container.className = 'charts-container';
            const analyticsTab = document.getElementById('analyticsTab');
            if (analyticsTab) {
                analyticsTab.appendChild(container);
            }
        }

        const container = document.getElementById('chartsContainer');
        const chartCard = document.createElement('div');
        chartCard.className = 'chart-card glass-panel';
        chartCard.innerHTML = `
            <h3>${this.formatDataType(dataType)} Trend</h3>
            <canvas id="${canvasId}"></canvas>
        `;
        container.appendChild(chartCard);
    }

    updateCharts() {
        // Update all charts with latest data
        Object.keys(this.charts).forEach(dataType => {
            if (this.charts[dataType]) {
                this.charts[dataType].update();
            }
        });
    }

    getTrendClass(trend) {
        const trendMap = {
            'excellent': 'trend-excellent',
            'good': 'trend-good',
            'moderate': 'trend-moderate',
            'needs_attention': 'trend-warning',
            'unknown': 'trend-unknown'
        };
        return trendMap[trend] || 'trend-unknown';
    }

    getDataTypeIcon(dataType) {
        const iconMap = {
            'heartRate': 'heart-pulse',
            'temperature': 'thermometer',
            'oxygen': 'wind',
            'mood_score': 'smile',
            'cough_frequency': 'activity'
        };
        return iconMap[dataType] || 'bar-chart';
    }

    getDataTypeColor(dataType, opacity = 1) {
        const colorMap = {
            'heartRate': `rgba(239, 68, 68, ${opacity})`,
            'temperature': `rgba(245, 158, 11, ${opacity})`,
            'oxygen': `rgba(6, 182, 212, ${opacity})`,
            'mood_score': `rgba(16, 185, 129, ${opacity})`,
            'cough_frequency': `rgba(139, 92, 246, ${opacity})`
        };
        return colorMap[dataType] || `rgba(99, 102, 241, ${opacity})`;
    }

    formatDataType(dataType) {
        return dataType
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    showLoading() {
        const analyticsTab = document.getElementById('analyticsTab');
        if (!analyticsTab) return;

        let loadingDiv = document.getElementById('analyticsLoading');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'analyticsLoading';
            loadingDiv.className = 'loading-indicator glass-panel';
            analyticsTab.appendChild(loadingDiv);
        }

        loadingDiv.innerHTML = `
            <i data-lucide="loader-2" class="animate-spin"></i>
            <span>Loading analytics...</span>
        `;
        loadingDiv.style.display = 'flex';
        lucide.createIcons();
    }

    hideLoading() {
        const loadingDiv = document.getElementById('analyticsLoading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    showError(message) {
        const analyticsTab = document.getElementById('analyticsTab');
        if (!analyticsTab) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error';
        errorDiv.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
        
        analyticsTab.appendChild(errorDiv);
        lucide.createIcons();
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Global instance
const analyticsManager = new AnalyticsManager();
window.analyticsManager = analyticsManager;


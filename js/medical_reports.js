// ============================================
// MEDICAL REPORTS MANAGEMENT
// ============================================

class MedicalReports {
    constructor() {
        this.reports = [];
        this.init();
    }

    init() {
        this.loadReports();
        this.initializeEventListeners();
    }

    async loadReports() {
        try {
            const response = await fetch('/api/reports', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.reports = data.reports;
                this.updateReportsList();
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showError('Failed to load reports');
        }
    }

    initializeEventListeners() {
        // New Report Button
        const addReportBtn = document.getElementById('addReportBtn');
        if (addReportBtn) {
            addReportBtn.addEventListener('click', () => this.openNewReportModal());
        }
    }

    updateReportsList() {
        const reportsContainer = document.getElementById('reportsList');
        if (!reportsContainer) return;

        reportsContainer.innerHTML = '';
        
        if (this.reports.length === 0) {
            reportsContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="file-text"></i>
                    <p>No medical reports available</p>
                    <button class="btn-primary" onclick="medicalReports.openNewReportModal()">
                        Create New Report
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        this.reports.forEach((report, index) => {
            const reportCard = document.createElement('div');
            reportCard.className = `report-card glass-panel fade-in-up`;
            reportCard.style.animationDelay = `${index * 0.05}s`;
            reportCard.innerHTML = '
                <div class="report-header">
                    <div class="report-type">
                        <i data-lucide="\${this.getReportTypeIcon(report.type)}"></i>
                        <span>\${report.type}</span>
                    </div>
                    <div class="report-meta">
                        <span class="report-date">\${this.formatDate(report.created_at)}</span>
                        <span class="report-id">#\${report.id}</span>
                    </div>
                </div>
                <div class="report-patient">
                    <i data-lucide="user"></i>
                    <div>
                        <strong>\${report.patient.name}</strong>
                        <span class="patient-id">\${report.patient.id}</span>
                    </div>
                </div>
                <div class="report-content">
                    <p>\${this.truncateText(report.content, 150)}</p>
                </div>
                <div class="report-actions">
                    <button class="btn-secondary" onclick="medicalReports.viewReport('\${report.id}')">
                        <i data-lucide="eye"></i>
                        View
                    </button>
                    <button class="btn-secondary" onclick="medicalReports.readReportAloud('\${report.id}')">
                        <i data-lucide="volume-2"></i>
                        Read Aloud
                    </button>
                    <button class="btn-secondary" onclick="medicalReports.shareReport('\${report.id}')">
                        <i data-lucide="share"></i>
                        Share
                    </button>
                </div>
            \`;
            reportsContainer.appendChild(reportCard);
        });

        lucide.createIcons();
    }

    getReportTypeIcon(type) {
        switch (type.toLowerCase()) {
            case 'consultation': return 'stethoscope';
            case 'diagnosis': return 'clipboard-list';
            case 'prescription': return 'pill';
            case 'progress': return 'trending-up';
            default: return 'file-text';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    async viewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = \`
            <div class="modal-content glass-panel large-modal">
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i data-lucide="x"></i>
                </button>
                <div class="report-detail">
                    <div class="report-detail-header">
                        <h2>
                            <i data-lucide="\${this.getReportTypeIcon(report.type)}"></i>
                            \${report.type} Report
                        </h2>
                        <div class="report-meta">
                            <span class="report-id">#\${report.id}</span>
                            <span class="report-date">\${this.formatDate(report.created_at)}</span>
                        </div>
                    </div>
                    <div class="report-patient-info glass-panel">
                        <div class="patient-header">
                            <i data-lucide="user"></i>
                            <div>
                                <h3>\${report.patient.name}</h3>
                                <span class="patient-id">\${report.patient.id}</span>
                            </div>
                        </div>
                        <div class="patient-vitals">
                            <div class="vital-item">
                                <i data-lucide="heart-pulse"></i>
                                <span>\${report.patient.vitals.heartRate} BPM</span>
                            </div>
                            <div class="vital-item">
                                <i data-lucide="thermometer"></i>
                                <span>\${report.patient.vitals.temperature}°F</span>
                            </div>
                            <div class="vital-item">
                                <i data-lucide="wind"></i>
                                <span>\${report.patient.vitals.oxygen}% O2</span>
                            </div>
                        </div>
                    </div>
                    <div class="report-content glass-panel">
                        <h3>Report Content</h3>
                        <div class="content-text">
                            \${report.content}
                        </div>
                    </div>
                    <div class="report-actions">
                        <button class="btn-primary" onclick="medicalReports.readReportAloud('\${report.id}')">
                            <i data-lucide="volume-2"></i>
                            Read Aloud
                        </button>
                        <button class="btn-secondary" onclick="medicalReports.shareReport('\${report.id}')">
                            <i data-lucide="share"></i>
                            Share Report
                        </button>
                        <button class="btn-secondary" onclick="medicalReports.downloadReport('\${report.id}')">
                            <i data-lucide="download"></i>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        \`;

        document.body.appendChild(modal);
        lucide.createIcons();
    }

    async readReportAloud(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        try {
            const response = await fetch(API_ENDPOINTS.voice, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    text: `${report.type} report for ${report.patient.name}. ${report.content}`,
                    voice_type: 'doctor'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to read report');
            }
        } catch (error) {
            console.error('Error reading report:', error);
            this.showError('Failed to read report aloud');
        }
    }

    async shareReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = \`
            <div class="modal-content glass-panel">
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i data-lucide="x"></i>
                </button>
                <h2>Share Report</h2>
                <p>Share report #\${report.id} with:</p>
                <form id="shareReportForm" class="share-form">
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="patient" checked>
                            Patient (\${report.patient.name})
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="caretaker">
                            Caretaker
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Other Recipients:</label>
                        <input type="email" name="email" class="form-input" 
                               placeholder="Enter email addresses (comma-separated)">
                    </div>
                    <div class="form-group">
                        <label>Message (optional):</label>
                        <textarea name="message" class="form-input" rows="3" 
                                  placeholder="Add a message..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i data-lucide="send"></i>
                            Send
                        </button>
                    </div>
                </form>
            </div>
        \`;

        document.body.appendChild(modal);
        lucide.createIcons();

        const form = document.getElementById('shareReportForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            try {
                const response = await fetch('/api/reports/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        report_id: reportId,
                        share_with: {
                            patient: formData.get('patient') === 'on',
                            caretaker: formData.get('caretaker') === 'on',
                            emails: formData.get('email').split(',').map(e => e.trim()).filter(Boolean)
                        },
                        message: formData.get('message')
                    })
                });

                if (response.ok) {
                    this.showSuccess('Report shared successfully');
                    modal.remove();
                } else {
                    throw new Error('Failed to share report');
                }
            } catch (error) {
                console.error('Error sharing report:', error);
                this.showError('Failed to share report');
            }
        });
    }

    async downloadReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        try {
            const response = await fetch(`/api/reports/${reportId}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${report.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                throw new Error('Failed to download report');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showError('Failed to download report');
        }
    }

    async saveReport(reportData) {
        try {
            const response = await fetch('/api/reports/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                this.showSuccess('Report saved successfully');
                await this.loadReports();
                return true;
            } else {
                throw new Error('Failed to save report');
            }
        } catch (error) {
            console.error('Error saving report:', error);
            this.showError('Failed to save report');
            return false;
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

// Initialize Medical Reports
const medicalReports = new MedicalReports();
window.medicalReports = medicalReports;
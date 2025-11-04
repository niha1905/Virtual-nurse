// ============================================
// DOCTOR DASHBOARD MANAGEMENT
// ============================================

class DoctorDashboard {
    constructor() {
        this.patients = [];
        this.criticalPatients = [];
        this.alerts = [];
        this.init();
    }

    init() {
        this.loadPatients();
        this.setupEventListeners();
        this.setupCommunicationHandlers();
        this.loadCharts();
        this.loadDoctorAlerts();
        // periodic refresh
        setInterval(() => { this.loadDoctorAlerts(); }, 30000);
        setInterval(() => { this.loadPatients(); }, 60000);
    }

    setupEventListeners() {
        // Add Patient Button
        const addPatientBtn = document.getElementById('addReportBtn');
        if (addPatientBtn) {
            addPatientBtn.addEventListener('click', () => this.openAddPatientModal());
        }

        // Patient Form
        const patientForm = document.getElementById('addPatientForm');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => this.handleAddPatient(e));
        }
    }

    async loadPatients() {
        try {
            const localResp = await fetch('data/patients.json', { cache: 'no-store' });
            if (localResp.ok) {
                const data = await localResp.json();
                this.patients = data.patients || data || [];
            } else {
                const url = (typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.patients) ? API_ENDPOINTS.patients : ((typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + '/api/patients');
                const response = await fetch(url, {
                    method: 'GET',
                    ...(typeof FETCH_OPTIONS === 'object' ? { ...FETCH_OPTIONS, headers: { 'Content-Type': 'application/json', ...(FETCH_OPTIONS.headers || {}) } } : { headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.patients = data.patients || data || [];
                } else {
                    throw new Error('non-200');
                }
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            if (typeof showToast === 'function') showToast('Failed to load patients, showing sample.', 'error');
            // Fallback sample data (expanded)
            this.patients = [
                { id: 'P-1001', name: 'John Doe', risk: 'high', condition: 'Hypertension', phone: '+1 555-1234', email: 'john@example.com', address: '12 Baker St', emergency_contact: 'Jane (+1 555-5555)', vitals: { heartRate: 112, temperature: 100.4, oxygen: 92, systolic: 154, diastolic: 98 }, activeAlerts: 2, reminders: [{ medicine: 'Atorvastatin', dosage: '10mg', time: '08:00', frequency: 'daily' }], alerts: [{ severity: 'high', message: 'High blood pressure detected', timestamp: Date.now()-3600_000 }] },
                { id: 'P-1002', name: 'Jane Smith', risk: 'medium', condition: 'Diabetes', phone: '+1 555-5678', email: 'jane@example.com', address: '34 King Rd', emergency_contact: 'Bob (+1 555-7777)', vitals: { heartRate: 78, temperature: 98.4, oxygen: 97, systolic: 128, diastolic: 82 }, activeAlerts: 1, reminders: [{ medicine: 'Metformin', dosage: '500mg', time: '12:00', frequency: 'twice-daily' }], alerts: [] },
                { id: 'P-1003', name: 'Alice Brown', risk: 'low', condition: 'Recovery', phone: '+1 555-6789', email: 'alice@example.com', address: '78 Queen Ave', emergency_contact: 'Mark (+1 555-8888)', vitals: { heartRate: 70, temperature: 98.6, oxygen: 98, systolic: 120, diastolic: 78 }, activeAlerts: 0, reminders: [], alerts: [] },
                { id: 'P-1004', name: 'Carlos Ruiz', risk: 'medium', condition: 'COPD', phone: '+1 555-9012', email: 'carlos@example.com', address: '9 Elm St', emergency_contact: 'Ana (+1 555-0000)', vitals: { heartRate: 88, temperature: 98.9, oxygen: 94, systolic: 130, diastolic: 86 }, activeAlerts: 1, reminders: [{ medicine: 'Albuterol', dosage: '2 puffs', time: '09:00', frequency: 'as-needed' }], alerts: [] },
                { id: 'P-1005', name: 'Meera Patel', risk: 'low', condition: 'Post-op', phone: '+1 555-3456', email: 'meera@example.com', address: '22 Pine Ave', emergency_contact: 'Ravi (+1 555-1111)', vitals: { heartRate: 72, temperature: 98.2, oxygen: 99, systolic: 118, diastolic: 76 }, activeAlerts: 0, reminders: [], alerts: [] },
                { id: 'P-1006', name: 'Liam Chen', risk: 'high', condition: 'Arrhythmia', phone: '+1 555-7890', email: 'liam@example.com', address: '101 Maple Dr', emergency_contact: 'Nina (+1 555-2222)', vitals: { heartRate: 128, temperature: 99.1, oxygen: 95, systolic: 138, diastolic: 88 }, activeAlerts: 1, reminders: [{ medicine: 'Beta blocker', dosage: '50mg', time: '20:00', frequency: 'daily' }], alerts: [] }
            ];
        }
        this.updateDashboard();
        this.populateCommunicationPatients();
    }

    updateDashboard() {
        this.updatePatientStats();
        this.updateCriticalPatients();
        this.updatePatientGrid();
        this.loadCharts();
    }

    loadCharts() {
        const canvas = document.getElementById('vitalsComparisonChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.vitalsChart) {
            try { this.vitalsChart.destroy(); } catch (e) {}
        }
        // Prepare sample or computed averages
        const patients = this.patients && this.patients.length ? this.patients : [
            { vitals: { heartRate: 108, temperature: 100.1, oxygen: 93 } },
            { vitals: { heartRate: 76, temperature: 98.4, oxygen: 97 } },
            { vitals: { heartRate: 70, temperature: 98.6, oxygen: 98 } }
        ];
        const avg = (arr) => arr.reduce((a,b)=>a+b,0)/arr.length;
        const hr = avg(patients.map(p=>p.vitals.heartRate||0));
        const temp = avg(patients.map(p=>p.vitals.temperature||0));
        const ox = avg(patients.map(p=>p.vitals.oxygen||0));
        this.vitalsChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Avg Heart Rate','Avg Temperature','Avg Oxygen'],
                datasets: [{
                    label: 'Averages',
                    data: [Math.round(hr), Number(temp.toFixed(1)), Math.round(ox)],
                    backgroundColor: ['#ef4444','#f59e0b','#3b82f6'],
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
        });
    }

    updatePatientStats() {
        // Update dashboard statistics
        const totalPatients = this.patients.length;
        const criticalPatients = this.patients.filter(p => p.risk === 'high').length;
        const improvingPatients = this.patients.filter(p => 
            p.analytics && p.analytics.trend === 'improving'
        ).length;

        // Update stat badges
        document.getElementById('totalPatientsCount').textContent = totalPatients;
        document.getElementById('criticalPatientsCount').textContent = criticalPatients;
        document.getElementById('improvingPatientsCount').textContent = improvingPatients;

        // Update risk overview
        const highRisk = this.patients.filter(p => p.risk === 'high').length;
        const mediumRisk = this.patients.filter(p => p.risk === 'medium').length;
        const lowRisk = this.patients.filter(p => p.risk === 'low').length;

        document.querySelector('.risk-high .risk-count').textContent = highRisk;
        document.querySelector('.risk-medium .risk-count').textContent = mediumRisk;
        document.querySelector('.risk-low .risk-count').textContent = lowRisk;
    }

    updateCriticalPatients() {
        // Filter critical patients
        this.criticalPatients = this.patients.filter(p => p.risk === 'high');

        // Update critical patients table
        const tbody = document.getElementById('criticalPatientsTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        this.criticalPatients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>
                    <div class="patient-cell">
                        <i data-lucide="user"></i>
                        <div>
                            <strong>\${patient.name}</strong>
                            <span class="patient-id">\${patient.id}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="risk-badge risk-high">HIGH</span>
                </td>
                <td>\${this.formatVitalsStatus(patient.vitals)}</td>
                <td>
                    <div class="alert-cell">
                        <i data-lucide="alert-triangle"></i>
                        <div>
                            <strong>\${patient.activeAlerts} Active Alerts</strong>
                            <span>\${this.getLastAlertTime(patient.id)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="table-action-btn" onclick="doctorDashboard.viewPatientDetails('\${patient.id}')">
                        <i data-lucide="eye"></i>
                        View
                    </button>
                </td>
            \`;
            tbody.appendChild(row);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    updatePatientGrid() {
        const grid = document.getElementById('allPatientsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.patients.forEach((patient, index) => {
            const card = document.createElement('div');
            card.className = \`doctor-patient-card glass-panel fade-in-up\`;
            card.style.animationDelay = \`\${index * 0.05}s\`;
            card.innerHTML = \`
                <div class="patient-card-header">
                    <div class="patient-avatar">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="patient-info">
                        <h3>\${patient.name}</h3>
                        <span class="patient-id">\${patient.id}</span>
                    </div>
                    <span class="risk-badge risk-\${patient.risk}">\${patient.risk}</span>
                </div>
                <div class="patient-details">
                    <div class="detail-item">
                        <i data-lucide="clipboard"></i>
                        <span>\${patient.condition || 'No condition specified'}</span>
                    </div>
                    <div class="detail-item">
                        <i data-lucide="phone"></i>
                        <span>\${patient.phone || 'No phone'}</span>
                    </div>
                </div>
                <div class="patient-vitals-grid">
                    <div class="vital-mini">
                        <i data-lucide="heart-pulse"></i>
                        <span>\${patient.vitals.heartRate} BPM</span>
                    </div>
                    <div class="vital-mini">
                        <i data-lucide="thermometer"></i>
                        <span>\${patient.vitals.temperature}°F</span>
                    </div>
                    <div class="vital-mini">
                        <i data-lucide="wind"></i>
                        <span>\${patient.vitals.oxygen}%</span>
                    </div>
                </div>
                <button class="view-details-btn" onclick="doctorDashboard.viewPatientDetails('\${patient.id}')">
                    View Full Details
                    <i data-lucide="arrow-right"></i>
                </button>
            \`;
            grid.appendChild(card);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    async viewPatientDetails(patientId) {
        const local = this.patients.find(p => String(p.id) === String(patientId));
        if (local) {
            this.showPatientDetailsModal(local);
            return;
        }
        try {
            const url = ((typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.patientDetail) ? API_ENDPOINTS.patientDetail : ((typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + '/api/patients')) + `?patient_id=${patientId}`;
            const response = await fetch(url, {
                method: 'GET',
                ...(typeof FETCH_OPTIONS === 'object' ? { ...FETCH_OPTIONS, headers: { 'Content-Type': 'application/json', ...(FETCH_OPTIONS.headers || {}) } } : { headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
            });

            if (response.ok) {
                const { patient } = await response.json();
                this.showPatientDetailsModal(patient);
            }
        } catch (error) {
            console.error('Error loading patient details:', error);
            this.showError('Failed to load patient details');
        }
    }

    showPatientDetailsModal(patient) {
        const modal = document.getElementById('patientDetailModal');
        const content = document.getElementById('patientDetailContent');
        if (!modal || !content) return;

        content.innerHTML = \`
            <h2 class="patient-detail-title">\${patient.name}</h2>
            <div class="patient-detail-grid">
                <div class="detail-section glass-panel">
                    <h3><i data-lucide="user"></i> Personal Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Age:</label>
                            <span>\${patient.age} years</span>
                        </div>
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>\${patient.phone}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>\${patient.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Address:</label>
                            <span>\${patient.address}</span>
                        </div>
                        <div class="info-item">
                            <label>Emergency Contact:</label>
                            <span>\${patient.emergency_contact}</span>
                        </div>
                        <div class="info-item">
                            <label>Medical Condition:</label>
                            <span>\${patient.condition}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section glass-panel">
                    <h3><i data-lucide="activity"></i> Current Vitals</h3>
                    <div class="vitals-grid">
                        <div class="vital-item">
                            <i data-lucide="heart-pulse"></i>
                            <span class="vital-value">\${patient.vitals.heartRate}</span>
                            <span class="vital-label">Heart Rate (BPM)</span>
                        </div>
                        <div class="vital-item">
                            <i data-lucide="thermometer"></i>
                            <span class="vital-value">\${patient.vitals.temperature}</span>
                            <span class="vital-label">Temperature (°F)</span>
                        </div>
                        <div class="vital-item">
                            <i data-lucide="wind"></i>
                            <span class="vital-value">\${patient.vitals.oxygen}</span>
                            <span class="vital-label">Oxygen (%)</span>
                        </div>
                        <div class="vital-item">
                            <i data-lucide="activity"></i>
                            <span class="vital-value">\${patient.vitals.systolic}/\${patient.vitals.diastolic}</span>
                            <span class="vital-label">Blood Pressure</span>
                        </div>
                    </div>
                </div>

                \${this.renderActiveAlerts(patient)}
                \${this.renderMedicationReminders(patient)}
            </div>

            <div class="detail-actions">
                <button class="btn-primary" onclick="doctorDashboard.openNewReportModal('\${patient.id}')">
                    <i data-lucide="file-plus"></i>
                    New Report
                </button>
                <button class="btn-secondary" onclick="doctorDashboard.openCommunication('\${patient.id}')">
                    <i data-lucide="message-circle"></i>
                    Send Message
                </button>
            </div>
        \`;

        modal.classList.add('active');
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        // Close button handler
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    }

    renderActiveAlerts(patient) {
        if (!patient.alerts || patient.alerts.length === 0) return '';

        return \`
            <div class="detail-section glass-panel">
                <h3><i data-lucide="alert-triangle"></i> Active Alerts</h3>
                <div class="alerts-list">
                    \${patient.alerts.map(alert => \`
                        <div class="alert-item alert-\${alert.severity}">
                            <i data-lucide="alert-circle"></i>
                            <div class="alert-content">
                                <strong>\${alert.message}</strong>
                                <span>\${this.formatTimestamp(alert.timestamp)}</span>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            </div>
        \`;
    }

    renderMedicationReminders(patient) {
        if (!patient.reminders || patient.reminders.length === 0) return '';

        return \`
            <div class="detail-section glass-panel">
                <h3><i data-lucide="pill"></i> Medication Reminders</h3>
                <div class="reminders-list">
                    \${patient.reminders.map(reminder => \`
                        <div class="reminder-item">
                            <i data-lucide="clock"></i>
                            <div class="reminder-content">
                                <strong>\${reminder.medicine} - \${reminder.dosage}</strong>
                                <span>\${reminder.frequency} at \${reminder.time}</span>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            </div>
        \`;
    }

    async openNewReportModal(patientId) {
        const existingModal = document.getElementById('reportCreationModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'reportCreationModal';
        modal.className = 'modal';
        modal.innerHTML = \`
            <div class="modal-content glass-panel">
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i data-lucide="x"></i>
                </button>
                <h2 class="modal-title">Create Medical Report</h2>
                <form id="reportForm" onsubmit="doctorDashboard.handleReportSubmit(event)">
                    <input type="hidden" name="patient_id" value="\${patientId}">
                    <div class="form-group">
                        <label>Report Type</label>
                        <select name="report_type" class="form-input" required>
                            <option value="consultation">Consultation</option>
                            <option value="diagnosis">Diagnosis</option>
                            <option value="prescription">Prescription</option>
                            <option value="progress">Progress Note</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Report Content</label>
                        <textarea name="content" class="form-input" rows="10" 
                                 placeholder="Enter report details..." required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i data-lucide="save"></i>
                        Save Report
                    </button>
                </form>
            </div>
        \`;

        document.body.appendChild(modal);
        modal.classList.add('active');
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    async handleReportSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/reports/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${localStorage.getItem('token')}\`
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'include'
            });

            if (response.ok) {
                this.showSuccess('Report created successfully');
                form.closest('.modal').remove();
            } else {
                throw new Error('Failed to create report');
            }
        } catch (error) {
            console.error('Error creating report:', error);
            this.showError('Failed to create report');
        }
    }

    async openCommunication(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        // Switch to communication tab
        const commTab = document.querySelector('[data-tab="communication"]');
        if (commTab) {
            commTab.click();
        }

        // Select the patient in the dropdown
        const select = document.getElementById('communicationPatientSelect');
        if (select) {
            select.value = patientId;
            select.dispatchEvent(new Event('change'));
        }
    }

    setupCommunicationHandlers() {
        const select = document.getElementById('communicationPatientSelect');
        const sendBtn = document.getElementById('sendMessageBtn');
        const dictationBtn = document.getElementById('dictationBtn');

        if (select) {
            select.addEventListener('change', () => {
                this.renderMessageHistory(select.value);
            });
        }
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendCommunicationMessage());
        }
        if (dictationBtn && window.voiceAssistant) {
            dictationBtn.addEventListener('click', () => {
                window.voiceAssistant.openModal();
            });
        }
    }

    populateCommunicationPatients() {
        const select = document.getElementById('communicationPatientSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Choose a patient...</option>' +
            this.patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }

    renderMessageHistory(patientId) {
        const container = document.getElementById('messageHistory');
        if (!container) return;
        container.innerHTML = '';
        if (!patientId) return;
        const loadLocal = async () => {
            try {
                const resp = await fetch('data/messages.json', { cache: 'no-store' });
                if (resp.ok) {
                    const data = await resp.json();
                    const list = data.messages || data || [];
                    const messages = list.filter(m => String(m.patient_id) === String(patientId));
                    messages.forEach(msg => {
                        const el = document.createElement('div');
                        el.className = `message-item ${msg.from || 'patient'}`;
                        el.innerHTML = `<div class="bubble"><p>${msg.text}</p><span class="time">${this.formatTimestamp(msg.timestamp || Date.now())}</span></div>`;
                        container.appendChild(el);
                    });
                    return true;
                }
            } catch (e) { }
            return false;
        };
        loadLocal().then(loaded => {
            if (loaded) return;
            // Placeholder history (frontend-only demo)
            const messages = [
                { from: 'doctor', text: 'How are you feeling today?', time: Date.now()-7200_000 },
                { from: 'patient', text: 'Feeling better, thanks!', time: Date.now()-7100_000 }
            ];
            messages.forEach(msg => {
                const el = document.createElement('div');
                el.className = `message-item ${msg.from}`;
                el.innerHTML = `<div class="bubble"><p>${msg.text}</p><span class="time">${this.formatTimestamp(msg.time)}</span></div>`;
                container.appendChild(el);
            });
        });
    }

    async sendCommunicationMessage() {
        const select = document.getElementById('communicationPatientSelect');
        const textarea = document.getElementById('communicationMessage');
        const patientId = select ? select.value : '';
        const text = textarea ? textarea.value.trim() : '';
        if (!patientId || !text) return;

        try {
            const response = await fetch((API_ENDPOINTS && API_ENDPOINTS.voice) || (((typeof API_BASE_URL!=='undefined'?API_BASE_URL:'') + '/api/voice')), {
                method: 'POST',
                ...(typeof FETCH_OPTIONS === 'object' ? { ...FETCH_OPTIONS, headers: { 'Content-Type': 'application/json', ...(FETCH_OPTIONS.headers || {}) } } : { headers: { 'Content-Type': 'application/json' } }),
                body: JSON.stringify({ text: `Message to patient ${patientId}: ${text}`, user_id: patientId })
            });
            if (!response.ok) throw new Error('send failed');
            this.appendMessageToHistory('doctor', text);
            if (textarea) textarea.value = '';
            if (typeof showToast === 'function') showToast('Message sent', 'info', 1500);
        } catch (e) {
            console.error('Error sending message:', e);
            this.appendMessageToHistory('doctor', text);
            if (typeof showToast === 'function') showToast('Sending offline; will retry later.', 'error');
        }
    }

    appendMessageToHistory(from, text) {
        const container = document.getElementById('messageHistory');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `message-item ${from}`;
        el.innerHTML = `<div class="bubble"><p>${text}</p><span class="time">${this.formatTimestamp(Date.now())}</span></div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    async loadDoctorAlerts() {
        const container = document.getElementById('doctorAlertsTimeline');
        if (!container) return;
        container.innerHTML = '';
        try {
            const localResp = await fetch('data/alerts.json', { cache: 'no-store' });
            if (localResp.ok) {
                const data = await localResp.json();
                this.alerts = data.alerts || data || [];
            } else {
                const url = (typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.alerts) ? API_ENDPOINTS.alerts : ((typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + '/api/alerts');
                const response = await fetch(url, {
                    method: 'GET',
                    ...(typeof FETCH_OPTIONS === 'object' ? { ...FETCH_OPTIONS, headers: { 'Content-Type': 'application/json', ...(FETCH_OPTIONS.headers || {}) } } : { headers: { 'Content-Type': 'application/json' } })
                });
                if (response.ok) {
                    const data = await response.json();
                    this.alerts = data.alerts || data || [];
                } else {
                    throw new Error('non-200');
                }
            }
        } catch (e) {
            // Fallback sample alerts including emergency with vitals
            this.alerts = [
                { id: 1, type: 'emergency', patient: 'John Doe', patientId: 'P-1001', message: 'Emergency button pressed', timestamp: Date.now()-2*60_000, severity: 'high', vitals: { heartRate: 120, oxygen: 92, systolic: 154, diastolic: 98, temperature: 100.4 } },
                { id: 2, type: 'vital', patient: 'Jane Smith', patientId: 'P-1002', message: 'Elevated fasting glucose', timestamp: Date.now()-45*60_000, severity: 'medium', vitals: { heartRate: 78, oxygen: 97, systolic: 128, diastolic: 82, temperature: 98.4 } },
                { id: 3, type: 'reminder', patient: 'Carlos Ruiz', patientId: 'P-1004', message: 'Missed inhaler dose', timestamp: Date.now()-70*60_000, severity: 'low' }
            ];
            if (typeof showToast === 'function') showToast('Failed to load alerts, showing sample.', 'error');
        }
        this.renderDoctorAlerts();
    }

    renderDoctorAlerts() {
        const container = document.getElementById('doctorAlertsTimeline');
        if (!container) return;
        container.innerHTML = '';
        
        // Sort alerts with emergencies first, then by timestamp
        const sortedAlerts = [...this.alerts].sort((a, b) => {
            if (a.type === 'emergency' && b.type !== 'emergency') return -1;
            if (b.type === 'emergency' && a.type !== 'emergency') return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        sortedAlerts.forEach((a, i) => {
            const item = document.createElement('div');
            item.className = `alert-timeline-item fade-in-up alert-${a.type}`;
            item.style.animationDelay = `${i*0.05}s`;
            const icon = a.type === 'emergency' ? 'siren' : (a.severity==='high'?'alert-triangle':'bell');
            
            const vitalsHtml = a.vitals ? `
                <div class="alert-vitals ${this.getVitalsStatusClass(a.vitals)}">
                    <div class="vital-chip ${this.getVitalStatusClass(a.vitals.heartRate, 60, 100)}">
                        <i data-lucide="heart-pulse"></i> ${a.vitals.heartRate || '--'} BPM
                    </div>
                    <div class="vital-chip ${this.getVitalStatusClass(a.vitals.oxygen, 95, 100, true)}">
                        <i data-lucide="wind"></i> ${a.vitals.oxygen || '--'}% O2
                    </div>
                    <div class="vital-chip ${this.getVitalStatusClass((a.vitals.systolic || 0), 90, 140)}">
                        <i data-lucide="activity"></i> ${a.vitals.systolic || '--'}/${a.vitals.diastolic || '--'} mmHg
                    </div>
                    <div class="vital-chip ${this.getVitalStatusClass(a.vitals.temperature, 97, 99.5)}">
                        <i data-lucide="thermometer"></i> ${a.vitals.temperature || '--'}°F
                    </div>
                </div>
                <div class="alert-actions">
                    ${a.type === 'emergency' ? `
                        <button class="btn-emergency-action" onclick="doctorDashboard.acknowledgeEmergency('${a.id}')">
                            <i data-lucide="check-circle"></i> Acknowledge
                        </button>
                        <button class="btn-emergency-action" onclick="doctorDashboard.initiateCall('${a.id}', '${a.patient}')">
                            <i data-lucide="phone"></i> Call Patient
                        </button>
                    ` : ''}
                </div>
            ` : '';

            let headerClass = a.type === 'emergency' ? 'emergency-header' : '';
            item.innerHTML = `
                <div class="alert-icon ${a.severity}"><i data-lucide="${icon}"></i></div>
                <div class="alert-content">
                    <div class="alert-header ${headerClass}"><strong>${a.patient}</strong> • <span>${this.formatTimestamp(a.timestamp)}</span></div>
                    <div class="alert-message">${a.message}</div>
                    ${vitalsHtml}
                </div>`;

            if (a.type === 'emergency') {
                item.classList.add('emergency-alert');
                // Play alert sound for new emergencies
                if (this.isNewEmergency(a)) {
                    this.playEmergencySound();
                }
            }
            container.appendChild(item);
        });
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    formatVitalsStatus(vitals) {
        if (!vitals) return 'No data';

        const issues = [];
        if (vitals.heartRate > 100 || vitals.heartRate < 60) issues.push('Abnormal HR');
        if (vitals.temperature > 99.5) issues.push('Elevated Temp');
        if (vitals.oxygen < 95) issues.push('Low O2');
        if (vitals.systolic > 140 || vitals.diastolic > 90) issues.push('High BP');

        return issues.length ? issues.join(', ') : 'Normal';
    }

    getVitalsStatusClass(vitals) {
        if (!vitals) return '';
        
        // Check if any vital signs are critical
        const isCritical = 
            vitals.heartRate > 100 || vitals.heartRate < 60 ||
            vitals.oxygen < 92 ||
            vitals.temperature > 100.4 ||
            (vitals.systolic && (vitals.systolic > 140 || vitals.systolic < 90)) ||
            (vitals.diastolic && (vitals.diastolic > 90 || vitals.diastolic < 60));
            
        return isCritical ? 'vitals-critical' : 'vitals-normal';
    }

    getVitalStatusClass(value, min, max, inverse = false) {
        if (!value) return '';
        
        if (inverse) {
            return value < min ? 'vital-critical' : 'vital-normal';
        }
        
        return (value < min || value > max) ? 'vital-critical' : 'vital-normal';
    }

    isNewEmergency(alert) {
        if (!alert || !alert.timestamp) return false;
        const alertTime = new Date(alert.timestamp);
        const now = new Date();
        return (now - alertTime) < 300000; // 5 minutes
    }

    playEmergencySound() {
        const audio = new Audio('/assets/audio/emergency_alert.mp3');
        audio.play().catch(console.error);
    }

    async acknowledgeEmergency(alertId) {
        try {
            const response = await fetch('/api/alerts/acknowledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alert_id: alertId,
                    status: 'acknowledged'
                })
            });

            if (response.ok) {
                // Remove the alert from the display
                this.alerts = this.alerts.filter(a => a.id !== alertId);
                this.renderDoctorAlerts();
                this.showSuccess('Emergency acknowledged');
            }
        } catch (error) {
            console.error('Error acknowledging emergency:', error);
            this.showError('Failed to acknowledge emergency');
        }
    }

    initiateCall(alertId, patientName) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content glass-panel">
                <h2>Emergency Call</h2>
                <p>Initiating emergency call to ${patientName}</p>
                <div class="call-actions">
                    <button onclick="location.href='tel:911'" class="btn-emergency">
                        <i data-lucide="phone"></i> Call Emergency Services
                    </button>
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    getLastAlertTime(patientId) {
        const alert = this.alerts.find(a => a.patientId === patientId);
        return alert ? this.formatTimestamp(alert.timestamp) : 'No recent alerts';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return \`\${Math.floor(diff/60000)}m ago\`;
        if (diff < 86400000) return \`\${Math.floor(diff/3600000)}h ago\`;
        return date.toLocaleDateString();
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

// Initialize dashboard
const doctorDashboard = new DoctorDashboard();
window.doctorDashboard = doctorDashboard;
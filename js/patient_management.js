// ============================================
// PATIENT MANAGEMENT MODULE
// For Doctors and Caregivers
// ============================================

class PatientManagement {
    constructor() {
        this.patients = [];
        this.init();
    }

    init() {
        console.log('Patient Management initialized');
        this.loadPatients();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Patient button
        const addPatientBtn = document.getElementById('addPatientBtn');
        if (addPatientBtn) {
            addPatientBtn.addEventListener('click', () => this.openAddPatientModal());
        }

        // Close modal button
        const closeModalBtn = document.getElementById('closePatientModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeAddPatientModal());
        }

        // Patient form submission
        const patientForm = document.getElementById('addPatientForm');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPatient();
            });
        }
    }

    async loadPatients() {
        try {
            // Prefer local data for caregivers
            const localResp = await fetch('data/patients.json', { cache: 'no-store' });
            if (localResp.ok) {
                const data = await localResp.json();
                this.patients = (data.patients || data || []).map(p => ({
                    id: String(p.id),
                    name: p.name,
                    email: p.email || '',
                    age: p.age || 0,
                    condition: p.condition || '',
                    status: p.status || 'active'
                }));
                this.displayPatients();
                return;
            }

            // Fallback to backend API
            const url = (typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.patients) ? API_ENDPOINTS.patients : ((typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + '/api/patients');
            const response = await fetch(url, { ...(typeof FETCH_OPTIONS==='object'?FETCH_OPTIONS:{}), method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                this.patients = (data.patients || data || []).map(p => ({
                    id: String(p.id),
                    name: p.name,
                    email: p.email || '',
                    age: p.age || 0,
                    condition: p.condition || '',
                    status: p.status || 'active'
                }));
                this.displayPatients();
                return;
            }

            // Final fallback sample
            this.patients = [
                { id: '1', name: 'John Doe', email: 'john@example.com', age: 65, condition: 'Hypertension', status: 'active' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 72, condition: 'Diabetes', status: 'active' }
            ];
            this.displayPatients();
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    }

    displayPatients() {
        const container = document.getElementById('patientsList');
        if (!container) return;

        if (this.patients.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass-panel">
                    <i data-lucide="user-x" class="empty-icon"></i>
                    <p>No patients added yet. Add your first patient to get started.</p>
                </div>
            `;
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
            return;
        }

        container.innerHTML = '';
        this.patients.forEach((patient, index) => {
            const patientCard = document.createElement('div');
            patientCard.className = `patient-item glass-panel fade-in-up`;
            patientCard.style.animationDelay = `${index * 0.1}s`;
            patientCard.innerHTML = `
                <div class="patient-item-header">
                    <div class="patient-avatar">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="patient-info">
                        <h4 class="patient-name">${patient.name}</h4>
                        <p class="patient-email">${patient.email}</p>
                    </div>
                    <div class="patient-status status-${patient.status}">
                        <span class="status-dot"></span>
                        ${patient.status}
                    </div>
                </div>
                <div class="patient-details">
                    <div class="detail-item">
                        <i data-lucide="calendar"></i>
                        <span>Age: ${patient.age} years</span>
                    </div>
                    <div class="detail-item">
                        <i data-lucide="heart-pulse"></i>
                        <span>Condition: ${patient.condition}</span>
                    </div>
                </div>
                <div class="patient-actions">
                    <button class="action-btn" onclick="patientManagement.viewPatient('${patient.id}')">
                        <i data-lucide="eye"></i> View
                    </button>
                    <button class="action-btn" onclick="patientManagement.editPatient('${patient.id}')">
                        <i data-lucide="edit"></i> Edit
                    </button>
                    <button class="action-btn danger" onclick="patientManagement.deletePatient('${patient.id}')">
                        <i data-lucide="trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(patientCard);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    openAddPatientModal() {
        const modal = document.getElementById('addPatientModal');
        if (modal) {
            modal.classList.add('active');
            // Reset form
            const form = document.getElementById('addPatientForm');
            if (form) {
                form.reset();
            }
        }
    }

    closeAddPatientModal() {
        const modal = document.getElementById('addPatientModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async addPatient() {
        const form = document.getElementById('addPatientForm');
        if (!form) return;

        const formData = new FormData(form);
        const patientData = {
            name: formData.get('name') || document.getElementById('patientName').value,
            email: formData.get('email') || document.getElementById('patientEmail').value,
            age: parseInt(formData.get('age') || document.getElementById('patientAge').value),
            phone: formData.get('phone') || document.getElementById('patientPhone').value,
            condition: formData.get('condition') || document.getElementById('patientCondition').value,
            address: formData.get('address') || document.getElementById('patientAddress').value,
            emergency_contact: formData.get('emergency_contact') || document.getElementById('emergencyContact').value
        };

        try {
            // TODO: Save to backend
            // const response = await fetch('/api/patients/create', {
            //     method: 'POST',
            //     ...FETCH_OPTIONS,
            //     body: JSON.stringify(patientData)
            // });

            // if (response.ok) {
            //     const data = await response.json();
            //     this.patients.push(data.patient);
            //     this.displayPatients();
            //     this.closeAddPatientModal();
            //     this.showMessage('Patient added successfully', 'success');
            // }

            // For now, add locally
            const newPatient = {
                id: String(this.patients.length + 1),
                ...patientData,
                status: 'active'
            };
            this.patients.push(newPatient);
            this.displayPatients();
            this.closeAddPatientModal();
            this.showMessage('Patient added successfully', 'success');
        } catch (error) {
            console.error('Error adding patient:', error);
            this.showMessage('Error adding patient. Please try again.', 'error');
        }
    }

    viewPatient(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        // Persist selection for downstream pages
        try { sessionStorage.setItem('userId', String(patient.id)); } catch (e) {}
        // Navigate to live patient dashboard with context
        const url = `patient.html?patient_id=${encodeURIComponent(patient.id)}`;
        window.open(url, '_blank');
    }

    editPatient(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        // Populate form and open modal
        document.getElementById('patientName').value = patient.name;
        document.getElementById('patientEmail').value = patient.email;
        document.getElementById('patientAge').value = patient.age;
        document.getElementById('patientCondition').value = patient.condition;
        
        this.openAddPatientModal();
        // TODO: Update form to show "Edit" mode
    }

    async deletePatient(patientId) {
        if (!confirm('Are you sure you want to delete this patient?')) {
            return;
        }

        try {
            // TODO: Delete from backend
            // const response = await fetch(`/api/patients/${patientId}`, {
            //     method: 'DELETE',
            //     ...FETCH_OPTIONS
            // });

            // if (response.ok) {
            //     this.patients = this.patients.filter(p => p.id !== patientId);
            //     this.displayPatients();
            //     this.showMessage('Patient deleted successfully', 'success');
            // }

            // For now, delete locally
            this.patients = this.patients.filter(p => p.id !== patientId);
            this.displayPatients();
            this.showMessage('Patient deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showMessage('Error deleting patient. Please try again.', 'error');
        }
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
const patientManagement = new PatientManagement();
window.patientManagement = patientManagement;


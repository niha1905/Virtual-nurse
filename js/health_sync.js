// ============================================
// GOOGLE HEALTH SYNC MODULE
// ============================================

class GoogleHealthSync {
    constructor() {
        this.isAuthenticated = false;
        this.syncEnabled = false;
        this.init();
    }

    init() {
        console.log('Google Health Sync module initialized');
        this.setupEventListeners();
        this.checkAuthenticationStatus();
        // Load auto-sync preference
        try {
            const pref = localStorage.getItem('googleFitAutoSync');
            if (pref === 'true') {
                const autoSyncToggle = document.getElementById('enableAutoSync');
                if (autoSyncToggle) autoSyncToggle.checked = true;
                this.setAutoSync(true);
            }
        } catch (e) {
            console.warn('Could not read auto-sync preference', e);
        }
    }

    setupEventListeners() {
        // Authenticate button
        const authBtn = document.getElementById('authenticateGoogleFit');
        if (authBtn) {
            authBtn.addEventListener('click', () => this.authenticate());
        }

        // Sync button
        const syncBtn = document.getElementById('syncToGoogleFit');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncVitals());
        }

        // Enable auto-sync toggle
        const autoSyncToggle = document.getElementById('enableAutoSync');
        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('change', (e) => {
                this.setAutoSync(e.target.checked);
            });
        }

        // Sync activity button
        const syncActivityBtn = document.getElementById('syncActivity');
        if (syncActivityBtn) {
            syncActivityBtn.addEventListener('click', () => this.syncActivity());
        }
    }

    async checkAuthenticationStatus() {
        try {
            // Check if already authenticated by trying a retrieve
            const response = await fetch(`${API_ENDPOINTS.healthRetrieve}?user_id=1&data_type=vitals&days=1`, {
                ...FETCH_OPTIONS
            });

            // Update UI based on response
            this.updateAuthStatus(response.ok);
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.updateAuthStatus(false);
        }
    }

    async authenticate(userId = '1') {
        try {
            this.showLoading('Authenticating with Google Fit...');

            const response = await fetch(API_ENDPOINTS.healthAuthenticate, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = data.authenticated;
                
                if (this.isAuthenticated) {
                    this.showSuccess('Successfully authenticated with Google Fit!');
                    this.updateAuthStatus(true);
                } else {
                    this.showError('Authentication failed. Please try again.');
                    this.updateAuthStatus(false);
                }
            } else {
                throw new Error('Authentication request failed');
            }
        } catch (error) {
            console.error('Error authenticating:', error);
            this.showError('Error authenticating with Google Fit. Please check your credentials.');
            this.updateAuthStatus(false);
        } finally {
            this.hideLoading();
        }
    }

    async syncVitals(userId = '1') {
        if (!this.isAuthenticated) {
            // Auto-authenticate first
            await this.authenticate(userId);
            if (!this.isAuthenticated) {
                this.showError('Please authenticate first before syncing.');
                return;
            }
        }

        try {
            this.showLoading('Syncing vitals to Google Fit...');

            const response = await fetch(API_ENDPOINTS.healthSync, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({
                    user_id: userId,
                    data_type: 'vitals'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showSuccess('Vitals synced to Google Fit successfully!');
                    // Update last sync timestamp UI
                    try {
                        const lastSyncEl = document.getElementById('googleFitLastSync');
                        if (lastSyncEl) lastSyncEl.textContent = 'Last sync: ' + new Date().toLocaleString();
                    } catch (e) { }
                } else {
                    this.showError(data.message || 'Sync failed');
                }
            } else {
                throw new Error('Sync request failed');
            }
        } catch (error) {
            console.error('Error syncing vitals:', error);
            this.showError('Error syncing to Google Fit. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async syncActivity(userId = '1', activityData = null) {
        if (!this.isAuthenticated) {
            await this.authenticate(userId);
            if (!this.isAuthenticated) {
                this.showError('Please authenticate first before syncing.');
                return;
            }
        }

        // If no activity data provided, use default
        if (!activityData) {
            activityData = {
                steps: 0, // Get from step counter if available
                activity_type: 'walking',
                duration: 0
            };
        }

        try {
            this.showLoading('Syncing activity to Google Fit...');

            const response = await fetch(API_ENDPOINTS.healthSync, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({
                    user_id: userId,
                    data_type: 'activity',
                    activity: activityData
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showSuccess('Activity synced to Google Fit successfully!');
                } else {
                    this.showError(data.message || 'Sync failed');
                }
            } else {
                throw new Error('Sync request failed');
            }
        } catch (error) {
            console.error('Error syncing activity:', error);
            this.showError('Error syncing activity to Google Fit.');
        } finally {
            this.hideLoading();
        }
    }

    async retrieveFromGoogleFit(userId = '1', dataType = 'vitals', days = 30) {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.healthRetrieve}?user_id=${userId}&data_type=${dataType}&days=${days}`,
                { ...FETCH_OPTIONS }
            );

            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                throw new Error('Retrieve request failed');
            }
        } catch (error) {
            console.error('Error retrieving from Google Fit:', error);
            return null;
        }
    }

    updateAuthStatus(authenticated) {
        this.isAuthenticated = authenticated;

        const authStatus = document.getElementById('googleFitAuthStatus');
        const authBtn = document.getElementById('authenticateGoogleFit');
        const syncBtn = document.getElementById('syncToGoogleFit');

        if (authStatus) {
            authStatus.innerHTML = authenticated
                ? '<i data-lucide="check-circle" class="status-icon success"></i> Connected'
                : '<i data-lucide="x-circle" class="status-icon error"></i> Not Connected';
            lucide.createIcons();
        }

        if (authBtn) {
            authBtn.disabled = authenticated;
            if (authenticated) {
                authBtn.innerHTML = '<i data-lucide="check"></i> Authenticated';
            } else {
                authBtn.innerHTML = '<i data-lucide="link"></i> Connect Google Fit';
            }
            lucide.createIcons();
        }

        if (syncBtn) {
            syncBtn.disabled = false; // Always enabled
        }
    }

    setAutoSync(enabled) {
        this.syncEnabled = enabled;
        localStorage.setItem('googleFitAutoSync', enabled);

        if (enabled) {
            // Set up automatic syncing
            this.startAutoSync();
        } else {
            // Stop automatic syncing
            this.stopAutoSync();
        }
    }

    startAutoSync() {
        // Sync every hour
        this.autoSyncInterval = setInterval(() => {
            if (this.isAuthenticated) {
                this.syncVitals();
            }
        }, 60 * 60 * 1000); // 1 hour

        console.log('Auto-sync enabled');
    }

    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
        console.log('Auto-sync disabled');
    }

    showLoading(message) {
        let loadingDiv = document.getElementById('healthSyncLoading');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'healthSyncLoading';
            loadingDiv.className = 'loading-indicator glass-panel';
            document.body.appendChild(loadingDiv);
        }

        loadingDiv.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i><span>${message}</span>`;
        loadingDiv.style.display = 'flex';
        lucide.createIcons();
    }

    hideLoading() {
        const loadingDiv = document.getElementById('healthSyncLoading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    showSuccess(message) {
        const container = document.querySelector('.dashboard-container') || document.body;
        const successDiv = document.createElement('div');
        successDiv.className = 'message message-success fade-in-up';
        successDiv.innerHTML = `<i data-lucide="check-circle"></i> ${message}`;
        
        container.insertBefore(successDiv, container.firstChild);
        lucide.createIcons();
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    showError(message) {
        const container = document.querySelector('.dashboard-container') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error fade-in-up';
        errorDiv.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
        
        container.insertBefore(errorDiv, container.firstChild);
        lucide.createIcons();
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Global instance
const googleHealthSync = new GoogleHealthSync();
window.googleHealthSync = googleHealthSync;


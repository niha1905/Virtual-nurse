// ============================================
// ROLE SELECTION & LOGIN HANDLING
// ============================================

class RoleSelection {
    constructor() {
        this.currentRole = null;
        this.init();
    }

    init() {
        // Get Started button - goes directly to login
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.showLoginDirectly());
        }

        // Role selection buttons
        const roleButtons = document.querySelectorAll('.role-select-btn');
        roleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.currentTarget.getAttribute('data-role');
                this.selectRole(role);
            });
        });

        // Back to roles button
        const backBtn = document.getElementById('backToRoles');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showRoleSelection());
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Google Sign In
        const googleSignIn = document.getElementById('googleSignIn');
        if (googleSignIn) {
            googleSignIn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Check if user is already logged in
        this.checkExistingSession();
    }

    showRoleSelection() {
        // Hide hero, show role selection
        const heroSection = document.querySelector('.hero-section');
        const roleSection = document.getElementById('roleSelectionSection');
        const loginSection = document.getElementById('loginSection');
        const featuresSection = document.querySelector('.features-section');

        if (heroSection) heroSection.style.display = 'none';
        if (featuresSection) featuresSection.style.display = 'none';
        if (loginSection) loginSection.style.display = 'none';
        if (roleSection) {
            roleSection.style.display = 'block';
            roleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showLoginDirectly() {
        // Show login section directly (skip role selection)
        const heroSection = document.querySelector('.hero-section');
        const roleSection = document.getElementById('roleSelectionSection');
        const loginSection = document.getElementById('loginSection');
        const featuresSection = document.querySelector('.features-section');

        if (heroSection) heroSection.style.display = 'none';
        if (featuresSection) featuresSection.style.display = 'none';
        if (roleSection) roleSection.style.display = 'none';
        if (loginSection) {
            loginSection.style.display = 'block';
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    selectRole(role) {
        this.currentRole = role;
        console.log('Selected role:', role);

        // Update login section with role info
        const loginRoleText = document.getElementById('loginRoleText');
        if (loginRoleText) {
            const roleNames = {
                'patient': 'Patient',
                'caretaker': 'Caregiver',
                'doctor': 'Doctor'
            };
            loginRoleText.textContent = `Sign in as ${roleNames[role] || role}`;
        }

        // Show login section
        const roleSection = document.getElementById('roleSelectionSection');
        const loginSection = document.getElementById('loginSection');

        if (roleSection) roleSection.style.display = 'none';
        if (loginSection) {
            loginSection.style.display = 'block';
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            return;
        }

        try {
            // Use API_ENDPOINTS if available, otherwise use default
            const loginEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                API_ENDPOINTS.authLogin : '/api/auth/login';
            const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                FETCH_OPTIONS : { 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                };
            
            const response = await fetch(loginEndpoint, {
                method: 'POST',
                ...fetchOptions,
                body: JSON.stringify({
                    email,
                    password,
                    role: this.currentRole
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Store session
                if (rememberMe) {
                    localStorage.setItem('user_session', JSON.stringify({
                        email,
                        role: this.currentRole,
                        token: data.token
                    }));
                }

                // Redirect to appropriate dashboard
                this.redirectToDashboard(this.currentRole);
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Connection error. Please try again.', 'error');
        }
    }

    async handleGoogleSignIn() {
        // For Google Health API integration
        if (window.googleHealthSync) {
            try {
                await window.googleHealthSync.authenticate('1');
                // After successful auth, proceed with login
                this.showMessage('Google authentication successful!', 'success');
                // Redirect after a moment
                setTimeout(() => {
                    this.redirectToDashboard(this.currentRole);
                }, 1500);
            } catch (error) {
                console.error('Google sign-in error:', error);
                this.showMessage('Google sign-in failed. Please try again.', 'error');
            }
        } else {
            // Fallback: show message
            this.showMessage('Google Health integration is being set up. Please use email login for now.', 'info');
        }
    }

    redirectToDashboard(role) {
        const dashboards = {
            'patient': 'patient.html',
            'caretaker': 'caretaker.html',
            'doctor': 'doctor.html'
        };

        const dashboard = dashboards[role] || 'patient.html';
        window.location.href = dashboard;
    }

    checkExistingSession() {
        const session = localStorage.getItem('user_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                // Auto-redirect if session exists and not on login page
                if (!window.location.pathname.includes('index.html') && 
                    !window.location.pathname.includes('login')) {
                    this.redirectToDashboard(sessionData.role);
                }
            } catch (e) {
                console.warn('Invalid session data:', e);
            }
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type} fade-in-up`;
        messageEl.textContent = message;
        
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.insertBefore(messageEl, loginCard.firstChild);
            
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.roleSelection = new RoleSelection();
});


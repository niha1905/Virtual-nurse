// ============================================
// LOGIN PAGE HANDLER
// ============================================

class LoginPage {
    constructor() {
        this.currentRole = 'patient';
        this.init();
    }

    init() {
        // Role selection buttons
        const roleButtons = document.querySelectorAll('.role-btn-mini');
        roleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.currentTarget.getAttribute('data-role');
                this.selectRole(role);
            });
        });

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const icon = togglePassword.querySelector('i');
                icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
                if (window.lucide) {
                    lucide.createIcons();
                }
            });
        }

        // Google Sign In
        const googleSignIn = document.getElementById('googleSignIn');
        if (googleSignIn) {
            googleSignIn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Forgot password
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }
    }

    selectRole(role) {
        this.currentRole = role;
        
        // Update active button
        document.querySelectorAll('.role-btn-mini').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-role') === role) {
                btn.classList.add('active');
            }
        });

        // Update subtitle
        const roleText = document.getElementById('loginRoleText');
        if (roleText) {
            const roleNames = {
                'patient': 'Patient',
                'caretaker': 'Caregiver',
                'doctor': 'Doctor'
            };
            roleText.textContent = `Sign in as ${roleNames[role] || role}`;
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

        const submitBtn = document.querySelector('.login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Signing in...';
        if (window.lucide) {
            lucide.createIcons();
        }

        try {
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
                        token: data.token,
                        user: data.user
                    }));
                }

                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to appropriate dashboard
                setTimeout(() => {
                    this.redirectToDashboard(this.currentRole);
                }, 1000);
            } else {
                // Frontend-only fallback: try local users
                try {
                    const localUsersResp = await fetch('data/users.json', { cache: 'no-store' });
                    let users = [];
                    if (localUsersResp.ok) {
                        users = await localUsersResp.json();
                    }
                    const usersLocalRaw = localStorage.getItem('users_local');
                    if (usersLocalRaw) {
                        users = users.concat(JSON.parse(usersLocalRaw));
                    }
                    const found = users.find(u => u.email === email && (u.role === this.currentRole));
                    if (found) {
                        localStorage.setItem('user_session', JSON.stringify({
                            email: found.email,
                            name: found.name,
                            role: found.role,
                            token: 'dev-token',
                            user: found
                        }));
                        this.showMessage('Login successful (local). Redirecting...', 'success');
                        setTimeout(() => { this.redirectToDashboard(this.currentRole); }, 800);
                        return;
                    }
                } catch (e) {}

                const error = await response.json().catch(() => ({}));
                this.showMessage(error.error || 'Login failed. Please check your credentials.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Connection error. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async handleGoogleSignIn() {
        const googleSignInBtn = document.getElementById('googleSignIn');
        if (googleSignInBtn) {
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Signing in...';
            if (window.lucide) {
                lucide.createIcons();
            }
        }

        try {
            // Wait for Google Identity Services to load
            if (typeof google === 'undefined' || !google.accounts) {
                console.warn('Google Identity Services not loaded');
                await this.handleGoogleSignInBackend();
                return;
            }

            // Use Google Identity Services
            const client_id = '52502923312-d6q98n9lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com';
            
            google.accounts.id.initialize({
                client_id: client_id,
                callback: (response) => this.handleGoogleCallback(response),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Show the Google Sign In popup directly instead of one-tap
            google.accounts.oauth2.initCodeClient({
                client_id: client_id,
                scope: 'email profile',
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response.error);
                        this.showMessage('Google sign-in failed. Please try again.', 'error');
                        this.resetGoogleButton();
                    } else {
                        this.handleGoogleCallback(response);
                    }
                }
            }).requestCode();

        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showMessage('Google sign-in failed. Please try again or use email login.', 'error');
            this.resetGoogleButton();
        }
    }


    async handleGoogleCallback(response) {
        try {
            // Decode JWT token
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            // Send to backend for verification and login
            const loginEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                API_ENDPOINTS.authLogin : `${API_BASE_URL}/api/auth/login`;
            const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                FETCH_OPTIONS : { 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                };

            const backendResponse = await fetch(loginEndpoint, {
                method: 'POST',
                ...fetchOptions,
                body: JSON.stringify({
                    email: payload.email,
                    name: payload.name,
                    google_id: payload.sub,
                    role: this.currentRole,
                    google_token: response.credential
                })
            });

            if (backendResponse.ok) {
                const data = await backendResponse.json();
                
                // Store session
                localStorage.setItem('user_session', JSON.stringify({
                    email: payload.email,
                    name: payload.name,
                    role: this.currentRole,
                    token: data.token,
                    user: data.user
                }));

                this.showMessage('Google Sign-in successful! Redirecting...', 'success');
                setTimeout(() => {
                    this.redirectToDashboard(this.currentRole);
                }, 1000);
            } else {
                throw new Error('Backend authentication failed');
            }
        } catch (error) {
            console.error('Google callback error:', error);
            this.showMessage('Google sign-in failed. Please try again or use email login.', 'error');
            this.resetGoogleButton();
        }
    }

    async handleGoogleToken(accessToken) {
        try {
            // Get user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                
                // Login with Google account
                const loginEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                    API_ENDPOINTS.authLogin : `${API_BASE_URL}/api/auth/login`;
                const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                    FETCH_OPTIONS : { 
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    };

                const backendResponse = await fetch(loginEndpoint, {
                    method: 'POST',
                    ...fetchOptions,
                    body: JSON.stringify({
                        email: userInfo.email,
                        name: userInfo.name,
                        google_id: userInfo.id,
                        role: this.currentRole,
                        google_token: accessToken
                    })
                });

                if (backendResponse.ok) {
                    const data = await backendResponse.json();
                    
                    localStorage.setItem('user_session', JSON.stringify({
                        email: userInfo.email,
                        name: userInfo.name,
                        role: this.currentRole,
                        token: data.token,
                        user: data.user
                    }));

                    this.showMessage('Google Sign-in successful! Redirecting...', 'success');
                    setTimeout(() => {
                        this.redirectToDashboard(this.currentRole);
                    }, 1000);
                } else {
                    const error = await backendResponse.json();
                    throw new Error(error.error || 'Backend authentication failed');
                }
            } else {
                throw new Error('Failed to get user info from Google');
            }
        } catch (error) {
            console.error('Google token error:', error);
            this.showMessage('Google sign-in failed. Please try again or use email login.', 'error');
            this.resetGoogleButton();
        }
    }

    async handleGoogleSignInBackend() {
        // Fallback: Show message that Google Sign-in requires proper setup
        this.showMessage('Google Sign-in requires proper OAuth configuration. Please use email login for now, or contact support.', 'info');
        this.resetGoogleButton();
    }

    async checkGoogleAuthStatus() {
        try {
            const sessionEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                API_ENDPOINTS.authSession : '/api/auth/session';
            const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                FETCH_OPTIONS : { 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                };

            const response = await fetch(sessionEndpoint, fetchOptions);
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    this.showMessage('Google Sign-in successful! Redirecting...', 'success');
                    setTimeout(() => {
                        this.redirectToDashboard(this.currentRole);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    resetGoogleButton() {
        const googleSignInBtn = document.getElementById('googleSignIn');
        if (googleSignInBtn) {
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = '<i data-lucide="chrome"></i> Sign in with Google';
            if (window.lucide) {
                lucide.createIcons();
            }
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

    showForgotPasswordModal() {
        const email = document.getElementById('email').value;
        const message = email ? 
            `Password reset instructions will be sent to ${email}` : 
            'Please enter your email address first';
        this.showMessage(message, 'info');
        // TODO: Implement forgot password functionality
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existing = document.querySelector('.auth-message');
        if (existing) existing.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `auth-message message-${type} fade-in-up`;
        
        // Check if lucide is available, if not use a text fallback
        if (window.lucide) {
            messageEl.innerHTML = `
                <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}"></i>
                <span>${message}</span>
            `;
        } else {
            messageEl.innerHTML = `
                <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span>${message}</span>
            `;
        }
        
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.insertBefore(messageEl, loginCard.firstChild);
            if (window.lucide) {
                lucide.createIcons();
            }
            
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.loginPage = new LoginPage();
});


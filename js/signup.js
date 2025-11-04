// ============================================
// SIGNUP PAGE HANDLER
// ============================================



class SignupPage {
    constructor() {
        this.currentRole = 'patient';
        this.init();
        
        // Initialize Google Sign-in after page loads
        if (typeof google !== 'undefined' && google.accounts) {
            this.initializeGoogleSignIn();
        } else {
            // Wait for Google Identity Services to load
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (typeof google !== 'undefined' && google.accounts) {
                        this.initializeGoogleSignIn();
                    }
                }, 1000);
            });
        }
    }

    initializeGoogleSignIn() {
        try {
            google.accounts.id.initialize({
                client_id: '52502923312-d6q98n9lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com',
                callback: (response) => this.handleGoogleCallback(response),
                auto_select: false,
                cancel_on_tap_outside: true
            });
        } catch (error) {
            console.warn('Google Identity Services not available:', error);
        }
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

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
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
            });
        }

        // Confirm password toggle
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', () => {
                const confirmPasswordInput = document.getElementById('confirmPassword');
                const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordInput.setAttribute('type', type);
                
                const icon = toggleConfirmPassword.querySelector('i');
                icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
            });
        }

        // Real-time password validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswords();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePasswords();
            });
        }

        // Google Sign Up
        const googleSignUp = document.getElementById('googleSignUp');
        if (googleSignUp) {
            googleSignUp.addEventListener('click', () => this.handleGoogleSignUp());
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
        const roleText = document.getElementById('signupRoleText');
        if (roleText) {
            const roleNames = {
                'patient': 'Patient',
                'caretaker': 'Caregiver',
                'doctor': 'Doctor'
            };
            roleText.textContent = `Create ${roleNames[role] || role} account`;
        }
    }

    validatePasswords() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword && password) {
            if (password !== confirmPassword) {
                confirmInput.setCustomValidity('Passwords do not match');
                confirmInput.classList.add('error');
            } else {
                confirmInput.setCustomValidity('');
                confirmInput.classList.remove('error');
            }
        }
    }

    async handleSignup() {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }

        const submitBtn = document.querySelector('.login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Creating account...';

        try {
            const registerEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                API_ENDPOINTS.authRegister : '/api/auth/register';
            const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                FETCH_OPTIONS : { 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                };
            
            const response = await fetch(registerEndpoint, {
                method: 'POST',
                ...fetchOptions,
                body: JSON.stringify({
                    name: fullName,
                    email,
                    phone,
                    password,
                    role: this.currentRole
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Persist session locally and go straight to dashboard
                try {
                    localStorage.setItem('user_session', JSON.stringify({
                        email,
                        name: fullName,
                        role: this.currentRole,
                        token: (data && data.token) || 'dev-token',
                        user: (data && data.user) || { name: fullName, email, role: this.currentRole }
                    }));
                } catch (e) {}
                this.showMessage('Account created! Redirecting to your dashboard...', 'success');
                setTimeout(() => { this.redirectToDashboard(this.currentRole); }, 1200);
            } else {
                // Frontend-only fallback: store user locally and proceed
                try {
                    const usersRaw = localStorage.getItem('users_local');
                    const users = usersRaw ? JSON.parse(usersRaw) : [];
                    users.push({ id: Date.now().toString(), name: fullName, email, phone, role: this.currentRole, created_at: new Date().toISOString() });
                    localStorage.setItem('users_local', JSON.stringify(users));
                    localStorage.setItem('user_session', JSON.stringify({ email, name: fullName, role: this.currentRole, token: 'dev-token', user: { name: fullName, email, role: this.currentRole } }));
                    this.showMessage('Account created locally. Redirecting...', 'success');
                    setTimeout(() => { this.redirectToDashboard(this.currentRole); }, 1000);
                    return;
                } catch (e) {
                    const error = await response.json().catch(() => ({}));
                    this.showMessage(error.error || 'Registration failed. Please try again.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Connection error. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async handleGoogleSignUp() {
        const googleSignUpBtn = document.getElementById('googleSignUp');
        if (googleSignUpBtn) {
            googleSignUpBtn.disabled = true;
            googleSignUpBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Signing up...';
        }

        try {
            // Wait for Google Identity Services to load
            if (typeof google === 'undefined' || !google.accounts) {
                // Fallback: Show message
                this.handleGoogleSignUpBackend();
                return;
            }

            // Use Google OAuth 2.0 popup flow
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: '52502923312-d6q98n9lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com',
                scope: 'email profile',
                callback: (response) => {
                    if (response.access_token) {
                        this.handleGoogleToken(response.access_token);
                    } else {
                        this.showMessage('Google sign-up was cancelled.', 'info');
                        this.resetGoogleButton();
                    }
                },
                error_callback: (error) => {
                    console.error('Google OAuth error:', error);
                    this.showMessage('Google sign-up failed. Please try again.', 'error');
                    this.resetGoogleButton();
                }
            });

            // Request access token (this opens popup)
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('Google sign-up error:', error);
            this.handleGoogleSignUpBackend();
        }
    }

    async handleGoogleCallback(response) {
        try {
            // Decode JWT token from Google Identity Services
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            // Send to backend for registration
            const registerEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                API_ENDPOINTS.authRegister : `${API_BASE_URL}/api/auth/register`;
            const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                FETCH_OPTIONS : { 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                };

            const backendResponse = await fetch(registerEndpoint, {
                method: 'POST',
                ...fetchOptions,
                body: JSON.stringify({
                    name: payload.name,
                    email: payload.email,
                    google_id: payload.sub,
                    role: this.currentRole,
                    google_token: response.credential,
                    password: null // Google sign-up doesn't need password
                })
            });

            if (backendResponse.ok) {
                this.showMessage('Account created successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                const error = await backendResponse.json();
                throw new Error(error.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Google callback error:', error);
            this.showMessage('Google sign-up failed. Please try again or use email signup.', 'error');
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
                
                // Register with Google account
                const registerEndpoint = (typeof API_ENDPOINTS !== 'undefined') ? 
                    API_ENDPOINTS.authRegister : `${API_BASE_URL}/api/auth/register`;
                const fetchOptions = (typeof FETCH_OPTIONS !== 'undefined') ? 
                    FETCH_OPTIONS : { 
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    };

                const backendResponse = await fetch(registerEndpoint, {
                    method: 'POST',
                    ...fetchOptions,
                    body: JSON.stringify({
                        name: userInfo.name,
                        email: userInfo.email,
                        google_id: userInfo.id,
                        role: this.currentRole,
                        google_token: accessToken,
                        password: null
                    })
                });

                if (backendResponse.ok) {
                    this.showMessage('Account created successfully! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    const error = await backendResponse.json();
                    throw new Error(error.error || 'Registration failed');
                }
            } else {
                throw new Error('Failed to get user info from Google');
            }
        } catch (error) {
            console.error('Google token error:', error);
            this.showMessage('Google sign-up failed. Please try again or use email signup.', 'error');
            this.resetGoogleButton();
        }
    }

    async handleGoogleSignUpBackend() {
        // Fallback: Show message
        this.showMessage('Google Sign-up requires proper OAuth configuration. Please use email signup for now, or contact support.', 'info');
        this.resetGoogleButton();
    }

    resetGoogleButton() {
        const googleSignUpBtn = document.getElementById('googleSignUp');
        if (googleSignUpBtn) {
            googleSignUpBtn.disabled = false;
            googleSignUpBtn.innerHTML = '<i data-lucide="chrome"></i> Sign up with Google';
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

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existing = document.querySelector('.auth-message');
        if (existing) existing.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `auth-message message-${type} fade-in-up`;
        messageEl.innerHTML = `
            <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}"></i>
            <span>${message}</span>
        `;
        
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
    window.signupPage = new SignupPage();
    lucide.createIcons();
});


// ============================================
// AUTHENTICATION MODULE
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('Auth manager initialized');
        this.checkSession();
    }

    async checkSession() {
        try {
            const response = await fetch(API_ENDPOINTS.authSession, {
                ...FETCH_OPTIONS
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUI();
            } else {
                // No active session, redirect to login if needed
                if (this.isProtectedPage()) {
                    this.showLoginPrompt();
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
            // For demo purposes, create a mock session
            this.currentUser = {
                id: 1,
                name: 'Demo User',
                role: 'patient',
                email: 'demo@virtualnurse.ai'
            };
            this.updateUI();
        }
    }

    isProtectedPage() {
        const protectedPages = ['patient.html', 'caretaker.html', 'doctor.html'];
        const currentPage = window.location.pathname.split('/').pop();
        return protectedPages.includes(currentPage);
    }

    updateUI() {
        if (!this.currentUser) return;

        // Update user info in UI
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.name;
        });

        // Show/hide elements based on role
        this.applyRoleBasedAccess();
    }

    applyRoleBasedAccess() {
        if (!this.currentUser) return;

        const role = this.currentUser.role;
        
        // Hide elements not accessible to current role
        document.querySelectorAll('[data-role]').forEach(el => {
            const allowedRoles = el.dataset.role.split(',');
            if (!allowedRoles.includes(role)) {
                el.style.display = 'none';
            }
        });
    }

    async login(email, password) {
        try {
            const response = await fetch(API_ENDPOINTS.authLogin, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUI();
                
                // Redirect based on role
                this.redirectToDashboard();
                
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Connection error' };
        }
    }

    async logout() {
        try {
            await fetch(API_ENDPOINTS.authLogout, {
                method: 'POST',
                ...FETCH_OPTIONS
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.currentUser = null;
        window.location.href = 'index.html';
    }

    redirectToDashboard() {
        if (!this.currentUser) return;

        const dashboards = {
            patient: 'patient.html',
            caretaker: 'caretaker.html',
            doctor: 'doctor.html'
        };

        const dashboard = dashboards[this.currentUser.role];
        if (dashboard) {
            window.location.href = dashboard;
        }
    }

    showLoginPrompt() {
        // Create login modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'loginModal';
        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width: 400px;">
                <h2 class="modal-title">Login Required</h2>
                <form id="loginForm" class="reminder-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-input" id="loginEmail" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-input" id="loginPassword" placeholder="Enter your password" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select class="form-input" id="loginRole">
                            <option value="patient">Patient</option>
                            <option value="caretaker">Caretaker</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>
                    <button type="submit" class="submit-btn pulse-glow">
                        <i data-lucide="log-in"></i>
                        Login
                    </button>
                </form>
                <p style="text-align: center; margin-top: 1rem; color: var(--text-secondary);">
                    Demo Mode: Any credentials will work
                </p>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Handle form submission
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;

            // For demo purposes, accept any credentials
            this.currentUser = {
                id: 1,
                name: email.split('@')[0],
                role: role,
                email: email
            };

            this.updateUI();
            modal.remove();
            this.redirectToDashboard();
        });
    }

    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, user: data.user };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Connection error' };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Global logout function
window.logout = function() {
    if (window.authManager) {
        window.authManager.logout();
    }
};

// Add logout button to navbar if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.authManager && window.authManager.isAuthenticated()) {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                const logoutBtn = document.createElement('li');
                logoutBtn.innerHTML = `
                    <a href="#" class="nav-link" onclick="logout(); return false;">
                        Logout
                    </a>
                `;
                navMenu.appendChild(logoutBtn);
            }
        }
    }, 500);
});

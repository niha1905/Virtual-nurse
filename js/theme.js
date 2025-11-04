/* ============================================
   THEME MANAGEMENT
   ============================================ */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme on load
        if (this.currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        
        // Setup theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            this.updateThemeIcon();
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        this.currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
        
        // Add smooth transition effect
        document.body.style.transition = 'all 0.3s ease';
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) {
            const iconName = this.currentTheme === 'dark' ? 'moon' : 'sun';
            icon.setAttribute('data-lucide', iconName);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

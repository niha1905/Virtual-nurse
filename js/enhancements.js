// ============================================
// FRONTEND ENHANCEMENTS
// Interactive features and visual feedback
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all enhancements
    initFeatureCardAnimations();
    initVitalCardEnhancements();
    initButtonEnhancements();
    initTooltips();
    initLoadingStates();
    initMessageSystem();
});

// Feature Card Hover Animations
function initFeatureCardAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Vital Card Enhancements
function initVitalCardEnhancements() {
    const vitalCards = document.querySelectorAll('.vital-card, .stats-card, .card');
    
    vitalCards.forEach(card => {
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
        
        // Add click ripple effect
        card.addEventListener('click', (e) => {
            createRipple(e, card);
        });
    });
}

// Create ripple effect
function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Button Enhancements
function initButtonEnhancements() {
    const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .mic-button');
    
    buttons.forEach(button => {
        // Add glow class
        button.classList.add('btn-glow');
        
        // Click feedback
        button.addEventListener('click', function(e) {
            if (!button.disabled && !button.classList.contains('btn-loading')) {
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            }
        });
    });
}

// Button Loading State
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

// Tooltip System
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.classList.add('tooltip');
    });
}

// Loading States
function initLoadingStates() {
    // Show skeleton loaders while data is being fetched
    const chartContainers = document.querySelectorAll('.chart-container canvas');
    
    chartContainers.forEach(canvas => {
        const container = canvas.parentElement;
        if (!canvas.hasAttribute('data-loaded')) {
            showSkeletonLoader(container);
        }
    });
}

// Show skeleton loader
function showSkeletonLoader(container) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.style.height = container.clientHeight + 'px';
    skeleton.style.width = '100%';
    skeleton.dataset.skeleton = 'true';
    
    container.appendChild(skeleton);
}

// Remove skeleton loader
function removeSkeletonLoader(container) {
    const skeleton = container.querySelector('[data-skeleton="true"]');
    if (skeleton) {
        skeleton.remove();
    }
}

// Message System
let messageContainer = null;

function initMessageSystem() {
    messageContainer = document.createElement('div');
    messageContainer.id = 'message-container';
    messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(messageContainer);
}

// Show success message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show error message
function showError(message) {
    showMessage(message, 'error');
}

// Show message
function showMessage(message, type = 'success') {
    if (!messageContainer) initMessageSystem();
    
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    messageEl.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    
    messageContainer.appendChild(messageEl);
    
    // Initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(400px)';
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

// Progress Bar Animation
function animateProgressBar(elementId, targetValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const progressFill = element.querySelector('.progress-fill');
    if (!progressFill) return;
    
    let start = 0;
    const increment = targetValue / (duration / 16);
    
    const animate = () => {
        start += increment;
        if (start >= targetValue) {
            progressFill.style.width = `${targetValue}%`;
            return;
        }
        progressFill.style.width = `${start}%`;
        requestAnimationFrame(animate);
    };
    
    animate();
}

// Smooth Counter Animation
function animateCounter(elementId, targetValue, duration = 2000, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const start = 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (targetValue - start) * easeOut);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// Badge Status Indicator
function updateBadgeStatus(badgeElement, status) {
    if (!badgeElement) return;
    
    badgeElement.classList.remove('badge-success', 'badge-warning', 'badge-danger');
    
    switch (status.toLowerCase()) {
        case 'normal':
        case 'stable':
        case 'active':
            badgeElement.classList.add('badge-success');
            break;
        case 'warning':
        case 'elevated':
            badgeElement.classList.add('badge-warning');
            break;
        case 'critical':
        case 'danger':
        case 'high':
            badgeElement.classList.add('badge-danger');
            break;
    }
}

// Smooth Scroll
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Lazy animation on scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in, .slide-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Initialize scroll animations
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

// Add ripple effect CSS dynamically
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .card-hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }
`;
document.head.appendChild(rippleStyle);

// Export functions for global use
window.dashboardEnhancements = {
    showSuccess,
    showError,
    showMessage,
    setButtonLoading,
    animateProgressBar,
    animateCounter,
    updateBadgeStatus,
    smoothScrollTo,
    removeSkeletonLoader
};

// ON TOP - Authentication UI Components for Mobile Deployment

class ONTOPAuthUI {
    constructor() {
        this.isVisible = false;
        this.currentView = 'login'; // 'login' or 'register'
        this.init();
    }

    init() {
        this.createAuthModal();
        this.attachEventListeners();
        
        // Check if user is already logged in
        if (!window.AuthManager.isAuthenticated()) {
            this.show();
        } else {
            this.showWelcomeMessage();
        }
    }

    createAuthModal() {
        const authHTML = `
            <div id="auth-overlay" class="auth-overlay" style="display: none;">
                <div class="auth-container">
                    <div class="auth-header">
                        <div class="app-logo-auth">
                            <div class="logo-text-auth">
                                ON<br>
                                <div class="logo-line-auth"></div>
                                TOP
                            </div>
                        </div>
                        <p class="auth-tagline">Be on top of your money. Your health. Your goals. Your life.</p>
                    </div>

                    <!-- Login Form -->
                    <div id="login-form" class="auth-form">
                        <h2>Welcome Back</h2>
                        <p class="auth-subtitle">Sign in to continue your journey</p>
                        
                        <div class="form-group">
                            <input type="email" id="login-email" class="auth-input" placeholder="Email" required>
                        </div>
                        
                        <div class="form-group">
                            <input type="password" id="login-password" class="auth-input" placeholder="Password" required>
                        </div>
                        
                        <button id="login-btn" class="auth-btn auth-btn-primary">Sign In</button>
                        
                        <p class="auth-switch">
                            Don't have an account? 
                            <a href="#" id="show-register">Create one</a>
                        </p>
                        
                        <div class="auth-divider">
                            <span>OR</span>
                        </div>
                        
                        <button id="continue-guest" class="auth-btn auth-btn-secondary">Continue as Guest</button>
                        <p class="guest-note">Limited features • Data won't be saved</p>
                    </div>

                    <!-- Registration Form -->
                    <div id="register-form" class="auth-form" style="display: none;">
                        <h2>Create Account</h2>
                        <p class="auth-subtitle">Join thousands improving their lives</p>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" id="register-firstname" class="auth-input" placeholder="First Name" required>
                            </div>
                            <div class="form-group">
                                <input type="text" id="register-lastname" class="auth-input" placeholder="Last Name" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <input type="email" id="register-email" class="auth-input" placeholder="Email" required>
                        </div>
                        
                        <div class="form-group">
                            <input type="password" id="register-password" class="auth-input" placeholder="Password (8+ characters)" required>
                        </div>
                        
                        <div class="form-group">
                            <input type="password" id="register-confirm" class="auth-input" placeholder="Confirm Password" required>
                        </div>
                        
                        <button id="register-btn" class="auth-btn auth-btn-primary">Create Account</button>
                        
                        <p class="auth-switch">
                            Already have an account? 
                            <a href="#" id="show-login">Sign in</a>
                        </p>
                        
                        <p class="privacy-note">
                            By creating an account, you agree to our privacy policy and data handling practices.
                        </p>
                    </div>

                    <div id="auth-error" class="auth-error" style="display: none;"></div>
                    <div id="auth-loading" class="auth-loading" style="display: none;">
                        <div class="auth-spinner"></div>
                        <p>Please wait...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', authHTML);
        this.addAuthStyles();
    }

    addAuthStyles() {
        const styles = `
            <style>
                .auth-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                .auth-container {
                    background: #111;
                    border-radius: 20px;
                    padding: 40px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid #333;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .app-logo-auth {
                    margin-bottom: 20px;
                }

                .logo-text-auth {
                    font-family: 'Inter', sans-serif;
                    font-weight: 900;
                    font-size: 32px;
                    line-height: 0.8;
                    color: #fff;
                    text-align: center;
                    position: relative;
                }

                .logo-line-auth {
                    height: 3px;
                    background: #fff;
                    margin: 8px 0;
                    width: 100%;
                }

                .auth-tagline {
                    color: #888;
                    font-size: 14px;
                    line-height: 1.4;
                    margin: 0;
                }

                .auth-form h2 {
                    color: #fff;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    text-align: center;
                }

                .auth-subtitle {
                    color: #888;
                    font-size: 14px;
                    text-align: center;
                    margin-bottom: 30px;
                }

                .form-row {
                    display: flex;
                    gap: 15px;
                }

                .form-group {
                    margin-bottom: 20px;
                    flex: 1;
                }

                .auth-input {
                    width: 100%;
                    padding: 16px 20px;
                    background: #222;
                    border: 1px solid #333;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 16px;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }

                .auth-input:focus {
                    outline: none;
                    border-color: #555;
                    background: #2a2a2a;
                }

                .auth-input::placeholder {
                    color: #666;
                }

                .auth-btn {
                    width: 100%;
                    padding: 16px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 15px;
                    position: relative;
                    overflow: hidden;
                }

                .auth-btn-primary {
                    background: #fff;
                    color: #000;
                }

                .auth-btn-primary:hover {
                    background: #f0f0f0;
                    transform: translateY(-1px);
                }

                .auth-btn-secondary {
                    background: transparent;
                    color: #fff;
                    border: 1px solid #333;
                }

                .auth-btn-secondary:hover {
                    background: #222;
                    border-color: #555;
                }

                .auth-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .auth-switch {
                    text-align: center;
                    color: #888;
                    font-size: 14px;
                    margin: 20px 0;
                }

                .auth-switch a {
                    color: #fff;
                    text-decoration: none;
                    font-weight: 600;
                }

                .auth-switch a:hover {
                    text-decoration: underline;
                }

                .auth-divider {
                    text-align: center;
                    margin: 25px 0;
                    position: relative;
                    color: #666;
                    font-size: 12px;
                }

                .auth-divider::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #333;
                    z-index: -1;
                }

                .auth-divider span {
                    background: #111;
                    padding: 0 15px;
                }

                .guest-note {
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    margin-top: -10px;
                    margin-bottom: 20px;
                }

                .privacy-note {
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                    line-height: 1.4;
                    margin-top: 20px;
                }

                .auth-error {
                    background: #ff4444;
                    color: #fff;
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-top: 20px;
                    font-size: 14px;
                    text-align: center;
                }

                .auth-loading {
                    text-align: center;
                    margin-top: 20px;
                }

                .auth-spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #333;
                    border-top: 3px solid #fff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .auth-loading p {
                    color: #888;
                    font-size: 14px;
                }

                /* Mobile Optimization */
                @media (max-width: 480px) {
                    .auth-container {
                        padding: 30px 20px;
                        margin: 20px;
                        width: calc(100% - 40px);
                    }

                    .logo-text-auth {
                        font-size: 28px;
                    }

                    .auth-form h2 {
                        font-size: 22px;
                    }

                    .form-row {
                        flex-direction: column;
                        gap: 0;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEventListeners() {
        // Form switching
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToRegister();
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Login form
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-btn').addEventListener('click', () => {
            this.handleRegister();
        });

        // Guest mode
        document.getElementById('continue-guest').addEventListener('click', () => {
            this.continueAsGuest();
        });

        // Enter key handling
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('register-confirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });
    }

    switchToLogin() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.currentView = 'login';
        this.clearError();
    }

    switchToRegister() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.currentView = 'register';
        this.clearError();
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.showLoading(true);
        this.clearError();

        try {
            const user = await window.AuthManager.login(email, password);
            this.showLoading(false);
            this.hide();
            this.showWelcomeMessage(user);
            await window.AuthManager.loadUserDataFromServer();
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message || 'Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const firstName = document.getElementById('register-firstname').value.trim();
        const lastName = document.getElementById('register-lastname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            this.showError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        this.showLoading(true);
        this.clearError();

        try {
            const user = await window.AuthManager.register(email, password, firstName, lastName);
            this.showLoading(false);
            this.hide();
            this.showWelcomeMessage(user);
            await window.AuthManager.loadUserDataFromServer();
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message || 'Registration failed. Please try again.');
        }
    }

    continueAsGuest() {
        this.hide();
        this.showGuestMessage();
    }

    show() {
        document.getElementById('auth-overlay').style.display = 'flex';
        this.isVisible = true;
        
        // Hide main app content
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'none';
        }
    }

    hide() {
        document.getElementById('auth-overlay').style.display = 'none';
        this.isVisible = false;
        
        // Show main app content
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('auth-error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearError() {
        document.getElementById('auth-error').style.display = 'none';
    }

    showLoading(show) {
        document.getElementById('auth-loading').style.display = show ? 'block' : 'none';
        
        // Disable form buttons
        const buttons = document.querySelectorAll('.auth-btn');
        buttons.forEach(btn => {
            btn.disabled = show;
        });
    }

    showWelcomeMessage(user = null) {
        const currentUser = user || window.AuthManager.user;
        if (currentUser) {
            // Create welcome notification
            this.showNotification(`Welcome back, ${currentUser.firstName}! Your data is now synced across all your devices.`, 'success');
        }
    }

    showGuestMessage() {
        this.showNotification('Continuing as guest. Sign up to save your data and sync across devices.', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <p>${message}</p>
                <button class="auth-notification-close">&times;</button>
            </div>
        `;

        // Add notification styles if not already added
        if (!document.getElementById('notification-styles')) {
            const styles = `
                <style id="notification-styles">
                    .auth-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        max-width: 400px;
                        z-index: 10001;
                        border-radius: 12px;
                        padding: 16px 20px;
                        color: #fff;
                        font-size: 14px;
                        animation: slideInRight 0.3s ease;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .auth-notification-success {
                        background: rgba(0, 200, 0, 0.2);
                        border-color: rgba(0, 200, 0, 0.3);
                    }

                    .auth-notification-info {
                        background: rgba(100, 100, 100, 0.2);
                        border-color: rgba(100, 100, 100, 0.3);
                    }

                    .auth-notification-content {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 15px;
                    }

                    .auth-notification-content p {
                        margin: 0;
                        line-height: 1.4;
                        flex: 1;
                    }

                    .auth-notification-close {
                        background: none;
                        border: none;
                        color: #fff;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0.7;
                    }

                    .auth-notification-close:hover {
                        opacity: 1;
                    }

                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @media (max-width: 480px) {
                        .auth-notification {
                            right: 10px;
                            left: 10px;
                            max-width: none;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }

        document.body.appendChild(notification);

        // Close button functionality
        notification.querySelector('.auth-notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize Auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AuthUI = new ONTOPAuthUI();
});
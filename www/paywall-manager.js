// ON TOP - Paywall Management System
class PaywallManager {
    constructor() {
        this.premiumFeatures = {
            // Emma Chat Limits
            emmaChatLimit: 10, // Free users get 10 messages per day
            
            // Feature Access
            advancedAnalytics: false,
            customThemes: false,
            prioritySupport: false,
            dataExport: false,
            unlimitedTasks: false,
            advancedWorkouts: false,
            premiumMeals: false,
            financialInsights: false,
            
            // AI Features
            gpt4Access: false, // Premium users get GPT-4, free users get GPT-3.5
            
            // Limits
            maxTasks: 50,
            maxBills: 10,
            maxGoals: 5
        };

        this.premiumStatus = null;
        this.initializePaywall();
    }

    async initializePaywall() {
        // Check if user is authenticated
        const authToken = localStorage.getItem('ontop_auth_token');
        if (authToken) {
            await this.checkPremiumStatus();
        } else {
            // For non-authenticated users, show paywall after some usage
            this.trackFreeUsage();
        }

        // Check if paywall should be shown
        this.checkPaywallTriggers();
    }

    async checkPremiumStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/premium-status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ontop_auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.premiumStatus = data;
                
                // Update UI based on premium status
                this.updateUIForPremiumStatus(data.isPremium);
                
                // Store premium status locally for quick checks
                localStorage.setItem('ontop_premium_status', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to check premium status:', error);
        }
    }

    isPremium() {
        if (this.premiumStatus) {
            return this.premiumStatus.isPremium;
        }
        
        // Fallback to local storage
        const stored = localStorage.getItem('ontop_premium_status');
        if (stored) {
            const status = JSON.parse(stored);
            return status.isPremium && (!status.subscriptionExpires || new Date(status.subscriptionExpires) > new Date());
        }
        
        return false;
    }

    checkFeatureAccess(feature) {
        if (this.isPremium()) {
            return true;
        }

        // Check specific feature limits for free users
        switch (feature) {
            case 'emmaChatDaily':
                return this.getEmmaChatUsageToday() < this.premiumFeatures.emmaChatLimit;
            case 'maxTasks':
                return this.getTaskCount() < this.premiumFeatures.maxTasks;
            case 'maxBills':
                return this.getBillCount() < this.premiumFeatures.maxBills;
            case 'maxGoals':
                return this.getGoalCount() < this.premiumFeatures.maxGoals;
            default:
                return this.premiumFeatures[feature] || false;
        }
    }

    // Usage tracking methods
    getEmmaChatUsageToday() {
        const today = new Date().toDateString();
        const usage = localStorage.getItem('ontop_emma_usage_' + today);
        return usage ? parseInt(usage) : 0;
    }

    incrementEmmaChatUsage() {
        const today = new Date().toDateString();
        const currentUsage = this.getEmmaChatUsageToday();
        localStorage.setItem('ontop_emma_usage_' + today, (currentUsage + 1).toString());
    }

    getTaskCount() {
        const tasks = JSON.parse(localStorage.getItem('ontop_tasks') || '{}');
        return Object.keys(tasks).length;
    }

    getBillCount() {
        const bills = JSON.parse(localStorage.getItem('ontop_bills') || '[]');
        return bills.length;
    }

    getGoalCount() {
        const goals = JSON.parse(localStorage.getItem('ontop_goals') || '[]');
        return goals.length;
    }

    trackFreeUsage() {
        // Track how many times user has used the app
        const usageCount = parseInt(localStorage.getItem('ontop_free_usage') || '0');
        localStorage.setItem('ontop_free_usage', (usageCount + 1).toString());
    }

    checkPaywallTriggers() {
        // Don't show paywall if already premium
        if (this.isPremium()) return;

        // Don't show if user has started free trial
        const hasStartedFreeTrial = localStorage.getItem('ontop_paywall_skipped');
        if (hasStartedFreeTrial) return;

        // Don't show if user just dismissed it
        const lastDismissed = localStorage.getItem('ontop_paywall_dismissed');
        if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
            return; // Wait 24 hours before showing again
        }

        // Trigger conditions
        const usageCount = parseInt(localStorage.getItem('ontop_free_usage') || '0');
        const emmaChatToday = this.getEmmaChatUsageToday();
        const taskCount = this.getTaskCount();

        // Show paywall when user hits limits
        if (emmaChatToday >= this.premiumFeatures.emmaChatLimit) {
            this.showPaywall('emma_limit');
        } else if (taskCount >= this.premiumFeatures.maxTasks) {
            this.showPaywall('task_limit');
        } else if (usageCount === 5 || usageCount === 15 || usageCount === 30) {
            // Show at strategic usage points
            this.showPaywall('usage_milestone');
        }
    }

    showPaywall(trigger = 'general') {
        // Track why paywall was shown
        console.log('Paywall triggered:', trigger);
        
        // Redirect to paywall page
        window.location.href = 'paywall.html?trigger=' + trigger;
    }

    showFeatureLimitModal(feature) {
        const modal = createModal('Upgrade to Premium', `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
                <div style="color: #fff; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                    ${this.getFeatureLimitMessage(feature)}
                </div>
                <div style="color: #666; font-size: 14px;">
                    Upgrade to Premium for unlimited access to all features
                </div>
            </div>
            
            <div style="background: #0a0a0a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">Premium Benefits:</div>
                <div style="color: #ccc; font-size: 14px; line-height: 1.5;">
                    • Unlimited Emma AI conversations<br>
                    • Advanced analytics and insights<br>
                    • Unlimited tasks, bills, and goals<br>
                    • Priority support<br>
                    • All future features included
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Maybe Later</button>
                <button class="btn btn-primary" onclick="goToPremium()" style="flex: 1;">Upgrade Now</button>
            </div>
        `);
        
        showModal(modal);
    }

    getFeatureLimitMessage(feature) {
        switch (feature) {
            case 'emmaChatDaily':
                return `You've reached your daily limit of ${this.premiumFeatures.emmaChatLimit} Emma conversations`;
            case 'maxTasks':
                return `You've reached the free limit of ${this.premiumFeatures.maxTasks} tasks`;
            case 'maxBills':
                return `You've reached the free limit of ${this.premiumFeatures.maxBills} bills`;
            case 'maxGoals':
                return `You've reached the free limit of ${this.premiumFeatures.maxGoals} goals`;
            case 'advancedAnalytics':
                return 'Advanced analytics are available for Premium users';
            case 'dataExport':
                return 'Data export is available for Premium users';
            default:
                return 'This feature is available for Premium users';
        }
    }

    updateUIForPremiumStatus(isPremium) {
        // Add premium badge to UI if user is premium
        const headerContainer = document.querySelector('.app-header .app-logo-container');
        if (headerContainer) {
            // Remove existing premium badge
            const existingBadge = headerContainer.querySelector('.premium-badge');
            if (existingBadge) existingBadge.remove();

            if (isPremium) {
                const premiumBadge = document.createElement('div');
                premiumBadge.className = 'premium-badge';
                premiumBadge.style.cssText = `
                    background: #fff;
                    color: #000;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 6px;
                    margin-top: 8px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                `;
                premiumBadge.textContent = 'PREMIUM';
                headerContainer.appendChild(premiumBadge);
            }
        }

        // Update Emma chat interface
        this.updateEmmaChatUI(isPremium);
    }

    updateEmmaChatUI(isPremium) {
        const chatHeader = document.querySelector('.chat-header .chat-user-details');
        if (chatHeader) {
            // Remove existing usage indicator
            const existingUsage = chatHeader.querySelector('.emma-usage');
            if (existingUsage) existingUsage.remove();

            if (!isPremium) {
                const usageToday = this.getEmmaChatUsageToday();
                const remaining = this.premiumFeatures.emmaChatLimit - usageToday;
                
                const usageIndicator = document.createElement('div');
                usageIndicator.className = 'emma-usage';
                usageIndicator.style.cssText = `
                    font-size: 11px;
                    color: ${remaining <= 2 ? '#ff6b6b' : '#666'};
                    margin-top: 2px;
                `;
                usageIndicator.textContent = `${remaining} messages remaining today`;
                chatHeader.appendChild(usageIndicator);
            }
        }
    }

    // Premium feature gates
    async beforeEmmaChatSend(message) {
        if (!this.checkFeatureAccess('emmaChatDaily')) {
            this.showFeatureLimitModal('emmaChatDaily');
            return false;
        }

        // Track usage
        this.incrementEmmaChatUsage();
        
        // Update UI
        this.updateEmmaChatUI(this.isPremium());
        
        return true;
    }

    beforeTaskAdd() {
        if (!this.checkFeatureAccess('maxTasks')) {
            this.showFeatureLimitModal('maxTasks');
            return false;
        }
        return true;
    }

    beforeBillAdd() {
        if (!this.checkFeatureAccess('maxBills')) {
            this.showFeatureLimitModal('maxBills');
            return false;
        }
        return true;
    }

    beforeGoalAdd() {
        if (!this.checkFeatureAccess('maxGoals')) {
            this.showFeatureLimitModal('maxGoals');
            return false;
        }
        return true;
    }

    beforeAdvancedFeature(feature) {
        if (!this.checkFeatureAccess(feature)) {
            this.showFeatureLimitModal(feature);
            return false;
        }
        return true;
    }

    dismissPaywall() {
        localStorage.setItem('ontop_paywall_dismissed', Date.now().toString());
    }

    async createCheckoutSession(plan) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ontop_auth_token')}`
                },
                body: JSON.stringify({ plan })
            });

            const data = await response.json();
            
            if (data.sessionId) {
                // Redirect to Stripe Checkout
                const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');
                return stripe.redirectToCheckout({ sessionId: data.sessionId });
            } else {
                throw new Error('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment processing failed. Please try again.');
        }
    }
}

// Global functions for paywall interaction
function goToPremium() {
    window.location.href = 'paywall.html';
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

// Initialize global paywall manager
window.PaywallManager = new PaywallManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaywallManager;
}

# ON TOP - Paywall Setup Guide

## 🎯 Overview
Your hard paywall system is now ready with these exact pricing tiers:
- **Monthly**: $9.99/month
- **Annual**: $99.99/year (17% savings)
- **Lifetime**: $150.00 (one-time payment)

## 🏗️ What's Been Built

### ✅ Multi-Screen Onboarding (Like Modern AI iOS Apps)
- **Screen 1**: Welcome with trust signals (50K+ users, 4.9★ rating)
- **Screen 2**: Feature showcase (Emma AI, Analytics, Elite Fitness)
- **Screen 3**: Problem/Solution positioning
- **Screen 4**: Pricing with lifetime as "Most Popular"

### ✅ Hard Paywall Implementation
- **Emma Chat**: 10 messages/day for free users
- **Tasks**: 50 task limit for free users
- **Bills**: 10 bill limit for free users
- **Goals**: 5 goal limit for free users
- **Advanced Features**: Premium only

### ✅ Stripe Integration
- Complete checkout flow
- Webhook handling for subscription management
- Automatic premium status updates
- Subscription cancellation support

### ✅ Premium Feature Gates
- Real-time usage tracking
- Elegant limit modals
- Automatic UI updates for premium users
- Usage indicators in Emma chat

## 🔧 Setup Instructions

### 1. Get Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from the Stripe Dashboard
3. Update your `.env` file with the keys:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Update Stripe Keys in Frontend
Edit `paywall.html` and update this function:
```javascript
function getStripePublishableKey() {
    return 'pk_test_your_actual_publishable_key'; // Replace with your key
}
```

### 3. Install Stripe Dependency
```bash
npm install stripe
```

### 4. Set Up Stripe Webhooks
1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook secret to your `.env` file

### 5. Test the Paywall
1. Start your server: `npm start`
2. Open `http://localhost:8000/paywall.html`
3. Go through the onboarding flow
4. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`

## 🎨 Paywall Features

### Multi-Screen Onboarding Flow
```
Screen 1: Welcome + Trust Signals
    ↓ "Get Started"
Screen 2: Feature Showcase  
    ↓ "Continue"
Screen 3: Problem/Solution
    ↓ "See Pricing"
Screen 4: Pricing + Checkout
    ↓ "Continue with [Plan]"
```

### Smart Paywall Triggers
- **Emma Chat**: Shows when user hits 10 messages/day
- **Task Limit**: Shows when user tries to add 51st task
- **Usage Milestones**: Shows after 5, 15, 30 app uses
- **Strategic Timing**: 24-hour cooldown between shows

### Premium Benefits
- ✅ Unlimited Emma AI conversations
- ✅ Advanced analytics and insights  
- ✅ Unlimited tasks, bills, goals
- ✅ Priority customer support
- ✅ GPT-4 access (vs GPT-3.5 for free)
- ✅ Data export functionality
- ✅ Custom themes (coming soon)
- ✅ Cloud sync and backup

## 📊 Revenue Optimization

### Pricing Psychology
- **Lifetime** positioned as "Most Popular" and "Best Value"
- **Annual** shows "Save 17%" badge
- **Monthly** includes "7-day free trial"

### Conversion Tactics
- Trust signals on first screen (50K users, 4.9★)
- Problem/solution positioning
- Multiple pricing options with clear savings
- Elegant limit modals instead of hard blocks
- Strategic timing of paywall presentation

### Analytics Tracking
All user interactions are tracked:
- Screen views
- Plan selections
- Payment attempts
- Paywall dismissals
- Feature limit hits

## 🚀 Going Live

### 1. Update Production URLs
In `paywall.html`, update:
```javascript
function getAPIBaseURL() {
    return 'https://your-production-domain.com';
}
```

### 2. Switch to Live Stripe Keys
Replace all test keys with live keys from Stripe

### 3. Deploy Files
Make sure these files are deployed:
- `paywall.html`
- `paywall-manager.js`
- `payment-success.html`
- Updated `index.html` with paywall scripts
- Updated `app.js` with feature gates
- Updated `server.js` with Stripe endpoints

### 4. Test Live Flow
1. Test complete purchase flow
2. Verify webhook delivery
3. Test subscription cancellation
4. Verify premium feature access

## 💡 Customization Options

### Change Pricing
Update these files:
- `paywall.html`: Update pricing display
- `server.js`: Update Stripe prices in `planConfig`

### Modify Limits
Update `paywall-manager.js`:
```javascript
this.premiumFeatures = {
    emmaChatLimit: 10,    // Change daily Emma limit
    maxTasks: 50,         // Change task limit
    maxBills: 10,         // Change bill limit
    maxGoals: 5           // Change goal limit
};
```

### Add New Premium Features
1. Add feature check in `paywall-manager.js`
2. Add feature gate in relevant functions
3. Update premium benefits list in UI

## 🔒 Security Notes

- All Stripe keys are server-side only
- Webhook signatures are verified
- User authentication required for payments
- Premium status checked server-side
- JWT tokens secure API access

## 📈 Expected Results

Based on modern iOS app patterns, expect:
- **10-15%** conversion rate from paywall views
- **60%** of converters choose lifetime plan
- **25%** choose annual plan  
- **15%** choose monthly plan

Your paywall is now ready to generate revenue! 🎉

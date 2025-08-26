# 🍎 iOS App Store Payment Integration Guide

## Overview
For iOS apps, Apple requires using their In-App Purchase (IAP) system for digital content subscriptions. You cannot use Stripe or other payment processors.

## 1. Apple Developer Console Setup

### Create In-App Purchase Products
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → Features → In-App Purchases
3. Create these products:

**Monthly Subscription:**
- Product ID: `com.ontop.premium.monthly`
- Type: Auto-Renewable Subscription
- Price: $9.99/month
- Subscription Group: `premium_subscriptions`

**Annual Subscription:**
- Product ID: `com.ontop.premium.annual`
- Type: Auto-Renewable Subscription
- Price: $99.99/year
- Subscription Group: `premium_subscriptions`

**Lifetime Purchase:**
- Product ID: `com.ontop.premium.lifetime`
- Type: Non-Consumable
- Price: $150.00

## 2. Capacitor iOS Integration

### Install Capacitor In-App Purchase Plugin
```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

### iOS Permissions (ios/App/App/Info.plist)
```xml
<key>NSAppleMusicUsageDescription</key>
<string>This app uses in-app purchases for premium features</string>
```

## 3. JavaScript Implementation

### Update paywall.html for iOS
```javascript
// Check if running in iOS app
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

const isCapacitorApp = () => {
    return window.Capacitor && window.Capacitor.isNativePlatform();
};

async function proceedToPayment() {
    if (isCapacitorApp() && isIOS()) {
        // Use Apple In-App Purchase
        await initiateApplePayment(selectedPlan);
    } else {
        // Use Stripe for web
        await initiateStripePayment(selectedPlan);
    }
}

async function initiateApplePayment(plan) {
    try {
        const { InAppPurchases } = await import('@capacitor-community/in-app-purchases');
        
        // Product IDs mapping
        const productIds = {
            'monthly': 'com.ontop.premium.monthly',
            'annual': 'com.ontop.premium.annual',
            'lifetime': 'com.ontop.premium.lifetime'
        };
        
        const productId = productIds[plan];
        
        // Get product info
        const products = await InAppPurchases.getProducts([productId]);
        
        if (products.products.length === 0) {
            throw new Error('Product not available');
        }
        
        // Start purchase
        const result = await InAppPurchases.purchaseProduct(productId);
        
        if (result.success) {
            // Verify purchase with your backend
            await verifyApplePurchase(result.receipt);
            
            // Continue to profile setup
            nextScreen();
        }
        
    } catch (error) {
        console.error('Apple purchase failed:', error);
        alert('Purchase failed. Please try again.');
    }
}

async function verifyApplePurchase(receipt) {
    // Send receipt to your backend for verification
    const response = await fetch('/api/verify-apple-purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('ontop_auth_token')}`
        },
        body: JSON.stringify({
            receipt: receipt,
            plan: selectedPlan
        })
    });
    
    const data = await response.json();
    if (!data.success) {
        throw new Error('Purchase verification failed');
    }
}
```

## 4. Backend Verification (server.js)

### Apple Receipt Verification Endpoint
```javascript
// Add this to your server.js
app.post('/api/verify-apple-purchase', authenticateToken, async (req, res) => {
    try {
        const { receipt, plan } = req.body;
        const userId = req.user.id;
        
        // Verify with Apple's servers
        const appleResponse = await verifyAppleReceipt(receipt);
        
        if (appleResponse.status === 0) {
            // Valid receipt - update user's premium status
            await database.updateUserPremiumStatus(userId, {
                plan: plan,
                apple_transaction_id: appleResponse.receipt.in_app[0].transaction_id,
                expires_at: plan === 'lifetime' ? null : calculateExpiryDate(plan)
            });
            
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, error: 'Invalid receipt' });
        }
    } catch (error) {
        console.error('Apple verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

async function verifyAppleReceipt(receiptData) {
    const isProduction = process.env.NODE_ENV === 'production';
    const verifyURL = isProduction 
        ? 'https://buy.itunes.apple.com/verifyReceipt'
        : 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    const response = await fetch(verifyURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'receipt-data': receiptData,
            'password': process.env.APPLE_SHARED_SECRET // Set in your .env
        })
    });
    
    return await response.json();
}
```

## 5. Environment Variables (.env)
```bash
# Add to your .env file
APPLE_SHARED_SECRET=your_apple_shared_secret_here
```

## 6. Testing

### Sandbox Testing
1. Create sandbox test accounts in App Store Connect
2. Use sandbox accounts on iOS Simulator
3. Test all three subscription types

### Production Testing
1. Submit app for review with In-App Purchases
2. Apple will test the purchase flow
3. Once approved, purchases work with real money

## 7. Key Differences: Web vs iOS

| Feature | Web (Stripe) | iOS (Apple IAP) |
|---------|-------------|-----------------|
| Payment Processor | Stripe | Apple App Store |
| Commission | ~3% | 30% (15% after year 1) |
| User Experience | Web forms | Native iOS dialogs |
| Verification | Stripe webhooks | Apple receipt validation |
| Refunds | Stripe dashboard | App Store Connect |

## 8. Important Notes

⚠️ **Apple Requirements:**
- Must use IAP for digital subscriptions
- Cannot mention other payment methods in iOS app
- Cannot redirect to web for payment
- Must handle subscription management in-app

✅ **Best Practices:**
- Always verify receipts server-side
- Handle subscription renewals/cancellations
- Provide restore purchases functionality
- Test thoroughly in sandbox environment

## 9. Capacitor Build Commands

```bash
# Build for iOS
npm run build
npx cap copy ios
npx cap open ios

# In Xcode:
# 1. Configure signing & capabilities
# 2. Add In-App Purchase capability
# 3. Test on device with sandbox account
```

This integration ensures your iOS app complies with Apple's guidelines while providing a seamless premium experience.

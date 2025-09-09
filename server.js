// ON TOP - Production Backend Service with User Management
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const storageAdapter = require('./storage');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
// Select database provider (default: sqlite). Set DATABASE_PROVIDER=pg (or define DB_HOST) to use Postgres/Supabase
const databaseProvider = process.env.DATABASE_PROVIDER || (process.env.DB_HOST ? 'pg' : 'sqlite');
const database = databaseProvider === 'sqlite'
    ? require('./database')
    : require('./database-cloud');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3002;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Initialize OpenAI (optional)
let openai = null;
let financeOpenai = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_FINANCE_API_KEY = process.env.OPENAI_FINANCE_API_KEY;
if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}
if (OPENAI_FINANCE_API_KEY) {
    financeOpenai = new OpenAI({ apiKey: OPENAI_FINANCE_API_KEY });
}
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Security Middleware - Disable CSP to allow inline scripts
app.use(helmet({
    contentSecurityPolicy: false
}));

// Flexible CORS to support browser dev, Capacitor (iOS/Android) and production
const devAllowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost',
    'http://127.0.0.1',
    'capacitor://localhost',
    'ionic://localhost'
];

const prodAllowedOrigins = [
    'https://your-domain.com',
    'https://on-top.vercel.app'
];

const corsWhitelist = process.env.NODE_ENV === 'production' ? prodAllowedOrigins : devAllowedOrigins;

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (e.g., curl, mobile webviews that omit origin)
        if (!origin) return callback(null, true);
        if (corsWhitelist.includes(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true
}));

// Rate limiting (overridable via env for testing)
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000)),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stricter rate limiting for auth endpoints (overridable via env for testing)
const authLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || (15 * 60 * 1000)),
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    message: 'Too many authentication attempts, please try again later.'
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve production web assets if hosting from Node (optional)
app.use(express.static('www'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'ontop_secret_key_2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ================================
// USER AUTHENTICATION ENDPOINTS
// ================================

// User Registration
app.post('/api/auth/register', 
    authLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        body('firstName').trim().isLength({ min: 1, max: 50 }),
        body('lastName').trim().isLength({ min: 1, max: 50 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { email, password, firstName, lastName } = req.body;
            const result = await database.registerUser(email, password, firstName, lastName);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                userId: result.userId
            });
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'SQLITE_CONSTRAINT') {
                res.status(409).json({ error: 'Email already exists' });
            } else {
                res.status(500).json({ error: 'Registration failed' });
            }
        }
    }
);

// User Login
app.post('/api/auth/login',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const { email, password } = req.body;
            const result = await database.loginUser(email, password);
            
            res.json({
                success: true,
                token: result.token,
                user: result.user
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({ error: 'Invalid email or password' });
        }
    }
);

// ================================
// USER DATA ENDPOINTS
// ================================

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await database.getUserProfile(req.user.userId);
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Save User Tasks
app.post('/api/user/tasks', authenticateToken, async (req, res) => {
    try {
        const { tasks } = req.body;
        await database.saveUserTasks(req.user.userId, tasks);
        res.json({ success: true, message: 'Tasks saved successfully' });
    } catch (error) {
        console.error('Tasks save error:', error);
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

// Get User Tasks
app.get('/api/user/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await database.getUserTasks(req.user.userId);
        res.json({ success: true, tasks });
    } catch (error) {
        console.error('Tasks fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Save User Fitness Data
app.post('/api/user/fitness', authenticateToken, async (req, res) => {
    try {
        const fitnessData = req.body;
        await database.saveUserFitness(req.user.userId, fitnessData);
        res.json({ success: true, message: 'Fitness data saved successfully' });
    } catch (error) {
        console.error('Fitness save error:', error);
        res.status(500).json({ error: 'Failed to save fitness data' });
    }
});

// Save User Financial Data
app.post('/api/user/finances', authenticateToken, async (req, res) => {
    try {
        const financialData = req.body;
        await database.saveUserFinances(req.user.userId, financialData);
        res.json({ success: true, message: 'Financial data saved successfully' });
    } catch (error) {
        console.error('Finance save error:', error);
        res.status(500).json({ error: 'Failed to save financial data' });
    }
});

// Update User Settings
app.post('/api/user/settings', authenticateToken, async (req, res) => {
    try {
        const settings = req.body;
        await database.updateUserSettings(req.user.userId, settings);
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Export User Data (GDPR Compliance)
app.get('/api/user/export', authenticateToken, async (req, res) => {
    try {
        const userData = await database.exportUserData(req.user.userId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=ontop-user-data.json');
        res.json(userData);
    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Delete User Account (GDPR Compliance)
app.delete('/api/user/account', authenticateToken, async (req, res) => {
    try {
        await database.deleteUserData(req.user.userId);
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// ================================
// PAYMENT & SUBSCRIPTION ENDPOINTS
// ================================

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { plan } = req.body;
        
        const planConfig = {
            monthly: {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ON TOP Premium - Monthly',
                        description: 'Unlimited access to all premium features',
                    },
                    unit_amount: 999, // $9.99
                    recurring: {
                        interval: 'month',
                    },
                },
                quantity: 1,
            },
            annual: {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ON TOP Premium - Annual',
                        description: 'Unlimited access to all premium features (Save 17%)',
                    },
                    unit_amount: 9999, // $99.99
                    recurring: {
                        interval: 'year',
                    },
                },
                quantity: 1,
            },
            lifetime: {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ON TOP Premium - Lifetime',
                        description: 'Lifetime access to all premium features',
                    },
                    unit_amount: 15000, // $150.00
                },
                quantity: 1,
            }
        };

        if (!planConfig[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [planConfig[plan]],
            mode: plan === 'lifetime' ? 'payment' : 'subscription',
            success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/paywall.html`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user.userId.toString(),
                plan: plan
            },
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe session creation error:', error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

// Stripe Webhook Handler
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;
        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            await handleSubscriptionCancellation(subscription);
            break;
        case 'invoice.payment_failed':
            const invoice = event.data.object;
            await handleFailedPayment(invoice);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

async function handleSuccessfulPayment(session) {
    try {
        const userId = parseInt(session.metadata.userId);
        const plan = session.metadata.plan;
        
        let subscriptionExpires = null;
        if (plan === 'monthly') {
            subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        } else if (plan === 'annual') {
            subscriptionExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
        }
        // Lifetime has no expiration date (null)

        // Update user's premium status
        await database.updateUserPremiumStatus(userId, {
            isPremium: true,
            subscriptionExpires: subscriptionExpires,
            plan: plan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription
        });

        console.log(`✅ User ${userId} upgraded to ${plan} plan`);
    } catch (error) {
        console.error('Error handling successful payment:', error);
    }
}

async function handleSubscriptionCancellation(subscription) {
    try {
        // Find user by Stripe subscription ID
        const user = await database.getUserByStripeSubscription(subscription.id);
        if (user) {
            await database.updateUserPremiumStatus(user.id, {
                isPremium: false,
                subscriptionExpires: null,
                plan: null,
                stripeSubscriptionId: null
            });
            console.log(`❌ User ${user.id} subscription cancelled`);
        }
    } catch (error) {
        console.error('Error handling subscription cancellation:', error);
    }
}

async function handleFailedPayment(invoice) {
    try {
        // Handle failed payment logic here
        console.log('Payment failed for invoice:', invoice.id);
        // You might want to send an email notification or update user status
    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

// Check Premium Status
app.get('/api/user/premium-status', authenticateToken, async (req, res) => {
    try {
        const user = await database.getUserById(req.user.userId);
        
        const now = new Date();
        const isExpired = user.subscription_expires && new Date(user.subscription_expires) < now;
        
        res.json({
            success: true,
            isPremium: user.is_premium && !isExpired,
            plan: user.plan,
            subscriptionExpires: user.subscription_expires,
            daysRemaining: user.subscription_expires ? 
                Math.max(0, Math.ceil((new Date(user.subscription_expires) - now) / (1000 * 60 * 60 * 24))) : 
                null
        });
    } catch (error) {
        console.error('Premium status check error:', error);
        res.status(500).json({ error: 'Failed to check premium status' });
    }
});

// Cancel Subscription
app.post('/api/cancel-subscription', authenticateToken, async (req, res) => {
    try {
        const user = await database.getUserById(req.user.userId);
        
        if (user.stripe_subscription_id) {
            await stripe.subscriptions.del(user.stripe_subscription_id);
            
            await database.updateUserPremiumStatus(req.user.userId, {
                isPremium: false,
                subscriptionExpires: null,
                plan: null,
                stripeSubscriptionId: null
            });
            
            res.json({ success: true, message: 'Subscription cancelled successfully' });
        } else {
            res.status(400).json({ error: 'No active subscription found' });
        }
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// ================================
// iOS APP STORE IAP VERIFICATION
// ================================

// Verify Apple purchase receipts and upgrade user to Premium
app.post('/api/ios/verify-receipt', authenticateToken, async (req, res) => {
    try {
        const { receipt, plan } = req.body || {};
        if (!receipt || !plan) {
            return res.status(400).json({ success: false, error: 'Missing receipt or plan' });
        }

        const verification = await verifyAppleReceipt(receipt);

        // Apple response status: 0 = valid
        if (!verification || typeof verification.status !== 'number') {
            return res.status(502).json({ success: false, error: 'Invalid response from Apple' });
        }

        // If using sandbox in production, Apple returns 21007; retry against sandbox
        if (verification.status === 21007) {
            const retry = await verifyAppleReceipt(receipt, true);
            if (retry && retry.status === 0) {
                await applyPremiumForPlan(req.user.userId, plan, retry);
                return res.json({ success: true });
            }
            return res.status(400).json({ success: false, error: 'Sandbox receipt invalid' });
        }

        if (verification.status === 0) {
            await applyPremiumForPlan(req.user.userId, plan, verification);
            return res.json({ success: true });
        }

        return res.status(400).json({ success: false, error: `Apple verification failed: ${verification.status}` });
    } catch (error) {
        console.error('Apple verification error:', error);
        return res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

async function applyPremiumForPlan(userId, plan, appleVerification) {
    const subscriptionExpires = calculateExpiryDate(plan);
    await database.updateUserPremiumStatus(userId, {
        isPremium: true,
        subscriptionExpires,
        plan,
        stripeCustomerId: null,
        stripeSubscriptionId: null
    });
}

function calculateExpiryDate(plan) {
    if (plan === 'lifetime') return null;
    const now = new Date();
    if (plan === 'monthly') {
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    if (plan === 'annual') {
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    return null;
}

async function verifyAppleReceipt(receiptData, forceSandbox = false) {
    const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET || process.env.IOS_IAP_SHARED_SECRET || '';
    const envPref = (process.env.APPLE_VERIFY_ENV || '').toLowerCase();
    const isProductionEnv = envPref === 'production' || envPref === 'prod' || (!envPref && process.env.NODE_ENV === 'production');
    const useSandbox = forceSandbox || !isProductionEnv;

    const verifyURL = useSandbox
        ? 'https://sandbox.itunes.apple.com/verifyReceipt'
        : 'https://buy.itunes.apple.com/verifyReceipt';

    const body = {
        'receipt-data': receiptData,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
    };

    const response = await fetch(verifyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    return await response.json();
}

// ================================
// EMMA AI THERAPY CHAT ENDPOINT
// ================================

// Emma AI Therapy Chat (Updated with Session Saving)
app.post('/api/emma-chat', async (req, res) => {
    try {
        const { message, conversationContext, recentChat } = req.body;
        
        // System prompt designed for warm, human CBT with clear next steps
        const systemPrompt = `You are Emma — a warm, experienced cognitive-behavioral therapist. Your style is human, conversational, and practical. Avoid generic advice.

PRINCIPLES
- Validate first: name the emotion and why it makes sense.
- Be specific: reference their exact words; no vague platitudes.
- One step at a time: offer 1–2 concrete next steps or a guided micro‑exercise.
- Ask one focused question that naturally follows from their last message.
- Use CBT tools when helpful (thought reframes, behavior experiments, values check, problem‑solving), but keep it natural.
- Maintain continuity: remember past details and thread them in casually.

TONE
- Human, warm, concise. Occasional short sentences are okay. No clinical jargon.

OUTPUT SHAPE
1) Brief validation (1–2 lines)
2) Targeted reflection or insight (1–2 lines)
3) One small step or exercise (bullet)
4) One specific follow‑up question

CONTEXT (JSON): ${JSON.stringify(conversationContext)}
CURRENT MESSAGE: "${message}"`;

        // Build past messages for stronger continuity
        const history = Array.isArray(recentChat)
            ? recentChat.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: String(m.message || '')
            })).slice(-8)
            : [];

        if (!openai) {
            return res.json({ success: false, response: "I'm here and listening. Tell me what's on your mind.", error: 'AI not configured' });
        }
        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            temperature: 0.85,
            max_tokens: 420,
            presence_penalty: 0.4,
            frequency_penalty: 0.4
        });

        const response = completion.choices[0].message.content;
        
        // Save therapy session if user is authenticated
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ontop_secret_key_2024');
                const sessionData = {
                    messages: [
                        { role: 'user', content: message, timestamp: Date.now() },
                        { role: 'emma', content: response, timestamp: Date.now() }
                    ]
                };
                
                await database.saveTherapySession(decoded.userId, sessionData, conversationContext);
                console.log(`Therapy session saved for user ${decoded.userId}`);
            } catch (error) {
                console.log('Session save failed (user may not be logged in):', error.message);
            }
        }
        
        res.json({ 
            success: true, 
            response: response,
            usage: completion.usage 
        });

    } catch (error) {
        console.error('OpenAI API Error:', error);
        
        // Fallback response if API fails
        const fallbackResponses = [
            "I'm having a moment where I need to gather my thoughts. Can you tell me a bit more about what's on your mind right now?",
            "I want to make sure I'm really hearing you. Sometimes the most important things take a moment to process. What feels most significant about what you just shared?",
            "I'm experiencing a brief pause in my connection, but I'm still here with you. What's the most important thing you'd like me to understand about your situation?"
        ];
        
        res.json({ 
            success: false, 
            response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            error: 'API temporarily unavailable' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ================================
// FILE UPLOAD (Authenticated)
// ================================

app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const buffer = req.file.buffer;
        const fileName = req.body.fileName || req.file.originalname;
        const contentType = req.file.mimetype || 'application/octet-stream';

        const result = await storageAdapter.uploadFile(req.user.userId, fileName, buffer, contentType);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// ================================
// AI FINANCIAL ADVISOR ENDPOINT (Personal Finance)
// ================================

// Corporate Finance Advisor (Fortune 500 style)
app.post('/api/finance-advisor', async (req, res) => {
    try {
        const { message, userFinanceContext, recentChat } = req.body || {};

        const systemPrompt = `You are a warm, practical Personal Finance Advisor for everyday people.
Speak like a trusted friend who knows personal finance cold. Be concise and relatable.

MANDATORY STYLE
- Keep the whole reply ultra-brief: 50–90 words max.
- Use short lines and hyphen bullets. No long paragraphs. No emojis.
- Second‑person voice ("you"). Avoid corporate jargon.
- Always end with exactly TWO short, targeted questions to personalize the plan.
- If inputs are missing, ask only for what’s needed most (income, fixed bills, variable spend, savings, debt balances/APRs, goal + timeline).

REPLY SHAPE (strict)
- Opener (1 short line of validation)
- Plan (2 bullets with simple numbers/assumptions)
- Next steps (2 bullets, do‑today actions)
- Questions (exactly 2, on their situation)

CONTEXT (JSON): ${JSON.stringify(userFinanceContext || {})}
CURRENT MESSAGE: "${String(message || '')}"`;

        const history = Array.isArray(recentChat)
            ? recentChat.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: String(m.message || '')
            })).slice(-8)
            : [];

        if (!financeOpenai) {
            return res.json({ success: true, response: '- Validation: You are doing the right thing by getting clarity.\n- Plan: set aside $200/mo for emergency fund; cap variable spend at $400.\n- Next: list fixed bills; track variable spend for 7 days.\n- Questions: income after tax? total debt + APRs?' });
        }
        const completion = await financeOpenai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: String(message || '') }
            ],
            temperature: 0.35,
            max_tokens: 260,
            presence_penalty: 0.2,
            frequency_penalty: 0.2
        });

        const response = completion.choices?.[0]?.message?.content || '';

        return res.json({ success: true, response });
    } catch (error) {
        console.error('Finance advisor error:', error);
        return res.status(500).json({ success: false, error: 'Failed to generate advisory response' });
    }
});

// Only start a listener when running as a standalone server (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`🚀 ON TOP Backend running on http://localhost:${port}`);
        console.log(`📱 Emma AI Life Coach ready for conversations`);
    });
}

// Export the Express app for Vercel Serverless usage
module.exports = app;
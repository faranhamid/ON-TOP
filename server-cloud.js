// ON TOP - Production Backend Service with Google Cloud Integration
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const database = require('./database-cloud'); // Use cloud database
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Security Middleware
app.use(helmet());

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only images for profile pictures
        if (file.fieldname === 'profilePicture') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for profile pictures'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Flexible CORS to support browser dev, Capacitor (iOS/Android) and production
const devAllowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost',
    'http://127.0.0.1',
    'capacitor://localhost',
    'ionic://localhost'
];

const prodAllowedOrigins = ['https://your-domain.com'];

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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // limit each IP to 10 auth requests per 15 minutes
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
            if (error.code === '23505') { // PostgreSQL unique constraint violation
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
// FILE UPLOAD ENDPOINTS
// ================================

// Upload profile picture
app.post('/api/user/upload/profile-picture', 
    authenticateToken,
    upload.single('profilePicture'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileName = `profile-${req.user.userId}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
            
            const uploadResult = await database.uploadFile(
                req.user.userId,
                fileName,
                req.file.buffer,
                req.file.mimetype
            );

            res.json({
                success: true,
                message: 'Profile picture uploaded successfully',
                url: uploadResult.url
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload file' });
        }
    }
);

// Export user data
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

// Create backup
app.post('/api/user/backup', authenticateToken, async (req, res) => {
    try {
        const backup = await database.createBackup(req.user.userId);
        res.json({
            success: true,
            message: 'Backup created successfully',
            backupId: backup.backupId
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// ================================
// USER DATA ENDPOINTS (existing ones updated)
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

// ================================
// HEALTH & MONITORING
// ================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected' // You could add actual DB health check here
    });
});

// Database health check
app.get('/api/health/database', async (req, res) => {
    try {
        // Simple query to test database connection
        await database.pool.query('SELECT 1');
        res.json({ 
            status: 'healthy', 
            database: 'connected',
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString() 
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`🚀 ON TOP Backend running on http://localhost:${port}`);
    console.log(`📱 Emma AI Life Coach ready for conversations`);
    console.log(`☁️ Google Cloud integration enabled`);
    console.log(`🗄️ Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL (Cloud SQL)' : 'Local Development'}`);
});

// ON TOP - Production Database System
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

class ONTOPDatabase {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'ontop_users.db'));
        this.initializeTables();
    }

    initializeTables() {
        // Users table with comprehensive profile data
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                profile_picture_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_premium INTEGER DEFAULT 0,
                subscription_expires DATETIME,
                plan TEXT,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                total_sessions INTEGER DEFAULT 0,
                preferences TEXT DEFAULT '{}',
                privacy_settings TEXT DEFAULT '{}'
            )
        `);

        // User Tasks (Planner Data)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                due_date DATE,
                priority TEXT DEFAULT 'medium',
                category TEXT DEFAULT 'personal',
                completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Fitness Data
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_fitness (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                current_weight REAL,
                target_weight REAL,
                height REAL,
                age INTEGER,
                gender TEXT,
                activity_level TEXT,
                fitness_goals TEXT,
                daily_calories INTEGER,
                daily_protein INTEGER,
                workout_history TEXT DEFAULT '[]',
                meal_history TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Financial Data
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_finances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                monthly_income REAL DEFAULT 0,
                bills TEXT DEFAULT '[]',
                financial_goals TEXT DEFAULT '[]',
                expenses TEXT DEFAULT '[]',
                budgets TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Emma Therapy Sessions
        this.db.run(`
            CREATE TABLE IF NOT EXISTS therapy_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_data TEXT NOT NULL,
                conversation_context TEXT DEFAULT '{}',
                session_duration INTEGER DEFAULT 0,
                message_count INTEGER DEFAULT 0,
                mood_rating INTEGER,
                session_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // User Settings
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                theme TEXT DEFAULT 'dark',
                notifications_enabled INTEGER DEFAULT 1,
                therapy_reminders INTEGER DEFAULT 1,
                data_sharing INTEGER DEFAULT 0,
                analytics_enabled INTEGER DEFAULT 1,
                backup_enabled INTEGER DEFAULT 1,
                language TEXT DEFAULT 'en',
                timezone TEXT DEFAULT 'UTC',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
    }

    // ================================
    // USER AUTHENTICATION
    // ================================

    async registerUser(email, password, firstName, lastName) {
        return new Promise((resolve, reject) => {
            const passwordHash = bcrypt.hashSync(password, 10);
            
            this.db.run(`
                INSERT INTO users (email, password_hash, first_name, last_name, total_sessions)
                VALUES (?, ?, ?, ?, 0)
            `, [email, passwordHash, firstName, lastName], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Initialize user data tables
                    const userId = this.lastID;
                    resolve({ 
                        userId, 
                        email, 
                        firstName, 
                        lastName,
                        message: 'User registered successfully' 
                    });
                }
            });
        });
    }

    async loginUser(email, password) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT id, email, password_hash, first_name, last_name, is_premium, total_sessions
                FROM users WHERE email = ?
            `, [email], (err, user) => {
                if (err) {
                    reject(err);
                } else if (!user) {
                    reject(new Error('User not found'));
                } else if (!bcrypt.compareSync(password, user.password_hash)) {
                    reject(new Error('Invalid password'));
                } else {
                    // Update last login
                    this.db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
                    
                    // Generate JWT token
                    const token = jwt.sign(
                        { 
                            userId: user.id, 
                            email: user.email,
                            isPremium: user.is_premium 
                        },
                        process.env.JWT_SECRET || 'ontop_secret_key_2024',
                        { expiresIn: '30d' }
                    );

                    resolve({
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            isPremium: user.is_premium,
                            totalSessions: user.total_sessions
                        }
                    });
                }
            });
        });
    }

    // ================================
    // USER DATA MANAGEMENT
    // ================================

    async saveUserTasks(userId, tasks) {
        return new Promise((resolve, reject) => {
            // Clear existing tasks
            this.db.run(`DELETE FROM user_tasks WHERE user_id = ?`, [userId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Insert new tasks
                const stmt = this.db.prepare(`
                    INSERT INTO user_tasks (user_id, title, description, due_date, priority, category, completed, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                tasks.forEach(task => {
                    stmt.run([
                        userId,
                        task.title,
                        task.description || '',
                        task.dueDate || null,
                        task.priority || 'medium',
                        task.category || 'personal',
                        task.completed ? 1 : 0,
                        task.createdAt || new Date().toISOString()
                    ]);
                });

                stmt.finalize((err) => {
                    if (err) reject(err);
                    else resolve({ message: 'Tasks saved successfully' });
                });
            });
        });
    }

    async getUserTasks(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM user_tasks 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [userId], (err, tasks) => {
                if (err) reject(err);
                else resolve(tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    dueDate: task.due_date,
                    priority: task.priority,
                    category: task.category,
                    completed: task.completed === 1,
                    createdAt: task.created_at,
                    updatedAt: task.updated_at
                })));
            });
        });
    }

    async saveUserFitness(userId, fitnessData) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO user_fitness 
                (user_id, current_weight, target_weight, height, age, gender, activity_level, 
                 fitness_goals, daily_calories, daily_protein, workout_history, meal_history, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId,
                fitnessData.currentWeight,
                fitnessData.targetWeight,
                fitnessData.height,
                fitnessData.age,
                fitnessData.gender,
                fitnessData.activityLevel,
                JSON.stringify(fitnessData.goals || []),
                fitnessData.dailyCalories,
                fitnessData.dailyProtein,
                JSON.stringify(fitnessData.workoutHistory || []),
                JSON.stringify(fitnessData.mealHistory || [])
            ], function(err) {
                if (err) reject(err);
                else resolve({ message: 'Fitness data saved successfully' });
            });
        });
    }

    async saveUserFinances(userId, financialData) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO user_finances 
                (user_id, monthly_income, bills, financial_goals, expenses, budgets, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId,
                financialData.monthlyIncome,
                JSON.stringify(financialData.bills || []),
                JSON.stringify(financialData.goals || []),
                JSON.stringify(financialData.expenses || []),
                JSON.stringify(financialData.budgets || {})
            ], function(err) {
                if (err) reject(err);
                else resolve({ message: 'Financial data saved successfully' });
            });
        });
    }

    async saveTherapySession(userId, sessionData, conversationContext) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO therapy_sessions 
                (user_id, session_data, conversation_context, message_count, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId,
                JSON.stringify(sessionData),
                JSON.stringify(conversationContext),
                sessionData.messages ? sessionData.messages.length : 0
            ], function(err) {
                if (err) reject(err);
                else resolve({ sessionId: this.lastID, message: 'Session saved successfully' });
            });
        });
    }

    // ================================
    // USER PROFILE & SETTINGS
    // ================================

    async getUserProfile(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT u.*, us.*, uf.current_weight, uf.target_weight, ufi.monthly_income
                FROM users u
                LEFT JOIN user_settings us ON u.id = us.user_id
                LEFT JOIN user_fitness uf ON u.id = uf.user_id
                LEFT JOIN user_finances ufi ON u.id = ufi.user_id
                WHERE u.id = ?
            `, [userId], (err, profile) => {
                if (err) reject(err);
                else resolve(profile);
            });
        });
    }

    async updateUserSettings(userId, settings) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO user_settings 
                (user_id, theme, notifications_enabled, therapy_reminders, data_sharing, 
                 analytics_enabled, backup_enabled, language, timezone, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId,
                settings.theme || 'dark',
                settings.notificationsEnabled ? 1 : 0,
                settings.therapyReminders ? 1 : 0,
                settings.dataSharing ? 1 : 0,
                settings.analyticsEnabled ? 1 : 0,
                settings.backupEnabled ? 1 : 0,
                settings.language || 'en',
                settings.timezone || 'UTC'
            ], function(err) {
                if (err) reject(err);
                else resolve({ message: 'Settings updated successfully' });
            });
        });
    }

    // ================================
    // DATA EXPORT & PRIVACY
    // ================================

    async exportUserData(userId) {
        return new Promise((resolve, reject) => {
            const userData = {};
            
            // Get all user data
            this.db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
                if (err) reject(err);
                
                userData.profile = {
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    createdAt: user.created_at,
                    totalSessions: user.total_sessions
                };

                // Get tasks, fitness, finances, therapy sessions
                Promise.all([
                    this.getUserTasks(userId),
                    this.getUserFitness(userId),
                    this.getUserFinances(userId),
                    this.getTherapySessions(userId)
                ]).then(([tasks, fitness, finances, sessions]) => {
                    userData.tasks = tasks;
                    userData.fitness = fitness;
                    userData.finances = finances;
                    userData.therapySessions = sessions;
                    userData.exportedAt = new Date().toISOString();
                    
                    resolve(userData);
                }).catch(reject);
            });
        });
    }

    async deleteUserData(userId) {
        return new Promise((resolve, reject) => {
            const tables = [
                'therapy_sessions',
                'user_settings', 
                'user_finances',
                'user_fitness',
                'user_tasks',
                'users'
            ];

            let completed = 0;
            tables.forEach(table => {
                this.db.run(`DELETE FROM ${table} WHERE user_id = ?`, [userId], (err) => {
                    if (err) reject(err);
                    completed++;
                    if (completed === tables.length) {
                        resolve({ message: 'All user data deleted successfully' });
                    }
                });
            });
        });
    }

    // ================================
    // PREMIUM & SUBSCRIPTION METHODS
    // ================================

    async updateUserPremiumStatus(userId, premiumData) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE users 
                SET is_premium = ?, subscription_expires = ?, plan = ?, 
                    stripe_customer_id = ?, stripe_subscription_id = ?
                WHERE id = ?
            `, [
                premiumData.isPremium ? 1 : 0,
                premiumData.subscriptionExpires,
                premiumData.plan,
                premiumData.stripeCustomerId,
                premiumData.stripeSubscriptionId,
                userId
            ], function(err) {
                if (err) reject(err);
                else resolve({ message: 'Premium status updated successfully' });
            });
        });
    }

    async getUserById(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM users WHERE id = ?
            `, [userId], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    }

    async getUserByStripeSubscription(subscriptionId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM users WHERE stripe_subscription_id = ?
            `, [subscriptionId], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    }

    async checkUserPremiumStatus(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT is_premium, subscription_expires, plan FROM users WHERE id = ?
            `, [userId], (err, user) => {
                if (err) reject(err);
                else if (!user) reject(new Error('User not found'));
                else {
                    const now = new Date();
                    const isExpired = user.subscription_expires && new Date(user.subscription_expires) < now;
                    resolve({
                        isPremium: user.is_premium === 1 && !isExpired,
                        plan: user.plan,
                        subscriptionExpires: user.subscription_expires,
                        isExpired: isExpired
                    });
                }
            });
        });
    }
}

module.exports = new ONTOPDatabase();
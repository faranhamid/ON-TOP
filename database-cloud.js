// ON TOP - Google Cloud Database System
const { Pool } = require('pg');
const { Storage } = require('@google-cloud/storage');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class ONTOPCloudDatabase {
    constructor() {
        // PostgreSQL connection pool
        this.pool = new Pool({
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Google Cloud Storage
        this.storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
        });
        
        this.uploadsBucket = this.storage.bucket(process.env.STORAGE_BUCKET_UPLOADS);
        this.backupsBucket = this.storage.bucket(process.env.STORAGE_BUCKET_BACKUPS);

        this.initializeTables();
    }

    async initializeTables() {
        const client = await this.pool.connect();
        
        try {
            // Users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    profile_picture_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_premium BOOLEAN DEFAULT FALSE,
                    subscription_expires TIMESTAMP,
                    total_sessions INTEGER DEFAULT 0,
                    preferences JSONB DEFAULT '{}',
                    privacy_settings JSONB DEFAULT '{}'
                )
            `);

            // User Tasks
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_tasks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    description TEXT,
                    due_date DATE,
                    priority VARCHAR(20) DEFAULT 'medium',
                    category VARCHAR(50) DEFAULT 'personal',
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Fitness Data
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_fitness (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    current_weight DECIMAL(5,2),
                    target_weight DECIMAL(5,2),
                    height DECIMAL(5,2),
                    age INTEGER,
                    gender VARCHAR(20),
                    activity_level VARCHAR(20),
                    fitness_goals JSONB DEFAULT '[]',
                    daily_calories INTEGER,
                    daily_protein INTEGER,
                    workout_history JSONB DEFAULT '[]',
                    meal_history JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Financial Data
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_finances (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    monthly_income DECIMAL(12,2) DEFAULT 0,
                    bills JSONB DEFAULT '[]',
                    financial_goals JSONB DEFAULT '[]',
                    expenses JSONB DEFAULT '[]',
                    budgets JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Emma Therapy Sessions
            await client.query(`
                CREATE TABLE IF NOT EXISTS therapy_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    session_data JSONB NOT NULL,
                    conversation_context JSONB DEFAULT '{}',
                    session_duration INTEGER DEFAULT 0,
                    message_count INTEGER DEFAULT 0,
                    mood_rating INTEGER,
                    session_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // User Settings
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    theme VARCHAR(20) DEFAULT 'dark',
                    notifications_enabled BOOLEAN DEFAULT TRUE,
                    therapy_reminders BOOLEAN DEFAULT TRUE,
                    data_sharing BOOLEAN DEFAULT FALSE,
                    analytics_enabled BOOLEAN DEFAULT TRUE,
                    backup_enabled BOOLEAN DEFAULT TRUE,
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for better performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
                CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user_id ON therapy_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            `);

            console.log('✅ Database tables initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
        } finally {
            client.release();
        }
    }

    // ================================
    // USER AUTHENTICATION
    // ================================

    async registerUser(email, password, firstName, lastName) {
        const client = await this.pool.connect();
        
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            
            const result = await client.query(`
                INSERT INTO users (email, password_hash, first_name, last_name, total_sessions)
                VALUES ($1, $2, $3, $4, 0)
                RETURNING id, email, first_name, last_name
            `, [email, passwordHash, firstName, lastName]);

            const user = result.rows[0];
            
            return {
                userId: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                message: 'User registered successfully'
            };
        } finally {
            client.release();
        }
    }

    async loginUser(email, password) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT id, email, password_hash, first_name, last_name, is_premium, total_sessions
                FROM users WHERE email = $1
            `, [email]);

            const user = result.rows[0];
            if (!user) {
                throw new Error('User not found');
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }

            // Update last login
            await client.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

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

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isPremium: user.is_premium,
                    totalSessions: user.total_sessions
                }
            };
        } finally {
            client.release();
        }
    }

    // ================================
    // USER DATA MANAGEMENT
    // ================================

    async saveUserTasks(userId, tasks) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Clear existing tasks
            await client.query('DELETE FROM user_tasks WHERE user_id = $1', [userId]);

            // Insert new tasks
            for (const task of tasks) {
                await client.query(`
                    INSERT INTO user_tasks (user_id, title, description, due_date, priority, category, completed, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    userId,
                    task.title,
                    task.description || '',
                    task.dueDate || null,
                    task.priority || 'medium',
                    task.category || 'personal',
                    task.completed || false,
                    task.createdAt || new Date()
                ]);
            }

            await client.query('COMMIT');
            return { message: 'Tasks saved successfully' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getUserTasks(userId) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT * FROM user_tasks 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `, [userId]);

            return result.rows.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.due_date,
                priority: task.priority,
                category: task.category,
                completed: task.completed,
                createdAt: task.created_at,
                updatedAt: task.updated_at
            }));
        } finally {
            client.release();
        }
    }

    async saveUserFitness(userId, fitnessData) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO user_fitness 
                (user_id, current_weight, target_weight, height, age, gender, activity_level, 
                 fitness_goals, daily_calories, daily_protein, workout_history, meal_history, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) 
                DO UPDATE SET
                    current_weight = EXCLUDED.current_weight,
                    target_weight = EXCLUDED.target_weight,
                    height = EXCLUDED.height,
                    age = EXCLUDED.age,
                    gender = EXCLUDED.gender,
                    activity_level = EXCLUDED.activity_level,
                    fitness_goals = EXCLUDED.fitness_goals,
                    daily_calories = EXCLUDED.daily_calories,
                    daily_protein = EXCLUDED.daily_protein,
                    workout_history = EXCLUDED.workout_history,
                    meal_history = EXCLUDED.meal_history,
                    updated_at = CURRENT_TIMESTAMP
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
            ]);

            return { message: 'Fitness data saved successfully' };
        } finally {
            client.release();
        }
    }

    async saveTherapySession(userId, sessionData, conversationContext) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                INSERT INTO therapy_sessions 
                (user_id, session_data, conversation_context, message_count, created_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                RETURNING id
            `, [
                userId,
                JSON.stringify(sessionData),
                JSON.stringify(conversationContext),
                sessionData.messages ? sessionData.messages.length : 0
            ]);

            return {
                sessionId: result.rows[0].id,
                message: 'Session saved successfully'
            };
        } finally {
            client.release();
        }
    }

    // ================================
    // FILE STORAGE METHODS
    // ================================

    async uploadFile(userId, fileName, fileBuffer, contentType) {
        const file = this.uploadsBucket.file(`users/${userId}/${fileName}`);
        
        await file.save(fileBuffer, {
            metadata: {
                contentType: contentType,
                metadata: {
                    uploadedBy: userId.toString(),
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        // Make file publicly readable (optional)
        await file.makePublic();

        return {
            fileName: fileName,
            url: `https://storage.googleapis.com/${this.uploadsBucket.name}/users/${userId}/${fileName}`,
            message: 'File uploaded successfully'
        };
    }

    async deleteFile(userId, fileName) {
        const file = this.uploadsBucket.file(`users/${userId}/${fileName}`);
        await file.delete();
        return { message: 'File deleted successfully' };
    }

    // ================================
    // BACKUP METHODS
    // ================================

    async createBackup(userId) {
        const userData = await this.exportUserData(userId);
        const backupData = {
            ...userData,
            backupCreatedAt: new Date().toISOString(),
            version: '1.0'
        };

        const fileName = `backup-${userId}-${Date.now()}.json`;
        const file = this.backupsBucket.file(`user-backups/${fileName}`);
        
        await file.save(JSON.stringify(backupData, null, 2), {
            metadata: {
                contentType: 'application/json'
            }
        });

        return {
            backupId: fileName,
            message: 'Backup created successfully'
        };
    }

    // ================================
    // EXISTING METHODS (updated for PostgreSQL)
    // ================================

    async exportUserData(userId) {
        const client = await this.pool.connect();
        
        try {
            // Get all user data
            const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];

            if (!user) {
                throw new Error('User not found');
            }

            const [tasks, fitness, finances, sessions] = await Promise.all([
                this.getUserTasks(userId),
                this.getUserFitness(userId),
                this.getUserFinances(userId),
                this.getTherapySessions(userId)
            ]);

            return {
                profile: {
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    createdAt: user.created_at,
                    totalSessions: user.total_sessions
                },
                tasks,
                fitness,
                finances,
                therapySessions: sessions,
                exportedAt: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    async getUserFitness(userId) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT * FROM user_fitness WHERE user_id = $1', [userId]);
            return result.rows[0] || {};
        } finally {
            client.release();
        }
    }

    async getUserFinances(userId) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT * FROM user_finances WHERE user_id = $1', [userId]);
            return result.rows[0] || {};
        } finally {
            client.release();
        }
    }

    async getTherapySessions(userId) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT * FROM therapy_sessions 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 50
            `, [userId]);
            
            return result.rows;
        } finally {
            client.release();
        }
    }

    async deleteUserData(userId) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete in reverse order of dependencies
            await client.query('DELETE FROM therapy_sessions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_finances WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_fitness WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_tasks WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            await client.query('COMMIT');
            return { message: 'All user data deleted successfully' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Close database connection
    async close() {
        await this.pool.end();
    }
}

module.exports = new ONTOPCloudDatabase();

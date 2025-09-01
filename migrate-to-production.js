#!/usr/bin/env node

/**
 * ON TOP - Production Database Migration Script
 * 
 * This script helps migrate from SQLite (development) to PostgreSQL/Supabase (production)
 * Run this script when deploying to production to set up your database schema
 */

require('dotenv').config();
const { Client } = require('pg');

async function migrateToProduction() {
    console.log('🚀 Starting ON TOP Production Database Migration...\n');

    // Check if we have the required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars.join(', '));
        console.error('Please set up your production database credentials in .env file');
        process.exit(1);
    }

    const client = new Client({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Create tables
        await createTables(client);
        
        // Create indexes for performance
        await createIndexes(client);
        
        // Create initial admin user (optional)
        await createInitialAdmin(client);
        
        console.log('\n🎉 Production database migration completed successfully!');
        console.log('Your ON TOP app is ready for production deployment.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function createTables(client) {
    console.log('📋 Creating database tables...');

    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            profile_picture_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_premium BOOLEAN DEFAULT FALSE,
            subscription_expires TIMESTAMP,
            plan VARCHAR(50),
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            total_sessions INTEGER DEFAULT 0,
            preferences JSONB DEFAULT '{}',
            privacy_settings JSONB DEFAULT '{}'
        )`,

        // User Tasks
        `CREATE TABLE IF NOT EXISTS user_tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE,
            priority VARCHAR(20) DEFAULT 'medium',
            category VARCHAR(50) DEFAULT 'personal',
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Fitness Data
        `CREATE TABLE IF NOT EXISTS user_fitness (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            current_weight DECIMAL(5,2),
            target_weight DECIMAL(5,2),
            height DECIMAL(5,2),
            age INTEGER,
            gender VARCHAR(20),
            activity_level VARCHAR(50),
            fitness_goals TEXT,
            daily_calories INTEGER,
            daily_protein INTEGER,
            workout_history JSONB DEFAULT '[]',
            meal_history JSONB DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Financial Data
        `CREATE TABLE IF NOT EXISTS user_finances (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            monthly_income DECIMAL(12,2) DEFAULT 0,
            bills JSONB DEFAULT '[]',
            financial_goals JSONB DEFAULT '[]',
            expenses JSONB DEFAULT '[]',
            budgets JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Therapy Sessions
        `CREATE TABLE IF NOT EXISTS therapy_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_data JSONB NOT NULL,
            conversation_context JSONB DEFAULT '{}',
            session_duration INTEGER DEFAULT 0,
            message_count INTEGER DEFAULT 0,
            mood_rating INTEGER,
            session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // File Uploads
        `CREATE TABLE IF NOT EXISTS user_files (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            file_size INTEGER,
            file_type VARCHAR(100),
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const tableSQL of tables) {
        await client.query(tableSQL);
    }

    console.log('✅ All tables created successfully');
}

async function createIndexes(client) {
    console.log('🔍 Creating database indexes for performance...');

    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON user_tasks(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON user_tasks(due_date)',
        'CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON user_fitness(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_finances_user_id ON user_finances(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_therapy_user_id ON therapy_sessions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_therapy_date ON therapy_sessions(session_date)',
        'CREATE INDEX IF NOT EXISTS idx_files_user_id ON user_files(user_id)'
    ];

    for (const indexSQL of indexes) {
        await client.query(indexSQL);
    }

    console.log('✅ All indexes created successfully');
}

async function createInitialAdmin(client) {
    console.log('👤 Creating initial admin user...');
    
    // Check if admin user already exists
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@ontop-app.com']);
    
    if (adminCheck.rows.length === 0) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123!', 10);
        
        await client.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, is_premium, plan)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin@ontop-app.com', hashedPassword, 'Admin', 'User', true, 'lifetime']);
        
        console.log('✅ Initial admin user created (email: admin@ontop-app.com, password: admin123!)');
        console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    } else {
        console.log('ℹ️  Admin user already exists, skipping creation');
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateToProduction().catch(console.error);
}

module.exports = { migrateToProduction };

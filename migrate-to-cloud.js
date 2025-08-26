// ON TOP - Data Migration Script (SQLite to PostgreSQL)
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

class DataMigration {
    constructor() {
        // SQLite connection (source)
        this.sqliteDb = new sqlite3.Database('./ontop_users.db');
        
        // PostgreSQL connection (destination)
        this.pgPool = new Pool({
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
    }

    async migrateUsers() {
        console.log('📊 Migrating users...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM users', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const user of rows) {
                        await client.query(`
                            INSERT INTO users (
                                id, email, password_hash, first_name, last_name, 
                                profile_picture_url, created_at, last_login, is_premium, 
                                subscription_expires, total_sessions, preferences, privacy_settings
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                            ON CONFLICT (email) DO NOTHING
                        `, [
                            user.id, user.email, user.password_hash, user.first_name, user.last_name,
                            user.profile_picture_url, user.created_at, user.last_login, user.is_premium,
                            user.subscription_expires, user.total_sessions, 
                            user.preferences || '{}', user.privacy_settings || '{}'
                        ]);
                    }
                    
                    // Reset sequence to avoid conflicts
                    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
                    
                    console.log(`✅ Migrated ${rows.length} users`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async migrateTasks() {
        console.log('📋 Migrating tasks...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM user_tasks', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const task of rows) {
                        await client.query(`
                            INSERT INTO user_tasks (
                                id, user_id, title, description, due_date, priority, 
                                category, completed, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            task.id, task.user_id, task.title, task.description, task.due_date,
                            task.priority, task.category, task.completed === 1, 
                            task.created_at, task.updated_at
                        ]);
                    }
                    
                    await client.query(`SELECT setval('user_tasks_id_seq', (SELECT MAX(id) FROM user_tasks))`);
                    
                    console.log(`✅ Migrated ${rows.length} tasks`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async migrateFitness() {
        console.log('💪 Migrating fitness data...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM user_fitness', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const fitness of rows) {
                        await client.query(`
                            INSERT INTO user_fitness (
                                id, user_id, current_weight, target_weight, height, age, gender,
                                activity_level, fitness_goals, daily_calories, daily_protein,
                                workout_history, meal_history, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            fitness.id, fitness.user_id, fitness.current_weight, fitness.target_weight,
                            fitness.height, fitness.age, fitness.gender, fitness.activity_level,
                            fitness.fitness_goals || '[]', fitness.daily_calories, fitness.daily_protein,
                            fitness.workout_history || '[]', fitness.meal_history || '[]',
                            fitness.created_at, fitness.updated_at
                        ]);
                    }
                    
                    await client.query(`SELECT setval('user_fitness_id_seq', (SELECT MAX(id) FROM user_fitness))`);
                    
                    console.log(`✅ Migrated ${rows.length} fitness records`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async migrateFinances() {
        console.log('💰 Migrating financial data...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM user_finances', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const finance of rows) {
                        await client.query(`
                            INSERT INTO user_finances (
                                id, user_id, monthly_income, bills, financial_goals,
                                expenses, budgets, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            finance.id, finance.user_id, finance.monthly_income,
                            finance.bills || '[]', finance.financial_goals || '[]',
                            finance.expenses || '[]', finance.budgets || '{}',
                            finance.created_at, finance.updated_at
                        ]);
                    }
                    
                    await client.query(`SELECT setval('user_finances_id_seq', (SELECT MAX(id) FROM user_finances))`);
                    
                    console.log(`✅ Migrated ${rows.length} financial records`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async migrateTherapySessions() {
        console.log('🧠 Migrating therapy sessions...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM therapy_sessions', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const session of rows) {
                        await client.query(`
                            INSERT INTO therapy_sessions (
                                id, user_id, session_data, conversation_context,
                                session_duration, message_count, mood_rating,
                                session_notes, created_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            session.id, session.user_id, session.session_data,
                            session.conversation_context || '{}', session.session_duration,
                            session.message_count, session.mood_rating,
                            session.session_notes, session.created_at
                        ]);
                    }
                    
                    await client.query(`SELECT setval('therapy_sessions_id_seq', (SELECT MAX(id) FROM therapy_sessions))`);
                    
                    console.log(`✅ Migrated ${rows.length} therapy sessions`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async migrateSettings() {
        console.log('⚙️ Migrating user settings...');
        
        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM user_settings', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const client = await this.pgPool.connect();
                
                try {
                    for (const setting of rows) {
                        await client.query(`
                            INSERT INTO user_settings (
                                id, user_id, theme, notifications_enabled, therapy_reminders,
                                data_sharing, analytics_enabled, backup_enabled,
                                language, timezone, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            setting.id, setting.user_id, setting.theme,
                            setting.notifications_enabled === 1, setting.therapy_reminders === 1,
                            setting.data_sharing === 1, setting.analytics_enabled === 1,
                            setting.backup_enabled === 1, setting.language, setting.timezone,
                            setting.created_at, setting.updated_at
                        ]);
                    }
                    
                    await client.query(`SELECT setval('user_settings_id_seq', (SELECT MAX(id) FROM user_settings))`);
                    
                    console.log(`✅ Migrated ${rows.length} user settings`);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    client.release();
                }
            });
        });
    }

    async runMigration() {
        console.log('🚀 Starting data migration from SQLite to PostgreSQL...');
        console.log('================================================');
        
        try {
            await this.migrateUsers();
            await this.migrateTasks();
            await this.migrateFitness();
            await this.migrateFinances();
            await this.migrateTherapySessions();
            await this.migrateSettings();
            
            console.log('================================================');
            console.log('✅ Migration completed successfully!');
            console.log('Your data is now available in Google Cloud SQL');
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            this.sqliteDb.close();
            await this.pgPool.end();
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    const migration = new DataMigration();
    migration.runMigration()
        .then(() => {
            console.log('🎉 All done! You can now use your cloud database.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = DataMigration;

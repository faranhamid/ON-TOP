// ON TOP - Authentication & Data Sync Manager for Mobile Deployment
class ONTOPAuthManager {
    constructor() {
        this.token = localStorage.getItem('ontop_auth_token');
        this.user = JSON.parse(localStorage.getItem('ontop_user') || 'null');
        this.baseURL = 'http://localhost:3001';
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Network status monitoring for offline sync
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // ================================
    // AUTHENTICATION METHODS
    // ================================

    async register(email, password, firstName, lastName) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Automatically log in after successful registration
                return await this.login(email, password);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('ontop_auth_token', this.token);
                localStorage.setItem('ontop_user', JSON.stringify(this.user));
                
                // Sync any local data to server after login
                await this.syncLocalDataToServer();
                
                return data.user;
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('ontop_auth_token');
        localStorage.removeItem('ontop_user');
        
        // Clear local app data
        localStorage.removeItem('ontop_chat_context');
        localStorage.removeItem('ontop_tasks');
        localStorage.removeItem('ontop_fitness');
        localStorage.removeItem('ontop_finances');
        
        // Reset app state
        if (window.AppState) {
            window.AppState.chat.conversationContext = {};
            window.AppState.tasks = [];
            window.AppState.fitness = {};
            window.AppState.finances = {};
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    async checkAuthStatus() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.baseURL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    // ================================
    // DATA SYNCHRONIZATION METHODS
    // ================================

    async syncLocalDataToServer() {
        if (!this.isAuthenticated()) return;

        try {
            // Sync tasks
            const localTasks = JSON.parse(localStorage.getItem('ontop_tasks') || '[]');
            if (localTasks.length > 0) {
                await this.saveUserTasks(localTasks);
            }

            // Sync fitness data
            const localFitness = JSON.parse(localStorage.getItem('ontop_fitness') || '{}');
            if (Object.keys(localFitness).length > 0) {
                await this.saveUserFitness(localFitness);
            }

            // Sync financial data
            const localFinances = JSON.parse(localStorage.getItem('ontop_finances') || '{}');
            if (Object.keys(localFinances).length > 0) {
                await this.saveUserFinances(localFinances);
            }

            console.log('Local data synced to server successfully');
        } catch (error) {
            console.error('Data sync failed:', error);
        }
    }

    async loadUserDataFromServer() {
        if (!this.isAuthenticated()) return;

        try {
            // Load tasks
            const tasksResponse = await fetch(`${this.baseURL}/api/user/tasks`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                if (tasksData.success) {
                    localStorage.setItem('ontop_tasks', JSON.stringify(tasksData.tasks));
                    if (window.AppState) {
                        window.AppState.tasks = tasksData.tasks;
                    }
                }
            }

            // Load profile data
            const profileResponse = await fetch(`${this.baseURL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.success && profileData.profile) {
                    // Update local storage with server data
                    const profile = profileData.profile;
                    
                    if (profile.current_weight || profile.target_weight) {
                        const fitnessData = {
                            currentWeight: profile.current_weight,
                            targetWeight: profile.target_weight,
                            height: profile.height,
                            age: profile.age
                        };
                        localStorage.setItem('ontop_fitness', JSON.stringify(fitnessData));
                        if (window.AppState) {
                            window.AppState.fitness = fitnessData;
                        }
                    }

                    if (profile.monthly_income) {
                        const financialData = {
                            monthlyIncome: profile.monthly_income
                        };
                        localStorage.setItem('ontop_finances', JSON.stringify(financialData));
                        if (window.AppState) {
                            window.AppState.finances = financialData;
                        }
                    }
                }
            }

            console.log('User data loaded from server successfully');
        } catch (error) {
            console.error('Failed to load user data from server:', error);
        }
    }

    // ================================
    // API METHODS WITH OFFLINE QUEUE
    // ================================

    async saveUserTasks(tasks) {
        const requestData = { 
            endpoint: '/api/user/tasks', 
            method: 'POST', 
            data: { tasks } 
        };

        if (!this.isOnline || !this.isAuthenticated()) {
            this.addToSyncQueue(requestData);
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}${requestData.endpoint}`, {
                method: requestData.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestData.data)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Save tasks failed:', error);
            this.addToSyncQueue(requestData);
            throw error;
        }
    }

    async saveUserFitness(fitnessData) {
        const requestData = { 
            endpoint: '/api/user/fitness', 
            method: 'POST', 
            data: fitnessData 
        };

        if (!this.isOnline || !this.isAuthenticated()) {
            this.addToSyncQueue(requestData);
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}${requestData.endpoint}`, {
                method: requestData.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestData.data)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Save fitness data failed:', error);
            this.addToSyncQueue(requestData);
            throw error;
        }
    }

    async saveUserFinances(financialData) {
        const requestData = { 
            endpoint: '/api/user/finances', 
            method: 'POST', 
            data: financialData 
        };

        if (!this.isOnline || !this.isAuthenticated()) {
            this.addToSyncQueue(requestData);
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}${requestData.endpoint}`, {
                method: requestData.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestData.data)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Save financial data failed:', error);
            this.addToSyncQueue(requestData);
            throw error;
        }
    }

    // ================================
    // OFFLINE SYNC QUEUE MANAGEMENT
    // ================================

    addToSyncQueue(requestData) {
        this.syncQueue.push({
            ...requestData,
            timestamp: Date.now()
        });
        
        // Save queue to localStorage for persistence
        localStorage.setItem('ontop_sync_queue', JSON.stringify(this.syncQueue));
    }

    async processSyncQueue() {
        if (!this.isOnline || !this.isAuthenticated() || this.syncQueue.length === 0) {
            return;
        }

        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const request of queue) {
            try {
                const response = await fetch(`${this.baseURL}${request.endpoint}`, {
                    method: request.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(request.data)
                });

                const result = await response.json();
                if (!result.success) {
                    console.error('Sync queue item failed:', result.error);
                    this.syncQueue.push(request); // Re-queue failed items
                }
            } catch (error) {
                console.error('Sync queue processing error:', error);
                this.syncQueue.push(request); // Re-queue failed items
            }
        }

        // Update localStorage with remaining queue items
        localStorage.setItem('ontop_sync_queue', JSON.stringify(this.syncQueue));
    }

    // ================================
    // PRIVACY & DATA MANAGEMENT
    // ================================

    async exportUserData() {
        if (!this.isAuthenticated()) {
            throw new Error('Must be logged in to export data');
        }

        try {
            const response = await fetch(`${this.baseURL}/api/user/export`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ontop-user-data.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Failed to export data');
            }
        } catch (error) {
            console.error('Data export failed:', error);
            throw error;
        }
    }

    async deleteAccount() {
        if (!this.isAuthenticated()) {
            throw new Error('Must be logged in to delete account');
        }

        if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/api/user/account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                this.logout();
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Account deletion failed:', error);
            throw error;
        }
    }
}

// Create global auth manager instance
window.AuthManager = new ONTOPAuthManager();
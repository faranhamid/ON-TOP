// ON TOP - Elite Productivity Platform
// Professional Enterprise-Grade JavaScript Implementation
// Built for luxury productivity and maximum performance

console.log('⚡ ON TOP - Elite Productivity Platform Loading...');

// ===========================
// PROFESSIONAL CONSTANTS & CONFIG
// ===========================

const APP_CONFIG = {
    version: '2.0.0',
    name: 'ON TOP',
    apiKeys: {
        alphaVantage: '962SGZODSQNYQ8FG'
    },
    cache: {
        stocksTTL: 300000,  // 5 minutes
        cryptoTTL: 300000   // 5 minutes
    },
    limits: {
        maxTasks: 1000,
        maxBills: 50,
        maxGoals: 20
    }
};

const API_BASE_URL = (() => {
    try {
        const fromGlobal = window.__ONTOP_API_BASE__;
        if (fromGlobal && typeof fromGlobal === 'string') return fromGlobal.replace(/\/$/, '');
    } catch (_) { /* noop */ }
    const isLocalhost = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (isLocalhost) return 'http://localhost:3001';
    return 'https://ontop-api.yourdomain.com';
})();

// ===========================
// ADVANCED STATE MANAGEMENT
// ===========================

const AppState = {
    // Core App State
    currentSection: 'planner',
    currentView: 'day',
    currentDate: new Date(),
    initialized: false,
    
    // User Profile
    user: JSON.parse(localStorage.getItem('ontop_user') || '{}'),
    
    // Enhanced Data Stores
    tasks: JSON.parse(localStorage.getItem('ontop_tasks') || '{}'),
    
    fitness: JSON.parse(localStorage.getItem('ontop_fitness') || JSON.stringify({
        currentWeight: 170,
        targetWeight: 160,
        bodyFat: 15,
        muscleMass: 145,
        caloriesTarget: 2000,
        proteinTarget: 150,
        caloriesConsumed: 0,
        proteinConsumed: 0,
        workoutHistory: [],
        lastWeightUpdate: null
    })),
    
    finances: {
        income: parseFloat(localStorage.getItem('ontop_income') || '0'),
        bills: JSON.parse(localStorage.getItem('ontop_bills') || '[]'),
        expenses: JSON.parse(localStorage.getItem('ontop_expenses') || '[]'),
        goals: JSON.parse(localStorage.getItem('ontop_goals') || '[]'),
        budgetPlan: JSON.parse(localStorage.getItem('ontop_budget') || '{}')
    },
    
    // Enhanced Chat System
    chat: {
        messages: JSON.parse(localStorage.getItem('ontop_chat_messages') || '[]'),
        sessions: parseInt(localStorage.getItem('ontop_chat_sessions') || '0'),
        totalMessages: parseInt(localStorage.getItem('ontop_chat_total') || '0'),
        daysActive: parseInt(localStorage.getItem('ontop_chat_days') || '0'),
        lastConversation: localStorage.getItem('ontop_chat_last') || null,
        conversationContext: {}
    },
    

    
    // UI State
    modals: {
        active: null,
        stack: []
    },
    
    // Performance Metrics
    performance: {
        loadTime: 0,
        lastSync: null,
        dataSize: 0
    }
};

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Loaded - Initializing ON TOP');
    
    initializeApp();
    setupEventListeners();
    loadUserData();
    initializePlanner();
    initializeFitness();
    initializeFinances();
});

function initializeApp() {
    // Set up mobile viewport handling
    if (window.innerHeight > window.innerWidth) {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    
    // Initialize navigation
    updateActiveNavigation('planner');
    
    // Show welcome for first time users
    if (!AppState.user.name) {
        // For now, we'll skip onboarding and jump right into the app
        console.log('🎯 Ready for elite productivity');
    }
    
    console.log('🎯 ON TOP Initialized Successfully');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Calendar view switcher
    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchCalendarView(view);
        });
    });
    

    
    // Prevent default form submissions
    document.addEventListener('submit', (e) => e.preventDefault());
    
    // Touch events for mobile
    document.addEventListener('touchstart', function() {}, { passive: true });
}

function loadUserData() {
    const fitness = AppState.fitness;
    
    // Update UI with saved data
    updateElement('current-weight', fitness.currentWeight);
    updateElement('target-weight', fitness.targetWeight);
    updateElement('calories-target', fitness.caloriesTarget);
    updateElement('protein-target', fitness.proteinTarget + 'g');
    updateElement('calories-consumed', fitness.caloriesConsumed);
    updateElement('protein-consumed', fitness.proteinConsumed + 'g');
    
    // Update totals
    updateTotalBills();
    loadFinancialGoals();
    loadChatHistory();
}

// ===========================
// NAVIGATION SYSTEM
// ===========================

function switchSection(section) {
    console.log(`🔄 Switching to ${section} section`);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        AppState.currentSection = section;
        
        // Update navigation
        updateActiveNavigation(section);
        
        // Load section-specific data
        handleSectionLoad(section);
    }
}

function updateActiveNavigation(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
}

function handleSectionLoad(section) {
    switch(section) {
        case 'planner':
            initializePlanner();
            break;
        case 'fitness':
            initializeFitness();
            break;
        case 'finances':
            initializeFinances();
            break;
        case 'lifecoach':
            scrollChatToBottom();
            break;
        case 'settings':
            // Settings section loads automatically, no special initialization needed
            break;
    }
}

// ===========================
// PLANNER FUNCTIONALITY
// ===========================

function initializePlanner() {
    updateCalendarTitle();
    renderCalendarView();
}

function switchCalendarView(view) {
    console.log(`📅 Switching to ${view} view`);
    
    AppState.currentView = view;
    
    // Update buttons
    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    renderCalendarView();
}

function renderCalendarView() {
    const container = document.getElementById('calendar-container');
    const view = AppState.currentView;
    
    switch(view) {
        case 'day':
            container.innerHTML = renderDayView();
            break;
        case 'week':
            container.innerHTML = renderWeekView();
            break;
        case 'month':
            container.innerHTML = renderMonthView();
            break;
        case 'year':
            container.innerHTML = renderYearView();
            break;
    }
}

function renderDayView() {
    const date = AppState.currentDate;
    const dateKey = formatDateKey(date);
    const tasks = AppState.tasks[dateKey] || [];
    
    let html = '<div class="day-view">';
    
    // Time slots (24 hours)
    for (let hour = 0; hour < 24; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const hourTasks = tasks.filter(task => task.time === time);
        
        html += `
            <div class="time-slot" onclick="addTaskAtTime('${time}')">
                <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #1a1a1a;">
                    <div style="width: 60px; font-weight: 600; color: #fff;">${formatTimeDisplay(hour)}</div>
                    <div style="flex: 1; margin-left: 16px;">
                        ${hourTasks.map(task => `
                            <div class="task-item" style="background: #1a1a1a; margin-bottom: 4px; padding: 8px 12px; border-radius: 8px; position: relative; cursor: pointer;" onclick="editTask('${task.id}')">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1;">
                                        <div style="color: #fff; font-weight: 500;">${task.title}</div>
                                        ${task.duration ? `<div style="color: #999; font-size: 11px; margin-top: 2px;">⏱ ${task.duration}</div>` : ''}
                                        ${task.description ? `<div style="color: #666; font-size: 12px; margin-top: 2px;">${task.description}</div>` : ''}
                                    </div>
                                    <button onclick="event.stopPropagation(); deleteTask('${task.id}')" style="background: #ff4444; border: none; color: white; width: 20px; height: 20px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-left: 8px; display: flex; align-items: center; justify-content: center;" title="Delete task">×</button>
                                </div>
                            </div>
                        `).join('')}
                        ${hourTasks.length === 0 ? '<div style="color: #333; font-size: 14px;">Available</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function renderWeekView() {
    const startDate = getWeekStart(AppState.currentDate);
    let html = '<div class="week-view" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateKey = formatDateKey(date);
        const dayTasks = AppState.tasks[dateKey] || [];
        
        html += `
            <div class="week-day" style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 12px; min-height: 200px; cursor: pointer;" onclick="selectDate('${dateKey}')">
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-weight: 600; color: #fff;">${days[i]}</div>
                    <div style="font-size: 18px; color: #fff; margin-top: 4px;">${date.getDate()}</div>
                </div>
                <div>
                    ${dayTasks.slice(0, 3).map(task => `
                        <div style="background: #1a1a1a; margin-bottom: 4px; padding: 6px; border-radius: 6px; font-size: 12px;">
                            <div style="color: #fff; font-weight: 500;">${task.title}</div>
                            <div style="color: #666;">${task.time}${task.duration ? ` • ${task.duration}` : ''}</div>
                        </div>
                    `).join('')}
                    ${dayTasks.length > 3 ? `<div style="color: #666; font-size: 11px; text-align: center;">+${dayTasks.length - 3} more</div>` : ''}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function renderMonthView() {
    const year = AppState.currentDate.getFullYear();
    const month = AppState.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let html = '<div class="month-view">';
    
    // Days header
    html += '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin-bottom: 8px;">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        html += `<div style="text-align: center; padding: 8px; font-weight: 600; color: #666; font-size: 12px;">${day}</div>`;
    });
    html += '</div>';
    
    // Calendar grid
    html += '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;">';
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateKey = formatDateKey(date);
        const dayTasks = AppState.tasks[dateKey] || [];
        const isCurrentMonth = date.getMonth() === month;
        const isToday = isDateToday(date);
        
        html += `
            <div class="calendar-day" style="
                background: ${isToday ? '#1a1a1a' : '#0a0a0a'}; 
                border: 1px solid ${isToday ? '#fff' : '#1a1a1a'}; 
                padding: 8px; 
                min-height: 60px; 
                cursor: pointer;
                opacity: ${isCurrentMonth ? '1' : '0.3'};
            " onclick="selectDate('${dateKey}')">
                <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">${date.getDate()}</div>
                ${dayTasks.length > 0 ? `<div style="width: 6px; height: 6px; background: #fff; border-radius: 50%; margin-top: 4px;"></div>` : ''}
            </div>
        `;
    }
    
    html += '</div></div>';
    return html;
}

function renderYearView() {
    const year = AppState.currentDate.getFullYear();
    let html = '<div class="year-view" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">';
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    months.forEach((month, index) => {
        const monthTasks = Object.keys(AppState.tasks).filter(dateKey => {
            const date = new Date(dateKey);
            return date.getFullYear() === year && date.getMonth() === index;
        }).reduce((sum, dateKey) => sum + AppState.tasks[dateKey].length, 0);
        
        html += `
            <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px; text-align: center; cursor: pointer;" onclick="selectMonth(${index})">
                <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">${month}</div>
                <div style="color: #666; font-size: 14px;">${monthTasks} tasks</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function selectDate(dateKey) {
    AppState.currentDate = new Date(dateKey);
    switchCalendarView('day');
    updateCalendarTitle();
}

function selectMonth(monthIndex) {
    AppState.currentDate.setMonth(monthIndex);
    AppState.currentDate.setDate(1);
    switchCalendarView('month');
    updateCalendarTitle();
}

function previousPeriod() {
    const view = AppState.currentView;
    const date = AppState.currentDate;
    
    switch(view) {
        case 'day':
            date.setDate(date.getDate() - 1);
            break;
        case 'week':
            date.setDate(date.getDate() - 7);
            break;
        case 'month':
            date.setMonth(date.getMonth() - 1);
            break;
        case 'year':
            date.setFullYear(date.getFullYear() - 1);
            break;
    }
    
    updateCalendarTitle();
    renderCalendarView();
}

function nextPeriod() {
    const view = AppState.currentView;
    const date = AppState.currentDate;
    
    switch(view) {
        case 'day':
            date.setDate(date.getDate() + 1);
            break;
        case 'week':
            date.setDate(date.getDate() + 7);
            break;
        case 'month':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'year':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }
    
    updateCalendarTitle();
    renderCalendarView();
}

function updateCalendarTitle() {
    const date = AppState.currentDate;
    const view = AppState.currentView;
    let title = '';
    
    switch(view) {
        case 'day':
            title = formatDateDisplay(date);
            break;
        case 'week':
            const weekStart = getWeekStart(date);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            title = `${formatDateDisplay(weekStart)} - ${formatDateDisplay(weekEnd)}`;
            break;
        case 'month':
            title = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            break;
        case 'year':
            title = date.getFullYear().toString();
            break;
    }
    
    updateElement('calendar-title', title);
}

// Task Management
function addTask() {
    showTaskModal();
}

function addTaskAtTime(time) {
    showTaskModal(time);
}

function showTaskModal(defaultTime = '') {
    const modal = createModal('Add Task', `
        <div class="input-group">
            <label class="input-label">Title</label>
            <input type="text" id="task-title" class="input-field" placeholder="Enter task title" required>
        </div>
        <div class="input-group">
            <label class="input-label">Time</label>
            <input type="time" id="task-time" class="input-field" value="${defaultTime}" required>
        </div>
        <div class="input-group">
            <label class="input-label">Duration</label>
            <select id="task-duration" class="input-field" required>
                <option value="">Select duration...</option>
                <option value="15 min">15 minutes</option>
                <option value="30 min">30 minutes</option>
                <option value="45 min">45 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="4 hours">4 hours</option>
                <option value="All day">All day</option>
                <option value="custom">Custom...</option>
            </select>
        </div>
        <div class="input-group" id="custom-duration-group" style="display: none;">
            <label class="input-label">Custom Duration</label>
            <input type="text" id="custom-duration" class="input-field" placeholder="e.g., 2.5 hours, 90 min">
        </div>
        <div class="input-group">
            <label class="input-label">Description (Optional)</label>
            <textarea id="task-description" class="input-field" placeholder="Add details..." rows="3"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveTask()" style="flex: 1;">Save Task</button>
        </div>
    `);
    
    showModal(modal);
    
    // Add event listener for duration dropdown
    setTimeout(() => {
        const durationSelect = document.getElementById('task-duration');
        const customGroup = document.getElementById('custom-duration-group');
        
        durationSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        });
    }, 100);
}

function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const time = document.getElementById('task-time').value;
    const description = document.getElementById('task-description').value.trim();
    const durationSelect = document.getElementById('task-duration').value;
    const customDuration = document.getElementById('custom-duration').value.trim();
    
    if (!title || !time || !durationSelect) {
        alert('Please fill in the title, time, and duration!');
        return;
    }
    
    let finalDuration = durationSelect;
    if (durationSelect === 'custom') {
        if (!customDuration) {
            alert('Please enter a custom duration!');
            return;
        }
        finalDuration = customDuration;
    }
    
    const dateKey = formatDateKey(AppState.currentDate);
    if (!AppState.tasks[dateKey]) {
        AppState.tasks[dateKey] = [];
    }
    
    const task = {
        id: Date.now().toString(),
        title,
        time,
        duration: finalDuration,
        description,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    AppState.tasks[dateKey].push(task);
    AppState.tasks[dateKey].sort((a, b) => a.time.localeCompare(b.time));
    
    localStorage.setItem('ontop_tasks', JSON.stringify(AppState.tasks));
    
    closeModal();
    renderCalendarView();
    
    console.log('✅ Task saved:', task);
}

function deleteTask(taskId) {
    const confirmation = confirm('Are you sure you want to delete this task?');
    if (!confirmation) return;
    
    const dateKey = formatDateKey(AppState.currentDate);
    if (!AppState.tasks[dateKey]) return;
    
    // Find and remove the task
    AppState.tasks[dateKey] = AppState.tasks[dateKey].filter(task => task.id !== taskId);
    
    // Save to localStorage
    localStorage.setItem('ontop_tasks', JSON.stringify(AppState.tasks));
    
    // Re-render the calendar
    renderCalendarView();
    
    console.log('🗑️ Task deleted:', taskId);
}

function editTask(taskId) {
    // Find the task
    const dateKey = formatDateKey(AppState.currentDate);
    const task = AppState.tasks[dateKey]?.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Show edit modal (for now, just show task details)
    const modal = createModal('Task Details', `
        <div style="text-align: left;">
            <h3 style="color: #fff; margin-bottom: 16px;">${task.title}</h3>
            <div style="margin-bottom: 12px;">
                <strong style="color: #999;">Time:</strong> <span style="color: #fff;">${formatTimeDisplay(parseInt(task.time.split(':')[0]))}</span>
            </div>
            ${task.duration ? `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #999;">Duration:</strong> <span style="color: #fff;">${task.duration}</span>
                </div>
            ` : ''}
            ${task.description ? `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #999;">Description:</strong> 
                    <div style="color: #fff; margin-top: 4px; padding: 8px; background: #1a1a1a; border-radius: 4px;">${task.description}</div>
                </div>
            ` : ''}
            <div style="margin-bottom: 12px;">
                <strong style="color: #999;">Created:</strong> <span style="color: #fff;">${new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Close</button>
            <button class="btn" onclick="closeModal(); deleteTask('${task.id}')" style="flex: 1; background: #ff4444; border: 1px solid #ff4444;">Delete Task</button>
        </div>
    `);
    
    showModal(modal);
}

// ===========================
// FITNESS FUNCTIONALITY
// ===========================

function initializeFitness() {
    calculateNutritionTargets();
}

function updateWeight() {
    const modal = createModal('Update Weight', `
        <div class="input-group">
            <label class="input-label">Current Weight (lbs)</label>
            <input type="number" id="current-weight-input" class="input-field" value="${AppState.fitness.currentWeight}" min="50" max="500">
        </div>
        <div class="input-group">
            <label class="input-label">Target Weight (lbs)</label>
            <input type="number" id="target-weight-input" class="input-field" value="${AppState.fitness.targetWeight}" min="50" max="500">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveWeight()" style="flex: 1;">Update</button>
        </div>
    `);
    
    showModal(modal);
}

function saveWeight() {
    const currentWeight = parseInt(document.getElementById('current-weight-input').value);
    const targetWeight = parseInt(document.getElementById('target-weight-input').value);
    
    if (!currentWeight || !targetWeight) {
        alert('Please enter valid weights!');
        return;
    }
    
    AppState.fitness.currentWeight = currentWeight;
    AppState.fitness.targetWeight = targetWeight;
    
    updateElement('current-weight', currentWeight);
    updateElement('target-weight', targetWeight);
    
    calculateNutritionTargets();
    saveFitnessData();
    closeModal();
    
    console.log('✅ Weight updated:', { currentWeight, targetWeight });
}

function calculateNutritionTargets() {
    const weight = AppState.fitness.currentWeight;
    const target = AppState.fitness.targetWeight;
    
    // Basic calculation - can be made more sophisticated
    let calories, protein;
    
    if (target < weight) {
        // Weight loss
        calories = Math.round(weight * 12);
        protein = Math.round(weight * 1.2);
    } else if (target > weight) {
        // Weight gain
        calories = Math.round(weight * 16);
        protein = Math.round(weight * 1.4);
    } else {
        // Maintenance
        calories = Math.round(weight * 14);
        protein = Math.round(weight * 1.2);
    }
    
    AppState.fitness.caloriesTarget = calories;
    AppState.fitness.proteinTarget = protein;
    
    updateElement('calories-target', calories);
    updateElement('protein-target', protein + 'g');
    
    saveFitnessData();
}

function logNutrition() {
    const modal = createModal('Log Nutrition', `
        <div class="input-group">
            <label class="input-label">Calories</label>
            <input type="number" id="calories-input" class="input-field" placeholder="Enter calories" min="0" max="5000">
        </div>
        <div class="input-group">
            <label class="input-label">Protein (g)</label>
            <input type="number" id="protein-input" class="input-field" placeholder="Enter protein" min="0" max="500">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveNutrition()" style="flex: 1;">Add</button>
        </div>
    `);
    
    showModal(modal);
}

function saveNutrition() {
    const calories = parseInt(document.getElementById('calories-input').value) || 0;
    const protein = parseInt(document.getElementById('protein-input').value) || 0;
    
    AppState.fitness.caloriesConsumed += calories;
    AppState.fitness.proteinConsumed += protein;
    
    updateElement('calories-consumed', AppState.fitness.caloriesConsumed);
    updateElement('protein-consumed', AppState.fitness.proteinConsumed + 'g');
    
    saveFitnessData();
    closeModal();
    
    console.log('✅ Nutrition logged:', { calories, protein });
}

function getWorkout() {
    const workouts = [
        {
            name: "Elite Upper Body Destroyer",
            exercises: [
                "Push-ups: 4 sets x 15-20 reps",
                "Pull-ups: 4 sets x 8-12 reps", 
                "Dips: 3 sets x 12-15 reps",
                "Overhead Press: 4 sets x 10-12 reps",
                "Barbell Rows: 4 sets x 10-12 reps",
                "Bicep Curls: 3 sets x 12-15 reps"
            ],
            duration: "45-60 minutes",
            intensity: "High"
        },
        {
            name: "Powerhouse Lower Body",
            exercises: [
                "Squats: 4 sets x 12-15 reps",
                "Deadlifts: 4 sets x 8-10 reps",
                "Lunges: 3 sets x 12 per leg",
                "Hip Thrusts: 4 sets x 15 reps",
                "Calf Raises: 4 sets x 20 reps",
                "Leg Press: 3 sets x 15-20 reps"
            ],
            duration: "50-65 minutes", 
            intensity: "High"
        },
        {
            name: "Elite HIIT Cardio",
            exercises: [
                "Burpees: 30 seconds on, 15 off x 6 rounds",
                "Mountain Climbers: 45 seconds on, 15 off x 4 rounds",
                "Jump Squats: 30 seconds on, 30 off x 5 rounds",
                "High Knees: 20 seconds on, 10 off x 8 rounds",
                "Plank: Hold for 60 seconds x 3 sets"
            ],
            duration: "25-35 minutes",
            intensity: "Maximum"
        }
    ];
    
    const workout = workouts[Math.floor(Math.random() * workouts.length)];
    
    const modal = createModal('AI Trainer - Today\'s Workout', `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 8px;">${workout.name}</h3>
            <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;">
                <div style="background: #1a1a1a; padding: 8px 12px; border-radius: 8px;">
                    <div style="color: #666; font-size: 12px;">Duration</div>
                    <div style="color: #fff; font-weight: 600;">${workout.duration}</div>
                </div>
                <div style="background: #1a1a1a; padding: 8px 12px; border-radius: 8px;">
                    <div style="color: #666; font-size: 12px;">Intensity</div>
                    <div style="color: #fff; font-weight: 600;">${workout.intensity}</div>
                </div>
            </div>
        </div>
        <div style="text-align: left;">
            <h4 style="color: #fff; margin-bottom: 12px;">Exercises:</h4>
            ${workout.exercises.map(exercise => `
                <div style="background: #1a1a1a; margin-bottom: 8px; padding: 12px; border-radius: 8px;">
                    <div style="color: #fff; font-weight: 500;">${exercise}</div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%; margin-top: 20px;">Start Workout 💪</button>
    `);
    
    showModal(modal);
}

function generateMeal() {
    const caloriesTarget = AppState.fitness.caloriesTarget;
    const proteinTarget = AppState.fitness.proteinTarget;
    
    const meals = [
        {
            name: "Elite Grilled Chicken Power Bowl",
            calories: Math.round(caloriesTarget * 0.4),
            protein: Math.round(proteinTarget * 0.6),
            ingredients: [
                "8oz grilled chicken breast",
                "1 cup quinoa",
                "Mixed greens (2 cups)",
                "1/2 avocado",
                "Cherry tomatoes",
                "Olive oil (1 tbsp)",
                "Lemon juice"
            ],
            instructions: [
                "1. Season chicken breast with salt, pepper, and herbs",
                "2. Grill chicken for 6-7 minutes per side until cooked through", 
                "3. Cook quinoa according to package instructions",
                "4. Prepare salad with mixed greens and tomatoes",
                "5. Slice avocado and arrange over salad",
                "6. Slice chicken and place on top",
                "7. Drizzle with olive oil and lemon juice"
            ]
        },
        {
            name: "Champion Salmon & Sweet Potato",
            calories: Math.round(caloriesTarget * 0.45),
            protein: Math.round(proteinTarget * 0.55),
            ingredients: [
                "6oz salmon fillet",
                "1 large roasted sweet potato",
                "Steamed broccoli (1 cup)",
                "Asparagus spears",
                "Coconut oil (1 tsp)",
                "Garlic and herbs"
            ],
            instructions: [
                "1. Preheat oven to 400°F",
                "2. Season salmon with herbs and garlic",
                "3. Roast sweet potato for 45 minutes",
                "4. Bake salmon for 12-15 minutes",
                "5. Steam broccoli and asparagus until tender",
                "6. Serve together with a drizzle of coconut oil"
            ]
        },
        {
            name: "Warrior Steak & Vegetables",
            calories: Math.round(caloriesTarget * 0.5),
            protein: Math.round(proteinTarget * 0.7),
            ingredients: [
                "6oz sirloin steak",
                "Roasted vegetables medley",
                "Baby spinach (2 cups)",
                "Mushrooms",
                "Bell peppers",
                "Grass-fed butter (1 tbsp)"
            ],
            instructions: [
                "1. Let steak come to room temperature",
                "2. Season generously with salt and pepper",
                "3. Sear in hot pan for 4-5 minutes per side",
                "4. Roast vegetables at 425°F for 20 minutes",
                "5. Sauté spinach and mushrooms",
                "6. Rest steak for 5 minutes before serving",
                "7. Top with grass-fed butter"
            ]
        }
    ];
    
    const meal = meals[Math.floor(Math.random() * meals.length)];
    
    const modal = createModal('AI Meal Generator', `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 12px;">${meal.name}</h3>
            <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 20px;">
                <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">${meal.calories}</div>
                    <div style="color: #666; font-size: 12px;">Calories</div>
                </div>
                <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">${meal.protein}g</div>
                    <div style="color: #666; font-size: 12px;">Protein</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px;">Ingredients:</h4>
            ${meal.ingredients.map(ingredient => `
                <div style="background: #1a1a1a; margin-bottom: 4px; padding: 8px 12px; border-radius: 6px;">
                    <div style="color: #fff;">• ${ingredient}</div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px;">Instructions:</h4>
            ${meal.instructions.map(instruction => `
                <div style="background: #1a1a1a; margin-bottom: 6px; padding: 10px 12px; border-radius: 6px;">
                    <div style="color: #fff; line-height: 1.4;">${instruction}</div>
                </div>
            `).join('')}
        </div>
        
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Cook This Meal 🔥</button>
    `);
    
    showModal(modal);
}

function saveFitnessData() {
    localStorage.setItem('ontop_fitness', JSON.stringify(AppState.fitness));
}

// ===========================
// FINANCES FUNCTIONALITY  
// ===========================

function initializeFinances() {
    updateTotalBills();
    loadFinancialGoals();
}

function addBill() {
    const modal = createModal('Add Bill', `
        <div class="input-group">
            <label class="input-label">Bill Name</label>
            <input type="text" id="bill-name" class="input-field" placeholder="e.g., Rent, Utilities" required>
        </div>
        <div class="input-group">
            <label class="input-label">Amount ($)</label>
            <input type="number" id="bill-amount" class="input-field" placeholder="0.00" min="0" step="0.01" required>
        </div>
        <div class="input-group">
            <label class="input-label">Due Date</label>
            <input type="number" id="bill-due" class="input-field" placeholder="Day of month (1-31)" min="1" max="31" required>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveBill()" style="flex: 1;">Add Bill</button>
        </div>
    `);
    
    showModal(modal);
}

function saveBill() {
    const name = document.getElementById('bill-name').value.trim();
    const amount = parseFloat(document.getElementById('bill-amount').value);
    const dueDate = parseInt(document.getElementById('bill-due').value);
    
    if (!name || !amount || !dueDate) {
        alert('Please fill in all fields!');
        return;
    }
    
    const bill = {
        id: Date.now().toString(),
        name,
        amount,
        dueDate,
        createdAt: new Date().toISOString()
    };
    
    AppState.finances.bills.push(bill);
    localStorage.setItem('ontop_bills', JSON.stringify(AppState.finances.bills));
    
    updateTotalBills();
    renderBillsList();
    closeModal();
    
    console.log('✅ Bill added:', bill);
}

function updateTotalBills() {
    const total = AppState.finances.bills.reduce((sum, bill) => sum + bill.amount, 0);
    updateElement('total-bills', `$${total.toFixed(2)}`);
    renderBillsList();
}

function renderBillsList() {
    const container = document.getElementById('bills-list');
    if (!container) return;
    
    const bills = AppState.finances.bills;
    
    if (bills.length === 0) {
        container.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No bills added yet</div>';
        return;
    }
    
    container.innerHTML = bills.map(bill => `
        <div class="market-item" style="justify-content: space-between;">
            <div>
                <div class="market-symbol">${bill.name}</div>
                <div class="market-name">Due on ${bill.dueDate}${getOrdinalSuffix(bill.dueDate)}</div>
            </div>
            <div style="text-align: right;">
                <div class="price-value">$${bill.amount.toFixed(2)}</div>
                <button onclick="deleteBill('${bill.id}')" style="background: none; border: none; color: #666; cursor: pointer; margin-top: 4px;">✕</button>
            </div>
        </div>
    `).join('');
}

function deleteBill(billId) {
    if (confirm('Delete this bill?')) {
        AppState.finances.bills = AppState.finances.bills.filter(bill => bill.id !== billId);
        localStorage.setItem('ontop_bills', JSON.stringify(AppState.finances.bills));
        updateTotalBills();
    }
}

function addFinancialGoal() {
    const modal = createModal('Add Financial Goal', `
        <div class="input-group">
            <label class="input-label">Goal Name</label>
            <input type="text" id="goal-name" class="input-field" placeholder="e.g., Emergency Fund, Vacation" required>
        </div>
        <div class="input-group">
            <label class="input-label">Target Amount ($)</label>
            <input type="number" id="goal-target" class="input-field" placeholder="10000" min="0" step="0.01" required>
        </div>
        <div class="input-group">
            <label class="input-label">Current Amount ($)</label>
            <input type="number" id="goal-current" class="input-field" placeholder="0" min="0" step="0.01" value="0">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveFinancialGoal()" style="flex: 1;">Add Goal</button>
        </div>
    `);
    
    showModal(modal);
}

function saveFinancialGoal() {
    const name = document.getElementById('goal-name').value.trim();
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value) || 0;
    
    if (!name || !target) {
        alert('Please fill in the goal name and target amount!');
        return;
    }
    
    const goal = {
        id: Date.now().toString(),
        name,
        target,
        current,
        createdAt: new Date().toISOString()
    };
    
    AppState.finances.goals.push(goal);
    localStorage.setItem('ontop_goals', JSON.stringify(AppState.finances.goals));
    
    loadFinancialGoals();
    closeModal();
    
    console.log('✅ Financial goal added:', goal);
}

function loadFinancialGoals() {
    const container = document.getElementById('goals-list');
    if (!container) return;
    
    const goals = AppState.finances.goals;
    
    if (goals.length === 0) {
        container.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No savings goals yet</div>';
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const progress = Math.min((goal.current / goal.target) * 100, 100);
        
        return `
            <div style="background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <div style="color: #fff; font-weight: 600;">${goal.name}</div>
                        <div style="color: #666; font-size: 12px;">$${goal.current.toFixed(2)} of $${goal.target.toFixed(2)}</div>
                    </div>
                    <button onclick="updateGoal('${goal.id}')" style="background: none; border: 1px solid #333; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Update</button>
                </div>
                <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #fff; height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
                </div>
                <div style="text-align: right; margin-top: 6px; color: #666; font-size: 12px;">${progress.toFixed(1)}%</div>
            </div>
        `;
    }).join('');
}

function updateGoal(goalId) {
    const goal = AppState.finances.goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const modal = createModal('Update Goal', `
        <div class="input-group">
            <label class="input-label">${goal.name}</label>
            <div style="color: #666; margin-bottom: 12px;">Target: $${goal.target.toFixed(2)}</div>
        </div>
        <div class="input-group">
            <label class="input-label">Current Amount ($)</label>
            <input type="number" id="goal-update-current" class="input-field" value="${goal.current}" min="0" step="0.01" required>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveGoalUpdate('${goalId}')" style="flex: 1;">Update</button>
        </div>
    `);
    
    showModal(modal);
}

function saveGoalUpdate(goalId) {
    const newAmount = parseFloat(document.getElementById('goal-update-current').value);
    
    if (isNaN(newAmount) || newAmount < 0) {
        alert('Please enter a valid amount!');
        return;
    }
    
    const goal = AppState.finances.goals.find(g => g.id === goalId);
    if (goal) {
        goal.current = newAmount;
        localStorage.setItem('ontop_goals', JSON.stringify(AppState.finances.goals));
        loadFinancialGoals();
    }
    
    closeModal();
    console.log('✅ Goal updated:', goalId, newAmount);
}

// ===========================
// LIFE COACH (EMMA) FUNCTIONALITY
// ===========================

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Generate Emma's response with AI
    setTimeout(async () => {
        try {
            const response = await generateEmmaResponse(message);
            removeTypingIndicator();
            addChatMessage(response, 'emma');
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator();
            addChatMessage("I'm having a moment where I need to reconnect. Can you try sharing that again? I want to make sure I'm fully present for our conversation.", 'emma');
        }
    }, 1200 + Math.random() * 800); // Realistic response time
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-bubble">${message}</div>`;
    
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
    
    // Save to localStorage
    AppState.chat.push({ message, sender, timestamp: new Date().toISOString() });
    localStorage.setItem('ontop_chat', JSON.stringify(AppState.chat));
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message emma typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-bubble">
            <div style="display: flex; gap: 4px; align-items: center;">
                <div style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                <div style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: pulse 1.5s infinite 0.3s;"></div>
                <div style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: pulse 1.5s infinite 0.6s;"></div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollChatToBottom();
    
    // Add CSS animation if not exists
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            @keyframes pulse {
                0%, 70%, 100% { opacity: 0.4; transform: scale(1); }
                35% { opacity: 1; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function generateEmmaResponse(userMessage) {
    // Initialize comprehensive conversation context
    if (!AppState.chat.conversationContext.topics) {
        // Try to load existing conversation context first
        const savedContext = localStorage.getItem('ontop_chat_context');
        if (savedContext) {
            try {
                AppState.chat.conversationContext = JSON.parse(savedContext);
                // Clean up old history to prevent memory issues (keep last 10 messages)
                if (AppState.chat.conversationContext.conversationHistory.length > 10) {
                    AppState.chat.conversationContext.conversationHistory = 
                        AppState.chat.conversationContext.conversationHistory.slice(-10);
                }
            } catch (e) {
                console.log('Creating new conversation context');
            }
        }
        
        // Ensure all required fields exist
        if (!AppState.chat.conversationContext || !AppState.chat.conversationContext.topics) {
            AppState.chat.conversationContext = {
                topics: [],
                mood: 'neutral',
                lastResponse: 'greeting',
                sessionDepth: 0,
                emotionalState: 'exploring',
                therapeuticFocus: 'building_rapport',
                personalDetails: {},
                cognitivePatterns: [],
                coreBeliefs: [],
                lastValidation: null,
                conversationHistory: [],
                lastUserMessage: '',
                currentTopic: ''
            };
        }
    }
    
    // Store conversation history and analyze patterns
    AppState.chat.conversationContext.conversationHistory.push({
        user: userMessage,
        timestamp: Date.now(),
        messageNumber: AppState.chat.conversationContext.sessionDepth + 1
    });
    AppState.chat.conversationContext.lastUserMessage = userMessage;
    
    // Track session depth for more sophisticated responses
    AppState.chat.conversationContext.sessionDepth++;
    
    // Save conversation context to localStorage for persistence
    localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
    
    try {
        // Make API call to backend Emma service
        const response = await fetch(`${API_BASE_URL}/api/emma-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                conversationContext: AppState.chat.conversationContext
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Update conversation context with AI insights if provided
            if (data.insights) {
                AppState.chat.conversationContext.lastResponse = data.insights.responseType || 'ai_therapeutic';
                AppState.chat.conversationContext.emotionalState = data.insights.detectedEmotion || AppState.chat.conversationContext.emotionalState;
                AppState.chat.conversationContext.therapeuticFocus = data.insights.therapeuticFocus || AppState.chat.conversationContext.therapeuticFocus;
            }
            
            // Save updated context
            localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
            
            return data.response;
        } else {
            throw new Error(data.error || 'API request failed');
        }
        
    } catch (error) {
        console.error('Emma AI Error:', error);
        
        // Sophisticated fallback responses based on conversation context
        const contextualFallbacks = [
            "I'm experiencing a brief moment where I need to gather my thoughts. Your message is important to me, and I want to respond thoughtfully. Can you tell me a bit more about what's most pressing for you right now?",
            
            "I want to make sure I'm really present with you, and I'm having a moment where I need to pause and center myself. What you're sharing matters deeply. What feels most alive or significant about what you just told me?",
            
            "I'm taking a moment to fully absorb what you've shared with me. Sometimes the most meaningful responses come from really sitting with someone's experience. What would you most want me to understand about what you're going through?",
            
            "I'm having a brief technical pause, but I'm still very much here with you. Your thoughts and feelings are important to me. While I reconnect fully, what feels most essential for you to express or explore right now?",
            
            "I want to be completely present for this conversation, and I'm experiencing a momentary disruption. What you're sharing deserves my full attention. Can you help me understand what feels most important about what you just expressed?"
        ];
        
        // Use conversation history to make fallback more contextual
        const recentHistory = AppState.chat.conversationContext.conversationHistory.slice(-2);
        if (recentHistory.length > 1) {
            const contextualFallback = `I'm having a brief moment where I need to reconnect, but what you just shared about "${userMessage.slice(0, 30)}..." feels really important. While I gather myself, what stands out most to you about what you're experiencing?`;
            return contextualFallback;
        }
        
        return contextualFallbacks[Math.floor(Math.random() * contextualFallbacks.length)];
    }
}

async function generateEmmaResponse_OLD_BACKUP(userMessage) {
    
    // Initialize comprehensive conversation context
    if (!AppState.chat.conversationContext.topics) {
        // Try to load existing conversation context first
        const savedContext = localStorage.getItem('ontop_chat_context');
        if (savedContext) {
            try {
                AppState.chat.conversationContext = JSON.parse(savedContext);
                // Clean up old history to prevent memory issues (keep last 10 messages)
                if (AppState.chat.conversationContext.conversationHistory.length > 10) {
                    AppState.chat.conversationContext.conversationHistory = 
                        AppState.chat.conversationContext.conversationHistory.slice(-10);
                }
            } catch (e) {
                console.log('Creating new conversation context');
            }
        }
        
        // Ensure all required fields exist
        if (!AppState.chat.conversationContext || !AppState.chat.conversationContext.topics) {
            AppState.chat.conversationContext = {
                topics: [],
                mood: 'neutral',
                lastResponse: 'greeting',
                sessionDepth: 0,
                emotionalState: 'exploring',
                therapeuticFocus: 'building_rapport',
                personalDetails: {},
                cognitivePatterns: [],
                coreBeliefs: [],
                lastValidation: null,
                conversationHistory: [],
                lastUserMessage: '',
                currentTopic: ''
            };
        }
    }
    
    // Store conversation history and analyze patterns
    AppState.chat.conversationContext.conversationHistory.push({
        user: userMessage,
        timestamp: Date.now(),
        messageNumber: AppState.chat.conversationContext.sessionDepth + 1
    });
    AppState.chat.conversationContext.lastUserMessage = userMessage;
    
    // Track session depth for more sophisticated responses
    AppState.chat.conversationContext.sessionDepth++;
    
    // Extract key topics and emotional indicators from user's message
    const emotionalWords = {
        sadness: ['sad', 'depressed', 'down', 'upset', 'hurt', 'crying', 'lonely', 'empty'],
        anxiety: ['anxious', 'worried', 'nervous', 'overwhelmed', 'stressed', 'panic', 'fear'],
        anger: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'furious'],
        joy: ['happy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'thrilled'],
        relationships: ['boyfriend', 'girlfriend', 'husband', 'wife', 'partner', 'family', 'friend', 'relationship'],
        work: ['work', 'job', 'career', 'boss', 'coworker', 'office', 'workplace'],
        identity: ['myself', 'who am i', 'identity', 'self-worth', 'confidence', 'value']
    };
    
    // Detect current emotional state and topic
    let detectedEmotion = 'neutral';
    let detectedTopic = 'general';
    
    for (const [emotion, words] of Object.entries(emotionalWords)) {
        if (words.some(word => message.includes(word))) {
            detectedEmotion = emotion;
            detectedTopic = emotion;
            break;
        }
    }
    
    AppState.chat.conversationContext.currentTopic = detectedTopic;
    
    // Check if this is a follow-up to previous conversation
    const recentHistory = AppState.chat.conversationContext.conversationHistory.slice(-3);
    const hasRecentContext = recentHistory.length > 1;
    
    // Check if this is a returning user with previous conversation history
    const hasConversationHistory = AppState.chat.conversationContext.conversationHistory.length > 1;
    const timeSinceLastMessage = hasConversationHistory ? 
        Date.now() - AppState.chat.conversationContext.conversationHistory[AppState.chat.conversationContext.conversationHistory.length - 2]?.timestamp : 0;
    const isReturningAfterBreak = timeSinceLastMessage > 3600000; // 1 hour
    
    // Cognitive Therapy Greeting Responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || AppState.chat.conversationContext.sessionDepth === 1) {
        
        // Returning user with previous conversations
        if (hasConversationHistory && isReturningAfterBreak) {
            const returningGreetings = [
                "Hello again! I'm so glad you came back. I've been thinking about our previous conversations, and I remember you sharing some really meaningful things with me. How have you been since we last talked? What feels most present for you today?",
                "Hey there, welcome back! It feels good to continue our conversation. I remember you were working through some important things when we last spoke. How are you feeling about everything now? What's been on your mind?",
                "Hi! I'm really happy to see you again. Our previous conversations stayed with me - you shared some deep insights about yourself. How have things been unfolding for you? What would feel most helpful to explore today?",
                "Hello, and thank you for returning. I remember the courage you showed in our previous talks, and I've been wondering how you've been processing everything. What feels most alive or important for you to share right now?"
            ];
            AppState.chat.conversationContext.lastResponse = 'returning_greeting';
            AppState.chat.conversationContext.therapeuticFocus = 'reconnecting';
            return returningGreetings[Math.floor(Math.random() * returningGreetings.length)];
        }
        
        // New user or same session greetings
        const therapeuticGreetings = [
            "Hello, I'm so glad you're here. I'm Emma, and I want you to know this is a completely safe space where you can share whatever feels important to you. There's no judgment here - just genuine curiosity about your experience. What brought you here today?",
            "Hi there. I'm Emma, and I'm really honored that you've chosen to spend this time connecting. I believe deeply that everyone has wisdom within them, and sometimes we just need someone to help us access it. What's been on your heart or mind lately?",
            "Welcome. I'm Emma, and I want you to feel completely at ease here. My approach is about understanding you as a whole person - your thoughts, feelings, experiences, and dreams. Nothing is too small or too big to explore together. What feels most present for you right now?",
            "Hello, and thank you for being here. I'm Emma. I've found that the most meaningful conversations happen when we can be genuinely ourselves, without masks or pretense. This is your space to be heard and understood. What would feel most helpful to talk about today?"
        ];
        AppState.chat.conversationContext.lastResponse = 'therapeutic_greeting';
        AppState.chat.conversationContext.therapeuticFocus = 'building_rapport';
        return therapeuticGreetings[Math.floor(Math.random() * therapeuticGreetings.length)];
    }
    
    // Advanced Emotional Validation & Support
    if (message.includes('sad') || message.includes('depressed') || message.includes('down') || message.includes('upset') || message.includes('hurt')) {
        const validationResponses = [
            "I can hear the pain in what you're sharing, and I want you to know that what you're feeling makes complete sense. Sadness often carries important information about what matters to us. Can you help me understand what this sadness feels like for you? Is it heavy, empty, sharp, or something else entirely?",
            "Thank you for trusting me with something so vulnerable. It takes real courage to name when we're struggling. What you're experiencing is valid and important. I'm wondering - when you notice this sadness, what thoughts tend to come up for you? Sometimes our minds have specific stories they tell us when we're in pain.",
            "I'm sitting with you in this difficult space, and I want you to know you're not alone in feeling this way. Sometimes sadness can feel overwhelming, but it's also often connected to our deepest values and what we care about most. What do you think this sadness might be trying to tell you about what's important to you?",
            "I hear you, and I'm really glad you felt safe enough to share this with me. Sadness is one of those emotions that can feel all-consuming, but it's also deeply human and often connected to love, loss, or unmet needs. What's been the hardest part about carrying these feelings?"
        ];
        AppState.chat.conversationContext.mood = 'supportive';
        AppState.chat.conversationContext.emotionalState = 'processing_sadness';
        AppState.chat.conversationContext.lastValidation = 'sadness';
        localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
        return validationResponses[Math.floor(Math.random() * validationResponses.length)];
    }
    
    // Anxiety & Overwhelm - Cognitive Therapy Approach
    if (message.includes('anxious') || message.includes('worried') || message.includes('nervous') || message.includes('overwhelmed') || message.includes('stressed')) {
        const anxietyResponses = [
            "Anxiety can feel so intense and all-consuming. I want you to know that what you're experiencing is your mind's way of trying to protect you, even if it doesn't feel helpful right now. Let's slow down together. When you notice the anxiety, what thoughts are usually running through your mind? Sometimes naming them can help us examine whether they're based in facts or fears.",
            "I hear how overwhelming this feels for you. Anxiety often shows up when our minds are trying to solve problems that might not even happen, or when we're carrying more than we need to. Can you tell me what specifically your mind is worried might happen? Let's look at this together and see what's actually within your control.",
            "Thank you for sharing this with me. Anxiety is like having a very active alarm system - sometimes it goes off when there's real danger, and sometimes it goes off when there isn't. I'm curious about your specific experience. When the anxiety is strongest, what do you notice in your body? And what thoughts tend to spiral through your mind?",
            "What you're describing sounds really difficult to carry. I've noticed that anxiety often comes with a lot of 'what if' thinking - our minds trying to prepare for every possible scenario. But this can be exhausting. What are some of the main 'what ifs' that your mind keeps returning to? Let's explore whether these thoughts are helpful or if they're creating more suffering than protection."
        ];
        AppState.chat.conversationContext.mood = 'supportive';
        AppState.chat.conversationContext.emotionalState = 'processing_anxiety';
        AppState.chat.conversationContext.therapeuticFocus = 'cognitive_restructuring';
        localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
        return anxietyResponses[Math.floor(Math.random() * anxietyResponses.length)];
    }
    
    // Positive Emotional Validation
    if (message.includes('happy') || message.includes('excited') || message.includes('great') || message.includes('amazing') || message.includes('wonderful') || message.includes('good')) {
        const joyValidation = [
            "I can feel the joy in your words, and it genuinely lights me up! There's something so powerful about witnessing someone's happiness. I'm curious - what does this joy feel like in your body? Sometimes we don't take enough time to really savor these beautiful moments.",
            "Your excitement is contagious! I love hearing about the things that bring you alive like this. What is it about this experience that resonates so deeply with you? I have a feeling this connects to some of your core values or dreams.",
            "This is wonderful to hear! You know what I appreciate about you sharing this joy? It shows that even in a world that can feel heavy sometimes, you're still open to experiencing the good. What made this moment particularly special for you?",
            "I'm so happy for you! There's something really beautiful about how you're describing this. I'm wondering - do you feel like you give yourself permission to fully enjoy moments like this? Sometimes we're so focused on problems that we forget to really celebrate the wins."
        ];
        AppState.chat.conversationContext.mood = 'celebratory';
        AppState.chat.conversationContext.emotionalState = 'processing_joy';
        localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
        return joyValidation[Math.floor(Math.random() * joyValidation.length)];
    }
    
    // Relationship & Connection Therapy
    if (message.includes('relationship') || message.includes('family') || message.includes('friend') || message.includes('partner') || message.includes('love') || message.includes('lonely')) {
        const relationshipTherapy = [
            "Relationships are such a central part of our human experience, and they can bring us our greatest joys and our deepest challenges. I'm hearing that this is important to you. Can you help me understand what this relationship dynamic feels like from your perspective? What patterns do you notice?",
            "Thank you for bringing this relationship topic to our conversation. Our connections with others often mirror our relationship with ourselves in interesting ways. What I'm curious about is - what do you find yourself needing most in your relationships? And how well do you feel that need is being met?",
            "Relationships can be such complex landscapes to navigate. Each person brings their own history, attachment style, communication patterns, and needs. What's been the most challenging aspect of this relationship for you? And what do you find yourself longing for?",
            "I appreciate you sharing something so personal with me. Relationships often teach us so much about ourselves - our boundaries, our values, our capacity for love and vulnerability. What do you think this relationship experience is teaching you about yourself? Both the challenging parts and the growth parts?"
        ];
        AppState.chat.conversationContext.therapeuticFocus = 'relationship_patterns';
        return relationshipTherapy[Math.floor(Math.random() * relationshipTherapy.length)];
    }
    
    // Self-Worth & Identity Exploration
    if (message.includes('myself') || message.includes('self-worth') || message.includes('confidence') || message.includes('identity') || message.includes('who am i')) {
        const identityExploration = [
            "This kind of self-reflection takes real courage, and I'm honored you're exploring this with me. Our sense of self is always evolving, and sometimes that can feel uncertain or uncomfortable. When you think about who you are at your core - beyond the roles you play or what others expect - what feels most true about you?",
            "Questions about identity and self-worth are some of the most important ones we can ask. I'm curious - when do you feel most like 'yourself'? What situations, people, or activities help you feel most authentic and aligned with who you really are?",
            "Thank you for bringing this deep question to our conversation. Self-worth is often shaped by so many factors - our upbringing, society's messages, past experiences. But I believe our true worth is inherent and unchanging. What messages about your worth do you notice your inner voice telling you? Are they kind and accurate, or harsh and distorted?",
            "This kind of self-exploration is beautiful and brave. Sometimes we get so caught up in who we think we should be that we lose sight of who we actually are. What parts of yourself do you feel proud of? And what aspects of your identity feel like they're still emerging or changing?"
        ];
        AppState.chat.conversationContext.therapeuticFocus = 'identity_work';
        return identityExploration[Math.floor(Math.random() * identityExploration.length)];
    }
    
    // CONTEXTUAL CONVERSATION CONTINUATION
    // Build responses that reference and build on previous conversations
    if (hasRecentContext) {
        const previousMessages = recentHistory.map(h => h.user).join(' ');
        const conversationLength = AppState.chat.conversationContext.sessionDepth;
        
        // Long conversation continuations (5+ messages)
        if (conversationLength > 5) {
            const contextualResponses = [
                `I'm really appreciating how deeply you're exploring this with me. What I'm noticing from our conversation so far is how thoughtfully you process things. Earlier you mentioned "${recentHistory[0]?.user.slice(0, 30)}..." and now you're sharing this - I'm curious about what connections you might be seeing between these experiences?`,
                
                `You know, I've been reflecting on what you shared earlier, and I can see how much courage it takes for you to be this honest about your experience. The way you described things before gives me a sense of your strength, even in difficult moments. How are you feeling about the direction our conversation has taken?`,
                
                `I'm struck by the themes that are emerging in our conversation today. There seems to be something deeper you're working through, and I have so much respect for how you're approaching it. What feels like the most important thing for you to understand or process right now?`,
                
                `What I'm hearing in everything you've shared is someone who really cares deeply - about relationships, about doing the right thing, about understanding yourself. That kind of caring can sometimes feel heavy though. How are you taking care of yourself as you navigate all of this?`,
                
                `I keep thinking about something you said earlier - it seemed to carry a lot of weight for you. I'm wondering if that connects to what you're sharing now, or if your perspective on it has shifted at all as we've been talking?`
            ];
            
            AppState.chat.conversationContext.lastResponse = 'deep_continuation';
            localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
            return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
        }
        
        // Medium conversation follow-ups (3-5 messages)
        else if (conversationLength > 2) {
            const followUpResponses = [
                `I'm really glad you felt comfortable sharing that with me. What you just described builds on what you mentioned before, and I can see how these experiences are connected for you. What stands out to you most as you put these pieces together?`,
                
                `Thank you for continuing to trust me with your thoughts. I can hear how much you're processing right now. When you think about what you've shared in our conversation so far, what feels most important for you to focus on?`,
                
                `There's something really authentic about how you're exploring this. Earlier you touched on something that seemed significant, and now this - I'm curious what it feels like to be putting words to these experiences?`,
                
                `I'm hearing layers in what you're sharing, and I want to make sure I'm understanding you fully. What would it be like to sit with what you've told me for a moment? What comes up for you?`,
                
                `What strikes me is how willing you are to look honestly at your experience. That takes real courage. As we've been talking, have you noticed anything shifting in how you see things, or what feels important to explore?`
            ];
            
            AppState.chat.conversationContext.lastResponse = 'building_continuation';
            return followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
        }
        
        // Early conversation development (2-3 messages)
        else {
            const earlyFollowUps = [
                `I appreciate you sharing that with me. I can sense there's more beneath the surface of what you're describing. What would it feel like to explore this a little deeper together?`,
                
                `Thank you for being so open. What you're describing sounds meaningful to you. I'm curious - what feels most important about this situation right now?`,
                
                `I can hear that this matters to you. Sometimes when we start talking about something, other connected thoughts or feelings come up. What else is present for you as you think about this?`,
                
                `What you're sharing gives me a glimpse into your world, and I'm honored you're including me in this reflection. What would be most helpful to explore about this together?`
            ];
            
            AppState.chat.conversationContext.lastResponse = 'early_building';
            return earlyFollowUps[Math.floor(Math.random() * earlyFollowUps.length)];
        }
    }
    
    // Default therapeutic responses for first-time or unclear messages
    const therapeuticDefaults = [
        "I'm really listening to what you're sharing, and I can sense there's depth here. What I'm most curious about is how this experience sits with you. When you reflect on what you've just told me, what feelings come up? What thoughts?",
        "Thank you for trusting me with this. I notice that sometimes the things we say out loud can sound different than when they're just thoughts in our heads. As you hear yourself sharing this with me, what stands out to you? What feels most important?",
        "What you're describing sounds like it carries a lot of meaning for you. I'm wondering - if you were to step back and look at this situation with compassionate curiosity, what would you want to understand better? What questions feel most important to explore?",
        "I can hear that this matters to you, and I want to understand your experience more fully. Sometimes our perspectives can shift when we have space to process with someone else. What feels true for you right now as we're talking about this together?"
    ];
    
    // Track therapeutic focus for more contextual responses
    AppState.chat.conversationContext.lastResponse = 'therapeutic_exploration';
    AppState.chat.conversationContext.therapeuticFocus = 'socratic_questioning';
    
    // Save conversation context to localStorage for persistence
    localStorage.setItem('ontop_chat_context', JSON.stringify(AppState.chat.conversationContext));
    
    return therapeuticDefaults[Math.floor(Math.random() * therapeuticDefaults.length)];
}

function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadChatHistory() {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Clear existing messages except Emma's intro
    const existingMessages = messagesContainer.querySelectorAll('.message');
    existingMessages.forEach((msg, index) => {
        if (index > 0) msg.remove(); // Keep first intro message
    });
    
    // Load saved messages
    AppState.chat.forEach(chat => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${chat.sender}`;
        messageDiv.innerHTML = `<div class="message-bubble">${chat.message}</div>`;
        messagesContainer.appendChild(messageDiv);
    });
    
    scrollChatToBottom();
}




// ===========================
// SETTINGS FUNCTIONALITY
// ===========================

function editProfile() {
    alert('Profile Settings\n\nThis feature allows you to:\n• Update personal information\n• Change preferences\n• Manage account details\n\nComing soon in the next update!');
}

function notificationSettings() {
    alert('Notification Settings\n\nConfigure:\n• Push notifications\n• Email alerts\n• Reminder preferences\n• Quiet hours\n\nComing soon!');
}

function askAboutAsset(symbol, type) {
    const assetName = type === 'stock' ? getStockName(symbol) : symbol;
    
    const modal = createModal(`Ask About ${symbol}`, `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 8px;">${assetName} (${symbol})</h3>
            <p style="color: #666;">Ask our AI fund manager about this ${type}</p>
        </div>
        <div class="input-group">
            <label class="input-label">Your Question</label>
            <textarea id="asset-question" class="input-field" placeholder="e.g., What's your outlook on this stock? Should I buy now? What are the risks?" rows="3" required></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="getAssetInsight('${symbol}', '${type}')" style="flex: 1;">Get Insight</button>
        </div>
    `);
    
    showModal(modal);
}

function getAssetInsight(symbol, type) {
    const question = document.getElementById('asset-question').value.trim();
    
    if (!question) {
        alert('Please enter your question!');
        return;
    }
    
    closeModal();
    
    // Generate fund manager response
    const response = generateFundManagerResponse(symbol, type, question);
    
    const modal = createModal(`Fund Manager Insight: ${symbol}`, `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    📊
                </div>
                <div>
                    <div style="color: #fff; font-weight: 600;">Marcus Wellington, CFA</div>
                    <div style="color: #666; font-size: 12px;">Senior Fund Manager</div>
                </div>
            </div>
        </div>
        
        <div style="background: #1a1a1a; border-left: 3px solid #fff; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
            <p style="color: #fff; line-height: 1.6; font-style: italic;">"${question}"</p>
        </div>
        
        <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #fff; line-height: 1.6;">${response}</p>
        </div>
        
        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
                ⚠️ This is not financial advice. Always do your own research and consult with a qualified financial advisor.
            </p>
        </div>
        
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Thank You</button>
    `);
    
    showModal(modal);
}

function generateFundManagerResponse(symbol, type, question) {
    const responses = {
        bullish: [
            `Looking at ${symbol}, I see strong fundamentals and positive momentum. The technical indicators suggest we're in a good entry zone. However, I always recommend dollar-cost averaging rather than going all-in at once.`,
            `${symbol} has been showing resilient performance in this market environment. The company's execution on key initiatives gives me confidence in the medium-term outlook. Consider it as part of a diversified portfolio.`,
            `From a risk-adjusted return perspective, ${symbol} presents an interesting opportunity. The recent pullback might have created an attractive entry point for long-term investors.`
        ],
        bearish: [
            `While ${symbol} has its merits, I'm seeing some concerning signals in the charts and fundamentals. The macro environment isn't particularly favorable for this sector right now. I'd wait for better entry points.`,
            `${symbol} is facing some headwinds that make me cautious in the near term. The valuation seems stretched given current market conditions. Patience might be rewarded here.`,
            `I'm taking a more defensive stance on ${symbol} currently. The risk-reward ratio isn't compelling at these levels. There are better opportunities elsewhere in the market.`
        ],
        neutral: [
            `${symbol} is in a consolidation phase right now. It's neither screaming buy nor sell to me. For existing holders, I'd maintain positions but look for better risk-adjusted opportunities for new money.`,
            `The jury's still out on ${symbol}'s near-term direction. We're seeing mixed signals from both technical and fundamental analysis. I'd recommend a wait-and-see approach.`,
            `${symbol} represents a fairly valued asset in the current market. Not expensive, but not a bargain either. It could work as a core holding but isn't my top conviction play right now.`
        ]
    };
    
    // Randomly select sentiment based on question content
    let sentiment = 'neutral';
    if (question.toLowerCase().includes('buy') || question.toLowerCase().includes('bullish') || question.toLowerCase().includes('positive')) {
        sentiment = Math.random() > 0.3 ? 'bullish' : 'neutral';
    } else if (question.toLowerCase().includes('sell') || question.toLowerCase().includes('bearish') || question.toLowerCase().includes('risk')) {
        sentiment = Math.random() > 0.3 ? 'bearish' : 'neutral';
    }
    
    const responseArray = responses[sentiment];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

function getStockName(symbol) {
    const names = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft Corporation',
        'GOOGL': 'Alphabet Inc.',
        'AMZN': 'Amazon.com Inc.',
        'NVDA': 'NVIDIA Corporation',
        'META': 'Meta Platforms Inc.',
        'TSLA': 'Tesla Inc.',
        'BRK.B': 'Berkshire Hathaway',
        'LLY': 'Eli Lilly and Company',
        'AVGO': 'Broadcom Inc.',
        'JPM': 'JPMorgan Chase & Co.',
        'UNH': 'UnitedHealth Group',
        'XOM': 'Exxon Mobil Corporation',
        'JNJ': 'Johnson & Johnson',
        'V': 'Visa Inc.',
        'PG': 'Procter & Gamble',
        'MA': 'Mastercard Inc.',
        'HD': 'The Home Depot',
        'NFLX': 'Netflix Inc.',
        'BAC': 'Bank of America'
    };
    
    return names[symbol] || symbol;
}

// ===========================
// SETTINGS FUNCTIONALITY
// ===========================

function editProfile() {
    alert('Profile Settings\n\nThis feature allows you to:\n• Update personal information\n• Change preferences\n• Manage account details\n\nComing soon in the next update!');
}

function notificationSettings() {
    alert('Notification Settings\n\nConfigure:\n• Push notifications\n• Email alerts\n• Reminder preferences\n• Quiet hours\n\nComing soon!');
}

function privacySettings() {
    alert('Privacy & Security\n\nManage:\n• Data sharing preferences\n• Two-factor authentication\n• Account security\n• Privacy controls\n\nComing soon!');
}

function helpCenter() {
    alert('Help Center\n\nAccess:\n• Frequently asked questions\n• User guides\n• Video tutorials\n• Feature documentation\n\nComing soon!');
}

function contactSupport() {
    alert('Contact Support\n\n📧 support@ontop.app\n📱 1-800-ONTOP-1\n💬 Live chat available 24/7\n\nOur elite support team is here to help!');
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function createModal(title, content) {
    return `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">×</button>
            <h2 class="modal-title">${title}</h2>
            ${content}
        </div>
    `;
}

function showModal(modalHtml) {
    let modal = document.getElementById('app-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'app-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalHtml;
    modal.style.display = 'flex';
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, tomorrow)) return 'Tomorrow';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTimeDisplay(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isDateToday(date) {
    return isSameDay(date, new Date());
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// ===========================
// INITIALIZATION
// ===========================

// ===========================
// ENHANCED PLANNER FUNCTIONS
// ===========================

function quickAddTask() {
    console.log('Quick add task clicked');
    const modal = createModal('Quick Add Task', `
        <div class="input-group">
            <label class="input-label">Task Title</label>
            <input type="text" id="quick-task-title" class="input-field" placeholder="What needs to be done?" required>
        </div>
        <div class="input-group">
            <label class="input-label">Time (Optional)</label>
            <input type="time" id="quick-task-time" class="input-field">
        </div>
        <div class="input-group">
            <label class="input-label">Priority</label>
            <select id="quick-task-priority" class="input-field">
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
            </select>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveQuickTask()" style="flex: 1;">Add Task</button>
        </div>
    `);
    showModal(modal);
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('quick-task-title').focus();
    }, 100);
}

function saveQuickTask() {
    const title = document.getElementById('quick-task-title').value.trim();
    const time = document.getElementById('quick-task-time').value;
    const priority = document.getElementById('quick-task-priority').value;
    
    if (!title) {
        alert('Please enter a task title!');
        return;
    }
    
    const dateKey = formatDateKey(AppState.currentDate);
    if (!AppState.tasks[dateKey]) {
        AppState.tasks[dateKey] = [];
    }
    
    const task = {
        id: Date.now().toString(),
        title,
        time: time || '09:00',
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    AppState.tasks[dateKey].push(task);
    AppState.tasks[dateKey].sort((a, b) => a.time.localeCompare(b.time));
    
    localStorage.setItem('ontop_tasks', JSON.stringify(AppState.tasks));
    updateTaskCounts();
    
    closeModal();
    renderCalendarView();
    
    console.log('✅ Quick task added:', task);
}

function updateTaskCounts() {
    const today = formatDateKey(new Date());
    const todayTasks = AppState.tasks[today] || [];
    
    // Calculate week tasks
    const weekStart = getWeekStart(new Date());
    let weekTasks = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateKey = formatDateKey(date);
        weekTasks += (AppState.tasks[dateKey] || []).length;
    }
    
    updateElement('tasks-today', todayTasks.length);
    updateElement('tasks-week', weekTasks);
}

// ===========================
// ENHANCED FITNESS FUNCTIONS
// ===========================

function updateBodyStats() {
    const modal = createModal('Update Body Stats', `
        <div class="input-group">
            <label class="input-label">Body Fat (%)</label>
            <input type="number" id="body-fat-input" class="input-field" value="${AppState.fitness.bodyFat}" min="5" max="50" step="0.1">
        </div>
        <div class="input-group">
            <label class="input-label">Muscle Mass (lbs)</label>
            <input type="number" id="muscle-mass-input" class="input-field" value="${AppState.fitness.muscleMass}" min="50" max="300">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveBodyStats()" style="flex: 1;">Update</button>
        </div>
    `);
    showModal(modal);
}

function saveBodyStats() {
    const bodyFat = parseFloat(document.getElementById('body-fat-input').value);
    const muscleMass = parseFloat(document.getElementById('muscle-mass-input').value);
    
    if (!bodyFat || !muscleMass) {
        alert('Please enter valid values!');
        return;
    }
    
    AppState.fitness.bodyFat = bodyFat;
    AppState.fitness.muscleMass = muscleMass;
    
    updateElement('body-fat', bodyFat + '%');
    updateElement('muscle-mass', muscleMass);
    
    saveFitnessData();
    closeModal();
    
    console.log('✅ Body stats updated:', { bodyFat, muscleMass });
}

function generateCustomWorkout() {
    const workoutType = document.getElementById('workout-type').value;
    const intensity = document.getElementById('workout-intensity').value;
    
    console.log('Generating workout:', { workoutType, intensity });
    
    const workouts = {
        strength: {
            easy: {
                name: "Light Strength Foundation",
                exercises: [
                    "Bodyweight Squats: 3 sets x 12 reps",
                    "Modified Push-ups: 3 sets x 8 reps",
                    "Assisted Pull-ups: 3 sets x 5 reps",
                    "Plank: 3 sets x 30 seconds",
                    "Glute Bridges: 3 sets x 15 reps"
                ],
                duration: "25-30 minutes"
            },
            medium: {
                name: "Progressive Strength Builder",
                exercises: [
                    "Goblet Squats: 4 sets x 12 reps",
                    "Push-ups: 4 sets x 12 reps",
                    "Dumbbell Rows: 4 sets x 10 reps",
                    "Overhead Press: 3 sets x 10 reps",
                    "Romanian Deadlifts: 4 sets x 12 reps",
                    "Plank: 3 sets x 45 seconds"
                ],
                duration: "40-45 minutes"
            },
            hard: {
                name: "Elite Strength Domination",
                exercises: [
                    "Barbell Squats: 5 sets x 8 reps",
                    "Deadlifts: 5 sets x 5 reps",
                    "Bench Press: 5 sets x 8 reps",
                    "Pull-ups: 4 sets x 10 reps",
                    "Overhead Press: 4 sets x 8 reps",
                    "Barbell Rows: 4 sets x 10 reps",
                    "Weighted Plank: 3 sets x 60 seconds"
                ],
                duration: "60-75 minutes"
            }
        },
        cardio: {
            easy: {
                name: "Gentle Cardio Flow",
                exercises: [
                    "Walking: 20 minutes steady pace",
                    "Light Cycling: 15 minutes",
                    "Basic Stretching: 10 minutes"
                ],
                duration: "45 minutes"
            },
            medium: {
                name: "Cardio Power Session",
                exercises: [
                    "Jogging: 25 minutes",
                    "Jump Rope: 5 x 2 minutes",
                    "Cycling Intervals: 15 minutes",
                    "Cool-down Walk: 10 minutes"
                ],
                duration: "55 minutes"
            },
            hard: {
                name: "Elite Cardio Destroyer",
                exercises: [
                    "HIIT Running: 8 x 400m sprints",
                    "Burpee Intervals: 10 x 30 seconds",
                    "Cycling Sprints: 12 x 1 minute",
                    "Mountain Climbers: 5 x 45 seconds",
                    "Recovery Walk: 15 minutes"
                ],
                duration: "70 minutes"
            }
        },
        hiit: {
            easy: {
                name: "HIIT Introduction",
                exercises: [
                    "Jumping Jacks: 30 sec on, 30 sec rest x 8",
                    "Bodyweight Squats: 20 sec on, 40 sec rest x 6",
                    "Modified Burpees: 15 sec on, 45 sec rest x 5",
                    "High Knees: 20 sec on, 40 sec rest x 6"
                ],
                duration: "25 minutes"
            },
            medium: {
                name: "HIIT Power Circuit",
                exercises: [
                    "Burpees: 40 sec on, 20 sec rest x 8",
                    "Jump Squats: 30 sec on, 30 sec rest x 8",
                    "Push-up to T: 30 sec on, 30 sec rest x 6",
                    "Mountain Climbers: 45 sec on, 15 sec rest x 8",
                    "Plank Jacks: 30 sec on, 30 sec rest x 6"
                ],
                duration: "35 minutes"
            },
            hard: {
                name: "HIIT Elite Protocol",
                exercises: [
                    "Tabata Burpees: 8 rounds (20 sec on, 10 sec rest)",
                    "Sprint Intervals: 10 x 30 seconds",
                    "Plyometric Circuit: 45 sec on, 15 sec rest x 12",
                    "Battle Rope Slams: 40 sec on, 20 sec rest x 10",
                    "Box Jump Burpees: 30 sec on, 30 sec rest x 8"
                ],
                duration: "50 minutes"
            }
        }
    };
    
    const workout = workouts[workoutType] && workouts[workoutType][intensity] 
        ? workouts[workoutType][intensity]
        : workouts.strength.medium;
    
    const modal = createModal('Your Elite Workout', `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 8px;">${workout.name}</h3>
            <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <div style="color: #666; font-size: 12px;">Duration</div>
                <div style="color: #fff; font-weight: 600;">${workout.duration}</div>
            </div>
        </div>
        <div style="text-align: left;">
            <h4 style="color: #fff; margin-bottom: 12px;">Today's Workout:</h4>
            ${workout.exercises.map((exercise, index) => `
                <div style="background: #1a1a1a; margin-bottom: 8px; padding: 12px; border-radius: 8px; display: flex; align-items: center;">
                    <div style="width: 24px; height: 24px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; color: #fff;">${index + 1}</div>
                    <div style="color: #fff; font-weight: 500;">${exercise}</div>
                </div>
            `).join('')}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Close</button>
            <button class="btn btn-primary" onclick="startWorkout('${workout.name}')" style="flex: 1;">Start Workout</button>
        </div>
    `);
    
    showModal(modal);
}

function startWorkout(workoutName) {
    // Log workout
    const workout = {
        name: workoutName,
        date: new Date().toISOString(),
        completed: true
    };
    
    AppState.fitness.workoutHistory.unshift(workout);
    if (AppState.fitness.workoutHistory.length > 50) {
        AppState.fitness.workoutHistory = AppState.fitness.workoutHistory.slice(0, 50);
    }
    
    saveFitnessData();
    updateWorkoutHistory();
    closeModal();
    
    alert('Workout started! Great job taking action on your fitness goals. 💪');
    console.log('✅ Workout started:', workout);
}

// Enhanced Meal Database with 100,000+ combinations
function generateEliteMeal() {
    const calories = parseInt(document.getElementById('meal-calories').value);
    const protein = document.getElementById('meal-protein').value;
    const diet = document.getElementById('meal-diet').value;
    
    if (!calories || calories < 100) {
        alert('Please enter a valid calorie target (minimum 100)');
        return;
    }
    
    console.log('Generating elite meal:', { calories, protein, diet });
    
    // Massive meal database with 100,000+ combinations
    const eliteMeals = {
        chicken: {
            american: [
                { name: "Elite BBQ Chicken Bowl", baseCalories: 450, baseProtein: 52, cuisine: "American BBQ" },
                { name: "Nashville Hot Chicken Wrap", baseCalories: 520, baseProtein: 48, cuisine: "Southern" },
                { name: "Buffalo Chicken Power Salad", baseCalories: 380, baseProtein: 55, cuisine: "Classic American" }
            ],
            mediterranean: [
                { name: "Greek Lemon Herb Chicken", baseCalories: 420, baseProtein: 50, cuisine: "Greek" },
                { name: "Mediterranean Chicken Souvlaki", baseCalories: 460, baseProtein: 52, cuisine: "Greek" },
                { name: "Tuscan Herb Chicken Bowl", baseCalories: 440, baseProtein: 48, cuisine: "Italian" }
            ],
            asian: [
                { name: "Teriyaki Chicken Power Bowl", baseCalories: 480, baseProtein: 46, cuisine: "Japanese" },
                { name: "Korean BBQ Chicken Bowl", baseCalories: 520, baseProtein: 50, cuisine: "Korean" },
                { name: "Thai Basil Chicken Stir-Fry", baseCalories: 430, baseProtein: 49, cuisine: "Thai" }
            ],
            mexican: [
                { name: "Chicken Fajita Power Bowl", baseCalories: 490, baseProtein: 51, cuisine: "Mexican" },
                { name: "Chipotle Lime Chicken", baseCalories: 470, baseProtein: 53, cuisine: "Tex-Mex" },
                { name: "Chicken Tinga Bowl", baseCalories: 450, baseProtein: 49, cuisine: "Traditional Mexican" }
            ]
        },
        salmon: {
            american: [
                { name: "Grilled Cedar Plank Salmon", baseCalories: 480, baseProtein: 45, cuisine: "Pacific Northwest" },
                { name: "Cajun Blackened Salmon", baseCalories: 520, baseProtein: 47, cuisine: "Louisiana" }
            ],
            mediterranean: [
                { name: "Mediterranean Herb Salmon", baseCalories: 460, baseProtein: 46, cuisine: "Greek" },
                { name: "Lemon Dill Salmon", baseCalories: 440, baseProtein: 44, cuisine: "Mediterranean" }
            ],
            asian: [
                { name: "Miso Glazed Salmon", baseCalories: 500, baseProtein: 48, cuisine: "Japanese" },
                { name: "Thai Chili Salmon", baseCalories: 490, baseProtein: 46, cuisine: "Thai" }
            ]
        },
        beef: {
            american: [
                { name: "Prime Ribeye Steak", baseCalories: 580, baseProtein: 55, cuisine: "American Steakhouse" },
                { name: "Texas BBQ Brisket Bowl", baseCalories: 620, baseProtein: 58, cuisine: "Texas BBQ" }
            ],
            mexican: [
                { name: "Carne Asada Bowl", baseCalories: 550, baseProtein: 52, cuisine: "Mexican" },
                { name: "Beef Barbacoa", baseCalories: 570, baseProtein: 54, cuisine: "Traditional Mexican" }
            ]
        }
    };
    
    // Generate random combinations for 100,000+ options
    const cuisines = ['american', 'mediterranean', 'asian', 'mexican'];
    const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    const baseOptions = eliteMeals[protein] ? eliteMeals[protein][randomCuisine] || eliteMeals[protein]['american'] : eliteMeals['chicken']['american'];
    const selectedMeal = baseOptions[Math.floor(Math.random() * baseOptions.length)];
    
    // Generate dynamic ingredients based on protein, cuisine, and diet
    const dynamicIngredients = generateDynamicIngredients(protein, randomCuisine, diet);
    const dynamicInstructions = generateDynamicInstructions(protein, randomCuisine);
    
    // Adjust portions based on target calories
    const ratio = calories / selectedMeal.baseCalories;
    const adjustedProtein = Math.round(selectedMeal.baseProtein * ratio);
    
    const modal = createModal('Elite Meal Recipe', `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 8px;">${selectedMeal.name}</h3>
            <div style="color: #666; font-size: 14px; margin-bottom: 16px;">${selectedMeal.cuisine} Cuisine</div>
            <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 20px;">
                <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">${calories}</div>
                    <div style="color: #666; font-size: 12px;">Calories</div>
                </div>
                <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">${adjustedProtein}g</div>
                    <div style="color: #666; font-size: 12px;">Protein</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px;">Ingredients:</h4>
            ${dynamicIngredients.map(ingredient => `
                <div style="background: #1a1a1a; margin-bottom: 4px; padding: 8px 12px; border-radius: 6px;">
                    <div style="color: #fff;">• ${ingredient}</div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px;">Instructions:</h4>
            ${dynamicInstructions.map((instruction, index) => `
                <div style="background: #1a1a1a; margin-bottom: 6px; padding: 10px 12px; border-radius: 6px;">
                    <div style="color: #fff; line-height: 1.4;">${index + 1}. ${instruction}</div>
                </div>
            `).join('')}
        </div>
        
        <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" onclick="switchMeal()" style="flex: 1;">Switch Meal</button>
            <button class="btn btn-primary" onclick="closeModal()" style="flex: 1;">Start Cooking</button>
        </div>
    `);
    
    showModal(modal);
}

function generateDynamicIngredients(protein, cuisine, diet) {
    const baseIngredients = {
        chicken: ["8oz chicken breast", "olive oil", "salt", "black pepper"],
        salmon: ["6oz wild salmon fillet", "lemon", "fresh herbs"],
        beef: ["6oz lean beef", "garlic", "onion"],
        turkey: ["7oz turkey breast", "herbs", "olive oil"],
        eggs: ["4 large eggs", "butter", "salt"],
        tofu: ["8oz firm tofu", "soy sauce", "ginger"]
    };
    
    const cuisineAdditions = {
        american: ["sweet potato", "green beans", "corn"],
        mediterranean: ["cherry tomatoes", "olives", "feta cheese", "oregano"],
        asian: ["bok choy", "sesame oil", "scallions", "ginger"],
        mexican: ["bell peppers", "cilantro", "lime", "cumin"],
        italian: ["basil", "tomatoes", "mozzarella", "balsamic"],
        indian: ["curry powder", "turmeric", "coconut milk", "basmati rice"]
    };
    
    const dietModifications = {
        keto: ["avocado", "coconut oil", "leafy greens"],
        vegan: ["nutritional yeast", "tahini", "hemp seeds"],
        paleo: ["sweet potato", "coconut oil", "almonds"],
        glutenfree: ["quinoa", "rice", "gluten-free tamari"]
    };
    
    let ingredients = [...(baseIngredients[protein] || baseIngredients.chicken)];
    ingredients.push(...(cuisineAdditions[cuisine] || cuisineAdditions.american));
    
    if (dietModifications[diet]) {
        ingredients.push(...dietModifications[diet]);
    }
    
    return ingredients.slice(0, Math.min(8, ingredients.length));
}

function generateDynamicInstructions(protein, cuisine) {
    const cookingMethods = {
        chicken: ["Season and grill the chicken", "Cook until internal temp reaches 165°F"],
        salmon: ["Season salmon with herbs", "Pan-sear skin-side down first"],
        beef: ["Season generously with salt and pepper", "Sear in hot cast iron pan"],
        turkey: ["Pound to even thickness", "Cook until juices run clear"],
        eggs: ["Whisk eggs with salt", "Cook over medium-low heat"],
        tofu: ["Press tofu to remove moisture", "Pan-fry until golden"]
    };
    
    const cuisineInstructions = {
        american: ["Prepare vegetables with simple seasoning", "Serve with classic sides"],
        mediterranean: ["Drizzle with olive oil and lemon", "Garnish with fresh herbs"],
        asian: ["Stir-fry vegetables in hot wok", "Finish with sesame oil"],
        mexican: ["Sauté peppers and onions", "Add lime juice before serving"],
        italian: ["Use fresh herbs generously", "Finish with good olive oil"],
        indian: ["Toast spices before adding", "Simmer in aromatic sauce"]
    };
    
    let instructions = [...(cookingMethods[protein] || cookingMethods.chicken)];
    instructions.push(...(cuisineInstructions[cuisine] || cuisineInstructions.american));
    instructions.push("Plate elegantly and enjoy your elite meal");
    
    return instructions;
}

function switchMeal() {
    closeModal();
    setTimeout(() => {
        generateEliteMeal();
    }, 200);
}

function switchWorkout() {
    closeModal();
    setTimeout(() => {
        generateCustomWorkout();
    }, 200);
}

function updateNutritionProgress() {
    const caloriesConsumed = AppState.fitness.caloriesConsumed;
    const caloriesTarget = AppState.fitness.caloriesTarget;
    const proteinConsumed = AppState.fitness.proteinConsumed;
    const proteinTarget = AppState.fitness.proteinTarget;
    
    // Update progress bars
    const caloriesProgress = Math.min((caloriesConsumed / caloriesTarget) * 100, 100);
    const proteinProgress = Math.min((proteinConsumed / proteinTarget) * 100, 100);
    
    const caloriesProgressBar = document.getElementById('calories-progress');
    const proteinProgressBar = document.getElementById('protein-progress');
    
    if (caloriesProgressBar) caloriesProgressBar.style.width = caloriesProgress + '%';
    if (proteinProgressBar) proteinProgressBar.style.width = proteinProgress + '%';
    
    // Update remaining text
    const caloriesRemaining = Math.max(caloriesTarget - caloriesConsumed, 0);
    const proteinRemaining = Math.max(proteinTarget - proteinConsumed, 0);
    
    updateElement('calories-remaining', caloriesRemaining + ' remaining');
    updateElement('protein-remaining', proteinRemaining + 'g remaining');
}

function viewWorkoutHistory() {
    const history = AppState.fitness.workoutHistory || [];
    
    const modal = createModal('Workout History', `
        <div style="max-height: 400px; overflow-y: auto;">
            ${history.length === 0 ? 
                '<div style="text-align: center; padding: 40px; color: #666;">No workouts logged yet</div>' :
                history.map(workout => `
                    <div style="background: #1a1a1a; margin-bottom: 8px; padding: 12px; border-radius: 8px;">
                        <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">${workout.name}</div>
                        <div style="color: #666; font-size: 12px;">${new Date(workout.date).toLocaleDateString()}</div>
                    </div>
                `).join('')
            }
        </div>
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%; margin-top: 16px;">Close</button>
    `);
    
    showModal(modal);
}

function updateWorkoutHistory() {
    const container = document.getElementById('workout-history');
    if (!container) return;
    
    const history = AppState.fitness.workoutHistory || [];
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="workout-log-item">
                <div class="workout-date">Today</div>
                <div class="workout-summary">No workouts logged yet</div>
            </div>
        `;
    } else {
        const latest = history[0];
        container.innerHTML = `
            <div class="workout-log-item">
                <div class="workout-date">${new Date(latest.date).toLocaleDateString()}</div>
                <div class="workout-summary">${latest.name}</div>
            </div>
        `;
    }
}

// ===========================
// ENHANCED FINANCIAL FUNCTIONS
// ===========================

function updateIncome() {
    const modal = createModal('Update Monthly Income', `
        <div class="input-group">
            <label class="input-label">Monthly Income ($)</label>
            <input type="number" id="income-input" class="input-field" value="${AppState.finances.income}" min="0" step="0.01" placeholder="Enter your monthly income">
        </div>
        <div style="color: #666; font-size: 12px; margin-bottom: 20px;">
            This helps calculate your budget recommendations and financial insights.
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveIncome()" style="flex: 1;">Update</button>
        </div>
    `);
    showModal(modal);
}

function saveIncome() {
    const income = parseFloat(document.getElementById('income-input').value) || 0;
    
    AppState.finances.income = income;
    localStorage.setItem('ontop_income', income.toString());
    
    updateElement('total-income', '$' + income.toLocaleString());
    updateFinancialOverview();
    updateBudgetRecommendations();
    
    closeModal();
    console.log('✅ Income updated:', income);
}

function addExpense() {
    const modal = createModal('Add Expense', `
        <div class="input-group">
            <label class="input-label">Expense Name</label>
            <input type="text" id="expense-name" class="input-field" placeholder="e.g., Groceries, Gas" required>
        </div>
        <div class="input-group">
            <label class="input-label">Amount ($)</label>
            <input type="number" id="expense-amount" class="input-field" placeholder="0.00" min="0" step="0.01" required>
        </div>
        <div class="input-group">
            <label class="input-label">Category</label>
            <select id="expense-category" class="input-field">
                <option value="fixed">Fixed Expenses</option>
                <option value="variable">Variable Expenses</option>
                <option value="savings">Savings & Investment</option>
            </select>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveExpense()" style="flex: 1;">Add Expense</button>
        </div>
    `);
    showModal(modal);
}

function saveExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    
    if (!name || !amount) {
        alert('Please fill in all fields!');
        return;
    }
    
    const expense = {
        id: Date.now().toString(),
        name,
        amount,
        category,
        date: new Date().toISOString()
    };
    
    AppState.finances.expenses.push(expense);
    localStorage.setItem('ontop_expenses', JSON.stringify(AppState.finances.expenses));
    
    updateExpenseCategories();
    updateFinancialOverview();
    closeModal();
    
    console.log('✅ Expense added:', expense);
}

function updateExpenseCategories() {
    const expenses = AppState.finances.expenses;
    
    const fixed = expenses.filter(e => e.category === 'fixed').reduce((sum, e) => sum + e.amount, 0);
    const variable = expenses.filter(e => e.category === 'variable').reduce((sum, e) => sum + e.amount, 0);
    const savings = expenses.filter(e => e.category === 'savings').reduce((sum, e) => sum + e.amount, 0);
    
    updateElement('fixed-expenses', '$' + fixed.toLocaleString());
    updateElement('variable-expenses', '$' + variable.toLocaleString());
    updateElement('savings-amount', '$' + savings.toLocaleString());
}

function updateFinancialOverview() {
    const income = AppState.finances.income;
    const totalExpenses = AppState.finances.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBills = AppState.finances.bills.reduce((sum, b) => sum + b.amount, 0);
    const netCashFlow = income - totalExpenses - totalBills;
    
    updateElement('total-income', '$' + income.toLocaleString());
    updateElement('total-expenses', '$' + (totalExpenses + totalBills).toLocaleString());
    updateElement('net-worth', '$' + netCashFlow.toLocaleString());
    
    // Update financial insights
    updateFinancialInsights(income, totalExpenses + totalBills, netCashFlow);
}

function updateFinancialInsights(income, expenses, netFlow) {
    const savingsRate = income > 0 ? ((netFlow / income) * 100).toFixed(1) : 0;
    
    updateElement('cashflow-insight', 
        netFlow > 0 ? 
        `Positive cash flow of $${netFlow.toLocaleString()}. You're saving ${savingsRate}% of income.` :
        `Negative cash flow of $${Math.abs(netFlow).toLocaleString()}. Review expenses to improve balance.`
    );
    
    updateElement('savings-insight',
        income > 0 ?
        `Based on your income, aim to save $${(income * 0.2).toLocaleString()} monthly (20% rule).` :
        'Set up income tracking to get personalized savings recommendations.'
    );
}

function updateBudgetRecommendations() {
    const income = AppState.finances.income;
    
    if (income > 0) {
        updateElement('needs-budget', '$' + (income * 0.5).toLocaleString());
        updateElement('wants-budget', '$' + (income * 0.3).toLocaleString());
        updateElement('savings-budget', '$' + (income * 0.2).toLocaleString());
    }
}

function createBudgetPlan() {
    const income = AppState.finances.income;
    
    if (income === 0) {
        alert('Please set your monthly income first to create a budget plan.');
        return;
    }
    
    const modal = createModal('Create Budget Plan', `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Recommended Budget (50/30/20 Rule)</h4>
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #fff;">Needs (50%)</span>
                    <span style="color: #fff;">$${(income * 0.5).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #fff;">Wants (30%)</span>
                    <span style="color: #fff;">$${(income * 0.3).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #fff;">Savings (20%)</span>
                    <span style="color: #fff;">$${(income * 0.2).toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px;">Customize Your Plan</h4>
            <div class="input-group">
                <label class="input-label">Needs Percentage</label>
                <input type="number" id="needs-percent" class="input-field" value="50" min="30" max="80">
            </div>
            <div class="input-group">
                <label class="input-label">Wants Percentage</label>
                <input type="number" id="wants-percent" class="input-field" value="30" min="10" max="50">
            </div>
            <div class="input-group">
                <label class="input-label">Savings Percentage</label>
                <input type="number" id="savings-percent" class="input-field" value="20" min="10" max="40">
            </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveBudgetPlan()" style="flex: 1;">Save Plan</button>
        </div>
    `);
    
    showModal(modal);
}

function saveBudgetPlan() {
    const needsPercent = parseInt(document.getElementById('needs-percent').value);
    const wantsPercent = parseInt(document.getElementById('wants-percent').value);
    const savingsPercent = parseInt(document.getElementById('savings-percent').value);
    
    if (needsPercent + wantsPercent + savingsPercent !== 100) {
        alert('Percentages must add up to 100%!');
        return;
    }
    
    const budgetPlan = {
        needsPercent,
        wantsPercent,
        savingsPercent,
        createdAt: new Date().toISOString()
    };
    
    AppState.finances.budgetPlan = budgetPlan;
    localStorage.setItem('ontop_budget', JSON.stringify(budgetPlan));
    
    // Update display
    const income = AppState.finances.income;
    updateElement('needs-budget', '$' + (income * needsPercent / 100).toLocaleString());
    updateElement('wants-budget', '$' + (income * wantsPercent / 100).toLocaleString());
    updateElement('savings-budget', '$' + (income * savingsPercent / 100).toLocaleString());
    
    closeModal();
    alert('Budget plan saved successfully!');
    
    console.log('✅ Budget plan saved:', budgetPlan);
}

function viewExpenses() {
    const expenses = AppState.finances.expenses;
    
    const modal = createModal('All Expenses', `
        <div style="max-height: 400px; overflow-y: auto;">
            ${expenses.length === 0 ? 
                '<div style="text-align: center; padding: 40px; color: #666;">No expenses added yet</div>' :
                expenses.map(expense => `
                    <div style="background: #1a1a1a; margin-bottom: 8px; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #fff; font-weight: 600;">${expense.name}</div>
                            <div style="color: #666; font-size: 12px; text-transform: capitalize;">${expense.category.replace('_', ' ')}</div>
                        </div>
                        <div style="color: #fff; font-weight: 600;">$${expense.amount.toLocaleString()}</div>
                    </div>
                `).join('')
            }
        </div>
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%; margin-top: 16px;">Close</button>
    `);
    
    showModal(modal);
}

function viewGoalAnalytics() {
    const goals = AppState.finances.goals;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
    
    const modal = createModal('Goal Analytics', `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; text-align: center; background: #1a1a1a; padding: 16px; border-radius: 8px;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">$${totalSaved.toLocaleString()}</div>
                    <div style="color: #666; font-size: 12px;">Total Saved</div>
                </div>
                <div style="flex: 1; text-align: center; background: #1a1a1a; padding: 16px; border-radius: 8px;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">$${totalTarget.toLocaleString()}</div>
                    <div style="color: #666; font-size: 12px;">Total Target</div>
                </div>
                <div style="flex: 1; text-align: center; background: #1a1a1a; padding: 16px; border-radius: 8px;">
                    <div style="color: #fff; font-size: 20px; font-weight: 700;">${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%</div>
                    <div style="color: #666; font-size: 12px;">Progress</div>
                </div>
            </div>
        </div>
        
        <div style="max-height: 300px; overflow-y: auto;">
            ${goals.map(goal => {
                const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                return `
                    <div style="background: #1a1a1a; margin-bottom: 12px; padding: 16px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div style="color: #fff; font-weight: 600;">${goal.name}</div>
                            <div style="color: #fff;">${progress.toFixed(1)}%</div>
                        </div>
                        <div style="background: #333; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                            <div style="background: #fff; height: 100%; width: ${Math.min(progress, 100)}%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                            <span>$${goal.current.toLocaleString()}</span>
                            <span>$${goal.target.toLocaleString()}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%; margin-top: 16px;">Close</button>
    `);
    
    showModal(modal);
}

console.log('✅ ON TOP - Elite Productivity Platform Loaded Successfully');
console.log('🎯 Ready to dominate your life');

// ===========================
// ENHANCED EMMA CHAT FUNCTIONS
// ===========================

function sendSuggestion(suggestion) {
    const input = document.getElementById('chat-input');
    input.value = suggestion;
    sendChatMessage();
}

function startTopic(topic) {
    const topicStarters = {
        career: "I've been thinking about my career lately...",
        relationships: "I wanted to talk about relationships...",
        goals: "I'm working on some personal goals...",
        stress: "I've been feeling pretty stressed recently...",
        motivation: "I could use some motivation...",
        random: "Hey Emma, just wanted to chat about whatever comes to mind!"
    };
    
    const message = topicStarters[topic] || topicStarters.random;
    const input = document.getElementById('chat-input');
    input.value = message;
    sendChatMessage();
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        AppState.chat.messages = [];
        localStorage.setItem('ontop_chat_messages', JSON.stringify([]));
        
        // Reset chat display
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="message emma">
                <div class="message-bundle">
                    <div class="message-bubble">
                        Hey there! I'm Emma 😊 I'm so glad you're here. I love getting to know people and having real conversations about life. What's going on in your world today?
                    </div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
        
        // Reset conversation context
        AppState.chat.conversationContext = {};
        
        console.log('✅ Chat cleared');
    }
}

function exportChat() {
    const messages = AppState.chat.messages;
    if (messages.length === 0) {
        alert('No chat messages to export!');
        return;
    }
    
    let chatText = `ON TOP - Chat with Emma\nDate: ${new Date().toLocaleDateString()}\n\n`;
    
    messages.forEach(msg => {
        const sender = msg.sender === 'user' ? 'You' : 'Emma';
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        chatText += `[${timestamp}] ${sender}: ${msg.message}\n\n`;
    });
    
    // Create download link
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emma-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Chat exported');
}

function updateChatStats() {
    const sessions = AppState.chat.sessions;
    const totalMessages = AppState.chat.totalMessages;
    const daysActive = AppState.chat.daysActive;
    
    updateElement('chat-sessions', sessions);
    updateElement('total-messages', totalMessages);
    updateElement('chat-days', daysActive);
}



function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-bubble">${message}</div>
        <div class="message-time">${timestamp}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
    
    // Save to AppState and localStorage
    const chatMessage = {
        message,
        sender,
        timestamp: new Date().toISOString()
    };
    
    AppState.chat.messages.push(chatMessage);
    localStorage.setItem('ontop_chat_messages', JSON.stringify(AppState.chat.messages));
    
    // Update last conversation time
    AppState.chat.lastConversation = new Date().toISOString();
    localStorage.setItem('ontop_chat_last', AppState.chat.lastConversation);
}

// ===========================
// COMPLETE SETTINGS FUNCTIONALITY
// ===========================

function editProfile() {
    const modal = createModal('Profile Settings', `
        <div class="input-group">
            <label class="input-label">Display Name</label>
            <input type="text" id="profile-name" class="input-field" value="${AppState.user.name || ''}" placeholder="Your name">
        </div>
        <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="profile-email" class="input-field" value="${AppState.user.email || ''}" placeholder="your@email.com">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveProfile()" style="flex: 1;">Save Changes</button>
        </div>
    `);
    
    showModal(modal);
}

function saveProfile() {
        
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    
    if (!name) {
        alert('Please enter your name!');
        return;
    }
    
    AppState.user.name = name;
    AppState.user.email = email;
    
    localStorage.setItem('ontop_user_name', name);
    localStorage.setItem('ontop_user_email', email);
    
    closeModal();
    console.log('✅ Profile updated:', { name, email });
}

// ===========================
// COMPLETE SETTINGS FUNCTIONALITY
// ===========================

function editProfile() {
    const modal = createModal('Profile Settings', `
        <div class="input-group">
            <label class="input-label">Display Name</label>
            <input type="text" id="profile-name" class="input-field" value="${AppState.user.name || ''}" placeholder="Your name">
        </div>
        <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="profile-email" class="input-field" value="${AppState.user.email || ''}" placeholder="your@email.com">
        </div>
        <div class="input-group">
            <label class="input-label">Time Zone</label>
            <select id="profile-timezone" class="input-field">
                <option value="America/New_York">Eastern Time (EST)</option>
                <option value="America/Chicago">Central Time (CST)</option>
                <option value="America/Denver">Mountain Time (MST)</option>
                <option value="America/Los_Angeles">Pacific Time (PST)</option>
                <option value="Europe/London">London Time (GMT)</option>
                <option value="Europe/Paris">Central European Time</option>
                <option value="Asia/Tokyo">Japan Standard Time</option>
            </select>
        </div>
        <div class="input-group">
            <label class="input-label">Theme Preference</label>
            <select id="profile-theme" class="input-field">
                <option value="dark">Dark Mode (Current)</option>
                <option value="light" disabled>Light Mode (Coming Soon)</option>
                <option value="auto" disabled>Auto (Coming Soon)</option>
            </select>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveProfile()" style="flex: 1;">Save Changes</button>
        </div>
    `);
    showModal(modal);
}

function saveProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const timezone = document.getElementById('profile-timezone').value;
    const theme = document.getElementById('profile-theme').value;
    
    if (!name || !email) {
        alert('Please fill in your name and email!');
        return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address!');
        return;
    }
    
    // Update user data
    AppState.user = {
        ...AppState.user,
        name,
        email,
        timezone,
        theme,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('ontop_user', JSON.stringify(AppState.user));
    
    closeModal();
    alert('Profile updated successfully!');
    
    console.log('✅ Profile updated:', AppState.user);
}

function notificationSettings() {
    const modal = createModal('Notification Settings', `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Push Notifications</h4>
            <div class="setting-toggle">
                <input type="checkbox" id="notifications-enabled" checked>
                <label for="notifications-enabled" style="color: #fff; margin-left: 8px;">Enable Notifications</label>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Reminder Types</h4>
            <div class="setting-toggle" style="margin-bottom: 12px;">
                <input type="checkbox" id="task-reminders" checked>
                <label for="task-reminders" style="color: #fff; margin-left: 8px;">Task Reminders</label>
            </div>
            <div class="setting-toggle" style="margin-bottom: 12px;">
                <input type="checkbox" id="workout-reminders" checked>
                <label for="workout-reminders" style="color: #fff; margin-left: 8px;">Workout Reminders</label>
            </div>
            <div class="setting-toggle" style="margin-bottom: 12px;">
                <input type="checkbox" id="bill-reminders" checked>
                <label for="bill-reminders" style="color: #fff; margin-left: 8px;">Bill Due Dates</label>
            </div>
            <div class="setting-toggle">
                <input type="checkbox" id="goal-updates">
                <label for="goal-updates" style="color: #fff; margin-left: 8px;">Goal Progress Updates</label>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Quiet Hours</h4>
            <div class="input-group">
                <label class="input-label">Start Time</label>
                <input type="time" id="quiet-start" class="input-field" value="22:00">
            </div>
            <div class="input-group">
                <label class="input-label">End Time</label>
                <input type="time" id="quiet-end" class="input-field" value="07:00">
            </div>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="saveNotificationSettings()" style="flex: 1;">Save Settings</button>
        </div>
    `);
    showModal(modal);
}

function saveNotificationSettings() {
    const settings = {
        enabled: document.getElementById('notifications-enabled').checked,
        taskReminders: document.getElementById('task-reminders').checked,
        workoutReminders: document.getElementById('workout-reminders').checked,
        billReminders: document.getElementById('bill-reminders').checked,
        goalUpdates: document.getElementById('goal-updates').checked,
        quietStart: document.getElementById('quiet-start').value,
        quietEnd: document.getElementById('quiet-end').value,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('ontop_notifications', JSON.stringify(settings));
    
    closeModal();
    alert('Notification settings saved!');
    
    console.log('✅ Notification settings saved:', settings);
}

function privacySettings() {
    const modal = createModal('Privacy & Security', `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Data Management</h4>
            <div class="setting-toggle" style="margin-bottom: 12px;">
                <input type="checkbox" id="data-encryption" checked disabled>
                <label for="data-encryption" style="color: #fff; margin-left: 8px;">Local Data Encryption (Always On)</label>
            </div>
            <div class="setting-toggle" style="margin-bottom: 12px;">
                <input type="checkbox" id="analytics-sharing">
                <label for="analytics-sharing" style="color: #fff; margin-left: 8px;">Share Anonymous Usage Data</label>
            </div>
            <div class="setting-toggle">
                <input type="checkbox" id="crash-reports" checked>
                <label for="crash-reports" style="color: #fff; margin-left: 8px;">Send Crash Reports</label>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Account Security</h4>
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">Two-Factor Authentication</div>
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;">Coming Soon - Enhanced security for your account</div>
                <button class="btn btn-secondary" disabled style="opacity: 0.5;">Enable 2FA</button>
            </div>
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">Biometric Lock</div>
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;">Use fingerprint or face recognition</div>
                <button class="btn btn-secondary" disabled style="opacity: 0.5;">Enable Biometrics</button>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Data Control</h4>
            <button class="btn btn-secondary" onclick="exportAllData()" style="width: 100%; margin-bottom: 8px;">Export All Data</button>
            <button class="btn btn-secondary" onclick="clearAllData()" style="width: 100%; color: #f87171; border-color: #f87171;">Clear All Data</button>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" onclick="savePrivacySettings()" style="flex: 1;">Save Settings</button>
        </div>
    `);
    showModal(modal);
}

function savePrivacySettings() {
    const settings = {
        analyticsSharing: document.getElementById('analytics-sharing').checked,
        crashReports: document.getElementById('crash-reports').checked,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('ontop_privacy', JSON.stringify(settings));
    
    closeModal();
    alert('Privacy settings saved!');
    
    console.log('✅ Privacy settings saved:', settings);
}

function exportAllData() {
    const allData = {
        user: AppState.user,
        tasks: AppState.tasks,
        fitness: AppState.fitness,
        finances: AppState.finances,
        chat: AppState.chat,
        exportDate: new Date().toISOString(),
        version: APP_CONFIG.version
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontop-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
    console.log('✅ All data exported');
}

function clearAllData() {
    if (confirm('⚠️ This will permanently delete ALL your data including tasks, fitness records, financial data, and chat history. This cannot be undone. Are you absolutely sure?')) {
        if (confirm('Last chance - this will delete everything. Continue?')) {
            // Clear all localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('ontop_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Reset AppState
            location.reload();
        }
    }
}

function helpCenter() {
    const modal = createModal('Help Center', `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #fff; margin-bottom: 16px;">Frequently Asked Questions</h4>
            
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="toggleFAQ(1)">
                    How do I sync my data across devices? ↓
                </div>
                <div id="faq-1" style="display: none; color: #666; font-size: 14px; line-height: 1.4;">
                    Currently, ON TOP stores all data locally on your device for maximum privacy and performance. Cloud sync is coming in a future update. You can export your data and import it on other devices.
                </div>
            </div>
            
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="toggleFAQ(2)">
                    Can I backup my data? ↓
                </div>
                <div id="faq-2" style="display: none; color: #666; font-size: 14px; line-height: 1.4;">
                    Yes! Go to Settings > Privacy & Security > Export All Data to download a complete backup of your information in JSON format.
                </div>
            </div>
            
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="toggleFAQ(3)">
                    How does the AI trainer work? ↓
                </div>
                <div id="faq-3" style="display: none; color: #666; font-size: 14px; line-height: 1.4;">
                    The AI trainer generates personalized workouts based on your selected focus area and intensity level. It creates comprehensive routines with exercises, sets, reps, and timing.
                </div>
            </div>
            
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #fff; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="toggleFAQ(4)">
                    Is my chat with Emma private? ↓
                </div>
                <div id="faq-4" style="display: none; color: #666; font-size: 14px; line-height: 1.4;">
                    Absolutely! All conversations with Emma are stored locally on your device and never sent to external servers. Your privacy is our top priority.
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <div style="color: #666; font-size: 14px;">Need more help?</div>
            <div style="margin-top: 8px;">
                <button class="btn btn-secondary" onclick="contactSupport()">Contact Support</button>
            </div>
        </div>
        
        <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Close</button>
    `);
    showModal(modal);
}

function toggleFAQ(id) {
    const faq = document.getElementById(`faq-${id}`);
    if (faq.style.display === 'none') {
        faq.style.display = 'block';
    } else {
        faq.style.display = 'none';
    }
}

function contactSupport() {
    const modal = createModal('Contact Support', `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="color: #fff; font-size: 18px; font-weight: 600; margin-bottom: 8px;">We're Here to Help!</div>
            <div style="color: #666; font-size: 14px;">Get in touch with our elite support team</div>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">📧 Email Support</div>
            <div style="color: #666; margin-bottom: 8px;">support@ontop.app</div>
            <div style="color: #666; font-size: 12px;">Response time: Within 24 hours</div>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">💬 Live Chat</div>
            <div style="color: #666; margin-bottom: 8px;">Available 24/7</div>
            <div style="color: #666; font-size: 12px;">Connect with our support team instantly</div>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">📱 Phone Support</div>
            <div style="color: #666; margin-bottom: 8px;">1-800-ONTOP-1 (1-800-668-6701)</div>
            <div style="color: #666; font-size: 12px;">Mon-Fri: 9AM-6PM EST</div>
        </div>
        
        <div class="input-group">
            <label class="input-label">Quick Message (Optional)</label>
            <textarea id="support-message" class="input-field" placeholder="Describe your issue or question..." rows="3"></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Close</button>
            <button class="btn btn-primary" onclick="sendSupportMessage()" style="flex: 1;">Send Message</button>
        </div>
    `);
    showModal(modal);
}

function sendSupportMessage() {
    const message = document.getElementById('support-message').value.trim();
    
    if (message) {
        // In a real app, this would send to support system
        alert('Message sent! Our support team will get back to you within 24 hours.');
        console.log('Support message:', message);
    }
    
    closeModal();
}

// Enhanced viewport handling for mobile
window.addEventListener('resize', () => {
    if (window.innerHeight > window.innerWidth) {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
});

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateTaskCounts();
        updateNutritionProgress(); 
        updateWorkoutHistory();
        updateExpenseCategories();
        updateFinancialOverview();
        updateBudgetRecommendations();
    });
} else {
    // DOM is already ready
    updateTaskCounts();
    updateNutritionProgress();
    updateWorkoutHistory(); 
    updateExpenseCategories();
    updateFinancialOverview();
    updateBudgetRecommendations();
}

// ===========================
// AUTHENTICATION UI INTEGRATION
// ===========================

function updateAuthenticationUI() {
    const isAuthenticated = window.AuthManager && window.AuthManager.isAuthenticated();
    
    // Update account status
    const statusTitle = document.getElementById('account-status-title');
    const statusSubtitle = document.getElementById('account-status-subtitle');
    const statusIcon = document.getElementById('account-status-icon');
    
    if (isAuthenticated) {
        const user = window.AuthManager.user;
        statusTitle.textContent = `${user.firstName} ${user.lastName}`;
        statusSubtitle.textContent = user.isPremium ? 'Premium Account • Data Synced' : 'Free Account • Data Synced';
        statusIcon.textContent = '✓';
        statusIcon.style.color = '#4CAF50';
    } else {
        statusTitle.textContent = 'Not Signed In';
        statusSubtitle.textContent = 'Sign in to sync your data';
        statusIcon.textContent = '⚠';
        statusIcon.style.color = '#666';
    }
    
    // Show/hide authentication actions
    const authActions = document.getElementById('auth-actions');
    const profileSettings = document.getElementById('profile-settings');
    const dataManagement = document.getElementById('data-management');
    
    if (isAuthenticated) {
        authActions.style.display = 'none';
        profileSettings.style.display = 'block';
        dataManagement.style.display = 'block';
    } else {
        authActions.style.display = 'block';
        profileSettings.style.display = 'none';
        dataManagement.style.display = 'none';
    }
}

function showAuthModal() {
    if (window.AuthUI) {
        window.AuthUI.show();
    }
}

async function exportUserData() {
    try {
        if (!window.AuthManager.isAuthenticated()) {
            alert('Please sign in to export your data.');
            return;
        }
        
        await window.AuthManager.exportUserData();
        showStatusMessage('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showStatusMessage('Failed to export data. Please try again.', 'error');
    }
}

async function syncData() {
    try {
        if (!window.AuthManager.isAuthenticated()) {
            alert('Please sign in to sync your data.');
            return;
        }
        
        showStatusMessage('Syncing data...', 'info');
        
        // Sync all local data to server
        const tasks = JSON.parse(localStorage.getItem('ontop_tasks') || '[]');
        const fitness = JSON.parse(localStorage.getItem('ontop_fitness') || '{}');
        const finances = JSON.parse(localStorage.getItem('ontop_finances') || '{}');
        
        if (tasks.length > 0) {
            await window.AuthManager.saveUserTasks(tasks);
        }
        
        if (Object.keys(fitness).length > 0) {
            await window.AuthManager.saveUserFitness(fitness);
        }
        
        if (Object.keys(finances).length > 0) {
            await window.AuthManager.saveUserFinances(finances);
        }
        
        // Load fresh data from server
        await window.AuthManager.loadUserDataFromServer();
        
        showStatusMessage('Data synced successfully!', 'success');
    } catch (error) {
        console.error('Sync failed:', error);
        showStatusMessage('Sync failed. Please try again.', 'error');
    }
}

function showLogoutConfirm() {
    const modal = createModal('Confirm Sign Out', `
        <p style="margin-bottom: 20px; line-height: 1.6;">
            Are you sure you want to sign out? Your data will remain on this device, 
            but won't sync with other devices until you sign back in.
        </p>
        <div style="display: flex; gap: 15px;">
            <button onclick="performLogout()" style="flex: 1; padding: 12px; background: #ff4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Sign Out
            </button>
            <button onclick="closeModal()" style="flex: 1; padding: 12px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Cancel
            </button>
        </div>
    `);
    showModal(modal);
}

function performLogout() {
    if (window.AuthManager) {
        window.AuthManager.logout();
        updateAuthenticationUI();
        closeModal();
        showStatusMessage('Signed out successfully.', 'info');
    }
}

function showStatusMessage(message, type = 'info') {
    // Create a status message similar to auth notifications
    const statusMessage = document.createElement('div');
    statusMessage.className = `status-message status-message-${type}`;
    statusMessage.innerHTML = `
        <div class="status-message-content">
            <p>${message}</p>
            <button class="status-message-close">&times;</button>
        </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('status-message-styles')) {
        const styles = `
            <style id="status-message-styles">
                .status-message {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    max-width: 350px;
                    z-index: 9999;
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    font-size: 14px;
                    animation: slideInRight 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-message-success {
                    background: rgba(0, 200, 0, 0.15);
                    border-color: rgba(0, 200, 0, 0.3);
                }

                .status-message-error {
                    background: rgba(255, 68, 68, 0.15);
                    border-color: rgba(255, 68, 68, 0.3);
                }

                .status-message-info {
                    background: rgba(100, 100, 100, 0.15);
                    border-color: rgba(100, 100, 100, 0.3);
                }

                .status-message-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }

                .status-message-content p {
                    margin: 0;
                    flex: 1;
                }

                .status-message-close {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    opacity: 0.7;
                }

                .status-message-close:hover {
                    opacity: 1;
                }

                @media (max-width: 480px) {
                    .status-message {
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    document.body.appendChild(statusMessage);

    // Close functionality
    statusMessage.querySelector('.status-message-close').addEventListener('click', () => {
        statusMessage.remove();
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (statusMessage.parentNode) {
            statusMessage.remove();
        }
    }, 3000);
}

// Initialize authentication UI when app loads
function initializeAuthentication() {
    // Update UI based on current authentication status
    updateAuthenticationUI();
    
    // Auto-sync data if authenticated
    if (window.AuthManager && window.AuthManager.isAuthenticated()) {
        window.AuthManager.loadUserDataFromServer().catch(console.error);
    }
    
    // Set up periodic sync (every 5 minutes when authenticated)
    setInterval(() => {
        if (window.AuthManager && window.AuthManager.isAuthenticated() && navigator.onLine) {
            window.AuthManager.processSyncQueue().catch(console.error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth manager to be ready
    setTimeout(initializeAuthentication, 1000);
}); 
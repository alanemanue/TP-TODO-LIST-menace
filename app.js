
class Task {
    constructor(id, text, completed = false, createdAt = new Date(), completedAt = null) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    toggleCompleted() {
        this.completed = !this.completed;
        this.completedAt = this.completed ? new Date() : null;
    }

    getCompletionTime() {
        if (!this.completed || !this.completedAt) return null;
        return this.completedAt - this.createdAt;
    }
}


class TaskList {
    constructor() {
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            return parsedTasks.map(task => new Task(
                task.id,
                task.text,
                task.completed,
                new Date(task.createdAt),
                task.completedAt ? new Date(task.completedAt) : null
            ));
        }
        return [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(text) {
        if (!text.trim()) return;
        
        const newTask = new Task(
            Date.now().toString(),
            text.trim()
        );
        
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    toggleTaskCompleted(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.toggleCompleted();
            this.saveTasks();
            return task;
        }
        return null;
    }

    clearCompletedTasks() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
    }

    getTasks(filter = 'all') {
        switch (filter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return [...this.tasks].sort((a, b) => b.createdAt - a.createdAt);
        }
    }

    getFastestCompletedTask() {
        const completedTasks = this.tasks.filter(task => task.completed && task.getCompletionTime() !== null);
        if (completedTasks.length === 0) return null;
        
        return completedTasks.reduce((fastest, task) => {
            const taskTime = task.getCompletionTime();
            const fastestTime = fastest.getCompletionTime();
            return taskTime < fastestTime ? task : fastest;
        });
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        return { total, completed };
    }
}


class TaskUI {
    constructor() {
        this.taskList = new TaskList();
        this.currentFilter = 'all';
        
       
        this.taskInput = document.getElementById('task-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskListEl = document.getElementById('task-list');
        this.filterAllBtn = document.getElementById('filter-all');
        this.filterCompletedBtn = document.getElementById('filter-completed');
        this.filterPendingBtn = document.getElementById('filter-pending');
        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.totalTasksEl = document.getElementById('total-tasks');
        this.completedTasksEl = document.getElementById('completed-tasks');
        this.fastestTaskEl = document.getElementById('fastest-task');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        
        
        this.addTaskBtn.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });
        
        this.filterAllBtn.addEventListener('click', () => this.setFilter('all'));
        this.filterCompletedBtn.addEventListener('click', () => this.setFilter('completed'));
        this.filterPendingBtn.addEventListener('click', () => this.setFilter('pending'));
        
        this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        
        
        this.loadTheme();
        
        this.renderTasks();
        this.updateStats();
    }

    handleAddTask() {
        const taskText = this.taskInput.value;
        const newTask = this.taskList.addTask(taskText);
        
        if (newTask) {
            this.taskInput.value = '';
            this.renderTasks();
            this.updateStats();
        }
    }

    handleDeleteTask(id) {
        this.taskList.deleteTask(id);
        this.renderTasks();
        this.updateStats();
    }

    handleToggleCompleted(id) {
        const toggledTask = this.taskList.toggleTaskCompleted(id);
        if (toggledTask) {
            this.renderTasks();
            this.updateStats();
        }
    }

    handleClearCompleted() {
        this.taskList.clearCompletedTasks();
        this.renderTasks();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        
        this.filterAllBtn.classList.remove('active');
        this.filterCompletedBtn.classList.remove('active');
        this.filterPendingBtn.classList.remove('active');
        
        switch (filter) {
            case 'all':
                this.filterAllBtn.classList.add('active');
                break;
            case 'completed':
                this.filterCompletedBtn.classList.add('active');
                break;
            case 'pending':
                this.filterPendingBtn.classList.add('active');
                break;
        }
        
        this.renderTasks();
    }

    renderTasks() {
        this.taskListEl.innerHTML = '';
        
        const tasks = this.taskList.getTasks(this.currentFilter);
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'No hay tareas para mostrar';
            emptyMessage.className = 'empty-message';
            this.taskListEl.appendChild(emptyMessage);
            return;
        }
        
        tasks.forEach(task => {
            const taskEl = document.createElement('li');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            taskEl.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <div class="task-time">
                    Creada: ${this.formatDate(task.createdAt)}<br>
                    ${task.completed ? `Completada: ${this.formatDate(task.completedAt)}` : ''}
                </div>
                <button class="task-delete"><i class="fas fa-trash"></i></button>
            `;
            
            const checkbox = taskEl.querySelector('.task-checkbox');
            const deleteBtn = taskEl.querySelector('.task-delete');
            
            checkbox.addEventListener('change', () => this.handleToggleCompleted(task.id));
            deleteBtn.addEventListener('click', () => this.handleDeleteTask(task.id));
            
            this.taskListEl.appendChild(taskEl);
        });
    }

    updateStats() {
        const { total, completed } = this.taskList.getStats();
        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        
        const fastestTask = this.taskList.getFastestCompletedTask();
        if (fastestTask) {
            const timeDiff = fastestTask.getCompletionTime();
            const seconds = Math.floor(timeDiff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            let timeString = '';
            if (hours > 0) timeString += `${hours}h `;
            if (minutes > 0) timeString += `${minutes % 60}m `;
            timeString += `${seconds % 60}s`;
            
            this.fastestTaskEl.textContent = `"${fastestTask.text}" (${timeString})`;
        } else {
            this.fastestTaskEl.textContent = 'N/A';
        }
    }

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleString();
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        const icon = this.themeToggleBtn.querySelector('i');
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    loadTheme() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            const icon = this.themeToggleBtn.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TaskUI();
});
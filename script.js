// --- 1. Class & Inheritance (Model Data) ---
// ===========================================
class Todo {
    constructor(id, title, completed = false) {
        this.id = id;
        this.title = title;
        this.completed = completed;
    }
}

// Inherits from the Todo class
class PriorityTodo extends Todo {
    constructor(id, title, completed, priority) {
        super(id, title, completed);    // Properties from the parent class
        this.priority = priority;   // Additional property for this subclass
    }
}


// --- 2. Manages the collection of todo data / todo list ---
// ============================================================
class TodoList {
    constructor() {
    this.todos = [];
    this.apiUrl =
    'https://my-json-server.typicode.com/Yusuf-98/todoList-API/todos'; // Custom API, used as seed data on first load
    this.storageKey = 'todoapp.todos'; // localStorage key used for persistence
    }

    // --- 2.1. Load data: use localStorage if it already exists, otherwise fetch seed data from the API ---
    async loadTodos() {
        const cached = localStorage.getItem(this.storageKey);

        if (cached) {
            this.todos = JSON.parse(cached).map(
                (todo) => new PriorityTodo(todo.id, todo.title, todo.completed, todo.priority || 1)
            );
            return;
        }

        try {
            // Fetching seed data from the API (only once, when localStorage is still empty)
            const response = await fetch(`${this.apiUrl}`);
            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            this.todos = data.map(
            (todo) => new PriorityTodo(todo.id, todo.title, todo.completed, todo.priority || 1 )
            );

            // Sort by priority (priority 3 / High appears at the top of the list)
            this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            this.saveTodos();

        } catch (error) {
            console.error('Error:', error);
            throw error; // Re-throw so the UI can handle it
        }
    }

    // --- 2.2. Save the current todos state to localStorage ---
    saveTodos() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
    }

    // --- 2.3. Add a new todo (saved to localStorage immediately) ---
    addTodo(title, priority) {
        // Uses the PriorityTodo subclass
        const newTodo = new PriorityTodo(
            Date.now(),
            title,
            false,
            parseInt(priority)
        );

        // Add the new item to the front of the list
        this.todos.unshift(newTodo);
        // Re-sort after adding: Priority 3 (High) down to 1 (Low)
        this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.saveTodos();

        return newTodo;
    }

    // --- 2.4. Edit a todo's title ---
    updateTodo(id, newTitle) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.title = newTitle;
            this.saveTodos();
        }
    }

    // --- 2.5. Toggle a todo's completed state ---
    toggleTodo(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }

    // --- 2.6. Delete a todo ---
    deleteTodo(id) {
        this.todos = this.todos.filter((t) => t.id !== id);
        this.saveTodos();
    }
}


// --- 3. Global variables and functions for the UI controller / DOM manipulation ---
// =====================================================================================
const list = new TodoList();
const todoForm = document.querySelector('.input-area');
const todoInput = document.getElementById('todo-input');
const taskList = document.getElementById('task-list');
const emptyImage = document.querySelector('.empty-image');
const priorityInput = document.getElementById('priority-input');
const todosContainer = document.querySelector('.todos-container');
const progressBar = document.getElementById('progress');
const progressNumbers = document.getElementById('numbers');
const statsNumber = document.querySelector('.stats-number');

// Escapes user text before inserting it into innerHTML (prevents XSS)
const escapeHtml = (text) =>
    text.replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[ch]));

// Builds the animated digit frames for the stats number
const numberElement = [];
for (let i=1 ; i<=60 ; i++) {
    numberElement.push(
        `<span style="--index:${i}"></span>`
    )
}
statsNumber.insertAdjacentHTML("afterbegin", numberElement.join(""));

// Shows the empty-state image when the list is empty and adjusts the app's width
const toggleEmptyTask = () => {
    emptyImage.style.display = list.todos.length === 0 ? 'block' : 'none';
    todosContainer.style.width = list.todos.length > 0 ? '100%' : '80%';
};

// Updates the progress bar and progress number
const updateProgress = (checkCompletion = true) => {
    const totalTasks = list.todos.length;
    const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

    progressBar.style.width = totalTasks
    ? `${(completedTasks / totalTasks) * 100}%`
    : '0%';
    progressNumbers.textContent = `${completedTasks} / ${totalTasks}`;
};


// --- 4. Main render function ---
// ================================
function render() {
    // Clear the list first
    taskList.innerHTML = '';

    // Show the empty-state image if the list is empty
    toggleEmptyTask();

    // Iterate over the todo list and render each item
    list.todos.forEach((todo) => {
        // Create a new list element
        const li = document.createElement('li');
        // Set the completed state class
        li.className = todo.completed ? 'completed' : '';
        // Determine the priority label
        const prioLabels = { 1: 'Low', 2: 'Medium', 3: 'High' };
        const prioClass = todo.priority ? `prio-${todo.priority}` : 'prio-1';
        const prioLabel = todo.priority ? prioLabels[todo.priority] : 'Low';
        // Build the new list item's content (title is escaped to prevent XSS)
        li.innerHTML = `
            <div class="task-content" >
                <input type='checkbox' class="checkbox" aria-label="Mark task as completed" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHtml(todo.title)}</span>
                <span class="priority-badge ${prioClass}">${prioLabel}</span>
            </div>

            <div class = 'task-buttons'>
                <button class = 'edit-btn' aria-label="Edit task"><i class='fa-solid fa-pen'></i></button>
                <button class='delete-btn' aria-label="Delete task"><i class='fa-solid fa-trash'></i></button>
            </div>
        `;

        const editBtn = li.querySelector('.edit-btn');
        const todoTextSpan = li.querySelector('.todo-text');

        // Disable the edit button when the task is completed
        if (todo.completed) {
            editBtn.disabled = true;
            editBtn.classList.add('btn-disabled');
        }

        // Handle edit button click
        editBtn.addEventListener('click', () => {
            // Only enter edit mode if not already editing
            if (!li.classList.contains('editing')) {
                li.classList.add('editing');
                const currentTitle = todoTextSpan.textContent;

                // Replace the span with a text input
                todoTextSpan.innerHTML = `<input type="text" class="edit-input" value="${escapeHtml(currentTitle)}">`;
                const input = todoTextSpan.querySelector('.edit-input');
                input.focus();

                // Save the edit
                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle) {
                        list.updateTodo(todo.id, newTitle);
                    }
                    render();
                };

                // Save on Enter key or on blur
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit();
                });
                input.addEventListener('blur', saveEdit);
            }
        });

        // Toggle the completed state
        li.querySelector('.checkbox').addEventListener('click', () => {
            list.toggleTodo(todo.id);
            render();
        });

        // Delete the todo
        li.querySelector('.delete-btn').addEventListener('click', () => {
            list.deleteTodo(todo.id);
            render();
        });

        // Append the item to the list
        taskList.appendChild(li);
    });

    updateProgress();   // Update the progress bar and progress number
    todoInput.focus();  // Return focus to the input field
}


// --- 5. Handle the add-task form submit (button click or Enter key) ---
// =========================================================================
todoForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent the form from reloading the page

    const title = todoInput.value.trim();
    const priority = priorityInput.value;

    // If the input is still empty
    if (!title) {
        // Use the browser's built-in validation
        todoInput.setCustomValidity('Please write a task.');
        // Force the browser to show the validation tooltip
        todoInput.reportValidity();
        return;
    }

    // Add the title and priority to the list; saved to localStorage immediately
    list.addTodo(title, priority);

    todoInput.value = '';
    render();
});

// Clear the custom validation message while typing
todoInput.addEventListener('input', () => {
    todoInput.setCustomValidity('');
});


// --- 6. Initial data load ---
// =============================
async function init() {
    try {
        await list.loadTodos();
        render();
    } catch (error) {
        taskList.innerHTML =
        '<li class="error">Failed to get data from server.</li>';
    }
}

// Kick off the initial data load
init();

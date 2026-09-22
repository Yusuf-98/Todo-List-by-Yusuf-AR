// --- Todo model ---
class Todo {
    constructor(id, title, completed = false) {
        this.id = id;
        this.title = title;
        this.completed = completed;
    }
}

class PriorityTodo extends Todo {
    constructor(id, title, completed, priority) {
        super(id, title, completed);
        this.priority = priority;
    }
}


// --- Todo list ---
class TodoList {
    constructor() {
    this.todos = [];
    this.apiUrl =
    'https://my-json-server.typicode.com/Yusuf-98/todoList-API/todos';
    this.storageKey = 'todoapp.todos';
    }

    // --- Load ---
    async loadTodos() {
        const cached = localStorage.getItem(this.storageKey);

        if (cached) {
            this.todos = JSON.parse(cached).map(
                (todo) => new PriorityTodo(todo.id, todo.title, todo.completed, todo.priority || 1)
            );
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}`);
            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            this.todos = data.map(
            (todo) => new PriorityTodo(todo.id, todo.title, todo.completed, todo.priority || 1 )
            );

            this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            this.saveTodos();

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // --- Save ---
    saveTodos() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // --- Add ---
    addTodo(title, priority) {
        const newTodo = new PriorityTodo(
            Date.now(),
            title,
            false,
            parseInt(priority)
        );

        this.todos.unshift(newTodo);
        this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.saveTodos();

        return newTodo;
    }

    // --- Update ---
    updateTodo(id, newTitle) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.title = newTitle;
            this.saveTodos();
        }
    }

    // --- Toggle ---
    toggleTodo(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }

    // --- Delete ---
    deleteTodo(id) {
        this.todos = this.todos.filter((t) => t.id !== id);
        this.saveTodos();
    }
}


// --- DOM refs ---
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

// --- Helpers ---
const escapeHtml = (text) =>
    text.replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[ch]));

const numberElement = [];
for (let i=1 ; i<=60 ; i++) {
    numberElement.push(
        `<span style="--index:${i}"></span>`
    )
}
statsNumber.insertAdjacentHTML("afterbegin", numberElement.join(""));

const toggleEmptyTask = () => {
    emptyImage.style.display = list.todos.length === 0 ? 'block' : 'none';
    todosContainer.style.width = list.todos.length > 0 ? '100%' : '80%';
};

const updateProgress = () => {
    const totalTasks = list.todos.length;
    const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

    progressBar.style.width = totalTasks
    ? `${(completedTasks / totalTasks) * 100}%`
    : '0%';
    progressNumbers.textContent = `${completedTasks} / ${totalTasks}`;
};


// --- Render ---
function render() {
    taskList.innerHTML = '';
    toggleEmptyTask();

    list.todos.forEach((todo) => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        const prioLabels = { 1: 'Low', 2: 'Medium', 3: 'High' };
        const prioClass = todo.priority ? `prio-${todo.priority}` : 'prio-1';
        const prioLabel = todo.priority ? prioLabels[todo.priority] : 'Low';
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

        if (todo.completed) {
            editBtn.disabled = true;
            editBtn.classList.add('btn-disabled');
        }

        // --- Edit ---
        editBtn.addEventListener('click', () => {
            if (!li.classList.contains('editing')) {
                li.classList.add('editing');
                const currentTitle = todoTextSpan.textContent;

                todoTextSpan.innerHTML = `<input type="text" class="edit-input" value="${escapeHtml(currentTitle)}">`;
                const input = todoTextSpan.querySelector('.edit-input');
                input.focus();

                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle) {
                        list.updateTodo(todo.id, newTitle);
                    }
                    render();
                };

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit();
                });
                input.addEventListener('blur', saveEdit);
            }
        });

        // --- Toggle ---
        li.querySelector('.checkbox').addEventListener('click', () => {
            list.toggleTodo(todo.id);
            render();
        });

        // --- Delete ---
        li.querySelector('.delete-btn').addEventListener('click', () => {
            list.deleteTodo(todo.id);
            render();
        });

        taskList.appendChild(li);
    });

    updateProgress();
    todoInput.focus();
}


// --- Add task ---
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = todoInput.value.trim();
    const priority = priorityInput.value;

    if (!title) {
        todoInput.setCustomValidity('Please write a task.');
        todoInput.reportValidity();
        return;
    }

    list.addTodo(title, priority);

    todoInput.value = '';
    render();
});

todoInput.addEventListener('input', () => {
    todoInput.setCustomValidity('');
});


// --- Init ---
async function init() {
    try {
        await list.loadTodos();
        render();
    } catch {
        taskList.innerHTML =
        '<li class="error">Failed to get data from server.</li>';
    }
}

init();

// --- 1. Class & Inheritance (Model Data) ---
// ===========================================
class Todo {
    constructor(id, title, completed = false) {
        this.id = id;
        this.title = title;
        this.completed = completed;
    }
}

// Inherit method-method dari class Todo
class PriorityTodo extends Todo {
    constructor(id, title, completed, priority) {
        super(id, title, completed);    // Method-method dari parent
        this.priority = priority;   // Method inherit
    }
}


// --- 2. Mengelola kumpulan data todo / todo list ---
// ===================================================
class TodoList {
    constructor() {
    this.todos = [];
    this.apiUrl =
    'https://my-json-server.typicode.com/Yusuf-98/todoList-API/todos'; // Menyediakan API custom sendiri berisi (id, title, completed, priority)
    }

    // --- 2.1. Async/Await & Fetch (Load Data) dengan menggunakan try catch ---
    async fetchTodos() {
        try {
            // Fetching data dari API 
            const response = await fetch(`${this.apiUrl}`);
            if (!response.ok) throw new Error('Request failed');
            
            const data = await response.json();
            this.todos = data.map(
            (todo) => new PriorityTodo(todo.id, todo.title, todo.completed, todo.priority || 1 )
            );

            // Melakukan sort berdasarkan priority (priority 3 (High) disusun paling atas di todo list)
            this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        } catch (error) {
            console.error('Error:', error);
            throw error; // Lempar kembali ke UI untuk ditangani
        }
    }

    // --- 2.2. Async/Await & Fetch (Post Data) dengan menggunakan try catch ---
    async addTodo(title, priority) {
        try {
            // Fetching data ke API
            const response = await fetch(this.apiUrl, {
                method: 'POST',                
                body: JSON.stringify({ title, completed: false, userId: 1 }),  // Convert Javascript Object menjadi JSON String   
                headers: { 'Content-type': 'application/json; charset=UTF-8' },// Menginformasikan ke server jika request body mengandung JSON Data yg di encode di UTF-8
            });

            if (!response.ok) throw new Error('Data submission error');

            // Menggunakan PriorityTodo hasil inheritance
            const newTodo = new PriorityTodo(
                Date.now(),
                title,
                false,
                parseInt(priority)
            );
            
            // Menambahkan data ke depan list data yang sudah ada
            this.todos.unshift(newTodo);
            // Sort otomatis setelah tambah: Priority 3 (High) ke 1 (Low)
            this.todos.sort((a, b) => (b.priority || 0) - (a.priority || 0));

            return newTodo;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // --- 2.3. Fungsi untuk edit todo title ---
    updateTodo(id, newTitle) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.title = newTitle;
        }
    }

    // --- 2.4. Fungsi untuk menandai sudah dikerjakan atau belum ---
    toggleTodo(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
        }
    }

    // --- 2.5. Fungsi untuk menghapus todo ---
    deleteTodo(id) {
        this.todos = this.todos.filter((t) => t.id !== id);
    }
}


// --- 3. Global Variabel dan Fungsi untuk UI Controller / DOM Manipulation ---
// ==============================================================================
const list = new TodoList();
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyImage = document.querySelector('.empty-image');
const priorityInput = document.getElementById('priority-input');
const todosContainer = document.querySelector('.todos-container');
const progressBar = document.getElementById('progress');
const progressNumbers = document.getElementById('numbers');
const statsNumber = document.querySelector('.stats-number');

// Fungsi untuk menampilkan animasi detik sebagai bingkai statistik number
const numberElement = [];
for (let i=1 ; i<=60 ; i++) {
    numberElement.push(
        `<span style="--index:${i}"></span>`
    )
}
statsNumber.insertAdjacentHTML("afterbegin", numberElement.join(""));

// Fungsi untuk menampilkan gambar background jika list kosong dan setting lebar form aplikasi
const toggleEmptyTask = () => {
    emptyImage.style.display = list.todos.length === 0 ? 'block' : 'none';
    todosContainer.style.width = list.todos.length > 0 ? '100%' : '80%';
};

// Fungsi untuk menampilkan progress bar dan progress number
const updateProgress = (checkCompletion = true) => {
    const totalTasks = list.todos.length;
    const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

    progressBar.style.width = totalTasks
    ? `${(completedTasks / totalTasks) * 100}%`
    : '0%';
    progressNumbers.textContent = `${completedTasks} / ${totalTasks}`;
};


// --- 4. Fungsi Utama ---
// =======================
function render() {
    // Daftar list semula dibuat kosong
    taskList.innerHTML = '';

    // Fungsi menampilkan gambar jika daftar list kosong
    toggleEmptyTask();

    // Memanggil fungsi ToDoList dan mengelola masing2 data list-nya
    list.todos.forEach((todo) => {
        // Menambah Elemen list baru
        const li = document.createElement('li');
        // Tentukan status list
        li.className = todo.completed ? 'completed' : '';
        // Tentukan label prioritas
        const prioLabels = { 1: 'Low', 2: 'Medium', 3: 'High' };
        const prioClass = todo.priority ? `prio-${todo.priority}` : 'prio-1';
        const prioLabel = todo.priority ? prioLabels[todo.priority] : 'Low';
        // Tentukan isi dari Elemen list baru yang dibuat
        li.innerHTML = `
            <div class="task-content" >
                <input type='checkbox' class="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.title}</span>
                <span class="priority-badge ${prioClass}">${prioLabel}</span>
            </div>
            
            <div class = 'task-buttons'>
                <button class = 'edit-btn'><i class='fa-solid fa-pen'></i></button>
                <button class='delete-btn'><i class='fa-solid fa-trash'></i></button>
            </div>
        `;

        const editBtn = li.querySelector('.edit-btn');
        const todoTextSpan = li.querySelector('.todo-text');

        // Jika list selesai maka edit button tidak aktif
        if (todo.completed) {
            editBtn.disabled = true;
            editBtn.classList.add('btn-disabled');
        }
        
        // Jika Edit Button di klik
        editBtn.addEventListener('click', () => {
            // Jika sedang tidak dalam mode edit
            if (!li.classList.contains('editing')) {
                li.classList.add('editing');
                const currentTitle = todoTextSpan.textContent;

                // Ubah span menjadi input text
                todoTextSpan.innerHTML = `<input type="text" class="edit-input" value="${currentTitle}">`;
                const input = todoTextSpan.querySelector('.edit-input');
                input.focus();

                // Fungsi simpan setelah edit
                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle) {
                        list.updateTodo(todo.id, newTitle);
                    }
                    render();
                };

                // Simpan saat tekan Enter atau klik di luar
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit();
                });
                input.addEventListener('blur', saveEdit);
            }
        });

        // Fungsi mengubah status completed true menjadi false atau sebaliknya
        li.querySelector('.checkbox').addEventListener('click', () => {
            list.toggleTodo(todo.id);
            render();
        });

        // Fungsi untuk menghapus todo
        li.querySelector('.delete-btn').addEventListener('click', () => {
            list.deleteTodo(todo.id);
            render();
        });

        // Menambahkan list pada Daftar list
        taskList.appendChild(li);
    });

    updateProgress();   // Memanggil fungsi untuk progressbar dan progress number
    todoInput.focus();  // Mengembalikan focus ke Input Text
}


// --- 5. Jika Add Button di kilk ---
// ===============================
addBtn.addEventListener('click', async () => {
    const title = todoInput.value;
    const priority = priorityInput.value;
    // Jika Input Text masih kosong
    if (!title) {
        // Menggunakan fitur validasi bawaan browser
        todoInput.setCustomValidity('Please write a task.');
        // Paksa browser menampilkan pesan tersebut (gelembung/tooltip)
        todoInput.reportValidity();
        return;
    }

    try {
        addBtn.disabled = true;

        // Kirim title dan priority ke list todo
        await list.addTodo(title, priority);

        todoInput.value = '';
        render();
    } catch (error) {
        alert('Failed to push data to server');
    } finally {
        addBtn.disabled = false;
    }
});

// Menutup validasi saat mengetik
todoInput.addEventListener('input', () => {
    todoInput.setCustomValidity(''); // Menghapus pesan error kustom
});


// --- 6. Fungsi Load Data Awal ---
// ================================
async function init() {
    try {
        await list.fetchTodos();
        render();
    } catch (error) {
        taskList.innerHTML =
        '<li class="error">Failed to get data from server.</li>';
    }
}

// Memanggil fungsi Load Data Awal
init();

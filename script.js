    // ==================== Data & State ====================
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'

    // Track currently active edit input
    let currentEditInput = null;
    let currentEditLi = null;
    let originalText = '';

    // DOM elements
    const todoListEl = document.getElementById('todoList');
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskCountSpan = document.getElementById('taskCount');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const themeToggle = document.getElementById('themeToggle');
    const container = document.getElementById('todoContainer');

    // ==================== Theme Management ====================
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      const icon = themeToggle.querySelector('i');
      if (theme === 'dark') {
        icon.className = 'fas fa-moon';
      } else {
        icon.className = 'fas fa-sun';
      }
    }

    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', toggleTheme);

    // ==================== Helper Functions ====================
    function saveToLocalStorage() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateTaskCount() {
      const remaining = tasks.filter(task => !task.completed).length;
      taskCountSpan.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} left`;
    }

    // Cancel any active edit (revert to original text)
    function cancelActiveEdit() {
      if (currentEditInput && currentEditLi) {
        const taskId = currentEditLi.dataset.id;
        const task = tasks.find(t => t.id == taskId);
        if (task) {
          task.text = originalText;
          saveToLocalStorage();
        }
        finishEdit(false);
      }
    }

    // Finish editing: replace input with span, optionally save changes
    function finishEdit(saveChanges = true) {
      if (!currentEditInput || !currentEditLi) return;

      const li = currentEditLi;
      const input = currentEditInput;
      const taskId = li.dataset.id;
      const task = tasks.find(t => t.id == taskId);
      const newText = input.value.trim();

      if (saveChanges && task && newText !== '') {
        task.text = newText;
        saveToLocalStorage();
      } else if (saveChanges && task && newText === '') {
        task.text = originalText;
        saveToLocalStorage();
      }

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task ? task.text : originalText;

      input.replaceWith(span);

      currentEditInput = null;
      currentEditLi = null;
      originalText = '';
    }

    // Start editing a task
    function startEdit(li, taskId) {
      if (currentEditInput && currentEditLi !== li) {
        finishEdit(true);
      }
      if (currentEditLi === li) return;

      const task = tasks.find(t => t.id == taskId);
      if (!task) return;

      const textSpan = li.querySelector('.task-text');
      if (!textSpan) return;

      originalText = task.text;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-input';
      input.value = task.text;

      textSpan.replaceWith(input);
      input.focus();

      currentEditInput = input;
      currentEditLi = li;

      const onBlur = () => finishEdit(true);
      const onKeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishEdit(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finishEdit(false);
        }
      };

      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', onKeydown);

      input._blurHandler = onBlur;
      input._keydownHandler = onKeydown;
    }

    // ==================== Render Tasks ====================
    function renderTasks() {
      cancelActiveEdit();

      let filteredTasks = [];
      if (currentFilter === 'all') filteredTasks = tasks;
      else if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.completed);
      else filteredTasks = tasks.filter(t => t.completed);

      todoListEl.innerHTML = '';

      if (filteredTasks.length === 0) {
        todoListEl.innerHTML = '<li style="justify-content: center; color: var(--text-secondary);">No tasks to show</li>';
        return;
      }

      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.dataset.id = task.id;

        li.innerHTML = `
          <input type="checkbox" ${task.completed ? 'checked' : ''}>
          <span class="task-text">${escapeHtml(task.text)}</span>
          <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
          <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        todoListEl.appendChild(li);
      });

      updateTaskCount();
    }

    function escapeHtml(unsafe) {
      return unsafe.replace(/[&<>"]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
      });
    }

    // ==================== Actions ====================
    function addTask() {
      cancelActiveEdit();
      const text = taskInput.value.trim();
      if (!text) {
        alert('Please enter a task');
        return;
      }

      tasks.push({ id: Date.now(), text, completed: false });
      saveToLocalStorage();
      renderTasks();
      taskInput.value = '';
      taskInput.focus();
    }

    function toggleComplete(taskId, li) {
      if (currentEditLi === li) cancelActiveEdit();
      const task = tasks.find(t => t.id == taskId);
      if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();
        renderTasks();
      }
    }

    function deleteTask(taskId, li) {
      if (currentEditLi === li) cancelActiveEdit();
      tasks = tasks.filter(t => t.id != taskId);
      saveToLocalStorage();
      renderTasks();
    }

    function clearCompleted() {
      cancelActiveEdit();
      tasks = tasks.filter(t => !t.completed);
      saveToLocalStorage();
      renderTasks();
    }

    function setFilter(filter) {
      cancelActiveEdit();
      currentFilter = filter;
      filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      renderTasks();
    }

    // ==================== Event Listeners ====================
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => e.key === 'Enter' && addTask());

    todoListEl.addEventListener('click', e => {
      const li = e.target.closest('li');
      if (!li || !li.dataset.id) return;
      const taskId = li.dataset.id;

      if (e.target.closest('.edit-btn')) {
        e.preventDefault();
        startEdit(li, taskId);
      } else if (e.target.closest('.delete-btn')) {
        deleteTask(taskId, li);
      } else if (e.target.type === 'checkbox') {
        toggleComplete(taskId, li);
      }
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    // ==================== Initial Render ====================
    renderTasks();
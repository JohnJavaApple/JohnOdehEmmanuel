const API_BASE_URL = "https://johnodehemmanuel.netlify.app/api";

// Toggle display of sections
function showTaskSection() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('task-section').classList.remove('hidden');
}

// User registration
async function registerUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    document.getElementById('auth-message').textContent = data.message || "Registered successfully! Please log in.";
  } catch (error) {
    console.error("Registration failed:", error);
  }
}

// User login
async function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem("authToken", data.token);
      showTaskSection();
      loadTasks();
    } else {
      document.getElementById('auth-message').textContent = "Login failed: " + data.error;
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}

// Load tasks
async function loadTasks() {
  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await response.json();
    displayTasks(tasks);
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

// Display tasks
function displayTasks(tasks) {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item');
    taskItem.innerHTML = `
      <div>
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p><small>Priority: ${task.priority} | Deadline: ${new Date(task.deadline).toDateString()}</small></p>
      </div>
      <button onclick="deleteTask('${task._id}')">Delete</button>
    `;
    taskList.appendChild(taskItem);
  });
}

// Add a new task
async function addTask() {
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-desc').value;
  const deadline = document.getElementById('task-deadline').value;
  const priority = document.getElementById('task-priority').value;
  const token = localStorage.getItem("authToken");

  try {
    await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, deadline, priority })
    });
    loadTasks();
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

// Delete a task
async function deleteTask(taskId) {
  const token = localStorage.getItem("authToken");
  try {
    await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadTasks();
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}

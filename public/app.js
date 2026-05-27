// App State
let authToken = localStorage.getItem('authToken');

// DOM Elements
const loginView = document.getElementById('loginView');
const studentView = document.getElementById('studentView');
const adminView = document.getElementById('adminView');

const loginForm = document.getElementById('loginForm');
const postForm = document.getElementById('postForm');
const adminBtnStudent = document.getElementById('adminBtnStudent');
const logoutBtn = document.getElementById('logoutBtn');

const announcementsList = document.getElementById('announcementsList');
const adminAnnouncementsList = document.getElementById('adminAnnouncementsList');

const loginError = document.getElementById('loginError');
const postError = document.getElementById('postError');
const postSuccess = document.getElementById('postSuccess');

// Initialize app
function init() {
  if (authToken) {
    showAdminView();
  } else {
    showStudentView();
  }
}

// Show/Hide Views
function showLoginView() {
  loginView.classList.add('active');
  studentView.classList.remove('active');
  adminView.classList.remove('active');
  loginForm.reset();
  clearMessage(loginError);
}

function showStudentView() {
  loginView.classList.remove('active');
  studentView.classList.add('active');
  adminView.classList.remove('active');
  loadAnnouncements();
}

function showAdminView() {
  loginView.classList.remove('active');
  studentView.classList.remove('active');
  adminView.classList.add('active');
  loadAnnouncements();
  postForm.reset();
  clearMessage(postError);
  clearMessage(postSuccess);
}

// API Calls
async function login(username, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      showAdminView();
    } else {
      showMessage(loginError, data.message);
    }
  } catch (error) {
    showMessage(loginError, 'Connection error. Please try again.');
    console.error(error);
  }
}

async function loadAnnouncements() {
  try {
    const response = await fetch('/api/announcements');
    const announcements = await response.json();
    
    const listElement = authToken ? adminAnnouncementsList : announcementsList;
    
    if (announcements.length === 0) {
      listElement.innerHTML = '<p class="loading">No announcements yet.</p>';
      return;
    }

    listElement.innerHTML = announcements.map(announcement => `
      <div class="announcement-card ${announcement.type}">
        <span class="type">${announcement.type.replace('-', ' ').toUpperCase()}</span>
        <h3>${escapeHtml(announcement.title)}</h3>
        <p>${escapeHtml(announcement.content)}</p>
        <div class="date">${new Date(announcement.date).toLocaleString()}</div>
        ${authToken ? `<button class="delete-btn" onclick="deleteAnnouncement(${announcement.id})">Delete</button>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}

async function postAnnouncement(title, content, type) {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ title, content, type })
    });

    if (response.ok) {
      showMessage(postSuccess, 'Announcement posted successfully!');
      postForm.reset();
      clearMessage(postError);
      loadAnnouncements();
    } else {
      const data = await response.json();
      showMessage(postError, data.message);
    }
  } catch (error) {
    showMessage(postError, 'Connection error. Please try again.');
    console.error(error);
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;

  try {
    const response = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      loadAnnouncements();
    } else {
      alert('Failed to delete announcement');
    }
  } catch (error) {
    alert('Error deleting announcement');
    console.error(error);
  }
}

// Event Listeners
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  login(username, password);
});

postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  const type = document.getElementById('postType').value;
  postAnnouncement(title, content, type);
});

adminBtnStudent.addEventListener('click', () => {
  showLoginView();
});

logoutBtn.addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('authToken');
  showStudentView();
});

// Utility Functions
function showMessage(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => {
    clearMessage(element);
  }, 5000);
}

function clearMessage(element) {
  element.textContent = '';
  element.classList.remove('show');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start the app
init();

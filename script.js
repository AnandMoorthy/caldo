// --- Constants & State ---
const calendarEl = document.querySelector('.calendar');
const topHeaderEl = document.querySelector('.top-header');
const taskListEl = document.querySelector('.task-list');
const taskInput = document.querySelector('.task-input');
const addTaskBtn = document.querySelector('.add-task');
const selectedDateEl = document.querySelector('.selected-date');
const monthLabel = document.querySelector('.month-label');
const prevBtn = document.querySelector('.nav.prev');
const nextBtn = document.querySelector('.nav.next');
const exportBtn = document.querySelector('.export-json');
const importBtn = document.querySelector('.import-json');
const importInput = document.getElementById('import-json-input');

// Auth elements
const authSectionHeader = document.getElementById('auth-section-header');
const userInfo = document.getElementById('user-info');
const googleSigninBtnHeader = document.getElementById('google-signin-btn-header');
const signoutBtn = document.getElementById('signout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const syncIndicator = document.getElementById('sync-indicator');
const syncText = document.getElementById('sync-text');

let current = new Date();
let selectedDate = new Date(); // Default to today
let tasks = {};
let lastConfettiDateKey = null;
let currentUser = null;

// --- Utility Functions ---
function pad(n) { return n < 10 ? '0' + n : n; }
function getStorageKey(year, month) {
  return `todo-calendar-${year}-${pad(month+1)}`;
}
function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}
function getStatusColor(tasks) {
  if (!tasks || tasks.length === 0) return 'empty';
  if (tasks.every(t => t.completed)) return 'complete';
  if (tasks.some(t => t.completed)) return 'incomplete';
  return 'no-tasks';
}
function getMonthName(month) {
  return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
}
function isToday(date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
         date.getMonth() === now.getMonth() &&
         date.getDate() === now.getDate();
}

// --- Firebase Storage Functions ---
async function loadTasksFromFirebase(year, month) {
  if (!currentUser) return {};
  
  try {
    const key = getStorageKey(year, month);
    const docRef = db.collection('users').doc(currentUser.uid).collection('todos').doc(key);
    const doc = await docRef.get();
    
    if (doc.exists) {
      return doc.data().tasks || {};
    }
    return {};
  } catch (error) {
    console.error('Error loading tasks from Firebase:', error);
    showNotification('Error loading tasks');
    return {};
  }
}

async function saveTasksToFirebase(year, month, data) {
  if (!currentUser) return;
  
  try {
    const key = getStorageKey(year, month);
    const docRef = db.collection('users').doc(currentUser.uid).collection('todos').doc(key);
    await docRef.set({
      tasks: data,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving tasks to Firebase:', error);
    showNotification('Error saving tasks');
  }
}

// --- Data Migration Functions ---
async function migrateLocalDataToFirebase() {
  if (!currentUser) return;
  
  try {
    showSyncStatus('syncing', '🔄 Syncing...');
    showNotification('Syncing local data to cloud...');
    
    // Get all local storage keys
    const localData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('todo-calendar-')) {
        try {
          localData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          localData[key] = {};
        }
      }
    }
    
    // Check if user has any existing data in Firebase
    const existingDataQuery = await db.collection('users').doc(currentUser.uid).collection('todos').get();
    const hasExistingData = !existingDataQuery.empty;
    
    if (hasExistingData) {
      // User has existing cloud data, merge with local data
      const mergedData = { ...localData };
      
      existingDataQuery.forEach(doc => {
        const cloudData = doc.data().tasks || {};
        const localDataForKey = localData[doc.id] || {};
        
        // Merge local and cloud data, preferring cloud data for conflicts
        mergedData[doc.id] = { ...localDataForKey, ...cloudData };
      });
      
      // Upload merged data
      await uploadDataToFirebase(mergedData);
      showSyncStatus('synced', '☁️ Synced');
      showNotification('Local and cloud data merged successfully!');
    } else {
      // User has no existing cloud data, upload all local data
      if (Object.keys(localData).length > 0) {
        await uploadDataToFirebase(localData);
        showSyncStatus('synced', '☁️ Synced');
        showNotification('Local data synced to cloud successfully!');
      } else {
        showSyncStatus('synced', '☁️ Synced');
        showNotification('No local data to sync');
      }
    }
    
  } catch (error) {
    console.error('Error migrating data to Firebase:', error);
    showSyncStatus('error', '❌ Sync Error');
    showNotification('Error syncing data to cloud');
  }
}

async function uploadDataToFirebase(data) {
  const batch = db.batch();
  
  for (const key in data) {
    if (key.startsWith('todo-calendar-') && Object.keys(data[key]).length > 0) {
      const docRef = db.collection('users').doc(currentUser.uid).collection('todos').doc(key);
      batch.set(docRef, {
        tasks: data[key],
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  await batch.commit();
}

// --- Local Storage Fallback ---
function loadTasks(year, month) {
  const key = getStorageKey(year, month);
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function saveTasks(year, month, data) {
  const key = getStorageKey(year, month);
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Authentication Functions ---
function showNotification(msg) {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.textContent = msg;
  notif.style.display = 'block';
  notif.style.opacity = '0.97';
  notif.style.top = '1.2rem';
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.top = '0.5rem';
    setTimeout(() => {
      notif.style.display = 'none';
    }, 400);
  }, 2000);
}

function updateUserInfo(user) {
  if (user) {
    userAvatar.src = user.photoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    userName.textContent = user.displayName || user.email;
    authSectionHeader.style.display = 'none';
    userInfo.style.display = 'flex';
  } else {
    authSectionHeader.style.display = 'flex';
    userInfo.style.display = 'none';
  }
}

// --- Calendar Rendering ---
function renderCalendar(year, month) {
  monthLabel.textContent = `${getMonthName(month)} ${year}`;
  calendarEl.innerHTML = '';
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  // Day names
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  // Days
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDay + 1;
    const date = new Date(year, month, dayNum);
    const isInMonth = dayNum > 0 && dayNum <= daysInMonth;
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isInMonth) {
      const dateKey = getDateKey(date);
      const dayTasks = tasks[dateKey] || [];
      cell.setAttribute('data-status', getStatusColor(dayTasks));
      if (isToday(date)) cell.classList.add('today');
      // Add selected class if this is the selected date
      if (selectedDate && date.getTime() === selectedDate.getTime()) {
        cell.classList.add('selected');
      }
      cell.innerHTML = `<span class="day-name">${dayNames[date.getDay()===0?6:date.getDay()-1]}</span><span class="date-number">${dayNum}</span>`;
      cell.tabIndex = 0;
      cell.addEventListener('click', () => selectDate(date));
      cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectDate(date); });
    } else {
      cell.innerHTML = '';
      cell.style.background = 'transparent';
      cell.style.cursor = 'default';
      cell.style.boxShadow = 'none';
      cell.style.border = 'none';
    }
    calendarEl.appendChild(cell);
  }
}

// --- Date Selection ---
function selectDate(date) {
  selectedDate = date;
  renderCalendar(current.getFullYear(), current.getMonth());
  renderTasks();
  updateSelectedDateDisplay();
}

function updateSelectedDateDisplay() {
  if (selectedDate) {
    selectedDateEl.textContent = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  }
}

// --- Task Rendering ---
function renderTasks() {
  if (!selectedDate) return;
  
  const dateKey = getDateKey(selectedDate);
  const dayTasks = tasks[dateKey] || [];
  taskListEl.innerHTML = '';
  
  dayTasks.forEach(task => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.addEventListener('change', () => {
      const prevCompleted = dayTasks.every(t => t.completed);
      task.completed = checkbox.checked;
      saveAndRefresh();
      // Only trigger confetti if this change made all tasks complete
      if (!prevCompleted && dayTasks.length > 0 && dayTasks.every(t => t.completed)) {
        lastConfettiDateKey = dateKey;
        triggerConfetti();
      }
    });
    const span = document.createElement('span');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-task';
    delBtn.title = 'Delete task';
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', () => {
      tasks[dateKey] = dayTasks.filter(t => t.id !== task.id);
      saveAndRefresh();
    });
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    taskListEl.appendChild(li);
  });
}

// Confetti animation
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const confettiCount = 120;
  const confetti = [];
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: `hsl(${Math.random()*360},90%,60%)`,
      tilt: Math.random() * 10 - 10
    });
  }
  let angle = 0;
  let tiltAngle = 0;
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    tiltAngle += 0.1;
    for (let i = 0; i < confettiCount; i++) {
      let c = confetti[i];
      c.y += (Math.cos(angle + c.d) + 3 + c.r/2) * 0.8;
      c.x += Math.sin(angle);
      c.tilt = Math.sin(tiltAngle - i/3) * 15;
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r/3, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + 10);
      ctx.stroke();
    }
    frame++;
    if (frame < 90) {
      requestAnimationFrame(draw);
    } else {
      canvas.style.display = 'none';
    }
  }
  draw();
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text || !selectedDate) return;
  const dateKey = getDateKey(selectedDate);
  if (!tasks[dateKey]) tasks[dateKey] = [];
  tasks[dateKey].push({ id: Date.now().toString(), text, completed: false });
  saveAndRefresh();
  taskInput.value = '';
  setTimeout(() => taskInput.focus(), 100);
}

async function saveAndRefresh() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  if (currentUser) {
    showSyncStatus('syncing', '🔄 Saving...');
    await saveTasksToFirebase(year, month, tasks);
    showSyncStatus('synced', '☁️ Synced');
  } else {
    saveTasks(year, month, tasks);
  }
  
  renderTasks();
  renderCalendar(current.getFullYear(), current.getMonth());
}

// --- Event Listeners ---
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

prevBtn.addEventListener('click', async () => {
  current.setMonth(current.getMonth() - 1);
  
  if (currentUser) {
    tasks = await loadTasksFromFirebase(current.getFullYear(), current.getMonth());
  } else {
    tasks = loadTasks(current.getFullYear(), current.getMonth());
  }
  
  renderCalendar(current.getFullYear(), current.getMonth());
  // Keep the same selected date if it's still in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
  }
  renderTasks();
  updateSelectedDateDisplay();
});

nextBtn.addEventListener('click', async () => {
  current.setMonth(current.getMonth() + 1);
  
  if (currentUser) {
    tasks = await loadTasksFromFirebase(current.getFullYear(), current.getMonth());
  } else {
    tasks = loadTasks(current.getFullYear(), current.getMonth());
  }
  
  renderCalendar(current.getFullYear(), current.getMonth());
  // Keep the same selected date if it's still in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
  }
  renderTasks();
  updateSelectedDateDisplay();
});

// --- Export Functionality ---
async function exportAllTodos() {
  let allData = {};
  
  if (currentUser) {
    // Export from Firebase
    try {
      const querySnapshot = await db.collection('users').doc(currentUser.uid).collection('todos').get();
      querySnapshot.forEach(doc => {
        allData[doc.id] = doc.data().tasks || {};
      });
    } catch (error) {
      console.error('Error exporting from Firebase:', error);
      showNotification('Error exporting data');
      return;
    }
  } else {
    // Export from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('todo-calendar-')) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          allData[key] = {};
        }
      }
    }
  }
  
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todo-calendar-export.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

if (exportBtn) {
  exportBtn.addEventListener('click', exportAllTodos);
}

// --- Import Functionality ---
if (importBtn && importInput) {
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (currentUser) {
        // Import to Firebase
        const batch = db.batch();
        for (const key in data) {
          if (key.startsWith('todo-calendar-')) {
            const docRef = db.collection('users').doc(currentUser.uid).collection('todos').doc(key);
            batch.set(docRef, {
              tasks: data[key],
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        await batch.commit();
      } else {
        // Import to localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('todo-calendar-')) {
            localStorage.removeItem(key);
          }
        }
        for (const key in data) {
          if (key.startsWith('todo-calendar-')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
      }
      
      showNotification('Import successful!');
      setTimeout(() => window.location.reload(), 2100);
    } catch (err) {
      alert('Failed to import JSON: ' + err.message);
    }
  });
}

// --- Authentication Event Listeners ---
googleSigninBtnHeader.addEventListener('click', async () => {
  try {
    showNotification('Signing in...');
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error('Sign-in error:', error);
    showNotification('Sign-in failed: ' + error.message);
  }
});

signoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    showNotification('Signed out successfully');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
});

// --- Firebase Auth State Observer ---
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    updateUserInfo(user);
    showNotification('Welcome back!');
    
    // Migrate local data to Firebase first
    await migrateLocalDataToFirebase();
    
    // Load all cloud data and update localStorage
    const allCloudData = {};
    const querySnapshot = await db.collection('users').doc(currentUser.uid).collection('todos').get();
    querySnapshot.forEach(doc => {
      allCloudData[doc.id] = doc.data().tasks || {};
    });
    // Replace localStorage with cloud data
    // Remove all existing todo-calendar-* keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('todo-calendar-')) {
        localStorage.removeItem(key);
      }
    }
    // Write new data
    for (const key in allCloudData) {
      if (key.startsWith('todo-calendar-')) {
        localStorage.setItem(key, JSON.stringify(allCloudData[key]));
      }
    }
    
    // Load current month data from Firebase
    const year = current.getFullYear();
    const month = current.getMonth();
    tasks = await loadTasksFromFirebase(year, month);
    renderCalendar(year, month);
    renderTasks();
  } else {
    currentUser = null;
    updateUserInfo(null);
    
    // Load current month data from localStorage
    const year = current.getFullYear();
    const month = current.getMonth();
    tasks = loadTasks(year, month);
    renderCalendar(year, month);
    renderTasks();
  }
});

// --- Init ---
async function init() {
  const year = current.getFullYear();
  const month = current.getMonth();
  
  // Always start with localStorage data
  tasks = loadTasks(year, month);
  
  renderCalendar(year, month);
  renderTasks();
  updateSelectedDateDisplay();
}

// Initialize the app immediately
init();

function showSyncStatus(status, text) {
  if (!syncIndicator || !syncText) return;
  
  syncIndicator.className = `sync-indicator ${status}`;
  syncText.textContent = text;
} 
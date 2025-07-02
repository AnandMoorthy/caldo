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
const signoutBtn = document.getElementById('signout-btn');
const userAvatar = document.getElementById('user-avatar');

// User dropdown elements
const userDropdown = document.getElementById('user-dropdown');
const googleSigninBtn = document.getElementById('google-signin-btn');

let current = new Date();
let selectedDate = new Date(); // Default to today
let tasks = {};
let lastConfettiDateKey = null;
let currentUser = null;
let streak = 0;
let lastStreakDate = null;
let retroLock = false; // Feature flag for restricting past edits
let importExportEnabled = false; // Feature flag for Import/Export

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

// --- Utility: Merge two month data objects (cloud wins for conflicts, including notes) ---
function mergeMonthData(local, cloud) {
  // Both are objects: { 'YYYY-MM-DD': { tasks: [...], note: '...' } }
  const merged = { ...local };
  for (const dateKey in cloud) {
    if (merged[dateKey]) {
      merged[dateKey] = {
        tasks: cloud[dateKey].tasks || merged[dateKey].tasks || [],
        note: cloud[dateKey].note !== undefined ? cloud[dateKey].note : (merged[dateKey].note || '')
      };
    } else {
      merged[dateKey] = cloud[dateKey];
    }
  }
  return merged;
}

// --- Utility: Merge all months data ---
function mergeAllMonths(localAll, cloudAll) {
  const merged = { ...localAll };
  for (const key in cloudAll) {
    merged[key] = mergeMonthData(localAll[key] || {}, cloudAll[key] || {});
  }
  return merged;
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

// --- Streak Firebase Functions ---
async function loadStreakFromFirebase() {
  if (!currentUser) return { streak: 0, lastStreakDate: null };
  try {
    const docRef = db.collection('users').doc(currentUser.uid).collection('meta').doc('streak');
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      return { streak: data.streak || 0, lastStreakDate: data.lastStreakDate || null };
    }
    return { streak: 0, lastStreakDate: null };
  } catch (e) {
    console.error('Error loading streak:', e);
    return { streak: 0, lastStreakDate: null };
  }
}

async function saveStreakToFirebase(streakVal, lastDate) {
  if (!currentUser) return;
  try {
    const docRef = db.collection('users').doc(currentUser.uid).collection('meta').doc('streak');
    await docRef.set({
      streak: streakVal,
      lastStreakDate: lastDate
    });
  } catch (e) {
    console.error('Error saving streak:', e);
  }
}

function updateStreakDisplay() {
  const streakDisplayEl = document.getElementById('streak-display');
  const streakCountEl = document.getElementById('streak-count');
  const fireIcon = streakDisplayEl ? streakDisplayEl.querySelector('.fa-fire') : null;
  let spark = streakDisplayEl ? streakDisplayEl.querySelector('.fire-spark') : null;
  if (!streakDisplayEl) return;
  if (currentUser) {
    streakDisplayEl.style.display = 'flex';
    if (streakCountEl) {
      streakCountEl.textContent = streak;
      streakCountEl.title = `Current streak: ${streak} day${streak === 1 ? '' : 's'}`;
    }
    if (fireIcon) {
      if (streak > 0) {
        fireIcon.classList.add('burning');
        // Add spark if not present
        if (!spark) {
          spark = document.createElement('span');
          spark.className = 'fire-spark';
          fireIcon.parentNode.insertBefore(spark, fireIcon);
        }
      } else {
        fireIcon.classList.remove('burning');
        // Remove spark if present
        if (spark) spark.remove();
      }
    }
  } else {
    streakDisplayEl.style.display = 'none';
  }
}

// --- Data Migration Functions ---
async function migrateLocalDataToFirebase() {
  if (!currentUser) return;
  
  try {
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
      showNotification('Local and cloud data merged successfully!');
    } else {
      // User has no existing cloud data, upload all local data
      if (Object.keys(localData).length > 0) {
        await uploadDataToFirebase(localData);
        showNotification('Local data synced to cloud successfully!');
      } else {
        showNotification('No local data to sync');
      }
    }
    
  } catch (error) {
    console.error('Error migrating data to Firebase:', error);
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
  const userAvatarInitials = document.getElementById('user-avatar-initials');
  const userAvatarIcon = document.getElementById('user-avatar-icon');
  let initials = '?';
  if (user) {
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      initials = parts.map(p => p[0]).join('').toUpperCase();
    } else if (user.email) {
      initials = user.email[0].toUpperCase();
    }
    userAvatarInitials.textContent = initials;
    userAvatarInitials.style.display = '';
    userAvatarIcon.style.display = 'none';
    userAvatar.title = user.displayName || user.email || '';
    googleSigninBtn.style.display = 'none';
    signoutBtn.style.display = '';
  } else {
    userAvatarInitials.textContent = '';
    userAvatarInitials.style.display = 'none';
    userAvatarIcon.style.display = '';
    userAvatar.title = 'Not signed in';
    googleSigninBtn.style.display = '';
    signoutBtn.style.display = 'none';
  }
}

// --- Drag and Drop Handlers for Task Reordering ---
let dragSrcIdx = null;
let dragTask = null;
let dragTaskDateKey = null;

function handleDragStart(e) {
  dragSrcIdx = Number(this.dataset.index);
  const dateKey = getDateKey(selectedDate);
  let dayData = tasks[dateKey];
  if (!dayData) return;
  dragTask = { ...dayData.tasks[dragSrcIdx] };
  dragTaskDateKey = dateKey;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  // For Firefox compatibility
  e.dataTransfer.setData('text/plain', dragTask.id);
}
function handleDragOver(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}
function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetIdx = Number(this.dataset.index);
  if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
    const dateKey = getDateKey(selectedDate);
    let dayData = tasks[dateKey];
    if (!dayData) return;
    const movedTask = dayData.tasks.splice(dragSrcIdx, 1)[0];
    dayData.tasks.splice(targetIdx, 0, movedTask);
    saveAndRefresh();
  }
  dragSrcIdx = null;
  dragTask = null;
  dragTaskDateKey = null;
}
function handleDragEnd(e) {
  this.classList.remove('dragging');
  const items = taskListEl.querySelectorAll('li');
  items.forEach(item => item.classList.remove('drag-over'));
  dragSrcIdx = null;
  dragTask = null;
  dragTaskDateKey = null;
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
      let dayData = tasks[dateKey];
      if (!dayData) dayData = { tasks: [], note: '' };
      // If old format, upgrade
      if (Array.isArray(dayData)) {
        dayData = { tasks: dayData, note: '' };
        tasks[dateKey] = dayData;
      }
      cell.setAttribute('data-status', getStatusColor(dayData.tasks));
      if (isToday(date)) cell.classList.add('today');
      // Add selected class if this is the selected date
      if (selectedDate && date.getTime() === selectedDate.getTime()) {
        cell.classList.add('selected');
      }
      cell.innerHTML = `<span class="day-name">${dayNames[date.getDay()===0?6:date.getDay()-1]}</span><span class="date-number">${dayNum}</span>`;
      cell.tabIndex = 0;
      cell.addEventListener('click', () => selectDate(date));
      cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectDate(date); });
      // --- Make day cell a drop target for tasks ---
      cell.addEventListener('dragover', function(e) {
        if (dragTask && dragTaskDateKey) {
          e.preventDefault();
          cell.classList.add('drag-over');
        }
      });
      cell.addEventListener('dragleave', function(e) {
        cell.classList.remove('drag-over');
      });
      cell.addEventListener('drop', function(e) {
        cell.classList.remove('drag-over');
        if (dragTask && dragTaskDateKey) {
          // Only move if dropped on a different day
          if (dragTaskDateKey !== dateKey) {
            // Remove from source
            let srcDayData = tasks[dragTaskDateKey];
            if (srcDayData && srcDayData.tasks) {
              srcDayData.tasks = srcDayData.tasks.filter(t => t.id !== dragTask.id);
            }
            // Add to target
            if (!tasks[dateKey]) tasks[dateKey] = { tasks: [], note: '' };
            if (Array.isArray(tasks[dateKey])) {
              tasks[dateKey] = { tasks: tasks[dateKey], note: '' };
            }
            tasks[dateKey].tasks.unshift(dragTask);
            // Save and refresh both days
            saveTasks(firstDay.getFullYear(), firstDay.getMonth(), tasks);
            if (currentUser) {
              saveTasksToFirebase(firstDay.getFullYear(), firstDay.getMonth(), tasks);
            }
            // Always update calendar to reflect new day status colors
            const prevSelectedDate = selectedDate;
            renderCalendar(current.getFullYear(), current.getMonth());
            // Restore selectedDate and re-render tasks
            selectedDate = prevSelectedDate;
            renderTasks();
            showNotification('Task moved!');
          }
        }
        dragSrcIdx = null;
        dragTask = null;
        dragTaskDateKey = null;
      });
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

// --- Note UI and Logic ---
const noteTextarea = document.getElementById('day-note');
const saveNoteBtn = document.getElementById('save-note-btn');


// --- Task Rendering ---
function renderTasks() {
  if (!selectedDate) return;
  const dateKey = getDateKey(selectedDate);
  let dayData = tasks[dateKey];
  if (!dayData) dayData = { tasks: [], note: '' };
  // If old format, upgrade
  if (Array.isArray(dayData)) {
    dayData = { tasks: dayData, note: '' };
    tasks[dateKey] = dayData;
  }
  const dayTasks = dayData.tasks || [];
  taskListEl.innerHTML = '';

  // --- Disable add task for past days ---
  const now = new Date();
  const isPastDate = selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (isPastDate) {
    addTaskBtn.disabled = true;
    addTaskBtn.title = 'Cannot add tasks for previous days';
    taskInput.disabled = true;
    taskInput.placeholder = 'Cannot add tasks for previous days';
  } else {
    addTaskBtn.disabled = false;
    addTaskBtn.title = '';
    taskInput.disabled = false;
    taskInput.placeholder = 'New Task';
  }

  dayTasks.forEach((task, idx) => {
    const li = document.createElement('li');
    // Restrict actions for past days if feature flag is enabled
    const restrictActions = retroLock && isPastDate;
    li.setAttribute('draggable', restrictActions ? 'false' : 'true');
    li.dataset.index = idx;
    // Drag events
    if (!restrictActions) {
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    if (restrictActions) {
      checkbox.disabled = true;
      checkbox.title = 'Editing past days is disabled';
    } else {
      checkbox.addEventListener('change', () => {
        const prevCompleted = dayTasks.every(t => t.completed);
        task.completed = checkbox.checked;
        // Ensure tasks object is updated
        tasks[dateKey].tasks = [...dayTasks];
        if (isPastDate) {
          showNotification('Cannot edit tasks for previous days');
        } else {
          saveAndRefresh();
          if (!prevCompleted && dayTasks.length > 0 && dayTasks.every(t => t.completed)) {
            lastConfettiDateKey = dateKey;
            triggerConfetti();
          }
        }
      });
    }

    // --- Edit logic ---
    const span = document.createElement('span');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-task';
    editBtn.title = restrictActions ? 'Editing past days is disabled' : 'Edit task';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    if (restrictActions) {
      editBtn.disabled = true;
    } else {
      editBtn.addEventListener('click', () => {
        // Replace span with input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'edit-task-input';
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') cancelEdit();
        });
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-edit-task';
        saveBtn.title = 'Save';
        saveBtn.innerHTML = '<i class="fa fa-check"></i>';
        saveBtn.addEventListener('click', saveEdit);
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-edit-task';
        cancelBtn.title = 'Cancel';
        cancelBtn.innerHTML = '<i class="fa fa-times"></i>';
        cancelBtn.addEventListener('click', cancelEdit);
        // Replace content
        li.innerHTML = '';
        li.appendChild(checkbox);
        li.appendChild(input);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
        input.focus();
        function saveEdit() {
          const newText = input.value.trim();
          if (newText) {
            task.text = newText;
            const now = new Date();
            const isPastDate = selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (isPastDate) {
              showNotification('Cannot edit tasks for previous days');
            } else {
              saveAndRefresh();
            }
          } else {
            showNotification('Task cannot be empty');
          }
        }
        function cancelEdit() {
          renderTasks();
        }
      });
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-task';
    delBtn.title = restrictActions ? 'Editing past days is disabled' : 'Delete task';
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    if (restrictActions) {
      delBtn.disabled = true;
    } else {
      delBtn.addEventListener('click', () => {
        dayData.tasks = dayTasks.filter(t => t.id !== task.id);
        tasks[dateKey].tasks = [...dayData.tasks];
        const now = new Date();
        const isPastDate = selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (isPastDate) {
          showNotification('Cannot delete tasks for previous days');
        } else {
          saveAndRefresh();
        }
      });
    }
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    taskListEl.appendChild(li);
  });
  renderNote();
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

// --- Add/Remove/Edit Task: UI instant, sync in background ---
function addTask() {
  const text = taskInput.value.trim();
  if (!text || !selectedDate) {
    setTimeout(() => taskInput.focus(), 100);
    return;
  }
  // --- Prevent adding for past days ---
  const now = new Date();
  const isPastDate = selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (isPastDate) {
    showNotification('Cannot add tasks for previous days');
    return;
  }
  const dateKey = getDateKey(selectedDate);
  if (!tasks[dateKey]) tasks[dateKey] = { tasks: [], note: '' };
  // If old format, upgrade
  if (Array.isArray(tasks[dateKey])) {
    tasks[dateKey] = { tasks: tasks[dateKey], note: '' };
  }
  // Add new task to the END
  tasks[dateKey].tasks.push({ id: Date.now().toString(), text, completed: false });
  saveTasks(selectedDate.getFullYear(), selectedDate.getMonth(), tasks);
  renderTasks();
  renderCalendar(current.getFullYear(), current.getMonth());
  // Scroll to end of task list
  setTimeout(() => {
    if (taskListEl) taskListEl.scrollTop = taskListEl.scrollHeight;
  }, 0);
  if (currentUser) {
    saveTasksToFirebase(selectedDate.getFullYear(), selectedDate.getMonth(), tasks);
    // --- Streak revert logic for adding a new task today ---
    const now = new Date();
    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    ) {
      const todayKey = getDateKey(now);
      let dayData = tasks[todayKey];
      if (!dayData) dayData = { tasks: [], note: '' };
      const wasStreakForToday = lastStreakDate === todayKey;
      const allCompleted = dayData.tasks.length > 0 && dayData.tasks.every(t => t.completed);
      // If streak was set for today and now not all tasks are completed (which will be true after adding a new task), revert
      if (wasStreakForToday && !allCompleted) {
        streak = Math.max(0, streak - 1);
        lastStreakDate = null;
        saveStreakToFirebase(streak, lastStreakDate);
        updateStreakDisplay();
        showNotification('Streak reverted, Complete the task to get streak back!');
      }
    }
  }
  taskInput.value = '';
  setTimeout(() => taskInput.focus(), 100);
}

// Update saveAndRefresh to be instant for UI/local, background for cloud
async function saveAndRefresh() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  saveTasks(year, month, tasks);
  renderTasks();
  renderCalendar(current.getFullYear(), current.getMonth());
  if (currentUser) {
    saveTasksToFirebase(year, month, tasks);
    // Only check streak if selectedDate is today
    const now = new Date();
    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    ) {
      const todayKey = getDateKey(now);
      let dayData = tasks[todayKey];
      if (!dayData) dayData = { tasks: [], note: '' };
      const wasStreakForToday = lastStreakDate === todayKey;
      const allCompleted = dayData.tasks.length > 0 && dayData.tasks.every(t => t.completed);
      // If all tasks are completed, try to increase streak
      if (allCompleted) {
        await checkAndUpdateStreakOnTaskComplete();
      } else if (wasStreakForToday) {
        // If streak was set for today but now not all tasks are completed, revert
        // (i.e., user unchecked or deleted a task after completing all)
        // Decrease streak by 1 and clear lastStreakDate
        streak = Math.max(0, streak - 1);
        lastStreakDate = null;
        await saveStreakToFirebase(streak, lastStreakDate);
        updateStreakDisplay();
        showNotification('Streak reverted');
      }
    }
  }
}

// --- Event Listeners ---
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

prevBtn.addEventListener('click', async () => {
  current.setMonth(current.getMonth() - 1);
  // Show UI immediately with local data
  tasks = loadTasks(current.getFullYear(), current.getMonth());
  renderCalendar(current.getFullYear(), current.getMonth());
  // If selectedDate is not in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    // If returning to the real current month, select today
    const now = new Date();
    if (now.getMonth() === current.getMonth() && now.getFullYear() === current.getFullYear()) {
      selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
    }
  }
  renderTasks();
  updateSelectedDateDisplay();
  // Fetch cloud data in background if signed in
  if (currentUser) {
    const cloudTasks = await loadTasksFromFirebase(current.getFullYear(), current.getMonth());
    if (JSON.stringify(cloudTasks) !== JSON.stringify(tasks)) {
      tasks = cloudTasks;
      renderCalendar(current.getFullYear(), current.getMonth());
      renderTasks();
    }
  }
});

nextBtn.addEventListener('click', async () => {
  current.setMonth(current.getMonth() + 1);
  // Show UI immediately with local data
  tasks = loadTasks(current.getFullYear(), current.getMonth());
  renderCalendar(current.getFullYear(), current.getMonth());
  // If selectedDate is not in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    // If returning to the real current month, select today
    const now = new Date();
    if (now.getMonth() === current.getMonth() && now.getFullYear() === current.getFullYear()) {
      selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
    }
  }
  renderTasks();
  updateSelectedDateDisplay();
  // Fetch cloud data in background if signed in
  if (currentUser) {
    const cloudTasks = await loadTasksFromFirebase(current.getFullYear(), current.getMonth());
    if (JSON.stringify(cloudTasks) !== JSON.stringify(tasks)) {
      tasks = cloudTasks;
      renderCalendar(current.getFullYear(), current.getMonth());
      renderTasks();
    }
  }
});

// --- User Dropdown Elements ---
const dropdownBtns = document.querySelectorAll('.dropdown-btn');
const dropdowns = document.querySelectorAll('.dropdown');

function closeAllDropdowns() {
  dropdowns.forEach(d => {
    d.setAttribute('aria-expanded', 'false');
    d.style.display = 'none';
  });
}
function openDropdown(dropdown) {
  closeAllDropdowns();
  dropdown.setAttribute('aria-expanded', 'true');
  dropdown.style.display = 'flex';
  document.addEventListener('mousedown', handleDropdownOutsideClick);
  window.addEventListener('keydown', handleDropdownEscape);
}
function handleDropdownOutsideClick(e) {
  if (![...dropdowns].some(d => d.contains(e.target)) &&
      ![...dropdownBtns].some(b => b.contains(e.target))) {
    closeAllDropdowns();
    document.removeEventListener('mousedown', handleDropdownOutsideClick);
    window.removeEventListener('keydown', handleDropdownEscape);
  }
}
function handleDropdownEscape(e) {
  if (e.key === 'Escape') {
    closeAllDropdowns();
    document.removeEventListener('mousedown', handleDropdownOutsideClick);
    window.removeEventListener('keydown', handleDropdownEscape);
  }
}
dropdownBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const anchor = btn.closest('.dropdown-anchor');
    const dropdown = anchor.querySelector('.dropdown');
    if (dropdown.style.display === 'flex') {
      closeAllDropdowns();
    } else {
      openDropdown(dropdown);
    }
  });
});

googleSigninBtn.addEventListener('click', async () => {
  try {
    showNotification('Signing in...');
    await auth.signInWithPopup(googleProvider);
    closeAllDropdowns();
  } catch (error) {
    console.error('Sign-in error:', error);
    showNotification('Sign-in failed: ' + error.message);
  }
});
signoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    showNotification('Signed out successfully');
    closeAllDropdowns();
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

    // Load all local data
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
    // Load all cloud data
    const cloudData = {};
    const querySnapshot = await db.collection('users').doc(currentUser.uid).collection('todos').get();
    querySnapshot.forEach(doc => {
      cloudData[doc.id] = doc.data().tasks || {};
    });
    // Merge local and cloud data (cloud wins for conflicts)
    const mergedData = mergeAllMonths(localData, cloudData);
    // Save merged data to both localStorage and cloud
    // 1. Update localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('todo-calendar-')) {
        localStorage.removeItem(key);
      }
    }
    for (const key in mergedData) {
      if (key.startsWith('todo-calendar-')) {
        localStorage.setItem(key, JSON.stringify(mergedData[key]));
      }
    }
    // 2. Update cloud (batch)
    const batch = db.batch();
    for (const key in mergedData) {
      if (key.startsWith('todo-calendar-')) {
        const docRef = db.collection('users').doc(currentUser.uid).collection('todos').doc(key);
        batch.set(docRef, {
          tasks: mergedData[key],
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    await batch.commit();
    // Use merged data in the app
    const year = current.getFullYear();
    const month = current.getMonth();
    tasks = mergedData[getStorageKey(year, month)] || {};
    renderCalendar(year, month);
    renderTasks();
    updateSelectedDateDisplay();
    await checkAndUpdateStreakOnLoad();

    // Fetch retroLock from Firestore meta
    try {
      const metaDoc = await db.collection('users').doc(currentUser.uid).collection('meta').doc('retroLock').get();
      if (metaDoc.exists) {
        retroLock = !!metaDoc.data().enabled;
        console.log('retroLock', retroLock)
      } else {
        retroLock = true;
      }
    } catch (e) {
      retroLock = true;
    }
    // Fetch importExportEnabled from Firestore meta
    try {
      const metaDoc = await db.collection('users').doc(currentUser.uid).collection('meta').doc('importExportEnabled').get();
      if (metaDoc.exists) {
        importExportEnabled = !!metaDoc.data().enabled;
        console.log('importExportEnabled', importExportEnabled)
      } else {
        importExportEnabled = false;
      }
    } catch (e) {
      importExportEnabled = false;
    }
    updateImportExportButtons();
  } else {
    currentUser = null;
    updateUserInfo(null);
    streak = 0;
    lastStreakDate = null;
    updateStreakDisplay();
    // Use localStorage (already up-to-date)
    const year = current.getFullYear();
    const month = current.getMonth();
    tasks = loadTasks(year, month);
    renderCalendar(year, month);
    renderTasks();
    updateSelectedDateDisplay();
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

function renderNote() {
  if (!selectedDate) return;
  const dateKey = getDateKey(selectedDate);
  const dayData = tasks[dateKey] || { tasks: [], note: '' };
  noteTextarea.value = dayData.note || '';
}

function saveNote() {
  if (!selectedDate) return;
  const dateKey = getDateKey(selectedDate);
  if (!tasks[dateKey]) tasks[dateKey] = { tasks: [], note: '' };
  // If old format, upgrade
  if (Array.isArray(tasks[dateKey])) {
    tasks[dateKey] = { tasks: tasks[dateKey], note: '' };
  }
  tasks[dateKey].note = noteTextarea.value;
  // Save to localStorage instantly
  saveTasks(selectedDate.getFullYear(), selectedDate.getMonth(), tasks);
  // Cloud sync in background
  if (currentUser) {
    saveTasksToFirebase(selectedDate.getFullYear(), selectedDate.getMonth(), tasks);
  }
  showNotification('Note saved!');
}

saveNoteBtn.addEventListener('click', saveNote);
noteTextarea.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    saveNote();
  }
});

// --- Settings Dropdown Elements ---
const settingsExportBtn = document.getElementById('settings-export-btn');
const settingsImportBtn = document.getElementById('settings-import-btn');
const settingsImportInput = document.getElementById('settings-import-input');
const themeToggleBtn = document.getElementById('settings-theme-toggle');

function updateImportExportButtons() {
  if (importExportEnabled) {
    settingsExportBtn.style.display = '';
    settingsImportBtn.style.display = '';
  } else {
    settingsExportBtn.style.display = 'none';
    settingsImportBtn.style.display = 'none';
  }
}

// --- Export Functionality (Settings) ---
settingsExportBtn.addEventListener('click', () => {
  if (!importExportEnabled) return;
  exportAllTodos();
  closeAllDropdowns();
});

// --- Import Functionality (Settings) ---
settingsImportBtn.addEventListener('click', () => {
  if (!importExportEnabled) return;
  settingsImportInput.click();
});
settingsImportInput.addEventListener('change', async (e) => {
  if (!importExportEnabled) return;
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (currentUser) {
      // Import to Firebase (full day object: tasks and note)
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
      // Import to localStorage (full day object: tasks and note)
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
  closeAllDropdowns();
});

// --- Export All Todos Function (restored) ---
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

// --- Theme Toggle Logic ---
function setTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    themeToggleBtn.textContent = 'Dark Theme';
  } else {
    document.body.classList.remove('light-theme');
    themeToggleBtn.textContent = 'Light Theme';
  }
  localStorage.setItem('theme', theme);
}
themeToggleBtn.addEventListener('click', () => {
  const isLight = document.body.classList.contains('light-theme');
  setTheme(isLight ? 'dark' : 'light');
});
// On load, apply saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  setTheme('light');
} else {
  setTheme('dark');
}

// --- Streak Logic ---
function isYesterday(date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.getFullYear() === y.getFullYear() && date.getMonth() === y.getMonth() && date.getDate() === y.getDate();
}

function getTodayKey() {
  const now = new Date();
  return getDateKey(now);
}

async function checkAndUpdateStreakOnLoad() {
  if (!currentUser) return;
  const { streak: loadedStreak, lastStreakDate: loadedLastDate } = await loadStreakFromFirebase();
  streak = loadedStreak;
  lastStreakDate = loadedLastDate;
  // Check if streak should be reset (missed a day)
  const todayKey = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  // If lastStreakDate is not today or yesterday, reset
  if (lastStreakDate && lastStreakDate !== todayKey && lastStreakDate !== yesterdayKey) {
    streak = 0;
    lastStreakDate = null;
    await saveStreakToFirebase(streak, lastStreakDate);
    showNotification('Streak reset!');
  }
  updateStreakDisplay();
}

async function checkAndUpdateStreakOnTaskComplete() {
  if (!currentUser) return;
  const today = new Date();
  const todayKey = getDateKey(today);
  let dayData = tasks[todayKey];
  if (!dayData) dayData = { tasks: [], note: '' };
  // Only if all tasks are completed and there is at least one task
  if (dayData.tasks.length > 0 && dayData.tasks.every(t => t.completed)) {
    // Only allow streak increment if lastStreakDate is yesterday or today
    if (lastStreakDate === getDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)) || lastStreakDate === null || lastStreakDate === undefined) {
      streak = (streak || 0) + 1;
      lastStreakDate = todayKey;
      await saveStreakToFirebase(streak, lastStreakDate);
      showNotification('🔥 Streak increased!');
    } else if (lastStreakDate !== todayKey) {
      // If lastStreakDate is not yesterday or today, reset streak
      streak = 1;
      lastStreakDate = todayKey;
      await saveStreakToFirebase(streak, lastStreakDate);
      showNotification('🔥 Streak started!');
    }
  }
  updateStreakDisplay();
}

async function checkAndResetStreakIfMissed() {
  if (!currentUser) return;
  const today = new Date();
  const todayKey = getDateKey(today);
  // If lastStreakDate is not today or yesterday, reset
  if (lastStreakDate && lastStreakDate !== todayKey && lastStreakDate !== getDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))) {
    streak = 0;
    lastStreakDate = null;
    await saveStreakToFirebase(streak, lastStreakDate);
    showNotification('Streak reset!');
    updateStreakDisplay();
  }
}

// --- On app load, check streak reset ---
window.addEventListener('load', () => {
  setTimeout(() => {
    checkAndResetStreakIfMissed();
  }, 1000);
});

// --- Initial streak display ---
updateStreakDisplay();

// --- Add function to update retroLock in Firestore and locally
async function setretroLock(enabled) {
  retroLock = enabled;
  if (currentUser) {
    await db.collection('users').doc(currentUser.uid).collection('meta').doc('retroLock').set({ enabled });
  }
}

// --- Add function to update importExportEnabled in Firestore and locally
async function setImportExportEnabled(enabled) {
  importExportEnabled = enabled;
  updateImportExportButtons();
  if (currentUser) {
    await db.collection('users').doc(currentUser.uid).collection('meta').doc('importExportEnabled').set({ enabled });
  }
}

// --- Add event listener to app logo for month refresh ---
document.addEventListener('DOMContentLoaded', () => {
  const appLogo = document.querySelector('.app-logo');
  if (appLogo) {
    appLogo.style.cursor = 'pointer';
    appLogo.title = 'Refresh month data';
    appLogo.addEventListener('click', async () => {
      showNotification('Refreshing...');
      const year = current.getFullYear();
      const month = current.getMonth();
      if (currentUser) {
        // Reload from Firebase
        tasks = await loadTasksFromFirebase(year, month);
        // Also reload streak
        const streakData = await loadStreakFromFirebase();
        streak = streakData.streak;
        lastStreakDate = streakData.lastStreakDate;
        updateStreakDisplay();
      } else {
        // Reload from localStorage
        tasks = loadTasks(year, month);
      }
      renderCalendar(year, month);
      renderTasks();
      updateSelectedDateDisplay();
      showNotification('Month data refreshed!');
    });
  }
}); 
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

let current = new Date();
let selectedDate = new Date(); // Default to today
let tasks = {};
let lastConfettiDateKey = null;

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

// --- Storage ---
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

function saveAndRefresh() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  saveTasks(year, month, tasks);
  renderTasks();
  renderCalendar(current.getFullYear(), current.getMonth());
}

// --- Event Listeners ---
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

prevBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() - 1);
  tasks = loadTasks(current.getFullYear(), current.getMonth());
  renderCalendar(current.getFullYear(), current.getMonth());
  // Keep the same selected date if it's still in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
  }
  renderTasks();
  updateSelectedDateDisplay();
});

nextBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() + 1);
  tasks = loadTasks(current.getFullYear(), current.getMonth());
  renderCalendar(current.getFullYear(), current.getMonth());
  // Keep the same selected date if it's still in the current month view
  if (selectedDate.getMonth() !== current.getMonth() || selectedDate.getFullYear() !== current.getFullYear()) {
    selectedDate = new Date(current.getFullYear(), current.getMonth(), 1);
  }
  renderTasks();
  updateSelectedDateDisplay();
});

// --- Export Functionality ---
function exportAllTodos() {
  // Gather all todo-calendar-* keys
  const allData = {};
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

if (importBtn && importInput) {
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Remove all existing todo-calendar-* keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('todo-calendar-')) {
          localStorage.removeItem(key);
        }
      }
      // Write new data
      for (const key in data) {
        if (key.startsWith('todo-calendar-')) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
      }
      showNotification('Import successful!');
      setTimeout(() => window.location.reload(), 2100);
    } catch (err) {
      alert('Failed to import JSON: ' + err.message);
    }
  });
}

// --- Init ---
function init() {
  const year = current.getFullYear();
  const month = current.getMonth();
  tasks = loadTasks(year, month);
  renderCalendar(year, month);
  renderTasks();
  updateSelectedDateDisplay();
}
init(); 
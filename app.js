/* ============================================================
   StudyFlow — Student Productivity Dashboard
   app.js  — All interactive logic
   ============================================================ */

"use strict";

// ── Storage helpers ──────────────────────────────────────────
const DB = {
  get: (k, def = null) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Toast notification ───────────────────────────────────────
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Clock ────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('currentTime').textContent =
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ── Dark Mode ────────────────────────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

function applyTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.textContent = dark ? '◐' : '◑';
  DB.set('theme', dark ? 'dark' : 'light');
}
let isDark = DB.get('theme') === 'dark';
applyTheme(isDark);
themeToggle.addEventListener('click', () => { isDark = !isDark; applyTheme(isDark); });

// ── Sidebar toggle (mobile) ──────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target))
    sidebar.classList.remove('open');
});

// ── Navigation ───────────────────────────────────────────────
const navBtns  = document.querySelectorAll('.nav-btn');
const panels   = document.querySelectorAll('.panel');
const pageTitle= document.getElementById('pageTitle');
const labels   = {
  dashboard:'Dashboard', todo:'To-Do Manager', notes:'Notes',
  pomodoro:'Pomodoro Timer', calendar:'Calendar Planner',
  habits:'Habit Tracker', expenses:'Expense Tracker', study:'Study Tracker'
};

function showPanel(name) {
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  panels.forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  pageTitle.textContent = labels[name] || name;
  if (name === 'dashboard') updateDashboard();
}
navBtns.forEach(btn => btn.addEventListener('click', () => showPanel(btn.dataset.panel)));

// ── Motivational Quotes ──────────────────────────────────────
const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "Education is the most powerful weapon you can use to change the world. — Nelson Mandela",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "You don't have to be great to start, but you have to start to be great.",
  "The expert in anything was once a beginner.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "You are capable of amazing things.",
  "Start where you are. Use what you have. Do what you can.",
];
let quoteIdx = 0;
function setQuote() {
  const t = document.getElementById('quoteText');
  t.style.opacity = '0';
  setTimeout(() => {
    t.textContent = quotes[quoteIdx % quotes.length];
    t.style.opacity = '1';
    quoteIdx++;
  }, 300);
}
document.getElementById('quoteBtn').addEventListener('click', setQuote);
quoteIdx = Math.floor(Math.random() * quotes.length);
setQuote();

// ── Weather Widget ───────────────────────────────────────────
function weatherEmoji(code) {
  if (code <= 3)  return '☀';
  if (code <= 48) return '☁';
  if (code <= 67) return '🌧';
  if (code <= 77) return '❄';
  if (code <= 82) return '🌦';
  return '⛈';
}
async function loadWeather() {
  try {
    const geo = await fetch('https://ipapi.co/json/');
    const loc = await geo.json();
    const city = loc.city || 'Your City';
    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
    );
    const wData = await wRes.json();
    const cw = wData.current_weather;
    document.getElementById('weatherIcon').textContent = weatherEmoji(cw.weathercode);
    document.getElementById('weatherTemp').textContent = `${Math.round(cw.temperature)}°C`;
    document.getElementById('weatherCity').textContent = city;
  } catch {
    document.getElementById('weatherCity').textContent = 'Delhi';
    document.getElementById('weatherTemp').textContent = '--°C';
  }
}
loadWeather();

// ──────────────────────────────────────────────────────────────
// TO-DO MANAGER
// ──────────────────────────────────────────────────────────────
let todos = DB.get('todos', []);
let todoFilter = 'all';

function saveTodos() { DB.set('todos', todos); }

function renderTodos() {
  const list = document.getElementById('todoList');
  const filtered = todos.filter(t => {
    if (todoFilter === 'pending') return !t.done;
    if (todoFilter === 'done')    return t.done;
    return true;
  });
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<li style="text-align:center;padding:24px;color:var(--text3);font-size:.85rem;">No tasks here yet ✨</li>';
  }
  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.done ? 'done' : ''}`;
    li.innerHTML = `
      <div class="todo-check ${todo.done ? 'checked' : ''}" data-id="${todo.id}">
        ${todo.done ? '✓' : ''}
      </div>
      <span class="todo-text">${escHtml(todo.text)}</span>
      <span class="todo-badge badge-${todo.priority}">${todo.priority}</span>
      <span class="todo-cat">${todo.category}</span>
      <button class="todo-delete" data-id="${todo.id}">✕</button>
    `;
    list.appendChild(li);
  });
  const todayDone  = todos.filter(t => t.done && isToday(t.date)).length;
  document.getElementById('todoCount').textContent = `${todos.length} task${todos.length !== 1 ? 's' : ''}`;
  document.getElementById('stat-tasks').textContent = todayDone;
  document.getElementById('stat-tasks-total').textContent = todos.length;
}

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

function addTodo() {
  const val = document.getElementById('todoInput').value.trim();
  if (!val) return;
  todos.unshift({
    id: Date.now(),
    text: val,
    done: false,
    priority: document.getElementById('todoPriority').value,
    category: document.getElementById('todoCategory').value,
    date: new Date().toDateString(),
  });
  document.getElementById('todoInput').value = '';
  saveTodos(); renderTodos(); updateDashboard();
  showToast('Task added!');
}

document.getElementById('todoList').addEventListener('click', e => {
  const id = +e.target.dataset.id;
  if (!id) return;
  if (e.target.classList.contains('todo-check')) {
    const t = todos.find(x => x.id === id);
    if (t) { t.done = !t.done; saveTodos(); renderTodos(); updateDashboard(); }
  }
  if (e.target.classList.contains('todo-delete')) {
    todos = todos.filter(x => x.id !== id);
    saveTodos(); renderTodos(); updateDashboard();
    showToast('Task deleted');
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    renderTodos();
  });
});

document.getElementById('clearDoneTodos').addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  saveTodos(); renderTodos(); updateDashboard();
  showToast('Cleared done tasks');
});

renderTodos();

// ──────────────────────────────────────────────────────────────
// NOTES
// ──────────────────────────────────────────────────────────────
let notes     = DB.get('notes', []);
let activeNote= null;

function saveNotes() { DB.set('notes', notes); }

function renderNotesList() {
  const search = document.getElementById('noteSearch').value.toLowerCase();
  const list = document.getElementById('notesList');
  list.innerHTML = '';
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search) || n.body.toLowerCase().includes(search)
  );
  if (!filtered.length) {
    list.innerHTML = '<li style="padding:12px;font-size:.82rem;color:var(--text3)">No notes yet</li>';
    return;
  }
  filtered.forEach(note => {
    const li = document.createElement('li');
    li.className = `note-item ${activeNote === note.id ? 'active' : ''}`;
    li.innerHTML = `
      <div class="note-item-title">${escHtml(note.title) || 'Untitled'}</div>
      <div class="note-item-preview">${escHtml(note.body.slice(0, 60)) || '…'}</div>
    `;
    li.addEventListener('click', () => loadNote(note.id));
    list.appendChild(li);
  });
}

function loadNote(id) {
  activeNote = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;
  document.getElementById('noteTitleInput').value = note.title;
  document.getElementById('noteBodyInput').value  = note.body;
  document.getElementById('noteLastSaved').textContent = `Saved ${new Date(note.updated).toLocaleString()}`;
  document.getElementById('deleteNoteBtn').style.display = 'inline-block';
  renderNotesList();
}

document.getElementById('newNoteBtn').addEventListener('click', () => {
  const n = { id: Date.now(), title: '', body: '', updated: Date.now() };
  notes.unshift(n); saveNotes();
  loadNote(n.id); renderNotesList();
  document.getElementById('noteTitleInput').focus();
});

document.getElementById('saveNoteBtn').addEventListener('click', () => {
  if (!activeNote) return;
  const n = notes.find(x => x.id === activeNote);
  if (!n) return;
  n.title   = document.getElementById('noteTitleInput').value.trim() || 'Untitled';
  n.body    = document.getElementById('noteBodyInput').value;
  n.updated = Date.now();
  saveNotes(); renderNotesList();
  document.getElementById('noteLastSaved').textContent = `Saved ${new Date(n.updated).toLocaleString()}`;
  showToast('Note saved!');
});

document.getElementById('deleteNoteBtn').addEventListener('click', () => {
  if (!activeNote) return;
  notes = notes.filter(n => n.id !== activeNote);
  activeNote = null;
  document.getElementById('noteTitleInput').value = '';
  document.getElementById('noteBodyInput').value  = '';
  document.getElementById('noteLastSaved').textContent = 'Not saved yet';
  document.getElementById('deleteNoteBtn').style.display = 'none';
  saveNotes(); renderNotesList();
  showToast('Note deleted');
});

document.getElementById('noteSearch').addEventListener('input', renderNotesList);

// Auto-save on typing
let noteAutoSave;
document.getElementById('noteBodyInput').addEventListener('input', () => {
  clearTimeout(noteAutoSave);
  noteAutoSave = setTimeout(() => document.getElementById('saveNoteBtn').click(), 1500);
});

renderNotesList();

// ──────────────────────────────────────────────────────────────
// POMODORO TIMER
// ──────────────────────────────────────────────────────────────
let pomoDurations = { work: 25, short: 5, long: 15 };
let pomoMode       = 'work';
let pomoTimeLeft   = pomoDurations.work * 60;
let pomoTotal      = pomoDurations.work * 60;
let pomoRunning    = false;
let pomoInterval   = null;
let pomoSessions   = DB.get('pomoSessions', []);

const pomoDisplay   = document.getElementById('pomoDisplay');
const pomoRing      = document.getElementById('pomoProgressRing');
const pomoLabel     = document.getElementById('pomoLabel');
const pomoStartBtn  = document.getElementById('pomoStart');
const pomoResetBtn  = document.getElementById('pomoReset');
const POMO_CIRCUM   = 553;

const modeLabels = { work: 'Time to Focus! 🔥', short: 'Short Break ☕', long: 'Long Break 🧘' };

function updatePomoDisplay() {
  const m = String(Math.floor(pomoTimeLeft / 60)).padStart(2, '0');
  const s = String(pomoTimeLeft % 60).padStart(2, '0');
  pomoDisplay.textContent = `${m}:${s}`;
  const frac = pomoTotal > 0 ? 1 - (pomoTimeLeft / pomoTotal) : 0;
  pomoRing.style.strokeDashoffset = POMO_CIRCUM * (1 - frac);
}

function setPomoMode(mode) {
  pomoMode = mode;
  stopPomo();
  pomoDurations.work  = +document.getElementById('pomoWorkMin').value  || 25;
  pomoDurations.short = +document.getElementById('pomoShortMin').value || 5;
  pomoDurations.long  = +document.getElementById('pomoLongMin').value  || 15;
  pomoTimeLeft = pomoDurations[mode] * 60;
  pomoTotal    = pomoTimeLeft;
  pomoRing.className = `pomo-progress-ring ${mode !== 'work' ? mode + '-break' : ''}`;
  pomoLabel.textContent = modeLabels[mode];
  document.querySelectorAll('.pomo-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  updatePomoDisplay();
}

function startPomo() {
  if (pomoRunning) return;
  pomoRunning = true;
  pomoStartBtn.textContent = '⏸ Pause';
  pomoInterval = setInterval(() => {
    if (!pomoRunning) return;
    pomoTimeLeft--;
    updatePomoDisplay();
    if (pomoTimeLeft <= 0) {
      clearInterval(pomoInterval);
      pomoRunning = false;
      pomoStartBtn.textContent = '▶ Start';
      if (pomoMode === 'work') {
        const today = new Date().toDateString();
        pomoSessions.push({ mode: 'work', date: today, duration: pomoDurations.work });
        DB.set('pomoSessions', pomoSessions);
        updatePomoStats();
        updateDashboard();
        showToast('🍅 Pomodoro complete! Time for a break.');
      } else {
        showToast('Break over! Ready to focus?');
      }
      pomoTimeLeft = 0;
    }
  }, 1000);
}

function pausePomo() {
  pomoRunning = false;
  clearInterval(pomoInterval);
  pomoStartBtn.textContent = '▶ Resume';
}

function stopPomo() {
  pomoRunning = false;
  clearInterval(pomoInterval);
  pomoStartBtn.textContent = '▶ Start';
}

pomoStartBtn.addEventListener('click', () => {
  if (pomoRunning) pausePomo(); else startPomo();
});
pomoResetBtn.addEventListener('click', () => { setPomoMode(pomoMode); });
document.querySelectorAll('.pomo-tab').forEach(t =>
  t.addEventListener('click', () => setPomoMode(t.dataset.mode))
);

function updatePomoStats() {
  const today = new Date().toDateString();
  const todaySessions = pomoSessions.filter(s => s.date === today && s.mode === 'work');
  document.getElementById('pomoCompleted').textContent = todaySessions.length;
  const totalMin = todaySessions.reduce((a, s) => a + (s.duration || 25), 0);
  document.getElementById('pomoTotalTime').textContent = totalMin >= 60
    ? `${Math.floor(totalMin/60)}h ${totalMin%60}m` : `${totalMin}m`;

  const dotsEl = document.getElementById('pomoDots');
  dotsEl.innerHTML = '';
  todaySessions.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = `pomo-dot ${s.mode}`;
    d.textContent = i + 1;
    dotsEl.appendChild(d);
  });
  document.getElementById('stat-pomodoros').textContent = todaySessions.length;
}

// Settings change
['pomoWorkMin','pomoShortMin','pomoLongMin'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => setPomoMode(pomoMode));
});

setPomoMode('work');
updatePomoStats();

// ──────────────────────────────────────────────────────────────
// CALENDAR PLANNER
// ──────────────────────────────────────────────────────────────
let calYear       = new Date().getFullYear();
let calMonth      = new Date().getMonth();
let calSelected   = new Date().toDateString();
let calEvents     = DB.get('calEvents', {});

function saveCalEvents() { DB.set('calEvents', calEvents); }

function renderCalendar() {
  const grid = document.getElementById('calGrid');
  const title= document.getElementById('calMonthYear');
  const first = new Date(calYear, calMonth, 1);
  const last  = new Date(calYear, calMonth + 1, 0);
  const today = new Date().toDateString();

  title.textContent = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';

  // Empty cells before first
  for (let i = 0; i < first.getDay(); i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    grid.appendChild(cell);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(calYear, calMonth, d);
    const ds   = date.toDateString();
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (ds === today)       cell.classList.add('today');
    if (ds === calSelected) cell.classList.add('selected');
    if (calEvents[ds]?.length) cell.classList.add('has-event');
    cell.textContent = d;
    cell.addEventListener('click', () => { calSelected = ds; renderCalendar(); renderEvents(); });
    grid.appendChild(cell);
  }
}

function renderEvents() {
  document.getElementById('calSelectedDate').textContent =
    new Date(calSelected).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  const list = document.getElementById('eventsList');
  list.innerHTML = '';
  const evs = (calEvents[calSelected] || []).sort((a,b) => a.time.localeCompare(b.time));
  if (!evs.length) {
    list.innerHTML = '<li style="font-size:.82rem;color:var(--text3);padding:8px 0">No events for this day</li>';
    return;
  }
  evs.forEach((ev, idx) => {
    const li = document.createElement('li');
    li.className = 'event-item';
    li.innerHTML = `
      <span class="event-time">${ev.time || '--:--'}</span>
      <span class="event-text">${escHtml(ev.text)}</span>
      <button class="event-delete" data-idx="${idx}">✕</button>
    `;
    list.appendChild(li);
  });
}

document.getElementById('addEventBtn').addEventListener('click', addEvent);
document.getElementById('eventInput').addEventListener('keydown', e => { if (e.key === 'Enter') addEvent(); });

function addEvent() {
  const val  = document.getElementById('eventInput').value.trim();
  const time = document.getElementById('eventTime').value;
  if (!val) return;
  if (!calEvents[calSelected]) calEvents[calSelected] = [];
  calEvents[calSelected].push({ text: val, time: time || '00:00' });
  document.getElementById('eventInput').value = '';
  saveCalEvents(); renderCalendar(); renderEvents();
  showToast('Event added!');
}

document.getElementById('eventsList').addEventListener('click', e => {
  if (e.target.classList.contains('event-delete')) {
    const idx = +e.target.dataset.idx;
    calEvents[calSelected].splice(idx, 1);
    saveCalEvents(); renderCalendar(); renderEvents();
    showToast('Event removed');
  }
});

document.getElementById('calPrev').addEventListener('click', () => {
  calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar(); renderEvents();
});
document.getElementById('calNext').addEventListener('click', () => {
  calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar(); renderEvents();
});

renderCalendar();
renderEvents();

// ──────────────────────────────────────────────────────────────
// HABIT TRACKER
// ──────────────────────────────────────────────────────────────
let habits = DB.get('habits', []);
function saveHabits() { DB.set('habits', habits); }

const catColors = ['#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#f87171'];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d.toDateString();
  });
}

function renderHabits() {
  const grid = document.getElementById('habitsGrid');
  grid.innerHTML = '';
  const weekDates = getWeekDates();
  const today = new Date().toDateString();
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  if (!habits.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text3);font-size:.88rem">No habits yet. Add your first habit! 🌟</div>';
  }

  habits.forEach(habit => {
    const card = document.createElement('div');
    card.className = 'habit-card';

    // Calculate streak
    let streak = 0;
    const d = new Date();
    while (true) {
      if ((habit.completions || []).includes(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }

    const doneToday = (habit.completions || []).includes(today);

    card.innerHTML = `
      <div class="habit-card-header">
        <div class="habit-color-dot" style="background:${habit.color}"></div>
        <span class="habit-name">${escHtml(habit.name)}</span>
        <span class="habit-streak">${streak > 0 ? '🔥 ' + streak : ''}</span>
        <button class="habit-delete-btn" data-id="${habit.id}">✕</button>
      </div>
      <div class="habit-week-row">
        ${weekDates.map((wd, i) => {
          const done = (habit.completions || []).includes(wd);
          return `<div class="habit-day-cell ${done ? 'done' : ''} ${wd === today ? 'today-cell' : ''}"
            style="${done ? 'background:' + habit.color + ';border-color:' + habit.color + ';color:#fff;' : ''}"
            data-id="${habit.id}" data-date="${wd}" title="${wd}">
            ${dayNames[i]}
          </div>`;
        }).join('')}
      </div>
      <div class="habit-check-today">
        <span>${doneToday ? '✅ Done today!' : 'Mark as done today'}</span>
        <button class="habit-toggle-btn ${doneToday ? 'done' : ''}" data-id="${habit.id}">
          ${doneToday ? '✓ Done' : 'Mark Done'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  updateHabitStats();
}

document.getElementById('habitsGrid').addEventListener('click', e => {
  const id = +e.target.dataset.id;
  if (!id) return;
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  if (e.target.classList.contains('habit-delete-btn')) {
    habits = habits.filter(h => h.id !== id);
    saveHabits(); renderHabits(); updateDashboard();
    showToast('Habit removed');
    return;
  }

  if (e.target.classList.contains('habit-toggle-btn') || e.target.classList.contains('habit-day-cell')) {
    const date = e.target.dataset.date || new Date().toDateString();
    if (!habit.completions) habit.completions = [];
    const idx = habit.completions.indexOf(date);
    if (idx > -1) habit.completions.splice(idx, 1);
    else habit.completions.push(date);
    saveHabits(); renderHabits(); updateDashboard();
  }
});

document.getElementById('addHabitBtn').addEventListener('click', () => {
  const form = document.getElementById('habitAddForm');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('cancelHabitBtn').addEventListener('click', () => {
  document.getElementById('habitAddForm').style.display = 'none';
});
document.getElementById('saveHabitBtn').addEventListener('click', () => {
  const name = document.getElementById('habitNameInput').value.trim();
  if (!name) return;
  habits.push({
    id: Date.now(),
    name,
    color: document.getElementById('habitColor').value,
    completions: [],
  });
  document.getElementById('habitNameInput').value = '';
  document.getElementById('habitAddForm').style.display = 'none';
  saveHabits(); renderHabits(); updateDashboard();
  showToast('Habit added!');
});

function updateHabitStats() {
  const today = new Date().toDateString();
  const total = habits.length;
  const done  = habits.filter(h => (h.completions || []).includes(today)).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('stat-habits').textContent = `${pct}%`;
}

renderHabits();

// ──────────────────────────────────────────────────────────────
// EXPENSE TRACKER
// ──────────────────────────────────────────────────────────────
let expenses = DB.get('expenses', []);
let budget   = DB.get('budget', 0);
function saveExpenses() { DB.set('expenses', expenses); }

const catIcons = { food:'🍔', transport:'🚌', books:'📚', entertainment:'🎬', other:'📦' };
const catColorsE= { food:'#fb923c', transport:'#60a5fa', books:'#4ade80', entertainment:'#f472b6', other:'#a78bfa' };

document.getElementById('addExpenseBtn').addEventListener('click', addExpense);
document.getElementById('setBudgetBtn').addEventListener('click', () => {
  budget = +document.getElementById('budgetInput').value || 0;
  DB.set('budget', budget);
  renderExpenses();
  showToast('Budget set!');
});

function addExpense() {
  const desc = document.getElementById('expenseDesc').value.trim();
  const amt  = +document.getElementById('expenseAmount').value;
  if (!desc || !amt) { showToast('Enter description and amount'); return; }
  expenses.unshift({
    id: Date.now(),
    desc,
    amount: amt,
    category: document.getElementById('expenseCategory').value,
    date: new Date().toLocaleDateString('en-IN'),
    month: new Date().getMonth() + '-' + new Date().getFullYear(),
  });
  document.getElementById('expenseDesc').value   = '';
  document.getElementById('expenseAmount').value = '';
  saveExpenses(); renderExpenses();
  showToast(`₹${amt} added`);
}

function renderExpenses() {
  const thisMonth = new Date().getMonth() + '-' + new Date().getFullYear();
  const monthExp  = expenses.filter(e => e.month === thisMonth);
  const total     = monthExp.reduce((a, e) => a + e.amount, 0);

  document.getElementById('monthTotal').textContent = `₹${total.toLocaleString('en-IN')}`;

  const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const bar = document.getElementById('budgetBar');
  bar.style.width = pct + '%';
  bar.classList.toggle('over', budget > 0 && total > budget);
  document.getElementById('budgetStatus').textContent = budget > 0
    ? `₹${total.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')} (${Math.round(pct)}%)`
    : 'Set a monthly budget above';

  // Category breakdown
  const cats = {};
  monthExp.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(cats), 1);
  const chart  = document.getElementById('expenseChart');
  chart.innerHTML = Object.entries(cats).map(([cat, amt]) => `
    <div class="exp-cat-row">
      <span class="exp-cat-label">${catIcons[cat] || '📦'} ${cat}</span>
      <div class="exp-cat-bar-wrap">
        <div class="exp-cat-bar" style="width:${(amt/maxCat*100).toFixed(1)}%;background:${catColorsE[cat] || '#999'}"></div>
      </div>
      <span class="exp-cat-amount">₹${amt.toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  // List
  const list = document.getElementById('expenseList');
  list.innerHTML = '';
  expenses.slice(0, 30).forEach(e => {
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.innerHTML = `
      <span class="expense-cat-icon">${catIcons[e.category] || '📦'}</span>
      <span class="expense-desc">${escHtml(e.desc)}</span>
      <span style="font-size:.72rem;color:var(--text3)">${e.date}</span>
      <span class="expense-amount">₹${e.amount.toLocaleString('en-IN')}</span>
      <button class="expense-item-delete" data-id="${e.id}">✕</button>
    `;
    list.appendChild(li);
  });
}

document.getElementById('expenseList').addEventListener('click', e => {
  if (e.target.classList.contains('expense-item-delete')) {
    const id = +e.target.dataset.id;
    expenses = expenses.filter(x => x.id !== id);
    saveExpenses(); renderExpenses();
    showToast('Expense deleted');
  }
});

if (budget > 0) document.getElementById('budgetInput').value = budget;
renderExpenses();

// ──────────────────────────────────────────────────────────────
// STUDY TRACKER
// ──────────────────────────────────────────────────────────────
let studyLog     = DB.get('studyLog', []);
let studyRunning = false;
let studyPaused  = false;
let studySeconds = 0;
let studyInterval= null;
let studyStart   = null;

const studySW    = document.getElementById('studyStopwatch');
const studyStartBtn = document.getElementById('studyStart');
const studyPauseBtn = document.getElementById('studyPause');
const studyStopBtn  = document.getElementById('studyStop');

function fmtStudyTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateStudyDisplay() {
  studySW.textContent = fmtStudyTime(studySeconds);
}

studyStartBtn.addEventListener('click', () => {
  if (!studyRunning) {
    studyRunning = true; studyPaused = false;
    studyStart = studyStart || new Date();
    studyInterval = setInterval(() => { studySeconds++; updateStudyDisplay(); }, 1000);
    studySW.classList.add('running');
    studyStartBtn.disabled  = true;
    studyPauseBtn.disabled  = false;
    studyStopBtn.disabled   = false;
    studyStartBtn.textContent = '▶ Running';
  }
});

studyPauseBtn.addEventListener('click', () => {
  if (studyRunning && !studyPaused) {
    clearInterval(studyInterval);
    studyPaused = true; studyRunning = false;
    studySW.classList.remove('running');
    studyPauseBtn.textContent = '▶ Resume';
  } else if (studyPaused) {
    studyRunning = true; studyPaused = false;
    studyInterval = setInterval(() => { studySeconds++; updateStudyDisplay(); }, 1000);
    studySW.classList.add('running');
    studyPauseBtn.textContent = '⏸ Pause';
  }
});

studyStopBtn.addEventListener('click', () => {
  if (studySeconds < 5) { showToast('Study at least 5 seconds!'); return; }
  clearInterval(studyInterval);
  studyRunning = false; studyPaused = false;
  studySW.classList.remove('running');

  const subject = document.getElementById('studySubject').value.trim() || 'General';
  studyLog.unshift({
    id: Date.now(),
    subject,
    seconds: studySeconds,
    date: new Date().toDateString(),
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });
  DB.set('studyLog', studyLog);
  studySeconds = 0;
  studyStart   = null;
  updateStudyDisplay();
  studyStartBtn.disabled  = false;
  studyStartBtn.textContent = '▶ Start';
  studyPauseBtn.disabled  = true;
  studyPauseBtn.textContent = '⏸ Pause';
  studyStopBtn.disabled   = true;

  renderStudyLog();
  updateDashboard();
  showToast(`Study session logged for ${subject}!`);
});

function renderStudyLog() {
  const today  = new Date().toDateString();
  const todayLog = studyLog.filter(s => s.date === today);
  const todaySec = todayLog.reduce((a,s) => a + s.seconds, 0);
  const h = Math.floor(todaySec / 3600);
  const m = Math.floor((todaySec % 3600) / 60);
  document.getElementById('studyTodayTotal').textContent = `${h}h ${m}m`;
  document.getElementById('stat-study').textContent = `${h}h ${m}m`;

  const list = document.getElementById('studyList');
  list.innerHTML = '';
  studyLog.slice(0, 20).forEach(s => {
    const li = document.createElement('li');
    li.className = 'study-log-item';
    const m2 = Math.floor(s.seconds / 60);
    const h2 = Math.floor(m2 / 60);
    const dur = h2 > 0 ? `${h2}h ${m2%60}m` : `${m2}m`;
    li.innerHTML = `
      <span class="study-log-subject">${escHtml(s.subject)}</span>
      <span class="study-log-duration">${dur}</span>
      <span class="study-log-time">${s.time} · ${s.date === today ? 'Today' : s.date}</span>
    `;
    list.appendChild(li);
  });

  // Subject chart (this week)
  const weekDates = getWeekDates();
  const subjectSec = {};
  studyLog.filter(s => weekDates.includes(s.date)).forEach(s => {
    subjectSec[s.subject] = (subjectSec[s.subject] || 0) + s.seconds;
  });
  const maxSec = Math.max(...Object.values(subjectSec), 1);
  const chart  = document.getElementById('subjectChart');
  chart.innerHTML = Object.entries(subjectSec).length
    ? Object.entries(subjectSec).sort((a,b) => b[1]-a[1]).map(([sub, sec]) => {
        const m3 = Math.floor(sec / 60);
        const h3 = Math.floor(m3 / 60);
        const dur = h3 > 0 ? `${h3}h ${m3%60}m` : `${m3}m`;
        return `
          <div class="subject-bar-row">
            <span class="subject-bar-label">${escHtml(sub)}</span>
            <div class="subject-bar-track">
              <div class="subject-bar-fill" style="width:${(sec/maxSec*100).toFixed(1)}%"></div>
            </div>
            <span class="subject-bar-val">${dur}</span>
          </div>`;
      }).join('')
    : '<div style="font-size:.82rem;color:var(--text3);padding:8px">No study sessions this week yet</div>';
}

renderStudyLog();

// ──────────────────────────────────────────────────────────────
// DASHBOARD — stats & score
// ──────────────────────────────────────────────────────────────
function updateDashboard() {
  const today = new Date().toDateString();

  // Tasks
  const doneTasks  = todos.filter(t => t.done && isToday(t.date)).length;
  const totalTasks = todos.length;
  document.getElementById('stat-tasks').textContent = doneTasks;
  document.getElementById('stat-tasks-total').textContent = totalTasks;

  // Study
  const todayStudy = studyLog.filter(s => s.date === today).reduce((a,s) => a + s.seconds, 0);
  const sh = Math.floor(todayStudy / 3600);
  const sm = Math.floor((todayStudy % 3600) / 60);
  document.getElementById('stat-study').textContent = `${sh}h ${sm}m`;

  // Habits
  updateHabitStats();

  // Score
  let score = 0;
  // Tasks: up to 30 pts
  if (totalTasks > 0) score += Math.min(30, Math.round((doneTasks / Math.max(totalTasks, 1)) * 30));
  // Study: up to 30 pts (30 min = 30 pts)
  score += Math.min(30, Math.floor(todayStudy / 60));
  // Habits: up to 20 pts
  const habitPct = habits.length > 0
    ? habits.filter(h => (h.completions||[]).includes(today)).length / habits.length
    : 0;
  score += Math.round(habitPct * 20);
  // Pomodoros: up to 20 pts
  const pomSessions = pomoSessions.filter(s => s.date === today && s.mode === 'work');
  score += Math.min(20, pomSessions.length * 5);
  score = Math.min(100, score);

  document.getElementById('productivityScore').textContent = score;
  const circum = 314;
  document.getElementById('scoreRingFill').style.strokeDashoffset = circum - (circum * score / 100);
  const descs = [
    [0,  'Just getting started — every step counts!'],
    [20, 'Good start! Keep the momentum going.'],
    [40, 'Making progress — you\'re doing great!'],
    [60, 'Solid productivity! Keep pushing.'],
    [80, 'Excellent work — almost there!'],
    [95, '🏆 Exceptional! You crushed it today!'],
  ];
  const desc = descs.filter(d => score >= d[0]).pop();
  document.getElementById('scoreDesc').textContent = desc ? desc[1] : '';

  // Week bars
  const weekDates = getWeekDates();
  const weekBars  = document.getElementById('weekBars');
  weekBars.innerHTML = '';
  weekDates.forEach((wd, i) => {
    const dayStuSec = studyLog.filter(s => s.date === wd).reduce((a,s) => a + s.seconds, 0);
    const dayPomo   = pomoSessions.filter(s => s.date === wd && s.mode === 'work').length;
    const dayTasks  = todos.filter(t => t.done && t.date === wd).length;
    const val = Math.min(100, (dayStuSec / 60) + (dayPomo * 10) + (dayTasks * 5));
    const height = Math.max(4, Math.round((val / 100) * 80));
    const wrap = document.createElement('div');
    wrap.className = 'week-bar-wrap';
    const bar = document.createElement('div');
    bar.className = `week-bar ${wd === today ? 'today' : ''}`;
    bar.style.height = height + 'px';
    bar.title = `${new Date(wd).toLocaleDateString('en-US',{weekday:'short'})}: ${Math.round(val)} pts`;
    wrap.appendChild(bar);
    weekBars.appendChild(wrap);
  });

  // Quick todo list
  const dashTodo = document.getElementById('dashTodoList');
  dashTodo.innerHTML = '';
  todos.slice(0, 5).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span style="color:${t.done ? 'var(--accent-c)' : 'var(--text3)'};font-size:1rem;">${t.done ? '✓' : '○'}</span>
      <span style="${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">${escHtml(t.text)}</span>
    `;
    dashTodo.appendChild(li);
  });
  if (!todos.length) dashTodo.innerHTML = '<li style="color:var(--text3)">No tasks yet</li>';

  // Quick habits
  const dashHabits = document.getElementById('dashHabitList');
  dashHabits.innerHTML = '';
  habits.forEach(h => {
    const done = (h.completions||[]).includes(today);
    const li = document.createElement('li');
    li.innerHTML = `
      <span style="color:${h.color};font-size:1rem;">◆</span>
      <span>${escHtml(h.name)}</span>
      <span style="margin-left:auto;font-size:.75rem;color:${done ? 'var(--accent-c)' : 'var(--text3)'}">
        ${done ? '✓ Done' : 'Pending'}
      </span>
    `;
    dashHabits.appendChild(li);
  });
  if (!habits.length) dashHabits.innerHTML = '<li style="color:var(--text3)">No habits yet</li>';
}

// ── Helpers ──────────────────────────────────────────────────
function isToday(dateStr) {
  return dateStr === new Date().toDateString();
}
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Initial render ───────────────────────────────────────────
updateDashboard();

// Update dashboard every minute
setInterval(updateDashboard, 60000);
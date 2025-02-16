const socket = io();

/* -----------------------
   1) Message & Controls
----------------------- */
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('producer message', message);
    sendButton.style.backgroundColor = '#FF4500';
    // sendButton.style.borderColor = '#FF4500';
    sendButton.textContent = 'Sent';
  }
}

function clearMessage() {
  socket.emit('clear message');
  messageInput.value = '';
  sendButton.style.backgroundColor = '';
  sendButton.style.borderColor = '';
  sendButton.textContent = 'Send';
}

sendButton.addEventListener('click', sendMessage);
clearButton.addEventListener('click', clearMessage);

// Keyboard shortcuts for messaging
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
    e.preventDefault();
    sendMessage();
  }
  if (e.key === 'Enter' && e.metaKey) {
    e.preventDefault();
    clearMessage();
  }
});

/* -----------------------
   2) Schedule Controls
----------------------- */
let scheduleItems = [];

function renderScheduleTable() {
  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = scheduleItems.map((item, index) => `
    <tr data-id="${item.id}">
      <td class="row-number">${String(index + 1).padStart(2, '0')}</td>
      <td contenteditable="true" class="editable" data-field="title">${item.title}</td>
      <td contenteditable="true" class="editable" data-field="presenter">${item.presenter}</td>
      <td contenteditable="true" class="editable" data-field="duration">${item.duration}</td>
      <td contenteditable="true" class="editable" data-field="tdNote">${item.tdNote}</td>
      <td contenteditable="true" class="editable" data-field="talentNote">${item.talentNote}</td>
    </tr>
  `).join('');
}

// Keyboard shortcuts for Next and Previous buttons using Option + ArrowRight/ArrowLeft
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'ArrowRight') {
    e.preventDefault();
    document.getElementById('nextItemBtn').click();
  } else if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    document.getElementById('prevItemBtn').click();
  }
});

// Keyboard shortcuts for Starting Schedule using Option + Enter
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('startScheduleBtn').click();
  }
});

// Listen for blur events to update scheduleItems array
document.addEventListener('blur', (e) => {
  if (e.target.matches('.editable')) {
    const row = e.target.closest('tr');
    const id = row.dataset.id;
    const field = e.target.dataset.field;
    const newValue = e.target.textContent.trim();
    const item = scheduleItems.find(i => i.id === id);
    if (item) {
      if (field === 'duration') {
        item.duration = parseInt(newValue, 10) || 0;
      } else {
        item[field] = newValue;
      }
    }
  }
}, true);

// Add Row
document.getElementById('addItemBtn').addEventListener('click', () => {
  const uniqueId = 'row' + Date.now();
  const newItem = {
    id: uniqueId,
    title: 'title',
    presenter: 'presenter',
    duration: 0,
    tdNote: '',
    talentNote: ''
  };
  scheduleItems.push(newItem);
  renderScheduleTable();
});

// Delete Last Row
document.getElementById('deleteItemBtn').addEventListener('click', () => {
  if (scheduleItems.length === 0) return;
  scheduleItems.pop();
  renderScheduleTable();
});

// Start Schedule
document.getElementById('startScheduleBtn').addEventListener('click', () => {
  socket.emit('update schedule', scheduleItems);
  socket.emit('start schedule');
});

// Next and Previous Item
document.getElementById('nextItemBtn').addEventListener('click', () => {
  socket.emit('next item');
});

document.getElementById('prevItemBtn').addEventListener('click', () => {
  socket.emit('prev item');
});

// Request schedule on page load
window.addEventListener('DOMContentLoaded', () => {
  socket.emit('request schedule');
});

// Receive schedule from server
socket.on('current schedule', (data) => {
  if (data.scheduleItems) {
    scheduleItems = data.scheduleItems;
    renderScheduleTable();
  }
});

// Highlight active schedule row
socket.on('schedule update', (data) => {
  if (data.active) {
    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach((row, index) => {
      const cell = row.querySelector('.row-number');
      if (index === data.currentItemIndex) {
        cell.classList.add('active-row-num');
      } else {
        cell.classList.remove('active-row-num');
      }
    });
  }
});
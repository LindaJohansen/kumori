const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes for Producer, Viewer, Countdown, and TD pages
app.get('/producer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'producer.html'));
});
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});
app.get('/countdown', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'countdown.html'));
});
app.get('/td', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'td.html'));
});

/* -------------------------------------
   1) DATE/TIME COUNTDOWN (OLD APPROACH)
-------------------------------------- */
let targetDateString = null;

/* -------------------------------------
   2) SCHEDULE-BASED COUNTDOWN STATE
-------------------------------------- */
let scheduleItems = []; // Array of { id, title, presenter, duration (min), tdNote, talentNote }
let scheduleActive = false;
let currentItemIndex = 0;
let timeLeft = 0; // in seconds

/* -------------------------------------
   SCHEDULE TIMER (runs every 1 second)
-------------------------------------- */
setInterval(() => {
  if (!scheduleActive || scheduleItems.length === 0) return;

  if (timeLeft > 0) {
    timeLeft--;
  } else {
    // Advance to next item
    currentItemIndex++;
    if (currentItemIndex >= scheduleItems.length) {
      // End of schedule
      scheduleActive = false;
      currentItemIndex = 0;
      timeLeft = 0;
      io.emit('schedule update', {
        active: false,
        currentItemIndex: -1,
        currentTitle: '',
        currentPresenter: '',
        nextTitle: 'No more items',
        nextPresenter: '',
        tdNote: '',
        talentNote: '',
        timeLeft: 0,
        serverTime: Date.now() // Sync server time
      });
      return;
    } else {
      timeLeft = scheduleItems[currentItemIndex].duration * 60;
    }
  }

  // Get current item info
  const currentItem = scheduleItems[currentItemIndex] || {};
  const currentTitle = currentItem.title || 'Untitled';
  const currentPresenter = currentItem.presenter || '';
  const tdNote = currentItem.tdNote || '';
  const talentNote = currentItem.talentNote || '';

  // Determine next item info
  const nextIndex = currentItemIndex + 1;
  let nextTitle = 'No more items';
  let nextPresenter = '';
  if (nextIndex < scheduleItems.length) {
    nextTitle = scheduleItems[nextIndex].title || 'Untitled';
    nextPresenter = scheduleItems[nextIndex].presenter || '';
  }

  // Emit updated schedule info with server timestamp
  io.emit('schedule update', {
    active: true,
    currentItemIndex,
    currentTitle,
    currentPresenter,
    nextTitle,
    nextPresenter,
    tdNote,
    talentNote,
    timeLeft,
    serverTime: Date.now() // Send current server timestamp for sync
  });
}, 1000);

/* -------------------------------------
   SOCKET.IO LOGIC
-------------------------------------- */
io.on('connection', (socket) => {
  console.log(`[${new Date().toLocaleTimeString('en-GB')}] A user connected`);

  // Date/Time Countdown
  socket.on('update countdown', (targetDate) => {
    targetDateString = targetDate || null;
    io.emit('update countdown', targetDateString);
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] Updated date/time countdown: ${targetDateString}`);
  });

  // Schedule: update entire schedule array
  socket.on('update schedule', (items) => {
    scheduleItems = items;
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] Schedule updated, ${items.length} items`);
  });

  // Schedule: start schedule mode
  socket.on('start schedule', () => {
    if (scheduleItems.length > 0) {
      scheduleActive = true;
      currentItemIndex = 0;
      timeLeft = scheduleItems[0].duration * 60;
      console.log(`[${new Date().toLocaleTimeString('en-GB')}] Schedule started`);
      
      const currentItem = scheduleItems[0];
      const currentTitle = currentItem.title || 'Untitled';
      const currentPresenter = currentItem.presenter || '';
      const tdNote = currentItem.tdNote || '';
      const talentNote = currentItem.talentNote || '';

      const nextIndex = 1;
      let nextTitle = 'No more items';
      let nextPresenter = '';
      if (nextIndex < scheduleItems.length) {
        nextTitle = scheduleItems[nextIndex].title || 'Untitled';
        nextPresenter = scheduleItems[nextIndex].presenter || '';
      }
      
      io.emit('schedule update', {
        active: true,
        currentItemIndex: 0,
        currentTitle,
        currentPresenter,
        nextTitle,
        nextPresenter,
        tdNote,
        talentNote,
        timeLeft,
        serverTime: Date.now()
      });
    }
  });

  // Schedule: Next Item
  socket.on('next item', () => {
    if (scheduleActive && scheduleItems.length > 0 && currentItemIndex < scheduleItems.length - 1) {
      currentItemIndex++;
      timeLeft = scheduleItems[currentItemIndex].duration * 60;
      const currentItem = scheduleItems[currentItemIndex];
      const currentTitle = currentItem.title || 'Untitled';
      const currentPresenter = currentItem.presenter || '';
      const tdNote = currentItem.tdNote || '';
      const talentNote = currentItem.talentNote || '';

      const nextIndex = currentItemIndex + 1;
      let nextTitle = 'No more items';
      let nextPresenter = '';
      if (nextIndex < scheduleItems.length) {
        nextTitle = scheduleItems[nextIndex].title || 'Untitled';
        nextPresenter = scheduleItems[nextIndex].presenter || '';
      }
      io.emit('schedule update', {
        active: true,
        currentItemIndex,
        currentTitle,
        currentPresenter,
        nextTitle,
        nextPresenter,
        tdNote,
        talentNote,
        timeLeft,
        serverTime: Date.now()
      });
    }
  });

  // Schedule: Previous Item
  socket.on('prev item', () => {
    if (scheduleActive && scheduleItems.length > 0 && currentItemIndex > 0) {
      currentItemIndex--;
      timeLeft = scheduleItems[currentItemIndex].duration * 60;
      const currentItem = scheduleItems[currentItemIndex];
      const currentTitle = currentItem.title || 'Untitled';
      const currentPresenter = currentItem.presenter || '';
      const tdNote = currentItem.tdNote || '';
      const talentNote = currentItem.talentNote || '';

      const nextIndex = currentItemIndex + 1;
      let nextTitle = 'No more items';
      let nextPresenter = '';
      if (nextIndex < scheduleItems.length) {
        nextTitle = scheduleItems[nextIndex].title || 'Untitled';
        nextPresenter = scheduleItems[nextIndex].presenter || '';
      }
      io.emit('schedule update', {
        active: true,
        currentItemIndex,
        currentTitle,
        currentPresenter,
        nextTitle,
        nextPresenter,
        tdNote,
        talentNote,
        timeLeft,
        serverTime: Date.now()
      });
    }
  });

  // Producer -> Viewer messages
  socket.on('producer message', (msg) => {
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] Message from producer: ${msg}`);
    io.emit('viewer update', msg);
  });

  socket.on('clear message', () => {
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] Clear message event received`);
    io.emit('viewer update', '');
  });

  // When a Producer connects, send current schedule
  socket.on('request schedule', () => {
    socket.emit('current schedule', {
      scheduleItems,
      scheduleActive,
      currentItemIndex,
      timeLeft
    });
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] A user disconnected`);
  });
});

// Start the server
http.listen(PORT, () => {
  console.log(`[${new Date().toLocaleTimeString('en-GB')}] Server is running on port ${PORT}`);
});
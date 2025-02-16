(function () {
   // Retrieve the configuration object defined in the HTML page.
   const config = window.scheduleConfig || {};
 
   // Helper function to update an element’s content.
   function updateElement(conf, content) {
     if (!conf || !conf.id) return;
     const el = document.getElementById(conf.id);
     if (!el) return;
     // If a prefix is defined (for example, to add a label), prepend it.
     if (conf.prefix) {
       content = conf.prefix + content;
     }
     if (conf.useHtml) {
       el.innerHTML = content;
     } else {
       el.textContent = content;
     }
   }
 
   // Establish the Socket.IO connection.
   const socket = io();
 
   // Shared state variables.
   let serverTimeOffset = 0;
   let scheduleActive = false;
   let timeLeft = 0;
   let lastServerSync = Date.now();
 
   let currentTitle = "";
   let currentPresenter = "";
   let nextTitle = "";
   let nextPresenter = "";
   let tdNote = "";
   let talentNote = "";
 
   /* ---------------------------------------------
     1) Receive Server Updates for Schedule
   --------------------------------------------- */
   socket.on("schedule update", function (data) {
     scheduleActive = data.active;
     if (!scheduleActive) {
       // Clear out elements when the schedule is inactive.
       if (config.countdown) updateElement(config.countdown, "");
       if (config.currentItemLine) updateElement(config.currentItemLine, "");
       if (config.nextItemLine) updateElement(config.nextItemLine, "");
       if (config.tdNoteLine) updateElement(config.tdNoteLine, "");
       if (config.talentNoteLine) updateElement(config.talentNoteLine, "");
       return;
     }
 
     // Synchronize time with the server.
     lastServerSync = Date.now();
     serverTimeOffset = lastServerSync - data.serverTime;
     timeLeft = data.timeLeft;
     currentTitle = data.currentTitle || "Untitled";
     currentPresenter = data.currentPresenter || "";
     nextTitle = data.nextTitle || "No more items";
     nextPresenter = data.nextPresenter || "";
     if (config.tdNoteLine) {
       tdNote = data.tdNote || "";
     }
     if (config.talentNoteLine) {
       talentNote = data.talentNote || "";
     }
 
     // Update the current item line.
     let currentContent = currentTitle;
     if (currentPresenter) {
       currentContent += " – " + currentPresenter;
     }
     updateElement(config.currentItemLine, currentContent);
 
     // Update the next item line.
     let nextContent = nextTitle;
     if (nextPresenter) {
       nextContent += " – " + nextPresenter;
     }
     updateElement(config.nextItemLine, nextContent);
 
     // Update the notes, if applicable.
     if (config.tdNoteLine) {
       updateElement(config.tdNoteLine, tdNote);
     }
     if (config.talentNoteLine) {
       updateElement(config.talentNoteLine, talentNote);
     }
   });
 
   /* ---------------------------------------------
     2) Sync Clock and Countdown Timer with Server Time
   --------------------------------------------- */
   function updateAll() {
     const now = new Date();
 
     // Update clock (displayed as HH:MM:SS).
     const hh = String(now.getHours()).padStart(2, "0");
     const mm = String(now.getMinutes()).padStart(2, "0");
     const ss = String(now.getSeconds()).padStart(2, "0");
     if (config.clock && config.clock.id) {
       const clockEl = document.getElementById(config.clock.id);
       if (clockEl) {
         clockEl.textContent = `${hh}:${mm}:${ss}`;
       }
     }
 
     // Update the countdown timer if the schedule is active.
     if (scheduleActive && config.countdown && config.countdown.id) {
       const elapsedTime = Math.floor(
         (Date.now() - lastServerSync - serverTimeOffset) / 1000
       );
       const adjustedTimeLeft = Math.max(timeLeft - elapsedTime, 0);
       const h = String(Math.floor(adjustedTimeLeft / 3600)).padStart(2, "0");
       const m = String(Math.floor((adjustedTimeLeft % 3600) / 60)).padStart(2, "0");
       const s = String(adjustedTimeLeft % 60).padStart(2, "0");
       const countdownEl = document.getElementById(config.countdown.id);
       if (countdownEl) {
         countdownEl.textContent = `${h}:${m}:${s}`;
       }
     }
   }
   setInterval(updateAll, 1000);
   updateAll();
 
   /* ---------------------------------------------
     3) Display Messages from Producer via Overlay
   --------------------------------------------- */
   socket.on("viewer update", function (message) {
     if (!config.overlay || !config.overlayMessage) return;
     const overlayEl = document.getElementById(config.overlay.id);
     const overlayMsgEl = document.getElementById(config.overlayMessage.id);
     if (!overlayEl || !overlayMsgEl) return;
     if (message.trim() !== "") {
       overlayMsgEl.textContent = message;
       overlayEl.classList.add("visible");
     } else {
       overlayEl.classList.remove("visible");
     }
   });
 })();
 
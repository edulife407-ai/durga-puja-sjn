import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onDisconnect, get, off } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// XSS Protection Helper
function escapeHtml(unsafe) {
  const div = document.createElement('div');
  div.textContent = unsafe;
  return div.innerHTML;
}

const firebaseConfig = {
  apiKey: "AIzaSyA7mMz0fq39MoiHwqq16ZpzBoN_-UH8xwI",
  authDomain: "puja-parikrama-c878f.firebaseapp.com",
  databaseURL: "https://puja-parikrama-c878f-default-rtdb.firebaseio.com",
  projectId: "puja-parikrama-c878f",
  storageBucket: "puja-parikrama-c878f.firebasestorage.app",
  messagingSenderId: "671069349387",
  appId: "1:671069349387:web:bc3ba9c6e44dabaf5d090e"
};

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);

  // Expose Firebase app for app.js auth initialization
  window.firebaseApp = app;
  window.app = app;

  window.firebaseDB = db;
  window.db = db;
  window.ref = ref;
  window.set = set;
  window.push = push;
  window.onValue = onValue;
  window.get = get;
} catch (error) { console.error("Firebase failed:", error); }

window.currentHubbaRoom = null;
window.currentPlanRoom = null;
window.isGroupRoutingActive = false;
window.roomApprovedPandals = {};
window.sidebarListeners = {};
window._hubbaChatUnsub = null;
window._hubbaRenderedChat = {}; 

// ==========================================
// UNIFIED BOTTOM SHEET CONTROLS
// ==========================================
window.openHubbaSheet = function() {
  const overlay = document.getElementById('hubba-sheet-overlay');
  const sheet = document.getElementById('hubba-bottom-sheet');

  if (overlay) overlay.classList.add('visible');
  if (sheet) {
    sheet.style.bottom = '';
    sheet.classList.add('open');
  }
};

window.closeHubbaSheet = function() {
  const overlay = document.getElementById('hubba-sheet-overlay');
  const sheet = document.getElementById('hubba-bottom-sheet');

  if (overlay) overlay.classList.remove('visible');
  if (sheet) {
    sheet.style.bottom = '';
    sheet.classList.remove('open');
  }
};

// Smooth Tab Switching & Liquid Slider Logic
window.switchHubbaTab = function(tabName) {
  const chatTab = document.getElementById('hubba-workspace-chat');
  const planTab = document.getElementById('hubba-workspace-plan');
  const chatBtn = document.getElementById('tab-btn-chat');
  const planBtn = document.getElementById('tab-btn-plan');
  const slider = document.getElementById('hubba-tab-slider'); 

  if (tabName === 'chat') {
    if (chatTab) chatTab.style.display = 'flex';
    if (planTab) planTab.style.display = 'none';
    if (chatBtn) chatBtn.classList.add('active');
    if (planBtn) planBtn.classList.remove('active');
    
    if (slider) { slider.classList.remove('plan-active'); slider.classList.add('chat-active'); }
  } else {
    if (chatTab) chatTab.style.display = 'none';
    if (planTab) planTab.style.display = 'flex';
    if (chatBtn) chatBtn.classList.remove('active');
    if (planBtn) planBtn.classList.add('active');
    
    if (slider) { slider.classList.remove('chat-active'); slider.classList.add('plan-active'); }
    
    if (window.currentPlanRoom && typeof window.renderFinalPlanList === 'function') {
      window.renderFinalPlanList();
    }
  }
};


// --- GROUP MODE STATE MANAGER & FLOATING BADGE ---
window.updateGroupModeBadge = function() {
  const soloBtn = document.getElementById('mode-solo');
  const groupBtn = document.getElementById('mode-group');

  if (window.isGroupRoutingActive && window.currentHubbaRoom) {
    if (soloBtn) soloBtn.classList.remove('active');
    if (groupBtn) groupBtn.classList.add('active');
  } else {
    if (soloBtn) soloBtn.classList.add('active');
    if (groupBtn) groupBtn.classList.remove('active');
  }

  let badge = document.getElementById('group-mode-badge');
  let hudContainer = document.getElementById('dynamic-hud-container');
  
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'group-mode-badge';
    badge.style.cssText = "background: #fffcf9; border: 2px solid #2ecc71; border-radius: 30px; padding: 6px 12px; display: none; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: all 0.3s ease; font-family: inherit; white-space: nowrap;";
    
    if (hudContainer) {
        hudContainer.prepend(badge);
    } else {
        document.body.appendChild(badge);
    }
  }

  if (window.isGroupRoutingActive && window.currentHubbaRoom) {
    let rooms = getSavedRooms();
    let roomObj = rooms.find(r => r.code === window.currentHubbaRoom);
    let roomName = roomObj ? roomObj.name : `Room ${window.currentHubbaRoom}`;

    badge.innerHTML = `
      <div onclick="window.openHubbaSheet()" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
        <span style="display:inline-block; width:8px; height:8px; background:#2ecc71; border-radius:50%; box-shadow: 0 0 8px #2ecc71;"></span>
        <span style="font-size: 0.9rem; font-weight: 700; color: #27ae60; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${roomName}</span>
      </div>
      <div style="width: 1px; height: 16px; background: #e0e0e0;"></div>
      <button onclick="window.exitGroupMode()" style="background: transparent; border: none; color: #888; font-size: 0.8rem; cursor: pointer; font-weight: bold; padding: 0; display:flex; align-items:center; transition: 0.2s;" onmouseover="this.style.color='#d92525'" onmouseout="this.style.color='#888'">Exit</button>
    `;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
};

window.handleGroupToggle = function() {
  if (window.currentHubbaRoom && window.isGroupRoutingActive) {
    window.openHubbaSheet();
  } else {
    if (typeof openHubbaModal === 'function') openHubbaModal();
    const widget = document.getElementById('active-hubbas-section');
    if (widget) widget.classList.remove('hubba-collapsed');
  }
};

window.exitGroupMode = function() {
  window.isGroupRoutingActive = false;
  window.currentHubbaRoom = null;
  window.currentPlanRoom = null;
  
  if (typeof window.updateGroupModeBadge === 'function') window.updateGroupModeBadge();
  if (typeof window.closeHubbaSheet === 'function') window.closeHubbaSheet();
  
  window.selectedPandals = [];
  
  const savedRoute = localStorage.getItem('parikrama_saved_route');
  if (savedRoute) {
     try { window.selectedPandals = JSON.parse(savedRoute); } 
     catch(e){ window.selectedPandals = []; }
  }
  
  window.isProposingForGroup = false;
  window.proposedPandals = [];
  document.body.classList.remove('proposal-mode', 'has-drafts');
  
  if (typeof window.resetApp === 'function') window.resetApp(false);
  
  if (typeof window.updateRouteActionBar === 'function') window.updateRouteActionBar();
  
  if (typeof window.renderPandals === 'function') {
     const currentTitle = document.getElementById('count-label') ? document.getElementById('count-label').innerText : "All Kolkata";
     window.renderPandals(window.currentPandals || window.allPandals, currentTitle);
  }
  
  if (typeof window.renderSidebarGroups === 'function') window.renderSidebarGroups();
};

// --- SIDEBAR & GROUP MEMORY ---
function getSavedRooms() {
  let rooms = JSON.parse(localStorage.getItem('my_hubba_rooms')) || [];
  return rooms.map(r => typeof r === 'string' ? { code: r, name: `Room: ${r}` } : r);
}
function saveRoomLocally(roomCode) {
  let rooms = getSavedRooms();
  if (!rooms.some(r => r.code === roomCode)) {
    rooms.push({ code: roomCode, name: `Room: ${roomCode}` });
    localStorage.setItem('my_hubba_rooms', JSON.stringify(rooms));
  }
  if (window.renderSidebarGroups) window.renderSidebarGroups();
}

window.renderSidebarGroups = function() {
  const containers = document.querySelectorAll('#my-groups-container, #mobile-groups-list');
  if (containers.length === 0) return;
  
  const rooms = getSavedRooms();
  let html = '';
  
  if (rooms.length === 0) {
    html = `<div style="padding: 10px; text-align: center; color: #d92525; font-size: 0.8rem; font-weight: bold; background: #fff5f5; border-radius: 8px;">No groups to display.<br>GO MAKE SOME FRIENDS!! 👯‍♂️</div>`;
  } else {
    rooms.forEach(room => {
      const isActive = window.currentHubbaRoom === room.code;
      const bg = isActive ? 'rgba(46, 204, 113, 0.1)' : '#fff';
      const border = isActive ? '1px solid #2ecc71' : '1px solid #ffe3e3';
      const pandalCount = window.roomApprovedPandals[room.code] ? window.roomApprovedPandals[room.code].length : 0;
      
      html += `
        <div style="display: flex; flex-direction: column; margin-bottom: 10px; border: ${border}; border-radius: 10px; background: #fff; box-shadow: 0 2px 6px rgba(122, 27, 38, 0.05); overflow: hidden;">
          
          <div style="display: flex; align-items: stretch;">
            <button class="cat-btn" style="flex-grow: 1; background: ${bg}; border: none; text-align: left; padding: 10px;" onclick="activateSavedGroup('${room.code}')">
              <strong style="color: #7a1b26; font-size: 0.95rem;">${isActive ? '🟢' : '⚪'} ${room.name}</strong>
              <span style="font-size: 0.7rem; color: #888; display: block; margin-top: 2px;">Code: ${room.code}</span>
            </button>
            
            <button style="width: 35px; background: #f8fafc; border-left: 1px solid #eee; border-right: 1px solid #eee; border-top: none; border-bottom: none; cursor: pointer; font-size: 0.8rem;" onclick="toggleGroupOptions('${room.code}')">✏️</button>
            <button style="width: 35px; background: #fff9e6; border: none; color: #b48512; cursor: pointer; font-size: 0.8rem;" onclick="toggleRoomDropdown('${room.code}')">▼</button>
          </div>

          <div id="actions-${room.code}" class="group-actions-panel" style="display: none;">
            <div style="display: flex; gap: 8px; width: 100%;">
              <button class="group-action-btn" style="flex: 1; background: transparent; border: 1.5px solid rgba(212,175,55,0.4) !important; color: #b48512;" onclick="prepRename('${room.code}', '${room.name}')">✏️ Rename</button>
              <button class="group-action-btn" style="flex: 1; background: #fff5f5; border: 1.5px solid rgba(217,37,37,0.15) !important; color: #d92525;" onclick="prepDelete('${room.code}')">🗑️ Delete</button>
            </div>
          </div>

          <div id="room-dropdown-${room.code}" style="display: none; padding: 10px; background: #fdfbf7; border-top: 1px solid #eee;">
            <button onclick="openPlanDashboard('${room.code}')" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #fffcf9, #fff5e6); border: 1px solid rgba(212, 175, 55, 0.5); padding: 10px 14px; border-radius: 8px; cursor: pointer; color: #7a1b26; font-weight: bold; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(122, 27, 38, 0.05); transition: 0.2s;">
              <span>📝 Plan 1</span>
              <span style="font-size: 0.75rem; color: #b48512; background: rgba(212, 175, 55, 0.15); padding: 4px 10px; border-radius: 12px;" id="plan-count-badge-${room.code}">${pandalCount} Approved</span>
            </button>
          </div>
        </div>
      `;

      if (!window.sidebarListeners[room.code]) {
        const chatRef = window.ref(window.db, `rooms/${room.code}/chat`);
        window.onValue(chatRef, (snapshot) => {
          let approved = [];
          snapshot.forEach((child) => {
            const msg = child.val();
            if (msg.type === "multi_proposal") {
              msg.pandals.forEach((pName, pIndex) => {
                let up = 0, down = 0;
                if (msg.votes && msg.votes[pIndex]) {
                  Object.values(msg.votes[pIndex]).forEach(v => { if(v==='up') up++; else down++; });
                }
                if (up > down) approved.push(pName);
              });
            }
          });
          
          const uniqueApproved = [...new Set(approved)];
          window.roomApprovedPandals[room.code] = uniqueApproved;
          
          document.querySelectorAll(`[id="plan-count-badge-${room.code}"]`).forEach(badgeEl => {
              badgeEl.innerText = `${uniqueApproved.length} Approved`;
          });
        });

        const activeRouteRef = window.ref(window.db, `rooms/${room.code}/activeRoute`);
        window.onValue(activeRouteRef, (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.val();
          if (window.currentHubbaRoom === room.code && window.isGroupRoutingActive) {
            window.startPoint = data.startPoint;
            window.selectedPandals = data.pandals || [];
            const textEl = document.getElementById('start-pill-text');
            if (textEl && window.startPoint) textEl.innerText = "📍 " + window.startPoint.name;
          }
        });

        window.sidebarListeners[room.code] = true;
      }
    });
  }

  containers.forEach(c => c.innerHTML = html);
};

window.addEventListener('DOMContentLoaded', () => { if (window.renderSidebarGroups) window.renderSidebarGroups(); });

window.toggleGroupOptions = function(code) {
  document.querySelectorAll(`[id="actions-${code}"]`).forEach(panel => {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });
};

window.toggleRoomDropdown = function(code) {
  document.querySelectorAll(`[id="room-dropdown-${code}"]`).forEach(panel => {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });
};

window.prepDelete = function(code) {
  document.querySelectorAll(`[id="actions-${code}"]`).forEach(panel => {
    panel.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:8px; box-sizing:border-box;"><span style="font-size:0.85rem; color:#d92525; font-weight:800; white-space:nowrap;">Delete group?</span><div style="display:flex; gap:6px; flex-shrink:0;"><button class="group-action-btn" style="background:#f1f5f9; color:#475569; padding:8px 12px; font-size:0.8rem;" onclick="renderSidebarGroups()">Cancel</button><button class="group-action-btn delete" style="background:#d92525; color:#fff; padding:8px 12px; font-size:0.8rem;" onclick="confirmDelete('${code}')">Yes</button></div></div>`;
  });
};

window.confirmDelete = function(code) {
  let rooms = getSavedRooms().filter(r => r.code !== code);
  localStorage.setItem('my_hubba_rooms', JSON.stringify(rooms));
  
  if (window.currentHubbaRoom === code) {
     if (typeof window.exitGroupMode === 'function') window.exitGroupMode();
  } else {
     window.renderSidebarGroups();
  }
};

window.prepRename = function(code, currentName) {
  document.querySelectorAll(`[id="actions-${code}"]`).forEach(panel => {
    panel.innerHTML = `<div style="display:flex; width:100%; gap:8px; align-items:center; box-sizing:border-box;"><input type="text" class="rename-input-${code}" style="flex:1; min-width:0; padding:10px 14px; font-size:0.9rem; border-radius:50px; border:1.5px solid rgba(212,175,55,0.4); outline:none; background:#fffcf9; color:#4a0e17; font-family:inherit; transition:0.2s;" value="${currentName}" onfocus="this.style.borderColor='#d4af37';" onkeyup="if(event.key === 'Enter') confirmRename('${code}')"><button class="group-action-btn edit" style="background:linear-gradient(135deg, #d4af37, #b48512); color:#fff; border:none; padding:10px 16px; flex-shrink:0;" onclick="confirmRename('${code}')">Save</button></div>`;
  });

  setTimeout(() => {
    document.querySelectorAll(`.rename-input-${code}`).forEach(input => {
      if (input.getBoundingClientRect().width > 0) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }, 50);
};

window.confirmRename = function(code) {
  let newName = "";
  
  document.querySelectorAll(`.rename-input-${code}`).forEach(input => { 
    if (input.value.trim() !== "") newName = input.value.trim(); 
  });
  
  if (!newName) return window.renderSidebarGroups();
  
  let rooms = getSavedRooms();
  let room = rooms.find(r => r.code === code);
  if (room) room.name = newName;
  localStorage.setItem('my_hubba_rooms', JSON.stringify(rooms));
  
  window.renderSidebarGroups();
  
  if (window.currentHubbaRoom === code) {
    const dashName = document.getElementById('dashboard-group-name');
    if (dashName) dashName.innerText = newName;
    if (typeof window.updateGroupModeBadge === 'function') window.updateGroupModeBadge();
  }
};

// --- PLAN 1 LOGIC ---
window.openPlanDashboard = function(roomCode) {
  window.currentPlanRoom = roomCode;
  window.currentHubbaRoom = roomCode;
  window.isGroupRoutingActive = true;
  window.updateGroupModeBadge();

  window.openHubbaSheet();
  window.switchHubbaTab('plan');

  window.startPoint = null; 
  const pillText = document.getElementById('start-pill-text');
  if (pillText) pillText.innerText = "Where to start?";
  
  const startBtn = document.getElementById('plan-start-btn');
  if (startBtn) {
     startBtn.innerHTML = `📍 Add Starting Point`;
     startBtn.style.cssText = "width: 100%; background: #fffcf9; border: 2px dashed #d92525; color: #d92525; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 1rem; cursor: pointer; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;";
  }

  get(ref(window.firebaseDB, `rooms/${roomCode}/startPoint`)).then((snap) => {
    if (snap.exists()) {
       const existing = snap.val();
       if (startBtn) {
         const shortName = existing.data.name.length > 18 ? existing.data.name.substring(0, 18) + '...' : existing.data.name;
         startBtn.innerHTML = `<span>✅ Start: ${shortName}</span>`;
         startBtn.style.cssText = "width: 100%; background: #e8f5e9; border: 2px solid #2ecc71; color: #27ae60; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 1rem; cursor: pointer; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;";
         window.startPoint = existing.data; 
       }
    }
  });
};

window.closePlanDashboard = function() {
  window.closeHubbaSheet();
};

window.renderFinalPlanList = function() {
  if (!window.currentPlanRoom) return;
  const pandals = window.roomApprovedPandals[window.currentPlanRoom] || [];
  const listContainer = document.getElementById('plan-final-list');
  if (!listContainer) return;
  
  if (pandals.length === 0) {
    listContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #888; font-style: italic; background: #fff; border: 1px solid #f1f5f9; border-radius: 12px;">No pandals have been voted in yet! <br><br> Flip to the Chat tab and vote 👍 to add them.</div>`;
    return;
  }
  
  listContainer.innerHTML = pandals.map(p => `
    <div class="plan-final-item">
      <strong>${p}</strong>
      <button class="plan-final-remove" onclick="removePandalFromPlan('${p}')">✕</button>
    </div>
  `).join('');
};

window.removePandalFromPlan = function(pandalName) {
  if (!window.currentPlanRoom) return;
  const roomPandals = window.roomApprovedPandals[window.currentPlanRoom] || [];
  const index = roomPandals.indexOf(pandalName);
  if (index > -1) {
    roomPandals.splice(index, 1);
    window.roomApprovedPandals[window.currentPlanRoom] = roomPandals;
  }
  window.renderFinalPlanList();
  const badgeEl = document.getElementById(`plan-count-badge-${window.currentPlanRoom}`);
  if (badgeEl) badgeEl.innerText = `${roomPandals.length} Approved`;
};

window.openHubbaStartPicker = async function() {
  const currentRoom = window.currentPlanRoom; 
  const myName = window.currentUser ? (window.currentUser.displayName || "Explorer") : "Explorer";
  
  const snap = await get(ref(window.firebaseDB, `rooms/${currentRoom}/startPoint`));
  if (snap.exists()) {
      const existing = snap.val();
      if (existing.setter !== myName) {
          const override = confirm(`⚠️ ${existing.setter} already set the group's starting point to "${existing.data.name}".\n\nDo you want to override and delete their starting point?`);
          if (!override) return;
      }
  }

  window.startPoint = null; 
  const pillText = document.getElementById('start-pill-text');
  if (pillText) pillText.innerText = "Where to start?";

  window.closeHubbaSheet();
  
  const startPillBox = document.getElementById('start-pill-box');
  if (startPillBox && !startPillBox.classList.contains('expanded')) {
    if (typeof toggleStartPill === 'function') toggleStartPill(true);
  }

  const checkInterval = setInterval(() => {
    const isPillClosed = startPillBox && !startPillBox.classList.contains('expanded');
    
    if (window.startPoint || isPillClosed) {
      clearInterval(checkInterval); 
      
      if (window.startPoint) {
         set(ref(window.firebaseDB, `rooms/${currentRoom}/startPoint`), {
             data: window.startPoint,
             setter: myName
         });
      }
      window.openPlanDashboard(currentRoom);
    }
  }, 500);
};

window.executeFinalPlan = function() {
  const activeRoom = window.currentPlanRoom;
  if (!activeRoom) return;

  const finalPandals = window.roomApprovedPandals[activeRoom] || [];
  if (finalPandals.length === 0) return alert("You need at least one pandal to plan a route!");

  if (!window.startPoint) {
    const startBtn = document.getElementById('plan-start-btn');
    if (startBtn) {
      startBtn.classList.remove('blink-error');
      void startBtn.offsetWidth; 
      startBtn.classList.add('blink-error');
    }
    return;
  }

  const dataPool = window.allPandals || window.currentPandals || [];
  const fullPandalObjects = [];

  finalPandals.forEach(approvedName => {
     let match = dataPool.find(p => p.name === approvedName);
     if (!match) {
         const cleanApproved = String(approvedName).toLowerCase().replace(/[^a-z0-9]/g, '');
         match = dataPool.find(p => {
             const cleanPName = String(p.name).toLowerCase().replace(/[^a-z0-9]/g, '');
             return cleanPName.includes(cleanApproved) || cleanApproved.includes(cleanPName);
         });
     }
     if (match) fullPandalObjects.push(match);
  });

  if (fullPandalObjects.length === 0) {
    return alert("Fatal Error: Could not map pandals. Try creating a new Hubba room.");
  }

  window.closeHubbaSheet();
  
  const shareBtn = document.querySelector('.share-btn');
  if (shareBtn) shareBtn.style.display = 'none';

  window.selectedPandals = fullPandalObjects;

  const activeRouteRef = ref(window.firebaseDB, `rooms/${activeRoom}/activeRoute`);
  set(activeRouteRef, {
      startPoint: window.startPoint,
      pandals: fullPandalObjects,
      timestamp: Date.now()
  });

  const myName = window.currentUser ? (window.currentUser.displayName || "Explorer") : "Explorer";
  const myPhoto = window.currentUser ? window.currentUser.photoURL : null;

  push(ref(window.firebaseDB, `rooms/${activeRoom}/chat`), {
      type: "route_ready", 
      sender: myName, 
      photoURL: myPhoto,
      pandalCount: fullPandalObjects.length,
      startName: window.startPoint.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      timestamp: Date.now()
  });
  
  if (typeof window.applyGroupRoute === 'function') {
      window.applyGroupRoute(true, fullPandalObjects);
  } else {
      if (typeof window.generateSmartRoute === 'function') window.generateSmartRoute();
  }
};

window.applyGroupRoute = async function(isHost = false, localPandals = []) {
  window.closeHubbaSheet();
  
  window.isGroupRoutingActive = true;
  window.updateGroupModeBadge();
  
  if (isHost) {
      window.selectedPandals = localPandals;
  } else {
      const roomToSync = window.currentPlanRoom || window.currentHubbaRoom;
      if (!roomToSync || !window.firebaseDB) return;

      try {
        const { get, ref } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const snap = await get(ref(window.firebaseDB, `rooms/${roomToSync}/activeRoute`));
        
        if (snap.exists()) {
            const data = snap.val();
            window.startPoint = data.startPoint;
            window.selectedPandals = data.pandals || [];
        } else {
            alert("Loading route data... please try clicking again.");
            return;
        }
      } catch (e) { console.error("Sync error:", e); }
  }

  if (typeof window.generateSmartRoute === 'function') {
      window.generateSmartRoute();
      
      setTimeout(() => {
        const itineraryPanel = document.getElementById('itinerary-content');
        if (itineraryPanel) {
          const syncBadge = document.createElement('div');
          syncBadge.innerHTML = '<div style="background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; padding: 10px; border-radius: 8px; margin-bottom: 15px; color: #27ae60; font-weight: bold; font-size: 0.9rem; text-align: center; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2);">✨ Hubba Group Route Synced Live</div>';
          itineraryPanel.prepend(syncBadge);
        }
      }, 500);
  }
};

window.activateSavedGroup = function(roomCode) {
  if (typeof window.resetApp === 'function') window.resetApp(true);
  
  window.currentHubbaRoom = roomCode;
  window.currentPlanRoom = roomCode; 
  
  window.isGroupRoutingActive = true;
  window.updateGroupModeBadge();

  window.openHubbaSheet();
  window.switchHubbaTab('chat');

  // USE THE LOGGED IN ACCOUNT NOW!
  const myName = window.currentUser ? (window.currentUser.displayName || "Explorer") : "Explorer";
  const myUID = window.currentUser ? window.currentUser.uid : "anon_" + Date.now();
  
  const newPlayerRef = ref(db, `rooms/${roomCode}/players/${myUID}`);
  set(newPlayerRef, { name: myName, status: 'online' });
  onDisconnect(newPlayerRef).remove();
  
  if (window.renderSidebarGroups) window.renderSidebarGroups(); 

  let rooms = getSavedRooms();
  let roomObj = rooms.find(r => r.code === roomCode);
  document.getElementById('dashboard-group-name').innerText = roomObj ? roomObj.name : `Room ${roomCode}`;
  document.getElementById('dashboard-group-code').innerText = roomCode;

  const chatRef = ref(db, `rooms/${roomCode}/chat`);
  if (typeof window._hubbaChatUnsub === 'function') {
    window._hubbaChatUnsub();
    window._hubbaChatUnsub = null;
  }

  const renderChatSnapshot = (snapshot) => {
    const feed = document.getElementById('hubba-chat-messages');
    if (!feed) return;

    const wasNearBottom = (feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 80;
    const prevScrollTop = feed.scrollTop;
    const prevScrollHeight = feed.scrollHeight;
    const htmlParts = ['<div style="text-align: center; color: #b8860b; font-size: 0.75rem; margin: 5px 0; flex-shrink:0;">Secure Hubba Room Connected \u2728</div>'];

    let hasMessages = snapshot.exists();
    let hasProposals = false;

    snapshot.forEach((child) => {
      const msgId = child.key;
      const msg = child.val() || {};
      const isMe = msg.uid === myUID;

      // Build Avatar HTML if available
      let avatarHTML = '';
      if (!isMe && msg.photoURL) {
          avatarHTML = `<img src="${escapeHtml(msg.photoURL)}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 6px; display: inline-block; vertical-align: middle;">`;
      }

      if (msg.type === "text" || !msg.type) {
        htmlParts.push(`<div class="chat-bubble ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msgId}"><span class="chat-sender" style="display:flex; align-items:center;">${avatarHTML}${isMe ? 'You' : escapeHtml(msg.sender || '')}</span><p style="margin:0;">${escapeHtml(msg.text || '')}</p><span class="chat-time">${escapeHtml(msg.time || '')}</span></div>`);
      } else if (msg.type === "multi_proposal") {
        hasProposals = true;
        const pandals = Array.isArray(msg.pandals) ? msg.pandals : [];
        let itemsHtml = '';
        pandals.forEach((pName, pIndex) => {
          let up = 0, down = 0;
          if (msg.votes && msg.votes[pIndex]) {
            Object.values(msg.votes[pIndex]).forEach(v => { if (v === 'up') up++; else down++; });
          }
          const myVote = (msg.votes && msg.votes[pIndex] && msg.votes[pIndex][myUID]) || '';
          itemsHtml += `<div class="multi-proposal-item"><div class="proposal-title">${escapeHtml(pName)}</div><div class="vote-panel-mini"><button class="vote-btn-mini up${myVote === 'up' ? ' active' : ''}" onclick="castVote('${msgId}', ${pIndex}, 'up')">\uD83D\uDC4D ${up}</button><button class="vote-btn-mini down${myVote === 'down' ? ' active' : ''}" onclick="castVote('${msgId}', ${pIndex}, 'down')">\uD83D\uDC4E ${down}</button></div></div>`;
        });
        htmlParts.push(`<div class="chat-bubble proposal ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msgId}"><span class="chat-sender" style="display:flex; align-items:center;">\u2728 ${avatarHTML}${isMe ? 'You' : escapeHtml(msg.sender || '')} proposed a route:</span><div class="multi-proposal-container">${itemsHtml}</div><span class="chat-time" style="display:block; text-align:right; margin-top:8px; float:none;">${escapeHtml(msg.time || '')}</span></div>`);
      } else if (msg.type === "route_ready") {
        htmlParts.push(`
        <div class="chat-bubble ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msgId}" style="background: #e8f5e9; border: 1px solid #2ecc71; width: 95%; max-width: 320px; padding: 12px; box-shadow: 0 2px 8px rgba(46, 204, 113, 0.2);">
          <span class="chat-sender" style="color: #27ae60; display:flex; align-items:center;">\uD83D\uDDFA\uFE0F ${avatarHTML}${isMe ? 'You' : escapeHtml(msg.sender || '')} finalized the route!</span>
          <div style="font-size: 0.85rem; color: #1e8449; margin-bottom: 8px;"><strong>Start:</strong> ${escapeHtml(msg.startName || '')}<br><strong>Pandals:</strong> ${parseInt(msg.pandalCount, 10) || 0} stops</div>
          <button onclick="applyGroupRoute(false)" style="background:#2ecc71; color:white; border:none; padding:12px; border-radius:10px; width:100%; font-weight:bold; cursor:pointer; font-size:1rem; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);">View on Map \uD83D\uDDFA\uFE0F</button>
          <span class="chat-time" style="display:block; text-align:right; margin-top:5px; float:none;">${escapeHtml(msg.time || '')}</span>
        </div>`);
      }
    });

    const nextHtml = htmlParts.join('');
    if (window._hubbaRenderedChat[roomCode] !== nextHtml) {
      feed.innerHTML = nextHtml;
      window._hubbaRenderedChat[roomCode] = nextHtml;
      if (wasNearBottom) {
        feed.scrollTop = feed.scrollHeight;
      } else {
        feed.scrollTop = prevScrollTop + (feed.scrollHeight - prevScrollHeight);
      }
    }

    const pillContainer = document.getElementById('hubba-pill-container');
    const dynamicPillTitle = document.getElementById('dynamic-pill-title');
    if (pillContainer) pillContainer.className = hasMessages ? "pill-state-top" : "pill-state-center";
    if (dynamicPillTitle) dynamicPillTitle.innerText = hasProposals ? "Add Pandals" : "Make a Plan";
  };

  onValue(chatRef, renderChatSnapshot);
  window._hubbaChatUnsub = () => off(chatRef, 'value', renderChatSnapshot);
};

window.closeGroupDashboard = function() {
  window.closeHubbaSheet();
};

window.castVote = function(msgId, pandalIndex, voteType) {
  if (!window.currentHubbaRoom || !window.db) return;
  const myUID = window.currentUser ? window.currentUser.uid : "anon_" + Date.now();
  const voteRef = ref(window.db, `rooms/${window.currentHubbaRoom}/chat/${msgId}/votes/${pandalIndex}/${myUID}`);
  set(voteRef, voteType);
};

window.sendHubbaMessage = function() {
  const input = document.getElementById('hubba-chat-input');
  if (!input) return;
  const messageText = input.value.trim();
  if (messageText === "") return;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const myName = window.currentUser ? (window.currentUser.displayName || "Explorer") : "Explorer";
  const myUID = window.currentUser ? window.currentUser.uid : "anon_" + Date.now();
  const myPhoto = window.currentUser ? window.currentUser.photoURL : null;

  if (window.currentHubbaRoom && typeof window.push === 'function' && window.db) {
    window.push(window.ref(window.db, `rooms/${window.currentHubbaRoom}/chat`), {
      type: "text", 
      sender: myName, 
      uid: myUID,
      photoURL: myPhoto,
      text: messageText,
      time: timeString, 
      timestamp: Date.now()
    });
  } else {
    // Failsafe local echo
    const chatContainer = document.getElementById('hubba-chat-messages');
    if (chatContainer) {
      const msgHTML = `
        <div class="chat-msg-wrapper sent">
          <div class="chat-bubble">
            <span class="chat-sender">You</span>
            <p style="margin:0;">${escapeHtml(messageText)}</p>
            <span class="chat-time">${timeString}</span>
          </div>
        </div>
      `;
      chatContainer.insertAdjacentHTML('beforeend', msgHTML);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
  
  input.value = '';
};

// ==========================================
// ROOM CREATION & JOINING LOGIC
// ==========================================
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

window.generateRoom = function() {
  const myName = window.currentUser ? (window.currentUser.displayName || "Explorer") : "Explorer";
  const myUID = window.currentUser ? window.currentUser.uid : "anon_" + Date.now();

  const roomCode = generateRandomCode();
  const roomRef = window.ref(window.db, `rooms/${roomCode}`);

  window.set(roomRef, {
    created: Date.now(),
    host: myName,
    players: {
      [myUID]: { 
        name: myName, 
        status: 'online' 
      }
    }
  }).then(() => {
    document.getElementById('hubba-display-code').innerText = roomCode;
    document.getElementById('hubba-generated-code-box').style.display = 'block';
    if (typeof saveRoomLocally === 'function') saveRoomLocally(roomCode);
  }).catch((error) => {
    console.error("Error creating room:", error);
    alert("Server error: " + error.message);
  });
};

window.joinRoomViaCode = function() {
  const codeInput = document.getElementById('hubba-join-code').value.trim().toUpperCase();

  if (!codeInput || codeInput.length !== 6) {
    alert("Please enter a valid 6-digit room code.");
    return;
  }

  window.get(window.ref(window.db, `rooms/${codeInput}`)).then((snapshot) => {
    if (snapshot.exists()) {
      if (typeof saveRoomLocally === 'function') saveRoomLocally(codeInput);
      
      if (typeof window.closeHubbaModal === 'function') window.closeHubbaModal();
      if (typeof window.activateSavedGroup === 'function') window.activateSavedGroup(codeInput);
    } else {
      alert("Room not found. Please check the code and try again.");
    }
  }).catch((error) => {
    console.error("Error joining room:", error);
    alert("Server error: " + error.message);
  });
};

window.shareHubbaToWhatsApp = function() {
  const code = document.getElementById('hubba-display-code').innerText;
  const baseUrl = window.location.origin + window.location.pathname;
  const text = `🎪 Let's plan our Durga Puja route together!\n\nJoin my live Parikrama room.\n*Code:* ${code}\n\nEnter the code here: ${baseUrl}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
};

// ==========================================
// OFFLINE GPX EXPORT & ROUTE VAULT ENGINE
// ==========================================
window.activeGeneratedRoute = [];

window.saveRouteToVault = async function(routeArray) {
  if (!window.currentUser || !window.firebaseDB) {
      console.warn("User not logged in. Cannot save to cloud vault.");
      return;
  }

  const myUID = window.currentUser.uid;
  
  // Tag the route based on their current mode
  const mode = window.isGroupRoutingActive ? 'group' : 'solo';
  const routeCode = window.isGroupRoutingActive ? window.currentHubbaRoom : 'Personal';

  const newRoute = {
    id: 'RT-' + Date.now(),
    mode: mode,
    code: routeCode,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    stopCount: routeArray.length - 1, // Exclude start point
    startName: routeArray[0].name,
    stops: routeArray
  };

  try {
      const { ref, get, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
      const vaultRef = ref(window.firebaseDB, `users/${myUID}/route_vault`);
      
      const snap = await get(vaultRef);
      let vault = snap.exists() ? snap.val() : [];

      // Prevent spam: Don't save if it's the exact same route they just generated
      if (vault.length > 0 && JSON.stringify(vault[0].stops) === JSON.stringify(routeArray)) return;

      vault.unshift(newRoute); // Push to the top of the cloud vault
      await set(vaultRef, vault);
  } catch (e) {
      console.error("Failed to save route to cloud vault", e);
  }
};

window.exportActiveRouteToGPX = function() {
  const routeArray = window.activeGeneratedRoute;
  if (!routeArray || routeArray.length === 0) {
    alert("No active route to download!");
    return;
  }

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  gpx += `<gpx version="1.1" creator="Durga Puja Parikrama">\n`;
  gpx += `  <trk>\n`;
  gpx += `    <name>My Parikrama Route</name>\n`;
  gpx += `    <trkseg>\n`;

  routeArray.forEach(stop => {
    const safeName = stop.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    gpx += `      <trkpt lat="${stop.lat}" lon="${stop.lng}">\n`;
    gpx += `        <name>${safeName}</name>\n`;
    gpx += `      </trkpt>\n`;
  });

  gpx += `    </trkseg>\n`;
  gpx += `  </trk>\n`;
  gpx += `</gpx>`;

  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Parikrama_Route_${new Date().getTime()}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==========================================
// 1. DESKTOP/MOBILE ROUTE ARCHIVE VAULT
// ==========================================
window.renderRouteArchive = async function() {
  const list = document.getElementById('route-history-list');
  if (!list) return;

  if (!window.currentUser || !window.firebaseDB) {
      list.innerHTML = `<div style="text-align:center; padding: 30px; color:#888; font-weight: 600;">Please log in to view your Route Vault.</div>`;
      return;
  }

  try {
      const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
      const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
      const snap = await get(vaultRef);
      
      let vault = snap.exists() ? snap.val() : [];
      
      // Smart Filtering: Show Group routes if in a room, otherwise show Solo routes
      if (window.currentHubbaRoom) {
         vault = vault.filter(r => r.mode === 'group' && r.code === window.currentHubbaRoom);
      } else {
         vault = vault.filter(r => r.mode === 'solo');
      }

      if (vault.length === 0) {
         list.innerHTML = `<div style="text-align:center; padding: 30px; color:#888; font-weight: 600;">No routes saved yet.<br><br>Generate a plan to save it here!</div>`;
         return;
      }

      let historyHTML = `<div><div class="history-date-group">${window.currentHubbaRoom ? 'Group' : 'Solo'} Cloud Vault</div>`;
      vault.forEach((route) => {
         const routeText = route.stops.map(s => s.name).join(' ➔ ');
         
         historyHTML += `
           <div class="history-card" style="margin-bottom: 12px; border-left: 4px solid #d92525; background: #fff;">
             <div class="history-card-header" style="display:flex; justify-content:space-between; font-weight:800; color:#4a0e17; margin-bottom:8px; font-size: 0.9rem;">
               <span>📍 ${route.startName} (${route.stopCount} Stops)</span>
               <span style="color:#888; font-size: 0.75rem; font-weight: normal;">${route.date}</span>
             </div>
             <div class="history-card-route" style="font-size:0.85rem; color:#7a1b26; margin-bottom:12px; line-height:1.5;">${routeText}</div>
             
             <div style="display:flex; gap:8px;">
                 <button class="history-card-btn" style="flex:1; background: rgba(46, 204, 113, 0.1); color: #27ae60; border: 1px solid rgba(46, 204, 113, 0.3); padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;" onclick="loadArchivedRoute('${route.id}')">🗺 Load Route</button>
                 <button class="history-card-btn" style="flex:1; background: #fff5f5; color: #d92525; border: 1px solid rgba(217,37,37,0.2); padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;" onclick="deleteArchivedRoute('${route.id}')">🗑️ Delete</button>
             </div>
           </div>
         `;
      });
      historyHTML += `</div>`;
      list.innerHTML = historyHTML;
      
  } catch (e) {
      list.innerHTML = `<div style="text-align:center; padding: 30px; color:#d92525; font-weight: 600;">Failed to load vault.</div>`;
  }
};

window.deleteArchivedRoute = async function(id) {
   if (!window.currentUser || !window.firebaseDB) return;

   try {
       const { ref, get, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
       const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
       
       const snap = await get(vaultRef);
       if (snap.exists()) {
           let vault = snap.val();
           vault = vault.filter(r => r.id !== id);
           await set(vaultRef, vault);
           
           if (typeof window.renderRouteArchive === 'function') window.renderRouteArchive();
           if (typeof window.renderMobileRoutes === 'function') window.renderMobileRoutes();
       }
   } catch (e) {
       console.error("Failed to delete route", e);
   }
};

window.loadArchivedRoute = async function(id) {
   if (!window.currentUser || !window.firebaseDB) return;

   try {
       const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
       const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
       const snap = await get(vaultRef);
       
       if (snap.exists()) {
           let vault = snap.val();
           let route = vault.find(r => r.id === id);
           if(!route) return;
           
           window.startPoint = route.stops[0];
           window.selectedPandals = route.stops.slice(1); 
           
           const textEl = document.getElementById('start-pill-text');
           if (textEl) textEl.innerText = "📍 " + window.startPoint.name;
           
           document.getElementById('hubba-route-history-panel').classList.remove('open');
           
           if (typeof window.generateSmartRoute === 'function') window.generateSmartRoute();
       }
   } catch (e) {
       console.error("Failed to load archived route", e);
   }
};

window.toggleRouteHistory = function() {
  const panel = document.getElementById('hubba-route-history-panel');
  if (!panel) return;
  if (panel.classList.contains('open')) { 
     panel.classList.remove('open'); 
  } else { 
     panel.classList.add('open'); 
     window.renderRouteArchive(); 
  }
};
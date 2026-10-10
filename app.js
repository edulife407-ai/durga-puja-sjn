// STATE VARIABLES
var currentPandals = []; 
var markersData = [];
var selectedPandals = [];
var routeLine = null;
var startPoint = null; 
var userLocation = null;
var userMarker = null;
var gpsWatchId = null;

// ==========================================
// CENTRALIZED ACTION BAR UI MANAGER
// ==========================================
window.updateRouteActionBar = function() {
  const routeBtn = document.getElementById('generate-route-btn');
  const actBar = document.getElementById('proposal-action-bar');
  if (!routeBtn || !actBar) return;

  if (window.isProposingForGroup) {
    if (window.proposedPandals && window.proposedPandals.length >= 1) {
      routeBtn.style.display = "block";
      routeBtn.innerText = `Propose these Pandals (${window.proposedPandals.length})`;
      actBar.classList.add('has-visible-btn');
    } else {
      routeBtn.style.display = "none";
      actBar.classList.remove('has-visible-btn');
    }
  } else {
    if (selectedPandals && selectedPandals.length >= 1) {
      routeBtn.style.display = "block";
      routeBtn.innerText = window.isGroupRoutingActive ? `Group Route (${selectedPandals.length})` : `Plan Route (${selectedPandals.length})`;
      actBar.classList.add('has-visible-btn');
    } else {
      routeBtn.style.display = "none";
      actBar.classList.remove('has-visible-btn');
    }
  }
};

// ==========================================
// METRO MODE: FULL STATION SEARCH ENGINE
// ==========================================
window.isMetroModeActive = false;
let metroLayerGroup = L.layerGroup();
let activePolylines = {};
let activeMetroHalo = null;

const metroRoutes = {
  blue: { color: "#0ea5e9", coords: [[22.654, 88.363], [22.640, 88.392], [22.622, 88.415], [22.602, 88.373], [22.585, 88.361], [22.564, 88.351], [22.544, 88.346], [22.520, 88.346], [22.497, 88.344], [22.471, 88.396]] },
  green: { color: "#2ecc71", coords: [[22.586, 88.337], [22.583, 88.343], [22.570, 88.347], [22.564, 88.351], [22.567, 88.371], [22.574, 88.403], [22.579, 88.432]] },
  orange: { color: "#ff9800", coords: [[22.471, 88.396], [22.484, 88.401], [22.513, 88.403], [22.541, 88.401], [22.562, 88.406]] },
  purple: { color: "#9b59b6", coords: [[22.445, 88.301], [22.476, 88.309], [22.508, 88.318], [22.527, 88.324]] },
  yellow: { color: "#f1c40f", coords: [[22.640, 88.392], [22.628, 88.411]] }
};

window.metroStations = [
  { name: "Dakshineswar", line: "Blue", lat: 22.654, lng: 88.363, tip: "Gateway to North Kolkata pujas." },
  { name: "Baranagar", line: "Blue", lat: 22.646, lng: 88.377, tip: "Exit for local Sinthee pujas." },
  { name: "Noapara", line: "Blue", lat: 22.640, lng: 88.392, tip: "Interchange station." },
  { name: "Dum Dum", line: "Blue", lat: 22.622, lng: 88.415, tip: "Use Gate 3 for Sreebhumi route autos." },
  { name: "Belgachia", line: "Blue", lat: 22.607, lng: 88.389, tip: "Walkable to Tala Prattoy." },
  { name: "Shyambazar", line: "Blue", lat: 22.602, lng: 88.373, tip: "Use 5-point crossing exit for Bagbazar." },
  { name: "Sovabazar Sutanuti", line: "Blue", lat: 22.599, lng: 88.362, tip: "Gate 4 for Bagbazar, Gate 1 for Ahiritola." },
  { name: "Girish Park", line: "Blue", lat: 22.590, lng: 88.360, tip: "Exit for Central North traditional pujas." },
  { name: "MG Road", line: "Blue", lat: 22.585, lng: 88.361, tip: "Walk towards College St for Md. Ali Park." },
  { name: "Central", line: "Blue", lat: 22.576, lng: 88.359, tip: "Exit Gate 3 for College Square." },
  { name: "Chandni Chowk", line: "Blue", lat: 22.568, lng: 88.355, tip: "Central connectivity." },
  { name: "Esplanade", line: "Blue", lat: 22.564, lng: 88.351, tip: "Major interchange. Heavily crowded." },
  { name: "Park Street", line: "Blue", lat: 22.554, lng: 88.349, tip: "Exit for Park Circus auto stands." },
  { name: "Maidan", line: "Blue", lat: 22.544, lng: 88.346, tip: "Nearest to Victoria Memorial." },
  { name: "Rabindra Sadan", line: "Blue", lat: 22.541, lng: 88.346, tip: "Use Exide exit for Bhawanipur pujas." },
  { name: "Netaji Bhavan", line: "Blue", lat: 22.536, lng: 88.347, tip: "Walkable to Maddox Square." },
  { name: "Jatin Das Park", line: "Blue", lat: 22.526, lng: 88.345, tip: "Walk down Hazra Rd for Maddox Square." },
  { name: "Kalighat", line: "Blue", lat: 22.520, lng: 88.346, tip: "Gate 2 for Deshapriya Park, Gate 4 for Mudiali." },
  { name: "Rabindra Sarobar", line: "Blue", lat: 22.511, lng: 88.346, tip: "Exit for Suruchi Sangha route." },
  { name: "Mahanayak Uttam Kumar", line: "Blue", lat: 22.497, lng: 88.344, tip: "Tollygunge auto stand access." },
  { name: "Netaji", line: "Blue", lat: 22.481, lng: 88.352, tip: "Kudghat local pujas." },
  { name: "Masterda Surya Sen", line: "Blue", lat: 22.474, lng: 88.361, tip: "Bansdroni local area." },
  { name: "Gitanjali", line: "Blue", lat: 22.467, lng: 88.372, tip: "Naktala Udayan Sangha access." },
  { name: "Kavi Nazrul", line: "Blue", lat: 22.462, lng: 88.381, tip: "Garia Bazar area." },
  { name: "Shahid Khudiram", line: "Blue", lat: 22.464, lng: 88.390, tip: "Briji area access." },
  { name: "Kavi Subhash", line: "Blue", lat: 22.471, lng: 88.396, tip: "New Garia terminal." },
  { name: "Howrah Maidan", line: "Green", lat: 22.586, lng: 88.337, tip: "Howrah local access." },
  { name: "Howrah", line: "Green", lat: 22.583, lng: 88.343, tip: "Station connectivity." },
  { name: "Mahakaran", line: "Green", lat: 22.570, lng: 88.347, tip: "BBD Bagh area." },
  { name: "Sealdah", line: "Green", lat: 22.567, lng: 88.371, tip: "North subway for Santosh Mitra Square." },
  { name: "Phoolbagan", line: "Green", lat: 22.567, lng: 88.388, tip: "Phoolbagan local pujas." },
  { name: "Salt Lake Stadium", line: "Green", lat: 22.574, lng: 88.403, tip: "Gate 2 for FD Block." },
  { name: "Bengal Chemical", line: "Green", lat: 22.577, lng: 88.411, tip: "Salt Lake Sector III access." },
  { name: "City Centre", line: "Green", lat: 22.581, lng: 88.420, tip: "Salt Lake Sector I." },
  { name: "Central Park", line: "Green", lat: 22.584, lng: 88.425, tip: "Central Salt Lake." },
  { name: "Karunamoyee", line: "Green", lat: 22.581, lng: 88.427, tip: "Bus terminal access." },
  { name: "Sector V", line: "Green", lat: 22.579, lng: 88.432, tip: "IT Hub connectivity." },
  { name: "Satyajit Ray", line: "Orange", lat: 22.484, lng: 88.401, tip: "EM Bypass South access." },
  { name: "Jyotirindra Nandi", line: "Orange", lat: 22.498, lng: 88.402, tip: "Mukundapur area." },
  { name: "Kavi Sukanta", line: "Orange", lat: 22.506, lng: 88.403, tip: "Kalikapur area." },
  { name: "Hemanta Mukhopadhyay", line: "Orange", lat: 22.513, lng: 88.403, tip: "Ruby Hospital Crossing." },
  { name: "Joka", line: "Purple", lat: 22.445, lng: 88.301, tip: "Far South West connectivity." },
  { name: "Thakurpukur", line: "Purple", lat: 22.455, lng: 88.303, tip: "Local Thakurpukur pujas." },
  { name: "Sakherbazar", line: "Purple", lat: 22.465, lng: 88.306, tip: "Behala South access." },
  { name: "Behala Chowrasta", line: "Purple", lat: 22.476, lng: 88.309, tip: "Barisha Club access." },
  { name: "Behala Bazar", line: "Purple", lat: 22.492, lng: 88.314, tip: "Behala Central pujas." },
  { name: "Taratala", line: "Purple", lat: 22.508, lng: 88.318, tip: "Gate 1 for Suruchi Sangha." },
  { name: "Majerhat", line: "Purple", lat: 22.527, lng: 88.324, tip: "Interchange for suburban trains." },
  { name: "Dum Dum Cantt", line: "Yellow", lat: 22.628, lng: 88.411, tip: "Cantonment local pujas." }
];

window.toggleMetroMode = function() {
  window.isMetroModeActive = !window.isMetroModeActive;
  const pill = document.getElementById('metro-mode-pill');
  
  const searchContainer = document.getElementById('search-container');
  const searchBox = document.getElementById('search-box');
  const metroLineFilters = document.getElementById('metro-line-filters');
  const metroSearchResults = document.getElementById('metro-search-results');
  
  if (window.isMetroModeActive) {
    pill.classList.add('active');
    document.querySelector('.leaflet-tile-pane').style.filter = "brightness(0.7) contrast(1.1)";
    
    // Smoothly apply Metro styles via CSS class
    if (searchContainer) searchContainer.classList.add('metro-theme');
    if (searchBox) searchBox.placeholder = "🔍 Search pandals or 🚇 stations...";
    if (metroLineFilters) metroLineFilters.style.display = "flex";

    metroLayerGroup.addTo(map); 
    for (const [lineName, data] of Object.entries(metroRoutes)) {
      const poly = L.polyline(data.coords, { color: data.color, weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' });
      poly.addTo(metroLayerGroup);
      activePolylines[lineName] = poly;
    }

  } else {
    pill.classList.remove('active');
    document.querySelector('.leaflet-tile-pane').style.filter = "brightness(0.95)";
    
    // Smoothly revert to Pandal styles
    if (searchContainer) searchContainer.classList.remove('metro-theme');
    if (searchBox) {
        searchBox.placeholder = "🔍 Search pandals...";
        searchBox.value = ''; 
    }
    if (metroLineFilters) metroLineFilters.style.display = "none";
    if (metroSearchResults) metroSearchResults.style.display = "none";

    metroLayerGroup.clearLayers();
    if (activeMetroHalo) map.removeLayer(activeMetroHalo);
    activePolylines = {};
    
    if (typeof window.renderPandals === 'function') window.renderPandals(window.allPandals || [], "All Kolkata");
    window.searchList(); 
  }
};

window.handleUniversalSearch = function(event) {
  if (typeof window.searchList === 'function') window.searchList();

  if (window.isMetroModeActive) {
    const query = event.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('metro-search-results');
    
    if (query.length < 2) { 
      resultsContainer.style.display = 'none'; 
      if (activeMetroHalo) map.removeLayer(activeMetroHalo);
      return; 
    }
    
    const matches = window.metroStations.filter(s => s.name.toLowerCase().includes(query));
    
    if (matches.length > 0) {
      resultsContainer.innerHTML = matches.map(s => 
        `<li class="metro-search-item" onclick="activateMetroStationByName('${s.name}')">
          <span style="color: #0284c7; font-weight: 800; font-size: 0.95rem;">🚇 ${s.name}</span>
          <span style="font-size: 0.65rem; background: #e0f2fe; color: #0369a1; padding: 5px 10px; border-radius: 20px; font-weight: 800; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); letter-spacing: 0.5px; text-transform: uppercase;">${s.line}</span>
        </li>`
      ).join('');
      resultsContainer.style.display = 'block';
    } else {
      resultsContainer.style.display = 'none';
    }
  }
};

window.activateMetroStationByName = function(stationName) {
  document.getElementById('search-box').value = stationName; // Put name in universal search box
  document.getElementById('metro-search-results').style.display = 'none';
  const station = window.metroStations.find(s => s.name === stationName);
  if (station) window.activateMetroStation(station);
};

window.activateMetroStation = function(station) {
  if (activeMetroHalo) map.removeLayer(activeMetroHalo);
  activeMetroHalo = L.circle([station.lat, station.lng], { radius: 1500, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.05, weight: 1, interactive: false }).addTo(map);
  map.flyTo([station.lat, station.lng], 14, { duration: 1.5 });
  
  const walkablePandals = (window.allPandals || []).filter(pandal => {
    return map.distance([station.lat, station.lng], [pandal.lat, pandal.lng]) <= 1500;
  });
  
  let popupHtml = '';
  if (walkablePandals.length === 0) {
    if (typeof window.renderPandals === 'function') window.renderPandals([], `No pandals near ${station.name}`);
    popupHtml = `<div style="text-align:center; padding: 10px;"><h4 style="margin:0 0 5px; color:#4a0e17; font-family:'Fraunces', serif;">${station.name}</h4><div style="background:#fff3f3; border:1px solid #ff4d4d; border-radius:12px; padding:10px; margin-top:10px;"><span style="font-size:1.5rem; display:block; margin-bottom:5px;">🚷</span><p style="margin:0; font-size:0.9rem; font-weight:700; color:#d92525;">No pandals near ${station.name}</p></div></div>`;
  } else {
    if (typeof window.renderPandals === 'function') window.renderPandals(walkablePandals, `Walkable from ${station.name}`);
    popupHtml = `<div style="text-align:center; padding: 5px;"><h4 style="margin:0 0 5px; color:#d92525; font-family:'Fraunces', serif;">${station.name}</h4><span style="font-size:0.75rem; background:#f1f5f9; padding:4px 10px; border-radius:12px; color:#4a0e17; font-weight:700; border: 1px solid #e2e8f0;">${station.line} Line</span><hr style="border:0; height:1px; background:rgba(212,175,55,0.3); margin:12px 0 8px;"><p style="margin:0; font-size:0.85rem; font-weight:700; color:#1e8449;">💡 Local Intel:</p><p style="margin:4px 0 0; font-size:0.8rem; color:#4a0e17; line-height:1.4;">${station.tip}</p><div style="margin-top:10px; background:#e8f5e9; border:1px solid #2ecc71; padding:6px; border-radius:8px; font-size:0.8rem; font-weight:bold; color:#27ae60;">${walkablePandals.length} Pandals Nearby</div></div>`;
  }
  
  L.popup({ className: 'metro-intel-popup', closeButton: false, offset: [0, -5] }).setLatLng([station.lat, station.lng]).setContent(popupHtml).openOn(map);
};

window.highlightMetroLine = function(selectedLine) {
  for (const [lineName, poly] of Object.entries(activePolylines)) {
    if (lineName === selectedLine) { poly.setStyle({ opacity: 1, weight: 8 }); poly.bringToFront(); } 
    else { poly.setStyle({ opacity: 0.2, weight: 4 }); }
  }
};

// LEAFLET MAP INITIALIZATION
let map = L.map('map', { zoomControl: false }).setView([22.55, 88.36], 12);
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

let pinLayerGroup = L.markerClusterGroup({
  maxClusterRadius: 50, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    const tier = count < 10 ? 'tier-small' : count < 50 ? 'tier-medium' : 'tier-large';
    return L.divIcon({ html: `<div class="cluster-pin ${tier}">${count}</div>`, className: 'custom-icon-wrapper', iconSize: null });
  }
}).addTo(map);

let routePinsGroup = L.layerGroup().addTo(map);

const listEl = document.getElementById('pandal-list');
const countLabel = document.getElementById('count-label');

function isMobileViewport() { return window.matchMedia('(max-width: 768px)').matches; }

// ==========================================
// AMAZON / FLIPKART STYLE RATING ENGINE (CLOUD)
// ==========================================
window.globalRatings = window.globalRatings || {};
window.myCloudRatings = window.myCloudRatings || {}; // Holds this specific user's votes

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pandalSafeKey(name) {
  return btoa(encodeURIComponent(name)).replace(/=/g, '');
}

window.syncRatingsToUI = function() {
  Object.keys(window.globalRatings || {}).forEach(safeKey => {
    // 1. Update the Map Popups
    document.querySelectorAll(`[id="avg-rating-${safeKey}"]`).forEach(el => {
        const data = window.globalRatings[safeKey];
        if (data.count > 0) {
            const avg = (data.sum / data.count).toFixed(1);
            el.innerHTML = `<span style="color:#f59e0b; font-size:1.1rem;">★</span> <strong style="color:#4a0e17;">${avg}</strong> <span style="font-size:0.75rem; color:#888; font-weight:normal;">(${data.count})</span>`;
        }
    });
    
    // 2. THIS FIXES THE SCREENSHOT BUG: Update the Sidebar List automatically!
    document.querySelectorAll(`[id="sidebar-rating-${safeKey}"]`).forEach(el => {
        const data = window.globalRatings[safeKey];
        if (data.count > 0) {
            const avg = (data.sum / data.count).toFixed(1);
            el.innerHTML = `<span style="color:#f59e0b; font-size:0.85rem;">★</span> <strong style="color:#4a0e17; font-size:0.85rem;">${avg}</strong> <span style="font-size:0.7rem; color:#888;">(${data.count})</span>`;
        }
    });
  });
};

window.initRatingEngine = async function() {
  try {
    const { ref, onValue, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
    const db = window.firebaseDB || window.db;
    if (!db) return;

    // 1. Load the Global Averages
    onValue(ref(db, 'global_ratings'), (snapshot) => {
      window.globalRatings = snapshot.exists() ? snapshot.val() : {};
      window.syncRatingsToUI();
    });

    // 2. Load the User's Personal Votes from the Cloud
    if (window.currentUser) {
        const userVotesRef = ref(db, `users/${window.currentUser.uid}/ratings`);
        onValue(userVotesRef, (snapshot) => {
            window.myCloudRatings = snapshot.exists() ? snapshot.val() : {};
            
            // If popups are currently open, re-render their stars to reflect the user's past votes
            Object.keys(window.myCloudRatings).forEach(safeKey => {
                const wrapper = document.getElementById(`rating-wrapper-${safeKey}`);
                if (wrapper) wrapper.innerHTML = window.buildVotingUI(safeKey);
            });
        });
    }

  } catch (e) {
    console.error("Rating Engine failed to load.", e);
  }
};

window.buildVotingUI = function(safeKey) {
    // Read from the Cloud variable instead of localStorage
    let currentScore = window.myCloudRatings[safeKey] || 0;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        let starClass = i <= currentScore ? 'vote-star rated' : 'vote-star';
        starsHTML += `<button type="button" class="${starClass}" data-value="${i}" onclick="window.submitRating(event, '${safeKey}', ${i})">★</button>`;
    }
    
    let labelText = currentScore > 0 ? `⭐ YOU RATED IT ${currentScore}/5 (Tap to change)` : `RATE THIS PANDAL`;
    let labelClass = currentScore > 0 ? `vote-label voted` : `vote-label`;
    
    return `<span class="${labelClass}" style="display:block; margin-bottom: 2px;">${labelText}</span><div id="popup-stars-${safeKey}" class="pandal-rating-box">${starsHTML}</div>`;
};

window.submitRating = async function(event, safeKey, score) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    if(!window.currentUser) return alert("Please log in to rate pandals.");
    
    const previousScore = window.myCloudRatings[safeKey];
    if (previousScore === score) return; // Unchanged
    
    // 1. Instant Visual Update locally so it feels fast
    window.myCloudRatings[safeKey] = score;
    const wrapper = document.getElementById(`rating-wrapper-${safeKey}`);
    if (wrapper) wrapper.innerHTML = window.buildVotingUI(safeKey);

    // 2. Background Cloud Sync for Personal Vote + Global Average
    try {
        const { ref, runTransaction, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const db = window.firebaseDB || window.db;
        
        // Save personal vote permanently
        await set(ref(db, `users/${window.currentUser.uid}/ratings/${safeKey}`), score);
        
        // Securely adjust the global math
        await runTransaction(ref(db, `global_ratings/${safeKey}`), (currentData) => {
            if (currentData === null) return { sum: score, count: 1 };
            if (previousScore) {
                // Changing a vote: subtract old, add new
                return { sum: currentData.sum - previousScore + score, count: currentData.count };
            } else {
                // Brand new vote
                return { sum: currentData.sum + score, count: currentData.count + 1 };
            }
        });
    } catch(e) { console.error("Failed to sync rating", e); }
};

if (!window._ratingClickBound) {
  window._ratingClickBound = true;
  document.addEventListener('click', function(e) {
    const star = e.target.closest('button.vote-star');
    if (!star) return;
    e.preventDefault();
    e.stopPropagation();
    const encoded = star.getAttribute('data-name');
    const score = parseInt(star.getAttribute('data-score'), 10);
    if (!encoded || !score) return;
    window.submitRating(e, decodeURIComponent(encoded), score);
  }, true);
}

// INDESTRUCTIBLE EVENT BINDER (Bypasses Leaflet stripping)
window.bindStarEvents = function(safeKey) {
    const wrapper = document.getElementById(`rating-wrapper-${safeKey}`);
    if (!wrapper) return;
    const stars = wrapper.querySelectorAll('.vote-star');
    
    stars.forEach(star => {
        // Handle Clicks
        star.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            const score = parseInt(this.getAttribute('data-value'), 10);
            window.submitRating(ev, safeKey, score);
        });
        
        // Handle Left-to-Right Hover
        star.addEventListener('mouseover', function() {
            const hoverVal = parseInt(this.getAttribute('data-value'), 10);
            stars.forEach((s, idx) => {
                if (idx < hoverVal) s.classList.add('hover-gold');
                else s.classList.remove('hover-gold');
            });
        });
        
        // Handle Hover Reset
        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hover-gold'));
        });
    });
};

window.submitRating = async function(event, safeKey, score) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    
    let userRatings = JSON.parse(localStorage.getItem('parikrama_my_ratings')) || {};
    const previousScore = userRatings[safeKey];
    
    // If they clicked the exact same star they already voted for, do nothing
    if (previousScore === score) return; 
    
    // 1. Instant Local UI Update
    userRatings[safeKey] = score;
    localStorage.setItem('parikrama_my_ratings', JSON.stringify(userRatings));
    
    const wrapper = document.getElementById(`rating-wrapper-${safeKey}`);
    if (wrapper) wrapper.innerHTML = window.buildVotingUI(safeKey);

    // 2. Optimistic Global Math for Instant Visual Feedback
    if (!window.globalRatings) window.globalRatings = {};
    if (!window.globalRatings[safeKey]) window.globalRatings[safeKey] = { sum: 0, count: 0 };
    
    if (previousScore) {
        // They changed their vote: subtract old score, add new score (count stays same)
        window.globalRatings[safeKey].sum = window.globalRatings[safeKey].sum - previousScore + score;
    } else {
        // Brand new vote
        window.globalRatings[safeKey].sum += score;
        window.globalRatings[safeKey].count += 1;
    }
    
    // Instantly update the top text on the popup
    const avgContainer = document.getElementById(`avg-rating-${safeKey}`);
    if (avgContainer) {
        const data = window.globalRatings[safeKey];
        const avg = (data.sum / data.count).toFixed(1);
        avgContainer.innerHTML = `<span style="color:#f59e0b; font-size:1.1rem;">★</span> <strong style="color:#4a0e17;">${avg}</strong> <span style="font-size:0.75rem; color:#888; font-weight:normal;">(${data.count})</span>`;
    }

    // 3. Background Firebase Sync
    try {
        const { ref, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const db = window.firebaseDB || window.db;
        
        await runTransaction(ref(db, `global_ratings/${safeKey}`), (currentData) => {
            if (currentData === null) return { sum: score, count: 1 };
            if (previousScore) {
                return { sum: currentData.sum - previousScore + score, count: currentData.count };
            } else {
                return { sum: currentData.sum + score, count: currentData.count + 1 };
            }
        });
    } catch(e) { console.error("Failed to sync rating", e); }
};

if (!window._ratingClickBound) {
  window._ratingClickBound = true;
  document.addEventListener('click', function(e) {
    const star = e.target.closest('button.vote-star');
    if (!star) return;
    e.preventDefault();
    e.stopPropagation();
    const encoded = star.getAttribute('data-name');
    const score = parseInt(star.getAttribute('data-score'), 10);
    if (!encoded || !score) return;
    window.submitRating(e, decodeURIComponent(encoded), score);
  }, true);
}

// ==========================================
// CORE PANDAL RENDERING
// ==========================================
window.renderPandals = function(dataList, titleText) {
  currentPandals = dataList; 
  if (countLabel) countLabel.innerText = titleText;
  pinLayerGroup.clearLayers(); 
  listEl.innerHTML = ''; 
  markersData = [];
  resetApp(false); 
  
  if (currentPandals.length === 0) {
    listEl.innerHTML = `<li style="padding: 40px 20px; text-align:center; color: #7a1b26; line-height: 1.6; border: none; background: transparent; box-shadow: none;"><span style="font-size: 2rem; display: block; margin-bottom: 15px;">🌺</span><b>No Pujas Found Here</b><br><br>We haven't discovered any pujas in this specific category yet.<br><br>Tap another category to continue your Parikrama! ✨</li>`;
    return;
  }

  let bounds = L.latLngBounds();
  let userRatings = JSON.parse(localStorage.getItem('parikrama_my_ratings')) || {};

  currentPandals.forEach((p, i) => {
    const icon = L.divIcon({ className: 'custom-icon-wrapper', html: `<div class="diya-pin" id="pin-${i}"></div>`, iconSize: [16,16], iconAnchor: [8,8], popupAnchor: [0,-16] });
    const marker = L.marker([p.lat, p.lng], { icon }).addTo(pinLayerGroup);
    bounds.extend([p.lat, p.lng]);
    
 // --- MAP POPUP RATING & INTEL UI ---
    const safeKey = btoa(encodeURIComponent(p.name)).replace(/=/g, '');
    
    let avgHtml = `<span style="color:#cbd5e1; font-size:1.1rem;">★</span> <span style="font-size:0.8rem; color:#888; font-weight:normal;">Unrated</span>`;
    if (window.globalRatings && window.globalRatings[safeKey] && window.globalRatings[safeKey].count > 0) {
        const data = window.globalRatings[safeKey];
        const avg = (data.sum / data.count).toFixed(1);
        avgHtml = `<span style="color:#f59e0b; font-size:1.1rem;">★</span> <strong style="color:#4a0e17;">${avg}</strong> <span style="font-size:0.75rem; color:#888; font-weight:normal;">(${data.count})</span>`;
    }

    let intelHtml = `<div id="intel-display-${safeKey}" class="intel-display-box" style="display:none;"></div>`;

    marker.bindPopup(`
      <div class="popup-content pandal-popup-container" data-safekey="${safeKey}" data-name="${p.name.replace(/"/g, '&quot;')}" style="text-align: center; min-width: 190px;">
        <h4 style="margin:0 0 4px;">🪔 ${p.name}</h4>
        <div id="avg-rating-${safeKey}" style="margin-bottom: 12px;">${avgHtml}</div>
        
        <div style="display: flex; justify-content: center; gap: 8px;">
            <a class="popup-btn" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}">Map ↗</a>
            <button type="button" class="popup-btn intel-report-btn" onclick="window.openIntelModal(decodeURIComponent('${encodeURIComponent(p.name)}'), '${safeKey}')">📢 Report</button>
        </div>

        ${intelHtml}
        
        <div id="rating-wrapper-${safeKey}" data-vote-key="${safeKey}" style="margin-top: 15px; border-top: 1px dashed rgba(212,175,55,0.4); padding-top: 12px;">
          ${window.buildVotingUI(safeKey)}
        </div>
      </div>
    `);

    markersData.push({ p, marker, id: `pin-${i}`, index: i });

    let isAdded = false;
    let btnText = "+ Add";
    
    if (window.isProposingForGroup) {
      isAdded = window.proposedPandals.some(sp => sp.name === p.name);
      btnText = isAdded ? "✓ Drafted" : "+ Add";
    } else {
      isAdded = selectedPandals.some(sp => sp.name === p.name);
      btnText = isAdded ? (window.isGroupRoutingActive ? "✓ Group Added" : "✓ Added") : "+ Add";
    }

    const btnClass = isAdded ? "add-btn added" : "add-btn";
    const li = document.createElement('li');
    li.className = 'pandal-card';

    // Average rating for sidebar card (read-only, e-commerce style)
    let sidebarAvgHtml = `<span style="color:#94a3b8; font-size:0.85rem;">★</span> <span style="font-size:0.8rem; color:#888;">Unrated</span>`;
    if (window.globalRatings && window.globalRatings[safeKey]) {
        const data = window.globalRatings[safeKey];
        const avg = (data.sum / data.count).toFixed(1);
        sidebarAvgHtml = `<span style="color:#f59e0b; font-size:0.85rem;">★</span> <strong style="color:#4a0e17; font-size:0.85rem;">${avg}</strong> <span style="font-size:0.7rem; color:#888;">(${data.count})</span>`;
    }

   li.innerHTML = `
      <div class="pandal-info">
        <h3 style="margin:0;">${p.name}</h3>
        <div id="sidebar-rating-${safeKey}" style="font-size:0.8rem; color:#888; margin-top:2px;">${sidebarAvgHtml}</div>
      </div>
      <button class="${btnClass}" onclick="toggleRoute(event, ${i}, this)">${btnText}</button>`;
    
    li.addEventListener('click', () => {
      map.flyTo([p.lat, p.lng], 16, { animate: true, duration: 1.5 });
      setTimeout(() => { pinLayerGroup.zoomToShowLayer(marker, () => marker.openPopup()); }, 1500);
      if (isMobileViewport()) { document.getElementById('sidebar').style.height = '35dvh'; }
    });

    li.addEventListener('mouseenter', () => { const pinDiv = document.getElementById(`pin-${i}`); if (pinDiv) pinDiv.classList.add('highlight'); });
    li.addEventListener('mouseleave', () => { const pinDiv = document.getElementById(`pin-${i}`); if (pinDiv) pinDiv.classList.remove('highlight'); });
    listEl.appendChild(li);
  });

  map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.5 });
};

window.applyFilter = function(btnElement, region, category) {
  document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  let filtered = window.allPandals || [];
  if (region !== 'All') filtered = filtered.filter(p => p.region === region);
  if (category !== 'All') filtered = filtered.filter(p => p.category === category);

  let title = "All Kolkata";
  if (region !== 'All' && category !== 'All') title = `${region} • ${category}`;
  else if (region !== 'All') title = `${region} Kolkata`;
  else if (category !== 'All') title = `${category} Pujas`;

  window.renderPandals(filtered, `${title} (${filtered.length})`);
};

window.searchList = function() {
  const query = document.getElementById('search-box').value.toLowerCase();
  const cards = listEl.getElementsByTagName('li');
  Array.from(cards).forEach((card, index) => {
    const name = currentPandals[index].name.toLowerCase();
    card.style.display = name.includes(query) ? 'flex' : 'none';
  });
};

function startLocationTracking() {
  if (!("geolocation" in navigator)) return alert("Geolocation not supported by your browser");
  if (userMarker) { map.flyTo(userMarker.getLatLng(), 16, { animate: true }); return; }

  document.getElementById('locate-btn').querySelector('svg').style.fill = "#3b82f6";
  gpsWatchId = navigator.geolocation.watchPosition((position) => {
    const latlng = [position.coords.latitude, position.coords.longitude];
    if (!userMarker) {
      const userIcon = L.divIcon({ className: 'custom-icon-wrapper', html: `<div class="user-marker-wrapper"><div class="user-ring"></div><div class="user-dot"></div></div>`, iconSize: [18,18], iconAnchor: [9,9] });
      userMarker = L.marker(latlng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      map.flyTo(latlng, 16, { animate: true });
    } else { userMarker.setLatLng(latlng); }
  }, (error) => {
    console.error("GPS Error", error);
    document.getElementById('locate-btn').querySelector('svg').style.fill = "#4a0e17";
  }, { enableHighAccuracy: true });
}

// ==========================================
// THE ROUTING TOGGLE (Solo / Live Group / Proposal)
// ==========================================
window.toggleRoute = async function(event, index, btnElement) {
  event.stopPropagation(); 
  const pandal = currentPandals[index];
  
  // CRITICAL UI FIX: If we are NOT in a group room, forcibly kill stuck propose modes
  if (!window.currentHubbaRoom) {
      window.isProposingForGroup = false;
      document.body.classList.remove('proposal-mode', 'has-drafts');
  }
  
  if (window.isProposingForGroup) {
    const propIndex = window.proposedPandals.findIndex(x => x.name === pandal.name);
    if (propIndex === -1) {
      window.proposedPandals.push(pandal);
      btnElement.innerText = "✓ Drafted"; 
      btnElement.classList.add("added");
    } else {
      window.proposedPandals.splice(propIndex, 1);
      btnElement.innerText = "+ Add"; 
      btnElement.classList.remove("added");
    }
    if (window.proposedPandals.length >= 1) document.body.classList.add('has-drafts');
    else document.body.classList.remove('has-drafts');
    
    window.updateRouteActionBar();
    return; 
  }

  if (window.isGroupRoutingActive && window.currentHubbaRoom && window.firebaseDB) {
    const { ref, set, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
    const routeRef = ref(window.firebaseDB, `rooms/${window.currentHubbaRoom}/route`);
    const snapshot = await get(routeRef);
    let groupRoute = snapshot.exists() ? snapshot.val() : [];
    
    const existsIndex = groupRoute.findIndex(item => item.name === pandal.name);
    if (existsIndex > -1) {
      groupRoute.splice(existsIndex, 1); 
      btnElement.innerText = "+ Add"; 
      btnElement.classList.remove("added");
    } else {
      groupRoute.push(pandal); 
      btnElement.innerText = "✓ Group Added"; 
      btnElement.classList.add("added");
    }
    await set(routeRef, groupRoute);
    window.updateRouteActionBar();
  } else {
    const selectedIndex = selectedPandals.findIndex(x => x.name === pandal.name);
    if (selectedIndex === -1) {
      selectedPandals.push(pandal);
      btnElement.innerText = "✓ Added"; 
      btnElement.classList.add("added");
    } else {
      selectedPandals.splice(selectedIndex, 1);
      btnElement.innerText = "+ Add"; 
      btnElement.classList.remove("added");
    }
    localStorage.setItem('parikrama_saved_route', JSON.stringify(selectedPandals));
    window.updateRouteActionBar();
  }
};

// ==========================================
// THE "BOOMERANG" HUBBA START PICKER LOGIC
// ==========================================
window.isPickingHubbaStart = false;

window.openHubbaStartPicker = function() {
  window.isPickingHubbaStart = true;
  
  // 1. Duck the chat out of the way
  if (typeof window.closeHubbaSheet === 'function') window.closeHubbaSheet();
  
  // 2. Switch to the Map Page instantly
  if (typeof window.showMapPage === 'function') window.showMapPage();
  window.scrollTo(0, 0);
  
  // 3. Expand the Start Location Pill
  if (typeof toggleStartPill === 'function') toggleStartPill(true);
  
  // 4. The Mobile UX Fix: Highlight the input box to guide their finger!
  const searchInput = document.getElementById('custom-start-input');
  if (searchInput) {
      // Create a beautiful, unmissable red/gold glowing pulse
      searchInput.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease";
      searchInput.style.borderColor = "#d92525";
      searchInput.style.boxShadow = "0 0 15px rgba(217, 37, 37, 0.4)";
      
      // The second they tap it (satisfying Apple/Google security), remove the glow
      searchInput.addEventListener('focus', function removeGlow() {
          searchInput.style.borderColor = "rgba(212, 175, 55, 0.4)";
          searchInput.style.boxShadow = "none";
          searchInput.removeEventListener('focus', removeGlow);
      });
  }
};


window.checkHubbaStartReturn = function() {
  // 1. Visually update the Hubba Plan button to show the location is locked in
  const planBtn = document.getElementById('plan-start-btn');
  if (planBtn && typeof startPoint !== 'undefined' && startPoint) {
     planBtn.innerHTML = `🎯 ${startPoint.name}`;
     planBtn.style.background = "rgba(46, 204, 113, 0.1)";
     planBtn.style.border = "2px dashed rgba(46, 204, 113, 0.6)";
     planBtn.style.color = "#27ae60";
  }

  // 2. Boomerang the chat window back up!
  if (window.isPickingHubbaStart) {
    window.isPickingHubbaStart = false;
    
    if (typeof isMobileViewport === 'function' && isMobileViewport()) {
       // Wait a fraction of a second so the user sees their location was selected
       setTimeout(() => {
           // Warp them back to the Groups page and pop the chat back open
           if (typeof window.showGroupsPage === 'function') window.showGroupsPage();
           if (typeof window.openHubbaSheet === 'function') window.openHubbaSheet();
           if (typeof window.switchHubbaTab === 'function') window.switchHubbaTab('plan'); 
       }, 400); 
    }
  }
};

function useCurrentLocation() {
  if (!("geolocation" in navigator)) { alert("GPS not available."); return; }
  const textEl = document.getElementById('start-pill-text');
  textEl.innerText = "Finding GPS...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      startPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Current Location" };
      textEl.innerText = "🎯 Current Location";
      toggleStartPill(false);
      
      // TRIGGER THE BOOMERANG
      if (typeof window.checkHubbaStartReturn === 'function') window.checkHubbaStartReturn();
      
      if (selectedPandals.length > 0 && document.getElementById('itinerary-panel').style.display === "block") { generateSmartRoute(); }
    },
    err => { textEl.innerText = "Where to start?"; alert("GPS failed. Please search for an area or choose on the map."); }, 
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

let searchTimeout = null; 
async function handleLiveSearch(event) {
  const query = event.target.value.trim();
  const resultsList = document.getElementById('location-results');
  if (searchTimeout) clearTimeout(searchTimeout);
  if (query.length < 3) { resultsList.innerHTML = `<li style="color: #94a3b8; text-align: center; pointer-events: none; border: none; padding-top: 15px;">Keep typing...</li>`; return; }
  resultsList.innerHTML = `<li style="text-align: center; color: #d92525;">Searching...</li>`;

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query + ', Kolkata')}`);
      const data = await res.json();
      resultsList.innerHTML = '';
      if (data.length === 0) { resultsList.innerHTML = `<li style="color: #7a1b26; text-align: center;">No results found in Kolkata.</li>`; return; }

      data.forEach(item => {
        const parts = item.display_name.split(',');
        const mainText = parts[0].trim();
        const subText = parts.slice(1, 4).join(',').trim(); 
        const li = document.createElement('li');
        li.className = 'uber-result-item';
        li.innerHTML = `<div class="uber-result-icon">📍</div><div class="uber-result-text"><div class="uber-result-title">${mainText}</div><div class="uber-result-subtitle">${subText}</div></div>`;
        li.onclick = () => {
          startPoint = { lat: parseFloat(item.lat), lng: parseFloat(item.lon), name: mainText };
          document.getElementById('start-pill-text').innerText = mainText.length > 18 ? mainText.substring(0, 18) + '...' : mainText;
          toggleStartPill(false); 
          
          // TRIGGER THE BOOMERANG
          if (typeof window.checkHubbaStartReturn === 'function') window.checkHubbaStartReturn();
          
          if (selectedPandals.length > 0 && document.getElementById('itinerary-panel').style.display === "block") { generateSmartRoute(); }
        };
        resultsList.appendChild(li);
      });
    } catch (e) { resultsList.innerHTML = `<li style="color: #7a1b26; text-align: center;">Network error. Try again.</li>`; }
  }, 400); 
}

let isMapPicking = false;
function enableMapSelection() {
  toggleStartPill(false);
  isMapPicking = true;
  document.getElementById('map-picking-instruction').classList.add('visible');
  document.getElementById('map').style.cursor = 'crosshair';
  map.once('click', function(e) {
    isMapPicking = false;
    document.getElementById('map-picking-instruction').classList.remove('visible');
    document.getElementById('map').style.cursor = '';
    startPoint = { lat: e.latlng.lat, lng: e.latlng.lng, name: "Custom Map Pin" };
    document.getElementById('start-pill-text').innerText = "📍 Custom Pin";
    
    // TRIGGER THE BOOMERANG
    if (typeof window.checkHubbaStartReturn === 'function') window.checkHubbaStartReturn();
    
    if (selectedPandals.length > 0 && document.getElementById('itinerary-panel').style.display === "block") { generateSmartRoute(); }
  });
}

function prepRoutingUI(contentPanel) {
  const routeBtn = document.getElementById('generate-route-btn');
  if (routeBtn) routeBtn.style.display = "none";
  document.getElementById('search-container').style.display = "none";
  document.getElementById('pandal-list').style.display = "none";
  document.getElementById('itinerary-panel').style.display = "block";
  if (isMobileViewport()) { document.getElementById('sidebar').style.height = '35dvh'; }
}

function getDistance(p1, p2) {
  const R = 6371e3; 
  const rad = Math.PI / 180;
  const dLat = (p2.lat - p1.lat) * rad;
  const dLng = (p2.lng - p1.lng) * rad;
  const lat1 = p1.lat * rad;
  const lat2 = p2.lat * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function run2OptTSP(tour) {
  if (tour.length <= 3) return tour; 
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    for (let i = 1; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        const dCurrent = getDistance(tour[i - 1], tour[i]) + (k < tour.length - 1 ? getDistance(tour[k], tour[k + 1]) : 0);
        const dNew = getDistance(tour[i - 1], tour[k]) + (k < tour.length - 1 ? getDistance(tour[i], tour[k + 1]) : 0);
        if (dNew < dCurrent - 1) {
          const reversedSegment = tour.slice(i, k + 1).reverse();
          tour.splice(i, reversedSegment.length, ...reversedSegment);
          improved = true;
        }
      }
    }
  }
  return tour;
}

window.showDisclaimerModal = function() {
  document.getElementById('disclaimer-modal-overlay').classList.add('visible');
  document.getElementById('disclaimer-modal').classList.add('visible');
};

function closeDisclaimerModal() {
  document.getElementById('disclaimer-modal-overlay').classList.remove('visible');
  document.getElementById('disclaimer-modal').classList.remove('visible');
}

function proceedToRoute() {
  closeDisclaimerModal();
  generateSmartRoute();
}

async function generateSmartRoute() {
  if (!startPoint) {
    if (isMobileViewport()) { const sb = document.getElementById('sidebar'); if (sb) sb.style.height = '35dvh'; }
    toggleStartPill(true);
    const pill = document.getElementById('start-pill-box');
    if (pill) { pill.classList.add('pulse-error'); setTimeout(() => pill.classList.remove('pulse-error'), 500); }
    return;
  }

  if (!selectedPandals || selectedPandals.length === 0) { alert("Please select at least one pandal to plan your route!"); return; }

  const contentPanel = document.getElementById('itinerary-content');
  prepRoutingUI(contentPanel);
  contentPanel.innerHTML = '<div style="padding: 30px; text-align: center; color: #d92525;"><div style="animation: pulse-glow 1s infinite alternate; font-size: 2rem; margin-bottom: 10px;">⏳</div><b>Optimizing shortest path...</b></div>';

  let sortedRoute = [startPoint];
  let unvisited = [...selectedPandals];
  let current = startPoint;

  while (unvisited.length > 0) {
    let nearestIdx = 0; 
    let minDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      let d = getDistance(current, unvisited[i]);
      if (d < minDist) { minDist = d; nearestIdx = i; }
    }
    current = unvisited.splice(nearestIdx, 1)[0];
    sortedRoute.push(current);
  }

  sortedRoute = run2OptTSP(sortedRoute);

  // --- NEW: SAVE TO VAULT AND SET ACTIVE ROUTE ---
  window.activeGeneratedRoute = sortedRoute;
  if (typeof window.saveRouteToVault === 'function') {
    window.saveRouteToVault(sortedRoute);
  }
  // ----------------------------------------------

  map.removeLayer(pinLayerGroup);
  routePinsGroup.clearLayers();

  const startIcon = L.divIcon({ className: 'custom-icon-wrapper', html: `<div class="user-marker-wrapper"><div class="user-ring" style="border-radius:50%; background:rgba(46, 204, 113, 0.5)"></div><div class="user-dot" style="background:#2ecc71; border:3px solid #fff;"></div></div>`, iconSize: [18,18], iconAnchor: [9,9] });
  L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).bindPopup(`<b>${startPoint.name}</b>`).addTo(routePinsGroup);

  for (let i = 1; i < sortedRoute.length; i++) {
    const node = sortedRoute[i];
    const icon = L.divIcon({ className: 'custom-icon-wrapper', html: `<div class="diya-pin highlight"></div>`, iconSize: [16,16], iconAnchor: [8,8] });
    L.marker([node.lat, node.lng], { icon }).bindPopup(`<div class="popup-content"><h4>🪔 ${node.name}</h4><a class="popup-btn" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${node.lat},${node.lng}">Open in Maps ↗</a></div>`).addTo(routePinsGroup);
  }

// --- KILL DUPLICATE BUTTONS ---
  // Hides any old hardcoded action bars inside the HTML file so they don't clash
  document.querySelectorAll('#itinerary-panel > .itinerary-actions').forEach(el => el.style.display = 'none');

  // Define the master UI action bar with inline styles to guarantee it looks perfect
  const actionBarHTML = `
    <div class="itinerary-actions" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:15px; padding-top:12px; border-top:1px solid rgba(212,175,55,0.3);">
      <button id="download-pass-btn" onclick="exportActiveRouteToGPX()" style="flex:100%; background:#4a0e17; color:white; border:none; font-weight:700; cursor:pointer; padding:12px; border-radius:10px; font-size: 0.95rem; box-shadow: 0 4px 10px rgba(74, 14, 23, 0.2); transition: 0.2s;">📥 Download Offline Map (GPX)</button>
      <button class="share-btn" onclick="openShareModal()" style="flex:1; background:#25D366; color:white; border:none; font-weight:700; cursor:pointer; padding:10px; border-radius:10px; transition: 0.2s;">📤 Share Route</button>
      <button class="reset-btn" onclick="resetApp(true)" style="flex:1; background:rgba(255,255,255,0.7); border:1px solid rgba(212,175,55,0.6); color:#4a0e17; font-weight:700; cursor:pointer; padding:10px; border-radius:10px; transition: 0.2s;">✕ Clear</button>
    </div>
  `;

  try {
    const coordsString = sortedRoute.map(p => `${p.lng},${p.lat}`).join(';');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson&steps=true`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("OSRM routing returned an error.");
    const data = await response.json();

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.geoJSON(data.routes[0].geometry, { style: { color: '#d92525', weight: 5, opacity: 0.9 } }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { paddingBottomRight: [20, window.innerHeight * 0.4], paddingTopLeft: [20, 20] });

    const legs = data.routes[0].legs;
    let html = '';
    sortedRoute.forEach((stop, i) => {
      let isUserStart = (i === 0);
      html += `<div class="itinerary-step"><div class="step-pandal" style="${isUserStart ? 'border-left-color: #2ecc71;' : ''}">${isUserStart ? "🎯" : "🪔"} ${stop.name}</div>`;
      if (i < sortedRoute.length - 1) {
        let dist = legs[i].distance;
        if (dist > 800) {
          html += `<div class="step-travel"><span style="color: #4a0e17;">🚌 <b>${(dist/1000).toFixed(1)} km</b></span><span style="margin-top: 4px;">Too far to walk.</span><a href="https://www.google.com/maps/dir/?api=1&origin=${stop.lat},${stop.lng}&destination=${sortedRoute[i+1].lat},${sortedRoute[i+1].lng}&travelmode=transit" target="_blank" class="popup-btn" style="margin-top:8px;">🚆 Live Options ↗</a></div>`;
        } else { html += `<div class="step-travel"><span style="color: #4a0e17;">🚶‍♂️ Walk ${Math.round(legs[i].duration / 60)} mins (${Math.round(dist)}m)</span></div>`; }
      }
      html += `</div>`;
    });
    
    // Inject the action buttons at the bottom!
    contentPanel.innerHTML = html + actionBarHTML;

  } catch (error) {
    const latlngs = sortedRoute.map(n => [n.lat, n.lng]);
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(latlngs, { color: '#d92525', weight: 4, dashArray: '10, 10', opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { paddingBottomRight: [20, window.innerHeight * 0.4], paddingTopLeft: [20, 20] });

    let html = '<div style="background: #fff5f5; border-left: 4px solid #d92525; padding: 12px; margin-bottom: 15px; font-size: 0.85rem; color: #d92525; border-radius: 4px; font-weight: 600;">⚠️ Route service busy. Showing straight-line estimates.</div>';

    sortedRoute.forEach((stop, i) => {
      let isUserStart = (i === 0);
      html += `<div class="itinerary-step"><div class="step-pandal" style="${isUserStart ? 'border-left-color: #2ecc71;' : ''}">${isUserStart ? "🎯" : "🪔"} ${stop.name}</div>`;
      if (i < sortedRoute.length - 1) {
        const nextStop = sortedRoute[i+1];
        const dist = getDistance(stop, nextStop); 
        if (dist > 800) {
          html += `<div class="step-travel"><span style="color: #4a0e17;">🚌 <b>~${(dist/1000).toFixed(1)} km</b> (Direct)</span><span style="margin-top: 4px;">Too far to walk.</span><a href="https://www.google.com/maps/dir/?api=1&origin=${stop.lat},${stop.lng}&destination=${nextStop.lat},${nextStop.lng}&travelmode=transit" target="_blank" class="popup-btn" style="margin-top:8px;">🚆 Live Options ↗</a></div>`;
        } else {
          const estMins = Math.round((dist / 1000) * 12); 
          html += `<div class="step-travel"><span style="color: #4a0e17;">🚶‍♂️ Walk ~${estMins} mins (~${Math.round(dist)}m)</span><a href="https://www.google.com/maps/dir/?api=1&origin=${stop.lat},${stop.lng}&destination=${nextStop.lat},${nextStop.lng}&travelmode=walking" target="_blank" class="popup-btn" style="margin-top:8px;">Open Map ↗</a></div>`;
        }
      }
      html += `</div>`;
    });
    
    // Inject the action buttons at the bottom of the fallback map too!
    contentPanel.innerHTML = html + actionBarHTML;
  }
}

window.resetApp = async function(fullReset = true) {
  if (fullReset) {
    if (!window.isGroupRoutingActive) { 
      // Solo Mode: Wipe local data
      selectedPandals = []; 
      localStorage.removeItem('parikrama_saved_route'); 
    } else if (window.currentHubbaRoom && window.firebaseDB) {
      // Group Mode: Reach into Firebase and safely wipe the route for everyone
      try {
        const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        await set(ref(window.firebaseDB, `rooms/${window.currentHubbaRoom}/route`), []);
        selectedPandals = [];
      } catch(e) { console.error("Error clearing route", e); }
    }
    
    document.querySelectorAll('.add-btn').forEach(btn => { btn.innerText = "+ Add"; btn.classList.remove('added'); });
    startPoint = null; 
    const pillText = document.getElementById('start-pill-text');
    if (pillText) pillText.innerText = "Where to start?";
  }
  
  window.updateRouteActionBar();

  document.getElementById('search-container').style.display = "block"; 
  document.getElementById('pandal-list').style.display = "block";
  document.getElementById('itinerary-panel').style.display = "none";
  routePinsGroup.clearLayers();
  
  if (!map.hasLayer(pinLayerGroup)) map.addLayer(pinLayerGroup);
  if (routeLine) map.removeLayer(routeLine);
  
  const sb = document.getElementById('sidebar'); 
  if (sb) sb.style.height = '';
};

// This ensures older HTML buttons that use onclick="resetApp()" still work perfectly
function resetApp(fullReset = true) { window.resetApp(fullReset); }

function openShareModal() { document.getElementById('share-modal-overlay').classList.add('visible'); document.getElementById('share-modal').classList.add('visible'); }
function closeShareModal() { document.getElementById('share-modal-overlay').classList.remove('visible'); document.getElementById('share-modal').classList.remove('visible'); }
function generateShareUrl() {
  let baseUrl = window.location.origin + window.location.pathname; let params = new URLSearchParams();
  if (selectedPandals.length > 0) { let names = selectedPandals.map(p => p.name).join('|'); params.set('route', names); }
  if (startPoint) { params.set('start', `${startPoint.lat},${startPoint.lng},${startPoint.name}`); }
  return baseUrl + '?' + params.toString();
}
function shareToWhatsApp() {
  const url = generateShareUrl();
  const text = `🌺 Check out my Durga Puja Parikrama route!\n\n📍 ${selectedPandals.length} Clubs selected.\n\nOpen here to view the map and walking plan:\n${url}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank'); closeShareModal();
}
function copyRouteLink() {
  const url = generateShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('copy-btn-el'); const oldText = btn.innerHTML;
    btn.innerHTML = "✅ Copied to Clipboard!"; btn.style.borderColor = "#2ecc71"; btn.style.color = "#2ecc71";
    setTimeout(() => { btn.innerHTML = oldText; btn.style.borderColor = ""; btn.style.color = ""; closeShareModal(); }, 2000);
  });
}

window.allPandals = typeof allPandals !== 'undefined' ? allPandals : [];
const savedRoute = localStorage.getItem('parikrama_saved_route');
if (savedRoute && !window.isGroupRoutingActive) { try { selectedPandals = JSON.parse(savedRoute); } catch (e) { console.error("Could not load saved route.", e); } }

// ==========================================
// RATING SYNC, INTEL & METRO MAP INTERCEPTOR
// ==========================================
map.on('popupopen', function(e) {
  const popupNode = e.popup.getElement();
  
  // --- PANDAL RATING & INTEL BINDING ---
  const pandalWrapper = popupNode.querySelector('.pandal-popup-container');
  if (pandalWrapper) {
      const safeKey = pandalWrapper.getAttribute('data-safekey');
      
      // 1. Bind the Star Ratings
      const votingWrapper = popupNode.querySelector(`[id="rating-wrapper-${safeKey}"]`);
      if (votingWrapper && typeof window.buildVotingUI === 'function') {
          votingWrapper.innerHTML = window.buildVotingUI(safeKey);
          if (typeof window.bindStarEvents === 'function') window.bindStarEvents(safeKey);
      }

      // 2. INDESTRUCTIBLE INTEL BUTTON BINDING (The Fix!)
      const reportBtn = popupNode.querySelector('[data-action="open-intel"]');
      if (reportBtn) {
          reportBtn.addEventListener('click', function(ev) {
              ev.preventDefault();
              ev.stopPropagation();
              window.openIntelModal(this.getAttribute('data-name'), this.getAttribute('data-safekey'));
          });
      }

      // 3. Grab the freshest global average
      const avgContainer = popupNode.querySelector(`[id="avg-rating-${safeKey}"]`);
      if (avgContainer) {
          if (window.globalRatings && window.globalRatings[safeKey] && window.globalRatings[safeKey].count > 0) {
              const data = window.globalRatings[safeKey];
              const avg = (data.sum / data.count).toFixed(1);
              avgContainer.innerHTML = `<span style="color:#f59e0b; font-size:1.1rem;">★</span> <strong style="color:#4a0e17;">${avg}</strong> <span style="font-size:0.75rem; color:#888; font-weight:normal;">(${data.count})</span>`;
          } else {
              avgContainer.innerHTML = `<span style="color:#cbd5e1; font-size:1.1rem;">★</span> <span style="font-size:0.8rem; color:#888; font-weight:normal;">Unrated</span>`;
          }
      }
  }

  // Sync Intel UI Box if there is active data
  if (typeof window.syncIntelToUI === 'function') window.syncIntelToUI();

  // --- EXISTING METRO INTEL LOGIC ---
  if (!window.isMetroModeActive) return;
  if (e.popup.options.className === 'metro-intel-popup') return;
  const latlng = e.popup.getLatLng();
  let nearestStation = null; let shortestDist = 1500; 
  window.metroStations.forEach(s => { let dist = map.distance([latlng.lat, latlng.lng], [s.lat, s.lng]); if (dist < shortestDist) { shortestDist = dist; nearestStation = s; } });
  
  if (nearestStation) {
     const contentNode = popupNode.querySelector('.leaflet-popup-content');
     if (contentNode && !contentNode.querySelector('.pandal-metro-tag')) {
        const tag = document.createElement('div'); tag.className = 'pandal-metro-tag';
        tag.style.cssText = "margin-top: 12px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 30px; padding: 6px 14px; font-size: 0.85rem; font-weight: 700; color: #0284c7; display: flex; align-items: center; justify-content: space-between; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);";
        tag.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">🚇 ${nearestStation.name}</span> <span style="font-size:0.75rem; background:#0ea5e9; color:white; padding:4px 10px; border-radius:30px; box-shadow: 0 2px 5px rgba(14, 165, 233, 0.4);">${Math.round(shortestDist)}m away</span>`;
        contentNode.appendChild(tag);
     }
  }
});

window.openHubbaModal = function() { document.getElementById('hubba-modal-overlay').classList.add('visible'); document.getElementById('hubba-modal').classList.add('visible'); switchHubbaView('tiles'); };
window.closeHubbaModal = function() { document.getElementById('hubba-modal-overlay').classList.remove('visible'); document.getElementById('hubba-modal').classList.remove('visible'); };
window.switchHubbaView = function(view) {
  document.getElementById('hubba-view-tiles').style.display = 'none'; document.getElementById('hubba-view-create').style.display = 'none'; document.getElementById('hubba-view-join').style.display = 'none';
  if (view === 'tiles') document.getElementById('hubba-view-tiles').style.display = 'flex';
  if (view === 'create') document.getElementById('hubba-view-create').style.display = 'flex';
  if (view === 'join') document.getElementById('hubba-view-join').style.display = 'flex';
};
window.toggleHubbaWidget = function() { const widget = document.getElementById('active-hubbas-section'); if (widget) widget.classList.toggle('hubba-collapsed'); };
window.expandHubbaWidget = function() { const widget = document.getElementById('active-hubbas-section'); if (widget && widget.classList.contains('hubba-collapsed')) { widget.classList.remove('hubba-collapsed'); } };


// ==========================================
// UNIFIED NAVIGATION CONTROLLER (GLITCH-FREE + SLIDER FIX)
// ==========================================

window.hideAllPages = function() {
  document.getElementById('mobile-groups-page').style.display = 'none';
  document.getElementById('mobile-routes-page').style.display = 'none';
  document.getElementById('mobile-sos-page').style.display = 'none';
  const profilePage = document.getElementById('mobile-profile-page');
  if (profilePage) profilePage.style.display = 'none';

  const mapContainer = document.getElementById('map-container');
  mapContainer.style.opacity = '0';
  mapContainer.style.pointerEvents = 'none';
  
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('app-header').style.display = 'none';

  // CRITICAL FIX: Kill stuck proposal modes automatically when switching tabs
  if (window.isProposingForGroup && typeof window.exitProposalMode === 'function') {
      window.exitProposalMode(false);
  }
};

window.updateNavSlider = function(activeIndex) {
    const slider = document.getElementById('magic-nav-slider');
    if (slider) {
        slider.style.transform = `translateX(${activeIndex * 100}%)`;
        
        // Solid deep red for all active states
        slider.style.background = 'linear-gradient(135deg, #e63946, #d92525)';
        slider.style.boxShadow = '0 4px 15px rgba(217,37,37,0.4)';
    }
    
    // Updates the text colors so the active tab text turns white, and inactive tabs stay grey/red
    const tabs = ['nav-btn-map', 'nav-btn-groups', 'nav-btn-routes', 'nav-btn-profile', 'nav-btn-sos'];
    tabs.forEach((id, idx) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        
        if (activeIndex === idx) {
            // White text for the active tab (sitting inside the red pill)
            btn.style.color = '#ffffff';
        } else {
            // If inactive, SOS stays red, everything else goes back to grey
            btn.style.color = (idx === 4) ? '#d92525' : '#888888';
        }
    });
};

window.showMapPage = function() {
  window.hideAllPages();
  const mapContainer = document.getElementById('map-container');
  mapContainer.style.opacity = '1';
  mapContainer.style.pointerEvents = 'auto';
  
  document.getElementById('sidebar').style.display = 'flex';
  document.getElementById('app-header').style.display = 'flex';
  
  window.updateNavSlider(0); // Moves slider to Map
  setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 50);
};

window.showGroupsPage = function() {
  window.hideAllPages();
  document.getElementById('mobile-groups-page').style.display = 'block';
  
  window.updateNavSlider(1); // Moves slider to Groups
  
  const activeGroupsHTML = document.getElementById('my-groups-container').innerHTML; 
  const listContainer = document.getElementById('mobile-groups-list');
  if (activeGroupsHTML.trim() === '') { 
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: #888;">No active squads yet. Create one above!</div>`; 
  } else { 
      listContainer.innerHTML = activeGroupsHTML; 
  }
};

window.showRoutesPage = function() {
  window.hideAllPages();
  document.getElementById('mobile-routes-page').style.display = 'block';
  
  window.updateNavSlider(2); // Moves slider to Route
  if (typeof window.renderMobileRoutes === 'function') window.renderMobileRoutes();
};

window.showProfilePage = function() {
  window.hideAllPages();
  const profilePage = document.getElementById('mobile-profile-page');
  if (profilePage) profilePage.style.display = 'block';
  
  window.updateNavSlider(3); // Moves slider to Profile
};

window.showSOSPage = function() {
  window.hideAllPages();
  document.getElementById('mobile-sos-page').style.display = 'block';
  
  window.updateNavSlider(4); // Moves slider to SOS
};

// --- NEW MOBILE ROUTE VAULT LOGIC ---
window.currentVaultTab = 'solo';


// --- GREEN PILL: Find Nearest Pharmacy ---
window.findNearestPharmacy = function() {
  if (!navigator.geolocation) {
    window.open('https://www.google.com/maps/search/pharmacy+near+me/', '_blank');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var url = 'https://www.google.com/maps/dir/?api=1' +
        '&origin=' + lat + ',' + lng +
        '&destination=pharmacy+near+me' +
        '&travelmode=walking';
      window.open(url, '_blank');
    },
    function(error) {
      window.open('https://www.google.com/maps/search/pharmacy+near+me/', '_blank');
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
};

// --- RED PILL: Dial 100 with 3-second cooling period ---
window.initiateDial100 = function() {
  var overlay = document.getElementById('sos-dial-overlay');
  var countdownEl = document.getElementById('sos-countdown-number');
  var ringEl = document.getElementById('sos-ring-progress');
  var circumference = 2 * Math.PI * 54; // r=54 from SVG

  overlay.classList.add('active');

  var secondsLeft = 3;
  countdownEl.textContent = secondsLeft;

  // Reset the ring
  ringEl.style.transition = 'none';
  ringEl.style.strokeDasharray = circumference;
  ringEl.style.strokeDashoffset = '0';

  // Force reflow so the reset takes effect before animating
  void ringEl.getBoundingClientRect();
  ringEl.style.transition = 'stroke-dashoffset 1s linear';

  // Animate ring depletion each second
  var elapsed = 0;
  function tickRing() {
    elapsed++;
    ringEl.style.strokeDashoffset = (circumference * elapsed / 3);
  }

  // First tick immediately after 1 second
  sosCountdownInterval = setInterval(function() {
    secondsLeft--;
    if (secondsLeft > 0) {
      countdownEl.textContent = secondsLeft;
      tickRing();
    }
  }, 1000);

  // After 3 seconds, actually place the call
  sosDialTimer = setTimeout(function() {
    clearInterval(sosCountdownInterval);
    overlay.classList.remove('active');
    window.location.href = 'tel:100';
  }, 3000);
};

window.cancelDial100 = function() {
  clearTimeout(sosDialTimer);
  clearInterval(sosCountdownInterval);
  sosDialTimer = null;
  sosCountdownInterval = null;
  document.getElementById('sos-dial-overlay').classList.remove('active');
};

window.switchVaultTab = function(tab) {
  window.currentVaultTab = tab;
  const slider = document.getElementById('vault-tab-slider');
  const btnSolo = document.getElementById('vault-btn-solo');
  const btnGroup = document.getElementById('vault-btn-group');
  const filterSelect = document.getElementById('vault-filter-select');

  if (tab === 'solo') {
    slider.style.transform = 'translateX(0)';
    btnSolo.classList.add('active'); btnGroup.classList.remove('active');
    if(filterSelect) filterSelect.style.display = 'none'; 
  } else {
    slider.style.transform = 'translateX(100%)';
    btnGroup.classList.add('active'); btnSolo.classList.remove('active');
    if(filterSelect) filterSelect.style.display = 'block'; 
    if(typeof window.populateVaultGroupFilter === 'function') window.populateVaultGroupFilter();
  }
  if(typeof window.renderMobileRoutes === 'function') window.renderMobileRoutes();
};

window.populateVaultGroupFilter = async function() {
  if (!window.currentUser || !window.firebaseDB) return;
  try {
      const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
      const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
      const snap = await get(vaultRef);
      let vault = snap.exists() ? snap.val() : [];
      
      const groupCodes = [...new Set(vault.filter(r => r.mode === 'group').map(r => r.code))];
      const filterSelect = document.getElementById('vault-filter-select');
      
      let html = `<option value="all">All Hubba Rooms</option>`;
      groupCodes.forEach(code => { html += `<option value="${code}">Room: ${code}</option>`; });
      if(filterSelect) filterSelect.innerHTML = html;
  } catch(e) {}
};

window.renderMobileRoutes = async function() {
  const list = document.getElementById('mobile-routes-list');
  if (!list) return;

  if (!window.currentUser || !window.firebaseDB) {
     list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color:#888; font-weight: 600;"><span style="font-size: 3rem; display:block; margin-bottom: 10px; opacity:0.6;">🔒</span>Please log in to view your Route Vault.</div>`;
     return;
  }

  try {
      const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
      const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
      const snap = await get(vaultRef);
      let vault = snap.exists() ? snap.val() : [];
      
      // 1. Filter by Solo vs Group
      vault = vault.filter(r => r.mode === window.currentVaultTab);

      // 2. Filter by Specific Group
      if (window.currentVaultTab === 'group') {
         const selectedGroup = document.getElementById('vault-filter-select').value;
         if (selectedGroup && selectedGroup !== 'all') { vault = vault.filter(r => r.code === selectedGroup); }
      }

      // 3. Sort by Date (Cloud data is Newest First by default)
      const sortOrder = document.getElementById('vault-sort-select').value;
      if (sortOrder && sortOrder === 'oldest') vault.reverse();

      if (vault.length === 0) {
         list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color:#888; font-weight: 600;"><span style="font-size: 3rem; display:block; margin-bottom: 10px; opacity:0.6;">📭</span>No ${window.currentVaultTab} routes found.<br><br>Go map out your journey!</div>`;
         return;
      }

      let html = '';
      vault.forEach((route) => {
         const routeText = route.stops.map(s => s.name).join(' ➔ ');
         html += `
           <div class="history-card" style="margin-bottom: 0; border-left: 5px solid #d92525; background: #fff; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); padding: 16px;">
             <div class="history-card-header" style="display:flex; justify-content:space-between; font-weight:800; color:#4a0e17; margin-bottom:8px; font-size: 0.95rem;">
               <span>📍 ${route.startName} (${route.stopCount} Stops)</span>
               <span style="color:#888; font-size: 0.75rem; font-weight: normal; background: #f1f5f9; padding: 4px 8px; border-radius: 8px;">${route.date}</span>
             </div>
             <div class="history-card-route" style="font-size:0.85rem; color:#7a1b26; margin-bottom:16px; line-height:1.6; opacity: 0.9;">${routeText}</div>
             
             <div style="display:flex; flex-wrap: wrap; gap:8px;">
                 <button class="history-card-btn" style="flex:1; min-width: 120px; background: linear-gradient(135deg, #d4af37, #d92525); color: white; border: none; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(217,37,37,0.2);" onclick="window.loadArchivedRoute('${route.id}'); window.showMapPage();">🗺 Load on Map</button>
                 <button class="history-card-btn" style="flex:1; min-width: 120px; background: rgba(46, 204, 113, 0.1); color: #27ae60; border: 1px solid rgba(46, 204, 113, 0.3); padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem;" onclick="window.exportSpecificRouteToGPX('${route.id}')">📥 Save GPX</button>
                 <button class="history-card-btn" style="flex: 100%; background: #fff5f5; color: #d92525; border: 1px dashed rgba(217,37,37,0.3); padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem;" onclick="window.deleteArchivedRoute('${route.id}')">🗑️ Delete Route</button>
             </div>
           </div>
         `;
      });
      list.innerHTML = html;
  } catch(e) {
      list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color:#d92525; font-weight: 600;">Failed to load vault.</div>`;
  }
};

window.exportSpecificRouteToGPX = async function(id) {
    if (!window.currentUser || !window.firebaseDB) return;
    try {
        const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const vaultRef = ref(window.firebaseDB, `users/${window.currentUser.uid}/route_vault`);
        const snap = await get(vaultRef);
        if (snap.exists()) {
            let vault = snap.val();
            let route = vault.find(r => r.id === id);
            if(!route) return;
            
            const prev = window.activeGeneratedRoute;
            window.activeGeneratedRoute = route.stops;
            window.exportActiveRouteToGPX();
            window.activeGeneratedRoute = prev; 
        }
    } catch(e) {
        console.error("Export failed", e);
    }
};
// ==========================================
// MOBILE SWIPE PANEL (12% | 35% | 70%)
// ==========================================
const sidebar = document.getElementById('sidebar');
const dragArea = document.getElementById('drag-area');

if (sidebar && dragArea) {
  let dragStartY = 0; 
  let startHeight = 0;
  let isDragging = false;
  
  dragArea.addEventListener('touchstart', (e) => { 
    // CRITICAL FIX: Ignore touches if the user is trying to scroll the list or cards!
    if (e.target.closest('#pandal-list') || e.target.closest('.history-card') || e.target.closest('.intel-display-box')) {
        isDragging = false;
        return;
    }
    isDragging = true;
    dragStartY = e.touches[0].clientY; 
    startHeight = sidebar.offsetHeight; 
    sidebar.style.transition = 'none'; 
  }, { passive: true });
  
  dragArea.addEventListener('touchmove', (e) => {
    if (!isDragging) return; // Ignore movement if they are just scrolling
    let touchY = e.touches[0].clientY; 
    let deltaY = dragStartY - touchY; 
    let newHeight = startHeight + deltaY;
    
    const minHeight = window.innerHeight * 0.12; 
    const maxHeight = window.innerHeight * 0.70; 
    
    if (newHeight >= minHeight && newHeight <= maxHeight) { 
      sidebar.style.height = newHeight + 'px'; 
    }
  }, { passive: true });
  
  dragArea.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    sidebar.style.transition = 'height 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)'; 
    let currentHeight = sidebar.offsetHeight; 
    let vh = window.innerHeight; 
    
    if (currentHeight > vh * 0.55) { 
      sidebar.style.height = '70dvh'; 
    } else if (currentHeight > vh * 0.20) { 
      sidebar.style.height = '35dvh'; 
    } else { 
      sidebar.style.height = '12dvh'; 
    }
  });
}

// ==========================================
// MISSING CHAT WORKSPACE UI FIX
// ==========================================
window.openHubbaSheet = function() {
  document.getElementById('hubba-sheet-overlay').classList.add('visible');
  document.getElementById('hubba-bottom-sheet').classList.add('open');
  
  // NEW: Auto-cleanup the map and drafted proposals when opening chat
  if (window.isProposingForGroup) {
      if (typeof window.cancelProposalMode === 'function') window.cancelProposalMode();
  } else {
      const itineraryPanel = document.getElementById('itinerary-panel');
      if (itineraryPanel && itineraryPanel.style.display === 'block') {
         window.resetApp(false); 
      }
  }
};

window.closeHubbaSheet = function() {
  document.getElementById('hubba-sheet-overlay').classList.remove('visible');
  document.getElementById('hubba-bottom-sheet').classList.remove('open');
};

window.switchHubbaTab = function(tab) {
  const slider = document.getElementById('hubba-tab-slider');
  const btnChat = document.getElementById('tab-btn-chat');
  const btnPlan = document.getElementById('tab-btn-plan');
  const workChat = document.getElementById('hubba-workspace-chat');
  const workPlan = document.getElementById('hubba-workspace-plan');

  if (tab === 'chat') {
    slider.className = 'tab-slider chat-active';
    btnChat.classList.add('active'); btnPlan.classList.remove('active');
    workChat.style.display = 'flex'; workPlan.style.display = 'none';
  } else {
    slider.className = 'tab-slider plan-active';
    btnPlan.classList.add('active'); btnChat.classList.remove('active');
    workPlan.style.display = 'flex'; workChat.style.display = 'none';
  }
};

window.sendHubbaMessage = function() {
  const input = document.getElementById('hubba-chat-input');
  if (!input) return;
  const messageText = input.value.trim();
  if (messageText === "") return;
  
  const chatContainer = document.getElementById('hubba-chat-messages');
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msgHTML = `
    <div class="chat-msg-wrapper sent">
      <div class="chat-bubble">${messageText}</div>
      <div class="chat-time">${timeString}</div>
    </div>
  `;
  
  if (chatContainer) {
    chatContainer.insertAdjacentHTML('beforeend', msgHTML);
    input.value = "";
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
};

// ==========================================
// DYNAMIC ROUTE HISTORY
// ==========================================
window.savedChatRoutes = []; 

window.toggleRouteHistory = function() {
  const panel = document.getElementById('hubba-route-history-panel');
  if (!panel) return;
  if (panel.classList.contains('open')) { panel.classList.remove('open'); } else { panel.classList.add('open'); window.renderMockRouteHistory(); }
};

window.renderMockRouteHistory = function() {
  const list = document.getElementById('route-history-list');
  if (!list) return;
  
  if (window.savedChatRoutes.length === 0) {
     list.innerHTML = `<div style="text-align:center; padding: 30px; color:#888; font-weight: 600;">No routes drafted yet.<br><br>Use "Make a Plan" to propose a route!</div>`;
     return;
  }

  let historyHTML = `<div><div class="history-date-group">Recent Drafts</div>`;
  window.savedChatRoutes.forEach((draft, index) => {
     const routeText = draft.route.join(' ➔ ');
     historyHTML += `
       <div class="history-card" style="margin-bottom: 12px;">
         <div class="history-card-header">
           <span>Draft #${window.savedChatRoutes.length - index}</span>
           <span style="color:#888; font-size: 0.75rem; font-weight: normal;">${draft.time}</span>
         </div>
         <div class="history-card-route">📍 ${routeText}</div>
         <button class="history-card-btn" onclick="alert('Will load this exact route onto the map!')">🗺 View on Map</button>
       </div>
     `;
  });
  historyHTML += `</div>`;
  list.innerHTML = historyHTML;
};

// ==========================================
// SEAMLESS CINEMATIC PROPOSAL ENGINE
// ==========================================
window.isProposingForGroup = false;
window.proposedPandals = [];

window.exitProposalMode = function(reopenChat) {
  window.isProposingForGroup = false;
  window.proposedPandals = [];
  document.body.classList.remove('proposal-mode', 'has-drafts');

  const tilePane = document.querySelector('.leaflet-tile-pane');
  if (tilePane) tilePane.classList.remove('map-dimmed');

  const tooltip = document.getElementById('proposal-guidance-tooltip');
  if (tooltip) tooltip.classList.remove('tooltip-blink-fade');

  const cancelBtn = document.getElementById('cancel-proposal-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';

  const routeBtn = document.getElementById('generate-route-btn');
  if (routeBtn) routeBtn.onclick = window.showDisclaimerModal; 

  window.updateRouteActionBar(); // Re-evaluates for Solo mode

  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.matchMedia('(max-width: 768px)').matches) {
    sidebar.style.height = '40dvh';
  }

  const labelText = document.getElementById('count-label') ? document.getElementById('count-label').innerText : "All Kolkata (270)";
  if (typeof window.renderPandals === 'function') {
    window.renderPandals(window.currentPandals || window.allPandals, labelText);
  }

  if (reopenChat && typeof window.openHubbaSheet === 'function') {
    window.openHubbaSheet();
  }
};

window.cancelProposalMode = function() {
  window.exitProposalMode(true);
};

window.openPandalSearch = function() {
  if (typeof window.showMapPage === 'function') {
    window.showMapPage();
  }

  window.isProposingForGroup = true;
  window.proposedPandals = [];
  document.body.classList.add('proposal-mode');
  document.body.classList.remove('has-drafts');

  window.closeHubbaSheet();

  const tilePane = document.querySelector('.leaflet-tile-pane');
  if (tilePane) tilePane.classList.add('map-dimmed');

  const tooltip = document.getElementById('proposal-guidance-tooltip');
  if (tooltip) {
    tooltip.classList.remove('tooltip-blink-fade');
    void tooltip.offsetWidth;
    tooltip.classList.add('tooltip-blink-fade');
  }

  const labelText = document.getElementById('count-label') ? document.getElementById('count-label').innerText : "All Kolkata (270)";
  if (typeof window.renderPandals === 'function') {
    window.renderPandals(window.currentPandals || window.allPandals, labelText);
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.style.display = 'flex';
    if (window.matchMedia('(max-width: 768px)').matches) {
      sidebar.style.height = '55dvh';
    }
  }

  const cancelBtn = document.getElementById('cancel-proposal-btn');
  if (cancelBtn) cancelBtn.style.display = 'block';

  const routeBtn = document.getElementById('generate-route-btn');
  if (routeBtn) routeBtn.onclick = window.sendMultiProposal; 

  window.updateRouteActionBar(); // Updates visibility
};

window.sendMultiProposal = function() {
  if (window.proposedPandals.length === 0) {
    alert("Please select at least one pandal to propose.");
    return;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const pandalNames = window.proposedPandals.map(p => p.name);
  const roomCode = window.currentHubbaRoom;
  const db = window.firebaseDB || window.db;

  if (roomCode && db && typeof window.push === 'function' && typeof window.ref === 'function') {
    window.push(window.ref(db, `rooms/${roomCode}/chat`), {
      type: "multi_proposal",
      sender: localStorage.getItem('hubba_nickname') || "Friend",
      pandals: pandalNames,
      votes: {},
      time: timeString,
      timestamp: Date.now()
    });
  } else {
    window.savedChatRoutes.unshift({
      time: timeString,
      route: pandalNames
    });

    const listHTML = pandalNames.map(name => `
      <div class="multi-proposal-item">
        <div class="proposal-title">${name}</div>
        <div class="vote-panel-mini">
          <button class="vote-btn-mini up" type="button">👍 0</button>
          <button class="vote-btn-mini down" type="button">👎 0</button>
        </div>
      </div>
    `).join('');
    const msgHTML = `
      <div class="chat-bubble proposal outgoing">
        <span class="chat-sender">You proposed a route:</span>
        <div class="multi-proposal-container">${listHTML}</div>
        <span class="chat-time" style="display:block; text-align:right; margin-top:8px; float:none;">${timeString}</span>
      </div>
    `;

    const chatContainer = document.getElementById('hubba-chat-messages');
    if (chatContainer) {
      chatContainer.insertAdjacentHTML('beforeend', msgHTML);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    if (typeof window.renderMockRouteHistory === 'function') window.renderMockRouteHistory();
  }

  window.exitProposalMode(true);
};
// ==========================================
// OFFLINE GPX EXPORT & ROUTE VAULT ENGINE
// ==========================================
window.activeGeneratedRoute = [];

window.saveRouteToVault = function(routeArray) {
  let vault = JSON.parse(localStorage.getItem('parikrama_route_vault')) || [];
  
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

  // Prevent spam: Don't save if it's the exact same route they just generated 5 seconds ago
  if (vault.length > 0 && JSON.stringify(vault[0].stops) === JSON.stringify(routeArray)) return;

  vault.unshift(newRoute); // Push to the top of the vault
  localStorage.setItem('parikrama_route_vault', JSON.stringify(vault));
};

window.exportActiveRouteToGPX = function() {
  const routeArray = window.activeGeneratedRoute;
  if (!routeArray || routeArray.length === 0) {
    alert("No active route to download!");
    return;
  }

  // Generate the strict XML structure for GPS apps
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  gpx += `<gpx version="1.1" creator="Durga Puja Parikrama">\n`;
  gpx += `  <trk>\n`;
  gpx += `    <name>My Parikrama Route</name>\n`;
  gpx += `    <trkseg>\n`;

  routeArray.forEach(stop => {
    // Clean special characters so XML doesn't break
    const safeName = stop.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    gpx += `      <trkpt lat="${stop.lat}" lon="${stop.lng}">\n`;
    gpx += `        <name>${safeName}</name>\n`;
    gpx += `      </trkpt>\n`;
  });

  gpx += `    </trkseg>\n`;
  gpx += `  </trk>\n`;
  gpx += `</gpx>`;

  // Create a silent download link and trigger it instantly
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
window.renderRouteArchive = function() {
  const list = document.getElementById('route-history-list');
  if (!list) return;

  let vault = JSON.parse(localStorage.getItem('parikrama_route_vault')) || [];
  
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

  let historyHTML = `<div><div class="history-date-group">${window.currentHubbaRoom ? 'Group' : 'Solo'} Route Vault</div>`;
  vault.forEach((route) => {
     // Create a visual string of the stops
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
};

// Vault Actions (Load & Delete)
window.deleteArchivedRoute = function(id) {
   let vault = JSON.parse(localStorage.getItem('parikrama_route_vault')) || [];
   vault = vault.filter(r => r.id !== id);
   localStorage.setItem('parikrama_route_vault', JSON.stringify(vault));
   
   if (typeof window.renderRouteArchive === 'function') window.renderRouteArchive();
   if (typeof window.renderMobileRoutes === 'function') window.renderMobileRoutes();
};

window.loadArchivedRoute = function(id) {
   let vault = JSON.parse(localStorage.getItem('parikrama_route_vault')) || [];
   let route = vault.find(r => r.id === id);
   if(!route) return;
   
   window.startPoint = route.stops[0];
   window.selectedPandals = route.stops.slice(1); // Exclude start point from the pandal array
   
   const textEl = document.getElementById('start-pill-text');
   if (textEl) textEl.innerText = "📍 " + window.startPoint.name;
   
   document.getElementById('hubba-route-history-panel').classList.remove('open');
   generateSmartRoute();
};

// Wire the UI to the real Vault
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

// ==========================================
// 2. THE GHOST PANDAL FIX
// ==========================================
window.exitGroupMode = function() {
  window.isGroupRoutingActive = false;
  window.currentHubbaRoom = null;
  window.currentPlanRoom = null;
  
  if (typeof window.updateGroupModeBadge === 'function') window.updateGroupModeBadge();
  if (typeof window.closeHubbaSheet === 'function') window.closeHubbaSheet();
  
  // 1. FORCIBLY DROP THE GROUP'S DATA
  selectedPandals = [];
  
  // 2. LOAD PERSONAL SOLO DATA (if you had any from earlier)
  const savedRoute = localStorage.getItem('parikrama_saved_route');
  if (savedRoute) {
     try { selectedPandals = JSON.parse(savedRoute); } catch(e){ selectedPandals = []; }
  }
  
  // 3. WIPE LEFTOVER PROPOSAL/DRAFT UI
  window.isProposingForGroup = false;
  window.proposedPandals = [];
  document.body.classList.remove('proposal-mode', 'has-drafts');
  
  // 4. HIDE ITINERARY (pass false so we don't accidentally wipe your Solo data)
  window.resetApp(false);
  window.updateRouteActionBar();
  
  if (typeof window.renderPandals === 'function') {
     const currentTitle = document.getElementById('count-label') ? document.getElementById('count-label').innerText : "All Kolkata";
     window.renderPandals(window.currentPandals || window.allPandals, currentTitle);
  }
  if (typeof window.renderSidebarGroups === 'function') window.renderSidebarGroups();
};
// ==========================================
// CROWDSOURCED LIVE INTEL ENGINE (CLOUD & SCROLL FIX)
// ==========================================
window.liveIntelData = {};

window.openIntelModal = function(pandalName, safeKey) {
    document.getElementById('intel-safekey').value = safeKey;
    document.getElementById('intel-modal-subtitle').innerText = `Update status for ${pandalName}`;
    document.getElementById('intel-modal-overlay').classList.add('visible');
    document.getElementById('intel-modal').classList.add('visible');
};

window.closeIntelModal = function() {
    document.getElementById('intel-modal-overlay').classList.remove('visible');
    document.getElementById('intel-modal').classList.remove('visible');
};

window.submitIntel = async function() {
    if (!window.currentUser) return alert("Please log in to broadcast Intel.");
    
    const input = document.getElementById('intel-input-box');
    const safeKey = document.getElementById('intel-safekey').value;
    const text = input.value.trim();
    if (!text || !safeKey) return;
    
    document.getElementById('intel-submit-btn').innerText = "Sending...";

    try {
        const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const db = window.firebaseDB || window.db;
        
        // Save the intel specifically under their User ID
        await set(ref(db, `live_intel/${safeKey}/${window.currentUser.uid}`), {
            sender: window.currentUser.displayName || "Explorer",
            text: text,
            timestamp: Date.now()
        });
        
        window.closeIntelModal();
        input.value = "";
        document.getElementById('intel-submit-btn').innerText = "Broadcast Info";
        
    } catch(err) {
        console.error(err);
        alert("Network error. Please try again.");
        document.getElementById('intel-submit-btn').innerText = "Broadcast Info";
    }
};

window.syncIntelToUI = function() {
  Object.keys(window.liveIntelData).forEach(safeKey => {
    const intelGroup = window.liveIntelData[safeKey]; 
    const el = document.getElementById(`intel-display-${safeKey}`);
    
    if (el) {
      const now = Date.now();
      let validReports = [];
      
      // Collect all users' reports for this pandal
      if (intelGroup) {
          Object.values(intelGroup).forEach(report => {
              // 3-HOUR EXPIRATION LOGIC (10,800,000 ms)
              if (report.timestamp && (now - report.timestamp <= 10800000) && report.text) {
                  validReports.push(report);
              }
          });
      }
      
      // Sort so the newest reports are always at the top
      validReports.sort((a, b) => b.timestamp - a.timestamp);
      
      if (validReports.length > 0) {
        el.style.display = 'block';
        
        // UI FIX: The scrollable feed wrapper. Max height prevents map stretching!
        let html = `<div style="max-height: 110px; overflow-y: auto; padding-right: 5px; text-align: left; margin-bottom: 5px; border-radius: 6px;">`;
        
        validReports.forEach(r => {
            const cleanText = String(r.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const timeString = new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            html += `
              <div style="margin-bottom: 6px; background: #fff5f5; padding: 8px; border-radius: 8px; border-left: 3px solid #d92525; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <div style="font-size: 0.7rem; color: #888; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                      <strong style="color: #7a1b26;">${escapeHtml(r.sender)}</strong> <span>${timeString}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #4a0e17; line-height: 1.4;">${cleanText}</div>
              </div>
            `;
        });
        html += `</div>`;
        el.innerHTML = html;
      } else {
        el.style.display = 'none';
        el.innerHTML = '';
      }
    }
  });
};

// 1. Hook into the Click Delegator
const existingClickHandler = window._ratingClickHandler;
window._ratingClickHandler = function(e) {
    const intelBtn = e.target.closest('[data-action="open-intel"]');
    if (intelBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.openIntelModal(intelBtn.getAttribute('data-name'), intelBtn.getAttribute('data-safekey'));
        return;
    }
    if (existingClickHandler) existingClickHandler(e);
};

// 2. Hook Firebase Intel Sync into the Rating Engine Init
const existingInit = window.initRatingEngine;
window.initRatingEngine = async function() {
    if (existingInit) await existingInit();
    try {
        const { ref, onValue } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
        const db = window.firebaseDB || window.db;
        if (!db) return;
        
        onValue(ref(db, 'live_intel'), (snapshot) => {
            window.liveIntelData = snapshot.exists() ? snapshot.val() : {};
            window.syncIntelToUI();
        });
    } catch(e) { console.error("Intel sync failed", e); }
};

// 3. Inject Intel when a map popup opens
map.on('popupopen', function(e) {
    window.syncIntelToUI();
});
// ==========================================
// SPLASH SCREEN & BOOT SEQUENCE (BULLETPROOF)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // 1. Start Map & Rendering
  if (typeof window.initRatingEngine === 'function') window.initRatingEngine();
  
  const params = new URLSearchParams(window.location.search);
  const routeParam = params.get('route'); const startParam = params.get('start');
  let shouldGenerateRoute = false;

  if (routeParam) {
    const routeNames = routeParam.split('|'); const loadedPandals = (window.allPandals || []).filter(p => routeNames.includes(p.name));
    if (loadedPandals.length > 0) { selectedPandals = loadedPandals; shouldGenerateRoute = true; }
  }
  if (startParam) {
    const parts = startParam.split(',');
    if (parts.length >= 3) {
      startPoint = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]), name: parts.slice(2).join(',') };
      const pillText = document.getElementById('start-pill-text'); if (pillText) pillText.innerText = "📍 Shared Start Point";
    }
  }
  if (shouldGenerateRoute && startPoint) { setTimeout(() => { generateSmartRoute(); }, 800); }
  window.renderPandals(window.allPandals || [], `All Kolkata • ${(window.allPandals || []).length} Clubs`);

  // 2. Handle Splash Screen Curtain
  const splash = document.getElementById('splash-screen');
  const video = document.getElementById('splash-video');
  
  const destroySplash = () => {
      if (splash) {
          splash.style.transition = "opacity 0.4s ease";
          splash.style.opacity = "0";
          setTimeout(() => { 
              splash.remove(); // Physically destroys the black box
              setTimeout(() => { if(map) map.invalidateSize(); }, 200); 
          }, 400);
      }
  };

  if (splash && video) {
    video.addEventListener('ended', destroySplash);
    
    // Auto-play rejection handler: Skip the splash instantly if the phone blocks the video
    let playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Video autoplay blocked by browser. Skipping splash screen.");
            destroySplash(); 
        });
    }
    
    // Failsafe drops curtain after 5 seconds no matter what
    setTimeout(destroySplash, 5000); 
  } else {
    destroySplash();
  }
});

// ==========================================
// MASTER FIREBASE AUTH ENGINE
// ==========================================
window.isLoginMode = false;
window.currentUser = null;

window.toggleAuthMode = function() {
    window.isLoginMode = !window.isLoginMode;
    document.getElementById('auth-title').innerText = window.isLoginMode ? "Welcome Back" : "Join Parikrama";
    document.getElementById('auth-action-btn').innerText = window.isLoginMode ? "Log In" : "Sign Up";
    document.getElementById('auth-toggle-text').innerText = window.isLoginMode ? "Need an account? Sign Up" : "Already have an account? Log In";
    document.getElementById('auth-name').style.display = window.isLoginMode ? "none" : "block";
};

window.initAuthEngine = async function() {
    try {
        // Wait safely for Firebase to connect from hubba.js
        let tries = 0;
        while (!(window.firebaseApp || window.app) && tries < 50) {
            await new Promise(r => setTimeout(r, 100));
            tries++;
        }
        
        if (!(window.firebaseApp || window.app)) {
            console.error("Firebase app not found. Auth cannot initialize.");
            return;
        }
        
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");

        window.auth = getAuth(window.firebaseApp || window.app);

        // Ensure auth state persists across page reloads
        try {
            await setPersistence(window.auth, browserLocalPersistence);
        } catch (persistError) {
            console.warn("Persistence set failed:", persistError);
        }

        window.firebaseAuthAPI = { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signOut };

        onAuthStateChanged(window.auth, (user) => {
            console.log("[Auth] onAuthStateChanged fired, user:", user ? user.uid : null);
            const authOverlay = document.getElementById('auth-overlay');
            if (user) {
                window.currentUser = user;
                // Secretly HIDE login screen
                if (authOverlay) authOverlay.style.display = 'none';

                const pName = document.getElementById('profile-name');
                const pEmail = document.getElementById('profile-email');
                if (pName) pName.innerText = user.displayName || "Explorer";
                if (pEmail) pEmail.innerText = user.email;

                if (user.photoURL) {
                    const pAvatar = document.getElementById('profile-avatar');
                    const nImg = document.getElementById('nav-profile-img');
                    if(pAvatar) { pAvatar.src = user.photoURL; pAvatar.style.display = 'block'; }
                    if(nImg) { nImg.src = user.photoURL; nImg.style.display = 'block'; }
                    
                    const pFallback = document.getElementById('profile-fallback');
                    const nFallback = document.getElementById('nav-profile-fallback');
                    if(pFallback) pFallback.style.display = 'none';
                    if(nFallback) nFallback.style.display = 'none';
                } else {
                    const pAvatar = document.getElementById('profile-avatar');
                    const nImg = document.getElementById('nav-profile-img');
                    const pFallback = document.getElementById('profile-fallback');
                    const nFallback = document.getElementById('nav-profile-fallback');
                    
                    if(pAvatar) pAvatar.style.display = 'none';
                    if(nImg) nImg.style.display = 'none';
                    if(pFallback) pFallback.style.display = 'block';
                    
                    if(nFallback) {
                        nFallback.style.display = 'flex';
                        nFallback.innerText = user.displayName ? user.displayName.charAt(0).toUpperCase() : '👤';
                    }
                }
            } else {
                window.currentUser = null;
                // Secretly SHOW login screen
                if (authOverlay) {
                    authOverlay.style.display = 'flex';
                }
                const nImg = document.getElementById('nav-profile-img');
                const nFallback = document.getElementById('nav-profile-fallback');
                if(nImg) nImg.style.display = 'none';
                if(nFallback) nFallback.style.display = 'block';
            }
        });
    } catch (e) { console.error("Auth Engine Failed:", e); }
};

window.submitAuth = async function() {
    if (!window.firebaseAuthAPI) return alert("System connecting to database, please wait 1 second and try again.");
    
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const name = document.getElementById('auth-name').value.trim();
    const btn = document.getElementById('auth-action-btn');
    
    if (!email || !pass || (!window.isLoginMode && !name)) return alert("Please fill all fields!");
    btn.innerText = "Processing...";
    
    try {
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = window.firebaseAuthAPI;
        if (window.isLoginMode) {
            await signInWithEmailAndPassword(window.auth, email, pass);
        } else {
            const userCred = await createUserWithEmailAndPassword(window.auth, email, pass);
            await updateProfile(userCred.user, { displayName: name });
        }
        
        // INSTANT UI FIX: Hide the screen immediately so there is no flash, then reset the button secretly
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'none';
        setTimeout(() => { btn.innerText = window.isLoginMode ? "Log In" : "Sign Up"; }, 500);

    } catch (error) {
        alert("Error: " + error.message.replace("Firebase: ", ""));
        btn.innerText = window.isLoginMode ? "Log In" : "Sign Up";
    }
};

window.signInWithGoogle = async function() {
    if (!window.firebaseAuthAPI) return alert("System connecting to database, please wait 1 second and try again.");

    const btn = document.getElementById('google-auth-btn');
    const originalHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 20px;" alt="Google"> Continue with Google`;
    btn.innerText = "Opening Google...";

    try {
        const { GoogleAuthProvider, signInWithPopup } = window.firebaseAuthAPI;
        const provider = new GoogleAuthProvider();
        
        await signInWithPopup(window.auth, provider);
        
        // INSTANT UI FIX: Hide the screen the exact millisecond the popup succeeds, and reset the button text instantly
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'none';
        btn.innerHTML = originalHTML;
        
    } catch (error) {
        console.error("Google Auth failed", error);
        if (error.code === 'auth/popup-closed-by-user') {
             // User closed the window, reset the button
             btn.innerHTML = originalHTML;
        } else {
             alert("Failed to connect to Google: " + error.message.replace("Firebase: ", ""));
             btn.innerHTML = originalHTML;
        }
    }
};

window.logOutUser = async function() {
    if (!window.firebaseAuthAPI) return alert("System connecting to database, please wait 1 second and try again.");
    try {
        const { signOut } = window.firebaseAuthAPI;
        await signOut(window.auth);
        
        // Return to map and hide profile page
        window.showMapPage();
        
        // Reset the auth form back to the default signup state entirely
        window.isLoginMode = false;
        document.getElementById('auth-title').innerText = "Join Parikrama";
        document.getElementById('auth-action-btn').innerText = "Sign Up";
        document.getElementById('auth-toggle-text').innerText = "Already have an account? Log In";
        
        // Failsafe: Force the Google button to look normal upon logout
        const gBtn = document.getElementById('google-auth-btn');
        if (gBtn) gBtn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 20px;" alt="Google"> Continue with Google`;
        
        const nameField = document.getElementById('auth-name');
        if (nameField) nameField.style.display = "block";
        document.getElementById('auth-name').value = "";
        document.getElementById('auth-email').value = "";
        document.getElementById('auth-pass').value = "";
        
        // Close profile modal if open
        const profileModal = document.getElementById('profile-modal-overlay');
        if(profileModal) window.closeProfileModal();

        // Reveal the fresh login screen
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'flex';
        
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Error: " + error.message.replace("Firebase: ", ""));
    }
};

// Boot up Auth immediately in the background while Splash Screen plays
window.initAuthEngine();
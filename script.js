const dom = {
  useLocationButton: document.getElementById('use-location'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  locationName: document.getElementById('location-name'),
  coords: document.getElementById('coords'),
  currentTemp: document.getElementById('current-temp'),
  currentSummary: document.getElementById('current-summary'),
  apparentTemp: document.getElementById('apparent-temp'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  precipProb: document.getElementById('precip-prob'),
  uv: document.getElementById('uv'),
  aqi: document.getElementById('aqi'),
  pm25: document.getElementById('pm25'),
  hourly: document.getElementById('hourly'),
  commuteScore: document.getElementById('commute-score'),
  commuteNotes: document.getElementById('commute-notes'),
  acAdvice: document.getElementById('ac-advice'),
  acNotes: document.getElementById('ac-notes')
};

const storageKeys = {
  lastPlace: 'climate.lastPlace',
  lastData: 'climate.lastData'
};

// API base URL - defaults to localhost for development
const API_BASE_URL = 'http://localhost:3000/api';

// Check if we're running in a server environment
const isServerAvailable = () => {
  // This will be updated based on whether we can connect to our backend
  return true;
};

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function readFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) { return fallback; }
}

// Save location to MongoDB
async function saveLocationToDB(place, lat, lon) {
  if (!isServerAvailable()) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: place,
        latitude: lat,
        longitude: lon
      })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error saving location to DB:', error);
    return null;
  }
}

// Save weather data to MongoDB
async function saveWeatherDataToDB(locationId, weatherData, airData) {
  if (!isServerAvailable() || !locationId) return null;
  
  try {
    const current = weatherData.current;
    const airCurrent = airData?.current || {};
    
    const response = await fetch(`${API_BASE_URL}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: locationId,
        temperature: current.temperature_2m,
        apparentTemperature: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitationProbability: current.precipitation_probability,
        uvIndex: current.uv_index,
        aqi: airCurrent.us_aqi,
        pm25: airCurrent.pm2_5
      })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error saving weather data to DB:', error);
    return null;
  }
}

// Get locations from MongoDB
async function getLocationsFromDB() {
  if (!isServerAvailable()) return [];
  
  try {
    const response = await fetch(`${API_BASE_URL}/locations`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching locations from DB:', error);
    return [];
  }
}

function formatNumber(value, digits = 0) {
  return Number(value).toFixed(digits);
}

function windDescription(speedKmh) {
  if (speedKmh < 10) return 'calm';
  if (speedKmh < 20) return 'light breeze';
  if (speedKmh < 35) return 'breezy';
  if (speedKmh < 60) return 'windy';
  return 'very windy';
}

function aqiBadgeClass(aqi) {
  if (aqi == null) return '';
  if (aqi <= 50) return 'badge good';
  if (aqi <= 100) return 'badge warn';
  return 'badge bad';
}

async function geocodePlace(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Geocoding failed');
  const arr = await res.json();
  if (!arr.length) throw new Error('No results');
  const first = arr[0];
  return {
    name: first.display_name,
    lat: Number(first.lat),
    lon: Number(first.lon)
  };
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  return data.display_name || `${formatNumber(lat, 3)}, ${formatNumber(lon, 3)}`;
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'precipitation_probability',
      'uv_index'
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'wind_speed_10m',
      'uv_index'
    ].join(','),
    forecast_days: '2',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: ['us_aqi', 'pm2_5'].join(','),
    hourly: ['us_aqi', 'pm2_5'].join(','),
    timezone: 'auto'
  });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Air quality fetch failed');
  return res.json();
}

function computeCommuteComfortScore(weatherData, airData) {
  const c = weatherData.current;
  const aqi = airData?.current?.us_aqi ?? null;
  let score = 100;
  let reasons = [];

  const apparent = c.apparent_temperature;
  if (apparent < 0) { score -= 25; reasons.push('freezing'); }
  else if (apparent < 5) { score -= 15; reasons.push('very cold'); }
  else if (apparent < 10) { score -= 8; reasons.push('chilly'); }
  else if (apparent > 35) { score -= 30; reasons.push('extreme heat'); }
  else if (apparent > 30) { score -= 18; reasons.push('hot'); }
  else if (apparent > 25) { score -= 8; reasons.push('warm'); }

  const wind = c.wind_speed_10m;
  if (wind > 40) { score -= 20; reasons.push('strong winds'); }
  else if (wind > 25) { score -= 10; reasons.push('windy'); }

  const p = c.precipitation_probability ?? 0;
  if (p > 70) { score -= 25; reasons.push('likely rain'); }
  else if (p > 40) { score -= 12; reasons.push('chance of rain'); }

  if (aqi != null) {
    if (aqi > 150) { score -= 30; reasons.push('unhealthy air'); }
    else if (aqi > 100) { score -= 15; reasons.push('moderate air'); }
    else if (aqi > 50) { score -= 5; reasons.push('ok air'); }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  let notes;
  if (score >= 80) notes = 'Great for walking/biking.';
  else if (score >= 60) notes = 'Decent; light layers recommended.';
  else if (score >= 40) notes = 'Consider transit or driving.';
  else notes = 'Avoid long outdoor exposure.';
  return { score, notes, reasons };
}

function computeAcEfficiencyAdvice(weatherData) {
  const c = weatherData.current;
  const outdoorTemp = c.temperature_2m;
  const humidity = c.relative_humidity_2m;

  let recommendedSetpoint;
  if (outdoorTemp >= 34) recommendedSetpoint = 26;
  else if (outdoorTemp >= 30) recommendedSetpoint = 25;
  else if (outdoorTemp >= 26) recommendedSetpoint = 24;
  else recommendedSetpoint = 23;

  const humidityImpact = humidity > 65 ? 'High humidity, use dehumidify/fan mode if available.' : 'Humidity is fine.';

  let savingsEstimate;
  const delta = 24 - recommendedSetpoint; // positive means we suggest higher setpoint than 24
  if (delta > 0) savingsEstimate = `${delta * 3}% approx energy savings vs 24°C`;
  else savingsEstimate = 'Max comfort mode — higher energy use.';

  const tip = outdoorTemp > 30 ? 'Close blinds, pre-cool early evening.' : 'Use natural ventilation when cooler.';

  return {
    text: `Set to ~${recommendedSetpoint}°C for efficiency`,
    notes: `${humidityImpact} ${tip} ${savingsEstimate}`
  };
}

function updateUI(place, lat, lon, weatherData, airData) {
  dom.locationName.textContent = place;
  dom.coords.textContent = `${formatNumber(lat, 3)}, ${formatNumber(lon, 3)}`;

  const c = weatherData.current;
  dom.currentTemp.textContent = `${formatNumber(c.temperature_2m, 0)}°C`;
  dom.currentSummary.textContent = `${formatNumber(c.wind_speed_10m, 0)} km/h ${windDescription(c.wind_speed_10m)}`;
  dom.apparentTemp.textContent = `${formatNumber(c.apparent_temperature, 0)}°C`;
  dom.humidity.textContent = `${formatNumber(c.relative_humidity_2m, 0)}%`;
  dom.wind.textContent = `${formatNumber(c.wind_speed_10m, 0)} km/h`;
  dom.precipProb.textContent = `${formatNumber(c.precipitation_probability ?? 0, 0)}%`;
  const uvCurrent = weatherData.current.uv_index ?? weatherData.hourly?.uv_index?.[0] ?? null;
  dom.uv.textContent = uvCurrent != null ? formatNumber(uvCurrent, 1) : '—';

  const aqi = airData?.current?.us_aqi ?? null;
  const pm25 = airData?.current?.pm2_5 ?? null;
  dom.aqi.innerHTML = aqi != null ? `<span class="badge ${aqiBadgeClass(aqi)}">${Math.round(aqi)}</span>` : '—';
  dom.pm25.textContent = pm25 != null ? `${formatNumber(pm25, 1)} µg/m³` : '—';

  const commute = computeCommuteComfortScore(weatherData, airData);
  dom.commuteScore.textContent = `${commute.score}/100`;
  dom.commuteNotes.textContent = `${commute.notes}${commute.reasons.length ? ' · ' + commute.reasons.join(', ') : ''}`;

  const ac = computeAcEfficiencyAdvice(weatherData);
  dom.acAdvice.textContent = ac.text;
  dom.acNotes.textContent = ac.notes;

  const times = weatherData.hourly.time;
  const t = weatherData.hourly.temperature_2m;
  const p = weatherData.hourly.precipitation_probability;
  const w = weatherData.hourly.wind_speed_10m;
  const u = weatherData.hourly.uv_index;
  const fragment = document.createDocumentFragment();
  const now = new Date();
  for (let i = 0; i < Math.min(24, times.length); i++) {
    const card = document.createElement('div');
    card.className = 'hour';
    const dt = new Date(times[i]);
    const label = dt.getDate() === now.getDate() ? dt.toLocaleTimeString([], { hour: '2-digit' }) : dt.toLocaleString([], { weekday: 'short', hour: '2-digit' });
    const aqiHour = airData?.hourly?.us_aqi?.[i] ?? null;
    const aqiHtml = aqiHour != null ? `<span class=\"badge ${aqiBadgeClass(aqiHour)}\">AQI ${Math.round(aqiHour)}</span>` : '';
    card.innerHTML = `
      <div class="time">${label}</div>
      <div class="t">${formatNumber(t[i], 0)}°C</div>
      <div>${formatNumber(w[i], 0)} km/h</div>
      <div>${formatNumber(p[i] ?? 0, 0)}% rain</div>
      <div>${aqiHtml} ${u?.[i] != null ? `<span class="badge ${u[i] >= 8 ? 'bad' : u[i] >= 6 ? 'warn' : 'good'}">UV ${formatNumber(u[i], 0)}</span>` : ''}</div>
    `;
    fragment.appendChild(card);
  }
  dom.hourly.replaceChildren(fragment);
}

async function loadAndRender(place, lat, lon) {
  dom.locationName.textContent = 'Loading…';
  try {
    const [weatherData, airData] = await Promise.all([
      fetchWeather(lat, lon),
      fetchAirQuality(lat, lon)
    ]);
    updateUI(place, lat, lon, weatherData, airData);
    saveToStorage(storageKeys.lastPlace, { place, lat, lon });
    saveToStorage(storageKeys.lastData, { weatherData, airData, timestamp: Date.now() });
    
    // Save to MongoDB if server is available
    if (isServerAvailable()) {
      const locationResult = await saveLocationToDB(place, lat, lon);
      if (locationResult && locationResult._id) {
        await saveWeatherDataToDB(locationResult._id, weatherData, airData);
      }
    }
  } catch (err) {
    dom.locationName.textContent = place;
    dom.currentSummary.textContent = 'Failed to load data';
  }
}

async function handleUseLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    let place;
    try { place = await reverseGeocode(lat, lon); } catch (_) { place = 'My location'; }
    loadAndRender(place, lat, lon);
  }, () => alert('Unable to get location'));
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const q = dom.searchInput.value.trim();
  if (!q) return;
  dom.searchInput.disabled = true;
  try {
    const { name, lat, lon } = await geocodePlace(q);
    loadAndRender(name, lat, lon);
  } catch (err) {
    alert('Place not found');
  } finally {
    dom.searchInput.disabled = false;
  }
}

function restoreLastSession() {
  const lastPlace = readFromStorage(storageKeys.lastPlace, null);
  const lastData = readFromStorage(storageKeys.lastData, null);
  if (lastPlace && lastData && Date.now() - lastData.timestamp < 1000 * 60 * 30) {
    updateUI(lastPlace.place, lastPlace.lat, lastPlace.lon, lastData.weatherData, lastData.airData);
  }
}

// Display recent locations from MongoDB
async function displayRecentLocations() {
  const recentLocationsContainer = document.getElementById('recent-locations');
  if (!recentLocationsContainer || !isServerAvailable()) return;
  
  try {
    const locations = await getLocationsFromDB();
    if (!locations.length) return;
    
    // Show only the 5 most recent locations
    const recent = locations.slice(-5);
    
    // Clear container
    recentLocationsContainer.innerHTML = '';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Recent:';
    title.style.fontSize = '12px';
    title.style.color = 'var(--muted)';
    title.style.marginRight = '8px';
    title.style.alignSelf = 'center';
    recentLocationsContainer.appendChild(title);
    
    // Add buttons for each location
    recent.forEach(location => {
      const button = document.createElement('button');
      button.textContent = location.name.length > 20 ? location.name.substring(0, 17) + '...' : location.name;
      button.title = location.name;
      button.onclick = () => loadAndRender(location.name, location.latitude, location.longitude);
      recentLocationsContainer.appendChild(button);
    });
  } catch (error) {
    console.error('Error displaying recent locations:', error);
  }
}

// Periodically update recent locations
setInterval(displayRecentLocations, 30000); // Every 30 seconds

// Event listeners
dom.useLocationButton.addEventListener('click', handleUseLocation);
dom.searchForm.addEventListener('submit', handleSearchSubmit);

// Initialize
restoreLastSession();
displayRecentLocations();

// Map integration using Leaflet
let map, marker;
function initMap() {
  if (typeof L === 'undefined') return; // Leaflet not loaded yet
  if (map) return;
  map = L.map('map', { attributionControl: false }).setView([20, 0], 2);
  // English labels with blue oceans via CARTO Voyager basemap (no API key)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    detectRetina: true,
    attribution: '© OpenStreetMap contributors © CARTO'
  }).addTo(map);

  // Overlay layers
  overlays.earthquakes = L.layerGroup().addTo(map);
  overlays.naturalEvents = L.layerGroup().addTo(map);
  L.control.layers({}, { 'Earthquakes (USGS)': overlays.earthquakes, 'Natural Events (NASA EONET)': overlays.naturalEvents }, { collapsed: false }).addTo(map);

  // Initial load of overlays and periodic refresh
  refreshDisasterOverlays();
  setInterval(refreshDisasterOverlays, 5 * 60 * 1000);

  map.on('click', async (e) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    if (!marker) marker = L.marker([lat, lon]).addTo(map);
    else marker.setLatLng([lat, lon]);
    let place;
    try { place = await reverseGeocode(lat, lon); } catch (_) { place = `${formatNumber(lat, 3)}, ${formatNumber(lon, 3)}`; }
    loadAndRender(place, lat, lon);
    lastPlaceForMarker = { place, lat, lon };
    try {
      lastHourly = (await fetchWeather(lat, lon)).hourly;
      updateMarkerPopupForHour(parseInt(timeUI.slider?.value || '0', 10));
    } catch (_) { lastHourly = null; }
  });
}

window.addEventListener('load', () => {
  setTimeout(initMap, 0);
});

// Disaster overlays data & rendering
const overlays = { earthquakes: null, naturalEvents: null };
const timeUI = { slider: document.getElementById('time-slider'), label: document.getElementById('time-label') };
let lastHourly = null;
let lastPlaceForMarker = null;

async function fetchUSGSEarthquakes() {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const res = await fetch(url);
  if (!res.ok) throw new Error('USGS feed failed');
  return res.json();
}

async function fetchEONETEvents() {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';
  const res = await fetch(url);
  if (!res.ok) throw new Error('EONET feed failed');
  return res.json();
}

function colorForMagnitude(m) {
  if (m >= 6) return '#ff3b3b';
  if (m >= 5) return '#ff7a3b';
  if (m >= 4) return '#ffb33b';
  if (m >= 3) return '#ffd23b';
  return '#a3e635';
}

function addUSGSEarthquakesToMap(geojson) {
  overlays.earthquakes.clearLayers();
  const features = geojson.features || [];
  features.forEach((f) => {
    const [lon, lat, depthKm] = f.geometry.coordinates;
    const mag = f.properties.mag ?? 0;
    const title = f.properties.place || 'Earthquake';
    const time = new Date(f.properties.time);
    const circle = L.circleMarker([lat, lon], {
      radius: Math.max(3, mag * 2.5),
      color: colorForMagnitude(mag),
      weight: 1,
      fillColor: colorForMagnitude(mag),
      fillOpacity: 0.6
    });
    circle.bindPopup(
      `<strong>${title}</strong><br>Magnitude: ${mag}<br>Depth: ${depthKm} km<br>${time.toLocaleString()}`
    );
    circle.addTo(overlays.earthquakes);
  });
}

function addEONETEventsToMap(eonet) {
  overlays.naturalEvents.clearLayers();
  const events = eonet.events || [];
  events.forEach((ev) => {
    const categories = (ev.categories || []).map((c) => c.title).join(', ');
    // Each event has geometries; use the latest point if available
    const last = ev.geometries && ev.geometries[ev.geometries.length - 1];
    if (!last) return;
    const coords = last.coordinates;
    let lat, lon;
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      // EONET uses [lon, lat]
      lon = coords[0];
      lat = coords[1];
    } else return;
    const icon = L.divIcon({
      className: 'eonet-icon',
      html: `<span style="display:inline-block;padding:4px 6px;border-radius:6px;background:#4ea1ff;color:#001428;font-weight:700;font-size:11px;">${(ev.title || 'Event').slice(0, 18)}${(ev.title||'').length>18?'…':''}</span>`
    });
    const m = L.marker([lat, lon], { icon });
    const date = new Date(last.date);
    m.bindPopup(`
      <strong>${ev.title || 'Event'}</strong><br>
      Category: ${categories || '—'}<br>
      Date: ${date.toLocaleString()}<br>
      <a href="${ev.sources?.[0]?.url || ev.link || '#'}" target="_blank" rel="noopener">Details</a>
    `);
    m.addTo(overlays.naturalEvents);
  });
}

async function refreshDisasterOverlays() {
  try {
    const [usgs, eonet] = await Promise.allSettled([fetchUSGSEarthquakes(), fetchEONETEvents()]);
    if (usgs.status === 'fulfilled') addUSGSEarthquakesToMap(usgs.value);
    if (eonet.status === 'fulfilled') addEONETEventsToMap(eonet.value);
  } catch (_) { /* ignore */ }
}

function updateMarkerPopupForHour(hourIndex) {
  if (!marker || !lastHourly) return;
  const t = lastHourly.temperature_2m?.[hourIndex];
  const u = lastHourly.uv_index?.[hourIndex];
  const p = lastHourly.precipitation_probability?.[hourIndex];
  const timeStr = new Date(lastHourly.time?.[hourIndex]).toLocaleString([], { weekday: 'short', hour: '2-digit' });
  const html = `
    <div><strong>${lastPlaceForMarker?.place || 'Selected location'}</strong></div>
    <div>${timeStr}</div>
    <div>Temp: ${t != null ? `${formatNumber(t, 0)}°C` : '—'}</div>
    <div>UV: ${u != null ? formatNumber(u, 0) : '—'} · Rain: ${p != null ? `${formatNumber(p, 0)}%` : '—'}</div>
  `;
  marker.bindPopup(html).openPopup();
}

if (timeUI.slider) {
  timeUI.slider.addEventListener('input', (e) => {
    const idx = parseInt(e.target.value, 10);
    const label = idx === 0 ? 'Now' : `${idx}h`;
    if (timeUI.label) timeUI.label.textContent = label;
    updateMarkerPopupForHour(idx);
  });
}



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

// Energy insights elements (separate to avoid errors if elements don't exist)
const energyDom = {
  heatingCoolingStatus: null,
  heatingCoolingDetails: null,
  heatingCoolingRecommendations: null,
  solarPotentialStatus: null,
  solarPotentialDetails: null,
  solarRecommendations: null,
  energyCostStatus: null,
  energyCostDetails: null,
  energyCostBreakdown: null
};

// Initialize energy DOM elements when page loads
function initEnergyDom() {
  energyDom.heatingCoolingStatus = document.getElementById('heating-cooling-status');
  energyDom.heatingCoolingDetails = document.getElementById('heating-cooling-details');
  energyDom.heatingCoolingRecommendations = document.getElementById('heating-cooling-recommendations');
  energyDom.solarPotentialStatus = document.getElementById('solar-potential-status');
  energyDom.solarPotentialDetails = document.getElementById('solar-potential-details');
  energyDom.solarRecommendations = document.getElementById('solar-recommendations');
  energyDom.energyCostStatus = document.getElementById('energy-cost-status');
  energyDom.energyCostDetails = document.getElementById('energy-cost-details');
  energyDom.energyCostBreakdown = document.getElementById('energy-cost-breakdown');
}

// Disaster info elements
const disasterInfoButton = document.getElementById('disaster-info');
const disasterModal = document.getElementById('disaster-modal');
const closeModalButton = document.getElementById('close-modal');
const earthquakesList = document.getElementById('earthquakes-list');
const eventsList = document.getElementById('events-list');

// Advisory elements
const advisoryInfoButton = document.getElementById('advisory-info');
const advisoryModal = document.getElementById('advisory-modal');
const closeAdvisoryModalButton = document.getElementById('close-advisory-modal');
const countrySelect = document.getElementById('country-select');
const getAdvisoryButton = document.getElementById('get-advisory');
const advisoryContent = document.getElementById('advisory-content');

// AI Travel Advisor elements
const aiTravelAdvisorButton = document.getElementById('ai-travel-advisor');
const aiAdvisorModal = document.getElementById('ai-advisor-modal');
const closeAiAdvisorModalButton = document.getElementById('close-ai-advisor-modal');
const aiAdvisorPrompt = document.getElementById('ai-advisor-prompt');
const getAiAdviceButton = document.getElementById('get-ai-advice');
const aiAdvisorResponse = document.getElementById('ai-advisor-response');

// Weather Charts elements
const weatherChartsButton = document.getElementById('weather-charts');
const weatherChartsModal = document.getElementById('weather-charts-modal');
const closeChartsModalButton = document.getElementById('close-charts-modal');
const chartsLocation = document.getElementById('charts-location');
const chartsYear = document.getElementById('charts-year');
const chartsCompareYear = document.getElementById('charts-compare-year');
const chartsType = document.getElementById('charts-type');
const loadChartsButton = document.getElementById('load-charts');
const chartsContainer = document.getElementById('charts-container');

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

// ==================== ENERGY CONSUMPTION INSIGHTS ====================

// Calculate heating/cooling degree days
function calculateHeatingCoolingNeeds(weatherData) {
  const current = weatherData.current;
  const hourly = weatherData.hourly;
  const outdoorTemp = current.temperature_2m;
  const baseTemp = 18.3; // Standard base temperature (65°F)
  
  // Calculate cooling degree days (CDD) and heating degree days (HDD)
  let coolingDays = 0;
  let heatingDays = 0;
  let totalCoolingHours = 0;
  let totalHeatingHours = 0;
  
  if (hourly && hourly.temperature_2m) {
    hourly.temperature_2m.slice(0, 24).forEach(temp => {
      if (temp > baseTemp) {
        coolingDays += (temp - baseTemp) / 24;
        totalCoolingHours++;
      } else if (temp < baseTemp) {
        heatingDays += (baseTemp - temp) / 24;
        totalHeatingHours++;
      }
    });
  }
  
  const needsCooling = outdoorTemp > 25;
  const needsHeating = outdoorTemp < 15;
  const isComfortable = !needsCooling && !needsHeating;
  
  let status, details, recommendations;
  
  if (needsCooling) {
    const intensity = outdoorTemp > 35 ? 'High' : outdoorTemp > 30 ? 'Moderate' : 'Low';
    status = `🟡 Cooling Needed (${intensity})`;
    details = `Outdoor: ${formatNumber(outdoorTemp, 1)}°C | Base: ${baseTemp}°C`;
    
    const coolingLoad = Math.max(0, outdoorTemp - baseTemp);
    const estimatedHours = totalCoolingHours;
    const energyEstimate = (coolingLoad * estimatedHours * 0.5).toFixed(1); // kWh estimate
    
    recommendations = `
      <strong>Cooling Requirements:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>Cooling load: ${formatNumber(coolingLoad, 1)}°C above base</li>
        <li>Estimated AC runtime: ${estimatedHours} hours/day</li>
        <li>Energy estimate: ~${energyEstimate} kWh/day</li>
        <li>Set AC to 24-26°C for efficiency</li>
        <li>Use fans to reduce AC load by 20-30%</li>
        <li>Close blinds during peak sun hours</li>
      </ul>
    `;
  } else if (needsHeating) {
    const intensity = outdoorTemp < 5 ? 'High' : outdoorTemp < 10 ? 'Moderate' : 'Low';
    status = `🔵 Heating Needed (${intensity})`;
    details = `Outdoor: ${formatNumber(outdoorTemp, 1)}°C | Base: ${baseTemp}°C`;
    
    const heatingLoad = Math.max(0, baseTemp - outdoorTemp);
    const estimatedHours = totalHeatingHours;
    const energyEstimate = (heatingLoad * estimatedHours * 0.4).toFixed(1); // kWh estimate
    
    recommendations = `
      <strong>Heating Requirements:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>Heating load: ${formatNumber(heatingLoad, 1)}°C below base</li>
        <li>Estimated heating runtime: ${estimatedHours} hours/day</li>
        <li>Energy estimate: ~${energyEstimate} kWh/day</li>
        <li>Set thermostat to 20-22°C for efficiency</li>
        <li>Use insulation to reduce heat loss</li>
        <li>Seal windows and doors</li>
      </ul>
    `;
  } else {
    status = `🟢 Comfortable (No HVAC needed)`;
    details = `Outdoor: ${formatNumber(outdoorTemp, 1)}°C | Base: ${baseTemp}°C`;
    recommendations = `
      <strong>Natural Comfort Zone:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>No heating or cooling required</li>
        <li>Use natural ventilation</li>
        <li>Open windows for fresh air</li>
        <li>Minimal energy consumption</li>
        <li>Perfect for energy savings!</li>
      </ul>
    `;
  }
  
  return { status, details, recommendations, coolingDays, heatingDays };
}

// Calculate solar potential
function calculateSolarPotential(weatherData, airData) {
  const current = weatherData.current;
  const hourly = weatherData.hourly;
  const uvIndex = current.uv_index ?? 0;
  const cloudCover = current.cloud_cover ?? 50; // Estimate if not available
  
  // Calculate solar hours (hours with UV > 3)
  let solarHours = 0;
  let avgUV = 0;
  let clearHours = 0;
  
  if (hourly && hourly.uv_index) {
    hourly.uv_index.slice(0, 24).forEach(uv => {
      if (uv >= 3) {
        solarHours++;
        avgUV += uv;
      }
      if (uv >= 6) clearHours++;
    });
    avgUV = solarHours > 0 ? avgUV / solarHours : 0;
  }
  
  // Estimate solar irradiance (W/m²)
  const baseIrradiance = 1000; // Peak sun irradiance
  const cloudFactor = 1 - (cloudCover / 100);
  const uvFactor = Math.min(uvIndex / 11, 1); // UV index max is ~11
  const estimatedIrradiance = baseIrradiance * cloudFactor * uvFactor;
  
  // Calculate daily solar energy potential (kWh/m²/day)
  const solarEnergyPotential = (estimatedIrradiance * solarHours) / 1000; // Convert to kWh
  
  // Solar potential rating
  let rating, status, details, recommendations;
  
  if (solarEnergyPotential > 5) {
    rating = 'Excellent';
    status = `🟢 Excellent Solar Potential`;
  } else if (solarEnergyPotential > 3) {
    rating = 'Good';
    status = `🟡 Good Solar Potential`;
  } else if (solarEnergyPotential > 1.5) {
    rating = 'Moderate';
    status = `🟠 Moderate Solar Potential`;
  } else {
    rating = 'Low';
    status = `🔴 Low Solar Potential`;
  }
  
  details = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0;">
      <div><strong>UV Index:</strong> ${formatNumber(uvIndex, 1)}</div>
      <div><strong>Solar Hours:</strong> ${solarHours} hrs</div>
      <div><strong>Clear Hours:</strong> ${clearHours} hrs</div>
      <div><strong>Cloud Cover:</strong> ~${formatNumber(cloudCover, 0)}%</div>
    </div>
    <div style="margin-top: 10px;">
      <strong>Estimated Solar Energy:</strong> ${formatNumber(solarEnergyPotential, 2)} kWh/m²/day
    </div>
  `;
  
  const panelEfficiency = 0.20; // 20% typical panel efficiency
  const panelArea = 10; // m² (example)
  const dailyGeneration = solarEnergyPotential * panelEfficiency * panelArea;
  const monthlyGeneration = dailyGeneration * 30;
  const yearlyGeneration = dailyGeneration * 365;
  
  recommendations = `
    <strong>Solar System Potential:</strong>
    <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
      <li><strong>Daily generation:</strong> ~${formatNumber(dailyGeneration, 1)} kWh (10m² panels)</li>
      <li><strong>Monthly generation:</strong> ~${formatNumber(monthlyGeneration, 0)} kWh</li>
      <li><strong>Yearly generation:</strong> ~${formatNumber(yearlyGeneration, 0)} kWh</li>
      <li>Best solar hours: ${clearHours > 0 ? `${clearHours} hours with high UV` : 'Limited'}</li>
      <li>${rating === 'Excellent' || rating === 'Good' ? '✅ Great location for solar panels!' : 'Consider weather patterns for optimal placement'}</li>
    </ul>
  `;
  
  return { status, details, recommendations, solarEnergyPotential, rating };
}

// Calculate energy cost estimates
function calculateEnergyCosts(weatherData, heatingCooling, solarPotential) {
  const current = weatherData.current;
  const outdoorTemp = current.temperature_2m;
  
  // Energy rates (can be customized)
  const electricityRate = 8.0; // ₹/kWh (Indian average, can be adjusted)
  const gasRate = 50.0; // ₹/unit for heating (if applicable)
  
  // Calculate daily energy consumption
  let dailyCooling = 0;
  let dailyHeating = 0;
  let dailyBase = 5; // Base household consumption (kWh/day)
  
  if (outdoorTemp > 18.3) {
    const coolingLoad = outdoorTemp - 18.3;
    dailyCooling = coolingLoad * 0.5 * 8; // 8 hours average cooling
  } else if (outdoorTemp < 18.3) {
    const heatingLoad = 18.3 - outdoorTemp;
    dailyHeating = heatingLoad * 0.4 * 10; // 10 hours average heating
  }
  
  const totalDailyConsumption = dailyBase + dailyCooling + dailyHeating;
  const monthlyConsumption = totalDailyConsumption * 30;
  const yearlyConsumption = totalDailyConsumption * 365;
  
  // Calculate costs
  const dailyCost = totalDailyConsumption * electricityRate;
  const monthlyCost = monthlyConsumption * electricityRate;
  const yearlyCost = yearlyConsumption * electricityRate;
  
  // Solar savings potential
  const solarDailyGeneration = solarPotential.solarEnergyPotential * 0.20 * 10; // 10m² panels
  const solarMonthlySavings = Math.min(solarDailyGeneration * 30 * electricityRate, monthlyCost);
  const netMonthlyCost = monthlyCost - solarMonthlySavings;
  
  // Cost breakdown
  const breakdown = `
    <div style="margin: 10px 0;">
      <strong>Daily Energy Consumption:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>Base consumption: ${formatNumber(dailyBase, 1)} kWh (₹${formatNumber(dailyBase * electricityRate, 0)})</li>
        ${dailyCooling > 0 ? `<li>Cooling: ${formatNumber(dailyCooling, 1)} kWh (₹${formatNumber(dailyCooling * electricityRate, 0)})</li>` : ''}
        ${dailyHeating > 0 ? `<li>Heating: ${formatNumber(dailyHeating, 1)} kWh (₹${formatNumber(dailyHeating * electricityRate, 0)})</li>` : ''}
        <li><strong>Total: ${formatNumber(totalDailyConsumption, 1)} kWh/day (₹${formatNumber(dailyCost, 0)})</strong></li>
      </ul>
    </div>
    <div style="margin: 10px 0;">
      <strong>Monthly Estimates:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>Consumption: ${formatNumber(monthlyConsumption, 0)} kWh</li>
        <li>Cost: ₹${formatNumber(monthlyCost, 0)}</li>
        ${solarMonthlySavings > 0 ? `<li>Solar savings: ₹${formatNumber(solarMonthlySavings, 0)}</li>` : ''}
        <li><strong>Net cost: ₹${formatNumber(netMonthlyCost, 0)}</strong></li>
      </ul>
    </div>
    <div style="margin: 10px 0;">
      <strong>Yearly Estimates:</strong>
      <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
        <li>Consumption: ${formatNumber(yearlyConsumption, 0)} kWh</li>
        <li>Cost: ₹${formatNumber(yearlyCost, 0)}</li>
        <li>With solar: ₹${formatNumber(yearlyCost - (solarMonthlySavings * 12), 0)}</li>
      </ul>
    </div>
  `;
  
  const status = `💰 Daily: ₹${formatNumber(dailyCost, 0)} | Monthly: ₹${formatNumber(monthlyCost, 0)}`;
  const details = `Based on current weather conditions and ₹${electricityRate}/kWh rate`;
  
  return { status, details, breakdown, dailyCost, monthlyCost, yearlyCost };
}

// Update energy insights in UI
function updateEnergyInsights(weatherData, airData) {
  if (!weatherData || !weatherData.current) return;
  
  // Initialize energy DOM if not already done
  if (!energyDom.heatingCoolingStatus) {
    initEnergyDom();
  }
  
  // Calculate heating/cooling needs
  const heatingCooling = calculateHeatingCoolingNeeds(weatherData);
  if (energyDom.heatingCoolingStatus) {
    energyDom.heatingCoolingStatus.textContent = heatingCooling.status;
    energyDom.heatingCoolingDetails.textContent = heatingCooling.details;
    energyDom.heatingCoolingRecommendations.innerHTML = heatingCooling.recommendations;
  }
  
  // Calculate solar potential
  const solarPotential = calculateSolarPotential(weatherData, airData);
  if (energyDom.solarPotentialStatus) {
    energyDom.solarPotentialStatus.textContent = solarPotential.status;
    energyDom.solarPotentialDetails.innerHTML = solarPotential.details;
    energyDom.solarRecommendations.innerHTML = solarPotential.recommendations;
  }
  
  // Calculate energy costs
  const energyCosts = calculateEnergyCosts(weatherData, heatingCooling, solarPotential);
  if (energyDom.energyCostStatus) {
    energyDom.energyCostStatus.textContent = energyCosts.status;
    energyDom.energyCostDetails.textContent = energyCosts.details;
    energyDom.energyCostBreakdown.innerHTML = energyCosts.breakdown;
  }
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

  // Update energy insights
  updateEnergyInsights(weatherData, airData);

  // Update energy insights
  updateEnergyInsights(weatherData, airData);

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

// Format disaster data for display
function formatEarthquakeData(earthquakes) {
  if (!earthquakes || !earthquakes.features) return '<p>No earthquake data available</p>';
  
  if (earthquakes.features.length === 0) return '<p>No recent earthquakes reported</p>';
  
  // Sort by magnitude (highest first) and take top 10
  const sorted = earthquakes.features
    .sort((a, b) => (b.properties.mag || 0) - (a.properties.mag || 0))
    .slice(0, 10);
  
  let html = '';
  sorted.forEach(eq => {
    const mag = eq.properties.mag || 'Unknown';
    const place = eq.properties.place || 'Unknown location';
    const time = new Date(eq.properties.time).toLocaleString();
    const [longitude, latitude, depth] = eq.geometry.coordinates;
    
    html += `
      <div class="disaster-item">
        <strong>Magnitude ${mag} - ${place}</strong>
        <small>Depth: ${depth ? depth.toFixed(1) + ' km' : 'Unknown'} | Time: ${time}</small>
      </div>
    `;
  });
  
  return html || '<p>No earthquake data available</p>';
}

function formatEventData(events) {
  if (!events || !events.events) return '<p>No event data available</p>';
  
  if (events.events.length === 0) return '<p>No active events reported</p>';
  
  // Take the 10 most recent events
  const recent = events.events.slice(0, 10);
  
  let html = '';
  recent.forEach(event => {
    const title = event.title || 'Unnamed event';
    const categories = event.categories?.map(c => c.title).join(', ') || 'Uncategorized';
    
    // Get the most recent geometry
    let date = 'Unknown date';
    if (event.geometries && event.geometries.length > 0) {
      const lastGeom = event.geometries[event.geometries.length - 1];
      if (lastGeom.date) {
        date = new Date(lastGeom.date).toLocaleString();
      }
    }
    
    html += `
      <div class="disaster-item">
        <strong>${title}</strong>
        <small>Category: ${categories} | Date: ${date}</small>
      </div>
    `;
  });
  
  return html || '<p>No event data available</p>';
}

// Display travel advisory information
async function displayTravelAdvisory() {
  const countryCode = countrySelect.value;
  if (!countryCode) {
    advisoryContent.innerHTML = '<p>Please select a country first.</p>';
    return;
  }
  
  // Show loading state
  advisoryContent.innerHTML = '<p>Loading advisory information...</p>';
  
  try {
    // In a real implementation, this would fetch from an actual government API
    // For now, we'll simulate with sample data
    const advisoryData = getSampleAdvisoryData(countryCode);
    
    // Format and display the advisory
    advisoryContent.innerHTML = formatAdvisoryData(advisoryData);
  } catch (error) {
    console.error('Error fetching advisory data:', error);
    advisoryContent.innerHTML = '<p>Error loading advisory data. Please try again later.</p>';
  }
}

// Sample advisory data (in a real app, this would come from an API)
function getSampleAdvisoryData(countryCode) {
  const advisories = {
    'IN': {
      country: 'India',
      level: 'medium',
      levelText: 'Exercise Increased Caution',
      summary: 'Be aware of local conditions and follow government guidance.',
      details: [
        'Monitor local news for updates on weather conditions',
        'Avoid traveling during severe weather events',
        'Stay hydrated and protect yourself from extreme heat',
        'Follow local authority instructions during emergencies'
      ],
      lastUpdated: '2025-12-11'
    },
    'US': {
      country: 'United States',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Check weather forecasts before traveling',
        'Prepare for seasonal weather variations',
        'Follow local traffic and safety regulations',
        'Register with your embassy if traveling internationally'
      ],
      lastUpdated: '2025-12-11'
    },
    'CA': {
      country: 'Canada',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Be prepared for winter conditions in northern regions',
        'Check road conditions during snow season',
        'Carry emergency supplies when traveling in remote areas',
        'Respect wildlife and follow park guidelines'
      ],
      lastUpdated: '2025-12-11'
    },
    'GB': {
      country: 'United Kingdom',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Expect changeable weather conditions',
        'Carry waterproof clothing',
        'Check transport updates for potential delays',
        'Follow local guidance during severe weather warnings'
      ],
      lastUpdated: '2025-12-11'
    },
    'AU': {
      country: 'Australia',
      level: 'medium',
      levelText: 'Exercise Increased Caution',
      summary: 'Be aware of regional hazards and seasonal conditions.',
      details: [
        'Be aware of bush fire seasons in summer months',
        'Swim at patrolled beaches only',
        'Protect against UV radiation with sunscreen and hats',
        'Drive carefully in rural areas, especially at dawn and dusk'
      ],
      lastUpdated: '2025-12-11'
    },
    'JP': {
      country: 'Japan',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Be prepared for occasional earthquakes',
        'Follow evacuation procedures if instructed by authorities',
        'Check train schedules for potential disruptions',
        'Respect local customs and etiquette'
      ],
      lastUpdated: '2025-12-11'
    },
    'DE': {
      country: 'Germany',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Check winter road conditions in mountainous areas',
        'Follow local traffic regulations',
        'Be prepared for changeable weather conditions',
        'Respect local customs and traditions'
      ],
      lastUpdated: '2025-12-11'
    },
    'FR': {
      country: 'France',
      level: 'low',
      levelText: 'Exercise Normal Precautions',
      summary: 'Standard safety measures are sufficient for travel.',
      details: [
        'Be aware of pickpocketing in tourist areas',
        'Follow local traffic regulations',
        'Check strike notices that may affect transportation',
        'Respect local customs and traditions'
      ],
      lastUpdated: '2025-12-11'
    }
  };
  
  return advisories[countryCode] || {
    country: 'Unknown',
    level: 'low',
    levelText: 'No Specific Advisory',
    summary: 'No specific travel advisory for this location.',
    details: ['Check local conditions before traveling'],
    lastUpdated: 'N/A'
  };
}

// Format advisory data for display
function formatAdvisoryData(data) {
  return `
    <h4>${data.country} Travel Advisory</h4>
    <div class="advisory-level ${data.level}">${data.levelText}</div>
    <p><strong>Summary:</strong> ${data.summary}</p>
    <p><strong>Recommendations:</strong></p>
    <ul>
      ${data.details.map(detail => `<li>${detail}</li>`).join('')}
    </ul>
    <p><small>Last updated: ${data.lastUpdated}</small></p>
  `;
}

// Display disaster information in modal
async function displayDisasterInfo() {
  // Show loading states
  earthquakesList.innerHTML = '<p>Loading earthquake data...</p>';
  eventsList.innerHTML = '<p>Loading natural events data...</p>';
  
  // Show modal
  disasterModal.style.display = 'block';
  
  try {
    // Fetch both datasets in parallel
    const [usgsResponse, eonetResponse] = await Promise.allSettled([
      fetchUSGSEarthquakes(),
      fetchEONETEvents()
    ]);
    
    // Update earthquake section
    if (usgsResponse.status === 'fulfilled') {
      earthquakesList.innerHTML = formatEarthquakeData(usgsResponse.value);
    } else {
      earthquakesList.innerHTML = '<p>Failed to load earthquake data</p>';
    }
    
    // Update events section
    if (eonetResponse.status === 'fulfilled') {
      eventsList.innerHTML = formatEventData(eonetResponse.value);
    } else {
      eventsList.innerHTML = '<p>Failed to load natural events data</p>';
    }
  } catch (error) {
    console.error('Error fetching disaster data:', error);
    earthquakesList.innerHTML = '<p>Error loading data</p>';
    eventsList.innerHTML = '<p>Error loading data</p>';
  }
}

// Close modal when clicking the X
if (closeModalButton) {
  closeModalButton.addEventListener('click', () => {
    disasterModal.style.display = 'none';
  });
}

// Close modal when clicking outside of it
if (disasterModal) {
  disasterModal.addEventListener('click', (event) => {
    if (event.target === disasterModal) {
      disasterModal.style.display = 'none';
    }
  });
}

// Open modal when disaster info button is clicked
if (disasterInfoButton) {
  disasterInfoButton.addEventListener('click', displayDisasterInfo);
}

// Open modal when advisory info button is clicked
if (advisoryInfoButton) {
  advisoryInfoButton.addEventListener('click', () => {
    advisoryModal.style.display = 'block';
  });
}

// Close advisory modal when clicking the X
if (closeAdvisoryModalButton) {
  closeAdvisoryModalButton.addEventListener('click', () => {
    advisoryModal.style.display = 'none';
  });
}

// Close advisory modal when clicking outside of it
if (advisoryModal) {
  advisoryModal.addEventListener('click', (event) => {
    if (event.target === advisoryModal) {
      advisoryModal.style.display = 'none';
    }
  });
}

// Get advisory when button is clicked
if (getAdvisoryButton) {
  getAdvisoryButton.addEventListener('click', displayTravelAdvisory);
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
  initEnergyDom(); // Initialize energy DOM elements
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
    const [usgs, eonetS] = await Promise.allSettled([fetchUSGSEarthquakes(), fetchEONETEvents()]);
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
// AI Chat Assistant Event Listeners
if (aiTravelAdvisorButton) {
  aiTravelAdvisorButton.addEventListener('click', () => {
    aiAdvisorModal.style.display = 'block';
  });
}

if (closeAiAdvisorModalButton) {
  closeAiAdvisorModalButton.addEventListener('click', () => {
    aiAdvisorModal.style.display = 'none';
  });
}

if (aiAdvisorModal) {
  // FIXED: Typo 'e+vent' changed to 'event'
  aiAdvisorModal.addEventListener('click', (event) => {
    if (event.target === aiAdvisorModal) {
      aiAdvisorModal.style.display = 'none';
    }
  });
}

// Simple Travel Advisor - Rule-based system (no external APIs needed)
function getAIResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const currentLocation = readFromStorage(storageKeys.lastPlace, null);
  const lastData = readFromStorage(storageKeys.lastData, null);
  
  // Get weather context if available
  let weatherContext = '';
  if (currentLocation && lastData) {
    const { weatherData, airData } = lastData;
    const current = weatherData.current;
    weatherContext = `Current conditions in ${currentLocation.place}: ${formatNumber(current.temperature_2m, 0)}°C, `;
    weatherContext += `${formatNumber(current.precipitation_probability ?? 0, 0)}% chance of rain, `;
    weatherContext += `wind ${formatNumber(current.wind_speed_10m, 0)} km/h. `;
  }
  
  // Pattern matching for common travel queries
  let response = '';
  
  // North India queries
  if (lowerPrompt.includes('north india') || lowerPrompt.includes('northern india')) {
    response = `<h4>Travel Recommendations for North India</h4>
      <p><strong>Best Time to Visit:</strong> October to March (pleasant weather, 15-25°C)</p>
      <p><strong>Popular Destinations:</strong></p>
      <ul>
        <li><strong>Delhi:</strong> Historical monuments, street food, shopping</li>
        <li><strong>Agra:</strong> Taj Mahal, Agra Fort, Fatehpur Sikri</li>
        <li><strong>Jaipur:</strong> Pink City, palaces, forts, cultural heritage</li>
        <li><strong>Varanasi:</strong> Spiritual city, Ganges river, ancient temples</li>
        <li><strong>Rishikesh & Haridwar:</strong> Yoga, adventure sports, spiritual retreats</li>
        <li><strong>Shimla/Manali:</strong> Hill stations, snow, trekking</li>
      </ul>
      <p><strong>Travel Tips:</strong></p>
      <ul>
        <li>Carry warm clothes in winter (Dec-Feb can be 5-15°C)</li>
        <li>Summer (Apr-Jun) is very hot (35-45°C) - avoid if possible</li>
        <li>Monsoon (Jul-Sep) brings heavy rains</li>
        <li>Book trains/flights in advance, especially during peak season</li>
        <li>Try local cuisine: chaat, parathas, lassi, kebabs</li>
      </ul>
      ${weatherContext ? `<p><em>${weatherContext}</em></p>` : ''}`;
  }
  // South India queries
  else if (lowerPrompt.includes('south india') || lowerPrompt.includes('southern india')) {
    response = `<h4>Travel Recommendations for South India</h4>
      <p><strong>Best Time to Visit:</strong> October to March (mild weather, 20-30°C)</p>
      <p><strong>Popular Destinations:</strong></p>
      <ul>
        <li><strong>Kerala:</strong> Backwaters, beaches, hill stations, Ayurveda</li>
        <li><strong>Tamil Nadu:</strong> Temples, classical architecture, Chennai, Madurai</li>
        <li><strong>Karnataka:</strong> Bangalore, Mysore, Hampi, Coorg</li>
        <li><strong>Goa:</strong> Beaches, nightlife, Portuguese heritage</li>
        <li><strong>Andhra Pradesh/Telangana:</strong> Hyderabad, Tirupati, beaches</li>
      </ul>
      <p><strong>Travel Tips:</strong></p>
      <ul>
        <li>Weather is generally pleasant year-round compared to North</li>
        <li>Monsoon (Jun-Sep) is heavy but beautiful for nature lovers</li>
        <li>Try South Indian cuisine: dosa, idli, sambar, filter coffee</li>
        <li>Many UNESCO World Heritage sites and ancient temples</li>
        <li>Good road connectivity and train network</li>
      </ul>
      ${weatherContext ? `<p><em>${weatherContext}</em></p>` : ''}`;
  }
  // Weather-based queries
  else if (lowerPrompt.includes('weather') || lowerPrompt.includes('climate') || lowerPrompt.includes('temperature')) {
    if (currentLocation && lastData) {
      const { weatherData, airData } = lastData;
      const current = weatherData.current;
      response = `<h4>Weather-Based Travel Advice for ${currentLocation.place}</h4>
        <p><strong>Current Conditions:</strong></p>
        <ul>
          <li>Temperature: ${formatNumber(current.temperature_2m, 0)}°C (feels like ${formatNumber(current.apparent_temperature, 0)}°C)</li>
          <li>Humidity: ${formatNumber(current.relative_humidity_2m, 0)}%</li>
          <li>Wind: ${formatNumber(current.wind_speed_10m, 0)} km/h</li>
          <li>Rain Probability: ${formatNumber(current.precipitation_probability ?? 0, 0)}%</li>
          <li>UV Index: ${formatNumber(current.uv_index ?? 0, 0)}</li>
        </ul>
        <p><strong>Travel Recommendations:</strong></p>
        <ul>
          ${current.temperature_2m > 30 ? '<li>🌡️ Hot weather - stay hydrated, use sunscreen, avoid midday sun</li>' : ''}
          ${current.temperature_2m < 15 ? '<li>🧥 Cool weather - pack warm clothes, perfect for sightseeing</li>' : ''}
          ${(current.precipitation_probability ?? 0) > 50 ? '<li>☔ High chance of rain - carry umbrella, plan indoor activities</li>' : ''}
          ${(current.uv_index ?? 0) > 6 ? '<li>☀️ High UV - use sunscreen, wear hat, limit sun exposure</li>' : ''}
          <li>Check hourly forecast before outdoor activities</li>
        </ul>`;
    } else {
      response = `<h4>Weather Travel Advice</h4>
        <p>Please search for a location first to get weather-specific travel recommendations.</p>
        <p><strong>General Tips:</strong></p>
        <ul>
          <li>Check weather forecast 1-2 weeks before travel</li>
          <li>Pack according to season and destination</li>
          <li>Have backup plans for outdoor activities in case of bad weather</li>
          <li>Monitor weather alerts and warnings</li>
        </ul>`;
    }
  }
  // General travel planning
  else if (lowerPrompt.includes('plan') || lowerPrompt.includes('trip') || lowerPrompt.includes('itinerary')) {
    response = `<h4>Travel Planning Guide</h4>
      <p><strong>Step-by-Step Planning:</strong></p>
      <ol>
        <li><strong>Choose Destination:</strong> Research weather, culture, attractions</li>
        <li><strong>Best Time to Visit:</strong> Consider weather, festivals, peak/off-season</li>
        <li><strong>Budget Planning:</strong> Flights, accommodation, food, activities, emergency fund</li>
        <li><strong>Book in Advance:</strong> Flights (2-3 months), hotels (1-2 months), trains (1-2 months)</li>
        <li><strong>Create Itinerary:</strong> Day-by-day plan with flexibility</li>
        <li><strong>Travel Documents:</strong> Passport, visa, travel insurance, ID copies</li>
        <li><strong>Health & Safety:</strong> Vaccinations, medications, emergency contacts</li>
        <li><strong>Packing:</strong> Weather-appropriate clothes, essentials, first-aid kit</li>
      </ol>
      <p><strong>Pro Tips:</strong></p>
      <ul>
        <li>Travel during shoulder season for better prices and weather</li>
        <li>Use weather apps to track conditions before and during travel</li>
        <li>Keep digital copies of important documents</li>
        <li>Learn basic local phrases</li>
        <li>Respect local customs and culture</li>
      </ul>
      ${weatherContext ? `<p><em>${weatherContext}</em></p>` : ''}`;
  }
  // Budget queries
  else if (lowerPrompt.includes('budget') || lowerPrompt.includes('cost') || lowerPrompt.includes('price') || lowerPrompt.includes('cheap')) {
    response = `<h4>Budget Travel Tips</h4>
      <p><strong>Money-Saving Strategies:</strong></p>
      <ul>
        <li><strong>Accommodation:</strong> Hostels, homestays, guesthouses, off-season rates</li>
        <li><strong>Transport:</strong> Trains (cheaper than flights), buses, shared taxis, walking</li>
        <li><strong>Food:</strong> Street food, local restaurants, avoid tourist traps</li>
        <li><strong>Activities:</strong> Free attractions, walking tours, public parks, museums</li>
        <li><strong>Timing:</strong> Travel off-season, book early, use deals and discounts</li>
      </ul>
      <p><strong>Estimated Daily Budget (India):</strong></p>
      <ul>
        <li>Budget: ₹1,000-2,000/day (hostels, street food, public transport)</li>
        <li>Mid-range: ₹3,000-5,000/day (hotels, restaurants, some activities)</li>
        <li>Luxury: ₹8,000+/day (resorts, fine dining, private tours)</li>
      </ul>
      <p><em>Prices vary by city and season. Major cities are more expensive.</em></p>`;
  }
  // Safety queries
  else if (lowerPrompt.includes('safe') || lowerPrompt.includes('safety') || lowerPrompt.includes('danger') || lowerPrompt.includes('risk')) {
    response = `<h4>Travel Safety Tips</h4>
      <p><strong>General Safety Guidelines:</strong></p>
      <ul>
        <li>Research destination safety before travel</li>
        <li>Keep copies of important documents (passport, visa, insurance)</li>
        <li>Share itinerary with family/friends</li>
        <li>Stay aware of local news and weather alerts</li>
        <li>Use reputable transportation and accommodation</li>
        <li>Keep emergency contacts handy</li>
        <li>Respect local laws and customs</li>
        <li>Avoid risky areas, especially at night</li>
        <li>Keep valuables secure, use hotel safes</li>
        <li>Stay hydrated and take health precautions</li>
      </ul>
      <p><strong>Weather Safety:</strong></p>
      <ul>
        <li>Check weather forecasts and warnings</li>
        <li>Avoid travel during extreme weather (cyclones, floods, heatwaves)</li>
        <li>Carry appropriate clothing for weather conditions</li>
        <li>Stay informed about natural disaster risks</li>
      </ul>
      <p><strong>Emergency Contacts (India):</strong></p>
      <ul>
        <li>Police: 100 | Ambulance: 102 | Fire: 101</li>
        <li>Tourist Helpline: 1363 (24/7)</li>
        <li>Women Helpline: 1091</li>
        <li>Keep embassy/consulate numbers</li>
      </ul>`;
  }
  // Activity-based queries
  else if (lowerPrompt.includes('adventure') || lowerPrompt.includes('trekking') || lowerPrompt.includes('hiking') || lowerPrompt.includes('sports')) {
    response = `<h4>Adventure Travel in India</h4>
      <p><strong>Top Adventure Destinations:</strong></p>
      <ul>
        <li><strong>Himachal Pradesh:</strong> Paragliding (Bir Billing), trekking (Hampta Pass, Triund), skiing (Solang Valley), river rafting (Beas River)</li>
        <li><strong>Uttarakhand:</strong> Trekking (Valley of Flowers, Roopkund), rafting (Rishikesh), bungee jumping, camping</li>
        <li><strong>Ladakh:</strong> High-altitude trekking, mountain biking, motorbike tours, Chadar trek (frozen river)</li>
        <li><strong>Goa:</strong> Water sports (parasailing, jet skiing, scuba diving), beach activities</li>
        <li><strong>Kerala:</strong> Backwater kayaking, trekking (Munnar, Wayanad), rock climbing</li>
        <li><strong>Rajasthan:</strong> Desert safari, camel trekking, hot air ballooning (Pushkar)</li>
        <li><strong>Andaman & Nicobar:</strong> Scuba diving, snorkeling, sea walking, water sports</li>
      </ul>
      <p><strong>Best Seasons:</strong></p>
      <ul>
        <li>Himalayan treks: May-June, September-October</li>
        <li>Water sports: October-April (avoid monsoon)</li>
        <li>Desert activities: October-March</li>
      </ul>
      <p><strong>Safety Tips:</strong></p>
      <ul>
        <li>Always use licensed operators and certified guides</li>
        <li>Check weather conditions before adventure activities</li>
        <li>Carry proper gear and first-aid kit</li>
        <li>Get travel insurance covering adventure sports</li>
        <li>Acclimatize properly for high-altitude activities</li>
      </ul>`;
  }
  // Cultural/Heritage queries
  else if (lowerPrompt.includes('culture') || lowerPrompt.includes('heritage') || lowerPrompt.includes('temple') || lowerPrompt.includes('monument') || lowerPrompt.includes('historical')) {
    response = `<h4>Cultural & Heritage Travel in India</h4>
      <p><strong>UNESCO World Heritage Sites:</strong></p>
      <ul>
        <li><strong>Taj Mahal (Agra):</strong> Iconic marble mausoleum, best at sunrise/sunset</li>
        <li><strong>Red Fort (Delhi):</strong> Mughal architecture, light & sound show</li>
        <li><strong>Fatehpur Sikri (Agra):</strong> Abandoned Mughal city</li>
        <li><strong>Khajuraho Temples (MP):</strong> Intricate sculptures, ancient architecture</li>
        <li><strong>Hampi (Karnataka):</strong> Ruins of Vijayanagara Empire, stunning boulder landscape</li>
        <li><strong>Ajanta & Ellora Caves (Maharashtra):</strong> Ancient rock-cut caves, Buddhist art</li>
        <li><strong>Konark Sun Temple (Odisha):</strong> Architectural marvel, chariot-shaped temple</li>
        <li><strong>Mahabalipuram (Tamil Nadu):</strong> Ancient rock-cut temples, shore temple</li>
        <li><strong>Jaipur City (Rajasthan):</strong> Pink City, palaces, forts</li>
      </ul>
      <p><strong>Cultural Experiences:</strong></p>
      <ul>
        <li>Attend classical dance performances (Bharatanatyam, Kathak, Odissi)</li>
        <li>Visit local festivals and fairs</li>
        <li>Explore traditional crafts and markets</li>
        <li>Experience local cuisine and cooking classes</li>
        <li>Stay in heritage hotels and havelis</li>
      </ul>
      <p><strong>Best Time:</strong> October-March (pleasant weather for sightseeing)</p>`;
  }
  // Beach queries
  else if (lowerPrompt.includes('beach') || lowerPrompt.includes('coastal') || lowerPrompt.includes('sea') || lowerPrompt.includes('ocean')) {
    response = `<h4>Beach Destinations in India</h4>
      <p><strong>Top Beach Destinations:</strong></p>
      <ul>
        <li><strong>Goa:</strong> Calangute, Baga, Anjuna, Palolem - party scene, water sports, Portuguese influence</li>
        <li><strong>Kerala:</strong> Kovalam, Varkala, Marari - serene, Ayurveda, backwaters nearby</li>
        <li><strong>Andaman & Nicobar:</strong> Radhanagar, Elephant Beach - pristine, coral reefs, water sports</li>
        <li><strong>Gujarat:</strong> Mandvi, Dwarka - less crowded, cultural sites nearby</li>
        <li><strong>Maharashtra:</strong> Alibaug, Ganpatipule - weekend getaways from Mumbai</li>
        <li><strong>Tamil Nadu:</strong> Marina Beach (Chennai), Mahabalipuram - historical sites nearby</li>
        <li><strong>Odisha:</strong> Puri, Gopalpur - spiritual significance, less commercial</li>
        <li><strong>Karnataka:</strong> Gokarna, Udupi - mix of beaches and temples</li>
      </ul>
      <p><strong>Best Time:</strong> October-April (avoid monsoon: June-September)</p>
      <p><strong>Activities:</strong> Swimming, sunbathing, water sports, beach volleyball, sunset watching, seafood</p>
      <p><strong>Tips:</strong> Use sunscreen, stay hydrated, respect local customs, be cautious of currents</p>`;
  }
  // Packing queries
  else if (lowerPrompt.includes('pack') || lowerPrompt.includes('packing') || lowerPrompt.includes('luggage') || lowerPrompt.includes('what to bring')) {
    let packingList = '';
    if (currentLocation && lastData) {
      const { weatherData } = lastData;
      const current = weatherData.current;
      const temp = current.temperature_2m;
      const rainProb = current.precipitation_probability ?? 0;
      
      packingList = `<h4>Packing List for ${currentLocation.place}</h4>
        <p><strong>Current Weather:</strong> ${formatNumber(temp, 0)}°C, ${formatNumber(rainProb, 0)}% chance of rain</p>
        <p><strong>Essential Items:</strong></p>
        <ul>
          ${temp > 30 ? '<li>Light cotton clothes, shorts, t-shirts</li><li>Sunscreen (SPF 50+), hat, sunglasses</li><li>Lightweight scarf for sun protection</li>' : ''}
          ${temp < 20 && temp > 10 ? '<li>Light jacket, long sleeves, jeans</li><li>Layered clothing for temperature changes</li>' : ''}
          ${temp < 10 ? '<li>Warm clothes, sweater, jacket, thermal wear</li><li>Warm socks, gloves, beanie</li>' : ''}
          ${rainProb > 30 ? '<li>Umbrella or raincoat</li><li>Waterproof bag cover</li><li>Quick-dry clothes</li>' : ''}
          <li>Comfortable walking shoes</li>
          <li>First-aid kit, medications</li>
          <li>Power bank, chargers, adapters</li>
          <li>Reusable water bottle</li>
          <li>Travel documents (passport, visa, insurance)</li>
          <li>Camera/phone for photos</li>
        </ul>`;
    } else {
      packingList = `<h4>General Packing Guide</h4>
        <p><strong>Essential Items (All Seasons):</strong></p>
        <ul>
          <li>Travel documents (passport, visa, ID, insurance)</li>
          <li>First-aid kit, personal medications</li>
          <li>Electronics (chargers, power bank, adapters)</li>
          <li>Reusable water bottle</li>
          <li>Comfortable walking shoes</li>
          <li>Camera/phone</li>
        </ul>
        <p><strong>Summer (Apr-Jun):</strong> Light clothes, sunscreen, hat, sunglasses, umbrella</p>
        <p><strong>Monsoon (Jul-Sep):</strong> Raincoat, umbrella, waterproof bag, quick-dry clothes</p>
        <p><strong>Winter (Nov-Feb):</strong> Warm clothes, jacket, sweater, thermal wear, gloves</p>
        <p><strong>Shoulder Season (Oct, Mar):</strong> Layered clothing, light jacket</p>`;
    }
    response = packingList;
  }
  // Food/Cuisine queries
  else if (lowerPrompt.includes('food') || lowerPrompt.includes('cuisine') || lowerPrompt.includes('eat') || lowerPrompt.includes('restaurant') || lowerPrompt.includes('dish')) {
    response = `<h4>Indian Cuisine Guide</h4>
      <p><strong>Must-Try Dishes by Region:</strong></p>
      <ul>
        <li><strong>North India:</strong> Butter chicken, biryani, kebabs, parathas, chaat, lassi, dal makhani, naan</li>
        <li><strong>South India:</strong> Dosa, idli, sambar, vada, rasam, filter coffee, appam, biryani (Hyderabadi)</li>
        <li><strong>West India:</strong> Vada pav, pav bhaji, dhokla, thepla, Gujarati thali, Goan fish curry</li>
        <li><strong>East India:</strong> Rasgulla, sandesh, fish curry, momos, thukpa, litti chokha</li>
        <li><strong>Street Food:</strong> Pani puri, bhel puri, samosa, jalebi, kachori, vada pav</li>
      </ul>
      <p><strong>Food Safety Tips:</strong></p>
      <ul>
        <li>Start with mild dishes if not used to spicy food</li>
        <li>Drink bottled or filtered water</li>
        <li>Eat at busy restaurants (high turnover = fresh food)</li>
        <li>Avoid raw salads and cut fruits from street vendors</li>
        <li>Try street food from popular, established vendors</li>
        <li>Carry digestive medicines (just in case)</li>
      </ul>
      <p><strong>Vegetarian Options:</strong> India has excellent vegetarian cuisine - most restaurants offer extensive veg menus</p>
      <p><strong>Dietary Restrictions:</strong> Many places offer Jain food (no onion/garlic), vegan options available</p>`;
  }
  // Transportation queries
  else if (lowerPrompt.includes('transport') || lowerPrompt.includes('travel') && (lowerPrompt.includes('how') || lowerPrompt.includes('get') || lowerPrompt.includes('reach'))) {
    response = `<h4>Transportation in India</h4>
      <p><strong>Domestic Flights:</strong></p>
      <ul>
        <li>Major airlines: IndiGo, Air India, SpiceJet, Vistara</li>
        <li>Book 1-2 months in advance for best prices</li>
        <li>Check for sales and discounts</li>
        <li>Budget: ₹3,000-8,000 for short flights</li>
      </ul>
      <p><strong>Trains (Indian Railways):</strong></p>
      <ul>
        <li>Book through IRCTC website/app (advance booking: 120 days)</li>
        <li>Classes: AC First, AC 2-tier, AC 3-tier, Sleeper, General</li>
        <li>Popular trains: Rajdhani, Shatabdi (faster, more comfortable)</li>
        <li>Budget: ₹500-3,000 depending on class and distance</li>
        <li>Book early, especially for popular routes</li>
      </ul>
      <p><strong>Buses:</strong></p>
      <ul>
        <li>State buses: Affordable, extensive network</li>
        <li>Private buses: More comfortable, AC options</li>
        <li>Volvo/Mercedes buses for long distances</li>
        <li>Budget: ₹500-2,000 for long distances</li>
      </ul>
      <p><strong>Local Transport:</strong></p>
      <ul>
        <li>Auto-rickshaws: Negotiate fare or use meter</li>
        <li>Taxi: Ola, Uber available in major cities</li>
        <li>Metro: Available in Delhi, Mumbai, Bangalore, Kolkata, Chennai</li>
        <li>Cycle rickshaws: Short distances, eco-friendly</li>
      </ul>
      <p><strong>Tips:</strong> Use apps (Ola, Uber, IRCTC), book in advance, keep digital tickets</p>`;
  }
  // Festival queries
  else if (lowerPrompt.includes('festival') || lowerPrompt.includes('event') || lowerPrompt.includes('celebration')) {
    response = `<h4>Festivals & Events in India</h4>
      <p><strong>Major Festivals (with approximate dates):</strong></p>
      <ul>
        <li><strong>Diwali (Oct-Nov):</strong> Festival of lights, celebrated nationwide, best in North India</li>
        <li><strong>Holi (Feb-Mar):</strong> Festival of colors, most vibrant in North India (Mathura, Vrindavan)</li>
        <li><strong>Dussehra (Sep-Oct):</strong> Victory of good over evil, grand celebrations in Mysore, Kullu</li>
        <li><strong>Durga Puja (Sep-Oct):</strong> Biggest in West Bengal, especially Kolkata</li>
        <li><strong>Onam (Aug-Sep):</strong> Kerala's harvest festival, boat races, cultural events</li>
        <li><strong>Pongal (Jan):</strong> Tamil harvest festival, celebrated in Tamil Nadu</li>
        <li><strong>Pushkar Fair (Nov):</strong> Rajasthan's camel fair, cultural extravaganza</li>
        <li><strong>Kumbh Mela (every 3 years):</strong> World's largest religious gathering</li>
      </ul>
      <p><strong>Best Times to Experience:</strong></p>
      <ul>
        <li>Plan travel around festivals for cultural immersion</li>
        <li>Book accommodation well in advance (prices increase)</li>
        <li>Experience local traditions, food, and celebrations</li>
        <li>Respect local customs and participate respectfully</li>
      </ul>
      <p><strong>Tips:</strong> Check exact dates (lunar calendar), expect crowds, book early, respect traditions</p>`;
  }
  // Itinerary queries
  else if (lowerPrompt.includes('itinerary') || lowerPrompt.includes('days') || lowerPrompt.includes('schedule')) {
    response = `<h4>Sample Itineraries</h4>
      <p><strong>Golden Triangle (7 days):</strong></p>
      <ul>
        <li>Day 1-2: Delhi (Red Fort, Jama Masjid, India Gate, Qutub Minar)</li>
        <li>Day 3-4: Agra (Taj Mahal, Agra Fort, Fatehpur Sikri)</li>
        <li>Day 5-7: Jaipur (City Palace, Hawa Mahal, Amber Fort, markets)</li>
      </ul>
      <p><strong>Kerala Backwaters (5-7 days):</strong></p>
      <ul>
        <li>Day 1-2: Kochi (fort, Chinese fishing nets, Jewish synagogue)</li>
        <li>Day 3-4: Alleppey (houseboat stay, backwaters)</li>
        <li>Day 5-6: Munnar (tea plantations, hill stations)</li>
        <li>Day 7: Varkala (beach, relax)</li>
      </ul>
      <p><strong>Rajasthan Heritage (10 days):</strong></p>
      <ul>
        <li>Day 1-2: Jaipur (Pink City)</li>
        <li>Day 3-4: Jodhpur (Blue City, Mehrangarh Fort)</li>
        <li>Day 5-6: Udaipur (City of Lakes, palaces)</li>
        <li>Day 7-8: Pushkar (temple, desert)</li>
        <li>Day 9-10: Jaisalmer (Golden City, desert safari)</li>
      </ul>
      <p><strong>Tips:</strong> Allow buffer time, don't overpack activities, include rest days, be flexible</p>`;
  }
  // Offbeat/Hidden gems queries
  else if (lowerPrompt.includes('offbeat') || lowerPrompt.includes('hidden') || lowerPrompt.includes('lesser known') || lowerPrompt.includes('secret')) {
    response = `<h4>Hidden Gems & Offbeat Destinations</h4>
      <p><strong>Lesser-Known Beautiful Places:</strong></p>
      <ul>
        <li><strong>Spiti Valley (Himachal):</strong> Remote, high-altitude desert, monasteries, stunning landscapes</li>
        <li><strong>Ziro Valley (Arunachal):</strong> Beautiful valley, tribal culture, Ziro Music Festival</li>
        <li><strong>Gokarna (Karnataka):</strong> Less crowded than Goa, beautiful beaches, temples</li>
        <li><strong>Majuli (Assam):</strong> World's largest river island, Vaishnavite culture</li>
        <li><strong>Chettinad (Tamil Nadu):</strong> Heritage mansions, unique architecture, Chettinad cuisine</li>
        <li><strong>Dzukou Valley (Nagaland/Manipur):</strong> Beautiful valley, trekking, seasonal flowers</li>
        <li><strong>Champaner (Gujarat):</strong> UNESCO site, ancient architecture, less touristy</li>
        <li><strong>Orchha (Madhya Pradesh):</strong> Medieval town, palaces, temples, Betwa River</li>
        <li><strong>Kutch (Gujarat):</strong> White desert, Rann Utsav, handicrafts</li>
        <li><strong>Pondicherry (Puducherry):</strong> French colonial charm, beaches, Auroville</li>
      </ul>
      <p><strong>Why Visit:</strong> Less crowded, authentic experiences, unique culture, better prices, peaceful</p>
      <p><strong>Tips:</strong> Research accessibility, check weather, book accommodation in advance, respect local culture</p>`;
  }
  // Photography queries
  else if (lowerPrompt.includes('photo') || lowerPrompt.includes('photography') || lowerPrompt.includes('instagram') || lowerPrompt.includes('picture')) {
    response = `<h4>Photography Spots in India</h4>
      <p><strong>Iconic Photo Locations:</strong></p>
      <ul>
        <li><strong>Taj Mahal (Agra):</strong> Sunrise/sunset, reflection pool, different angles</li>
        <li><strong>Golden Temple (Amritsar):</strong> Night illumination, morning prayers, reflection</li>
        <li><strong>Hawa Mahal (Jaipur):</strong> Pink architecture, early morning light</li>
        <li><strong>Dal Lake (Srinagar):</strong> Shikara rides, floating gardens, mountains</li>
        <li><strong>Valley of Flowers (Uttarakhand):</strong> Alpine meadows, colorful flowers (July-Aug)</li>
        <li><strong>Hampi (Karnataka):</strong> Boulders, ruins, sunrise/sunset, ancient architecture</li>
        <li><strong>Jaisalmer Fort (Rajasthan):</strong> Golden city, desert, camel safari</li>
        <li><strong>Backwaters (Kerala):</strong> Houseboats, palm trees, serene landscapes</li>
        <li><strong>Rishikesh (Uttarakhand):</strong> Ganges, bridges, mountains, spiritual atmosphere</li>
        <li><strong>Munnar (Kerala):</strong> Tea plantations, misty hills, waterfalls</li>
      </ul>
      <p><strong>Photography Tips:</strong></p>
      <ul>
        <li>Best light: Early morning (6-9 AM) and golden hour (4-6 PM)</li>
        <li>Respect local customs - ask permission before photographing people</li>
        <li>Some places charge camera fees (check in advance)</li>
        <li>Carry extra batteries and memory cards</li>
        <li>Protect equipment from dust and humidity</li>
        <li>Drones may require permits - check regulations</li>
      </ul>`;
  }
  // Language queries
  else if (lowerPrompt.includes('language') || lowerPrompt.includes('phrase') || lowerPrompt.includes('speak') || lowerPrompt.includes('hindi')) {
    response = `<h4>Useful Phrases for Travel in India</h4>
      <p><strong>Basic Hindi Phrases:</strong></p>
      <ul>
        <li><strong>Hello:</strong> Namaste / Namaskar</li>
        <li><strong>Thank you:</strong> Dhanyavad / Shukriya</li>
        <li><strong>Yes:</strong> Haan | <strong>No:</strong> Nahi</li>
        <li><strong>Please:</strong> Kripya</li>
        <li><strong>Excuse me:</strong> Maaf kijiye</li>
        <li><strong>How much?:</strong> Kitna?</li>
        <li><strong>Where is...?:</strong> ... Kahan hai?</li>
        <li><strong>Help:</strong> Madad</li>
        <li><strong>Water:</strong> Paani</li>
        <li><strong>Food:</strong> Khana</li>
        <li><strong>Good:</strong> Accha | <strong>Very good:</strong> Bahut accha</li>
      </ul>
      <p><strong>Travel-Specific:</strong></p>
      <ul>
        <li><strong>Hotel:</strong> Hotel | <strong>Room:</strong> Kamra</li>
        <li><strong>Train:</strong> Train | <strong>Bus:</strong> Bus</li>
        <li><strong>How far?:</strong> Kitna door?</li>
        <li><strong>I don't understand:</strong> Main samajh nahi aaya</li>
        <li><strong>Do you speak English?:</strong> Aapko English aati hai?</li>
      </ul>
      <p><strong>Tips:</strong> English is widely spoken in tourist areas. Learning a few phrases shows respect and helps with locals.</p>`;
  }
  // East/Northeast India queries
  else if (lowerPrompt.includes('east india') || lowerPrompt.includes('northeast') || lowerPrompt.includes('bengal') || lowerPrompt.includes('assam') || lowerPrompt.includes('sikkim')) {
    response = `<h4>East & Northeast India Travel Guide</h4>
      <p><strong>Popular Destinations:</strong></p>
      <ul>
        <li><strong>West Bengal:</strong> Kolkata (culture, food), Darjeeling (tea, mountains), Sundarbans (mangroves, tigers)</li>
        <li><strong>Sikkim:</strong> Gangtok, Tsomgo Lake, monasteries, trekking, stunning Himalayan views</li>
        <li><strong>Assam:</strong> Kaziranga (rhinos), Guwahati, Majuli Island, tea gardens</li>
        <li><strong>Meghalaya:</strong> Shillong, Cherrapunji (wettest place), living root bridges, caves</li>
        <li><strong>Arunachal Pradesh:</strong> Tawang (monastery), Ziro Valley, tribal culture, pristine nature</li>
        <li><strong>Odisha:</strong> Puri (temple, beach), Konark (Sun Temple), Bhubaneswar (temples)</li>
        <li><strong>Bihar:</strong> Bodh Gaya (Buddhist site), Nalanda (ancient university ruins)</li>
      </ul>
      <p><strong>Best Time:</strong> October-April (pleasant weather, avoid monsoon)</p>
      <p><strong>Unique Experiences:</strong></p>
      <ul>
        <li>Tea garden tours in Darjeeling and Assam</li>
        <li>Wildlife safaris (Kaziranga, Sundarbans)</li>
        <li>Monastery visits in Sikkim and Arunachal</li>
        <li>Living root bridges in Meghalaya</li>
        <li>Bengali cuisine and sweets</li>
        <li>Festivals: Durga Puja (Kolkata), Hornbill Festival (Nagaland)</li>
      </ul>
      <p><strong>Tips:</strong> Some areas require permits (check in advance), respect local customs, beautiful but less touristy</p>`;
  }
  // West India queries
  else if (lowerPrompt.includes('west india') || lowerPrompt.includes('mumbai') || lowerPrompt.includes('gujarat') || lowerPrompt.includes('maharashtra')) {
    response = `<h4>West India Travel Guide</h4>
      <p><strong>Popular Destinations:</strong></p>
      <ul>
        <li><strong>Mumbai (Maharashtra):</strong> Gateway of India, Marine Drive, Bollywood, street food, markets</li>
        <li><strong>Goa:</strong> Beaches, nightlife, Portuguese heritage, water sports, churches</li>
        <li><strong>Pune (Maharashtra):</strong> Historical sites, hill stations nearby, educational hub</li>
        <li><strong>Gujarat:</strong> Ahmedabad (heritage), Rann of Kutch (white desert), Gir (lions), Dwarka (temple)</li>
        <li><strong>Ajanta & Ellora (Maharashtra):</strong> Ancient rock-cut caves, UNESCO sites</li>
        <li><strong>Mahabaleshwar (Maharashtra):</strong> Hill station, strawberries, viewpoints</li>
        <li><strong>Udaipur (Rajasthan - West):</strong> City of Lakes, palaces, romantic destination</li>
      </ul>
      <p><strong>Best Time:</strong> October-March (pleasant), avoid monsoon (June-September)</p>
      <p><strong>Unique Experiences:</strong></p>
      <ul>
        <li>Bollywood studio tours in Mumbai</li>
        <li>Beach parties and water sports in Goa</li>
        <li>Rann Utsav in Kutch (winter festival)</li>
        <li>Gujarati thali and street food</li>
        <li>Heritage walks in Ahmedabad</li>
        <li>Wine tasting in Nashik</li>
      </ul>
      <p><strong>Cuisine:</strong> Vada pav, pav bhaji, Gujarati thali, Goan fish curry, Maharashtrian thali</p>`;
  }
  // Default response
  else {
    response = `<h4>🌍 Smart Travel Advisor</h4>
      <p>I'm your comprehensive travel assistant! I can help you with:</p>
      
      <p><strong>📍 Destinations:</strong></p>
      <ul>
        <li>North India, South India, East India, West India, Northeast India</li>
        <li>Specific cities and regions</li>
        <li>Hidden gems and offbeat places</li>
      </ul>
      
      <p><strong>🎯 Activities & Interests:</strong></p>
      <ul>
        <li>Adventure travel (trekking, water sports, adventure activities)</li>
        <li>Cultural & heritage sites (temples, monuments, UNESCO sites)</li>
        <li>Beach destinations</li>
        <li>Photography spots</li>
      </ul>
      
      <p><strong>📋 Planning & Practical:</strong></p>
      <ul>
        <li>Travel planning and itineraries</li>
        <li>Packing lists (weather-based recommendations)</li>
        <li>Transportation options</li>
        <li>Budget tips and cost estimates</li>
        <li>Safety information</li>
      </ul>
      
      <p><strong>🍽️ Culture & Experience:</strong></p>
      <ul>
        <li>Local cuisine and food recommendations</li>
        <li>Festivals and events</li>
        <li>Language phrases</li>
        <li>Cultural etiquette</li>
      </ul>
      
      <p><strong>🌤️ Weather-Based Advice:</strong></p>
      <ul>
        <li>Current weather conditions and travel recommendations</li>
        <li>Best time to visit destinations</li>
        <li>Seasonal travel tips</li>
      </ul>
      
      <p><strong>💡 Example Questions:</strong></p>
      <ul>
        <li>"Plan a trip to North India"</li>
        <li>"Adventure activities in India"</li>
        <li>"What should I pack?" (uses current weather if available)</li>
        <li>"Best beaches in India"</li>
        <li>"Food to try in India"</li>
        <li>"7-day itinerary for Rajasthan"</li>
        <li>"Hidden gems in India"</li>
        <li>"Festivals in India"</li>
        <li>"Photography spots"</li>
        <li>"How to travel in India"</li>
      </ul>
      
      ${weatherContext ? `<p><strong>📍 Current Location:</strong> <em>${weatherContext}</em></p>` : '<p><em>💡 Tip: Search for a location first to get weather-based personalized recommendations!</em></p>'}`;
  }
  
  return formatAIResponse(response);
}

// Format response for display
function formatAIResponse(responseText) {
  // Already formatted HTML, just wrap it
  return `<div class="ai-response"><div class="ai-content">${responseText}</div></div>`;
}

// ... Keep your existing event listeners for 'getAiAdviceButton' ...

// Update the event listener to use the new function
if (getAiAdviceButton) {
  getAiAdviceButton.addEventListener('click', () => {
    const prompt = aiAdvisorPrompt.value.trim();
    
    if (!prompt) {
      aiAdvisorResponse.innerHTML = '<p>Please enter your travel question above.</p>';
      return;
    }
    
    // Show loading state briefly
    aiAdvisorResponse.innerHTML = '<p>Processing your travel query...</p>';
    
    // Use setTimeout to simulate processing (instant response)
    setTimeout(() => {
    try {
        const response = getAIResponse(prompt);
        aiAdvisorResponse.innerHTML = response;
    } catch (error) {
        console.error('Error getting travel advice:', error);
      aiAdvisorResponse.innerHTML = '<p>Sorry, there was an error processing your request. Please try again.</p>';
    }
    }, 300);
  });
}

// Add Enter key support for sending messages
if (aiAdvisorPrompt) {
  aiAdvisorPrompt.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (getAiAdviceButton) {
        getAiAdviceButton.click();
      }
    }
  });
}

// ==================== WEATHER CHARTS FEATURE ====================

// Chart instances storage
let chartInstances = [];

// Fetch historical weather data
async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: startDate,
      end_date: endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant'
      ].join(','),
      timezone: 'auto'
    });
    
    const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Historical data fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical weather:', error);
    throw error;
  }
}

// Create temperature chart
function createTemperatureChart(data, compareData, year, compareYear) {
  const canvas = document.createElement('canvas');
  canvas.id = 'temp-chart';
  const ctx = canvas.getContext('2d');
  
  const labels = data.daily.time.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  const datasets = [{
    label: `Max Temp ${year} (°C)`,
    data: data.daily.temperature_2m_max,
    borderColor: 'rgb(255, 99, 132)',
    backgroundColor: 'rgba(255, 99, 132, 0.1)',
    tension: 0.4,
    fill: false
  }, {
    label: `Min Temp ${year} (°C)`,
    data: data.daily.temperature_2m_min,
    borderColor: 'rgb(54, 162, 235)',
    backgroundColor: 'rgba(54, 162, 235, 0.1)',
    tension: 0.4,
    fill: false
  }];
  
  if (compareData) {
    datasets.push({
      label: `Max Temp ${compareYear} (°C)`,
      data: compareData.daily.temperature_2m_max,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.1)',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false
    }, {
      label: `Min Temp ${compareYear} (°C)`,
      data: compareData.daily.temperature_2m_min,
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.1)',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false
    });
  }
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Temperature Comparison ${year}${compareYear ? ` vs ${compareYear}` : ''}`,
          font: { size: 16, weight: 'bold' }
        },
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: {
          title: { display: true, text: 'Temperature (°C)' },
          beginAtZero: false
        },
        x: {
          title: { display: true, text: 'Date' },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });
  
  chartInstances.push(chart);
  return canvas;
}

// Create rainfall chart
function createRainfallChart(data, compareData, year, compareYear) {
  const canvas = document.createElement('canvas');
  canvas.id = 'rainfall-chart';
  const ctx = canvas.getContext('2d');
  
  const labels = data.daily.time.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  const datasets = [{
    label: `Rainfall ${year} (mm)`,
    data: data.daily.precipitation_sum,
    backgroundColor: 'rgba(75, 192, 192, 0.6)',
    borderColor: 'rgba(75, 192, 192, 1)',
    borderWidth: 1
  }];
  
  if (compareData) {
    datasets.push({
      label: `Rainfall ${compareYear} (mm)`,
      data: compareData.daily.precipitation_sum,
      backgroundColor: 'rgba(255, 206, 86, 0.6)',
      borderColor: 'rgba(255, 206, 86, 1)',
      borderWidth: 1
    });
  }
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Rainfall Comparison ${year}${compareYear ? ` vs ${compareYear}` : ''}`,
          font: { size: 16, weight: 'bold' }
        },
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: {
          title: { display: true, text: 'Precipitation (mm)' },
          beginAtZero: true
        },
        x: {
          title: { display: true, text: 'Date' },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });
  
  chartInstances.push(chart);
  return canvas;
}

// Create wind pattern chart
function createWindChart(data, compareData, year, compareYear) {
  const canvas = document.createElement('canvas');
  canvas.id = 'wind-chart';
  const ctx = canvas.getContext('2d');
  
  const labels = data.daily.time.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  const datasets = [{
    label: `Wind Speed ${year} (km/h)`,
    data: data.daily.wind_speed_10m_max,
    borderColor: 'rgb(255, 99, 132)',
    backgroundColor: 'rgba(255, 99, 132, 0.1)',
    tension: 0.4,
    fill: false,
    yAxisID: 'y'
  }];
  
  if (compareData) {
    datasets.push({
      label: `Wind Speed ${compareYear} (km/h)`,
      data: compareData.daily.wind_speed_10m_max,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false,
      yAxisID: 'y'
    });
  }
  
  // Add wind direction as secondary axis
  datasets.push({
    label: `Wind Direction ${year} (°)`,
    data: data.daily.wind_direction_10m_dominant,
    borderColor: 'rgb(153, 102, 255)',
    backgroundColor: 'rgba(153, 102, 255, 0.1)',
    tension: 0.4,
    fill: false,
    yAxisID: 'y1',
    pointRadius: 2
  });
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: `Wind Patterns ${year}${compareYear ? ` vs ${compareYear}` : ''} (Speed & Direction)`,
          font: { size: 16, weight: 'bold' }
        },
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (context.dataset.label.includes('Direction')) {
                  label += context.parsed.y + '°';
                } else {
                  label += context.parsed.y.toFixed(1) + ' km/h';
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Wind Speed (km/h)' },
          beginAtZero: true
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Wind Direction (°)' },
          beginAtZero: true,
          max: 360,
          grid: { drawOnChartArea: false }
        },
        x: {
          title: { display: true, text: 'Date' },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });
  
  chartInstances.push(chart);
  return canvas;
}

// Load and display charts
async function loadWeatherCharts() {
  const locationInput = chartsLocation.value.trim();
  const year = chartsYear.value;
  const compareYear = chartsCompareYear.value;
  const chartType = chartsType.value;
  
  if (!locationInput) {
    alert('Please enter a location');
    return;
  }
  
  // Clear previous charts
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];
  chartsContainer.innerHTML = '<p style="text-align: center;">Loading weather data...</p>';
  
  try {
    // Geocode location
    let lat, lon, locationName;
    if (locationInput.includes(',')) {
      const coords = locationInput.split(',');
      lat = parseFloat(coords[0].trim());
      lon = parseFloat(coords[1].trim());
      locationName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } else {
      const geoResult = await geocodePlace(locationInput);
      lat = geoResult.lat;
      lon = geoResult.lon;
      locationName = geoResult.name;
    }
    
    // Calculate date ranges (full year)
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Fetch data for main year
    const data = await fetchHistoricalWeather(lat, lon, startDate, endDate);
    
    // Fetch comparison data if selected
    let compareData = null;
    if (compareYear) {
      const compareStartDate = `${compareYear}-01-01`;
      const compareEndDate = `${compareYear}-12-31`;
      compareData = await fetchHistoricalWeather(lat, lon, compareStartDate, compareEndDate);
    }
    
    // Create charts container
    chartsContainer.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">Location: ${locationName}</h3>
        <p style="margin: 0; color: #666;">Year: ${year}${compareYear ? ` | Comparing with: ${compareYear}` : ''}</p>
      </div>
    `;
    
    // Create charts based on type
    if (chartType === 'temperature' || chartType === 'all') {
      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'margin-bottom: 30px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 400px;';
      const tempChart = createTemperatureChart(data, compareData, year, compareYear);
      chartDiv.appendChild(tempChart);
      chartsContainer.appendChild(chartDiv);
    }
    
    if (chartType === 'rainfall' || chartType === 'all') {
      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'margin-bottom: 30px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 400px;';
      const rainChart = createRainfallChart(data, compareData, year, compareYear);
      chartDiv.appendChild(rainChart);
      chartsContainer.appendChild(chartDiv);
    }
    
    if (chartType === 'wind' || chartType === 'all') {
      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'margin-bottom: 30px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 400px;';
      const windChart = createWindChart(data, compareData, year, compareYear);
      chartDiv.appendChild(windChart);
      chartsContainer.appendChild(chartDiv);
    }
    
    // Add summary statistics
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;';
    summaryDiv.innerHTML = `
      <h3 style="margin-top: 0;">Weather Summary for ${year}</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div>
          <strong>Avg Max Temp:</strong> ${(data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / data.daily.temperature_2m_max.length).toFixed(1)}°C
        </div>
        <div>
          <strong>Avg Min Temp:</strong> ${(data.daily.temperature_2m_min.reduce((a, b) => a + b, 0) / data.daily.temperature_2m_min.length).toFixed(1)}°C
        </div>
        <div>
          <strong>Total Rainfall:</strong> ${data.daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1)} mm
        </div>
        <div>
          <strong>Avg Wind Speed:</strong> ${(data.daily.wind_speed_10m_max.reduce((a, b) => a + b, 0) / data.daily.wind_speed_10m_max.length).toFixed(1)} km/h
        </div>
      </div>
      ${compareData ? `
        <h3 style="margin-top: 20px;">Weather Summary for ${compareYear}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <strong>Avg Max Temp:</strong> ${(compareData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / compareData.daily.temperature_2m_max.length).toFixed(1)}°C
          </div>
          <div>
            <strong>Avg Min Temp:</strong> ${(compareData.daily.temperature_2m_min.reduce((a, b) => a + b, 0) / compareData.daily.temperature_2m_min.length).toFixed(1)}°C
          </div>
          <div>
            <strong>Total Rainfall:</strong> ${compareData.daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1)} mm
          </div>
          <div>
            <strong>Avg Wind Speed:</strong> ${(compareData.daily.wind_speed_10m_max.reduce((a, b) => a + b, 0) / compareData.daily.wind_speed_10m_max.length).toFixed(1)} km/h
          </div>
        </div>
      ` : ''}
    `;
    chartsContainer.appendChild(summaryDiv);
    
  } catch (error) {
    console.error('Error loading charts:', error);
    chartsContainer.innerHTML = `
      <div style="padding: 20px; background: #ffebee; border-radius: 8px; color: #c62828;">
        <h3>Error Loading Charts</h3>
        <p>${error.message}</p>
        <p>Please check:</p>
        <ul>
          <li>Location name is correct</li>
          <li>You have internet connection</li>
          <li>Historical data is available for the selected year</li>
        </ul>
      </div>
    `;
  }
}

// Weather Charts Event Listeners
if (weatherChartsButton) {
  weatherChartsButton.addEventListener('click', () => {
    weatherChartsModal.style.display = 'block';
    // Pre-fill location if available
    const lastPlace = readFromStorage(storageKeys.lastPlace, null);
    if (lastPlace && !chartsLocation.value) {
      chartsLocation.value = lastPlace.place;
    }
  });
}

if (closeChartsModalButton) {
  closeChartsModalButton.addEventListener('click', () => {
    weatherChartsModal.style.display = 'none';
  });
}

if (weatherChartsModal) {
  weatherChartsModal.addEventListener('click', (event) => {
    if (event.target === weatherChartsModal) {
      weatherChartsModal.style.display = 'none';
    }
  });
}

if (loadChartsButton) {
  loadChartsButton.addEventListener('click', loadWeatherCharts);
}

// Allow Enter key in location input
if (chartsLocation) {
  chartsLocation.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadChartsButton.click();
    }
  });
}
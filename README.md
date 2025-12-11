# Climate & Weather App

A lightweight, offline-capable climate and weather web app with unique insights and MongoDB integration:

- Commute Comfort Score: blends temperature, wind, rain probability, and US AQI.
- AC Efficiency Advisor: suggests an energy-saving thermostat setpoint based on current outdoor conditions.
- UV Index: current and hourly UV badges.
- Disaster overlays: USGS earthquakes and NASA EONET natural events on the map.
- Time slider: scrub through the next 24h to inspect temp/UV/rain at the selected point.
- Works offline after first load; caches last fetched data for quick startup.
- MongoDB integration for storing location history and weather data.

Data sources: Open‑Meteo (weather + air quality), OpenStreetMap Nominatim (geocoding), USGS, NASA EONET. Map tiles: CARTO Voyager.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on default port 27017)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure MongoDB is running on your system

For detailed MongoDB installation and setup instructions, see [MONGODB_SETUP.md](MONGODB_SETUP.md).

## Test MongoDB Connection

To verify that MongoDB is properly configured and accessible, run:

```bash
npm run test-db
```

This will test the connection and create/remove a test document to ensure everything is working correctly.

## Run locally

Start the server:
```bash
npm start
# then open http://localhost:3000
```

For development with auto-restart:
```bash
npm run dev
```

Alternative method (without MongoDB features):
On Windows, double-click `index.html` to open in your browser.

For full offline service worker functionality and to allow map tiles/geocoding, serve via a local server:
```bash
python -m http.server 5173
# then open http://localhost:5173
```


## Features

- Use My Location via browser geolocation, or search any place.
- Current metrics: temperature, feels-like, humidity, wind, rain probability, US AQI, PM2.5, UV.
- Next 24h mini-cards including AQI and UV ribbons.
- Interactive map: click to set a marker and view details; toggle earthquakes and natural events; scrub time.
- Caches last successful data for 30 minutes.

## Customize

- Tweak the comfort score and AC advice logic in `script.js` (`computeCommuteComfortScore`, `computeAcEfficiencyAdvice`).
- Adjust the time slider behavior in `script.js` (`updateMarkerPopupForHour`).
- Styling in `styles.css`.

## Credits

Map data © OpenStreetMap contributors · Map © Leaflet · Tiles © CARTO. Weather & air: Open‑Meteo. Geocoding: OpenStreetMap Nominatim. Disasters: USGS, NASA EONET.



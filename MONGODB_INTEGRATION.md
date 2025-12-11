# MongoDB Integration Documentation

This document explains how MongoDB has been integrated into the Climate & Weather App to enhance functionality with persistent data storage.

## Features Added

1. **Location History**: Store searched locations in MongoDB for quick access
2. **Weather Data Storage**: Save weather data for analysis and historical comparison
3. **Recent Locations Display**: Show recently searched locations in the UI

## Database Schema

### Location Collection
```javascript
{
  name: String,        // Location name
  latitude: Number,    // Latitude coordinate
  longitude: Number,   // Longitude coordinate
  createdAt: Date      // Creation timestamp
}
```

### WeatherData Collection
```javascript
{
  location: ObjectId,  // Reference to Location collection
  temperature: Number,
  apparentTemperature: Number,
  humidity: Number,
  windSpeed: Number,
  precipitationProbability: Number,
  uvIndex: Number,
  aqi: Number,
  pm25: Number,
  timestamp: Date      // Data collection timestamp
}
```

## API Endpoints

### Locations
- `GET /api/locations` - Retrieve all stored locations
- `POST /api/locations` - Save a new location

### Weather Data
- `GET /api/weather/:locationId` - Retrieve weather data for a specific location
- `POST /api/weather` - Save new weather data

## How It Works

1. When a user searches for a location or uses geolocation:
   - The location is saved to MongoDB
   - Current weather data is fetched from external APIs
   - Weather data is saved to MongoDB linked to the location

2. Recent locations are displayed in the header:
   - Retrieved from MongoDB every 30 seconds
   - Shows the 5 most recently searched locations
   - Clicking a location button loads its weather data

## Setup Instructions

1. Ensure MongoDB is installed and running on your system
2. Run `npm install` to install dependencies
3. Start the server with `npm start`
4. Access the application at http://localhost:3000

## Fallback Behavior

If MongoDB is not available or there are connection issues:
- The application continues to function using localStorage
- No errors are shown to the user
- Data is only stored locally in the browser

## Future Enhancements

Possible future improvements include:
- User accounts and personalized location lists
- Historical weather data comparison
- Data analytics and trend visualization
- Export functionality for weather data
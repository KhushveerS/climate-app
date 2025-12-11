const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Load MongoDB configuration
const dbConfig = require('./mongodb-config');

// Middleware
app.use(express.json());
app.use(express.static('.'));

// MongoDB connection
mongoose.connect(dbConfig.mongoURI, dbConfig.options)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Location Schema
const locationSchema = new mongoose.Schema({
  name: String,
  latitude: Number,
  longitude: Number,
  createdAt: { type: Date, default: Date.now }
});

// Weather Data Schema
const weatherDataSchema = new mongoose.Schema({
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  temperature: Number,
  apparentTemperature: Number,
  humidity: Number,
  windSpeed: Number,
  precipitationProbability: Number,
  uvIndex: Number,
  aqi: Number,
  pm25: Number,
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', locationSchema);
const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

// Routes
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weather/:locationId', async (req, res) => {
  try {
    const weatherData = await WeatherData.find({ location: req.params.locationId })
      .sort({ timestamp: -1 })
      .limit(24);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/weather', async (req, res) => {
  try {
    const weatherData = new WeatherData(req.body);
    await weatherData.save();
    res.status(201).json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
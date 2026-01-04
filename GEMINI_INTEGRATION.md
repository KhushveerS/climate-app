# Google Gemini API Integration for AI Travel Advisor

This document explains how to configure and use the Google Gemini API with the AI Travel Advisor feature in the Climate & Weather App.

## Setup Instructions

### 1. Get a Gemini API Key
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click on "Get API Key" or "Create API Key"
4. Follow the instructions to create a new API key
5. Copy your API key (keep it secure)

### 2. Configure the API Key
The app looks for the API key in browser's localStorage. You can set it in several ways:

#### Method 1: Using Browser Console
1. Open the app in your browser
2. Press F12 to open developer tools
3. Go to the Console tab
4. Run this command:
```javascript
localStorage.setItem('gemini_api_key', 'YOUR_ACTUAL_API_KEY_HERE');
```

#### Method 2: Using a Setup Function (Coming Soon)
A future version will include a settings UI to configure the API key directly in the app.

## How It Works

### Context Enrichment
The AI Travel Advisor enhances your queries with contextual information:
- Current location (if available)
- Current weather conditions (temperature, humidity, wind, precipitation)
- Air quality index (AQI)
- Comfort level based on weather conditions
- Any other relevant data from the app

### API Request Flow
1. User enters a travel-related query in the AI Travel Advisor modal
2. The app gathers contextual information (location, weather, etc.)
3. A prompt is constructed combining the user query with contextual information
4. The request is sent to the Gemini API endpoint
5. The response is formatted and displayed in the UI

### Example Prompt Structure
```
You are an AI Travel Advisor providing personalized travel recommendations. 
The user is currently in Paris, France. 
Current weather conditions: Temperature: 22°C, Humidity: 65%, Wind: 12 km/h, Precipitation probability: 10%. 
Comfort level: 78/100 - Decent; light layers recommended. 
Air quality (AQI): 42. 
Please provide detailed travel recommendations based on this query: [user's query]
```

## Security Considerations

- API keys are stored only in the browser's localStorage (not sent to any server except Google's)
- The app does not transmit your API key to any server other than Google's Gemini API
- For production use, consider implementing a backend proxy to protect the API key

## Troubleshooting

### Common Issues

1. **"Configure your Google Gemini API key" message**
   - Make sure you've properly set the API key in localStorage
   - Check that the key is valid and has not expired
   - Ensure you have internet connectivity

2. **API Error Messages**
   - Check that your API key has sufficient quota
   - Verify that your API key has access to the Gemini API
   - Make sure the API key hasn't been revoked

3. **Poor Response Quality**
   - Try being more specific in your travel queries
   - The AI works better with detailed requests

## API Limits and Quotas

Be aware of Google's Gemini API usage limits and quotas. Check the [Google AI Studio](https://ai.google.dev/) dashboard for current usage information.

## Privacy Notice

- Your travel queries are sent to Google's Gemini API to generate responses
- No personal data is stored by the app (beyond browser localStorage)
- The app does not collect or store your queries or API responses
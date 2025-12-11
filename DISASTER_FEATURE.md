# Disaster Information Feature

This document describes the new disaster information feature added to the Climate & Weather App.

## Feature Overview

A new "Disaster Info" button has been added to the navigation bar that allows users to view current disaster and natural event information from USGS and NASA EONET without needing to interact with the map.

## Components

### 1. Navigation Button
- Added "Disaster Info" button to the header navigation
- Styled with red accent to indicate importance
- Positioned next to the search form

### 2. Modal Dialog
- Clean, responsive modal dialog appears when the button is clicked
- Contains two sections:
  - Earthquake data from USGS
  - Natural events data from NASA EONET
- Each section displays the 10 most relevant events

### 3. Data Presentation
- Earthquakes sorted by magnitude (highest first)
- Events formatted with title, category, and date information
- Loading states while data is being fetched
- Error handling for failed requests

## Technical Implementation

### Frontend Changes
1. **HTML Updates**:
   - Added disaster info button to header
   - Created modal structure with dedicated sections

2. **CSS Styling**:
   - Styled disaster button with danger color scheme
   - Created responsive modal with dark theme
   - Added disaster item formatting

3. **JavaScript Functionality**:
   - New event listener for disaster info button
   - Modal open/close functionality
   - Data formatting functions for earthquakes and events
   - Parallel data fetching from USGS and EONET APIs

### Reused Components
- Utilizes existing API functions:
  - `fetchUSGSEarthquakes()` for earthquake data
  - `fetchEONETEvents()` for natural events data

## User Experience

### Accessing the Feature
1. User clicks the "Disaster Info" button in the header
2. Modal dialog slides into view
3. Loading indicators show while data is fetched
4. Data is displayed in organized sections

### Interaction
- Clicking the "×" button or outside the modal closes it
- Data automatically refreshes each time the modal is opened
- Responsive design works on mobile and desktop

## Data Sources

1. **USGS Earthquake Data**
   - Real-time earthquake information
   - Includes magnitude, location, depth, and time

2. **NASA EONET Events**
   - Natural events like wildfires, storms, volcanic activity
   - Categorized by event type
   - Includes timing and location information

## Error Handling

- Graceful degradation if either data source is unavailable
- User-friendly error messages
- Modal still functions even if one data source fails

## Future Enhancements

Potential improvements for future versions:
1. Auto-refresh interval for disaster data
2. Filtering options by disaster type or severity
3. Geolocation-based filtering for nearby disasters
4. Detailed view for individual disaster events
5. Email/SMS alerts for significant events
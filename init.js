// Function to check if MongoDB backend is available
async function checkBackendAvailability() {
  try {
    const response = await fetch('http://localhost:3000/api/locations', { 
      method: 'HEAD',
      timeout: 3000 // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log('Backend not available, using localStorage only');
    return false;
  }
}

// Update the isServerAvailable function in script.js
checkBackendAvailability().then(isAvailable => {
  // This would normally update the global function, but since we can't easily modify
  // the existing function, we'll rely on error handling in the API calls instead
  console.log('MongoDB backend availability:', isAvailable);
});
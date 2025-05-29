// API Keys (Replace with your own keys)
const WEATHER_API_KEY = "3095a81999f3e9494bab058f44bdadd6";
const MAPBOX_API_KEY = "pk.eyJ1IjoiZmx6aCIsImEiOiJjbWI5ZmJibXUwZXljMmpxdXBlY2Z1OWoyIn0.6Gd9Fl3Bh51nqJ3rywx4Xg";
const UNSPLASH_API_KEY = "5RHNYizHXV_i5Kh_4xjZK0_Cwhtgm1Ov1dasLIVK6J8";

// DOM Elements
const locationSearch = document.getElementById('locationSearch');
const searchButton = document.getElementById('searchButton');
const myLocationBtn = document.getElementById('myLocation');
const currentLocation = document.getElementById('currentLocation');
const currentDate = document.getElementById('currentDate');
const currentTemp = document.getElementById('currentTemp');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDesc = document.getElementById('weatherDesc');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const locationBackground = document.getElementById('locationBackground');
const forecastItems = document.getElementById('forecastItems');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Global Variables
let map;
let currentUnit = 'celsius';
let currentWeatherData = null;
let quickLocationItems = document.querySelectorAll('.quick-locations li');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize date display
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Initialize map
    initMap();
    
    // Get user's location automatically
    fetchUserLocation();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize the map
function initMap() {
    map = L.map('weatherMap').setView([0, 0], 2);
    
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                     '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                     'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: MAPBOX_API_KEY
    }).addTo(map);
    
    // Add click event to map
   map.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    
    // Clear previous markers
    clearMapMarkers();
    
    // Add a temporary loading marker
    const loadingMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'loading-marker',
            html: '<div class="loader"></div>',
            iconSize: [40, 40]
        })
    }).addTo(map);
    
    try {
        await fetchWeatherByCoords(lat, lng);
    } catch (error) {
        // Remove loading marker if there's an error
        map.removeLayer(loadingMarker);
        alert('Could not fetch weather data for this location. Please try again.');
    }
    }); 

    function clearMapMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}
}

// Set up all event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', handleSearch);
    locationSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // My location button
    myLocationBtn.addEventListener('click', fetchUserLocation);
    
    // Quick location buttons
    quickLocationItems.forEach(item => {
        item.addEventListener('click', () => {
            fetchWeatherByCity(item.dataset.city);
        });
    });
    
    // Unit toggle buttons
    celsiusBtn.addEventListener('click', () => toggleTemperatureUnit('celsius'));
    fahrenheitBtn.addEventListener('click', () => toggleTemperatureUnit('fahrenheit'));
}

// Handle location search
function handleSearch() {
    const location = locationSearch.value.trim();
    if (location) {
        fetchWeatherByCity(location);
        locationSearch.value = '';
    }
}

// Fetch user's current location
function fetchUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                // Default to London if geolocation fails
                fetchWeatherByCity('London');
            }
        );
    } else {
        // Geolocation not supported
        fetchWeatherByCity('London');
    }
}

// Fetch weather by city name
async function fetchWeatherByCity(city) {
    try {
        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const weatherData = await weatherResponse.json();
        currentWeatherData = weatherData;
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        
        // Update UI with weather data
        updateWeatherDisplay(weatherData, forecastData);
        
        // Update map location
        updateMapLocation(weatherData.coord.lat, weatherData.coord.lon);
        
        // Fetch location image
        fetchLocationImage(weatherData.name);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Could not find weather data for that location. Please try another city.');
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();
        currentWeatherData = weatherData;
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        
        // Update UI with weather data
        updateWeatherDisplay(weatherData, forecastData);
        
        // Update map location
        updateMapLocation(lat, lon);
        
        // Fetch location image
        fetchLocationImage(weatherData.name);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Could not fetch weather data for this location. Please try again.');
    }
}

// Update the UI with weather data
function updateWeatherDisplay(weatherData, forecastData) {
    // Update current location
    currentLocation.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
    
    // Update current weather
    currentTemp.textContent = Math.round(weatherData.main.temp);
    weatherDesc.textContent = weatherData.weather[0].description;
    
    // Update weather icon
    const iconCode = weatherData.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = weatherData.weather[0].main;
    
    // Update weather details
    feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°`;
    humidity.textContent = `${weatherData.main.humidity}%`;
    windSpeed.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${weatherData.main.pressure} hPa`;
    
    // Update forecast
    updateForecastDisplay(forecastData);
    
    // Convert temperatures if needed
    if (currentUnit === 'fahrenheit') {
        convertAllTemperaturesToFahrenheit();
    }
}

// Update the forecast display
function updateForecastDisplay(forecastData) {
    // Clear previous forecast items
    forecastItems.innerHTML = '';
    
    // Group forecast by day
    const dailyForecast = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dailyForecast[day]) {
            dailyForecast[day] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyForecast[day].temps.push(item.main.temp);
        dailyForecast[day].icons.push(item.weather[0].icon);
        dailyForecast[day].descriptions.push(item.weather[0].description);
    });
    
    // Create forecast items for the next 5 days
    const days = Object.keys(dailyForecast).slice(0, 5);
    days.forEach(day => {
        const dayData = dailyForecast[day];
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));
        
        // Use the most frequent icon for the day
        const iconCounts = {};
        dayData.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
            iconCounts[a] > iconCounts[b] ? a : b
        );
        
        // Create forecast item element
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${day}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${mostFrequentIcon}@2x.png" alt="${dayData.descriptions[0]}">
            <div class="forecast-temp">
                <span class="forecast-max">${maxTemp}°</span>
                <span class="forecast-min">${minTemp}°</span>
            </div>
        `;
        
        forecastItems.appendChild(forecastItem);
    });
}

// Update map location
function updateMapLocation(lat, lon) {
    map.setView([lat, lon], 10);
    
    // Clear previous markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    // Add new marker
    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${currentWeatherData.name}</b><br>${currentWeatherData.weather[0].description}`)
        .openPopup();
}

// Fetch location image from Unsplash
async function fetchLocationImage(location) {
    try {
        const response = await fetch(
            `https://api.unsplash.com/photos/random?query=${location}&orientation=landscape&client_id=${UNSPLASH_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.urls && data.urls.regular) {
                locationBackground.style.backgroundImage = `url(${data.urls.regular})`;
            }
        }
    } catch (error) {
        console.error('Error fetching location image:', error);
        // Fallback to a generic weather background
        locationBackground.style.backgroundImage = 'url(https://source.unsplash.com/random/1600x900/?weather)';
    }
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Toggle temperature unit
function toggleTemperatureUnit(unit) {
    if (unit === currentUnit) return;
    
    currentUnit = unit;
    
    // Update active button
    celsiusBtn.classList.toggle('active', unit === 'celsius');
    fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
    
    // Convert temperatures
    if (unit === 'fahrenheit') {
        convertAllTemperaturesToFahrenheit();
    } else {
        convertAllTemperaturesToCelsius();
    }
}

// Convert all temperatures to Fahrenheit
function convertAllTemperaturesToFahrenheit() {
    if (!currentWeatherData) return;
    
    // Current temp
    const currentTempC = parseFloat(currentTemp.textContent);
    currentTemp.textContent = Math.round((currentTempC * 9/5) + 32);
    
    // Feels like
    const feelsLikeC = parseFloat(feelsLike.textContent);
    feelsLike.textContent = `${Math.round((feelsLikeC * 9/5) + 32)}°`;
    
    // Forecast temps
    const forecastMaxItems = document.querySelectorAll('.forecast-max');
    const forecastMinItems = document.querySelectorAll('.forecast-min');
    
    forecastMaxItems.forEach(item => {
        const tempC = parseFloat(item.textContent);
        item.textContent = `${Math.round((tempC * 9/5) + 32)}°`;
    });
    
    forecastMinItems.forEach(item => {
        const tempC = parseFloat(item.textContent);
        item.textContent = `${Math.round((tempC * 9/5) + 32)}°`;
    });
}

// Convert all temperatures to Celsius
function convertAllTemperaturesToCelsius() {
    if (!currentWeatherData) return;
    
    // Current temp (from original data)
    currentTemp.textContent = Math.round(currentWeatherData.main.temp);
    
    // Feels like (from original data)
    feelsLike.textContent = `${Math.round(currentWeatherData.main.feels_like)}°`;
    
    // Forecast temps (need to be handled differently as we don't store original data)
    // In a production app, you would store the original data and convert as needed
    // For this example, we'll just approximate by converting back from Fahrenheit
    const forecastMaxItems = document.querySelectorAll('.forecast-max');
    const forecastMinItems = document.querySelectorAll('.forecast-min');
    
    forecastMaxItems.forEach(item => {
        const tempF = parseFloat(item.textContent);
        item.textContent = `${Math.round((tempF - 32) * 5/9)}°`;
    });
    
    forecastMinItems.forEach(item => {
        const tempF = parseFloat(item.textContent);
        item.textContent = `${Math.round((tempF - 32) * 5/9)}°`;
    });
}

let weatherData = "NO DATA";
let weather;

async function init() {
    // console.log("Initializing weather module");
    weatherData = await getWeatherData();
    // console.log("Initial weather data:", weatherData);

    if (!weatherData) return;

    weather = {
        temp: await getDaysData("temperature_2m"),
        apparentTemp: await getDaysData("apparent_temperature"),
        precipitation: await getDaysData("precipitation"),
        humidity: await getDaysData("relative_humidity_2m"),
        cloudCover: await getDaysData("cloud_cover"),
        windSpeed: await getDaysData("wind_speed_10m")
    };

    // console.log("Cleaned weather data:", weather);
    
    displayWeather("temperature", "Temperature", "°F", weather.temp);
    displayWeather("apparent_temp", "Apparent Temperature", "°F", weather.apparentTemp);
    displayWeather("precipitation", "Precipitation", "in", weather.precipitation);
    displayWeather("humidity", "Humidity", "%", weather.humidity);
    displayWeather("cloud_cover", "Cloud Cover", "%", weather.cloudCover);
    displayWeather("wind_speed", "Wind Speed", "mph", weather.windSpeed);
    // serialize the weather object before sending to AI
    const aiSummary = await askAI(JSON.stringify(weather), "You are a helpful assistant that summarizes weather data into a concise, 1 sentence summary.");
    document.getElementById("AIWeather").innerHTML = `<h2>AI Weather Summary</h2><p>${aiSummary}</p>`;
}

async function getWeatherData() {
    let lat = 0;
    let lng = 0;
    
    if ("geolocation" in navigator) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            // console.log(`Latitude: ${lat}, Longitude: ${lng}`);
        } catch (error) {
            console.error("Error getting location:", error.message);
            return null;
        }
    } else {
        console.log("Geolocation is not supported by this browser.");
        return null;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,cloud_cover,wind_speed_10m,precipitation&timezone=auto`;

    try {
        const response = await fetch(url);
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch weather data:", error);
        return null;
    }
}

async function getDaysData(key) {
    const items = [];
    
    if (weatherData && weatherData.hourly && weatherData.hourly[key]) {
        weatherData.hourly[key].forEach((item, index) => {
            if (index < 24) {
                items.push(item);
            }
        });
    }

    return items;
}

async function displayWeather(id, name, unit, data) {
    const element = document.getElementById(id);
    if (!element || !data || data.length === 0) return;
    
    const weatherIcons = {
        'temperature': 'device_thermostat',
        'apparent_temp': 'thermostat',
        'precipitation': 'rainy',
        'humidity': 'humidity_percentage',
        'cloud_cover': 'cloud',
        'visibility': 'visibility',
        'wind_speed': 'air'
    };
    
    const icon = weatherIcons[id] || 'info';
    
    element.innerHTML = `
        <span class="material-symbols-outlined weather-icon">${icon}</span>
        <div class="stat-details">
            <span class="stat-value">${data[0]}<small>${unit}</small></span>
            <span class="stat-name">${name}</span>
        </div>
    `;
}

async function askAI(prompt, role, priority = 1) {
    try {
        const response = await fetch(`/api/ask?q=${encodeURIComponent(prompt)}&role=${encodeURIComponent(role)}&priority=${priority}`);
        const result = await response.json();
        return result.content;
    } catch (error) {
        console.error('Error calling AI:', error);
        return 'AI unavailable';
    }
}

document.addEventListener('DOMContentLoaded', init);
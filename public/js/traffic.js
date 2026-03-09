let trafficData;

async function getTraffic() {
    const startAddress = localStorage.getItem("commuteStart");
    const endAddress = localStorage.getItem("commuteEnd");
    
    if (!startAddress || !endAddress) {
        console.error("Start or end address are missing. Please set them in the settings.");
        document.getElementById("traffic").style.display = "none";
        
        // Expand the weather card to fill the row
        const weatherCard = document.getElementById("weather");
        if (weatherCard) {
            weatherCard.classList.add("span-full");
        }
        return;
    }
    
    try {
        const loc1response = await fetch(`http://localhost:3000/api/location?address=${startAddress}`);
        const loc1 = await loc1response.json();
        const loc2response = await fetch(`http://localhost:3000/api/location?address=${endAddress}`);
        const loc2 = await loc2response.json();
        const response = await fetch(`http://localhost:3000/api/traffic?startLat=${loc1.lat}&startLon=${loc1.lng}&endLat=${loc2.lat}&endLon=${loc2.lng}`);
        const result = await response.json();
        // console.log(loc1, loc2);
        if (result.error) {
            throw new Error(result.error);
        }
        
        trafficData = {
            "distance": result.features[0].properties.distance / 1609.34,
            "time": result.features[0].properties.time / 60,
            "pathPoints": result.features[0].geometry.coordinates
        };
        
        document.getElementById("trafficTime").innerHTML = `Time: ${trafficData.time.toFixed(2)} minutes`;
        document.getElementById("trafficDistance").innerHTML = `Distance: ${trafficData.distance.toFixed(2)} miles`;
        // console.log('Traffic data loaded successfully:', trafficData);
        const leafletPoints = trafficData.pathPoints[0].map(([lon, lat]) => [lat, lon]);
        const map = L.map('map').setView(leafletPoints[0], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
        }).addTo(map);
        L.polyline(leafletPoints, { color: 'blue', weight: 4 }).addTo(map);
        const bounds = L.latLngBounds(leafletPoints);
        map.fitBounds(bounds);
    } catch (error) {
        console.error('Error fetching traffic data:', error);
        document.getElementById("trafficTime").innerHTML = "Error loading traffic data";
        document.getElementById("map").style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', getTraffic);
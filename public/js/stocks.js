// Call functions
init();

// Functions
async function init() {
    try {
        const stockFunction = "TIME_SERIES_DAILY";
        const stockSymbol = localStorage.getItem("stockSymbol");
        
        console.log(`Fetching stock data for symbol: ${stockSymbol}`);
        
        const response = await fetch(`http://localhost:3000/api/stocks?function=${stockFunction}&symbol=${stockSymbol.toUpperCase()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stockData = await response.json();
        console.log("Successfully fetched stock data!");
        console.log("Stock data structure:", stockData);
        console.log("Open prices count:", stockData.open ? stockData.open.length : 0);
        console.log("Close prices count:", stockData.close ? stockData.close.length : 0);
        
        if (stockData.open && stockData.open.length > 0) {
            console.log("Latest open price:", stockData.open[0]);
            console.log("Latest close price:", stockData.close[0]);
            displayStockData(stockData);
        } else {
            console.log("No stock data received or arrays are empty");
            console.log("Error message:", stockData.error);
        }

        displayChart(stockData);
        
    } catch (error) {
        console.error("Error fetching stock data:", error);
        document.getElementById("stocks").style.display = "none";
    }
}

function displayStockData(stockData) {
    const stockContainer = document.getElementById('stockContainer');
    
    if (!stockContainer) {
        console.error("Stock container element not found");
        return;
    }
    
    if (stockData.open && stockData.open.length > 0) {
        const latestOpen = stockData.open[0];
        const latestClose = stockData.close[0];
        
        const stockInfo = document.createElement('div');
        stockInfo.className = 'stock-info';
        stockInfo.innerHTML = `
            <h3>Stock Information</h3>
            <p><strong>Latest Open:</strong> $${latestOpen.value.toFixed(2)} (${latestOpen.date})</p>
            <p><strong>Latest Close:</strong> $${latestClose.value.toFixed(2)} (${latestClose.date})</p>
            <p><strong>Total data points:</strong> ${stockData.open.length}</p>
        `;
        
        // Clear existing content and add new stock info
        stockContainer.innerHTML = '';
        stockContainer.appendChild(stockInfo);
    } else {
        stockContainer.innerHTML = '<p>No stock data available</p>';
    }
}

function displayChart(stockData) {
    const xValues = Array.from({ length: 100 }, (v, i) => i); // sets it to 100 data points
    const yValues = stockData["close"].slice(0, 100).map(entry => entry.value); // gets the close values for the first 100 data points
    console.log("X Values: " + xValues);
    console.log("Y Values: " + yValues);

    new Chart("stockChart", {
        type: "line",
        data: {
            labels: xValues,
            datasets: [{
            fill: false,
            lineTension: 0,
            backgroundColor: "rgba(0,0,255,1.0)",
            borderColor: "rgba(0,0,255,0.1)",
            data: yValues
            }]
        },
        options: {
            legend: {display: false},
            scales: {
            yAxes: [{ticks: {min: 6, max:16}}],
            }
        }
    });
}
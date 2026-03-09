// Call functions
init();

// Functions
async function init() {
    try {
        const stockSymbol = localStorage.getItem("stockSymbol");
        
        console.log(`Fetching stock data for symbol: ${stockSymbol}`);
        
        const response = await fetch(`http://localhost:3000/api/stocks?symbol=${stockSymbol.toUpperCase()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stockData = await response.json();
        console.log("Successfully fetched stock data!");
        console.log("Stock data structure:", stockData);
        console.log("Open prices count:", stockData.open ? stockData.open.length : 0);
        console.log("Close prices count:", stockData.close ? stockData.close.length : 0);
        console.log("Current price data:", stockData.current);
        
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
        
        // Expand the news card to fill the row
        const newsCard = document.getElementById("news");
        if (newsCard) {
            newsCard.classList.add("span-full");
        }
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
        const current = stockData.current;
        
        // Determine if stock is up or down
        const isPositive = current && current.change >= 0;
        const changeClass = isPositive ? 'positive' : 'negative';
        const changeSymbol = isPositive ? '+' : '';
        
        const stockInfo = document.createElement('div');
        stockInfo.className = 'stock-info';
        stockInfo.innerHTML = `
            <h3>Stock Information</h3>
            ${current ? `
                <p><strong>Current Price:</strong> $${current.price.toFixed(2)}</p>
                <p class="${changeClass}"><strong>Change:</strong> ${changeSymbol}$${current.change.toFixed(2)} (${changeSymbol}${current.changePercent.toFixed(2)}%)</p>
                <p><strong>Previous Close:</strong> $${current.previousClose.toFixed(2)}</p>
            ` : ''}
            <p><strong>Latest Open:</strong> $${latestOpen.value.toFixed(2)} (${latestOpen.date})</p>
            <p><strong>Latest Close:</strong> $${latestClose.value.toFixed(2)} (${latestClose.date})</p>
            <p><strong>Historical data points:</strong> ${stockData.open.length}</p>
        `;
        
        // Clear existing content and add new stock info
        stockContainer.innerHTML = '';
        stockContainer.appendChild(stockInfo);
        
        // Add some basic styling for positive/negative changes
        const style = document.createElement('style');
        style.textContent = `
            .stock-info .positive { color: #4CAF50; }
            .stock-info .negative { color: #F44336; }
        `;
        if (!document.querySelector('style[data-stock-styles]')) {
            style.setAttribute('data-stock-styles', 'true');
            document.head.appendChild(style);
        }
    } else {
        stockContainer.innerHTML = '<p>No stock data available</p>';
    }
}

function displayChart(stockData) {
    if (!stockData.close || stockData.close.length === 0) {
        console.log("No data available for chart");
        return;
    }

    // If we only have limited data, create a simple visualization showing current vs previous
    const current = stockData.current;
    const latestClose = stockData.close[0];
    
    if (current && stockData.close.length === 1) {
        // Create a simple chart showing previous close vs current price
        const xValues = ["Previous Close", "Current Price"];
        const yValues = [current.previousClose, current.price];
        
        console.log("Chart X Values:", xValues);
        console.log("Chart Y Values:", yValues);
        
        // Calculate appropriate Y-axis range
        const minValue = Math.min(...yValues);
        const maxValue = Math.max(...yValues);
        const range = maxValue - minValue;
        const padding = Math.max(range * 0.1, 1); // 10% padding or at least $1
        
        new Chart("stockChart", {
            type: "line",
            data: {
                labels: xValues,
                datasets: [{
                    fill: false,
                    lineTension: 0,
                    backgroundColor: current.change >= 0 ? "rgba(76,175,80,1.0)" : "rgba(244,67,54,1.0)",
                    borderColor: current.change >= 0 ? "rgba(76,175,80,0.8)" : "rgba(244,67,54,0.8)",
                    borderWidth: 3,
                    pointBackgroundColor: current.change >= 0 ? "rgba(76,175,80,1.0)" : "rgba(244,67,54,1.0)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    data: yValues
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {display: false},
                scales: {
                    yAxes: [{
                        ticks: {
                            min: minValue - padding,
                            max: maxValue + padding,
                            maxTicksLimit: 5,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Price ($)'
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return '$' + tooltipItem.yLabel.toFixed(2);
                        }
                    }
                }
            }
        });
    } else {
        // Use historical data if available
        const dates = stockData.close.map(entry => entry.date).reverse(); // Reverse to show chronological order
        const prices = stockData.close.map(entry => entry.value).reverse();
        
        console.log("Chart dates:", dates);
        console.log("Chart prices:", prices);
        
        // Calculate appropriate Y-axis range
        const minValue = Math.min(...prices);
        const maxValue = Math.max(...prices);
        const range = maxValue - minValue;
        const padding = Math.max(range * 0.15, 2); // Increased padding to 15% or at least $2
        
        new Chart("stockChart", {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    fill: false,
                    lineTension: 0,
                    backgroundColor: "rgba(0,123,255,1.0)",
                    borderColor: "rgba(0,123,255,0.8)",
                    borderWidth: 2,
                    pointBackgroundColor: "rgba(0,123,255,1.0)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 1,
                    pointRadius: 4,
                    data: prices
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {display: false},
                scales: {
                    yAxes: [{
                        ticks: {
                            min: minValue - padding,
                            max: maxValue + padding,
                            maxTicksLimit: 5, // Limit number of ticks to prevent overlap
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Price ($)'
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            maxTicksLimit: 6, // Greatly limit x-axis labels to avoid overlap on mobile
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index, values) {
                                // Show every other day
                                return index % 2 === 0 ? value : '';
                            }
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Date'
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return '$' + tooltipItem.yLabel.toFixed(2);
                        }
                    }
                }
            }
        });
    }
}
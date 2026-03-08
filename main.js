require('dotenv').config();
const express = require('express');
const path = require('path');
const Parser = require('rss-parser');
const fetch = require('node-fetch');
const OpenAI = require('openai');

const app = express();
const port = 3000;

app.use(express.static('public'));

const featherless = new OpenAI({
    apiKey: process.env.FEATHERLESS_API_KEY,
    baseURL: "https://api.featherless.ai/v1"
});

class AIQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.requestCounter = 0;
    }

    async addRequest(prompt, role, priority = 5) {
        return new Promise((resolve, reject) => {
            const requestId = ++this.requestCounter;
            const request = { 
                id: requestId,
                prompt, 
                role, 
                priority, 
                resolve, 
                reject,
                timestamp: new Date().toISOString()
            };
            
            this.queue.push(request);
            this.queue.sort((a, b) => a.priority - b.priority);
            
            console.log(`[AI Queue] Added request #${requestId} with priority ${priority}. Queue length: ${this.queue.length}`);
            this.logQueueStatus();
            
            this.processQueue();
        });
    }

    logQueueStatus() {
        if (this.queue.length > 0) {
            console.log('[AI Queue] Current queue:');
            this.queue.forEach((req, index) => {
                console.log(`  ${index + 1}. Request #${req.id} (Priority: ${req.priority})`);
            });
        }
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log('[AI Queue] Starting to process queue...');
        
        while (this.queue.length > 0) {
            const request = this.queue.shift();
            const { id, prompt, role, priority, resolve, reject } = request;
            
            console.log(`[AI Queue] Processing request #${id} (Priority: ${priority}). Remaining: ${this.queue.length}`);
            
            try {
                const response = await featherless.chat.completions.create({
                    model: "deepseek-ai/DeepSeek-V3.2", 
                    messages: [
                        { role: "system", content: role },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 32000,
                    temperature: 0.7
                });
                
                console.log(`[AI Queue] Completed request #${id}`);
                resolve(response.choices[0].message.content);
            } catch (error) {
                console.error(`[AI Queue] Failed request #${id}:`, error);
                reject(error);
            }
        }
        
        console.log('[AI Queue] Queue processing complete');
        this.isProcessing = false;
    }
}

const aiQueue = new AIQueue();

app.get('/api/news', async (req, res) => {
    try {
        const parser = new Parser();
        const feed = await parser.parseURL('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml');
        const newsData = {
            title: feed.title,
            description: feed.description,
            items: feed.items.slice(0, 10).map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                contentSnippet: item.contentSnippet
            }))
        };
        res.json(newsData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/api/traffic', async (req, res) => {
    try {
        const { startLat, startLon, endLat, endLon } = req.query;
        const apiKey = process.env.GEOAPIFY_API_KEY;
        
        if (!startLat || !startLon || !endLat || !endLon) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        const url = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLon}|${endLat},${endLon}&mode=drive&apiKey=${apiKey}`;
        
        const response = await fetch(url);
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Geoapify API error:', result);
            return res.status(response.status).json({ error: result.message || 'Geoapify API error' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Traffic API error:', error);
        res.status(500).json({ error: 'Failed to fetch traffic data: ' + error.message });
    }
});

app.get('/api/stocks', async (req, res) => {
    const stockFunction = req.query.function || "TIME_SERIES_DAILY";
    const stockSymbol = req.query.symbol;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    console.log(`[Stocks API] Request: function=${stockFunction}, symbol=${stockSymbol}`);
    console.log(`[Stocks API] API Key configured: ${apiKey ? 'Yes' : 'No'}`);

    if (!apiKey || !stockSymbol || !stockFunction) {
        console.error("[Stocks API] One or more required parameters are missing");
        return res.status(400).json({ error: "One or more required parameters are missing" });
    }

    try {
        const url = `https://www.alphavantage.co/query?function=${stockFunction}&symbol=${stockSymbol}&apikey=${apiKey}`;
        console.log(`[Stocks API] Making request to: ${url.replace(apiKey, '***')}`);
        
        const response = await fetch(url);
        console.log(`[Stocks API] Response status: ${response.status}`);
        
        if (!response.ok) {
            console.error(`[Stocks API] HTTP error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: `API request failed: ${response.statusText}` });
        }
        
        const jsonData = await response.json();
        console.log(`[Stocks API] Raw response keys:`, Object.keys(jsonData));
        console.log(`[Stocks API] Raw response sample:`, JSON.stringify(jsonData, null, 2).substring(0, 500));
        
        // Try different possible response structures
        const data = jsonData["Time Series (Daily)"] || 
                    jsonData["Time Series (1min)"] || 
                    jsonData["Time Series (5min)"] ||
                    jsonData["Time Series (Intraday)"] ||
                    jsonData.TimeSeriesDaily;
        
        if (!data) {
            console.error("[Stocks API] No time series data found in response");
            return res.status(500).json({ 
                error: "No time series data found in API response", 
                availableKeys: Object.keys(jsonData),
                suggestion: "The symbol might not be supported or the API response format has changed"
            });
        }

        let open = [];
        let close = [];
        
        console.log(`[Stocks API] Processing ${Object.keys(data).length} data points`);
        
        Object.keys(data).forEach(key => {
            const dayData = data[key];
            if (dayData['1. open'] && dayData['4. close']) {
                open.push({ date: key, value: parseFloat(dayData['1. open']) });
                close.push({ date: key, value: parseFloat(dayData['4. close']) });
            }
        });
        
        console.log(`[Stocks API] Returning ${open.length} open prices and ${close.length} close prices`);
        res.json({ open, close });
    } catch (error) {
        console.error("[Stocks API] Error:", error);
        res.status(500).json({ error: "Failed to fetch stock data: " + error.message });
    }
});

app.get('/api/ask', async (req, res) => {
    const prompt = req.query.q;
    const role = req.query.role || "You are a helpful assistant that summarizes text.";
    const priority = parseInt(req.query.priority) || 5; // Default priority is 5
    
    try {
        const content = await aiQueue.addRequest(prompt, role, priority);
        res.json({ content });
    } catch (error) {
        console.error("Featherless API Error: ", error);
        res.status(500).json({ error: "Failed to get AI response" });
    }
});

app.get('/api/quote', async (req, res) => {
    try {
        const response = await fetch("https://zenquotes.io/api/today");
        const data = await response.json();
        const quote = data[0].q;
        const author = data[0].a;
        res.json({ quote, author });
    } catch (error) {
        console.error("Error fetching quote:", error);
        res.status(500).json({ error: "Failed to fetch quote" });
    }
});

app.get('/api/location', async (req, res) => {
    const address = req.query.address;
    if (!address) {
        return res.status(400).json({ error: 'Address parameter is required' });
    }
    const apiKey = process.env.GEOCODIO_API_KEY;
    const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].location;
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);
            res.json({ lat, lng });
        } else {
            console.log("No results found.");
            res.status(404).json({ error: "Location not found" });
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch location data" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Morning Report app listening at http://localhost:${port}`);
});
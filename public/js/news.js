async function initialize() {
    try {
        const newsData = await loadNews();
        const prompt = `Summarize the following news articles\n\n${JSON.stringify(newsData, null, 2)}, do not start with anything like "Based on the provided news articles". use emojis for headers.`;
        // console.log('Prompt for AI:', prompt);
        const aiResponse = await askAI(prompt, "You are a helpful assistant that summarizes news articles into a concise, engaging, bullet point summary.", 1);
        // console.log('AI Response:', aiResponse);

        await displayNews(aiResponse);
    } catch (error) {
        console.error('Failed to initialize news:', error);
    }
}

async function loadNews() {
    try {
        const response = await fetch('/api/news');
        const newsData = await response.json();
        
        const container = document.getElementById('newsContainer');
        container.innerHTML = '';
        
        return newsData;
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('newsContainer').innerHTML = 'Error loading news';
    }
}

async function askAI(prompt, role, priority = 3) {
    try {
        const response = await fetch(`/api/ask?q=${encodeURIComponent(prompt)}&role=${encodeURIComponent(role)}&priority=${priority}`);
        const result = await response.json();
        return result.content;
    } catch (error) {
        console.error('Error calling AI:', error);
        return 'AI unavailable';
    }
}

function displayNews(aiResponse) {
    if (!aiResponse || aiResponse === 'AI unavailable') {
        document.getElementById('aiSummary').innerHTML = '<h2>AI Summary</h2><p>AI summary unavailable at this time.</p>';
        return;
    }
    document.getElementById('aiSummary').innerHTML = `<h2>AI Summary</h2><div class="markdown-content">${marked.parse(aiResponse)}</div>`;
}

// Load news when page loads and initialize
document.addEventListener('DOMContentLoaded', initialize);
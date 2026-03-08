document.getElementById("quoteOfTheDay").innerHTML = "<h1>Loading...</h1>";
async function getQuote() {
    try {
        const response = await fetch("http://localhost:3000/api/quote");
        const data = await response.json();
        document.getElementById("quoteOfTheDay").innerHTML = `<h2>Quote of the Day</h2><p>"${data.quote}" - ${data.author}</p>`;
    } catch (error) {
        console.error("Error fetching quote:", error);
        document.getElementById("quoteOfTheDay").innerHTML = "<h2>Quote of the Day</h2><p>Error loading quote</p>";
    }
}
document.addEventListener('DOMContentLoaded', getQuote);
// document.getElementById("GoToWhereLong").addEventListener("input", function() {
//     localStorage.setItem("GoToWhereLong", this.value);
// });
// document.getElementById("GoToWhereLat").addEventListener("input", function() {
//     localStorage.setItem("GoToWhereLat", this.value);
// });
// document.getElementById("homeLong").addEventListener("input", function() {
//     localStorage.setItem("homeLong", this.value);
// });
// document.getElementById("homeLat").addEventListener("input", function() {
//     localStorage.setItem("homeLat", this.value);
// });
document.getElementById("commuteEnd").addEventListener("input", function() {
    localStorage.setItem("commuteEnd", this.value);
});
document.getElementById("commuteStart").addEventListener("input", function() {
    localStorage.setItem("commuteStart", this.value);
});
document.getElementById("stockSymbol").addEventListener("input", function() {
    localStorage.setItem("stockSymbol", this.value);
});

document.addEventListener('DOMContentLoaded', function() {
    // document.getElementById("GoToWhereLong").value = localStorage.getItem("GoToWhereLong") || "";
    // document.getElementById("GoToWhereLat").value = localStorage.getItem("GoToWhereLat") || "";
    // document.getElementById("homeLong").value = localStorage.getItem("homeLong") || "";
    // document.getElementById("homeLat").value = localStorage.getItem("homeLat") || "";
    document.getElementById("commuteStart").value = localStorage.getItem("commuteStart") || "";
    document.getElementById("commuteEnd").value = localStorage.getItem("commuteEnd") || "";
    document.getElementById("stockSymbol").value = localStorage.getItem("stockSymbol") || "";
    const paletteSelector = document.getElementById("colorPalette");
    const savedPalette = localStorage.getItem("colorPalette") || "cool";
    if (paletteSelector) {
        paletteSelector.value = savedPalette;
        applyPalette(savedPalette);
        paletteSelector.addEventListener("change", function() {
            localStorage.setItem("colorPalette", this.value);
            applyPalette(this.value);
        });
    }
});

function applyPalette(palette) {
    document.body.classList.remove("cool", "warm");
    if (palette) document.body.classList.add(palette);
}
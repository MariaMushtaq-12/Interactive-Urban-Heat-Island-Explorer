
// ── ANALYSIS TOGGLE ────────────────────────────────────────
document.getElementById("analysis-toggle").addEventListener("click", function() {
    const toggle = document.getElementById("analysis-toggle");
    var resultsPanel = document.querySelector(".results");  
    var icon = toggle.querySelector("i");
    var main = document.querySelector("main");
    
    resultsPanel.classList.toggle("hidden");
    
    
    if(resultsPanel.classList.contains("hidden")){
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");
        main.style.gridTemplateColumns = "280px 1fr";
        toggle.style.right = "0";
    }else{
        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");

        main.style.gridTemplateColumns = "280px 1fr 320px";
         toggle.style.right = "320px";
    }
});

// ── MAP INIT ────────────────────────────────────────
const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/positron",
  center: [13.047, 47.800],
  zoom: 12,
  pitch: 52,
  bearing: -17,
  maxPitch: 85,
  canvasContextAttributes: { antialias: true }
});

map.addControl(new maplibregl.NavigationControl(), "top-right");
map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");


// ── COORDINATE DISPLAY ────────────────────────────────────────
map.on("mousemove", (e) => {
  document.getElementById("coordDisplay").innerHTML =
    `<strong>Coordinates:</strong> Latitude ${e.lngLat.lat.toFixed(4)}°N | Longitude ${e.lngLat.lng.toFixed(4)}°E`;
});



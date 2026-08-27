const aboutButton = document.getElementById("about-button");
const aboutModal = document.getElementById("about-modal");
const aboutClose = document.getElementById("about-close");

aboutButton.addEventListener("click", () => {
    aboutModal.classList.add("active");
});

aboutClose.addEventListener("click", () => {
    aboutModal.classList.remove("active");
});

// Close when clicking outside the popup
aboutModal.addEventListener("click", (event) => {
    if (event.target === aboutModal) {
        aboutModal.classList.remove("active");
    }
});
// ── ANALYSIS TOGGLE ────────────────────────────────────────

document.getElementById("analysis-toggle").addEventListener("click", function () {

    const toggle = document.getElementById("analysis-toggle");
    const resultsPanel = document.querySelector(".results");
    const icon = toggle.querySelector("i");
    const main = document.querySelector("main");

    // Toggle analysis panel
    resultsPanel.classList.toggle("hidden");

    // Toggle main layout
    main.classList.toggle("analysis-hidden");

    // Toggle button position
    toggle.classList.toggle("closed");

    if (resultsPanel.classList.contains("hidden")) {

        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");

    } else {

        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");

    }

    // Resize MapLibre after layout changes
    setTimeout(() => {
        map.resize();
    }, 350);

});
// ── MAP INIT ────────────────────────────────────────
const map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/positron",

    // style: {
    //         version: 8,
    //         sources: {
    //             osm: {
    //                 type: 'raster',
    //                 tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    //                 tileSize: 256,
    //                 attribution: '&copy; OpenStreetMap Contributors',
    //                 maxzoom: 19
    //             },
    //             // Use a different source for terrain and hillshade layers, to improve render quality
    //             terrainSource: {
    //                 type: 'raster-dem',
    //                 url: 'https://tiles.mapterhorn.com/tilejson.json'
    //             },
    //             hillshadeSource: {
    //                 type: 'raster-dem',
    //                 url: 'https://tiles.mapterhorn.com/tilejson.json'
    //             }
    //         },
    //         layers: [
    //             {
    //                 id: 'osm',
    //                 type: 'raster',
    //                 source: 'osm'
    //             },
    //             {
    //                 id: 'hills',
    //                 type: 'hillshade',
    //                 source: 'hillshadeSource',
    //                 layout: {visibility: 'visible'},
    //                 paint: {'hillshade-shadow-color': '#473B24'}
    //             }
    //         ],
    //         terrain: {
    //             source: 'terrainSource',
    //             exaggeration: 1
    //         },
    //         sky: {}
    //     },
    center: [13.047, 47.800],
    zoom: 14,
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


// ── DATA ──────────────────────────────────────── 
// ── VECTOR DATA (Parks · Buildings · Trees · Roads) ────────────────────────

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const emptyFC = { type: "FeatureCollection", features: [] };
// south, west, north, east
const SALZBURG_BBOX = "47.770,12.997,47.830,13.097";
const vectorDataCache = {
    parks: null,
    trees: null,
    roads: null
};
function bboxString(bounds) {
    return [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(",");
}

// Converts raw Overpass JSON (queried with "out geom;") into GeoJSON.
function overpassToGeoJSON(osmData, asPolygon) {
    const features = [];
    (osmData.elements || []).forEach((el) => {
        if (el.type === "node") {
            features.push({
                type: "Feature",
                properties: el.tags || {},
                geometry: { type: "Point", coordinates: [el.lon, el.lat] }
            });
        } else if (el.type === "way" && el.geometry && el.geometry.length > 1) {
            const coords = el.geometry.map((pt) => [pt.lon, pt.lat]);
            const first = coords[0], last = coords[coords.length - 1];
            const isClosed = coords.length > 2 && first[0] === last[0] && first[1] === last[1];
            const geometry = asPolygon && isClosed
                ? { type: "Polygon", coordinates: [coords] }
                : { type: "LineString", coordinates: coords };
            features.push({ type: "Feature", properties: el.tags || {}, geometry });
        }
    });
    return { type: "FeatureCollection", features };
}

function debounce(fn, delay) {
    let timer;
    return function () {
        clearTimeout(timer);
        const args = arguments, ctx = this;
        timer = setTimeout(() => fn.apply(ctx, args), delay);
    };
}

const vectorLayers = {
    parks: {
        // minzoom: 9,
        checkbox: document.getElementById("layer-parks"),
        asPolygon: true,
        layers: ["vec-parks-fill", "vec-parks-line"],
        // controller: null,
        // query: (bbox) =>
        //     `[out:json][timeout:25];(way["leisure"="park"](${bbox});way["landuse"="forest"](${bbox});way["landuse"="grass"](${bbox});way["natural"="wood"](${bbox}););out geom;`
        query: (bbox) =>
            `[out:json][timeout:25];
            (
                way["leisure"="park"](${bbox});
                way["landuse"="forest"](${bbox});
                way["landuse"="grass"](${bbox});
                way["natural"="wood"](${bbox});
            );
            out geom;`
    },
    trees: {
        // minzoom: 14,
        checkbox: document.getElementById("layer-trees"),
        asPolygon: false,
        layers: ["vec-trees-circle"],
        // controller: null,
        // query: (bbox) => `[out:json][timeout:25];node["natural"="tree"](${bbox});out;`
        query: (bbox) =>
            `[out:json][timeout:25];
            node["natural"="tree"](${bbox});
            out;`
    },
    roads: {
        // minzoom: 14,
        checkbox: document.getElementById("layer-roads"),
        asPolygon: false,
        layers: ["vec-roads-line"],
        // controller: null,
        // query: (bbox) =>
        //     `[out:json][timeout:25];way["highway"~"^(primary|secondary|tertiary|residential)$"](${bbox});out geom;`
        query: (bbox) =>
            `[out:json][timeout:25];
            way["highway"~"^(primary|secondary|tertiary|residential)$"](${bbox});
            out geom;`
    }
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function preloadVectorLayer(key) {

    const cfg = vectorLayers[key];
    const query = cfg.query(SALZBURG_BBOX);

    const MAX_RETRIES = 4;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {

        try {

            const response = await fetch(
                OVERPASS_URL,
                {
                    method: "POST",
                    body: "data=" + encodeURIComponent(query)
                }
            );

            if (response.status === 429) {

                if (attempt === MAX_RETRIES) {
                    throw new Error(
                        `Overpass rate limit reached for ${key}`
                    );
                }

                // 10s → 20s → 40s → 80s
                const waitTime = 10000 * Math.pow(2, attempt);

                console.warn(
                    `Overpass 429 for ${key}. ` +
                    `Retry ${attempt + 1}/${MAX_RETRIES} in ${waitTime / 1000}s`
                );

                await sleep(waitTime);

                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const osmData = await response.json();

            const geojson = overpassToGeoJSON(
                osmData,
                cfg.asPolygon
            );

            // SUCCESS: save in cache
            vectorDataCache[key] = geojson;

            console.log(
                `✓ ${key} loaded:`,
                geojson.features.length,
                "features"
            );

            return geojson;

        } catch (error) {

            // Network errors can also be retried
            if (attempt === MAX_RETRIES) {

                console.error(
                    `✗ Failed to load ${key}:`,
                    error
                );

                // Important: don't overwrite existing cached data
                if (!vectorDataCache[key]) {
                    vectorDataCache[key] = emptyFC;
                }

                return vectorDataCache[key];
            }

            const waitTime = 10000 * Math.pow(2, attempt);

            console.warn(
                `${key} request failed. ` +
                `Retrying in ${waitTime / 1000}s...`
            );

            await sleep(waitTime);
        }
    }
}

async function preloadAllVectorLayers() {

    console.log("Loading Salzburg vector data...");

    await preloadVectorLayer("parks");

    await sleep(3000);

    await preloadVectorLayer("trees");

    await sleep(3000);

    await preloadVectorLayer("roads");

    console.log("✓ All Salzburg vector data loading finished.");
}


function toggleVectorLayer(key) {

    const cfg = vectorLayers[key];

    const source = map.getSource("vec-" + key);

    if (!source) return;


    if (cfg.checkbox.checked) {

        // Show preloaded data
        source.setData(
            vectorDataCache[key] || emptyFC
        );

    } else {

        // Hide data
        source.setData(emptyFC);

    }

}



// Shared by every layer below that needs to sit under map labels.
function getFirstLabelLayerId() {
    const layers = map.getStyle().layers;
    for (const layer of layers) {
        if (layer.type === "symbol" && layer.layout?.["text-field"]) {
            return layer.id;
        }
    }
    return undefined;
}

// ── LAND SURFACE TEMPERATURE RASTER ─────────────────────────────────────
const LST_RASTER_URL = "data/fa3f853496a7c1e8502bafd6204b6f8c-bd31bf69ef8a9f7b1b06be66c28271db_getPixels.png";
const LST_RASTER_BOUNDS = [
    [12.997, 47.830], // top-left      [lng, lat]
    [13.097, 47.830], // top-right
    [13.097, 47.770], // bottom-right
    [12.997, 47.770]  // bottom-left
];

function addLstRasterLayer(labelLayerId) {
    if (!map.getSource("lst-raster")) {
        map.addSource("lst-raster", {
            type: "image",
            url: LST_RASTER_URL,
            coordinates: LST_RASTER_BOUNDS
        });
    }
    if (!map.getLayer("lst-raster-layer")) {
        map.addLayer(
            {
                id: "lst-raster-layer",
                type: "raster",
                source: "lst-raster",
                paint: {
                    "raster-opacity": 0.5, // matches the sidebar slider's default (70)
                    "raster-fade-duration": 0
                }
            },
            labelLayerId
        );
    }
}


// ── 3D BUILDINGS (OpenFreeMap planet tiles) ─────────────────────────────

// Pre-tiled vector data — renders instantly with no per-viewport fetch,
function addBuildingLayers(labelLayerId) {
    if (!map.getSource("ofm-tiles")) {
        map.addSource("ofm-tiles", {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet"
        });
    }

    if (!map.getLayer("3d-buildings")) {
        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'ofm-tiles',
                'source-layer': 'building',
                'type': 'fill-extrusion',
                'minzoom': 15,
                'filter': ['!=', ['get', 'hide_3d'], true],
                'paint': {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'render_height'], 0, 'lightgray', 50, 'royalblue', 100, 'lightblue'
                    ],
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        16,
                        ['get', 'render_height']
                    ],
                    'fill-extrusion-base': ['case',
                        ['>=', ['get', 'zoom'], 16],
                        ['get', 'render_min_height'], 0
                    ]
                }
            },
            labelLayerId
        );
    }

    if (!map.getLayer("building-outline")) {
        map.addLayer(
            {
                id: "building-outline",
                source: "ofm-tiles",
                "source-layer": "building",
                type: "line",
                minzoom: 13,
                paint: {
                    "line-color": "rgba(58,140,230,0.25)",
                    "line-width": 0.8,
                    "line-opacity": 0.7
                }
            },
            labelLayerId
        );
    }
}

map.on("load", () => {

    // Computed once and threaded through everything below, so every layer
    // this app adds sits under text labels instead of covering them.
    const labelLayerId = getFirstLabelLayerId();

    // Heat map — bottom of the stack so vector layers stay legible on top
    // of it. Visible by default (checkbox starts checked).
    addLstRasterLayer(labelLayerId);
    // Parks — visible by default (checkbox starts checked)
    map.addSource("vec-parks", { type: "geojson", data: emptyFC });
    map.addLayer({
        id: "vec-parks-fill", type: "fill", source: "vec-parks",
        paint: { "fill-color": "#43a047", "fill-opacity": 0.35 }
    }, labelLayerId);
    map.addLayer({
        id: "vec-parks-line", type: "line", source: "vec-parks",
        paint: { "line-color": "#2e7d32", "line-width": 1 }
    }, labelLayerId);

    // Buildings — real OSM data from OpenFreeMap's planet tiles, visible by
    // default (checkbox starts checked)
    addBuildingLayers(labelLayerId);

    // Trees — hidden by default (checkbox starts unchecked)
    map.addSource("vec-trees", { type: "geojson", data: emptyFC });
    map.addLayer({
        id: "vec-trees-circle", type: "circle", source: "vec-trees",
        layout: { visibility: "none" },
        paint: {
            "circle-radius": 3,
            "circle-color": "#2e7d32",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff"
        }
    }, labelLayerId);

    // Roads — hidden by default (checkbox starts unchecked)
    map.addSource("vec-roads", { type: "geojson", data: emptyFC });
    map.addLayer({
        id: "vec-roads-line", type: "line", source: "vec-roads",
        layout: { visibility: "none" },
        paint: { "line-color": "#90a4ae", "line-width": 1.5 }
    }, labelLayerId);

    preloadAllVectorLayers();
});


Object.keys(vectorLayers).forEach((key) => {

    const cfg = vectorLayers[key];

    if (!cfg.checkbox) return;

    cfg.checkbox.addEventListener("change", () => {

        const isVisible = cfg.checkbox.checked
            ? "visible"
            : "none";

        // Show/hide the MapLibre layer itself
        cfg.layers.forEach((layerId) => {

            if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                    layerId,
                    "visibility",
                    isVisible
                );
            }

        });


        // Put cached data into source when checked
        const source = map.getSource("vec-" + key);

        if (source) {

            if (cfg.checkbox.checked) {

                console.log(
                    `Showing ${key}:`,
                    vectorDataCache[key]?.features?.length || 0,
                    "features"
                );

                source.setData(
                    vectorDataCache[key] || emptyFC
                );

            } else {

                source.setData(emptyFC);

            }

        }

    });

});
// Buildings toggle — just visibility, no fetch (tile source loads on its own)
const buildingsCheckbox = document.getElementById("layer-buildings");
if (buildingsCheckbox) {
    buildingsCheckbox.addEventListener("change", () => {
        const visibility = buildingsCheckbox.checked ? "visible" : "none";
        ["3d-buildings", "building-outline"].forEach((id) => {
            if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
        });
    });
}

// Heat Map toggle — just visibility, the image source loads on its own
const heatmapCheckbox = document.getElementById("layer-heatmap");
if (heatmapCheckbox) {
    heatmapCheckbox.addEventListener("change", () => {
        if (map.getLayer("lst-raster-layer")) {
            map.setLayoutProperty("lst-raster-layer", "visibility", heatmapCheckbox.checked ? "visible" : "none");
        }
    });
}

// Raster Opacity slider — live-updates the heat map's transparency
const opacitySlider = document.getElementById("rasterOpacity");
if (opacitySlider) {
    opacitySlider.addEventListener("input", () => {
        if (map.getLayer("lst-raster-layer")) {
            map.setPaintProperty("lst-raster-layer", "raster-opacity", opacitySlider.value / 100);
        }
    });
}


// ── SPATIAL COMPUTATION ────────────────────────────────────────

proj4.defs(
    "EPSG:32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs"
);
// const LST_TIFF_URL = "data/f85645dee680dd09884d9bcd9f7a46b9-62b6d7dd56c73548ec5dee50bb79804b_getPixels.tiff";
const LST_TIFF_URL = "data/geotiff_lst_single.tiff";
let selectedPoint = null;   // { lng, lat } — set by clicking the map
let selectedRadius = 100;   // meters — set by the buffer radius buttons
let selectedMarker = null;
let analysisController = null;
let tiffImagePromise = null; // cached so the file is only fetched/parsed once

// ---- point + radius selection --------------------------------------

map.on("click", (e) => {
    selectedPoint = { lng: e.lngLat.lng, lat: e.lngLat.lat };

    if (selectedMarker) selectedMarker.remove();
    selectedMarker = new maplibregl.Marker({ color: "#1565c0" }).setLngLat(e.lngLat).addTo(map);

    drawAnalysisBuffer(currentBufferPolygon());
});

document.querySelectorAll(".buffer-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".buffer-buttons button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedRadius = parseInt(btn.dataset.radius, 10);
        if (selectedPoint) drawAnalysisBuffer(currentBufferPolygon());
    });
});

function currentBufferPolygon() {
    return turf.circle([selectedPoint.lng, selectedPoint.lat], selectedRadius / 1000, {
        units: "kilometers",
        steps: 64
    });
}

function drawAnalysisBuffer(bufferPolygon) {
    if (!map.getSource("analysis-buffer")) {
        map.addSource("analysis-buffer", { type: "geojson", data: emptyFC });
        map.addLayer({
            id: "analysis-buffer-fill", type: "fill", source: "analysis-buffer",
            paint: { "fill-color": "#1565c0", "fill-opacity": 0.12 }
        });
        map.addLayer({
            id: "analysis-buffer-line", type: "line", source: "analysis-buffer",
            paint: { "line-color": "#1565c0", "line-width": 2, "line-dasharray": [2, 1.5] }
        });
    }
    map.getSource("analysis-buffer").setData(bufferPolygon);
}

// ---- Overpass: parks + buildings scoped tightly around the click ---- 
function overpassBboxAround(lng, lat, radiusMeters) {
    const dLat = radiusMeters / 111320;
    const dLng = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
    return [lat - dLat, lng - dLng, lat + dLat, lng + dLng].join(",");
}

function fetchOverpassGeoJSON(query, asPolygon, signal) {
    return fetch(OVERPASS_URL, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        signal
    })
        .then((res) => res.json())
        .then((data) => overpassToGeoJSON(data, asPolygon));
}

function safeIntersects(feature, polygon) {
    try {
        return turf.booleanIntersects(feature, polygon);
    } catch (e) {
        return false; // malformed/self-intersecting OSM geometry — skip rather than crash
    }
}

function nearestGreenSpaceDistance(pointCoords, parkFeatures) {
    if (!parkFeatures.length) return null;
    const pt = turf.point(pointCoords);
    let min = Infinity;
    parkFeatures.forEach((park) => {
        try {
            if (turf.booleanPointInPolygon(pt, park)) {
                min = 0;
                return;
            }
            const boundary = turf.polygonToLine(park);
            const d = turf.pointToLineDistance(pt, boundary, { units: "meters" });
            if (d < min) min = d;
        } catch (e) {
            /* skip malformed geometry */
        }
    });
    return Number.isFinite(min) ? Math.round(min) : null;
}
// ---- Coverage: how much of the buffer is actually green vs. built ----

function safeIntersectionArea(feature, bufferPolygon) {
    try {
        const clipped = turf.intersect(turf.featureCollection([feature, bufferPolygon]));
        return clipped ? turf.area(clipped) : 0;
    } catch (e) {
        return 0; // malformed geometry — skip rather than crash
    }
}

function greenCoveragePercent(bufferPolygon, bufferArea, parkFeatures) {
    if (bufferArea <= 0 || !parkFeatures.length) return 0;
    let merged = null;
    parkFeatures.forEach((park) => {
        try {
            merged = merged ? turf.union(turf.featureCollection([merged, park])) : park;
        } catch (e) {
            /* skip malformed geometry, keep merging the rest */
        }
    });
    if (!merged) return 0;
    return Math.min(100, (safeIntersectionArea(merged, bufferPolygon) / bufferArea) * 100);
}

function builtCoveragePercent(bufferPolygon, bufferArea, buildingFeatures) {
    if (bufferArea <= 0 || !buildingFeatures.length) return 0;
    const builtArea = buildingFeatures.reduce((sum, f) => sum + safeIntersectionArea(f, bufferPolygon), 0);
    return Math.min(100, (builtArea / bufferArea) * 100);
}

// ---- GeoTIFF: real LST values, sampled + averaged over the buffer ---- 
function getTiffImage() {
    if (!tiffImagePromise) {
        tiffImagePromise = GeoTIFF.fromUrl(LST_TIFF_URL)
            .then((tiff) => tiff.getImage())
            .then((image) => {
                try {
                    const keys = image.getGeoKeys ? image.getGeoKeys() : null;
                    const epsg = keys && (keys.ProjectedCSTypeGeoKey || keys.GeographicTypeGeoKey);
                    if (epsg && epsg !== 4326) {
                        console.warn(
                            `LST TIFF appears to use EPSG:${epsg}, not 4326 — sample coordinates will be ` +
                            `misaligned. Reproject first, e.g.: gdalwarp -t_srs EPSG:4326 in.tif out.tif`
                        );
                    }
                    console.log("LST TIFF geo keys:", keys);
                } catch (e) {
                    /* geo keys unavailable — skip the check */
                }
                return image;
            });

    }
    return tiffImagePromise;

}
function projectBufferToRasterCRS(bufferPolygon) {

    const projectedCoordinates = bufferPolygon.geometry.coordinates.map(
        ring => {

            return ring.map(coordinate => {

                const [x, y] = proj4(
                    "EPSG:4326",
                    "EPSG:32633",
                    coordinate
                );

                return [x, y];

            });

        }
    );

    return {
        type: "Feature",
        properties: {
            ...bufferPolygon.properties
        },
        geometry: {
            type: "Polygon",
            coordinates: projectedCoordinates
        }
    };
}

async function sampleLstAverage(bufferPolygon, tiffImage) {
    const [minX, minY, maxX, maxY] = tiffImage.getBoundingBox();
    const imgW = tiffImage.getWidth();
    const imgH = tiffImage.getHeight();

    const [bMinX, bMinY, bMaxX, bMaxY] = turf.bbox(bufferPolygon);

    const toCol = (lng) => ((lng - minX) / (maxX - minX)) * imgW;
    const toRow = (lat) => ((maxY - lat) / (maxY - minY)) * imgH; // row 0 = top = maxY

    const left = Math.max(0, Math.floor(toCol(bMinX)));
    const right = Math.min(imgW, Math.ceil(toCol(bMaxX)));
    const top = Math.max(0, Math.floor(toRow(bMaxY)));
    const bottom = Math.min(imgH, Math.ceil(toRow(bMinY)));

    if (right <= left || bottom <= top) {
        return { average: null, sampleCount: 0 }; // buffer falls outside the raster entirely
    }

    const outW = Math.max(4, Math.min(64, right - left));
    const outH = Math.max(4, Math.min(64, bottom - top));

    const rasters = await tiffImage.readRasters({
        window: [left, top, right, bottom],
        width: outW,
        height: outH,
        resampleMethod: "bilinear"
    });
    const band = rasters[0];

    let sum = 0, count = 0;
    for (let row = 0; row < outH; row++) {
        for (let col = 0; col < outW; col++) {
            const pixelCol = left + ((col + 0.5) / outW) * (right - left);
            const pixelRow = top + ((row + 0.5) / outH) * (bottom - top);
            const lng = minX + (pixelCol / imgW) * (maxX - minX);
            const lat = maxY - (pixelRow / imgH) * (maxY - minY);
            const val = band[row * outW + col];
            if (Number.isFinite(val) && turf.booleanPointInPolygon([lng, lat], bufferPolygon)) {
                sum += val;
                count++;
            }
        }
    }

    return count > 0 ? { average: sum / count, sampleCount: count } : { average: null, sampleCount: 0 };
}

// ---- Heat risk — a simple, adjustable heuristic, not a scientific ----
function heatRiskLabel(avgC) {
    if (avgC == null || !Number.isFinite(avgC)) return "Unknown";
    if (avgC < 23) return "No Thermal Stress";
    if (avgC < 29) return "Slight Heat Stress";
    if (avgC < 35) return "Moderate Heat Stress";
    if (avgC < 38) return "Strong Heat Stress";
    return "Severe Heat Stress";
}


// ---- Run Analysis -------------------------------------------------

async function runAnalysis() {
    if (!selectedPoint) {
        flashNeedsPoint();
        return;
    }

    setAnalysisLoading(true);

    try {
        const bufferPolygon = currentBufferPolygon();
        drawAnalysisBuffer(bufferPolygon);

        // Wider than the buffer so "nearest" can look just past its edge;
        // capped so a 1000 m buffer doesn't trigger a huge query.
        const searchRadius = Math.min(3000, selectedRadius * 3);
        const bbox = overpassBboxAround(selectedPoint.lng, selectedPoint.lat, searchRadius);

        if (analysisController) analysisController.abort();
        analysisController = new AbortController();
        const { signal } = analysisController;

        const [parksResult, tiffResult] = await Promise.allSettled([
            fetchOverpassGeoJSON(vectorLayers.parks.query(bbox), true, signal),
            getTiffImage()
        ]);
        console.log("Parks result:", parksResult, "LST result:", tiffResult);

        const parksData = parksResult.status === "fulfilled" ? parksResult.value : emptyFC;
        if (parksResult.status === "rejected") console.warn("Parks lookup failed:", parksResult.reason);

        const parksInBuffer = parksData.features.filter((f) => safeIntersects(f, bufferPolygon));
        const buildingsInBuffer = queryBuildingsInBuffer(bufferPolygon);
        const nearestDistance = nearestGreenSpaceDistance([selectedPoint.lng, selectedPoint.lat], parksData.features);
        const projectedBuffer = projectBufferToRasterCRS(bufferPolygon);

        let avgLst = null;
        if (tiffResult.status === "fulfilled") {
            console.log("LST sample value:", tiffResult.value);
            console.log("Original buffer CRS: EPSG:4326", bufferPolygon);
            console.log("Projected buffer CRS: EPSG:32633", projectedBuffer);

            const lstStats = await sampleLstAverage(
                projectedBuffer,
                tiffResult.value
            );

            avgLst = lstStats.average;

            console.log(
                "LST sample stats:",
                lstStats,
                "Average LST:",
                avgLst
            );
            const image = tiffResult.value;

            console.log("GeoTIFF file directory:", image.fileDirectory);
            console.log("GeoTIFF GDAL metadata:", image.getGDALMetadata());
            console.log("Number of bands:", image.getSamplesPerPixel());


        } else {
            console.warn("LST raster unavailable:", tiffResult.reason);
        }



        const bufferArea = turf.area(bufferPolygon);
        const greenPct = greenCoveragePercent(bufferPolygon, bufferArea, parksInBuffer);
        const builtPct = builtCoveragePercent(bufferPolygon, bufferArea, buildingsInBuffer);

        updateResultsPanel({
            parksCount: parksInBuffer.length,
            buildingsCount: buildingsInBuffer.length,
            nearestDistance,
            avgLst,
            greenPct,
            builtPct,
            radius: selectedRadius
        });

    } catch (err) {
        if (err.name !== "AbortError") console.error("Analysis failed:", err);
    } finally {
        setAnalysisLoading(false);
    }
}

function queryBuildingsInBuffer(bufferPolygon) {
    if (!map.getSource("ofm-tiles")) return [];

    const features = map.querySourceFeatures("ofm-tiles", {
        sourceLayer: "building",
        filter: ["!=", ["get", "hide_3d"], true]
    });

    const seenIds = new Set();
    const result = [];

    features.forEach((f) => {
        if (f.id != null) {
            if (seenIds.has(f.id)) return; // same building returned twice across a tile boundary
            seenIds.add(f.id);
        }
        if (safeIntersects(f, bufferPolygon)) result.push(f);
        // console.log("Building ID:", f.id, "intersects buffer:", safeIntersects(f, bufferPolygon));
    });
    console.log("Total buildings in buffer:", result.length);
    return result;
}

document.querySelector(".analysis-btn").addEventListener("click", runAnalysis);


// ---- UI plumbing ------------------------------------------------------

function setAnalysisLoading(isLoading) {
    const btn = document.querySelector(".analysis-btn");
    if (!btn) return;
    btn.disabled = isLoading;
    const icon = btn.querySelector("i");
    if (icon) {
        icon.classList.toggle("fa-play", !isLoading);
        icon.classList.toggle("fa-spinner", isLoading);
        icon.classList.toggle("fa-spin", isLoading);
    }
}

function flashNeedsPoint() {
    const btn = document.querySelector(".analysis-btn");
    if (!btn) return;
    const original = btn.innerHTML;
    btn.classList.add("needs-point");
    btn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Click the map first';
    setTimeout(() => {
        btn.classList.remove("needs-point");
        btn.innerHTML = original;
    }, 1600);
}

function buildAnalysisSummary({ avgLst, riskLabel, greenPct, builtPct, parksCount, nearestDistance, radius }) {
    if (avgLst == null) {
        return "Temperature data isn't available for this point — check that the LST raster covers this area.";
    }
    const greenDesc = greenPct >= 30 ? "strong" : greenPct >= 15 ? "moderate" : "limited";
    const builtDesc = builtPct >= 40 ? "high" : builtPct >= 20 ? "moderate" : "low";
    const nearestDesc = nearestDistance == null
        ? "no mapped green space nearby"
        : nearestDistance === 0
            ? "sitting inside a green space"
            : `the nearest green space ${nearestDistance} m away`;

    return `This ${radius} m area shows ${riskLabel.toLowerCase()} heat risk at ${avgLst.toFixed(1)}°C, with ` +
        `${greenDesc} green coverage (${greenPct.toFixed(0)}%) and ${builtDesc} built coverage (${builtPct.toFixed(0)}%). ` +
        `${parksCount} park${parksCount === 1 ? "" : "s"} mapped in range, with ${nearestDesc}.`;
}

function updateResultsPanel({ parksCount, buildingsCount, nearestDistance, avgLst, greenPct, builtPct, radius }) {
    document.getElementById("resultTemp").textContent = avgLst != null ? `${avgLst.toFixed(1)} °C` : "No data";
    document.getElementById("resultParks").textContent = parksCount;
    document.getElementById("resultBuildings").textContent = buildingsCount;
    document.getElementById("resultNearest").textContent = nearestDistance != null ? `${nearestDistance} m` : "—";
    const risk = heatRiskLabel(avgLst);
    document.getElementById("resultRisk").textContent = risk;
    document.getElementById("resultGreenCoverage").textContent = `${greenPct.toFixed(0)}%`;
    document.getElementById("resultBuiltCoverage").textContent = `${builtPct.toFixed(0)}%`;
    document.getElementById("analysisSummary").textContent = buildAnalysisSummary({
        avgLst, riskLabel: risk, greenPct, builtPct, parksCount, nearestDistance, radius
    });
}
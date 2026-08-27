# 🌡️ Urban Heat Island Explorer

An interactive **WebGIS application** for exploring the Urban Heat Island (UHI) effect in **Salzburg, Austria**.

The application combines raster and vector geospatial data and allows users to perform interactive spatial analysis by clicking on the map.

---

## 🗺️ Project Overview

Urban areas can experience higher surface temperatures than surrounding green areas due to buildings, roads, and reduced vegetation.

This WebGIS application allows users to explore this relationship by combining:

- 🌡️ Land Surface Temperature (LST)
- 🌳 Parks and green spaces
- 🌲 Individual trees
- 🛣️ Roads
- 🏢 Buildings
- 📍 Interactive spatial analysis

---

## ✨ Main Features

### Interactive Map
Users can navigate, zoom, and interact with the map of Salzburg.

### Raster Layer
Land Surface Temperature (LST) data is displayed as a raster layer generated from satellite data.

### Vector Layers
The application provides optional vector layers for:

- Parks and green spaces
- Trees
- Roads
- Buildings

### Interactive Spatial Analysis
Users can:

1. Click a location on the map.
2. Select an analysis radius.
3. Create a buffer around the selected location.
4. Calculate spatial information within the buffer.

The analysis includes:

- Number of parks/green spaces
- Number of buildings
- Distance to the nearest green space
- Average Land Surface Temperature
- Green space coverage
- Built-up coverage

---

## 🧮 Spatial Analysis

The spatial computations are performed directly in the browser using JavaScript.

The application creates a buffer around the selected point and performs spatial operations such as:

- Point and polygon proximity analysis
- Feature intersection
- Distance calculation
- Area calculation
- Raster value sampling

---

## 🛠️ Technologies Used

- **HTML** – Application structure
- **CSS** – User interface and styling
- **JavaScript** – Application logic and spatial analysis
- **MapLibre GL JS** – Interactive WebGIS map and layer visualization
- **Turf.js** – Client-side spatial analysis
- **GeoTIFF.js** – Reading and sampling raster data
- **Proj4js** – Coordinate transformation
- **OpenStreetMap / Overpass API** – Vector geospatial data

---

## 📂 Project Structure

```text
Urban-Heat-Island-Explorer/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
├── data/
│   ├── lst-salzburg.tif
│   └── ...
│
└── assets/
    └── ...
```  
## 🚀 How to Run

- Download or clone this project.
- Open the project folder in Visual Studio Code.
- Start a local server, for example using Live Server.
- Open index.html in the browser.
- Click a location on the map.
- Select an analysis radius.
- Run the spatial analysis.

A local server is recommended because the application loads external and geospatial data files.


## 🎯 Project Purpose

The purpose of this project is to demonstrate how a modern WebGIS application can combine raster data, vector data, interactive visualization, and client-side spatial computation in a web browser.

## ⚠️ Notes

Public Overpass API services may occasionally return rate-limiting errors such as 429 Too Many Requests. The application uses controlled loading and caching to reduce repeated API requests.

##  👤 Author

Maria Mushtaq

## 📄 License

This project is developed for educational and academic purposes.
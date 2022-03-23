const urlGoogleSheetAirports =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrlVbYsVAROf6X9fqj8E_2oNqUueDDwJtgG9eBBFrQBDiMAir1CbZ3UOs24kaN13CLsIHRWrQ3pv-Q/pub?gid=0&single=true&output=csv";

let geojsonAirports = {
  type: "FeatureCollection",
  name: "airports",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features: [],
};

function getAirportData() {
  Papa.parse(urlGoogleSheetAirports, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      sheetDataSchools = results.data;

      sheetDataSchools.forEach((i) => {
        let newAirport = {
          type: "Feature",
          properties: {
            airport_id: i["Airport ID"],
            airport_name: i["Name"],
            airport_city: i["City"],
            airport_country: i["Country"],
            airport_code: i["IATA Code"],
            destination_id_1: i["Destination ID 1"],
            destination_id_2: i["Destination ID 2"],
            destination_id_3: i["Destination ID 3"],
            destination_id_4: i["Destination ID 4"],
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(i["Longitude"]),
              parseFloat(i["Latitude"]),
            ],
          },
        };

        geojsonAirports["features"].push(newAirport);
      });

      drawMap();
    },
  });
}

getAirportData();

function drawMap() {
  let startLat = 48.52;
  let startLong = 13.83;
  let startZoom = 4;

  let map = L.map("map", {
    fullScreenControl: false,
    zoomSnap: 1,
    minZoom: 4,
    // maxZoom: 10,
    // maxBounds: mapBounds,
  }).setView([startLat, startLong], startZoom);

  const fsControl = L.control.fullscreen();
  map.addControl(fsControl);

  L.easyButton(
    '<span class="star" style="padding:0px;">&starf;</span>',

    function (btn, map) {
      map.setView([startLat, startLong], startZoom);
    },
    "Default View"
  ).addTo(map);

  let tiles_OSM = L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
    {
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox/streets-v11",
      tileSize: 512,
      zoomOffset: -1,
    }
  ).addTo(map);

  let iconAirports = L.icon({
    iconUrl: "images/airport_icon_1.png",
    iconSize: [30, 30],
    popupAnchor: [0, -15],
  });

  let styleRouteLines = {
    color: "#000000",
    fillColor: "#ffffff",
    fillOpacity: 0,
    opacity: 1,
    weight: 1,
    dashArray: "4 4",
  };

  let layerGroupDestinations = L.layerGroup();
  let listDestinationIds = [];

  function drawAvailableRoutes(e) {
    // clear the previously generated route lines
    layerGroupDestinations.clearLayers();
    listDestinationIds.length = 0; // clear previous list of destinations

    let startPoint;
    let endPoint;
    let greatCircle;

    listDestinationIds.push(e.target.feature.properties["destination_id_1"]);
    listDestinationIds.push(e.target.feature.properties["destination_id_2"]);
    listDestinationIds.push(e.target.feature.properties["destination_id_3"]);
    listDestinationIds.push(e.target.feature.properties["destination_id_4"]);

    let allAirportFeatures = geojsonAirports.features;

    let filteredFeatures = allAirportFeatures.filter((feature) =>
      listDestinationIds.includes(feature.properties["airport_id"])
    );

    startPoint = turf.point(e.target.feature.geometry.coordinates);

    filteredFeatures.forEach((feature) => {
      endPoint = turf.point(feature.geometry.coordinates);
      greatCircle = turf.greatCircle(startPoint, endPoint);

      L.geoJSON(greatCircle, {
        style: styleRouteLines,
      }).addTo(layerGroupDestinations);
    });

    layerGroupDestinations.addTo(map);
  }

  function onEachFeatureAirports(feature, layer) {
    let airportName = feature.properties.airport_name;
    let airportCity = feature.properties.airport_city;
    let airportCountry = feature.properties.airport_country;
    let airportCode = feature.properties.airport_code;

    let popupContent = '<p class="popup-title">' + airportName + "</p>";

    if (airportCode) {
      popupContent += '<p class="popup-subtitle">(' + airportCode + ")</p>";
    }

    if (airportCity && airportCountry) {
      popupContent +=
        '<p class="popup-text">' + airportCity + ", " + airportCountry + "</p>";
    }

    layer.bindPopup(popupContent, {});

    layer.on({
      click: drawAvailableRoutes,
    });
  }

  layerAirports = L.geoJson(geojsonAirports, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: iconAirports });
    },
    onEachFeature: onEachFeatureAirports,
  }).addTo(map);

  var center = [11.09957366, 60.19393548];
  let radius1 = 1000;
  let radius2 = 2000;
  let radius3 = 3000;

  let options = {
    steps: 200,
    units: "kilometers",
    properties: { foo: "bar" },
  };

  let circle1 = turf.circle(center, radius1, options);
  let circle2 = turf.circle(center, radius2, options);
  let circle3 = turf.circle(center, radius3, options);

  let layerRange1 = L.geoJSON(circle1, {
    style: { fillOpacity: 0, color: "#000000", weight: 1 },
  }).addTo(map);

  let layerRange2 = L.geoJSON(circle2, {
    style: { fillOpacity: 0, color: "#000000", weight: 1 },
  }).addTo(map);

  let layerRange3 = L.geoJSON(circle3, {
    style: { fillOpacity: 0, color: "#000000", weight: 1 },
  }).addTo(map);

  let baseLayers = {};

  let overlays = {
    Airports: layerAirports,
    "Range 1000km": layerRange1,
    "Range 2000km": layerRange2,
    "Range 3000km": layerRange3,
  };

  L.control
    .layers(baseLayers, overlays, { collapsed: false, position: "topright" })
    .addTo(map);
}

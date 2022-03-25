// airport details
let airportDepartureName = "Siegerland";
let airportDepartureCode = "EDGS";
let airportDestinationName = "Berlin";
let airportDestinationCode = "EDAZ";
let airplaneModel = "Cessna C152";
let airplaneHourlyRate = 286; // EUR
let airplaneSpeedKt = 109; //kt
let airplaneSpeedKmH = airplaneSpeedKt * 1.852; // km.h

let pilotName = "Robert Anders";
let pilotHourlyRate = 100; // EUR
let routeDistance = 300; // kilometers
let routeDuration = 100; // minutes

// select containers
const spanAirportDepartureName = document.getElementById("airport-dep");
const spanairportDestinationName = document.getElementById("airport-dest");
const spanAirportDepartureCode = document.getElementById("airport-dep-code");
const spanAirportDestinationCode = document.getElementById("airport-dest-code");
const spanAirplaneModel = document.getElementById("airplane-model");
const spanPilotName = document.getElementById("pilot-name");
const spanRouteDistance = document.getElementById("route-distance");
const spanRouteDuration = document.getElementById("route-duration");
const spanAirplaneRate = document.getElementById("airplane-rate");
const spanPilotRate = document.getElementById("pilot-rate");
const spanTotalRate = document.getElementById("total-rate");

// assign values
spanAirportDepartureName.innerText = airportDepartureName;
spanAirportDepartureCode.innerText = "(" + airportDepartureCode + ")";
spanairportDestinationName.innerText = airportDestinationName;
spanAirportDestinationCode.innerText = "(" + airportDestinationCode + ")";
spanAirplaneModel.innerText = airplaneModel;
spanPilotName.innerText = pilotName;
spanRouteDistance.innerText = routeDistance + " km";
spanRouteDuration.innerText = routeDuration + " minutes";
spanAirplaneRate.innerText = airplaneHourlyRate + " EUR/hour";
spanPilotRate.innerText = pilotHourlyRate + " EUR/hour";
spanTotalRate.innerText =
  ((airplaneHourlyRate + pilotHourlyRate) * routeDuration) / 60 + " EUR/hour";

function selectDeparture() {
  console.log(this);
  airportDepartureName = "Departure Selected";
  spanAirportDepartureName.innerText = airportDepartureName;
}

function selectDestination() {
  airportDestinationName = "Destination Selected";
  spanairportDestinationName.innerText = airportDestinationName;
}

const urlGoogleSheetAirports =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfIDiI9p53KnEUi7lo5hXXhxF6_euLss0MuYpeezjJ7lYvFJDbst7U8FqrKfZwGG8qZ_aqHtVCvf81/pub?output=csv";

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
            airport_id: i["ID"],
            airport_code: i["Airfield"],
            airport_city: i["Location"],
            // airport_name: i["Name"],
            // airport_country: i["Country"],
            // destination_id_1: i["Destination ID 1"],
            // destination_id_2: i["Destination ID 2"],
            // destination_id_3: i["Destination ID 3"],
            // destination_id_4: i["Destination ID 4"],
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
  let startLat = 51.8;
  let startLong = 13.0;
  let startZoom = 6;

  let map = L.map("map", {
    fullScreenControl: false,
    zoomSnap: 0.5,
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

  let sidebarControlMenu = L.control.sidebar("sidebar-results", {
    position: "right",
    closeButton: false,
    autoPan: false,
  });
  map.addControl(sidebarControlMenu);
  sidebarControlMenu.show();

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
    let airportCode = feature.properties.airport_code;
    let airportCity = feature.properties.airport_city;
    // let airportName = feature.properties.airport_name;
    // let airportCountry = feature.properties.airport_country;

    let popupContent = '<p class="popup-title">' + airportCode + "</p>";

    if (airportCode) {
      popupContent += '<p class="popup-subtitle">' + airportCity + "</p>";
    }

    // if (airportCity && airportCountry) {
    //   popupContent +=
    //     '<p class="popup-text">' + airportCity + ", " + airportCountry + "</p>";
    // }

    // popupContent +=
    //   '<button type="button" class="btn-select-airport btn-departure" onclick="selectDeparture()">' +
    //   "Select as Departure" +
    //   "</button>";

    // popupContent += "</br>";

    // popupContent +=
    //   '<button type="button" class="btn-select-airport btn-destination" onclick="selectDestination()">' +
    //   "Select as Destination" +
    //   "</button>";

    layer.bindPopup(popupContent, {});

    layer.on({
      // click: drawAvailableRoutes,
    });
  }

  layerAirports = L.geoJson(geojsonAirports, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: iconAirports });
    },
    onEachFeature: onEachFeatureAirports,
  }).addTo(map);

  let pointA = turf.point([8.076225, 50.707205]); // EDGS Siegerland
  let pointB = turf.point([13.154605, 52.207172]); // EDAZ Berlin
  let routeGeojson = turf.greatCircle(pointA, pointB);
  let route = L.geoJSON(routeGeojson, {
    style: styleRouteLines,
  }).addTo(map);

  let radiusPlane = 678;

  let optionsCircle = {
    steps: 200,
    units: "kilometers",
  };

  let circleRange = turf.circle(pointA, radiusPlane, optionsCircle);

  let layerPlaneRange = L.geoJSON(circleRange, {
    style: { fillOpacity: 0, color: "#000000", weight: 1 },
  }).addTo(map);

  let optionsDistance = {
    units: "kilometers",
  };

  routeDistance = turf.distance(pointA, pointB, optionsDistance);
  spanRouteDistance.innerText = routeDistance.toFixed(1) + " km";

  routeDuration = (routeDistance / airplaneSpeedKmH) * 60;
  spanRouteDuration.innerText = routeDuration.toFixed(0) + " minutes";
  console.log(routeDuration);

  spanTotalRate.innerText =
    (((airplaneHourlyRate + pilotHourlyRate) * routeDuration) / 60).toFixed(0) +
    " EUR/hour";


    let iconArrow = L.icon({
      iconUrl: "images/arrow.jpeg",
      iconSize: [25, 25],
    });

  let midpoint = turf.midpoint(pointA, pointB);
  let lyrMidpoint = L.geoJSON(midpoint, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: iconArrow });
    },
  }).addTo(map);
}

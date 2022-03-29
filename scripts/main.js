// default initial values
let airportDepartureName = "Select Departure Airport";
let airportDepartureCode = "";
let airportDestinationName = "Select Destination Airport";
let airportDestinationCode = "";

let airplaneModel = "Select Airplane";
let airplaneSpeed = 0;
let airplaneRange = 0;
let airplaneRate = 0; // EUR/hour

let routeDistance = 0; // kilometers
let routeDuration = 0; // minutes

let pilotName = "Robert Anders";
let pilotRate = 100; // EUR/hour
let totalRate = 0; // EUR/hour

// select containers
const spanAirportDepartureName = document.getElementById("airport-dep");
const spanAirportDestinationName = document.getElementById("airport-dest");
const spanAirportDepartureCode = document.getElementById("airport-dep-code");
const spanAirportDestinationCode = document.getElementById("airport-dest-code");

const spanAirplaneModel = document.getElementById("airplane-model");
const spanAirplaneSpeed = document.getElementById("airplane-speed");
const spanAirplaneRange = document.getElementById("airplane-range");
const spanAirplaneRate = document.getElementById("airplane-rate");

const spanRouteDistance = document.getElementById("route-distance");
const spanRouteDuration = document.getElementById("route-duration");
const spanPilotName = document.getElementById("pilot-name");
const spanPilotRate = document.getElementById("pilot-rate");
const spanTotalRate = document.getElementById("total-rate");

// write default values in flight program
spanAirportDepartureName.innerText = airportDepartureName;
spanAirportDepartureCode.innerText = airportDepartureCode;
spanAirportDestinationName.innerText = airportDestinationName;
spanAirportDestinationCode.innerText = airportDestinationCode;

spanAirplaneModel.innerText = airplaneModel;
spanAirplaneSpeed.innerText = airplaneSpeed;
spanAirplaneRange.innerText = airplaneRange;
spanAirplaneRate.innerText = airplaneRate;

spanPilotName.innerText = pilotName;
spanRouteDistance.innerText = routeDistance;
spanRouteDuration.innerText = routeDuration;
spanPilotRate.innerText = pilotRate;
spanTotalRate.innerText = totalRate;

// -----------MAP GLOBAL ------
let map;
let layerGroupFlightRoutes = L.layerGroup();

// use default values to avoid errors
let pointDeparture = turf.point([8.076225, 50.707205]);
let pointDestination = turf.point([13.154605, 52.207172]);

/* -------------STYLE-------------- */
let iconAirport = L.icon({
  iconUrl: "images/icon_airport.png",
  iconSize: [40, 40],
  popupAnchor: [0, -5],
});

let iconAirplane = L.icon({
  iconUrl: "images/icon_airplane.png",
  iconSize: [30, 30],
});

let iconArrow = L.icon({
  iconUrl: "images/icon_arrow.png",
  iconSize: [25, 25],
});

let styleFlightRoute = {
  color: "#000000",
  fillColor: "#ffffff",
  fillOpacity: 0,
  opacity: 1,
  weight: 2,
  dashArray: "2 4",
};

/* -------------FUNCTIONS FOR POPUP BUTTONS-------------- */
function setDeparture() {
  airportDepartureName = document.getElementById(
    "current-airport-name"
  ).innerHTML;
  spanAirportDepartureName.innerText = airportDepartureName;

  airportDepartureCode =
    "(" + document.getElementById("current-airport-code").innerHTML + ")";
  spanAirportDepartureCode.innerText = airportDepartureCode;

  let filteredDep = geojsonAirports.features.filter(
    (feat) => feat.properties["airport_city"] === airportDepartureName
  );
  pointDeparture = turf.point(filteredDep[0].geometry.coordinates);

  calculateFlightRoute();
}

function setDestination() {
  airportDestinationName = document.getElementById(
    "current-airport-name"
  ).innerHTML;
  spanAirportDestinationName.innerText = airportDestinationName;

  airportDestinationCode =
    "(" + document.getElementById("current-airport-code").innerHTML + ")";
  spanAirportDestinationCode.innerText = airportDestinationCode;

  let filteredDest = geojsonAirports.features.filter(
    (feat) => feat.properties["airport_city"] === airportDestinationName
  );
  pointDestination = turf.point(filteredDest[0].geometry.coordinates);

  calculateFlightRoute();
}

function calculateFlightRoute() {
  layerGroupFlightRoutes.clearLayers();

  // draw the route between departure and destination
  routeGeojson = turf.greatCircle(pointDeparture, pointDestination);

  layerRoute = L.geoJSON(routeGeojson, {
    style: styleFlightRoute,
  }).addTo(layerGroupFlightRoutes);

  let optionsDistance = {
    units: "kilometers",
  };

  // calculate the distance between departure and destination
  routeDistance = turf.distance(
    pointDeparture,
    pointDestination,
    optionsDistance
  );
  spanRouteDistance.innerText = routeDistance.toFixed(1);

  // calculate bearing to rotate the arrow
  let bearing = turf.bearing(pointDeparture, pointDestination);

  // calculate the midpoint to indicate direction
  routeMidpoint = turf.midpoint(pointDeparture, pointDestination);
  layerMidpoint = L.geoJSON(routeMidpoint, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, {
        icon: iconArrow,
        rotationAngle: bearing,
        rotationOrigin: "center center",
      });
    },
  }).addTo(layerGroupFlightRoutes);

  layerGroupFlightRoutes.addTo(map);
}

function selectAirplane() {
  spanAirplaneModel.innerText = document.getElementById(
    "current-airplane-model"
  ).innerHTML;

  airplaneSpeed = parseFloat(
    document.getElementById("current-airplane-speed").innerHTML.substring(19)
  );
  airplaneRange = parseFloat(
    document.getElementById("current-airplane-range").innerHTML.substring(12)
  ).toFixed(1);
  airplaneRate = parseFloat(
    document.getElementById("current-airplane-rate").innerHTML.substring(17)
  );

  airplaneSpeedKmH = (airplaneSpeed * 1.852).toFixed(1);
  spanAirplaneSpeed.innerText = airplaneSpeedKmH;
  spanAirplaneRange.innerText = airplaneRange;
  spanAirplaneRate.innerText = airplaneRate;
  calculateDurationAndRate();
}

function calculateDurationAndRate() {
  routeDuration = (routeDistance / airplaneSpeedKmH) * 60;
  spanRouteDuration.innerText = routeDuration.toFixed(0);

  totalRate = (((airplaneRate + pilotRate) * routeDuration) / 60).toFixed(0);
  spanTotalRate.innerText = totalRate;
}

const urlGoogleSheetAirplanes =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRgPpi0D9OlHrLPWjAWchU921P2USKPmwnXVUpuB9ZKACuo5NMzNz9pumWcyINl3P5ztmTvsW7PBUw1/pub?gid=0&single=true&output=csv";

/* -------------GEOJSON STRUCTURE-------------- */
let geojsonAirports = {
  type: "FeatureCollection",
  name: "airports",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features: [],
};

let geojsonAirplanes = {
  type: "FeatureCollection",
  name: "airplanes",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features: [],
};

function getAirportData() {
  Papa.parse(urlGoogleSheetAirplanes, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      sheetDataSchools = results.data;

      let listAirfield = [];

      sheetDataSchools.forEach((i) => {
        // create the geojson for airplanes
        let newAirplane = {
          type: "Feature",
          properties: {
            airplane_id: i["ID"],
            airport_code: i["Airfield"],
            airport_city: i["Location"],
            company: i["Company"],
            airplane_type: i["Manufacturer"] + " " + i["Type"],
            cruise_speed: i["Cruise (kt)"],
            range: i["Range (km)"],
            year: i["Year"],
            seats: i["Seats"],
            price: i["Price"],
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(i["Longitude"]),
              parseFloat(i["Latitude"]),
            ],
          },
        };

        geojsonAirplanes["features"].push(newAirplane);

        // create the geojson for airports
        newAirportCode = i["Airfield"];

        if (!listAirfield.includes(newAirportCode)) {
          listAirfield.push(newAirportCode);
          let newAirport = {
            type: "Feature",
            properties: {
              airport_id: i["ID"],
              airport_code: i["Airfield"],
              airport_city: i["Location"],
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
        } else {
        }
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

  map = L.map("map", {
    fullScreenControl: false,
    zoomSnap: 0.5,
    minZoom: 4,
    // maxZoom: 7,
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

  /* -------------FUNCTIONS FOR EACH FEATURE-------------- */
  function onEachFeatureAirports(feature, layer) {
    let airportCode = feature.properties.airport_code;
    let airportCity = feature.properties.airport_city;

    let popupContent =
      '<p id="current-airport-code" class="popup-title">' +
      airportCode +
      "</p>";

    if (airportCity) {
      popupContent +=
        '<p id="current-airport-name" class="popup-subtitle">' +
        airportCity +
        "</p>";
    }

    popupContent +=
      '<button type="button" class="btn btn-primary btn-airport" onclick="setDeparture()">' +
      "Select Departure" +
      "</button>";

    popupContent += "<br>";

    popupContent +=
      '<button type="button" class="btn btn-success btn-airport" onclick="setDestination()">' +
      "Select Destination" +
      "</button>";

    layer.bindPopup(popupContent, {});

    let tooltipContent = feature.properties.airport_city;
    layer.bindTooltip(tooltipContent, {
      permanent: true,
      direction: "left",
      offset: [-10, -7],
      className: "tooltip-airport",
    });

    layer.on({
      // click: someFunction,
    });
  }

  let layerGroupAirplaneRange = L.layerGroup();

  function generateAirplaneRange(e) {
    // clear previously drawn range
    layerGroupAirplaneRange.clearLayers();

    let layer = e.target;
    let radius = parseInt(layer.feature.properties.range);
    let centerCoordinates = layer.feature.geometry.coordinates;
    let center = turf.point(centerCoordinates);

    let optionsCircle = {
      steps: 200,
      units: "kilometers",
    };

    let circleRange = turf.circle(center, radius, optionsCircle);

    // the layer is stored in a layer group for easier deletion
    let layerAirplaneRange = L.geoJSON(circleRange, {
      style: { fillOpacity: 0, color: "#000000", weight: 1 },
    }).addTo(layerGroupAirplaneRange);

    // the layer group containing the layer is added
    layerGroupAirplaneRange.addTo(map);
  }

  function onEachFeatureAirplanes(feature, layer) {
    let airplaneType = feature.properties.airplane_type;
    let airplaneCompany = feature.properties.company;
    let airplaneRange = feature.properties.range;
    let airplaneCruiseSpeed = feature.properties.cruise_speed;
    let airplaneYear = feature.properties.year;
    let airplaneSeats = feature.properties.seats;
    let airplaneRate = feature.properties.price;

    let popupContent =
      '<p id="current-airplane-model" class="popup-title">' +
      airplaneType +
      "</p>";

    if (airplaneCompany) {
      popupContent +=
        '<p id="current-airplane-company" class="popup-subtitle">' +
        airplaneCompany +
        "</p>";
    }

    if (airplaneRange) {
      popupContent +=
        '<p id="current-airplane-range" class="popup-subtitle">Range (km): ' +
        airplaneRange +
        "</p>";
    }

    if (airplaneCruiseSpeed) {
      popupContent +=
        '<p id="current-airplane-speed" class="popup-subtitle">Cruise Speed (kt): ' +
        airplaneCruiseSpeed +
        "</p>";
    }

    if (airplaneSeats) {
      popupContent +=
        '<p id="current-airplane-seats" class="popup-subtitle">Seats: ' +
        airplaneSeats +
        "</p>";
    }

    if (airplaneRate) {
      popupContent +=
        '<p id="current-airplane-rate" class="popup-subtitle">Rate (EUR/hour): ' +
        airplaneRate +
        "</p>";
    }

    if (airplaneYear) {
      popupContent +=
        '<p id="current-airplane-year" class="popup-subtitle">Year: ' +
        airplaneYear +
        "</p>";
    }

    popupContent +=
      '<button type="button" class="btn btn-primary btn-airport" onclick="selectAirplane()">' +
      "Select Airplane" +
      "</button>";

    layer.bindPopup(popupContent, {});

    layer.on({
      click: generateAirplaneRange,
    });
  }

  /* -------------ADD LAYESR TO MAP-------------- */
  layerAirports = L.geoJson(geojsonAirports, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: iconAirport });
    },
    onEachFeature: onEachFeatureAirports,
  }).addTo(map);

  let layerAiplanes = new L.geoJson(geojsonAirplanes, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: iconAirplane });
    },
    onEachFeature: onEachFeatureAirplanes,
  });

  let clusteredAirports = new L.MarkerClusterGroup({
    spiderLegPolylineOptions: {
      weight: 1.5,
      color: "#ff0000",
      opacity: 1,
    },
    spiderfyDistanceMultiplier: 5,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    // singleMarkerMode: true, // NO
    // disableClusteringAtZoom: 7, // NO
    // spiderfyOnMaxZoom: true,
    // singleMarkerMode: true
  });

  clusteredAirports.addLayer(layerAiplanes);
  clusteredAirports.addTo(map);
}

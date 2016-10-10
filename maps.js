var map;
var markers = [];
var LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var MAX_RESULTS = 10;

// Creates the initial map
function initMap() {
    console.log("initMap called");
    map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 37.7749, lng: -122.4194},
    zoom: 3
    });
}

// Checks the query to make sure it's valid
function checkQuery(query) {
    console.log("checkQuery called");
    valid = true;
    if (query === "" || query === null) {
        valid = false;
    }
    return valid;
}

// Calls the Google Places API with the query string
function getPlaces(query) {
    console.log("getPlaces called");
    
    clearMarkers();
    clearPanels();

    var request = {
        query: query
    };

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, placesCallback);
}

function placesCallback(results, status) {
    var markerCount = 0;
    var bounds = new google.maps.LatLngBounds();
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < Math.min(results.length, MAX_RESULTS); i++) {
            var place = results[i];
            console.log(place);
            createMarker(place, bounds, markerCount);
            createPanel(place, markerCount);
            markerCount++;
        }
    }
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());
    // fix map zoom if too far zoomed in
    if (map.getZoom() > 17) {
        map.setZoom(17);
    }  
}

function createPanel(place, markerCount) {
    
    var label = LABELS[markerCount];
    var template = "<p>" + label + " - " + place.name + "</p>";
    document.getElementById("results").innerHTML += template;
}

function clearPanels() {
    document.getElementById("results").innerHTML = "";
}

function createMarker(place, bounds, markerCount) {
    //console.log("create marker called");
    var placeLat = place.geometry.location.lat();
    var placeLng = place.geometry.location.lng();
    var placeLatLng = new google.maps.LatLng(placeLat, placeLng);

    bounds.extend(placeLatLng);

    var marker = new google.maps.Marker({
        position: placeLatLng,
        map: map,
        title: place.name,
        label: LABELS[markerCount]
    });
    markers.push(marker);
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

function showWarning(err) {
    document.getElementById("search-warning").innerText = err;
}

function clearWarning() {
    document.getElementById("search-warning").innerText = "";
}

function clearSearch(query) {
    var searchBar = document.getElementById("search-bar");
    searchBar.value = "";
    searchBar.placeholder = query;
}

function handleSearch() {
    clearWarning();
    var query = document.getElementById("search-bar").value;
    //console.log("query = " + query);
    valid = checkQuery(query);
    //console.log(valid);
    if (valid) {
        getPlaces(query);
    }
    else {
        showWarning("Please enter a valid search.");
    }
    clearSearch(query);
}

// Search Button Event Handler
var button = document.getElementById("search-button");
button.onclick = function() {
    handleSearch();
};
var searchBar = document.getElementById("search-bar");
searchBar.onkeypress = function(e) {
    if (e.keyCode == 13) {
        handleSearch();
    }
}
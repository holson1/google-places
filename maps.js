var map;
var markers = [];
var LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var MAX_RESULTS = 10;

// Creates the initial map
function initMap() {
    console.log("initMap called");
    map = new google.maps.Map($("#map")[0], {
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
    // also init the template while we're here

    var template = $("#result-template").html();
    var compiled_template = Handlebars.compile(template);

    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < Math.min(results.length, MAX_RESULTS); i++) {
            var place = results[i];
            console.log(place);
            createMarker(place, bounds, markerCount);
            createPanel(place, markerCount, compiled_template);
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

function createPanel(place, markerCount, compiled_template) {

    // convert price_level (e.g. 2) into dollar format
    var priceLevel = "";
    if ("price_level" in place) {
        for (var i=1; i<=place.price_level; i++) {
            priceLevel += "$";
        }
    }

    // convert rating (e.g. 3.7) into star rating
    var rating = (Math.round(place.rating * 2) / 2).toFixed(1);
    var stars = [];
    var halfStars = [];
    var emptyStars = [];

    for (var i = 0; i < 5; i++) {
        if (rating == 0.5) {
            halfStars.push(i);
            rating -= 0.5;
        }
        else if (rating == 0) {
            emptyStars.push(i);
        }
        else {
            stars.push(i);
            rating -= 1;
        }
    }

    var context = {
        label: LABELS[markerCount],
        name: place.name,
        price: priceLevel,
        address: place.formatted_address,
        stars: stars,
        halfStars: halfStars,
        emptyStars: emptyStars
    };
    var rendered = compiled_template(context);
    $("#results").append(rendered);
}

function clearPanels() {
    $("#results").html("");
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
    $("#search-warning").text(err);
}

function clearWarning() {
    $("#search-warning").text("");
}

function clearSearch(query) {
    var searchBar = $("#search-bar");
    searchBar.val("");
    searchBar.attr("placeholder", query);
}

function handleSearch() {
    clearWarning();
    var query = $("#search-bar").val();
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
$("#search-button").click(function() {
    handleSearch();
});

$("#search-bar").keypress(function(e) {
    if (e.keyCode == 13) {
        handleSearch();
    }
});

$(document).ready(function()
{
    $("#scrollbar1").tinyscrollbar();
});
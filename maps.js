var map;
var markers = [];
var LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var MAX_RESULTS = 10;
// keep this global so we can reference in numerous event handlers
var infoWindow;

// Creates the initial map
function initMap() {
    map = new google.maps.Map($("#map")[0], {
    center: {lat: 39.7749, lng: -102.4194},
    zoom: 3,
    mapTypeControl: false,
    streetViewControl: false
    });
}

// Checks the query to make sure it's valid
function checkQuery(query) {
    valid = true;
    if (query === "" || query === null) {
        valid = false;
    }
    return valid;
}

// Calls the Google Places API with the query string
function getPlaces(query) {
    
    clearMarkers();
    clearPanels();

    var request = {
        query: query
    };

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, placesCallback);
}

// process the results of the Google Places API search
function placesCallback(results, status) {
    var markerCount = 0;
    var bounds = new google.maps.LatLngBounds();

    // also init the template while we're here
    var template = $("#result-template").html();
    var compiled_template = Handlebars.compile(template);

    // if this is our first time adding results, give the scroll area some height
    if ($(".scroll-pane").css("height") != "400px") {
        $(".scroll-pane").css("height", "400px");
    }

    // initialize the infoWindow
    infoWindow = new google.maps.InfoWindow();

    // for each result, create a marker and a panel
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < Math.min(results.length, MAX_RESULTS); i++) {
            var place = results[i];
            //console.log(place);
            createMarker(place, bounds, markerCount, infoWindow);
            createPanel(place, markerCount, compiled_template);
            markerCount++;
        }
    }

    // center the map around the results
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());
    // fix map zoom if too far zoomed in
    if (map.getZoom() > 15) {
        map.setZoom(15);
    }
}

// build a panel for a particular result
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

    // context for Handlebars template
    var context = {
        label: LABELS[markerCount],
        name: place.name,
        price: priceLevel,
        address: place.formatted_address,
        stars: stars,
        halfStars: halfStars,
        emptyStars: emptyStars
    };

    // compile template and add to list
    var rendered = compiled_template(context);
    $("#results").append(rendered);
}

// clear all the panels
function clearPanels() {
    $("#results").html("");
}

// create a marker for a particular result
function createMarker(place, bounds, markerCount, infoWindow) {
    var placeLat = place.geometry.location.lat();
    var placeLng = place.geometry.location.lng();
    var placeLatLng = new google.maps.LatLng(placeLat, placeLng);

    // extend the map bounds to include the marker
    bounds.extend(placeLatLng);

    var marker = new google.maps.Marker({
        position: placeLatLng,
        map: map,
        title: place.name,
        label: LABELS[markerCount]
    });
    
    var contentString = place.name;

    // handle marker onclick
    marker.addListener('click', function() {

        map.setCenter(marker.getPosition());
        var markerPos = markers.indexOf(this);

        // highlight the selected result
        $(".result").css("background-color", "white");
        var result = $(".result:eq(" + markerPos + ")");
        result.css("background-color", "#eee");

        // open the infoWindow
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);

        // jump to the highlighted result
        $("#results").scrollTo(result, 300);
    });

    markers.push(marker);
}

// remove markers from map and dereference them
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

// display a warning text for an invalid search
function showWarning(err) {
    $("#search-warning").text(err);
}

// remove the warning text when a valid search is performed
function clearWarning() {
    $("#search-warning").text("");
}

// wipe the searchbox once the search is run
function clearSearch(query) {
    var searchBar = $("#search-bar");
    searchBar.val("");
    searchBar.attr("placeholder", query);
}

// when a search is initiated, decide what to do with the input
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

// Search Event Handlers
$("#search-button").click(function() {
    handleSearch();
});

$("#search-bar").keypress(function(e) {
    if (e.keyCode == 13) {
        handleSearch();
    }
});

// Result panel click handler
$("#results").on("click", ".result", function() {
    $(".result").css("background-color", "white");
    $(this).css("background-color", "#eee");

    var elementPos = $(this).index();
    map.setCenter(markers[elementPos].getPosition());
    infoWindow.setContent(markers[elementPos].title);
    infoWindow.open(map, markers[elementPos]);
});
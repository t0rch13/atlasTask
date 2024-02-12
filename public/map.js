function initMap() {
    var mapElement = document.getElementById("map");
    var lat = parseFloat(mapElement.getAttribute("data-lat"));
    var lng = parseFloat(mapElement.getAttribute("data-lng"));

    var location = { lat: lat, lng: lng };
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 5,
        center: location
    });
    var marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

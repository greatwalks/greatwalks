(function(){
	"use strict";
	var geolocationSuccess = function(position){
		$(".navbar-inner").html( 'Latitude: '           + position.coords.latitude              + ',' +
                            'Longitude: '          + position.coords.longitude             + ',' +
                            'Altitude: '           + position.coords.altitude              + ',' +
                            'Accuracy: '           + position.coords.accuracy              + ',' +
                            'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + ',' +
                            'Heading: '            + position.coords.heading               + ',' +
                            'Speed: '              + position.coords.speed                 + ',' +
                            'Timestamp: '          + new Date(position.timestamp)          + '.');
	}

	var geolocationError = function(msg) {
		alert(JSON.stringify(msg));
	}

	var watchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, {
		maximumAge:600000,
		timeout:5000,
		enableHighAccuracy: true});

	$(".navbar-inner").html("Checking GPSy");

	
}())
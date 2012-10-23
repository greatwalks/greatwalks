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

		if(window.map_details === undefined) {
			return;
		}
		var youarehere_css = {
			"position":"absolute",
			"left": -parseInt((position.coords.latitude - window.map_details.latitude) / window.map_details.degrees_per_pixel, 10) +  "px",
			"top": parseInt((position.coords.longitude - window.map_details.longitude) / window.map_details.degrees_per_pixel, 10)  + "px",
		};
		$("#youarehere").css(youarehere_css);
		$(".navbar-inner").append(JSON.stringify(youarehere_css));

	}

	var geolocationError = function(msg) {
		$(".navbar-inner").html(JSON.stringify(msg));
	}

	var watchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, {
		maximumAge:600000,
		
		enableHighAccuracy: true});

	$(".navbar-inner").html("Checking GPSy");


}())
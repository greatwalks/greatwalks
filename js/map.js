(function(){
	"use strict";
	if($(".map").length === 0) {
		return;
	}
	var centered_on_load = false,
		geolocationSuccess = function(position){
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
			var pixels = {
				"left": -parseInt((position.coords.latitude - window.map_details.latitude) / window.map_details.degrees_per_pixel, 10),
				"top": parseInt((position.coords.longitude - window.map_details.longitude) / window.map_details.degrees_per_pixel, 10)
			} 
			var youarehere_css = {
				"position":"absolute",
				"left": pixels.left + "px",
				"top": pixels.top + "px",
			};
			$("#youarehere").css(youarehere_css);
			$(".navbar-inner").append(JSON.stringify(youarehere_css));

			if(centered_on_load === false) {
				window.scrollTo(
					pixels.left - $(window).width() / 2,
					pixels.top - $(window).height() / 2
				);
				centered_on_load = true;
			}
		},
		geolocationError = function(msg) {
		$(".navbar-inner").html(JSON.stringify(msg));
	}

	

	var watchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, {
		maximumAge:600000,
		
		enableHighAccuracy: true});

	$(".navbar-inner").html("Checking GPSy");

	$(".location span").click(function(){
		$(this).next("h3").toggle();
	});	



}())
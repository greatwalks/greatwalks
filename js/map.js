(function(){
	$(document).ready(function(){
		"use strict";
		if(window.map_details === undefined) { //are we on a map page?
			return;
		};
		var centered_once_upon_load = false,
			current_position,
			kilometres_to_miles = 0.621371,
			degrees_to_radians = function(degrees) {
		 		var PIx = 3.141592653589793;
				return degrees * PIx / 180;
		 	},
		 	pixels_to_longitude_latitude = function(map_x, map_y){
		 		return {
		 			longitude: map_details.longitude + (map_x / map_details.degrees_per_pixel),
		 			latitude: map_details.latitude + (map_y / map_details.degrees_per_pixel)
		 		};
		 	},
		 	format_distance = function(kilometres){
		 		 return kilometres + "km/" + (Math.round(kilometres * kilometres_to_miles * 100) / 100) + "mi";
		 	},
			difference_between_positions_in_kilometers = function(lat1, lon1, lat2, lon2, lat3, lon3){
				//normally lat3/lon3 aren't given and this function figures out the distance between two points
				//if lat3/lon3 are given then it's about finding the distance between a point and a square
				//courtesy of http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points/27943#27943
				if(lat1 < lat3) {
					//lat2 = lat3;
				}
				if(lon1 > lon3) {
					//lon2 = lon3;
				}
				var R = 6371; // Radius of the earth in km
				var dLat = degrees_to_radians(lat2-lat1);  // Javascript functions in radians
				var dLon = degrees_to_radians(lon2-lon1); 
				var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				        Math.cos(degrees_to_radians(lat1)) * Math.cos(degrees_to_radians(lat2)) * 
				        Math.sin(dLon/2) * Math.sin(dLon/2); 
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				return R * c; // Distance in km
			},

			geolocationSuccess = function(position){
				/*
				Latitude:          position.coords.latitude
	            Longitude:         position.coords.longitude
	            Altitude:          position.coords.altitude
	            Accuracy:          position.coords.accuracy
	            Altitude Accuracy: position.coords.altitudeAccuracy
	            Heading:           position.coords.heading
	            Speed:             position.coords.speed
		        */
				var youarehere_pixels = {
						"left": -parseInt((position.coords.latitude - window.map_details.latitude) / window.map_details.degrees_per_pixel, 10),
						"top": parseInt((position.coords.longitude - window.map_details.longitude) / window.map_details.degrees_per_pixel, 10)
					},
					$youarehere = $("#youarehere"),
					$youarehere_offmap = $youarehere.find(".offmap"),
					youarehere_css = {position: "absolute"},
					youarehere_offmap_css = {position: "relative", left: $youarehere.width() + "px", top: $youarehere.height() + "px"},
					offmap = false,
					difference_distance_in_kilometres = Math.round(
							difference_between_positions_in_kilometers(
								position.coords.latitude, position.coords.longitude, 
								window.map_details.latitude, window.map_details.longitude) * 100,
								window.map_details.extent_latitude, window.map_details.extent_longitude
							) / 100;

				$youarehere_offmap.html("you are off the map by " + format_distance(difference_distance_in_kilometres));
				if(youarehere_pixels.left < 0) {
					youarehere_pixels.left = 0;
					offmap = true;
				} else if(youarehere_pixels.left > window.map_details.map_pixel_width){
					youarehere_pixels.left = window.map_details.map_pixel_width - $youarehere.width();
					offmap = true;
					youarehere_offmap_css.left = (-$youarehere_offmap.width() - 10) + "px"
				}
				if(youarehere_pixels.top < 0) {
					youarehere_pixels.top = 0;
					offmap = true;
				} else if(youarehere_pixels.top > window.map_details.map_pixel_height){
					youarehere_pixels.top = window.map_details.map_pixel_height - $youarehere.height();
					offmap = true;
					youarehere_offmap_css.top = (-$youarehere_offmap.height() - 10) + "px"
				}
				youarehere_css.left = youarehere_pixels.left + "px";
				youarehere_css.top = youarehere_pixels.top + "px";
				$youarehere.css(youarehere_css);
				if(offmap) {
					$youarehere_offmap.css(youarehere_offmap_css).show();
				} else {
					$youarehere_offmap.hide();
				}
				$youarehere_offmap.css(youarehere_offmap_css).show();
				if(centered_once_upon_load === false) {
					window.scrollTo(
						youarehere_pixels.left - $(window).width() / 2,
						youarehere_pixels.top - $(window).height() / 2
					);
					centered_once_upon_load = true;
				};
				current_position = position;
			},
			geolocationError = function(msg) {
				try{
					geolocation.clearWatch(geolocationWatchId);
				} catch(exception){
				}
				if(geolocationSetting.enableHighAccuracy === true) { //high accuracy failed so retry with low accuracy
					geolocationSetting.enableHighAccuracy = false;
					geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);
				} else {
					$("#no_gps").attr("title", msg.message).show();
				};
			},
			geolocationSettings = {
				maximumAge:600000,
				timeout:5000,
				enableHighAccuracy: true
			},
			$locations = $(".location"),
			$locations_descriptions = $locations.find(".description"),
			geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);

		$(".location a").click(function(){
			var $location = $(this).closest(".location"),
				$description = $(this).next(".description"),
				$distance_away = $description.find("p.distance"),
				difference_distance_in_kilometres;
			$locations_descriptions.not($description).hide();
			if(current_position !== undefined) {
				/*
				Latitude:          current_position.coords.latitude
	            Longitude:         current_position.coords.longitude
	            Altitude:          current_position.coords.altitude
	            Accuracy:          current_position.coords.accuracy
	            Altitude Accuracy: current_position.coords.altitudeAccuracy
	            Heading:           current_position.coords.heading
	            Speed:             current_position.coords.speed
	            */
				difference_distance_in_kilometres = Math.round(
					difference_between_positions_in_kilometers(
						current_position.coords.latitude, current_position.coords.longitude,
						parseFloat($location.data("latitude")), parseFloat($location.data("longitude"))
					) * 100
				) / 100;
				$distance_away.text(format_distance(difference_distance_in_kilometres) + " away.").show();
			} else {
				$distance_away.hide();
			}
			$description.toggle();
		});
		$locations_descriptions.click(function(){
			$(this).hide();
		})
	});	
}())
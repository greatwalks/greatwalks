(function($){
	"use strict";
	$(document).ready(function(){
		if(window.map_details === undefined) { //are we on a map page?
			return;
		};
		var centered_once_upon_load = false,
			one_hour_in_milliseconds = 60 * 60 * 1000,
			position_expires_after_milliseconds = one_hour_in_milliseconds,
			last_known_position = localStorage["geolocation-last-known-position"],
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
		 		 return kilometres + "km/ " + (Math.round(kilometres * kilometres_to_miles * 100) / 100) + "mi";
		 	},
			difference_between_positions_in_kilometers = function(lat1, lon1, lat2, lon2, lat3, lon3){
				if(lat3 !== undefined && lon3 !== undefined) {
					//normally lat3/lon3 aren't given and this function just figures out the distance
					// between two points.
					// however if lat3/lon3 are given then this function finds out the distance between
					// a point and the closest side of a square (e.g. a map graphic).
					// courtesy of http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points/27943#27943
					if(lat1 < lat3) {
						lat2 = lat3;
					}
					if(lon1 > lon3) {
						lon2 = lon3;
					}
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
						"top": -parseInt((position.coords.latitude - window.map_details.latitude) / window.map_details.degrees_per_pixel, 10),
						"left": parseInt((position.coords.longitude - window.map_details.longitude) / window.map_details.degrees_per_pixel, 10)
					},
					$youarehere = $("#youarehere").data("latitude", position.coords.latitude).data("longitude", position.coords.longitude),
					$youarehere_offmap = $youarehere.find(".offmap"),
					youarehere_css = {position: "absolute"},
					youarehere_offmap_css = {position: "relative", left: $youarehere.width() + "px", top: $youarehere.height() + "px"},
					offmap = false,
					difference_distance_in_kilometres = Math.round(
							difference_between_positions_in_kilometers(
								position.coords.latitude, position.coords.longitude, 
								window.map_details.latitude, window.map_details.longitude,
								window.map_details.extent_latitude, window.map_details.extent_longitude
							) * 100) / 100;
				
				$youarehere_offmap.html("you are off the map by about " + format_distance(difference_distance_in_kilometres));
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
				if(centered_once_upon_load === false) {
					window.scrollTo(
						youarehere_pixels.left - $(window).width() / 2,
						youarehere_pixels.top - $(window).height() / 2
					);
					centered_once_upon_load = true;
				};
				last_known_position = position;
				localStorage["geolocation-last-known-position"] = JSON.stringify(position);
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
			enable_pinch_zoom2 = function($image){
				//based on code from http://eightmedia.github.com/hammer.js/zoom/index2.html
		        var hammer,
		        	height,
		        	offset,
		        	origin,
		        	prevScale,
		        	scale,
		        	screenOrigin,
		        	translate,
		        	width;

		        //wrap = $('#wrap');
		        width = $image.width();
		        height = $image.height();
		        offset = $image.offset();
		        origin = {
		            x: 0,
		            y: 0
		        };
		        screenOrigin = {
		            x: 0,
		            y: 0
		        };
		        translate = {
		            x: 0,
		            y: 0
		        };
		        scale = 1;
		        prevScale = 1;

		        hammer = $image.hammer({
		            prevent_default: true,
		            scale_treshold: 0,
		            drag_min_distance: 0
		        });

		   		hammer.bind('drag', function(event) {
		   			translate.x += event.distanceX;
		   			translate.y += event.distanceY;
		   			$image.css('-webkit-transform', 'translate3d(' + event.distanceX + 'px, ' + event.distanceY + 'px, 0) scale3d(' + scale + ', ' + scale + ', 1)');
		   		});

		        hammer.bind('transformstart', function(event) {
		            screenOrigin.x = (event.originalEvent.touches[0].clientX + event.originalEvent.touches[1].clientX) / 2;
		            return screenOrigin.y = (event.originalEvent.touches[0].clientY + event.originalEvent.touches[1].clientY) / 2;
		        });

		        hammer.bind('transform', function(event) {
		            var newHeight, newWidth;
		            scale = prevScale * event.scale;

		            newWidth = $image.width() * scale;
		            newHeight = $image.height() * scale;

		            origin.x = screenOrigin.x - offset.left - translate.x;
		            origin.y = screenOrigin.y - offset.top - translate.y;

		            translate.x += -origin.x * (newWidth - width) / newWidth;
		            translate.y += -origin.y * (newHeight - height) / newHeight;

		            $image.css('-webkit-transform', "scale3d(" + scale + ", " + scale + ", 1) translate3d(" + translate.x + "px, " + translate.y + "px, 0)");
		            width = newWidth;

		            return height = newHeight;
		        });

		        hammer.bind('transformend', function(event) {
		            return prevScale = scale;
		        });
			},
			location_show = function(){
				var $location = $(this).closest(".location"),
					$description = $(this).next(".description"),
					$distance_away = $description.find("p.distance"),
					difference_distance_in_kilometres;
				$locations_descriptions.not($description).hide();
				if(last_known_position !== undefined) {
					/*
					Latitude:          last_known_position.coords.latitude
		            Longitude:         last_known_position.coords.longitude
		            Altitude:          last_known_position.coords.altitude
		            Accuracy:          last_known_position.coords.accuracy
		            Altitude Accuracy: last_known_position.coords.altitudeAccuracy
		            Heading:           last_known_position.coords.heading
		            Speed:             last_known_position.coords.speed
		            */
					difference_distance_in_kilometres = Math.round(
						difference_between_positions_in_kilometers(
							last_known_position.coords.latitude, last_known_position.coords.longitude,
							parseFloat($location.data("latitude")), parseFloat($location.data("longitude"))
						) * 100
					) / 100;
					$distance_away.text(format_distance(difference_distance_in_kilometres) + " away.").show();
				} else {
					$distance_away.hide();
				}
				$description.toggle();
			},
			location_hide = function(){
				$(this).hide();
			},
			geolocationSettings = {
				maximumAge:600000,
				enableHighAccuracy: true
			},
			current_time_in_epoch_milliseconds,
			$locations = $(".location"),
			$locations_descriptions = $locations.find(".description"),
			geolocationWatchId;
			
			if(last_known_position !== undefined) {
				last_known_position = JSON.parse(last_known_position);
				current_time_in_epoch_milliseconds = (new Date).getTime();
				if(last_known_position.timestamp < current_time_in_epoch_milliseconds - position_expires_after_milliseconds) {
					//
				} else {
					geolocationSuccess(last_known_position);
				}
			}
			geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);
		enable_pinch_zoom2($(".map"));
		if(Modernizr.touch) {
			alert("touch enabled")
			//$locations.find("a").hammer().bind("tap", location_show);
			//$locations_descriptions.hammer().bind("tap", location_hide);
		} else {
			$locations.find("a").click(location_show);
			$locations_descriptions.click(location_hide);
		}
	});	
}(jQuery))
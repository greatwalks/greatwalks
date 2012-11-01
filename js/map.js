(function($){
	"use strict";

	(function(){
		var PIx = 3.141592653589793,
		 	degrees_to_radians = function(degrees) {
				return degrees * PIx / 180;
	 		},
			kilometres_to_miles = 0.621371,
			one_hour_in_milliseconds = 60 * 60 * 1000;

		window.format_distance = function(kilometres){
	 		 return (Math.round(kilometres * 100) / 100) + "km/ " + (Math.round(kilometres * kilometres_to_miles * 100) / 100) + "mi";
	 	};
		window.difference_between_positions_in_kilometers = function(lat1, lon1, lat2, lon2, lat3, lon3){
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
			var R = 6371; // adverage radius of the earth in km
			var dLat = degrees_to_radians(lat2-lat1);  // Javascript functions in radians
			var dLon = degrees_to_radians(lon2-lon1); 
			var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			        Math.cos(degrees_to_radians(lat1)) * Math.cos(degrees_to_radians(lat2)) * 
			        Math.sin(dLon/2) * Math.sin(dLon/2); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			return R * c; // Distance in km
		};
		window.position_expires_after_milliseconds = one_hour_in_milliseconds;
	}());

	$(document).ready(function(){
		if(window.map_details === undefined) { //are we on a map page?
			return;
		};
		var centered_once_upon_load = false,
			last_known_position = localStorage["geolocation-last-known-position"],
			one_second_in_milliseconds = 1000,
			geolocationSettings = {
				maximumAge:600000,
				enableHighAccuracy: true,
				timeout: one_second_in_milliseconds * 15
			},
			drag_offset = {base_x:0,base_y:0,x:0,y:0},
		 	pixels_to_longitude_latitude = function(map_x, map_y){
		 		return {
		 			longitude: map_details.longitude + (map_x / map_details.degrees_per_pixel),
		 			latitude: map_details.latitude + (map_y / map_details.degrees_per_pixel)
		 		};
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
					edge_buffer_pixels = 10,
					$youarehere = $("#youarehere").data("latitude", position.coords.latitude).data("longitude", position.coords.longitude),
					$youarehere_offmap = $youarehere.find(".offmap"),
					youarehere_css = {position: "absolute"},
					youarehere_offmap_css = {position: "absolute", left: $youarehere.width() - 15, top: $youarehere.height()},
					offmap = false,
					difference_distance_in_kilometres = Math.round(
							difference_between_positions_in_kilometers(
								position.coords.latitude, position.coords.longitude, 
								window.map_details.latitude, window.map_details.longitude,
								window.map_details.extent_latitude, window.map_details.extent_longitude
							) * 100) / 100;
				
				$youarehere_offmap.html("you are off the map by about " + format_distance(difference_distance_in_kilometres));
				if(youarehere_pixels.left < 0) {
					youarehere_pixels.left = edge_buffer_pixels;
					youarehere_offmap_css.left = edge_buffer_pixels;
					offmap = true;
				} else if(youarehere_pixels.left > window.map_details.map_pixel_width){
					youarehere_pixels.left = window.map_details.map_pixel_width - edge_buffer_pixels;
					youarehere_offmap_css.left -= $youarehere_offmap.width() + edge_buffer_pixels;
					offmap = true;
				}
				if(youarehere_pixels.top < 0) {
					youarehere_pixels.top = edge_buffer_pixels;
					youarehere_offmap_css.top = edge_buffer_pixels;
					offmap = true;
				} else if(youarehere_pixels.top > window.map_details.map_pixel_height){
					youarehere_pixels.top = window.map_details.map_pixel_height - edge_buffer_pixels;
					youarehere_offmap_css.top = -$youarehere_offmap.height() - edge_buffer_pixels;
					offmap = true;
				}
				youarehere_css.left = youarehere_pixels.left + "px";
				youarehere_css.top = youarehere_pixels.top + "px";
				youarehere_offmap_css.left += "px";
				youarehere_offmap_css.top += "px";
				if(!offmap){
					if(geolocationSettings.enableHighAccuracy === true) {
						$youarehere.removeClass("badAccuracy").addClass("goodAccuracy");
					} else {
						$youarehere.removeClass("goodAccuracy").addClass("badAccuracy");
					}
					$youarehere_offmap.hide();
				} else {
					$youarehere.removeClass("badAccuracy goodAccuracy");
					$youarehere_offmap.css(youarehere_offmap_css).show();
				}
				$youarehere.css(youarehere_css).show();
				if(centered_once_upon_load === false) {
					var $map = $("#map"),
						$window = $(window),
						map_offset = $map.offset(),
						x = Math.abs(youarehere_pixels.left),
						y = Math.abs(youarehere_pixels.top);
					
					centered_once_upon_load = true;
					centerMap(x, y);
				};
				last_known_position = position;
				localStorage["geolocation-last-known-position"] = JSON.stringify(position);
			},
			geolocationError = function(msg) {
				try{
					geolocation.clearWatch(geolocationWatchId);
				} catch(exception){
				}
				if(geolocationSettings.enableHighAccuracy === true) { //high accuracy failed so retry with low accuracy
					geolocationSettings.enableHighAccuracy = false;
					geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);
				} else {
					$("#no_gps").attr("title", msg.message).show();
				};
			},
			
			close_any_clickovers = function(){
				if(window.close_all_clickovers) {
					var closer = window.close_all_clickovers;
					delete window.close_all_clickovers;
        			closer();
        		}
        	},

			enable_map = function($image){
				//based on code from http://eightmedia.github.com/hammer.js/zoom/index2.html
		        var hammer,
		        	height,
		        	offset,
		        	screenOffset,
		        	origin,
		        	prevScale,
		        	scale,
		        	translate,
		        	width,
		        	screenOrigin,
		        	redraw = function(){
		        		var locations_css = 'scale3d(' + ( 1 / scale ) + ', ' + ( 1 / scale ) + ', 0)',
		        			map_css = 'translate3d(' + drag_offset.x + 'px, ' + drag_offset.y + 'px, 0) scale3d(' + scale + ', ' + scale + ', 1)';
		        		$image.css('-webkit-transform', map_css);
		        		close_any_clickovers();
		        		//$locations.css({"-webkit-transform": locations_css});
		        		//$("#debug").html(locations_css);
		        	};

		        //wrap = $('#wrap');
		        width = $image.width();
		        height = $image.height();
		        offset = $image.offset();
		        screenOrigin = {
		        	x: 0,
		        	y: 0
		        }
		        origin = {
		            x: 0,
		            y: 0
		        };
		        translate = {
		            x: 0,
		            y: 0
		        };
		        screenOffset = {
		        	x: 0,
		        	y: 0
		        }

		        scale = 1;
		        prevScale = 1;

		        hammer = $image.hammer({
		            prevent_default: true,
		            scale_treshold: 0,
		            drag_min_distance: 0
		        });

		   		hammer.bind('dragend', function(event) {
		   			drag_offset.base_x = drag_offset.x;
		   			drag_offset.base_y = drag_offset.y;
		   			redraw();
		   		});

		   		//hammer.bind('tap', close_any_clickovers)

		   		hammer.bind('drag', function(event) {
		   			drag_offset.x = drag_offset.base_x + event.distanceX;
		   			drag_offset.y = drag_offset.base_y + event.distanceY;
		   			//$image.css('-webkit-transform', 'translate3d(' + drag_offset.x + 'px, ' + drag_offset.y + 'px, 0) scale3d(' + scale + ', ' + scale + ', 1)');
		   			redraw();
		   		});

		        hammer.bind('transformstart', function(event) {
		            screenOrigin.x = (event.originalEvent.touches[0].clientX + event.originalEvent.touches[1].clientX) / 2;
		            return screenOrigin.y = (event.originalEvent.touches[0].clientY + event.originalEvent.touches[1].clientY) / 2;
		        });

		        hammer.bind('transform', function(event) {
		            var newHeight, newWidth;
		            scale = prevScale * event.scale;

					if(scale < 0.3) {
	        			scale = 0.3;
	        		} else if(scale > 3) {
	        			scale = 3
	        		}

		            newWidth = $image.width() * scale;
		            newHeight = $image.height() * scale;

		            origin.x = screenOrigin.x - offset.left - translate.x;
		            origin.y = screenOrigin.y - offset.top - translate.y;

		            translate.x += -origin.x * (newWidth - width) / newWidth;
		            translate.y += -origin.y * (newHeight - height) / newHeight;

		            //$image.css('-webkit-transform', "translate3d(" + drag_offset.x + "px, " + drag_offset.y + "px, 0) scale3d(" + scale + ", " + scale + ", 1)");
		            redraw();
		            width = newWidth;

		            return height = newHeight;
		        });

		        hammer.bind('transformend', function(event) {
		            return prevScale = scale;
		        });
			},
			location_show = function(){
				//NO LONGER USED
				//ONLY LEFT HERE SO THAT YOU CAN SALVAGE THE DISTANCE BETWEEN CODE
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
					var difference_distance_in_kilometres = Math.round(
						difference_between_positions_in_kilometers(
							last_known_position.coords.latitude, last_known_position.coords.longitude,
							parseFloat($location.data("latitude")), parseFloat($location.data("longitude"))
						) * 100
					) / 100;
					
				}
			},
			centerMap = function(x, y){
				var $map = $("#map"),
					$window = $(window),
					window_width = $window.width(),
					window_height = $window.height(),
					map_offset = $map.offset(),
					map_css;
				if(x === undefined && y === undefined) { //if no coordinates are given then center on middle of map
					x = -(map_offset.left + (map_details.map_pixel_width / 2) - (window_width / 2));
					y = -(map_offset.top + (map_details.map_pixel_height / 2) - (window_height / 2));
					
				};
				if(x > 0 && x < window_width / 2) {
					x = -map_offset.left;
				} else if(x > window_width / 2 && x < map_details.map_pixel_width - (window_width / 2)) {
					x = -map_offset.left - (x / 2);
				} else {
					x =  -map_details.map_pixel_width + window_width;
					
				}

				if(y > 0 && y < window_height / 2) {
					y = 0;
				} else if(y > window_height / 2 && y < map_details.map_pixel_height - (window_height / 2)) {
					y = -map_offset.top - (y / 2);
				} else {
					y = -map_offset.top - map_details.map_pixel_height + window_height;
				}
				
				map_css = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
				//$("#debug").text(map_css);
				$map.css('-webkit-transform', map_css);
				drag_offset.base_x = x;
				drag_offset.base_y = y;
			},
			no_camera_available_timer,
			toggle_user_actions_panel = function(event){
				var $user_actions_panel = $("#user_actions"),
					$no_camera_available = $("#no_camera_available"),
					camera_success = function(imageURI) {
					    $camera = $user_actions_panel.find("#camera");
					    $camera.attr("src", imageURI);
					},
					camera_fail = function onFail(message) {
					    alert('Failed because: ' + message);
					},
					no_camera_available_fadeOut = function(){
						$no_camera_available.fadeOut();
					}
				if(navigator.camera) {
					if($user_actions_panel.hasClass("hidden")){
						$user_actions_panel.removeClass("hidden");
						navigator.camera.getPicture(camera_success, camera_fail, {quality: 50, destinationType: Camera.DestinationType.FILE_URI });
					} else {
						$user_actions_panel.addClass("hidden");
					}
				} else {
					$no_camera_available.fadeIn("fast", function(){
						if(no_camera_available_timer) {
							clearTimeout(no_camera_available_timer);
						}
						no_camera_available_timer = setTimeout(no_camera_available_fadeOut, 2000);
					}).click(no_camera_available_fadeOut);
				}
			},
			current_time_in_epoch_milliseconds,
			$locations = $(".location"),
			geolocationWatchId,
			youarehere_hammer;
			

		if(last_known_position !== undefined) {
			last_known_position = JSON.parse(last_known_position);
			current_time_in_epoch_milliseconds = (new Date).getTime();
			if(last_known_position.timestamp < current_time_in_epoch_milliseconds - position_expires_after_milliseconds) {
				centerMap();
			} else {
				geolocationSuccess(last_known_position);
			}
		} else {
			centerMap();
		}
		geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);
		enable_map($("#map"));	
		if(Modernizr.touch) {
			//touch devices
		} else {
			//anything for desktop browsers
		}
		youarehere_hammer = $("#youarehere").hammer({
            prevent_default: true,
            scale_treshold: 0,
            drag_min_distance: 0
        });
        youarehere_hammer.bind("tap", toggle_user_actions_panel);

		//$locations.clickover({"placement":"top"})
		//$("#weta").css("margin-top", "-200px").clickover({"placement":"right"})
	});	
}(jQuery))
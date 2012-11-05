(function($){
	"use strict";
	// Wrapper for Bootstrap's PopOver
	// http://twitter.github.com/bootstrap/javascript.html#popovers
	// This wrapper ensures that all other popovers are closed when
	// a new one opens, and that they can be closed by clicking on
	// the body tag and so on.

	var existing_popovers = [],
		hammer_defaults = {
            prevent_default: true,
            scale_treshold: 0,
            drag_min_distance: 0
		},
		popover_init = function(event){
			$("body,#wrapper,#map").click(function(event){
				if($(event.target).is(this)) { //if we reached this event directly without bubbling...
					console.log("BODY CLICK");
					//window.hide_all_popovers_no_bubbling(event);
				}
			});
		},
		get_distance = function(latitude, longitude){
			var last_known_position = localStorage["geolocation-last-known-position"],
				current_time_in_epoch_milliseconds = (new Date).getTime(),
				distance_away_in_kilometers;
		    if(last_known_position !== undefined) {
				last_known_position = JSON.parse(last_known_position);
				if(last_known_position.timestamp > current_time_in_epoch_milliseconds - window.position_expires_after_milliseconds) {
					distance_away_in_kilometers = window.difference_between_positions_in_kilometers(last_known_position.coords.latitude, last_known_position.coords.longitude, latitude, longitude);
					return '<b class="distance_away">Distance: ' + window.format_distance(distance_away_in_kilometers) + '</b>';
				}
			}
			return "";
		}

	window.hide_all_popovers = function(event, except_this_one){
		console.log("hide all popovers")
		var $popover;
		while(existing_popovers.length){
			$popover = existing_popovers.pop();
			console.log("same as?", $popover.is(except_this_one))
			if(!except_this_one || !$popover.is(except_this_one)) {
				console.log("actually hiding")
				$popover.popover('hide');
			}
		}
	}

	window.hide_all_popovers_no_bubbling = function(event, except_this_one){
		window.hide_all_popovers(event, except_this_one)
		event.preventDefault();
		event.stopPropagation();
		if(event.originalEvent) {
			event.originalEvent.stopPropagation();
		}
	}

	window.hide_popover = function(event){
		//$(this).popover('hide');
	}

	window.toggle_popover = function(event, override_content){
		var	$this = $(this),
			content_template = $this.data("content-template"),
			options = {html: true, trigger: "manual"},
			old_options;
		hide_all_popovers(event, $this);
		if(override_content !== undefined) {
			options.content = override_content;
		} else if(content_template !== undefined) { //if there is a template then there is dynamic content. bootstrap popovers cache content so we need to destroy the content and then rebuild it
			console.log("custom template")
			options.content = content_template.replace(/\[DISTANCE\]/g,
				get_distance($this.data("latitude"), $this.data("longitude"))) + Math.random();
			old_options = $this.data('popover');
			if(old_options) {
				old_options.options.content = options.content;
				$this.data('popover', old_options);
			}
		} 
		$this.popover(options).popover('toggle');
		

		existing_popovers.push($this);
		event.stopPropagation();
		if(event.originalEvent) {
			event.originalEvent.stopPropagation();
		}
	}

	window.show_popover = function(event, override_content){
		var	$this = $(this),
			options = {html: true};
		hide_all_popovers(event, $this);
		if(override_content !== undefined) {
			options.content = override_content;
		}
		$this.popover(options).popover('show')
		existing_popovers.push($this);
		event.stopPropagation();
		if(event.originalEvent) {
			event.originalEvent.stopPropagation();
		}
	}

	if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", popover_init, false);
    } else {
        $(document).ready(popover_init);
    }

}(jQuery))
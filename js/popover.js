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
					window.hide_all_popovers_no_bubbling(event);
				}
			});
		};

	window.hide_all_popovers = function(event, except_this_one){
		var $popover;
		while(existing_popovers.length){
			$popover = $(existing_popovers.pop());
			if(!except_this_one || !$popover.is(except_this_one)) {
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
		$(this).popover('hide');
	}

	window.toggle_popover = function(event, override_content){
		var	$sender = $(this),
			options = {html: true};
		hide_all_popovers(event, $sender);
		if(override_content !== undefined) {
			options.content = override_content;
		}
		$sender.popover(options).popover('toggle');
		existing_popovers.push(this);
		event.stopPropagation();
		if(event.originalEvent) {
			event.originalEvent.stopPropagation();
		}
	}

	window.show_popover = function(event, override_content){
		var	$sender = $(this),
			options = {html: true};
		hide_all_popovers(event, $sender);
		if(override_content !== undefined) {
			options.content = override_content;
		}
		$sender.popover(options).popover('show')
		existing_popovers.push($sender);
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
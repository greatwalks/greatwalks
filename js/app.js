// Avoid `console` errors in browsers that lack a console.
if(!(window.console && console.log)) {
    (function() {
        var noop = function() {};
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
};/**
 * MBP - Mobile boilerplate helper functions
 */
(function(document) {

    window.MBP = window.MBP || {};

    /**
     * Fix for iPhone viewport scale bug
     * http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
     */

    MBP.viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]');
    MBP.ua = navigator.userAgent;

    MBP.scaleFix = function() {
        if (MBP.viewportmeta && /iPhone|iPad|iPod/.test(MBP.ua) && !/Opera Mini/.test(MBP.ua)) {
            MBP.viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
            document.addEventListener('gesturestart', MBP.gestureStart, false);
        }
    };

    MBP.gestureStart = function() {
        MBP.viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
    };

    /**
     * Normalized hide address bar for iOS & Android
     * (c) Scott Jehl, scottjehl.com
     * MIT License
     */

    // If we split this up into two functions we can reuse
    // this function if we aren't doing full page reloads.

    // If we cache this we don't need to re-calibrate everytime we call
    // the hide url bar
    MBP.BODY_SCROLL_TOP = false;

    // So we don't redefine this function everytime we
    // we call hideUrlBar
    MBP.getScrollTop = function() {
        var win = window;
        var doc = document;

        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    };

    // It should be up to the mobile
    MBP.hideUrlBar = function() {
        var win = window;

        // if there is a hash, or MBP.BODY_SCROLL_TOP hasn't been set yet, wait till that happens
        if (!location.hash && MBP.BODY_SCROLL_TOP !== false) {
            win.scrollTo( 0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1 );
        }
    };

    MBP.hideUrlBarOnLoad = function() {
        var win = window;
        var doc = win.document;
        var bodycheck;

        // If there's a hash, or addEventListener is undefined, stop here
        if ( !location.hash && win.addEventListener ) {

            // scroll to 1
            window.scrollTo( 0, 1 );
            MBP.BODY_SCROLL_TOP = 1;

            // reset to 0 on bodyready, if needed
            bodycheck = setInterval(function() {
                if ( doc.body ) {
                    clearInterval( bodycheck );
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar();
                }
            }, 15 );

            win.addEventListener('load', function() {
                setTimeout(function() {
                    // at load, if user hasn't scrolled more than 20 or so...
                    if (MBP.getScrollTop() < 20) {
                        // reset to hide addr bar at onload
                        MBP.hideUrlBar();
                    }
                }, 0);
            });
        }
    };

    /**
     * Fast Buttons - read wiki below before using
     * https://github.com/h5bp/mobile-boilerplate/wiki/JavaScript-Helper
     */

    MBP.fastButton = function(element, handler, pressedClass) {
        this.handler = handler;
        // styling of .pressed is defined in the project's CSS files
        this.pressedClass = typeof pressedClass === 'undefined' ? 'pressed' : pressedClass;

        if (element.length && element.length > 1) {
            for (var singleElIdx in element) {
                this.addClickEvent(element[singleElIdx]);
            }
        } else {
            this.addClickEvent(element);
        }
    };

    MBP.fastButton.prototype.handleEvent = function(event) {
        event = event || window.event;

        switch (event.type) {
            case 'touchstart': this.onTouchStart(event); break;
            case 'touchmove': this.onTouchMove(event); break;
            case 'touchend': this.onClick(event); break;
            case 'click': this.onClick(event); break;
        }
    };

    MBP.fastButton.prototype.onTouchStart = function(event) {
        var element = event.srcElement;
        event.stopPropagation();
        element.addEventListener('touchend', this, false);
        document.body.addEventListener('touchmove', this, false);
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;

        element.className+= ' ' + this.pressedClass;
    };

    MBP.fastButton.prototype.onTouchMove = function(event) {
        if (Math.abs(event.touches[0].clientX - this.startX) > 10 ||
            Math.abs(event.touches[0].clientY - this.startY) > 10) {
            this.reset(event);
        }
    };

    MBP.fastButton.prototype.onClick = function(event) {
        event = event || window.event;
        var element = event.srcElement;
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        this.reset(event);
        this.handler.apply(event.currentTarget, [event]);
        if (event.type == 'touchend') {
            MBP.preventGhostClick(this.startX, this.startY);
        }
        var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
        element.className = element.className.replace(pattern, '');
    };

    MBP.fastButton.prototype.reset = function(event) {
        var element = event.srcElement;
        rmEvt(element, 'touchend', this, false);
        rmEvt(document.body, 'touchmove', this, false);

        var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
        element.className = element.className.replace(pattern, '');
    };

    MBP.fastButton.prototype.addClickEvent = function(element) {
        addEvt(element, 'touchstart', this, false);
        addEvt(element, 'click', this, false);
    };

    MBP.preventGhostClick = function(x, y) {
        MBP.coords.push(x, y);
        window.setTimeout(function() {
            MBP.coords.splice(0, 2);
        }, 2500);
    };

    MBP.ghostClickHandler = function(event) {
        if (!MBP.hadTouchEvent && MBP.dodgyAndroid) {
            // This is a bit of fun for Android 2.3...
            // If you change window.location via fastButton, a click event will fire
            // on the new page, as if the events are continuing from the previous page.
            // We pick that event up here, but MBP.coords is empty, because it's a new page,
            // so we don't prevent it. Here's we're assuming that click events on touch devices
            // that occur without a preceding touchStart are to be ignored.
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        for (var i = 0, len = MBP.coords.length; i < len; i += 2) {
            var x = MBP.coords[i];
            var y = MBP.coords[i + 1];
            if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };

    // This bug only affects touch Android 2.3 devices, but a simple ontouchstart test creates a false positive on
    // some Blackberry devices. https://github.com/Modernizr/Modernizr/issues/372
    // The browser sniffing is to avoid the Blackberry case. Bah
    MBP.dodgyAndroid = ('ontouchstart' in window) && (navigator.userAgent.indexOf('Android 2.3') != -1);

    if (document.addEventListener) {
        document.addEventListener('click', MBP.ghostClickHandler, true);
    }

    addEvt(document.documentElement, 'touchstart', function() {
        MBP.hadTouchEvent = true;
    }, false);

    MBP.coords = [];

    // fn arg can be an object or a function, thanks to handleEvent
    // read more about the explanation at: http://www.thecssninja.com/javascript/handleevent
    function addEvt(el, evt, fn, bubble) {
        if ('addEventListener' in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.addEventListener(evt, fn, bubble);
            } catch(e) {
                if (typeof fn == 'object' && fn.handleEvent) {
                    el.addEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if ('attachEvent' in el) {
            // check if the callback is an object and contains handleEvent
            if (typeof fn == 'object' && fn.handleEvent) {
                el.attachEvent('on' + evt, function(){
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.attachEvent('on' + evt, fn);
            }
        }
    }

    function rmEvt(el, evt, fn, bubble) {
        if ('removeEventListener' in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.removeEventListener(evt, fn, bubble);
            } catch(e) {
                if (typeof fn == 'object' && fn.handleEvent) {
                    el.removeEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if ('detachEvent' in el) {
            // check if the callback is an object and contains handleEvent
            if (typeof fn == 'object' && fn.handleEvent) {
                el.detachEvent("on" + evt, function() {
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.detachEvent('on' + evt, fn);
            }
        }
    }

    /**
     * Autogrow
     * http://googlecode.blogspot.com/2009/07/gmail-for-mobile-html5-series.html
     */

    MBP.autogrow = function(element, lh) {
        function handler(e) {
            var newHeight = this.scrollHeight;
            var currentHeight = this.clientHeight;
            if (newHeight > currentHeight) {
                this.style.height = newHeight + 3 * textLineHeight + 'px';
            }
        }

        var setLineHeight = (lh) ? lh : 12;
        var textLineHeight = element.currentStyle ? element.currentStyle.lineHeight : getComputedStyle(element, null).lineHeight;

        textLineHeight = (textLineHeight.indexOf('px') == -1) ? setLineHeight : parseInt(textLineHeight, 10);

        element.style.overflow = 'hidden';
        element.addEventListener ? element.addEventListener('keyup', handler, false) : element.attachEvent('onkeyup', handler);
    };

    /**
     * Enable CSS active pseudo styles in Mobile Safari
     * http://alxgbsn.co.uk/2011/10/17/enable-css-active-pseudo-styles-in-mobile-safari/
     */

    MBP.enableActive = function() {
        document.addEventListener('touchstart', function() {}, false);
    };

    /**
     * Prevent default scrolling on document window
     */

    MBP.preventScrolling = function() {
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, false);
    };

    /**
     * Prevent iOS from zooming onfocus
     * https://github.com/h5bp/mobile-boilerplate/pull/108
     * Adapted from original jQuery code here: http://nerd.vasilis.nl/prevent-ios-from-zooming-onfocus/
     */

    MBP.preventZoom = function() {
        var formFields = document.querySelectorAll('input, select, textarea');
        var contentString = 'width=device-width,initial-scale=1,maximum-scale=';
        var i = 0;

        for (i = 0; i < formFields.length; i++) {
            formFields[i].onfocus = function() {
                MBP.viewportmeta.content = contentString + '1';
            };
            formFields[i].onblur = function() {
                MBP.viewportmeta.content = contentString + '10';
            };
        }
    };
})(document);/*globals alert Modernizr*/
(function($){
    "use strict";
    if(window.location.pathname.toString() !== "/" && window.location.pathname.toString().indexOf("index.html") === -1) return;
    var $carousel,
        $carousel_items,
        $navbar_bottom,
        $navbar_top,
        hammer_defaults = {
            prevent_default: true,
            scale_treshold: 0,
            drag_min_distance: 0
        },
        drag_distanceX_threshold = 10,
        drag_distanceX,
        drag_carousel = function(event){
            drag_distanceX = event.distanceX;
        },
        dragend_carousel = function(event){
            if(drag_distanceX === undefined) return;
            if(Math.abs(drag_distanceX) < drag_distanceX_threshold) return;
            if(drag_distanceX > 0) {
                $carousel.carousel('prev');
            } else {
                $carousel.carousel('next');
            }
            drag_distanceX = undefined;
        },
        adjust_carousel_height = function(event){
            var height = $(window).height() - $navbar_top.height() - $navbar_bottom.height() + 2,
                width =  $(window).width() + 1;
            if(height > 0) {
                $carousel.height(height);
                $carousel_items.height(height);
            }
        },
        index_init = function(event){
            $carousel = $('#carousel').carousel();
            $carousel_items = $carousel.find(".item");
            $navbar_bottom = $(".navbar-fixed-bottom");
            $navbar_top = $(".navbar-fixed-top");
            $(window).bind("resize orientationchange", adjust_carousel_height);
            adjust_carousel_height();
            if(!Modernizr.touch) {
                $carousel.find(".carousel-control").show();
            }
            $carousel_items.hammer(hammer_defaults).bind('drag', drag_carousel);
            $carousel_items.hammer(hammer_defaults).bind('dragend', dragend_carousel);
        };


    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", index_init, false);
    } else {
        $(document).ready(index_init);
    }
}(jQuery));

/*globals map_details difference_between_positions_in_kilometers format_distance geolocation position_expires_after_milliseconds Modernizr Camera alert*/
/* ===========================================================
 * map.js v1
 * Developed at Department of Conservation by Matthew Holloway
 * <matth@catalyst.net.nz>
 * -----------------------------------------------------------
 *
 * Provides maps with pinchzoom, drag scrolling etc with popups.
 *
 * ========================================================== */
(function($){
    "use strict";
    if(window.location.pathname.toString().indexOf("map-") === -1) return;
    (function(){
        var PIx = 3.141592653589793,
            degrees_to_radians = function(degrees) {
                return degrees * PIx / 180;
            },
            kilometres_to_miles = 0.621371,
            one_hour_in_milliseconds = 60 * 60 * 1000;

        window.format_distance = function(kilometres){
             return (Math.round(kilometres * 100) / 100) + "km / " + (Math.round(kilometres * kilometres_to_miles * 100) / 100) + "mi";
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

    var map_start = function(){
        if(window.map_details === undefined) { //are we on a map page? If not, there's nothing to do so just return
            return;
        }
        var centered_once_upon_load = false,
            open_tooltip,
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
                }
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
                        window.hide_all_popovers();
                    };

                //wrap = $('#wrap');
                width = $image.width();
                height = $image.height();
                offset = $image.offset();
                screenOrigin = {
                    x: 0,
                    y: 0
                };
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
                };

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
                        scale = 3;
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

                    return height = newHeight;/*IGNORE JSLINT COMPLAINT*/ /*UNFORTUNATELY JSLINT DOESN'T CURRENTLY ALLOW IGNORE ON LINES OF CODE (I THINK)*/
                });

                hammer.bind('transformend', function(event) {
                    return prevScale = scale;/*IGNORE JSLINT COMPLAINT*/ /*UNFORTUNATELY JSLINT DOESN'T CURRENTLY ALLOW IGNORE ON LINES OF CODE (I THINK)*/
                });
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
                    
                }
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
                    add_photo_to_map = function(imageURI, latitude, longitude){
                        $("#map").append( $("<a/>").addClass("location location-icon location-Campsite").data("content", "<img src='" + imageURI + "'>").click(window.toggle_popover));
                    },
                    camera_success = function(imageURI) {
                        var $camera = $("#camera");
                        $camera.attr("src", imageURI);
                        last_known_position = localStorage["geolocation-last-known-position"];
                        if(last_known_position !== undefined) {
                            last_known_position = JSON.parse(last_known_position);
                            if(last_known_position.timestamp < current_time_in_epoch_milliseconds - position_expires_after_milliseconds) {
                                add_photo_to_map(imageURI, last_known_position.coords.latitude, last_known_position.coords.longitude);
                            } else {
                                add_photo_to_map(imageURI, last_known_position.coords.latitude, last_known_position.coords.longitude);
                            }
                        }
                    },
                    camera_fail = function onFail(message) {
                        alert('Failed because: ' + message);
                    },
                    no_camera_available_fadeOut = function(){
                        $no_camera_available.fadeOut();
                    };

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
            youarehere_hammer,
            hammer_defaults = {
                prevent_default: true,
                scale_treshold: 0,
                drag_min_distance: 0
            };
            

        if(last_known_position !== undefined) {
            last_known_position = JSON.parse(last_known_position);
            current_time_in_epoch_milliseconds = (new Date()).getTime();
            if(last_known_position.timestamp < current_time_in_epoch_milliseconds - position_expires_after_milliseconds) {
                centerMap();
            } else {
                geolocationSuccess(last_known_position);
            }
        } else {
            centerMap();
        }

        if (navigator.geolocation) {
            geolocationWatchId = navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, geolocationSettings);
        } else {
            geolocationError();
        }
        
        enable_map($("#map"));
        if(Modernizr.touch) {
            $("#weta").hammer(hammer_defaults).bind('touchstart', window.toggle_popover);
            $("#map .location").hammer(hammer_defaults).bind('touchstart', window.toggle_popover);
            //touch devices
        } else {
            $("#weta").click(window.toggle_popover);
            $("#map .location").click(window.toggle_popover);
            //anything for desktop browsers
        }
        youarehere_hammer = $("#youarehere, #no_gps").hammer(hammer_defaults);
        youarehere_hammer.bind("tap", toggle_user_actions_panel);

        
    };

    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", map_start, false);
    } else {
        $(document).ready(map_start);
    }
}(jQuery));/*
 * Handles the navbars (including the bottom one, if it's there)
 */
(function($){
	"use strict";
	var navbar_init = function(){
		var $navbar_social = $("#share-social a"),
			navbar_timer,
			hide_social_popout = function(event){
				window.hide_popover.bind($navbar_social)(event);
			};
		$navbar_social.click(function(event){
			if(navbar_timer !== undefined) {
				clearTimeout(navbar_timer);
				navbar_timer = undefined;
			}
			window.toggle_popover.bind($navbar_social)(event);
			return false;
		});
		$(window).scroll(function(){
			if(navbar_timer !== undefined) {
				window.clearTimeout(navbar_timer);
				navbar_timer = undefined;
			}
			navbar_timer = window.setTimeout(hide_social_popout, 100);
		});
		$("#show_slideout_navigation").change(function(event){
			// When on a very small screen AND when the slideout navigation is exposed hide the logo because it will mess up the display
			var $this = $(this),
				$logo;
			if($(window).height() > 400 && $(window).width() > 400) return;
			$logo = $("#logo");
			if($this.is(":checked")) {
				$logo.hide();
			} else {
				$logo.show();
			}
			
			
		});
	};

	if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", navbar_init, false);
    } else {
        $(document).ready(navbar_init);
    }
}(jQuery));/*globals Connection */
/*
 * Responsible for making changes to pages based on whether the device is online or offline
 */
(function($){
    "use strict";
    var going_online_offline_init = function(){
            document.addEventListener("online", going_online, false);
            document.addEventListener("offline", going_offline, false);
            if(navigator.network && navigator.network.connection.type === Connection.NONE) {
                going_offline();
            } else { //either we're online or the browser can't tell us if it's online, so assume online
                going_online();
            }
        },
       going_online = function(){
            $("#share-social").show();
            $(".youtube").each(function(){
                var $this = $(this),
                    youtube_id = $this.data("youtube-id");
                $this.html($('<iframe width="560" height="315" frameborder="0" allowfullscreen></iframe>')
                    .attr("src", "http://www.youtube.com/embed/" + youtube_id));
            });
        },
       going_offline = function(){
            $("#share-social").hide();
            $(".youtube").each(function(){
                var $this = $(this);
                $this.empty();
            });
        };

    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", going_online_offline_init, false);
    } else {
        $(document).ready(going_online_offline_init);
    }
}(jQuery));/*
 * Wrapper for Bootstrap's PopOver
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * This wrapper ensures that all other popovers are closed when
 * a new one opens, and that they can be closed by clicking on
 * the body tag and so on.
 * NOTE: there's a popular plugin called BootstrapX that claims
 * to do the same but it was very buggy on touch devices.
 */
(function($){
    "use strict";

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
        },
        get_distance = function(latitude, longitude, include_description){
            var last_known_position = localStorage["geolocation-last-known-position"],
                current_time_in_epoch_milliseconds = (new Date()).getTime(),
                distance_away_in_kilometers,
                description_class = include_description ? "with-description" : "";

            if(last_known_position !== undefined) {
                last_known_position = JSON.parse(last_known_position);
                if(last_known_position.timestamp > current_time_in_epoch_milliseconds - window.position_expires_after_milliseconds) {
                    distance_away_in_kilometers = window.difference_between_positions_in_kilometers(last_known_position.coords.latitude, last_known_position.coords.longitude, latitude, longitude);
                    return '<b class="distance_away ' + description_class + '">Distance: ' + window.format_distance(distance_away_in_kilometers) + '</b>';
                }
            }
            return "";
        };

    window.hide_all_popovers = function(event, except_this_one){
        var $popover;
        while(existing_popovers.length){
            $popover = existing_popovers.pop();
            if(!except_this_one || !$popover.is(except_this_one)) {
                $popover.popover('hide');
            }
        }
    };

    window.hide_all_popovers_no_bubbling = function(event, except_this_one){
        window.hide_all_popovers(event, except_this_one);
        event.preventDefault();
        event.stopPropagation();
        if(event.originalEvent) {
            event.originalEvent.stopPropagation();
        }
    };

    window.hide_popover = function(event){
        $(this).popover('hide');
    };

    window.toggle_popover = function(event){
        var $this = $(this),
            content_template = $this.data("content-template"),
            popover_class = $this.data("popover-class"),
            options = {html: true, trigger: "manual", "placement": "top"},
            distance_placeholder = "[DISTANCE]",
            old_options,
            includes_description = false;
        window.hide_all_popovers(event, $this);
        if(popover_class) {
            options.template = '<div class="popover ' + popover_class + '"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>';
        }
        if(content_template !== undefined) { //if there is a template then there is dynamic content. bootstrap popovers cache content so we need to destroy the content and then rebuild it
            includes_description = (content_template.indexOf(distance_placeholder) + distance_placeholder.length + 5) < content_template.length;
            options.content = content_template.replace(distance_placeholder,
                get_distance($this.data("latitude"), $this.data("longitude"), includes_description));
            old_options = $this.data('popover');
            if(old_options) {
                old_options.options.content = options.content;
                $this.data('popover', old_options);
            }
        }
        $this.popover(options).popover('toggle');
        existing_popovers.push($this);
        if(event.originalEvent) {
            event.originalEvent.stopPropagation();
        }
        return false;
    };

    window.show_popover = function(event, override_content){
        var $this = $(this),
            options = {html: true};
        window.hide_all_popovers(event, $this);
        if(override_content !== undefined) {
            options.content = override_content;
        }
        $this.popover(options).popover('show');
        existing_popovers.push($this);
        event.stopPropagation();
        if(event.originalEvent) {
            event.originalEvent.stopPropagation();
        }
    };

    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", popover_init, false);
    } else {
        $(document).ready(popover_init);
    }
}(jQuery));/*global navigator document */
(function($){
    "use strict";
    var walk_init = function(){
        $(".walk-detail-header").click(function(){
            $(this).toggleClass("open").next(".walk-detail").slideToggle();
        });

        $(".dont-miss").click();
    };

    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", walk_init, false);
    } else {
        $(document).ready(walk_init);
    }
}(jQuery));
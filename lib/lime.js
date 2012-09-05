// Generated by CoffeeScript 1.3.1

/* Linked Media Player

 * handles the VideoJS player instance
 * fetches the annotations from the `options.annotFrameworkURL` SPARQL endpoint
 * Instantiate Plugins
 */

(function() {
	var Annotation, URI, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
		for (var key in parent) {
			if (__hasProp.call(parent, key))
				child[key] = parent[key];
		}
		function ctor() {
			this.constructor = child;
		}


		ctor.prototype = parent.prototype;
		child.prototype = new ctor;
		child.__super__ = parent.prototype;
		return child;
	};

	window.LIMEPlayer = (function() {

		LIMEPlayer.name = 'LIMEPlayer';

		function LIMEPlayer(opts) {
			var options, _this = this;
			options = {
				containerDiv : "mainwrapper",
				videoPlayerSize : {
					"width" : 640,
					"height" : 360
				},
				vPlayer : "VideoJS",
				// annotFrameworkURL : "http://188.40.162.36:8080/CMF/",
			   //  annotFrameworkURL : "http://connectme.salzburgresearch.at/CMF/",
			    annotFrameworkURL : "http://labs.newmedialab.at/SKOS/",
				plugins : [DBPediaDepictionPlugin, LDPlugin, GeoNamesMapPlugin, DBPediaAbstractPlugin, GoogleWeatherPlugin, AnnotationModalWindow],
				platform : "web",
				fullscreen : false,
				fullscreenLayout : {
					"AnnotationNorth" : 50,
					"AnnotationWest" : 300,
					"AnnotationSouth" : 50,
					"AnnotationEast" : 300
				},
				widgetContainers : [{
					element : jQuery('#widget-container-1'),
					orientation : 'vertical'
				}, {
						element : jQuery('#widget-container-2'),
						orientation : 'vertical'
					}],
				usedSpaceNWSE : {
					"north" : 50,
					"west" : 300,
					"south" : 50,
					"east" : 300
				},
				annotationsVisible : true,
				timeInterval : 1000
			};
			this.options = $.extend(options, opts);
			this._prepareWidgetContainers();
			this._initVideoPlayer(function() {
				return _this._loadAnnotations(function() {
					return _this._initPlugins(function() {
						return _this._startScheduler();
					});
				});
			});
		}


		LIMEPlayer.prototype._startScheduler = function() {
			/* handle becomeActive and becomeInactive events
			 */
			return jQuery(this).bind('timeupdate', function(e) {
				var annotation, currentTime, _i, _len, _ref, _results;
				_ref = this.annotations;
				_results = [];
				for ( _i = 0, _len = _ref.length; _i < _len; _i++) {
					annotation = _ref[_i];
					currentTime = e.currentTime;
					if (annotation.state === 'inactive' && annotation.start < currentTime && annotation.end + 1 > currentTime) {
						annotation.state = 'active';
						jQuery(annotation).trigger(jQuery.Event("becomeActive", {
							annotation : annotation
						}));
					}
					if (annotation.state === 'active' && (annotation.start > currentTime || annotation.end + 1 < currentTime)) {
						annotation.state = 'inactive';
						_results.push(jQuery(annotation).trigger(jQuery.Event("becomeInactive", {
							annotation : annotation
						})));
					} else {
						_results.push(
						void 0);
					}
				}
				return _results;
			});
		};

		LIMEPlayer.prototype._initVideoPlayer = function(cb) {
			var displaysrc, i, source, _i, _len, _ref, _this = this;
			displaysrc = '';
			_ref = this.options.video;
			for ( i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
				source = _ref[i];
				displaysrc = displaysrc + ("<source src=" + source + " type='video/" + (source.match(/.([a-z|A-Z|0-9]*)$/)[1]) + "' />");
			}
			$("#" + this.options.containerDiv).append("<div class='videowrapper' id='videowrapper'>\n  <video id='video_player' class='video-js vjs-default-skin' controls preload='none' width='640' height='360' poster='img/connectme-video-poster.jpg'>\n    " + displaysrc + "\n  </video>\n </div> <div class=\"annotation-wrapper\" id=\"annotation-wrapper\" style='display: none'>\n    <div class=\"north fullscreen-annotation\"  style='height: " + this.options.fullscreenLayout.AnnotationNorth + "px'></div>\n   <div class=\"west fullscreen-annotation\" style='width: " + this.options.fullscreenLayout.AnnotationWest + "px'></div>\n <div class=\"east fullscreen-annotation\"  style='width: " + this.options.fullscreenLayout.AnnotationEast + "px'></div>\n      <div class=\"south fullscreen-annotation\" style='height: " + this.options.fullscreenLayout.AnnotationSouth + "px'></div>\n </div>");
			return _.defer(function() {
				_this.player = _V_('video_player', {
					flash : {
						iFrameMode : true
					}
				});
				_this.player.addEvent("loadedmetadata", function() {

					_this._initEventListeners();
					return cb();
				});
				return _this.player.ready(function() {
					//SORIN - adding Sidebars component to VideoJS, as well as the annotation toggler
					_this.player.isFullScreen = _this.options.fullscreen, nonfullscreen_containers = LimePlayer.widgetContainers;
					_this.player.addComponent("AnnotationsSidebars");
					//add component to display 4 regions of annotations
					_this.player.controlBar.addComponent("AnnotationToggle");
					//add button to toggle annotations on/off in the control bar
					if (!_this.player.isFullScreen)
						_this.player.AnnotationsSidebars.hide();
					else
						_this.player.AnnotationsSidebars.show();
					//_this.player.AnnotationsSidebars.show();
					//END added SORIN

					_this.player.play();
					return console.info("Setting up VideoJS Player", _this.player);
				});
			});
		};

		LIMEPlayer.prototype._initEventListeners = function() {
			var _this = this;
			this.player.addEvent('timeupdate', function(playerEvent) {
				var e;
				e = jQuery.Event("timeupdate", {
					currentTime : _this.player.currentTime()
				});
				return jQuery(_this).trigger(e);
			});
			return this.player.addEvent('fullscreenchange', function(e) {
				//console.info('fullscreenchange', e);
				return _this._moveWidgets(_this.player.isFullScreen);
			});
		};

		LIMEPlayer.prototype._loadAnnotations = function(cb) {
			var query, _this = this;
			console.info("Loading annotations from LMF");
			this.annotations = [];
			query = "PREFIX oac: <http://www.openannotation.org/ns/>\nPREFIX ma: <http://www.w3.org/ns/ma-ont#>\nSELECT ?annotation ?fragment ?resource ?relation\nWHERE { <" + this.options.video[0] + ">  ma:hasFragment ?f.\n   ?f ma:locator ?fragment.\n   ?annotation oac:target ?f.\n   ?annotation oac:body ?resource.\n   ?f ?relation ?resource.\n}";
			return $.getJSON(this.options.annotFrameworkURL + "sparql/select?query=" + encodeURIComponent(query) + "&output=json", function(data) {
				var annotation, i, list;
				list = data.results.bindings;
				for (i in list) {
					annotation = list[i];
					_this.annotations.push(new Annotation(annotation));
				}
				return cb();
			});
		};

		LIMEPlayer.prototype._moveWidgets = function(isFullscreen) {
			/* added SORIN - toggle the annotations between fullscreen and normal screen */
			console.log("fullscreen", isFullscreen, ", Visible " + LimePlayer.options.annotationsVisible);
			if (isFullscreen && LimePlayer.options.annotationsVisible) {//entering fullscreen, switching to 4 fixed annotation areas
				LimePlayer.widgetContainers = [{
					element : jQuery('.west'),
					orientation : 'vertical'
				}, {
					element : jQuery('.north'),
					orientation : 'horizontal'
				}, {
					element : jQuery('.east'),
					orientation : 'vertical'
				}, {
					element : jQuery('.south'),
					orientation : 'horizontal'
				}];
				LimePlayer.player.AnnotationsSidebars.show();
				//show annotation sidebars as overlays
			} else {//restoring non-fullscreen view, using originally declared containers
				LimePlayer.widgetContainers = nonfullscreen_containers;
				LimePlayer.player.AnnotationsSidebars.hide();
				//hiding sidebars
			}
			for ( i = 0; i < LimePlayer.annotations.length; i++) {//retrigger becomeActive event on each active annotation to force plugins to redraw
				annotation = LimePlayer.annotations[i];
				if (annotation.state == 'active') {//to avoid duplicate display, we inactivate first, then reactivate them
					jQuery(annotation).trigger(jQuery.Event("becomeInactive", {
						annotation : annotation
					}));
					jQuery(annotation).trigger(jQuery.Event("becomeActive", {
						annotation : annotation
					}));
					
				}
			}
			/* end added SORIN */
		
			return console.info("_moveWidgets", isFullscreen);
		};

		LIMEPlayer.prototype._initPlugins = function(cb) {
			var pluginClass, _i, _len, _ref;
			this.plugins = [];
			_ref = this.options.plugins;
			for ( _i = 0, _len = _ref.length; _i < _len; _i++) {
				pluginClass = _ref[_i];
				this.plugins.push(new pluginClass(this));
			}
			LimePlayer.player.addComponent("MaskOverlaysComponent");
			LimePlayer.player.addComponent("ModalOverlaysComponent"); 
			return cb();
		};

		LIMEPlayer.prototype._prepareWidgetContainers = function() {
			console.log("prepare widget containers: "+ this.options.widgetContainers);
			return this.widgetContainers = this.options.widgetContainers;
		};

		LIMEPlayer.prototype.allocateWidgetSpace = function(options) {
			var container, _this = this;
			if(options == "GeoNamesMapPlugin" || options == "DBPediaAbstractPlugin")
			{
				container = _(this.widgetContainers).detect(function(cont) {
				//console.log("widget container" + _this._hasFreeSpace(cont, options));
				return _this._hasFreeSpace(cont, options);
			},1);
			//console.log("geonames widget container" + _(this.widgetContainers)+"for container: " + container.element.selector);
			}
			else{
			container = _(this.widgetContainers).detect(function(cont) {
				//console.log("widget container" + _this._hasFreeSpace(cont, options));
				return _this._hasFreeSpace(cont, options);
			},0);
			}
			
			//console.log("widget container" + container.element.selector);
			if (container) {
				container.element.prepend("<div class='lime-widget'></div>");
				return jQuery('.lime-widget:first', container.element);
			} 
		};

		LIMEPlayer.prototype._hasFreeSpace = function(container, options) {
			if(options == "GeoNamesMapPlugin" || options == "DBPediaAbstractPlugin") 
			{
				if(container.element.selector=="#widget-container-2" || container.element.selector==".east")
				{return true;}
				else{return false;}
			}
				else {
					return true;
				}			
		};

		LIMEPlayer.prototype.getAnnotationsFor = function(uri, cb) {
		};

		return LIMEPlayer;

	})();

	Annotation = (function() {

		Annotation.name = 'Annotation';

		function Annotation(hash) {
			var fragmentHash, startEnd, t, xywh, _ref, _ref1, _ref2, _ref3;
			this.annotation = hash.annotation.value;
			this.start = 0;
			this.end = -1;
			this.state = 'inactive';
			this.widgets = {};
			if (hash.fragment.type = 'uri') {
				this.fragment = new URI(hash.fragment.value);
				fragmentHash = this.fragment.hash;
				t = fragmentHash.match(/t=([0-9,]*)/);
				if (t) {
					t = t[1];
					startEnd = t.match(/([0-9]{1,})/g);
					if (startEnd) {
						this.start = Number(startEnd[0]);
						this.end = Number(startEnd[1]) || -1;
					}
				}
				xywh = fragmentHash.match(/xywh=([a-z0-9,:]*)/);
				if (xywh) {
					this.isPercent = xywh[1].indexOf('percent') !== -1;
					_ref = _(xywh[1].match(/([0-9]{1,})/g)).map(function(n) {
						return Number(n);
					}), this.x = _ref[0], this.y = _ref[1], this.w = _ref[2], this.h = _ref[3];
				}
			}
			this.isSpacial = this.x !==
			void 0 || ((((this.x === ( _ref3 = this.y) && _ref3 === ( _ref2 = this.w)) && _ref2 === ( _ref1 = this.h)) && _ref1 === 0));
			this.resource = new URI(hash.resource.value);
			this.relation = new URI(hash.relation.value);
		}

		return Annotation;

	})();

	URI = (function() {

		URI.name = 'URI';

		function URI(uri) {
			var hash;
			this.value = decodeURIComponent(uri);
			hash = uri.match(/^.*?#([a-zA-Z0-9,&=:]*)$/);
			if (hash) {
				this.hash = hash[1];
			} else {
				this.hash = '';
			}
			this.type = 'uri';
		}


		URI.prototype.toString = function() {
			return this.value;
		};

		return URI;

	})();

	/* Abstract Lime Plugin
	 */

	window.LimePlugin = (function() {

		LimePlugin.name = 'LimePlugin';

		function LimePlugin(lime) {
			this.lime = lime;
			this.init();
		}


		LimePlugin.prototype.init = function() {
			return console.error("All Lime plugins have to implement the init method!");
		};

		return LimePlugin;

	})();
	
_V_.MaskOverlaysComponent = _V_.Component.extend({
	
		createElement : function() {//we create a "mask" div which will hold the overlays written in via jQuery
			var f = _V_.createElement("div", {
				className : "mask"
				
			});
			return f;
		},
	});

_V_.ModalOverlaysComponent = _V_.Component.extend({
	     createElement : function() {//we create a "window" div which will hold the overlays written in via jQuery
			var f = _V_.createElement("div", {
				className : "modalwindow"
				
			});
			return f;
		},
	});

// ------------------------DBPedia MAP Plugin ------------------------------------------------	
/*	window.MapPlugin = (function(_super) {

		__extends(MapPlugin, _super);

		MapPlugin.name = 'MapPlugin';

		function MapPlugin() {
			return MapPlugin.__super__.constructor.apply(this, arguments);
		}


		MapPlugin.prototype.init = function() {
			var annotation, _i, _len, _ref, _results, _this = this;
			console.log("Initialize MapPlugin");
			//console.info("annotations", this.lime.annotations);
			jQuery(this.lime).bind('timeupdate', function(e) {
			});
			_ref = this.lime.annotations;
			_results = [];
			for ( _i = 0, _len = _ref.length; _i < _len; _i++) {
				annotation = _ref[_i];
				jQuery(annotation).bind('becomeActive', function(e) {
					var domEl;
					//console.info(e.annotation, 'became active');
					domEl = _this.lime.allocateWidgetSpace();
					if (domEl) {
						//if (e.annotation.resource.value.indexOf("geonames") > 0 && e.annotation.resource.value.indexOf("about.rdf") < 0) {
						//	e.annotation.resource.value += "/about.rdf";
						//	console.log(e.annotation.resource.value);
						//}
						//domEl.html("<a href='" + e.annotation.resource + "' target='_blank' >" + e.annotation.resource + "</a>");
						if (e.annotation.ldLoaded) {
							domEl.html(_this.renderAnnotation(e.annotation));
						} else {
							jQuery(e.annotation).bind('ldloaded', function(e2) {
								return domEl.html(_this.renderAnnotation(e.annotation));
							});
							//console.log(_this.renderAnnotation(e.annotation));
						}
						return e.annotation.widgets.MapPlugin = domEl;
					} else { debugger;
					}
				});
				_results.push(jQuery(annotation).bind("becomeInactive", function(e) {
					//console.info(e.annotation, 'became inactive');
					e.annotation.widgets.MapPlugin.remove();
					return
					delete e.annotation.widgets.MapPlugin;
				}));
			}
			return _results;
		};

		MapPlugin.prototype.renderAnnotation = function(annotation) {
			var latDeg, latMin, latSec, lonDeg, lonMin, lonSec, props, _ref, _ref1, latitude, logitude, queryString;
			var hasCoord = false;
			var locationName = "";
			//console.info("rendering", annotation);
			props = annotation.entity[annotation.resource.value];
			//console.log(props);
			try {
				locationName = ( _ref = props['http://dbpedia.org/property/latDeg']) != null ? _ref[0].value : "";
				latDeg = ( _ref = props['http://dbpedia.org/property/latDeg']) != null ? _ref[0].value : -1;
				latMin = ( _ref = props['http://dbpedia.org/property/latMin']) != null ? _ref[0].value : -1;
				latSec = ( _ref = props['http://dbpedia.org/property/latSec']) != null ? _ref[0].value : -1;
				lonDeg = ( _ref = props['http://dbpedia.org/property/lonDeg']) != null ? _ref[0].value : -1;
				lonMin = ( _ref = props['http://dbpedia.org/property/lonMin']) != null ? _ref[0].value : -1;
				lonSec = ( _ref = props['http://dbpedia.org/property/lonSec']) != null ? _ref[0].value : -1;
				if (latMin != -1 && lonMin != -1 && latSec != -1 && lonSec != -1) {
					hasCoord = true;
					// Coordinate transformation
					latsign = 1;
					lonsign = 1;
					// Latitude
					if (latDeg < 0) {
						latsign = -1;
					}
					absdlat = Math.abs(Math.round(latDeg * 1000000.));
					// absolute Long degrees (int)
					latMin = Math.abs(Math.round(latMin * 1000000) / 1000000);
					//Long min validation
					absmlat = Math.abs(Math.round(latMin * 1000000));
					//absolute Long mins (int)
					latSec = Math.abs(Math.round(latSec * 1000000.) / 1000000);
					//Long sec validation
					absslat = Math.abs(Math.round(latSec * 1000000.));
					//absolute Long sec (int)

					// Longitude
					if (lonDeg < 0) {
						lonsign = -1;
					}
					absdlon = Math.abs(Math.round(lonDeg * 1000000));
					// absolute Long degrees (int)
					lonMin = Math.abs(Math.round(lonMin * 1000000) / 1000000);
					//Long min validation
					absmlon = Math.abs(Math.round(lonMin * 1000000));
					//absolute Long mins (int)
					lonSec = Math.abs(Math.round(lonSec * 1000000) / 1000000);
					//Long sec validation
					absslon = Math.abs(Math.round(lonSec * 1000000));
					//absolute Long sec (int)

					latitude = Math.round(absdlat + (absmlat / 60.) + (absslat / 3600.)) * latsign / 1000000;
					longitude = Math.round(absdlon + (absmlon / 60) + (absslon / 3600)) * lonsign / 1000000;

				//	console.log("latitude: " + latDeg + "-" + latMin + "-" + latSec + "| longitude: " + lonDeg + "-" + lonMin + "-" + lonSec);
					queryString = "http://maps.google.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=9&size=400x300&format=png&maptype=roadmap&markers=color:green|label:x|" + latitude + "," + longitude + "&sensor=false&";
				}
			} catch(exception) {
			}
			//label = _(props['http://www.w3.org/2000/01/rdf-schema#label']).detect(function(labelObj) {
			//	return labelObj.lang === 'en';
			//}).value;
			//depiction = ( _ref = props['http://xmlns.com/foaf/0.1/depiction']) != null ? _ref[0].value :
			//void 0;
			//page = ( _ref1 = props['http://xmlns.com/foaf/0.1/page']) != null ? _ref1[0].value :
			//void 0;
			//console.info(label, depiction);
			if (hasCoord) {
				return "<div  style=\"background-color: lightgreen; height: 250px\" >	<img style=\"width: 100%; height: 180px\" src=\"" + queryString + "\"> " + "<div id=\"mapLabel\" style=\"width: inherit; height: 25%; font-family:verdana; font-size:14px; background-image: linear-gradient(bottom, rgb(33,26,20) 32%, rgb(69,61,55) 66%, rgb(28,22,21) 15%); background-image: -o-linear-gradient(bottom, rgb(33,26,20) 32%, rgb(69,61,55) 66%, rgb(28,22,21) 15%); background-image: -moz-linear-gradient(bottom, rgb(33,26,20) 32%, rgb(69,61,55) 66%, rgb(28,22,21) 15%); background-image: -webkit-linear-gradient(bottom, rgb(33,26,20) 32%, rgb(69,61,55) 66%, rgb(28,22,21) 15%); background-image: -ms-linear-gradient(bottom, rgb(33,26,20) 32%, rgb(69,61,55) 66%, rgb(28,22,21) 15%); background-image: -webkit-gradient(	linear,	left bottom, left top, color-stop(0.32, rgb(33,26,20)), color-stop(0.66, rgb(69,61,55)), color-stop(0.15, rgb(28,22,21))); color: white;\">" + "<table>" + "<tr>" + "<td>" + "<img src=\"img/mapIcon.png\" style=\"width: 40px; height: 40px;\" />" + "</td>" + "<td>" + "<em style=\"font-size:22px; color: white;\">" + locationName + "</em>" + "</td>" + "</tr>" + "<table>" + "&nbsp;&nbsp;  lat: " + latitude + "; long: " + longitude + "</div>"

			} else {
				return "";
			}

		};

		return MapPlugin;

	})(window.LimePlugin);

*/
}).call(this);
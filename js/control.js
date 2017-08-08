var player = (function () {
    var my = {};
    my.dev = false;
    my.mode = get_var('mode');

    /*
        Some of these should not be globals.
     */
	my.restart = true;
    my.displayId = '';
    my.param = [];
    my.schedule = {};
    my.online = '';
    my.weather = new Weather();
    my.currentLoopPosition = 0;
    my.preview = false;
    my.error = '';
    my.pixelRatio = '1';
	my.timeouts = [];
	my.time = Date.now();

	// Configuration
	my.version = "1.0";
    my.heartRate = 300; // 300 seconds - 5 minutes
    my.weatherUpdate = 900; // 15 minutes
    my.paramUpdate = 900; // 15 minutes
	my.pingURL = 'http://shineemc.com/shine2/root.php';
	my.popUrl = 'http://shineemc.com/shine2/data/player/storePop.php';
	my.presentationUrl = 'http://shineemc.com/shine2/data/fabric/loadPresentation.php';
	my.heartbeatUrl = 'http://shineemc.com/shine2/data/player/getHeartbeat.php';
	my.paramUrl = 'http://shineemc.com/shine2/data/player/getDisplayParam.php';
	my.rebootUrl = 'data/reboot.php';
	my.updateUrl = 'data/update.php';
	my.localDisplayUrl = 'data/getDisplayId.php';
    
    // Monkey patch in support for anim parameter
    fabric.Object.prototype.toObject = (function (toObject) {
        return function () {
            return fabric.util.object.extend(toObject.call(this), {
                anim: this.anim
            });
        };
    })(fabric.Object.prototype.toObject);
    fabric.Object.NUM_FRACTION_DIGITS = 17;
    fabric.Object.prototype.transparentCorners = false;
    my.canvas1 = new fabric.StaticCanvas('c1');
    my.canvas2 = new fabric.StaticCanvas('c2');


    /*
     *   init starts the player.
     *   call from doc.body.onload
     */

    my.init = function() {
		JL().debug("\n\n\n");
        JL().debug("Player started");

		// Set up font holder in html
        my.configureFonts();

		// Draw default opening presentation.
        if (my.mode === 'playlist' || my.mode === 'master') {
            $('.canvas-holder').css('top', '52px');
            my.drawDefaultWebPresentation(my.canvas1);
        } else {
            my.drawDefaultPresentation(my.canvas1);
        }
		
		// Handle playlist only mode from website
        if (my.mode === 'playlist') {
            my.startPlaylistMode();
        } else {
			// Start master player here.

			clearTimeout(my.timeouts['main']);
            my.timeouts['main'] = setTimeout(function() {
                $.when(my.getDisplayId()).then(function () {
                    my.waitForLocalCache();
					$.when(my.checkNetwork()).then(function () {
                        $.when(my.updateParam()).then(function () {
                            $.when(my.updateWeather()).then(function () {
                                $.when(my.updateTides()).then(function () {
                                    my.updateSchedule();
                                });
                            });
                        });
					});
                });
            }, 5000);
        }
    };



    my.waitForLocalCache = function () {
        console.log("Waiting");
        // No good starting the player without params.
        localforage.getItem('param').then(function(param){
            if (param === null || param === 'null') {
                my.error = 'Local Params not found, waiting on Cloud.';
				//JL().debug('Local Params not found, waiting on Cloud.');
                // Set timer and keep checking param cache
                clearTimeout(my.timeouts['cache']);
				my.timeouts['cache'] = setTimeout(function() {my.waitForLocalCache();}, 100);
            } else {
                JL().fatalException("Startup parameters: ", param);
                my.param = param;
                my.canvas1.setWidth(param[0].w);
                my.canvas1.setHeight(param[0].h);
                my.canvas2.setWidth(param[0].w);
                my.canvas2.setHeight(param[0].h);


                // The schedule is useless without the params. delay first check.
                localforage.getItem('schedule').then(function(scheduleCache){
                    if (scheduleCache === 'null') {
                        my.error = 'Local schedule not found, waiting on Cloud.';
                        // Set timer and keep checking schedule cache
						clearTimeout(my.timeouts['cache']);
						my.timeouts['cache'] = setTimeout(function() {my.waitForLocalCache();}, 100);
                    } else {
                        ////////////////////////////////////////////////////////////////////////////////////
                        // START PLAYER HERE
                        //
                        ////////////////////////////////////////////////////////////////////////////////////
                        my.schedule = scheduleCache;
                        JL().fatalException("Schedule data", my.schedule);

						console.log("Next presentation Id", my.schedule.schedule[0].masterPlaylist[0]);
						if (my.preview) {
							console.log("We are in preview mode.", my.preview);
							my.goFullScreen();
						} else {
							console.log("We are not in preview mode.", my.preview);
						}
						my.loadNextPresentation();
                    }
                });
            }
        });
    };


    my.updateSchedule = function() {
        if (my.online) {
            $.ajax({
                type: 'GET',
                url: my.heartbeatUrl,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: {
                    displayId: my.displayId,
                    previewMode: my.preview,
					restart: my.restart,
					version: my.version
                }
            }).done(
                function (data) {
					console.log("Memory usage", performance.memory);
					var mem = window.performance.memory;
					JL().debug("Total Memory "+mem.jsHeapSizeLimit+" Used memory "+mem.usedJSHeapSize);
					my.restart = false;
                    localforage.setItem('schedule', data).then(function(v) {
                        // Do stuff here.
                        my.schedule = data;
                        JL().debug("Retrieved schedule data");
                    });
                    if (!(my.mode === 'playlist' || my.mode === 'master')) {
						console.log('Sending proof of play.'); 
						my.sendPOP();
							
						// Here's where we need to react to any update/reboot commands
						// Reboot
						if (data.reboot === 'true') {
							JL().debug("Rebooting computer due to request from cloud. data.reboot is "+data.reboot);
							$.ajax({url: my.rebootUrl});
						}
						// Update
						if (data.update === 'true') {
							console.log("Update is true.");
							JL().debug("Update is true.");
							// AJAX call here to retrieve and execute update script.
							$.ajax({url: my.updateUrl});
						} else {
							console.log("Update is false.");
							JL().debug("Update is false.");
						}
					}
					clearTimeout(my.timeouts['schedule']);
					my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, my.heartRate * 1000);
                }
            ).error(
                function (jqXHR, textStatus, errorThrown) {
                    JL().debug(textStatus);
                    JL().debug(jqXHR);
                    JL().debug("Could not get schedule. Checking network.");
                    my.online = false;
					clearTimeout(my.timeouts['schedule']);
					my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
                }
            );
        } else {
            my.checkNetwork();
			clearTimeout(my.timeouts['schedule']);
			my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
        }
    };

    my.updateParam = function () {
        if (my.online) {
            $.ajax(
                {type: 'GET', url: my.paramUrl, data: {id: my.displayId, online: my.online}}
            ).done(
                function(data) {
                    data = eval(data);
					data[0].dimming = JSON.parse(data[0].dimming);
                    JL().fatalException('displayParam', data);
                    localforage.setItem('param', data).then(function(v) {
                        // Do stuff here.
                        my.param = data;
                        console.log("Retrieved param data");
                    });
                    my.online = true;
					clearTimeout(my.timeouts['param']);
					my.timeouts['param'] = setTimeout(function(){my.updateParam();}, my.paramUpdate * 1000);
                }
            ).error(
                function() {
                    JL().debug("Could not get param from AJAX call. Checking network.");
					localforage.getItem('param').then(function(param){
						my.param = param;
					});
                    my.online = false;
					clearTimeout(my.timeouts['param']);
					my.timeouts['param'] = setTimeout(function(){my.updateParam();}, my.paramUpdate * 1000);
					//my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
                }
            );
        } else {
            JL().debug("Could not get param. Not online.");
            my.checkNetwork();
			clearTimeout(my.timeouts['param']);
			my.timeouts['param'] = setTimeout(function(){my.updateParam();}, 1000);
        }
    };

    my.updateWeather = function () {
		if (my.online) {
            my.weather.update(my.param[0].zip).then(function(){
                localforage.setItem('weather', my.weather.data).then(function(v) {});
            });
			clearTimeout(my.timeouts['weather']);
			my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, my.weatherUpdate * 1000);
        } else {
            console.log("Could not get weather. Checking network.");
            my.checkNetwork();
			clearTimeout(my.timeouts['weather']);
			my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, 1000);
        }
    };

    my.updateTides = function () {
        if (my.param[0].station === 'undefined') {return;}
        console.log("Getting tides for station: "+my.param[0].station)
        if (my.online) {
            my.weather.tides(my.param[0].station).then(function(){
                localforage.setItem('tides', my.weather.tideData).then(function(v) {});
            });
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, my.weatherUpdate * 1000);
        } else {
            console.log("Could not get tides. Checking network.");
            my.checkNetwork();
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, my.weatherUpdate * 1000);
        }
    };

    my.loadNextPresentation = function () {
        my.dimming();
        //if (my.mode !== 'playlist') {my.getCurrentDaypart(my.schedule);}

        console.log("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+my.schedule.schedule[0].masterPlaylist.length+" items.");
		//JL().debug("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+my.schedule.schedule[0].masterPlaylist.length+" items.");
        if (my.currentLoopPosition == my.schedule.schedule[0].masterPlaylist.length) {
            JL().debug("Resetting loop");
            my.currentLoopPosition = 0;
        }

        var presId = my.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].pid;
		var coid = my.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].coid;
        if (my.mode == 'playlist' || my.mode == 'master') {
            console.log("My mode is: "+my.mode);
            var version = my.schedule.schedule[0].presentations[presId].version;
            var name = my.schedule.schedule[0].presentations[presId].name;
            var tagStr = '';
            if (my.schedule.schedule[0].presentations[presId].tags !== '') {
                var tags = JSON.parse(my.schedule.schedule[0].presentations[presId].tags);
				//console.log("Raw tags are: ", my.schedule.schedule[0].presentations[presId].tags);
                //console.log("Tags are: ", tags);
				if (tags === 'null') {
					console.log("No tags");
				} else {
					for (var i = 0; i < tags.length; i++) {
						tagStr += tags[i].name + ", ";
					}
					tagStr = tagStr.substring(0, tagStr.length - 2);
				}
            } else {
                console.log("No tags");
            }
            $('#statusLeft', parent.document).text(presId+"v"+version+": "+name);
            $('#statusRight', parent.document).text("Tags: "+tagStr);
            // Here we need to add in code to show presentation info and check cache for updates.
            localforage.getItem('param').then(function(param) {
                //param[0].dimming = JSON.parse(param[0].dimming);
                my.param = param;
                console.log("Change rate: ", my.param[0].cr);
				clearTimeout(my.timeouts['presentation']);
				my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, my.param[0].cr * 1000);
            });
        } else {
			clearTimeout(my.timeouts['presentation']);
			my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, my.param[0].cr * 1000);
        }
        if (isEven(my.currentLoopPosition)) {
            my.loadPresentation(my.canvas2, presId, coid);
        } else {
            my.loadPresentation(my.canvas1, presId, coid);
        }
    };

    my.logPOP = function (presId, coid, version) {
        var pop = [];
        console.log("Proof of play: "+presId+" v: "+version);
        localforage.getItem('pop').then(function(v){
            if (v === null) {
				pop = [];
                var now = new Date();
                pop.push({'displayId': my.displayId, 'coid': coid, 'time': (now.getTime() / 1000), 'duration': my.param[0].cr, 'presId': presId, 'version': version});
                localforage.setItem('pop', pop);
            } else {
                pop = v;
                var now = new Date();
                pop.push({'displayId': my.displayId, 'coid': coid, 'time': (now.getTime() / 1000), 'duration': my.param[0].cr, 'presId': presId, 'version': version});
                localforage.setItem('pop', pop);
            }
        });

    };

    my.sendPOP = function() {
		JL().debug("Sending POP.");
        localforage.getItem('pop').then(function(v) {
			if (v === null) {return;}
            // Foreach POP if displayId doesn't match current, discard. Removes any left over from testing.
			var totalRecords = v.length;
			for (var i in v) {
				if (v[i].displayId !== my.displayId) {
					JL().debug("Current Display is "+my.displayId+" and POP display is "+v[i].displayId+", discarding.");
					v.splice(i, 1);
				}
			}

			if (v.length > 200) {
				var batch = v.splice(0, 200);
			} else {
				var batch = v;
			}

            if (my.online) {
				JL().debug("POP records: "+totalRecords+". Sending: "+batch.length+".");
                console.log("batch", batch);
                var popres = $.ajax({
                    type: 'POST',
                    url: my.popUrl,
                    data: {
                        pop: batch
                    }
                }).done(
                    function (data) {
                        JL().debug("Done: Proof of play data successfully sent.\n\n");
						localforage.getItem('pop').then(function(pop) {
							var b = pop.splice(batch.length, pop.length);
							localforage.setItem('pop', b);
						});
                    }
                ).error(
                    function (jqXHR, textStatus, errorThrown) {
                        JL().debug(textStatus);
                        JL().debug(jqXHR);
                        JL().debug("There was an issue sending POP data to the server.");
                    }
                );
            }
        });
    };

    my.dimming = function(){
        if (my.preview) {return;} else {console.log("We are not in preview mode.");}
        localforage.getItem('weather').then(function(v) {
			var sunrise = new Date();
			sunrise.setHours(v.sun_phase.sunrise.hour);
			sunrise.setMinutes(v.sun_phase.sunrise.minute);
			var sunset = new Date();
			sunset.setHours(v.sun_phase.sunset.hour);
			sunset.setMinutes(v.sun_phase.sunset.minute);
			
            if (v === 'null') {
                JL().debug("Could not get dimming data. Will retry.");
				console.log("Could not get dimming data. Will retry.");
				clearTimeout(my.timeouts['dimming']);
				my.timeouts['dimming'] = setTimeout(function(){my.dimming();}, 1000);
            } else {
                var clouds = '70';
                //JL().debug("Sunrise: "+sunrise+" Sunset: "+sunset+" Cloud cover: "+clouds);
				console.log("Sunrise: "+sunrise+" Sunset: "+sunset+" Cloud cover: "+clouds);
                var now = new Date();
                if (now > sunrise && now < sunset) {
                    console.log("It's daytime. "+my.param[0].dimming.day);
                    $('.dimmer').css('opacity', "." + (100 - my.param[0].dimming.day));
                    if (clouds >= 75) {
                        //console.log("And overcast");
                        $('.dimmer').css('opacity', "." + (100 - my.param[0].dimming.overcast));
                    }
                } else {
                    console.log("It's night.", now);
                    $('.dimmer').css('opacity', "." + (100 - my.param[0].dimming.night));
                }
            }
        });
    };

    my.loadPresentation = function(canvas, presid, coid){
        JL().debug("Loading presentation "+presid+".");
		
        if (my.preview) {
            canvas.setHeight(my.param[0].h);
            canvas.setWidth(my.param[0].w);
        }
		var objects = canvas.getObjects();
        var origObj = objects.length;
        for (i = 0; i < origObj; i++) {
            var o = objects[i];
			canvas.remove(o);
		}
        canvas.clear();
        canvas.setBackgroundColor('#FFFFFF', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.loadFromJSON(my.schedule.schedule[0].presentations[presid].json, function(){
            console.log("Canvas has loaded");
            if (!my.preview) {
                my.logPOP(presid, coid, my.schedule.schedule[0].presentations[presid].version);
            }
            if (my.preview) {my.zoomFullScreenPlayer(canvas);}
            if(!my.schedule.schedule.ani_allow){console.log("Loading animations"); my.anim.load(canvas);}
            if(!my.schedule.schedule.trans_allow){my.transitions.load(canvas);}
			my.change(my.currentLoopPosition);
			my.currentLoopPosition++;
        });
    };

	my.change = function(currPos) {
		//var diff = Date.now() - my.time;
		//JL().debug("Diff is "+diff / 1000+". Change rate is "+my.param[0].cr+".");
		//my.time = Date.now();
		clearTimeout(my.timeouts['change']);
		my.timeouts['change'] = setTimeout(function(){
            if (isEven(currPos)) {
                $("#c2").css("zIndex", 1);
                $("#c").css("zIndex", 0);
            } else {
                $("#c2").css("zIndex", 0);
                $("#c").css("zIndex", 1);
            }
        }, 500);
    };

    my.checkNetwork = function() {
        return $.get(my.pingURL, function(){
            JL().debug("CheckNetwork: We are online.");
			console.log("CheckNetwork: We are online.");
            my.online = true;
			/* TODO:
				IF (time condition) {reboot;}
			*/
        }).fail(function(jqXHR, exception) {
            JL().fatalException("CheckNetwork: We are offline.", jqXHR);
			console.log("CheckNetwork: We are offline.");
            my.online = false;
        });
    };

    my.goFullScreen = function() {
        //console.log("going full screen.");
        // Get height and width of browser window.
        var browserWidth = $(window).width();
        var browserHeight = $(window).height();
        var hpr = Math.floor(browserHeight / my.param[0].h);
        my.pixelRatio = Math.floor(browserWidth / my.param[0].w);
        if (my.pixelRatio > hpr) {my.pixelRatio = hpr;}
        var previewWidth= my.pixelRatio * my.param[0].w;
        var previewHeight = my.pixelRatio *my.param[0].h;
        var leftMargin = (browserWidth - previewWidth) / 2;
        var topMargin = (browserHeight - previewHeight) / 2;

        console.log("Browser Dims: "+browserHeight+" X "+browserWidth);
        console.log("Presentation Dims: "+my.param[0].w+" X "+my.param[0].h);
        console.log("Pixel ratio is: "+my.pixelRatio);

        $('.canvas-holder').css("top", topMargin);
        $('.canvas-holder').css("left", leftMargin);

    };

    my.zoomFullScreenPlayer = function(canvas) {
        console.log("Zooming by "+my.pixelRatio);
        my.zoom(my.pixelRatio, canvas);
        if (my.pixelRatio > 4) {
            var pixelMask = 'img/'+my.pixelRatio+'.png';
            canvas.setOverlayImage(pixelMask, canvas.renderAll.bind(canvas));
        }

    };

    my.zoom = function (factor, canvas) {
        console.log("Factor: "+factor, canvas);

        canvas.setHeight(canvas.getHeight() * factor);
        canvas.setWidth(canvas.getWidth() * factor);
        if (canvas.backgroundImage) {
            // Need to scale background images as well
            var bi = canvas.backgroundImage;
            bi.width = bi.width * factor; bi.height = bi.height * factor;
        }
        var objects = canvas.getObjects();
        console.log("Objects", objects);
        var origObj = objects.length;
        for (i = 0; i < origObj; i++) {
        //for (var i in objects) {
            var o = objects[i];
            var scaleX = o.scaleX;
            var scaleY = o.scaleY;
            var left = o.left;
            var top = o.top;

            var tempScaleX = scaleX * factor;
            var tempScaleY = scaleY * factor;
            var tempLeft = left * factor;
            var tempTop = top * factor;

            o.scaleX = tempScaleX;
            o.scaleY = tempScaleY;
            o.left = tempLeft;
            o.top = tempTop;
            o.setCoords();
        }
        canvas.renderAll();
    };

    my.getDisplayId = function(){
        var get_id = get_var('id');
        if (get_id !== false) {
            console.log("Player started in preview mode. Display Id: "+get_id);
            my.displayId = get_id;
            my.preview = true;
            $('.dimmer').hide();
        } else {
            var p = $.ajax({
                type: 'GET',
                url: my.localDisplayUrl
            }).done(
                function (data) {
                    console.log("Done getting display data.");
                    if (data !== 'error') {
                        JL().debug("Get display Id: " + data);
                        my.displayId = data;
                    } else {
                        JL().debug("There was an error getting the display Id.");
                    }
                }
            );
            return p;
        }
    };
	
	/* Playlist functions */
    my.checkLoadStatus = function(items){
        console.log("Checking load status");
        var complete = true;
        for (i = 0; i < items.length; i++) {
            if (typeof(my.schedule.schedule[0].presentations[items[i]]) === 'undefined') {
                JL().fatal("We don't have "+items[i]);
                complete = false;
            }
        }
        if (complete) {
            my.loadNextPresentation();
        } else {
			clearTimeout(my.timeouts['load']);
			my.timeouts['load'] = setTimeout(function(){my.checkLoadStatus(items);}, 1000);
        }
    };

    my.loadPreview = function(id) {
        console.log("Getting presentation id: "+id);
        $.ajax({
            type: 'GET',
            url: my.presentationUrl,
            data: {
                id: id
            },
            success: function(data) {
                data.json = JSON.parse(data.json);
                console.log("Storing Data", data);
                my.schedule.schedule[0].presentations[id] = data;
            }
        });
    };
	
	/* Default presentations */
    my.drawDefaultPresentation = function(canvas) {
        canvas.clear();
        canvas.setBackgroundColor('#FFFFFF', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.setBackgroundColor('rgba(0, 0, 0, 1)', canvas.renderAll.bind(canvas));
        var rect = new fabric.Rect({width: 10, height: 10, fill: '#000'});
        canvas.add(rect);
        rect.set('anim', 'blink');
        var text = new fabric.Text("time", {fill: '#FFF', anim: 'time', left: 15, fontSize: 8});
        canvas.add(text);
        var err = new fabric.Text(my.error, {fill: '#FFF', top: 10, fontSize: 10});
        canvas.add(err);
        canvas.renderAll();
        my.anim.load(canvas);
    };

	my.startPlaylistMode = function () {
		console.log('We are working with a playlist.');

		my.displayId = get_var('id');
        my.param[0] = {'h': get_var('h'), 'w': get_var('w'), 'cr': get_var('crate')};
		localforage.setItem('param', my.param);
		var itemStr = get_var('items');
		var items = itemStr.split(',');
		my.goFullScreen();

		var mp = {'masterPlaylist': items, 'presentations': []};
		my.schedule.schedule = [];
		my.schedule.schedule[0] = mp;

		console.log("Items: ", items);
		// We need to load the presentation cache.
		for (i = 0; i < items.length; i++) {
			my.loadPreview(items[i]);
		}

		// Always on for playlist mode.
		my.schedule.schedule.ani_allow = true;
		my.schedule.schedule.trans_allow = true;
		my.preview = true;
		// We need to wait for the presentations to load.
		clearTimeout(my.timeouts['load']);
		my.timeouts['load'] = setTimeout(
			function(){
				my.checkLoadStatus(items);
			}, 1000);
	};

    my.drawDefaultWebPresentation = function(canvas) {
        canvas.clear();
        canvas.setBackgroundColor('#FFFFFF', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.setBackgroundColor('rgba(0, 0, 0, 1)', canvas.renderAll.bind(canvas));
        var rect = new fabric.Rect({width: 10, height: 10, fill: '#000'});
        canvas.add(rect);
        rect.set('anim', 'blink');
        var text = new fabric.Text("time", {fill: '#FFF', anim: 'time', left: 15, fontSize: 8});
        canvas.add(text);
        var err = new fabric.Text('Loading presentations,', {fill: '#FFF', top: 10, fontSize: 30});
        var err1 = new fabric.Text('please wait.', {fill: '#FFF', top: 42, fontSize: 30});
        var err2 = new fabric.Text(my.error, {fill: '#FFF', top: 74, fontSize: 30});
        canvas.add(err);
        canvas.add(err1);
        canvas.add(err2);
        canvas.renderAll();
        my.anim.load(canvas);
    };

    my.configureFonts = function() {
        // Create font holders -
        var fonts = ['bebas_neueregular', 'league_gothicregular', 'molotregular', 'paloaltoheavy', 'passion_onebold', 'amaranthregular',
            'walkway_semiboldregular', 'existencelight', 'caviar_dreamsregular', 'ralewayregular', 'quicksandregular', 'pacificoregular',
            'lobster_tworegular', 'lobster_1.3regular', 'kaushan_scriptregular', 'blackjackregular', 'dancing_script_otregular', 'jenna_sueregular',
            'journalregular', 'snicklesregular', 'gooddogregular', 'jemnewromanmedium', 'chronicles_of_a_heroregular', 'architects_daughterregular',
            'amaranthregular', 'aurulent_sansregular', 'arsenalregular', 'allerregular', 'ambleregular', 'andika_basicregular', 'junction_regularregular',
            'share-regularregular', 'folksregular', 'familiar_probold', 'latoregular', 'overpassregular', 'candelabook', 'robotomedium', 'source_sans_proregular',
            'droid_sansregular', 'exoregular', 'jargon_brknormal', 'distant_galaxyregular', 'orbitronregular', 'digital_dream_fatregular', 'magentaregular',
            'chumbly_brknormal', 'belligerent_madnessregular', 'yesterdays_mealregular', 'no_consequenceregular', 'scratchregular', 'boston_trafficregular',
            'capture_itregular', 'asap', 'boogaloo', 'autour_one', 'vanilla'];
        $.each(fonts, function(i, v){
            $('#fontContainer').append('<p style="font-family: '+v+'">a</p>');
        });
    };

    return my;
}());


function get_var(var_name){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == var_name){return pair[1];}
    }
    return(false);
}

function cvtSql(date) {
    var t = date.split(/[- :]/);
    return new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
}

function isEven(n){
    return isNumber(n) && (n % 2 == 0);
}

function isNumber(n){
    return n === parseFloat(n);
}
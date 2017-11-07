player.data = (function (p) {
    var my = {};
    my.timeouts = [];
    my.firstpass = true;

    my.getStartupParameters = function () {
        // These functions don't return promises.
        $.when(my.getDisplayId()).then(function () {
            console.log("Gotten display ID, checking network.");
            $.when(p.network.check(my.pingURL)).then(function () {
                console.log("Network is "+p.online+" and we're getting our display parameters.");
                $.when(my.updateDisplayParameters()).then(function () {
                    console.log("Finished getting display parameters. Showing startup presentation.");
                });
            });
        });
    };

    my.waitForLocalCache = function () {
        console.log("Waiting for cache");
        // wait for getStartupParameters to finish before we start getting data.
        localforage.getItem('param').then(function(param){
            if (param === null || param === 'null') {
                console.log("waiting for display parameters from server.");
                p.startup.updateStatus('Getting Display Parameters...');
                clearTimeout(my.timeouts['cache']);
                my.timeouts['cache'] = setTimeout(function() {my.waitForLocalCache();}, 500);
            } else {
                console.log("we have display parameters from server.", param);
                JL().fatalException("Startup parameters: ", param);
                p.param = param;

                // Set up the canvases
                p.canvas.initialize();
                // Load fonts
                p.fonts.configure();

                // Get schedule and set up external data sources.
                my.updateSchedule();
                my.updateWeather();
                my.updateTides();

                // Start cache watcher for schedule
                my.waitForScheduleCache();
            }
        });
    };

    my.waitForScheduleCache = function() {
        // Wait for schedule
        localforage.getItem('schedule').then(function(scheduleCache){
            if (scheduleCache === null || scheduleCache === 'null') {
                p.startup.updateStatus('Getting Schedule...');
                clearTimeout(my.timeouts['cache']);
                my.timeouts['cache'] = setTimeout(function() {my.waitForScheduleCache();}, 500);
            } else {
                // We wait 5 seconds while the blinker blinks
                console.log("We have a schedule.", scheduleCache);
                p.startup.updateStatus('Starting up...');
                clearTimeout(my.timeouts['main']);
                my.timeouts['main'] = setTimeout(function() {
                    my.startPlayerLoop(scheduleCache);
                }, 5000);
            }
        });
    };

    /**
     *  Called from my.waitForLocalCache(); when local cache is ready.
     *  Do not call directly.
     *
     */
    my.startPlayerLoop = function(schedule) {
        p.schedule = schedule;
        JL().fatalException("Schedule data", p.schedule);

        console.log("Next presentation Id", p.schedule.schedule[0].masterPlaylist[0]);
        if (p.preview) {
            console.log("We are in preview mode.", p.preview);
            p.website.goFullScreen();
        } else {
            console.log("We are not in preview mode.", p.preview);
        }
        p.canvas.loadNextPresentation();
    };

    my.updateSchedule = function() {
        if (p.online) {
            $.ajax({
                type: 'GET',
                url: p.heartbeatUrl,
                //contentType: "application/json; charset=utf-8",
                //dataType: "json",
                data: {
                    displayId: p.displayId,
                    previewMode: p.preview,
                    restart: p.restart,
                    version: p.version
                }
            }).done(
                function (data) {
                    //console.log("Memory usage", performance.memory);
                    //var mem = window.performance.memory;
                    //JL().debug("Total Memory "+mem.jsHeapSizeLimit+" Used memory "+mem.usedJSHeapSize);
                    p.restart = false;
                    localforage.setItem('schedule', data).then(function(v) {
                        // Do stuff here.
                        my.schedule = data;
                        JL().debug("Retrieved schedule data");
                    });
                    if (!(p.mode === 'playlist' || p.mode === 'master')) {
                        console.log('Sending proof of play.');
                        p.pop.send();

                        // Here's where we need to react to any update/reboot commands
                        // Reboot
                        if (data.reboot === 'true') {
                            JL().debug("Rebooting computer due to request from cloud. data.reboot is "+data.reboot);
                            $.ajax({url: p.rebootUrl});
                        }
                        // Update
                        if (data.update === 'true') {
                            console.log("Update is true.");
                            JL().debug("Update is true.");
                            // AJAX call here to retrieve and execute update script.
                            $.ajax({url: p.updateUrl});
                        } else {
                            console.log("Update is false.");
                            JL().debug("Update is false.");
                        }
                    }
                    clearTimeout(my.timeouts['schedule']);
                    my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, p.heartRate * 1000);
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
            p.network.check(p.pingURL);
            clearTimeout(my.timeouts['schedule']);
            my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
        }
    };

    my.getDisplayId = function(){
        var get_id = p.utility.get_var('id');
        if (get_id !== false) {
            console.log("Player started in preview mode. Display Id: "+get_id);
            p.displayId = get_id;
            p.preview = true;
            $('.dimmer').hide();
        } else {
            return $.ajax({
                type: 'GET',
                url: p.localDisplayUrl
            }).done(
                function (data) {
                    console.log("Done getting display data.");
                    if (data !== 'error') {
                        JL().debug("Get display Id: " + data);
                        p.displayId = data;
                    } else {
                        JL().debug("There was an error getting the display Id.");
                    }
                }
            );
        }
    };

    my.updateDisplayParameters = function () {
        var deferred = $.Deferred();
        if (p.online) {
            $.ajax(
                {type: 'GET', url: p.paramUrl, data: {id: p.displayId, online: p.online}}
            ).done(
                function(d) {
                    var data = [];
                    data[0] = eval(d);
                    data[0].dimming = JSON.parse(data[0].dimming);
                    p.param = data;
                    JL().fatalException('displayParam', data);
                    localforage.setItem('param', data).then(function(v) {
                        console.log("Stored param data");
                    });
                    p.online = true;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.paramUpdate * 1000);
                }
            ).error(
                function() {
                    JL().debug("Could not get param from AJAX call.");
                    localforage.getItem('param').then(function(param){
                        p.param = param;
                    });
                    p.online = false;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.paramUpdate * 1000);
                }
            );
        } else {
            JL().debug("Could not get display parameters. Not online.");
            my.network.check(my.pingURL);
            clearTimeout(my.timeouts['param']);
            my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, 1000);
        }
        deferred.resolve();
    };

    my.updateWeather = function () {
        if (p.online) {
            p.weather.update(p.param[0].zip).then(function(){
                localforage.setItem('weather', p.weather.data).then(function(v) {});
            });
            clearTimeout(my.timeouts['weather']);
            my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, p.weatherUpdate * 1000);
        } else {
            console.log("Could not get weather. Checking network.");
            p.network.check(my.pingURL);
            clearTimeout(my.timeouts['weather']);
            my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, 1000);
        }
    };

    my.updateTides = function () {
        if (p.param[0].station === 'undefined') {return;}
        console.log("Getting tides for station: "+p.param[0].station)
        if (p.online) {
            p.weather.tides(p.param[0].station).then(function(){
                localforage.setItem('tides', p.weather.tideData).then(function(v) {});
            });
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, p.weatherUpdate * 1000);
        } else {
            console.log("Could not get tides. Checking network.");
            my.network.check(my.pingURL);
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, 1000);
        }
    };

    return my;
}(player));
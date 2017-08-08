player.data = (function (p) {
    var my = {};
    my.timeouts = [];

    my.updateSchedule = function() {
        if (p.online) {
            $.ajax({
                type: 'GET',
                url: p.heartbeatUrl,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: {
                    displayId: p.displayId,
                    previewMode: p.preview,
                    restart: p.restart,
                    version: p.version
                }
            }).done(
                function (data) {
                    console.log("Memory usage", performance.memory);
                    var mem = window.performance.memory;
                    JL().debug("Total Memory "+mem.jsHeapSizeLimit+" Used memory "+mem.usedJSHeapSize);
                    p.restart = false;
                    localforage.setItem('schedule', data).then(function(v) {
                        // Do stuff here.
                        my.schedule = data;
                        JL().debug("Retrieved schedule data");
                    });
                    if (!(my.mode === 'playlist' || my.mode === 'master')) {
                        console.log('Sending proof of play.');
                        my.pop.send();

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
            p.network.check(p.pingURL);
            clearTimeout(my.timeouts['schedule']);
            my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
        }
    };

    my.updateDisplayParameters = function () {
        if (p.online) {
            $.ajax(
                {type: 'GET', url: p.paramUrl, data: {id: p.displayId, online: p.online}}
            ).done(
                function(data) {
                    data = eval(data);
                    data[0].dimming = JSON.parse(data[0].dimming);
                    JL().fatalException('displayParam', data);
                    localforage.setItem('param', data).then(function(v) {
                        // Do stuff here.
                        p.param = data;
                        console.log("Retrieved param data");
                    });
                    p.online = true;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.paramUpdate * 1000);
                }
            ).error(
                function() {
                    JL().debug("Could not get param from AJAX call. Checking network.");
                    localforage.getItem('param').then(function(param){
                        p.param = param;
                    });
                    p.online = false;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.paramUpdate * 1000);
                    //my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
                }
            );
        } else {
            JL().debug("Could not get param. Not online.");
            my.network.check(my.pingURL);
            clearTimeout(my.timeouts['param']);
            my.timeouts['param'] = setTimeout(function(){my.updateParam();}, 1000);
        }
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
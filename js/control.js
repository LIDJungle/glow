var player = (function () {
    var my = {};
    my.dev = false;


    my.timeouts = [];
    my.time = Date.now();
    my.weather = new Weather();
    my.canvases = [];
    my.displayId = '';
    my.schedule = {};
    my.online = '';
    my.param = [];
    my.error = '';
	my.restart = true;
    my.currentLoopPosition = 0;
    my.preview = false;
    my.pixelRatio = '1';


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
    

    /*
     *   init starts the player.
     *   call from doc.body.onload
     *
     */

    my.init = function() {
		JL().debug("\n\n\n");
        JL().debug("Player started");
        my.mode = my.utility.get_var('mode');

        // Handle playlist only mode from website
        if (my.mode === 'playlist') {
            my.website.startPlaylistMode();
        } else {
            // Start getting data
            my.data.startDataLoop();
            // Watch cache and start player when ready
            my.data.waitForLocalCache();
        }
    };

    my.startPlayerLoop = function(schedule) {
        my.schedule = schedule;
        JL().fatalException("Schedule data", my.schedule);

        console.log("Next presentation Id", my.schedule.schedule[0].masterPlaylist[0]);
        if (my.preview) {
            console.log("We are in preview mode.", my.preview);
            my.website.goFullScreen();
        } else {
            console.log("We are not in preview mode.", my.preview);
        }
        my.loadNextPresentation();
    };


    my.loadNextPresentation = function () {
        my.dimming.adjust();
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
        if (my.utility.isEven(my.currentLoopPosition)) {
            my.loadPresentation(my.canvases['c2'], presId, coid);
        } else {
            my.loadPresentation(my.canvases['c1'], presId, coid);
        }
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
                my.pop.add(presid, coid, my.schedule.schedule[0].presentations[presid].version);
            }
            if (my.preview) {my.website.zoomFullScreenPlayer(canvas);}
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
            if (my.utility.isEven(currPos)) {
                $("#c2").css("zIndex", 1);
                $("#c").css("zIndex", 0);
            } else {
                $("#c2").css("zIndex", 0);
                $("#c").css("zIndex", 1);
            }
        }, 500);
    };

    return my;
}());

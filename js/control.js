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

            $('#statusLeft', parent.document).text(presId+"v"+version+": "+name);
            $('#statusRight', parent.document).text("Tags: "+my.utility.parseTagString(my.schedule.schedule[0].presentations[presId].tags));
            // Here we need to add in code to show presentation info and check cache for updates.
            localforage.getItem('param').then(function(param) {
                my.param = param;
				clearTimeout(my.timeouts['presentation']);
				my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, my.param[0].cr * 1000);
            });
        } else {
            my.dimming.adjust();
			clearTimeout(my.timeouts['presentation']);
			my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, my.param[0].cr * 1000);
        }
        if (my.utility.isEven(my.currentLoopPosition)) {
            my.canvas.loadPresentation(my.canvases['c2'], presId, coid);
        } else {
            my.canvas.loadPresentation(my.canvases['c1'], presId, coid);
        }
    };


    return my;
}());

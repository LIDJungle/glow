var player = (function () {
    var my = {};
    my.dev = true;

    my.weather = new Weather();
    my.canvases = [];
    my.displayId = '';
    my.schedule = {};
    my.online = '';
    my.param = [];
	my.restart = true;
    my.preview = false;

	// Configuration
	my.version = "1.0";
    my.heartRate = 300; // 300 seconds - 5 minutes
    my.weatherUpdate = 900; // 15 minutes
    my.paramUpdate = 900; // 15 minutes
    my.popUrl = 'http://shineemc.com/api/public/index.php/storePop';
    my.heartbeatUrl = 'http://shineemc.com/api/public/index.php/getSchedule';
    my.paramUrl = 'http://shineemc.com/api/public/index.php/getDisplay';
    my.pingURL = 'http://shineemc.com/api/public/index.php/ping';
    my.presentationUrl = 'http://shineemc.com/api/public/index.php/loadPresentation';

	my.rebootUrl = 'data/reboot.php';
	my.updateUrl = 'data/update.php';
	my.localDisplayUrl = 'data/getDisplayId.php';

    /*
     *   init starts the player.
     *   call from doc.body.onload
     *
     *
     *  Note that from a design standpoint... We don't want the cache/player loop to require that any data connection be "good".
     *
     *  So, get startup parameters should run independently of waitForLocalCache. That's by design.
     *  If we already have parameters and a schedule cached, we should start to play.
     */

    my.init = function() {
		JL().debug("\n\n\n");
        JL().debug("Player started");
        my.mode = my.utility.get_var('mode');
        my.canvas.initialize();

        if(my.dev){localforage.clear();}
        // Handle playlist only mode from website
        if (my.mode === 'playlist') {
            my.website.startPlaylistMode();
        } else {
            // Show startup diagnostic presentation
            my.startup.start();
            // Start getting data
            my.data.getStartupParameters();
            // Watch cache and start player when ready
            my.data.waitForLocalCache();
        }
    };

    return my;
}());

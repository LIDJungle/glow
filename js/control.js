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
    my.preview = false;

    my.multi = true;
    my.multiStyle = '4up';


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

	//my.presentationUrl = 'http://shineemc.com/shine2/data/fabric/loadPresentation.php';

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
        my.canvas.initialize();

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

    return my;
}());

<!DOCTYPE html>
<?php
header("Content-type:text/html");
?>
<html>
<head>
<link rel="stylesheet" href="/glow/fonts/stylesheet.css">
<style>
    .canvas-holder {
        position: absolute;
        background-color: black;
    }
    .dimmer {
        position: fixed;
        left: 0;
        top: 0;
        background-color: #000000;
        opacity: 0;
        width: 100%;
        height: 100%;
        z-index: 100;
    }
    canvas {
        position: absolute;
        top: 0;
        left: 0;
    }
    #wall1 {
        z-index: 1;
    }
    #fontContainer {
        color: transparent;
        height: 1px;
        overflow: hidden;
    }
    body {
        background-color: black;
        color: white;
        margin: 0;
        width: 100%;
        height: 100%;
    }
</style>
</head>
<body>
    <div class="dimmer">&nbsp</div>
    <div id="wall1" class="canvas-holder">

    </div>
    <div id="wall2" class="canvas-holder">

    </div>
	<!-- Initialize web fonts here. They need to be on page to get loaded. -->
	<div id="fontContainer">
	
	</div>
</body>

<script src="/glow/js/fabric/fabric.js"></script>

<script src="/glow/js/lib/jquery.min.js"></script>
<script src="/glow/js/lib/weather.class.js"></script>
<script src="/glow/js/lib/localforage.min.js"></script>
<script src="/glow/js/lib/jsnlog.min.js"></script>

<script src="/glow/js/control.js"></script>
<script src="/glow/js/fonts/player.fonts.js"></script>
<script src="/glow/js/system/player.network.js"></script>
<script src="/glow/js/system/player.pop.js"></script>
<script src="/glow/js/system/player.startup.js"></script>
<script src="/glow/js/system/player.data.js"></script>
<script src="/glow/js/system/player.canvas.js"></script>
<script src="/glow/js/system/player.dimming.js"></script>
<script src="/glow/js/system/player.utility.js"></script>
<script src="/glow/js/website/player.website.js"></script>
<script src="/glow/js/anim/player.anim.js"></script>
<script src="/glow/js/transitions/player.transitions.js"></script>

<script>
	// Set up JL logger as a global service
	// This way we can capture errors that are out of our program's normal scope.
	var appender = JL.createAjaxAppender("appender");
    appender.setOptions({"url": "data/logger.php", "level": 0});
	JL().setOptions({"appenders": [appender]});
	
	// Start Player
	player.init();
	
	// Capture all window errors and log them.
	if (window && !window.onerror) {
		window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
			JL("onerrorLogger").fatalException({
				"msg": "Uncaught Exception",
				"errorMsg": errorMsg, "url": url,
				"line number": lineNumber, "column": column
			}, errorObj);

			return false;
		}
	}
	
	// Use a service worker cache to cache images for one month. 
	// This cache will survive reboot and enables offline functionality.
	if ('serviceWorker' in navigator) {
	  window.addEventListener('load', function() {
		navigator.serviceWorker.register('/glow/shine_cache.js').then(function(registration) {
		  // Registration was successful
		  console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}).catch(function(err) {
		  // registration failed :(
		  console.log('ServiceWorker registration failed: ', err);
		});
	  });
	}
	
</script>
</html>
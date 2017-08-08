player.website = (function (p) {
    var my = {};
    my.timeouts = [];

    my.startPlaylistMode = function () {
        console.log('We are working with a playlist.');

        p.displayId = get_var('id');
        p.param[0] = {'h': get_var('h'), 'w': get_var('w'), 'cr': get_var('crate')};
        localforage.setItem('param', p.param);
        var itemStr = get_var('items');
        var items = itemStr.split(',');
        my.goFullScreen();

        var mp = {'masterPlaylist': items, 'presentations': []};
        p.schedule.schedule = [];
        p.schedule.schedule[0] = mp;

        console.log("Items: ", items);
        // We need to load the presentation cache.
        for (i = 0; i < items.length; i++) {
            p.loadPreview(items[i]);
        }

        // Always on for playlist mode.
        p.schedule.schedule.ani_allow = true;
        p.schedule.schedule.trans_allow = true;
        p.preview = true;
        // We need to wait for the presentations to load.
        clearTimeout(my.timeouts['load']);
        my.timeouts['load'] = setTimeout(
            function(){
                my.checkLoadStatus(items);
            }, 1000);
    };


    my.zoomFullScreenPlayer = function(canvas) {
        console.log("Zooming by "+p.pixelRatio);
        my.zoom(p.pixelRatio, canvas);
        if (p.pixelRatio > 4) {
            var pixelMask = 'img/'+p.pixelRatio+'.png';
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


    return my;
}(player))
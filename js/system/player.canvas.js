player.canvas = (function (p) {
    var my = {};
    my.timeouts = [];
    my.currentWall = 'single_1';
    my.currentType = 'single';
    my.nextSingle = 'single_1';
    my.nextMulti = 'multi_1';

    my.walls =  {'single': {
                   'single_1': {
                       'jq_object': $('#single_1'),
                       'canvases': []
                   },
                    'single_2': {
                        'jq_object': $('#single_2'),
                        'canvases': []
                    }
                }, 'multi': {
                    'multi_1': {
                        'jq_object': $('#multi_1'),
                        'canvases': []
                    },
                    'multi_2': {
                        'jq_object': $('#multi_2'),
                        'canvases': []
                    }
                }};

    my.initialize = function() {
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

        my.buildSingle();
        if (p.multi === true){
            my.buildMulti(p.multiStyle);
        }
    };

    my.multiChange = function (type) {
        clearTimeout(my.timeouts['change']);
        my.timeouts['change'] = setTimeout(function(){
            my.currentType = type;
            my.walls[my.currentType][my.currentWall].jq_object.css("zIndex", 0);

            if (type === 'multi') {
                my.currentWall = my.nextMulti;
                if (my.nextMulti === 'multi_1') {my.nextMulti = 'multi_2';} else {my.nextMulti = 'multi_1';}
            } else if (type === 'single') {
                my.currentWall = my.nextSingle;
                if (my.nextSingle === 'single_1') {my.nextSingle = 'single_2';} else {my.nextSingle = 'single_1';}
            }

            my.walls[my.currentType][my.currentWall].jq_object.css("zIndex", 1);

        }, 500);
    };

    /*
    Advances the player loop and calls loadPresentation.
     */
    my.loadNextPresentation = function () {
        console.log("Current loop is "+p.currentLoopPosition+" and masterPlaylist has "+p.schedule.schedule[0].masterPlaylist.length+" items.");
        //JL().debug("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+my.schedule.schedule[0].masterPlaylist.length+" items.");
        if (p.currentLoopPosition === p.schedule.schedule[0].masterPlaylist.length) {
            JL().debug("Resetting loop");
            p.currentLoopPosition = 0;
        }

        var presId = p.schedule.schedule[0].masterPlaylist[p.currentLoopPosition].pid;
        var coid = p.schedule.schedule[0].masterPlaylist[p.currentLoopPosition].coid;
        var type = 'single';
        if (p.mode === 'playlist' || p.mode === 'master') {
            p.website.setSiteInfo(presId);
            // check cache for updates.
            localforage.getItem('param').then(function(param) {
                p.param = param;
                clearTimeout(my.timeouts['presentation']);
                my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, p.param[0].cr * 1000);
            });
        } else {
            p.dimming.adjust();
            clearTimeout(my.timeouts['presentation']);
            my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, p.param[0].cr * 1000);
        }

        /*
            New code should allow us to pass arrays of presentation objects to the loader.
         */
        var presentation = [];
        if (type === 'single') {
            // Create presentation object
            presentation.push({'id': presId, 'coid': coid, 'type': 'single', 'count': 1});
            // Load it
            my.loadPresentation(p.canvases[my.walls.single[my.nextSingle].canvases[0]], presentation[0]);
        } else if (type === 'multi') {
            // Create an array of presentation objects
            var l = presId.length;
            for (var i = 0; i < l; i++) {
                presentation.push({'id': presId[i], 'coid': coid, 'type': 'multi', 'count': presId.length});
            }
            // Loop over canvases and load each.
            l = my.walls.single[my.currentWall].canvases.length;
            for (var i=0;i<l;i++) {
                my.loadPresentation(p.canvases[my.walls.multi[my.nextMulti].canvases[i]], presentation[i]);
            }
        }
        p.canvas.multiChange(type);
    };

    // Manually loads 4 presentations for testing.
    my.loadMultiPresentation = function () {
        p.canvas.loadPresentation(p.canvases['m1'], '855', '10');
        p.canvas.loadPresentation(p.canvases['m2'], '856', '10');
        p.canvas.loadPresentation(p.canvases['m3'], '1096', '10');
        p.canvas.loadPresentation(p.canvases['m4'], '2108', '10');
    };

    my.loadPresentation = function(canvasObj, presentation){
        JL().debug("Loading presentation "+presentation.id+".");
        console.log("Presentation", presentation);
        var data = p.schedule.schedule[0];
        if (p.preview) {
            canvasObj.canvas.setHeight(p.param[0].h);
            canvasObj.canvas.setWidth(p.param[0].w);
        }

        canvasObj.canvas.clear();
        canvasObj.canvas.setBackgroundColor('#FFFFFF', canvasObj.canvas.renderAll.bind(canvasObj.canvas));
        canvasObj.canvas.backgroundImage = null;
        canvasObj.canvas.loadFromJSON(p.schedule.schedule[0].presentations[presentation.id].json, function(){
            console.log("Canvas has loaded "+presentation.id);
            my.fitMulti(canvasObj);
            if (!my.preview) {
                p.pop.add(presentation.id, presentation.coid, data.presentations[presentation.id].version);
            }
            if (p.preview) {my.website.zoomFullScreenPlayer(canvasObj.canvas);}
            if(!p.schedule.schedule.ani_allow){p.anim.load(canvasObj.canvas);}
            if(!p.schedule.schedule.trans_allow){p.transitions.load(canvasObj.canvas);}
            //p.canvas.change(my.currentLoopPosition);
            p.currentLoopPosition++;
        });
    };

    my.buildSingle = function () {
        p.canvases['c1'] = {};
        p.canvases['c2'] = {};
        p.canvases['c1'].canvas = new fabric.StaticCanvas('c1');
        p.canvases['c1'].factor = 1;
        p.canvases['c2'].canvas = new fabric.StaticCanvas('c2');
        p.canvases['c2'].factor = 1;
        p.canvases['c1'].canvas.setWidth(p.param[0].w);
        p.canvases['c1'].canvas.setHeight(p.param[0].h);
        p.canvases['c2'].canvas.setWidth(p.param[0].w);
        p.canvases['c2'].canvas.setHeight(p.param[0].h);
        my.walls.single.single_1.canvases.push('c1');
        my.walls.single.single_2.canvases.push('c2');

    };

    my.buildMulti = function (multiStyle) {
        var multiIds = [];
        switch (multiStyle) {
            case '4up':
                // Create 8 canvas objects
                for (var i = 1; i <= 8; i++) {
                    p.canvases['m'+i] = {};
                    multiIds.push('m'+i);
                }

                // Split them to two screens
                var multi_1 = multiIds.splice(0, Math.floor(multiIds.length / 2));
                var multi_2 = multiIds;

                // Build canvases
                $.each(multi_1, function(idx, id){
                    console.log("Id is ", id);
                    $('<canvas>').attr({
                        id: id
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: '0'
                    }).appendTo('#multi_1');
                    p.canvases[id].canvas = new fabric.StaticCanvas(id);
                    p.canvases[id].factor = .5;
                    p.canvases[id].canvas.setWidth((p.param[0].w / 2));
                    p.canvases[id].canvas.setHeight((p.param[0].h / 2));
                    my.walls.multi.multi_1.canvases.push(id);
                });
                // Position canvases
                my.walls.multi.multi_1.jq_object.find('canvas:nth-child(2)').css({top: '0',
                    left: (p.param[0].w / 2)});
                my.walls.multi.multi_1.jq_object.find('canvas:nth-child(3)').css({top: (p.param[0].h / 2),
                    left: '0'});
                my.walls.multi.multi_1.jq_object.find('canvas:nth-child(4)').css({top: (p.param[0].h / 2),
                    left: (p.param[0].w / 2)});

                // Build and position second set.
                $.each(multi_2, function(idx, id){
                    $('<canvas>').attr({
                        id: id
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: '0'
                    }).appendTo('#multi_2');
                    p.canvases[id].canvas = new fabric.StaticCanvas(id);
                    p.canvases[id].factor = .5;
                    p.canvases[id].canvas.setWidth((p.param[0].w / 2));
                    p.canvases[id].canvas.setHeight((p.param[0].h / 2));
                    my.walls.multi.multi_2.canvases.push(id);
                });
                my.walls.multi.multi_2.jq_object.find('canvas:nth-child(2)').css({top: '0',
                    left: (p.param[0].w / 2)});
                my.walls.multi.multi_2.jq_object.find('canvas:nth-child(3)').css({top: (p.param[0].h / 2),
                    left: '0'});
                my.walls.multi.multi_2.jq_object.find('canvas:nth-child(4)').css({top: (p.param[0].h / 2),
                    left: (p.param[0].w / 2)});

                break;
        }
    };

    my.fitMulti = function (obj) {
        var canvas = obj.canvas;
        var factor = obj.factor;
        if (factor === 1) {return;}
        if (canvas.backgroundImage) {
            // Need to scale background image
            var bi = canvas.backgroundImage;
            bi.width = bi.width * factor; bi.height = bi.height * factor;
        }
        // Get all objects on canvas
        var objects = canvas.getObjects();
        var objCount = objects.length;
        // Loop over and scale them.
        for (i = 0; i < objCount; i++) {
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
        //Tell canvas to update.
        canvas.renderAll();
    };

    return my;
}(player));
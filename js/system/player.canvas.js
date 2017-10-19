player.canvas = (function (p) {
    var my = {};
    my.currentLoopPosition = 0;
    my.timeouts = [];
    my.currentWall = 'wall1';
    my.nextWall = 'wall2';
    my.walls = {
        'wall1': {
            'jq_object': $('#wall1'),
            'canvases': []
        },
        'wall2': {
            'jq_object': $('#wall2'),
            'canvases': []
        }
    }

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
    };

    my.change = function (currentPos) {
        clearTimeout(my.timeouts['change']);
        my.timeouts['change'] = setTimeout(function(){
            my.walls[my.currentWall].jq_object.css("zIndex", 0);

            if (my.currentWall === 'wall1') {my.currentWall = 'wall2'; my.nextWall = 'wall1';} else {my.currentWall = 'wall1'; my.nextWall = 'wall2';}
            my.walls[my.currentWall].jq_object.css("zIndex", 1);
        }, 1000);
    }

    /*
    Advances the player loop and calls loadPresentation.
     */
    my.loadNextPresentation = function () {
        console.log("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+p.schedule.schedule[0].masterPlaylist.length+" items.");
        //JL().debug("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+my.schedule.schedule[0].masterPlaylist.length+" items.");
        if (my.currentLoopPosition === p.schedule.schedule[0].masterPlaylist.length) {
            JL().debug("Resetting loop");
            my.currentLoopPosition = 0;
        }

        /* Presid just sets the website name... Fix later */
        //var presId = p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].presentation;

        if (p.mode === 'playlist' || p.mode === 'master') {
            // Update parameters
            localforage.getItem('param').then(function(param) {p.param = param;});
            //p.website.setSiteInfo(presId);
        } else {
            p.dimming.adjust();
        }

        // destroy old canvases
        $.each(my.walls[my.nextWall].canvases, function (idx, id) {
            console.log("deleting id "+id);
            $('#'+id).remove();
        });
        my.walls[my.nextWall].canvases = [];
        p.canvases = [];

        //console.log("Building canvases - Type: "+p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].type+" Count: "+p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].count);
        my.buildCanvases(p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].type, p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].count);
        //console.log("Loading "+p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].presentations.length+" presentations.");

        for (var i=0;i<p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].count;i++) {
            var presentation = p.schedule.schedule[0].masterPlaylist[my.currentLoopPosition].presentations[i];
            var loop = my.currentLoopPosition;

            my.loadPresentation(p.canvases[i], presentation);
            if (!my.preview) {
                setTimeout(function () {
                    p.pop.add(presentation.pid, presentation.coid, p.schedule.schedule[0].presentations[presentation.pid].presentation.version, p.schedule.schedule[0].masterPlaylist[loop].count);
                    console.log("Current loop is ",p.schedule.schedule[0].masterPlaylist[loop]);
                }, i * 20);
            }
        }
        my.change(my.currentLoopPosition);
        my.currentLoopPosition++;
        clearTimeout(my.timeouts['presentation']);
        my.timeouts['presentation'] = setTimeout(function(){my.loadNextPresentation();}, p.param[0].cr * 1000);
    };

    my.loadPresentation = function(canvasObj, presentation){
        JL().debug("Loading presentation "+presentation.pid+".");

        canvasObj.canvas.setBackgroundColor('#FFFFFF', canvasObj.canvas.renderAll.bind(canvasObj.canvas));
        canvasObj.canvas.loadFromJSON(p.schedule.schedule[0].presentations[presentation.pid].presentation.json, function(){
            //console.log("Canvas has loaded ", p.schedule.schedule[0].presentations[presentation.pid].presentation.json);
            my.fit(canvasObj);
            if (p.preview) {my.website.zoomFullScreenPlayer(canvasObj.canvas);}
            if(!p.schedule.schedule.ani_allow){p.anim.load(canvasObj.canvas);}
            if(!p.schedule.schedule.trans_allow){p.transitions.load(canvasObj.canvas);}
        });
    };

    my.buildCanvases = function (type, count) {
        //console.log("Building canvases: "+type+" Count: "+count);
        // Create tracking ids
        var ids = [];
        for (var i = 1; i<= count; i++) {
            p.canvases['canvas'+i] = {};
            ids.push(my.nextWall+'_canvas'+i);
        }
        //console.log("Creating ids: ", ids);
        switch (type) {
            case 'single':
                // Build canvas
                $.each(ids, function(idx, id){
                    console.log("Id is ", id);
                    $('<canvas>').attr({
                        id: id
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: '0'
                    }).appendTo('#'+my.nextWall);
                    p.canvases[idx] = {};
                    p.canvases[idx].canvas = new fabric.StaticCanvas(id);
                    p.canvases[idx].factor = 1;
                    p.canvases[idx].canvas.setWidth(p.param[0].w);
                    p.canvases[idx].canvas.setHeight(p.param[0].h);
                    my.walls[my.nextWall].canvases.push(id);
                });

                break;
            case '4up':
                // Build canvases
                $.each(ids, function(idx, id){
                    console.log("Id is ", id);
                    $('<canvas>').attr({
                        id: id
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: '0'
                    }).appendTo('#'+my.nextWall);
                    p.canvases[idx] = {};
                    p.canvases[idx].canvas = new fabric.StaticCanvas(id);
                    p.canvases[idx].factor = .5;
                    p.canvases[idx].canvas.setWidth((p.param[0].w / 2));
                    p.canvases[idx].canvas.setHeight((p.param[0].h / 2));
                    my.walls[my.nextWall].canvases.push(id);
                    //console.log("Created "+id);
                });

                // Position canvases
                my.walls[my.nextWall].jq_object.find('canvas:nth-child(2)').css({top: '0',
                    left: (p.param[0].w / 2)});
                my.walls[my.nextWall].jq_object.find('canvas:nth-child(3)').css({top: (p.param[0].h / 2),
                    left: '0'});
                my.walls[my.nextWall].jq_object.find('canvas:nth-child(4)').css({top: (p.param[0].h / 2),
                    left: (p.param[0].w / 2)});

                break;

        } // End Switch
    }

    my.fit = function (obj) {
        obj.canvas.setZoom(obj.factor);
        obj.canvas.renderAll();
    };

    my.isEven = function (n){
        return my.isNumber(n) && (n % 2 == 0);
    };

    my.isNumber = function (n) {
        return n === parseFloat(n);
    }

    return my;
}(player));
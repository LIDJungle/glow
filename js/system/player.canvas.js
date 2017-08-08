player.canvas = (function (p) {
    var my = {};
    my.timeouts = [];

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


        p.canvases['c1'] = new fabric.StaticCanvas('c1');
        p.canvases['c2'] = new fabric.StaticCanvas('c2');
        p.canvases['c1'].setWidth(p.param[0].w);
        p.canvases['c1'].setHeight(p.param[0].h);
        p.canvases['c2'].setWidth(p.param[0].w);
        p.canvases['c2'].setHeight(p.param[0].h);

        if (p.multi === true){
            switch (p.multiStyle) {
                case '4up':
                    $('<canvas>').attr({
                        id: 'm1'
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: '0'
                    }).appendTo('#multi');
                    p.canvases['m1'] = new fabric.StaticCanvas('m1');
                    p.canvases['m1'].setWidth((p.param[0].w / 2));
                    p.canvases['m1'].setHeight((p.param[0].h / 2));

                    $('<canvas>').attr({
                        id: 'm2'
                    }).css({
                        position: 'absolute',
                        top: '0',
                        left: (p.param[0].w / 2)
                    }).appendTo('#multi');
                    p.canvases['m2'] = new fabric.StaticCanvas('m2');
                    p.canvases['m2'].setWidth((p.param[0].w / 2));
                    p.canvases['m2'].setHeight((p.param[0].h / 2));

                    $('<canvas>').attr({
                        id: 'm3'
                    }).css({
                        position: 'absolute',
                        top: (p.param[0].h / 2),
                        left: '0'
                    }).appendTo('#multi');
                    p.canvases['m3'] = new fabric.StaticCanvas('m3');
                    p.canvases['m3'].setWidth((p.param[0].w / 2));
                    p.canvases['m3'].setHeight((p.param[0].h / 2));

                    $('<canvas>').attr({
                        id: 'm4'
                    }).css({
                        position: 'absolute',
                        top: (p.param[0].h / 2),
                        left: (p.param[0].w / 2)
                    }).appendTo('#multi');
                    p.canvases['m4'] = new fabric.StaticCanvas('m4');
                    p.canvases['m4'].setWidth((p.param[0].w / 2));
                    p.canvases['m4'].setHeight((p.param[0].h / 2));

                    break;
            }
        }
    };


    my.change = function(currPos) {
        //var diff = Date.now() - my.time;
        //JL().debug("Diff is "+diff / 1000+". Change rate is "+my.param[0].cr+".");
        //my.time = Date.now();
        clearTimeout(my.timeouts['change']);
        my.timeouts['change'] = setTimeout(function(){
            if (p.utility.isEven(currPos)) {
                $("#c2").css("zIndex", 1);
                $("#c").css("zIndex", 0);
            } else {
                $("#c2").css("zIndex", 0);
                $("#c").css("zIndex", 1);
            }
        }, 500);
    };

    /*
    Advances the player loop and calls loadPresentation.
     */
    my.loadNextPresentation = function () {
        console.log("Current loop is "+p.currentLoopPosition+" and masterPlaylist has "+p.schedule.schedule[0].masterPlaylist.length+" items.");
        //JL().debug("Current loop is "+my.currentLoopPosition+" and masterPlaylist has "+my.schedule.schedule[0].masterPlaylist.length+" items.");
        if (p.currentLoopPosition == p.schedule.schedule[0].masterPlaylist.length) {
            JL().debug("Resetting loop");
            p.currentLoopPosition = 0;
        }

        var presId = p.schedule.schedule[0].masterPlaylist[p.currentLoopPosition].pid;
        var coid = p.schedule.schedule[0].masterPlaylist[p.currentLoopPosition].coid;
        if (p.mode == 'playlist' || p.mode == 'master') {
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
        if (p.utility.isEven(p.currentLoopPosition)) {
            my.loadPresentation(p.canvases['c2'], presId, coid);
        } else {
            my.loadPresentation(p.canvases['c1'], presId, coid);
        }
    };

    my.loadPresentation = function(canvas, presid, coid){
        JL().debug("Loading presentation "+presid+".");

        if (p.preview) {
            canvas.setHeight(p.param[0].h);
            canvas.setWidth(p.param[0].w);
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
        canvas.loadFromJSON(p.schedule.schedule[0].presentations[presid].json, function(){
            console.log("Canvas has loaded "+presid);
            if (!my.preview) {
                p.pop.add(presid, coid, p.schedule.schedule[0].presentations[presid].version);
            }
            if (p.preview) {my.website.zoomFullScreenPlayer(canvas);}
            if(!p.schedule.schedule.ani_allow){p.anim.load(canvas);}
            if(!p.schedule.schedule.trans_allow){p.transitions.load(canvas);}
            p.canvas.change(my.currentLoopPosition);
            p.currentLoopPosition++;
        });
    };

    return my;
}(player));
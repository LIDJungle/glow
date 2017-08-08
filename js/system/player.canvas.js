player.canvas = (function (p) {
    var my = {};

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
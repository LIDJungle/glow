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


    }
    return my;
}(player));
player.startup = (function (p) {
    var my = {};

    my.start = function() {
        // Draw default opening presentation.
        p.canvas.buildCanvases('single', 1);
        if (p.mode === 'playlist' || p.mode === 'master') {
            $('.canvas-holder').css('top', '52px');
            my.drawDefaultWebPresentation(p.canvases[0].canvas);
        } else {
            my.drawDefaultPresentation(p.canvases[0].canvas);
        }
        my.currentLoopPosition++;
    }

    my.drawDefaultWebPresentation = function(canvas) {
        canvas.clear();
        canvas.setBackgroundColor('#FFFFFF', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.setBackgroundColor('rgba(0, 0, 0, 1)', canvas.renderAll.bind(canvas));
        var rect = new fabric.Rect({width: 10, height: 10, fill: '#000'});
        canvas.add(rect);
        rect.set('anim', 'blink');
        var text = new fabric.Text("time", {fill: '#FFF', anim: 'time', left: 15, fontSize: 8});
        canvas.add(text);
        var err = new fabric.Text('Loading presentations,', {fill: '#FFF', top: 10, fontSize: 30});
        var err1 = new fabric.Text('please wait.', {fill: '#FFF', top: 42, fontSize: 30});
        var err2 = new fabric.Text(p.error, {fill: '#FFF', top: 74, fontSize: 30});
        canvas.add(err);
        canvas.add(err1);
        canvas.add(err2);
        canvas.renderAll();
        p.anim.load(canvas);
    };

    my.drawDefaultPresentation = function(canvas) {
        canvas.clear();
        canvas.setBackgroundColor('#FFFFFF', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.setBackgroundColor('rgba(0, 0, 0, 1)', canvas.renderAll.bind(canvas));
        var rect = new fabric.Rect({width: 10, height: 10, fill: '#000'});
        canvas.add(rect);
        rect.set('anim', 'blink');
        var text = new fabric.Text("time", {fill: '#FFF', anim: 'time', left: 15, fontSize: 8});
        canvas.add(text);
        var err = new fabric.Text(p.error, {fill: '#FFF', top: 10, fontSize: 10});
        canvas.add(err);
        canvas.renderAll();
        p.anim.load(canvas);
    };

    return my;
}(player));
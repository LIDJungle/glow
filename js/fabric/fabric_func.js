// Default Vars
var defZoom = 4.2;
var zoom = defZoom; // Default zoom level
// To do - Set default zoom level as "Best Fit". 
// Width of editor window / width of presentation

var mask = true;
var width = 128;
var height = 64;
var canvas;
var companyId;
var currPresId = '';
var pixelMask = 'img/pixelmask.png';
var presUrl = 'http://localhost/shine/presentations/';
var currPresName = '';
var bgUrl = '';


function startEditor(w, h, coid, p) {
	width = w; height = h; companyId = coid;
	if (canvas) {
		//console.log("Clearing old canvas.");
		canvas.clear();
	} else {
		//console.log("Starting Editor");
		canvas = new fabric.Canvas('canvas', {width: w, height: h});
		canvas.setBackgroundColor($('#bgcolor').val(), canvas.renderAll.bind(canvas));
	}
	fabric.Object.NUM_FRACTION_DIGITS = 17;
	hidePanels();
	list();
	zoomIt(zoom);
	// Config Keybindings
	$(document).keydown(function(e){
		if (e.keyCode == 37) { 
		   nudge_left();
		   return false;
		}
		if (e.keyCode == 38) { 
		   nudge_up();
		   return false;
		}
		if (e.keyCode == 39) { 
		   nudge_right();
		   return false;
		}
		if (e.keyCode == 40) { 
		   nudge_down();
		   return false;
		}
	});
	
	// Configure watcher
	canvas.observe('object:selected', function (e) {
		//console.log("We have selected ", e.target.get('type'));
		if (e.target.get('type') == 'i-text') {
			//console.log("Can we get stroke color? "+e.target.get('stroke'));
			$('#mod_size').val(e.target.get('fontSize'));
			$('#mod_fill').val(e.target.get('fill'));
			if (e.target.get('stroke') != null) {
				//console.log("Stroke: "+e.target.get('stroke'));
				$('#mod_txtStroke').prop('checked', true);
				$('#mod_stroke').val(e.target.get('stroke'));
				$('#mod_stroke').prop('disabled', false)
			} else {
				//console.log("No stroke.");
				$('#mod_txtStroke').prop('checked', false);
				$('#mod_stroke').prop('disabled', true)
			}
			$('#mod_txtString').val(e.target.get('text'));
			showPanel('mod_text');
		} else if (e.target.get('type') == 'image') {
			//console.log("We have selected an image.");
			showPanel("mod_image");
		} else if (e.target.get('type') == 'path-group') {
			//console.log("We have selected a path-group.");
			//console.log(e.target.scaleX);
			showPanel("mod_shape");
		}
	});
	canvas.observe('selection:cleared', function(e) {
		hidePanels();
	});
	if (typeof(p) !== 'undefined') {
		//console.log("We were passed an id, loading presentation "+p);
		loadFromUrl(p);
	}
}

function loadFromUrl(url) {
	//console.log(url);
	var id;
	$.ajax({
		type: 'GET',
		url: 'data/fabric/getIdFromUrl.php',
		data: {url: url},
		success: function(json) {
			//console.log(json);
			id = json;
			loadPresentation(id);
			canvas.renderAll();
		}
	});
}

function showPanel (p) {
	hidePanels();
	$('#'+p).show();
}
function hidePanels () {
	$('#add_text').hide();
	$('#add_img').hide();
	$('#add_shape').hide();
	$('#mod_text').hide();
	$('#bg_opts').hide();
	$('#mod_image').hide();
	$('#mod_shape').hide();
}
function preview() {
	var s = $('#shapes').val();
	$('#svg_preview').attr('src', s);
}
// bind all close_panel buttons
$('.close_panel').on('click', function(){hidePanels();});
///////////////////////////////////////////////////////////////////////////
// Toolbar
function delete_obj () {
	if (canvas.getActiveGroup()) {
		canvas.getActiveGroup().forEachObject(function(o){ canvas.remove(o) });
		canvas.discardActiveGroup().renderAll();
	} else {
		canvas.remove(canvas.getActiveObject());
	}
}
function toggleMask() {
	//console.log(mask);
	if (mask) {
		//console.log("Adding overlay");
		canvas.setOverlayImage(pixelMask, canvas.renderAll.bind(canvas));
		mask = false;
	} else {
		//console.log("Removing overlay");
		canvas.setOverlayImage('', canvas.renderAll.bind(canvas));
		mask = true;
	}
}
function up () {
	canvas.bringForward(canvas.getActiveObject());
}
function down () {
	canvas.sendBackwards(canvas.getActiveObject());
}

///////////////////////////////////////////////////////////////////////////
// Panel: Add text
function fillText() {
	var opts = new Object();
	var s = $('#txtString').val();
	var f = $('#font').val();
	var cf = $('#fill').val();
	var cs = $('#stroke').val();
	var p = $('#size').val();
	var text = new fabric.IText(s, {fontFamily: f, fill: cf});
	//console.log("Add stroke? "+$('#add_txtStroke').prop('checked'));
	if ($('#add_txtStroke').prop('checked')) {text.setStroke(cs);}
	text.setFontSize(p);
	canvas.add(text);
	hidePanels();
}

///////////////////////////////////////////////////////////////////////////
// Panel: Add Image
function addImg (url) {
	var u = url;
	$('#img').val(url);
	//var u = $('#img').val();
	fabric.Image.fromURL(u, function(oImg) {
		if ($('#img_fitHeight').prop('checked')) {
			oImg.scaleToHeight(canvas.height);
		}
		if ($('#img_fitWidth').prop('checked')) {
			oImg.scaleToWidth(canvas.width);
		}
		canvas.add(oImg);
	});
	hidePanels();
}
function selectImage() {
	var scope = angular.element("body").scope();
	var image = scope.openImageBrowser('imselect');
}
function selectSvg() {
	var scope = angular.element("body").scope();
	var image = scope.openImageBrowser('svgselect');
}
function selectBg() {
	var scope = angular.element("body").scope();
	var image = scope.openImageBrowser('bgselect');
}
///////////////////////////////////////////////////////////////////////////
// Panel: Add Shape
function addSVG(url) {
	//var cross_o;
	var s = url;
	//console.log("Adding "+s);
	fabric.loadSVGFromURL(s, 
	function(obj, opt){
		//console.log("Adding SVG");
		var shape = fabric.util.groupSVGElements(obj, opt);
		shape.set({
			//fill: 'blue',
			top: 0,
			left: 0
		});
		if ($('#svg_fitHeight').prop('checked')) {
			shape.scaleToHeight(canvas.height);
		}
		if ($('#svg_fitWidth').prop('checked')) {
			shape.scaleToWidth(canvas.width);
		}
		canvas.add(shape);
		canvas.calcOffset();
		canvas.renderAll();
	});
	hidePanels();
}
function changeShapeColor(color) {
	if (shape.isSameColor && shape.isSameColor() || !shape.paths) {
		shape.setFill(color);
	} else if (shape.paths) {
		for (var i = 0; i < shape.paths.length; i++) {
			shape.paths[i].setFill(color);
		}
	}
}

///////////////////////////////////////////////////////////////////////////
// Panel: Mod Text
function updateText() {
	var o = canvas.getActiveObject();
	var s = $('#mod_txtString').val();
	o.setText(s);
	canvas.renderAll();
}
function updateFont() {
	var o = canvas.getActiveObject();
	var f = $('#mod_font').val();
	o.setFontFamily(f);
	canvas.renderAll();
}
function updateTextSize() {
	var o = canvas.getActiveObject();
	var f = $('#mod_size').val();
	o.setFontSize(f);
	canvas.renderAll();
}
function updateTextColor() {
	var o = canvas.getActiveObject();
	var f = $('#mod_fill').val();
	o.setColor(f);
	canvas.renderAll();
}
function updateTextStroke(d) {
	var a = $('#mod_txtStroke').prop('checked');
	//console.log("Stroke on? "+a);
	var o = canvas.getActiveObject();
	if (a) {
		var cs = $('#mod_stroke').val();
		o.setStroke(cs);
	} else {
		o.setStroke();
	}
	if(d)$('#mod_stroke').prop('disabled', !(a));
	canvas.renderAll();
}
///////////////////////////////////////////////////////////////////////////
// Panel: Mod Image
function removeWhite() {
	var o = canvas.getActiveObject();
	if ($('#img_RemoveWhite').prop('checked')) {
		var filter = new fabric.Image.filters.RemoveWhite();
		o.filters.push(filter);
		o.applyFilters(canvas.renderAll.bind(canvas));
	} else {
		o.filters.pop();
		o.applyFilters(canvas.renderAll.bind(canvas));
	}
}
function fitImgToWidth () {
	var o = canvas.getActiveObject();
	o.scaleToWidth(canvas.width);
	canvas.renderAll();
}
function fitImgToHeight () {
	var o = canvas.getActiveObject();
	o.scaleToHeight(canvas.height);
	canvas.renderAll();
}
///////////////////////////////////////////////////////////////////////////
// Panel: Mod Background
function changeBG() {
	var bg = $('#bgcolor').val();
	canvas.setBackgroundColor(bg, canvas.renderAll.bind(canvas));
}
function bgImg(url) {
	if (url == 'undefined') {url = bgUrl;}
	bgUrl = url;	
	//console.log("Setting Background Image.");
	fabric.Image.fromURL(url, function(oImg) {
		if ($('#bg_fitHeight').prop('checked')){oImg.scaleToHeight(canvas.height);}
		if ($('#bg_fitWidth').prop('checked')){oImg.scaleToWidth(canvas.width);}
		canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas));
	});
	
}
///////////////////////////////////////////////////////////////////////////
// Panel: Nudge Tools
function flush_up () {
	var o = canvas.getActiveObject();
	o.set({top: 0}).setCoords();
	canvas.renderAll();
}
function flush_down () {
	var o = canvas.getActiveObject();
	var t = canvas.getHeight() - o.getBoundingRectHeight();
	o.set({top: t}).setCoords();
	canvas.renderAll();
}
function flush_left () {
	var o = canvas.getActiveObject();
	o.set({left: 0}).setCoords();
	canvas.renderAll();
}
function flush_right () {
	var o = canvas.getActiveObject();
	var t = canvas.getWidth() - o.getBoundingRectWidth();
	o.set({left: t}).setCoords();
	canvas.renderAll();
}
function nudge_up () {
	var o = canvas.getActiveObject();
	var t = o.get('top');
	o.set({top: t-1}).setCoords();
	canvas.renderAll();
}
function nudge_down () {
	var o = canvas.getActiveObject();
	var t = o.get('top');
	o.set({top: t+1}).setCoords();
	canvas.renderAll();
}
function nudge_left () {
	var o = canvas.getActiveObject();
	var t = o.get('left');
	o.set({left: t-1}).setCoords();
	canvas.renderAll();
}
function nudge_right () {
	var o = canvas.getActiveObject();
	var t = o.get('left');
	o.set({left: t+1}).setCoords();
	canvas.renderAll();		
}
function center () {
	canvas.centerObjectH(canvas.getActiveObject());
}

///////////////////////////////////////////////////////////////////////////
// Zoom
function zoomin() {
	//console.log("Zooming in");
	var fac = (zoom + .1) / zoom;
	zoom *= fac;
	zoomIt(fac);
}
function zoomout() {
	//console.log("Zooming out");
	var fac = (zoom - .1) / zoom;
	zoom *= fac;
	zoomIt(fac);
}
function resetZoom () {
	var currHeight = canvas.getHeight();
	// Divide target height by currentHeight to get zoom factor
	var newfac = height/currHeight;
	// Some Javascript rounding errors cause us to lose a pixel.
	// If the new height is less than the target, bump up the factor a bit.
	// 190% zoom is a good test that breaks the math
	while (parseInt(canvas.getWidth() * newfac) != width || parseInt(canvas.getHeight() * newfac) != height) {
		newfac += .00001;
	}
	zoom = 1;
	zoomIt(newfac);
}
function zoomIt(factor) {
	$('#zoom_pct').text(Math.round(zoom*100)+'%');
	canvas.setHeight(canvas.getHeight() * factor);
	canvas.setWidth(canvas.getWidth() * factor);
	if (canvas.backgroundImage) {
		// Need to scale background images as well
		var bi = canvas.backgroundImage;
		bi.width = bi.width * factor; bi.height = bi.height * factor;
	}
	var objects = canvas.getObjects();
	for (var i in objects) {
		var scaleX = objects[i].scaleX;
		var scaleY = objects[i].scaleY;
		var left = objects[i].left;
		var top = objects[i].top;
	
		var tempScaleX = scaleX * factor;
		var tempScaleY = scaleY * factor;
		var tempLeft = left * factor;
		var tempTop = top * factor;

		objects[i].scaleX = tempScaleX;
		objects[i].scaleY = tempScaleY;
		objects[i].left = tempLeft;
		objects[i].top = tempTop;

		objects[i].setCoords();
	}
	canvas.renderAll(); 
}

///////////////////////////////////////////////////////////////////
// Save Files
///////////////////////////////////////////////////////////////////
function save() {
	// Get angular scope
	var scope = angular.element("body").scope();
	// Need to clear selection and remove overlay before saving.
	canvas.deactivateAll();
	if (!mask) {canvas.setOverlayImage('', canvas.renderAll.bind(canvas));}
	// If they're zoomed in, reset the image
	resetZoom();
	var name = "NewPresentation";
	name = prompt("Please enter a filename", name);
	var url = presUrl+companyId+'/'+name+'.png';
	var stat = checkUrl(url);
	//console.log("Stat: "+stat);
	if (stat) {
		if (!confirm(url+" already exists. Do you want to overwrite the existing file?")) return false;
	}
	
	$.ajax({
		type: 'POST',
		url: 'data/fabric/save.php',
		data: {
			task: 'save', 
			img: canvas.toDataURL('png'),
			json: JSON.stringify(canvas.toJSON()),
			name: name, 
			coid: companyId,
			id: currPresId
		},
		success: function(json) {
			if (!json.success) {
				alert('Error!'); return;
				currPresId = json.id;
			} else {
				//console.log("Presentation Save Successful.");
				scope.listPresentations();
				scope.getApprovalList();
				list();
			}
		}
	   });
	if (!mask) {canvas.setOverlayImage(pixelMask, canvas.renderAll.bind(canvas));}
}
function update() {
	if (currPresId == '') {alert("No presentation Id! If you are trying to save a new presentation, please use the Save As... button to give your presentation a name."); return;}
	// Get angular scope
	var scope = angular.element("body").scope();
	// Need to clear selection and remove overlay before saving.
	canvas.deactivateAll();
	if (!mask) {canvas.setOverlayImage('', canvas.renderAll.bind(canvas));}
	// If they're zoomed in, reset the image
	resetZoom();

	$.ajax({
		type: 'POST',
		url: 'data/fabric/save.php',
		data: {
			task: 'save', 
			img: canvas.toDataURL('png'),
			json: JSON.stringify(canvas.toJSON()),
			name: currPresName, 
			coid: companyId,
			id: currPresId
		},
		success: function(json) {
			if (!json.success) {
				alert('Error!'); return;
				currPresId = json.id;
			} else {
				//console.log("Presentation Save Successful.");
				scope.listPresentations();
				scope.getApprovalList();
				list();
			}
		}
	   });
	if (!mask) {canvas.setOverlayImage(pixelMask, canvas.renderAll.bind(canvas));}
}
function checkUrl(url){
	var request = new XMLHttpRequest;
	request.open('GET', url, false);
	request.send();
	if (request.status==200) {
		return true;
	} else {return false;}
}

/////////////////////////////////////////////////////////////////////////
// Load Files
/////////////////////////////////////////////////////////////////////////
function list() {
	$('#files').empty();
	// Get a list of presentations and load them in the sidebar
	$.ajax({
		type: 'GET',
		url: 'data/fabric/listPresentations.php',
		success: function(json) {
			var j = JSON.parse(json);
			for (i = 0; i < j.length; ++i) {
				var a = j[i];
				$('#files').append('<div onclick="loadFromUrl(\''+a.url+'\')"><img src="'+a.url+'"><br>'+a.name+'</div>');
			}
		}
	});
}

function loadPresentation(id) {
	//console.log("We should be loading "+id);
	var oldZoom = zoom;
	resetZoom();
	$.ajax({
		type: 'GET',
		url: 'data/fabric/loadPresentation.php',
		data: {
			id: id
		},
		success: function(data) {
			//console.log("Success");
			var j = JSON.parse(data.json);
			currPresName = data.name;
			currPresId = data.id;
			canvas.loadFromJSON(j);
			setTimeout(function() {
				zoom = oldZoom;
				zoomIt(oldZoom);
			}, 500);
		}
	});
}
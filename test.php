<html>
<head>

</head>
<body style="background-color: black; color: white; margin: 0;">
<canvas id="c" style="border:1px solid #000;"></canvas>
</body>
<script src="js/fabric/fabric.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script>
var di = getDisplayId();
console.log("Start di: "+di);
function getDisplayId() {
	$.ajax({
		type: 'GET',
		url: 'data/getDisplayId.php',
		done: function(data) {
			console.log(data);
		}
	}).done(
		function(data) {
			console.log("Dot done "+data);
		}
	);
}
</script>
</html>
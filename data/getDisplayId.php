<?php
$file = '../did.txt';
if (file_exists($file)) {
	$displayId = file($file);
} else {
	$displayId = array('error');
}
echo $displayId[0];
?>
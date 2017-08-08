<?php
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header('Content-Type: text/javascript; charset=UTF-8');
date_default_timezone_set('EST');

// Include the file
require("logging.class.php");

// Make it global so we load it for every page/app
global $log;
// Open your log
$log = new logging();
// set path and name of log file (optional)
$logpath = "../logs/~js_log_player.txt";
$log->lfile($logpath);

$msg = "failure - no JSNLog messages found in request";
$jslog_input = json_decode($HTTP_RAW_POST_DATA,true);
if (is_array($jslog_input) && array_key_exists("lg",$jslog_input)) {
	$msg="success";
	 $JLKeys = parse_ini_file("jsnlog.ini.php",true);
	 $log_options = array(0,'','');
	 if (is_array($JLKeys) && array_key_exists('server',$JLKeys)) {
	 	foreach($JLKeys['server'] as $key => $item) {
	 		switch($key) {
	 			case "msg_type":
	 				$log_options[0] = $item;
	 				break;
	 			case "destination":
	 				$log_options[1] = $item;
	 				break;
	 			case "extra_headers":
	 				$log_options[2] = $item;
	 				break;
	 		}
	  	}
	 }
		 foreach($jslog_input["lg"] as $msgItem) {
	 	 $jslog_msg = $msgItem["m"];
		 $log->lwrite("$jslog_msg");
	 }
}

<h1>DYNAMIC UPDATE SYSTEM</h1>
<?php
ini_set('max_execution_time',300);

$baseDir = 'C:/shine_player/updates';

$update = file_get_contents('https://shineemc.com/updates/player.zip') or die ('ERROR');

// Check for our update directory's existence
if ( is_dir( $baseDir ) ) {
	// Delete all files in the update directory so we can start fresh.
	rrmdir($baseDir);
	echo '<p>Removing old update files.</p>';
	mkdir($baseDir);
} else {
	mkdir($baseDir);
} 

// Write the file to disk.
$dlHandler = fopen($baseDir.'/player.zip', 'w');
if ( !fwrite($dlHandler, $update) ) { echo '<p>Could not save new update. Operation aborted.</p>'; exit(); }
fclose($dlHandler);

// Unzip and write our files
$zipHandle = zip_open('C:/shine_player/updates/player.zip');
while ($aF = zip_read($zipHandle) ) {
	$thisFileName = zip_entry_name($aF);
    $thisFileDir = dirname($thisFileName);
	
	//Continue if its not a file
    if ( substr($thisFileName,-1,1) == '/') continue;
                   
    
    //Make the directory if we need to...
    if ( !is_dir ( $baseDir.'/'.$thisFileDir ) ) {
        mkdir ( $baseDir.'/'.$thisFileDir );
        echo '<li>Created Directory '.$thisFileDir.'</li>';
	}
	
	// Start writing files...
	$file = zip_entry_read($aF, zip_entry_filesize($aF));
	$filehandle = fopen($baseDir.'/'.$thisFileName, 'w');
    fwrite($filehandle, $file);
    fclose($filehandle);
    unset($file);
	
}

// Execute our upgrade script...
include ($baseDir.'/upgrade.php');


// Here be dragons...
function rrmdir($dir) {
	if (is_dir($dir)) {
		$objects = scandir($dir);
		foreach ($objects as $object) {
			if ($object != "." && $object != "..") {
				if (filetype($dir."/".$object) == "dir") {
					rrmdir($dir."/".$object); 
				} else {
					unlink($dir."/".$object);
				}
			}
		}
		reset($objects);
		rmdir($dir);
	}
}
?>


<?php

$path = $_SERVER["SCRIPT_NAME"];

function static_file_serve() {
	global $path;
	if (file_exists("." . $path) === FALSE) {
		echo "path not found: .".$path;
		exit;
	}
	header("Content-Type: application/javascript");
	echo file_get_contents("." . $path);
	exit;
}

if (strpos($path, "/assets") === 0) {
	static_file_serve();
}

if (strpos($path, "/static-assets") === 0) {
	static_file_serve();
}

echo file_get_contents("index.html");

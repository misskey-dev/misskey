<?php

/* PLEASE DONT USE THIS SCRIPT IN PRODUCTION ENVIRONMENT !!! */

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

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

if ($path === "/") {
	echo file_get_contents("index.html");
	exit;
}

if ($path === "/callback.html") {
	echo file_get_contents("callback.html");
	exit;
}

echo file_get_contents("app.html");

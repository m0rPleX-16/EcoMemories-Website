<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// PHP's built-in web server (used by `php artisan serve`) does not honour
// output_buffering from php.ini. Enable it here explicitly so that any
// stray output or PHP warnings before the response is sent do not cause
// "headers already sent" errors crashing the response.
if (ob_get_level() === 0) {
    ob_start();
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return response()->json([
        'status' => 'error',
        'data' => null,
        'message' => 'Unauthorized',
    ], 401);
})->name('login');

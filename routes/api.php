<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Activity_controller;
use App\Http\Controllers\OpenAIController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('activity', Activity_controller::class);
Route::post('/chatbot', [OpenAIController::class, 'chat']);
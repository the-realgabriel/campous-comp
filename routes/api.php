<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Activity_controller;

use App\Http\Controllers\TimetableController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AccountController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('activity', Activity_controller::class);
Route::apiResource('timetable', TimetableController::class);
Route::apiResource('transactions', TransactionController::class)->parameters(['transactions' => 'transaction']);
Route::apiResource('accounts', AccountController::class);



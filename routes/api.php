<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\InterswitchWebhookController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
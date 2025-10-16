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

Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');

// Stripe webhook (no CSRF)
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])->name('stripe.webhook');

Route::post('/payments', [PaymentController::class, 'create'])->name('payments.create');
Route::post('/interswitch/callback', [InterswitchWebhookController::class, 'handle'])->name('interswitch.callback');

Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OpenAIController;
use App\Http\Controllers\EventController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('onboarding', [OnboardingController::class, 'complete'])->name('onboarding.complete');
});

Route::middleware(['auth', 'verified', 'onboarded'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('fund', function () {
        return Inertia::render('fund');
    })->name('fund');

    Route::get('activity', function () {
        return Inertia::render('activity');
    })->name('activity');

    Route::get('timetable', function () {
        return Inertia::render('timetable');
    })->name('timetable');

    Route::get('chat', function () {
        return Inertia::render('chat');
    })->name('chat');

    Route::get('eventspace', function () {
        return Inertia::render('eventspace');
    })->name('eventspace');

    Route::get('/api/chat/history', [OpenAIController::class, 'history']);
    Route::delete('/api/chat/history', [OpenAIController::class, 'destroyHistory']);
    Route::post('/api/chatbot', [OpenAIController::class, 'chat']);

    Route::get('/api/events', [EventController::class, 'index']);
    Route::post('/api/events', [EventController::class, 'store']);
    Route::get('/api/events/{event}', [EventController::class, 'show']);
    Route::post('/api/events/{event}/join', [EventController::class, 'join']);
    Route::post('/api/events/{event}/leave', [EventController::class, 'leave']);
    Route::delete('/api/events/{event}', [EventController::class, 'destroy']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

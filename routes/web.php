<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('fund', function () {
        return Inertia::render('fund');
    })->name('fund');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('activity', function () {
        return Inertia::render('activity');
    })->name('activity');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('timetable', function () {
        return Inertia::render('timetable');
    })->name('timetable');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('chat', function () {
        return Inertia::render('chat');
    })->name('chat');
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

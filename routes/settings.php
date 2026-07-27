<?php

use App\Http\Controllers\Settings\GeneralController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', [GeneralController::class, 'edit'])->name('settings.general');
    Route::patch('settings', [GeneralController::class, 'update'])->name('settings.update');
    Route::post('settings/test-email', [GeneralController::class, 'testEmail'])->name('settings.test-email');
    Route::post('settings/test-imap', [GeneralController::class, 'testImap'])->name('settings.test-imap');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

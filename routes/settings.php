<?php

use App\Http\Controllers\Settings\GeneralController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\UserController;
use App\Http\Controllers\Settings\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', [GeneralController::class, 'edit'])->name('settings.general');
    Route::patch('settings', [GeneralController::class, 'update'])->name('settings.update');
    Route::post('settings/test-email', [GeneralController::class, 'testEmail'])->name('settings.test-email');
    Route::post('settings/test-imap', [GeneralController::class, 'testImap'])->name('settings.test-imap');
    Route::post('settings/test-google-forms', [GeneralController::class, 'testGoogleFormsApi'])->name('settings.test-google-forms');
    Route::get('api/settings/storage-analytics', [GeneralController::class, 'getStorageAnalyticsApi'])->name('settings.storage-analytics');
    Route::post('api/settings/cleanup-photos', [GeneralController::class, 'triggerPhotoCleanupApi'])->name('settings.cleanup-photos');
    Route::post('settings/verify-password', [GeneralController::class, 'verifyPassword'])->name('settings.verify-password');

    // User management (RBAC)
    Route::post('settings/users', [UserController::class, 'store'])->name('settings.users.store');
    Route::patch('settings/users/{user}', [UserController::class, 'update'])->name('settings.users.update');
    Route::delete('settings/users/{user}', [UserController::class, 'destroy'])->name('settings.users.destroy');

    // Role management (RBAC)
    Route::post('settings/roles', [RoleController::class, 'store'])->name('settings.roles.store');
    Route::patch('settings/roles/{role}', [RoleController::class, 'update'])->name('settings.roles.update');
    Route::delete('settings/roles/{role}', [RoleController::class, 'destroy'])->name('settings.roles.destroy');

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


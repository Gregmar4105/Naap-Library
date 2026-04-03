<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

use App\Http\Controllers\TapLoginController;
use App\Http\Controllers\DashboardController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::inertia('/tap-to-login', 'tap-to-login')->name('tap-to-login');
Route::post('/api/tap', [TapLoginController::class, 'processTap'])->name('api.tap');

Route::inertia('/tap-to-logout', 'tap-to-logout')->name('tap-to-logout');
Route::post('/api/tap-out', [TapLoginController::class, 'processTapOut'])->name('api.tap-out');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('api/dashboard-data', [DashboardController::class, 'getData'])->name('api.dashboard-data');
});

require __DIR__.'/settings.php';

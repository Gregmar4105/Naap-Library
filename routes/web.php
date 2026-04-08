<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

use App\Http\Controllers\FaceLoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositoryController;
use App\Http\Controllers\StudentRegistrationController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::inertia('/tap-to-login', 'tap-to-login')->name('tap-to-login');
Route::post('/api/face-login', [FaceLoginController::class, 'processFaceLogin'])->name('api.face-login');

Route::inertia('/tap-to-logout', 'tap-to-logout')->name('tap-to-logout');
Route::post('/api/face-logout', [FaceLoginController::class, 'processFaceLogout'])->name('api.face-logout');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('api/dashboard-data', [DashboardController::class, 'getData'])->name('api.dashboard-data');

    // Depository (Locker) Routes
    Route::get('depository', [DepositoryController::class, 'index'])->name('depository');
    Route::get('api/depository-data', [DepositoryController::class, 'getData'])->name('api.depository-data');
    Route::post('api/depository/scan-key', [DepositoryController::class, 'scanKey'])->name('api.depository.scan-key');
    Route::post('api/depository/assign-locker', [DepositoryController::class, 'assignLocker'])->name('api.depository.assign-locker');
    Route::post('api/depository/add-locker', [DepositoryController::class, 'addLocker'])->name('api.depository.add-locker');

    // Student Registration Routes
    Route::get('student-registration', [StudentRegistrationController::class, 'index'])->name('student-registration');
    Route::get('api/student-registration/search', [StudentRegistrationController::class, 'search'])->name('api.student-registration.search');
    Route::get('api/student-registration/next-library-id', [StudentRegistrationController::class, 'nextLibraryId'])->name('api.student-registration.next-library-id');
    Route::post('api/student-registration/register', [StudentRegistrationController::class, 'register'])->name('api.student-registration.register');
    Route::post('api/student-registration/link-card', [StudentRegistrationController::class, 'linkCard'])->name('api.student-registration.link-card');
    Route::post('api/student-registration/link-face', [StudentRegistrationController::class, 'linkFace'])->name('api.student-registration.link-face');
    Route::post('api/student-registration/verify', [StudentRegistrationController::class, 'verify'])->name('api.student-registration.verify');
});

require __DIR__.'/settings.php';

<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

use App\Http\Controllers\AI\AiController;
use App\Http\Controllers\FaceLoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositoryController;
use App\Http\Controllers\StudentRegistrationController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\MediaController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/media/serve', [MediaController::class, 'serve'])->name('media.serve');

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
    Route::post('api/student-registration/verify-face', [StudentRegistrationController::class, 'verifyFace'])->name('api.student-registration.verify-face');

    // Student Management Routes
    Route::get('student-list', [StudentController::class, 'index'])->name('student-list');
    Route::get('api/student-list-data', [StudentController::class, 'getData'])->name('api.student-list-data');
    Route::put('api/students/{libraryId}', [StudentController::class, 'update'])->name('api.students.update');
    Route::delete('api/students/{libraryId}', [StudentController::class, 'destroy'])->name('api.students.destroy');
    Route::post('api/send-email', [StudentController::class, 'sendEmail'])->name('api.send-email');

    // AI Assistant Routes
    Route::post('api/ai/test-local', [AiController::class, 'testLocalConnection'])->name('api.ai.test-local');
    Route::post('api/ai/test-api',   [AiController::class, 'testApiConnection'])->name('api.ai.test-api');
    Route::post('api/ai/chat',       [AiController::class, 'chat'])->name('api.ai.chat');
});

require __DIR__.'/settings.php';

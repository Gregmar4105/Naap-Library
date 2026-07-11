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
use App\Http\Controllers\LostLibraryIdController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\ReportsController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/media/serve', [MediaController::class, 'serve'])->name('media.serve');

Route::inertia('/tap-to-login', 'tap-to-login')->name('tap-to-login');
Route::post('/api/face-login', [FaceLoginController::class, 'processFaceLogin'])->name('api.face-login');

Route::inertia('/tap-to-logout', 'tap-to-logout')->name('tap-to-logout');
Route::post('/api/face-logout', [FaceLoginController::class, 'processFaceLogout'])->name('api.face-logout');

// Public Survey Routes
Route::get('s/{id}', [SurveyController::class, 'publicShow'])->name('survey.public');
Route::post('api/survey/{id}/submit-public', [SurveyController::class, 'submit'])->name('api.survey.submit-public');

// Public Student Self-Registration Routes
Route::get('register-student', [StudentRegistrationController::class, 'publicForm'])->name('student-registration.public-form');
Route::post('api/student-registration/public-register', [StudentRegistrationController::class, 'publicRegister'])->name('api.student-registration.public-register');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('api/dashboard-data', [DashboardController::class, 'getData'])->name('api.dashboard-data');

    // Reports Routes
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::post('/reports/ai-analyze', [ReportsController::class, 'analyze'])->name('reports.analyze');
    Route::get('/reports/export', [ReportsController::class, 'export'])->name('reports.export');

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
    Route::get('api/student-registration/generate-url-qr', [StudentRegistrationController::class, 'generateUrlQr'])->name('api.student-registration.generate-url-qr');

    // Student Management Routes
    Route::get('student-list', [StudentController::class, 'index'])->name('student-list');
    Route::get('api/student-list-data', [StudentController::class, 'getData'])->name('api.student-list-data');
    Route::put('api/students/{libraryId}', [StudentController::class, 'update'])->name('api.students.update');
    Route::delete('api/students/{libraryId}', [StudentController::class, 'destroy'])->name('api.students.destroy');
    Route::post('api/students/{libraryId}/activate', [StudentController::class, 'activate'])->name('api.students.activate');
    Route::post('api/send-email', [StudentController::class, 'sendEmail'])->name('api.send-email');

    // Lost Library ID Routes
    Route::get('lost-library-id', [LostLibraryIdController::class, 'index'])->name('lost-library-id');
    Route::get('api/lost-library-id/search', [LostLibraryIdController::class, 'search'])->name('api.lost-library-id.search');
    Route::post('api/lost-library-id/report', [LostLibraryIdController::class, 'report'])->name('api.lost-library-id.report');

    // Email Routes
    Route::get('emails', [\App\Http\Controllers\EmailController::class, 'index'])->name('emails');
    Route::get('api/emails/search', [\App\Http\Controllers\EmailController::class, 'search'])->name('api.emails.search');

    // Survey Routes
    Route::get('survey', [SurveyController::class, 'index'])->name('survey');
    Route::get('api/survey/{id}', [SurveyController::class, 'show'])->name('api.survey.show');
    Route::post('api/survey', [SurveyController::class, 'store'])->name('api.survey.store');
    Route::put('api/survey/{id}', [SurveyController::class, 'update'])->name('api.survey.update');
    Route::delete('api/survey/{id}', [SurveyController::class, 'destroy'])->name('api.survey.destroy');
    Route::post('api/survey/{id}/submit', [SurveyController::class, 'submit'])->name('api.survey.submit');
    Route::get('api/survey/{id}/responses', [SurveyController::class, 'getResponses'])->name('api.survey.responses');

    // AI Assistant Routes
    Route::post('api/ai/test-local', [AiController::class, 'testLocalConnection'])->name('api.ai.test-local');
    Route::post('api/ai/test-api',   [AiController::class, 'testApiConnection'])->name('api.ai.test-api');
    Route::post('api/ai/chat',       [AiController::class, 'chat'])->name('api.ai.chat');
    Route::get('api/ai/history',    [AiController::class, 'getHistory'])->name('api.ai.history');
    Route::get('api/ai/chats/{id}',  [AiController::class, 'getMessages'])->name('api.ai.chats.show');
    Route::delete('api/ai/chats/{id}', [AiController::class, 'deleteChat'])->name('api.ai.chats.destroy');

    // System Logs
    Route::get('system-logs', [\App\Http\Controllers\AuditTrailController::class, 'index'])->name('system-logs');

    // Calendar Notes
    Route::get('api/calendar-notes', [\App\Http\Controllers\CalendarNoteController::class, 'index'])->name('api.calendar-notes.index');
    Route::post('api/calendar-notes', [\App\Http\Controllers\CalendarNoteController::class, 'store'])->name('api.calendar-notes.store');
    Route::delete('api/calendar-notes/{id}', [\App\Http\Controllers\CalendarNoteController::class, 'destroy'])->name('api.calendar-notes.destroy');
});

require __DIR__.'/settings.php';

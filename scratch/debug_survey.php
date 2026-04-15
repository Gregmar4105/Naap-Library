<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use App\Http\Controllers\SurveyController;
use Illuminate\Support\Facades\Auth;

// Mock a user
$user = \App\Models\User::first();
Auth::login($user);

$survey = Survey::first();
if (!$survey) {
    $survey = Survey::create(['title' => 'Test', 'status' => 'draft']);
}

$request = Request::create('/api/survey/' . $survey->id, 'PUT', [
    'title' => 'Updated Title',
    'status' => 'active',
    'questions' => [
        [
            'type' => 'short_text',
            'label' => 'What is your name?',
            'required' => true
        ]
    ]
]);

$controller = new SurveyController();
try {
    $response = $controller->update($request, $survey->id);
    echo "Response: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "TRACE: " . $e->getTraceAsString() . "\n";
}

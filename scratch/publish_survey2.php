<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $service = app(App\Services\SurveyService::class);
    $survey = $service->publishToGoogleForms(2);
    echo "SUCCESS!\n";
    echo "Google Form ID: " . $survey->google_form_id . "\n";
    echo "Responder Link (Fill Form): " . $survey->responder_uri . "\n";
    echo "Edit Link (Google Forms Editor): " . $survey->edit_uri . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

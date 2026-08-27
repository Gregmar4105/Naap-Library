<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;

$folderId = '1RMlZZmFNTKdP8BYmNv53gdES4-FgCU7_';
Setting::updateOrCreate(
    ['key' => 'google_drive_folder_id'],
    ['value' => $folderId]
);

echo "Saved Google Drive Folder ID: $folderId\n";

try {
    $service = app(App\Services\SurveyService::class);
    $survey = $service->publishToGoogleForms(1);
    echo "SUCCESSFULLY CREATED GOOGLE FORM!\n";
    echo "Google Form ID: " . $survey->google_form_id . "\n";
    echo "Responder Link: " . $survey->responder_uri . "\n";
    echo "Edit Link: " . $survey->edit_uri . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

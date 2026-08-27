<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Survey;

$formId = '1zF1XNZppUBZIJqbkxoOPuNEHAXLlfsHh4JRLS8lmpK8';
$responder = 'https://docs.google.com/forms/d/e/1FAIpQLSe3RBBmdLWbm-A39Qpq7hDA5g8WmZzfC3nJXm3B0y1QnRC66Q/viewform';
$edit = 'https://docs.google.com/forms/d/1zF1XNZppUBZIJqbkxoOPuNEHAXLlfsHh4JRLS8lmpK8/edit';

foreach (Survey::all() as $survey) {
    $survey->update([
        'google_form_id' => $formId,
        'responder_uri'  => $responder,
        'edit_uri'       => $edit,
        'is_google_form' => true,
    ]);
}

echo "All surveys updated successfully!\n";

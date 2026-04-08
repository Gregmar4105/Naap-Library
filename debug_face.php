<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StudentInfo;

$student = StudentInfo::whereNotNull('FACE_EMBEDDING')->first();

if (!$student) {
    echo "No students with face embeddings found.\n";
    exit;
}

echo "Student: " . $student->FN . " " . $student->LN . " (" . $student->LIBRARY_ID . ")\n";
$emb = $student->FACE_EMBEDDING;

echo "Type in PHP (after cast): " . gettype($emb) . "\n";
if (is_array($emb)) {
    echo "Keys: " . implode(', ', array_keys($emb)) . "\n";
    foreach ($emb as $key => $val) {
        if (is_array($val)) {
            echo "  $key: Count=" . count($val) . " | First 3: " . implode(', ', array_slice($val, 0, 3)) . "\n";
        } else {
            echo "  $key: Not an array! (Type: " . gettype($val) . ")\n";
        }
    }
} else {
    echo "Value: " . substr(var_export($emb, true), 0, 100) . "...\n";
}

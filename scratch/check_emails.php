<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StudentInfo;
use App\Models\EmailMessage;

echo "=== STUDENTS ===\n";
foreach (StudentInfo::all() as $s) {
    echo "ID: {$s->LIBRARY_ID} | Name: {$s->FN} {$s->LN} | Email: {$s->EMAIL} | PIC: {$s->PIC}\n";
}

echo "\n=== EMAIL MESSAGES (LAST 10) ===\n";
foreach (EmailMessage::latest()->limit(10)->get() as $m) {
    echo "ID: {$m->id} | Direction: {$m->direction} | From: {$m->from_email} | SentTo/To: {$m->to_email}/{$m->sent_to} | LibID: {$m->library_id} | Subject: {$m->subject}\n";
}

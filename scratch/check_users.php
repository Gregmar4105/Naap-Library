<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Schema;

echo "Columns in users table:\n";
print_r(Schema::getColumnListing('users'));

echo "\nUsers:\n";
foreach (User::all() as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email}\n";
}

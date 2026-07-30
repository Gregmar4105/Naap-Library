<?php
$emails = [
    'lorenzorayjohn5@gmail.com',
    'djkhalid3m@gmail.com',
    'mail-noreply@larksuite.com',
    'gregmarresurreccion4105@gmail.com'
];

foreach ($emails as $e) {
    $hash = md5(strtolower(trim($e)));
    $url = "https://www.gravatar.com/avatar/{$hash}?d=mp";
    echo "Email: {$e}\nGravatar: {$url}\n\n";
}

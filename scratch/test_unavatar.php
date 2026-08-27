<?php
$emails = [
    'djkhalid3m@gmail.com',
    'lorenzorayjohn5@gmail.com',
    'mail-noreply@larksuite.com',
    'gregmarresurreccion4105@gmail.com'
];

foreach ($emails as $e) {
    $url = "https://unavatar.io/" . urlencode($e) . "?fallback=false";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $target = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    echo "Email: {$e} | Code: {$code} | Target: {$target}\n";
}

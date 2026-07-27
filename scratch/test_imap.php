<?php

$host = 'imap.larksuite.com';
$port = 993;
$user = 'naaplibrary@larable.dev';
$pass = '3BgoCA1F0mU26cfR';

echo "Connecting to ssl://$host:$port...\n";
$fp = fsockopen("ssl://$host", $port, $errno, $errstr, 10);
if (!$fp) {
    die("Connection failed: $errstr ($errno)\n");
}

echo "Greeting: " . fgets($fp);

fwrite($fp, "A001 LOGIN $user $pass\r\n");
echo "Login response:\n";
while ($line = fgets($fp)) {
    echo $line;
    if (str_contains($line, 'A001 OK') || str_contains($line, 'A001 NO') || str_contains($line, 'A001 BAD')) {
        break;
    }
}

fwrite($fp, "A002 SELECT INBOX\r\n");
echo "Select response:\n";
while ($line = fgets($fp)) {
    echo $line;
    if (str_contains($line, 'A002 OK') || str_contains($line, 'A002 NO') || str_contains($line, 'A002 BAD')) {
        break;
    }
}

fwrite($fp, "A003 LOGOUT\r\n");
fclose($fp);

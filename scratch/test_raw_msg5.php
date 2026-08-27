<?php

$host = 'imap.larksuite.com';
$port = 993;
$user = 'naaplibrary@larable.dev';
$pass = '3BgoCA1F0mU26cfR';

$fp = fsockopen("ssl://$host", $port, $errno, $errstr, 15);
function sendCmd($fp, $cmd) {
    fwrite($fp, "$cmd\r\n");
    $lines = [];
    $tag = explode(' ', $cmd)[0];
    while ($line = fgets($fp)) {
        $lines[] = $line;
        if (str_contains($line, "$tag OK") || str_contains($line, "$tag NO") || str_contains($line, "$tag BAD")) {
            break;
        }
    }
    return $lines;
}

sendCmd($fp, "A001 LOGIN $user $pass");
sendCmd($fp, "A002 SELECT INBOX");

$msg5Resp = sendCmd($fp, "A005 FETCH 5 (BODY.PEEK[])");
echo "RAW MSG 5:\n" . implode('', $msg5Resp) . "\n";

sendCmd($fp, "A006 LOGOUT");
fclose($fp);

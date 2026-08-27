<?php

$host = 'imap.larksuite.com';
$port = 993;
$user = 'naaplibrary@larable.dev';
$pass = '3BgoCA1F0mU26cfR';

$fp = fsockopen("ssl://$host", $port, $errno, $errstr, 15);
sendCmd($fp, "A001 LOGIN $user $pass");
sendCmd($fp, "A002 SELECT INBOX");

$fetchResp = sendCmd($fp, "A004 FETCH 1:* (UID BODY.PEEK[HEADER.FIELDS (SUBJECT)])");
echo "FETCH 1:*\n" . implode('', $fetchResp) . "\n";

// Fetch full raw message for message 7
$msg7Resp = sendCmd($fp, "A005 FETCH 7 (BODY.PEEK[])");
echo "RAW MSG 7:\n" . implode('', $msg7Resp) . "\n";

sendCmd($fp, "A006 LOGOUT");
fclose($fp);

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

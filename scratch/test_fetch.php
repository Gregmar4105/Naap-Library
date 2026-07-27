<?php

$host = 'imap.larksuite.com';
$port = 993;
$user = 'naaplibrary@larable.dev';
$pass = '3BgoCA1F0mU26cfR';

$fp = fsockopen("ssl://$host", $port, $errno, $errstr, 15);
if (!$fp) die("Connection failed\n");

function sendCmd($fp, $cmd) {
    echo ">>> $cmd\n";
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
$searchResp = sendCmd($fp, "A003 SEARCH ALL");
echo "Search results: " . implode('', $searchResp);

$fetchResp = sendCmd($fp, "A004 FETCH 1:* (UID FLAGS BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT MESSAGE-ID)])");
echo "Fetch headers: " . implode('', $fetchResp);

$bodyResp = sendCmd($fp, "A005 FETCH 1 (BODY.PEEK[TEXT])");
echo "Fetch body 1: " . implode('', array_slice($bodyResp, 0, 15));

sendCmd($fp, "A006 LOGOUT");
fclose($fp);

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
        if (preg_match('/^' . preg_quote($tag, '/') . '\s+(OK|NO|BAD)/i', $line)) {
            break;
        }
    }
    return $lines;
}

sendCmd($fp, "A001 LOGIN $user $pass");
sendCmd($fp, "A002 SELECT INBOX");

// Search all UIDs
$searchResp = sendCmd($fp, "A003 UID SEARCH ALL");
echo "UID SEARCH: " . implode('', $searchResp);

// Fetch last UID
$uidMsgResp = sendCmd($fp, "A004 UID FETCH 11 (BODY.PEEK[])");
sendCmd($fp, "A005 LOGOUT");
fclose($fp);

echo "Total lines: " . count($uidMsgResp) . "\n";
echo "First 5 lines:\n" . implode('', array_slice($uidMsgResp, 0, 5)) . "\n";

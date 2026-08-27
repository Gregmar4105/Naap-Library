<?php

$body = "sige kupalOn Tue, Jul 28, 2026 at 1:46 AM NAAP Library System <naaplibrary@larable.dev> wrote:ulit bern";

function stripQuotedReplies(string $body): string
{
    if (str_contains($body, '<')) {
        $body = preg_replace('/<blockquote[^>]*>.*?<\/blockquote>/is', '', $body);
        $body = preg_replace('/<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>.*?<\/div>/is', '', $body);
        $body = preg_replace('/<div[^>]*class="[^"]*gmail_attr[^"]*"[^>]*>.*?<\/div>/is', '', $body);
    }

    $body = preg_replace('/On\s+[A-Za-z]{3},\s+[A-Za-z]{3}\s+\d+.*?wrote:.*/is', '', $body);
    $body = preg_replace('/On\s+.*?\s+wrote:\s*.*/is', '', $body);
    $body = preg_replace('/-----Original Message-----.*/is', '', $body);
    $body = preg_replace('/^>.*$/m', '', $body);

    $body = preg_replace('/<div>\s*(<br\s*\/?>)?\s*<\/div>/i', '', $body);
    $body = preg_replace('/(<br\s*\/?>\s*)+$/i', '', trim($body));

    return trim($body);
}

echo "RESULT: [" . stripQuotedReplies($body) . "]\n";

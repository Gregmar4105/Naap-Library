<?php

$rawMsg5 = <<<EOT
Arc-Authentication-Results: i=2; lms; spf=pass (client-ip:209.85.208.48)
Content-Type: multipart/alternative; boundary="000000000000b0724206579b4ee7"
Date: Tue, 28 Jul 2026 01:46:40 +0800
From: Bern Balbido <balbidobern@gmail.com>
Message-Id: <CAKLTdf9q2JxYjUqpURBNv8BK8cU5obmU1CsFHQ6vwZVXWwu88A@mail.gmail.com>
Subject: Re: Library System Message

--000000000000b0724206579b4ee7
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

sige kupal

On Tue, Jul 28, 2026 at 1:46=E2=80=AFAM NAAP Library System <naaplibrary@la=
rable.dev>
wrote:

> ulit bern

--000000000000b0724206579b4ee7
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

<div dir=3D"auto">sige kupal</div><div><br><div class=3D"gmail_quote gmail_=
quote_container"><div dir=3D"ltr" class=3D"gmail_attr">On Tue, Jul 28, 2026=
 at 1:46=E2=80=AFAM NAAP Library System &lt;<a href=3D"mailto:naaplibrary@l=
arable.dev">naaplibrary@larable.dev</a>&gt; wrote:<br></div><blockquote cla=
ss=3D"gmail_quote" style=3D"margin:0px 0px 0px 0.8ex;border-left:1px solid =
rgb(204,204,204);padding-left:1ex">ulit bern</blockquote></div></div>

--000000000000b0724206579b4ee7--
EOT;

function parseBodyResponseFixed($raw) {
    // Strip IMAP FETCH protocol headers
    $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(BODY\[.*?\]\s+\{\d+\}\r?\n/i', '', $raw);
    $raw = preg_replace('/\r?\n\)\r?\nA\d+\s+OK.*$/is', '', $raw);

    // Extract boundary string
    $boundary = null;
    if (preg_match('/boundary="?([^"\r\n;]+)"?/i', $raw, $m)) {
        $boundary = trim($m[1]);
    }

    $htmlPart = '';
    $plainPart = '';

    if ($boundary) {
        $parts = explode('--' . $boundary, $raw);
        foreach ($parts as $part) {
            $part = ltrim($part);
            if ($part === '' || $part === '--') continue;

            $subParts = preg_split('/\r?\n\r?\n/', $part, 2);
            if (count($subParts) < 2) continue;

            $headers = $subParts[0];
            $content = $subParts[1];

            // Clean trailing boundaries
            $content = preg_replace('/--$/', '', trim($content));

            // Decode transfer encoding
            if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $headers)) {
                $content = quoted_printable_decode($content);
            } elseif (preg_match('/Content-Transfer-Encoding:\s*base64/i', $headers)) {
                $content = base64_decode(trim($content)) ?: $content;
            }

            if (preg_match('/Content-Type:\s*text\/html/i', $headers)) {
                $htmlPart = $content;
            } elseif (preg_match('/Content-Type:\s*text\/plain/i', $headers)) {
                $plainPart = $content;
            }
        }
    }

    $final = '';
    if (!empty($htmlPart)) {
        $final = $htmlPart;
    } elseif (!empty($plainPart)) {
        $final = nl2br(e(trim($plainPart)));
    } else {
        if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $raw)) {
            $raw = quoted_printable_decode($raw);
        }
        $final = !str_contains($raw, '<html') && !str_contains($raw, '<div') && !str_contains($raw, '<p')
            ? nl2br(e(trim($raw)))
            : $raw;
    }

    return trim($final);
}

echo "PARSED RESULT:\n" . parseBodyResponseFixed($rawMsg5) . "\n";

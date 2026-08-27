<!DOCTYPE html>
<html>
<head>
    <title>Library Credentials</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; background-color: #024495; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; text-align: center; }
        .qr-code { margin: 25px 0; padding: 20px; background: white; border: 2px solid #024495; display: inline-block; border-radius: 10px; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        .student-info { margin-bottom: 20px; text-align: left; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .expiration-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 20px 0; text-align: left; border-radius: 6px; }
        .highlight { color: #024495; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NAAP Library Credentials</h1>
        </div>
        <div class="content">
            <p>Hello, <span class="highlight">{{ $student->FN }} {{ $student->LN }}</span>!</p>
            <p>Your registration is complete. Below are your digital library credentials for your program.</p>
            
            <div class="student-info">
                <p style="margin: 4px 0;"><strong>Library ID:</strong> {{ $student->LIBRARY_ID }}</p>
                <p style="margin: 4px 0;"><strong>Student Number:</strong> {{ $student->STUDENT_NUMBER }}</p>
                <p style="margin: 4px 0;"><strong>Program / Course:</strong> {{ $program ? $program->name . ' (' . $program->code . ')' : $student->COURSE }}</p>
                <p style="margin: 4px 0;"><strong>Semester Expiration Date:</strong> <span style="color: #d97706; font-weight: bold;">{{ $formattedRenewalDate }}</span></p>
            </div>

            <div class="expiration-box">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                    📌 <strong>Semester Expiration Notice:</strong> Your program access expires every semester on <strong>{{ $formattedRenewalDate }}</strong>. Please ensure to renew your library account prior to or upon this date to maintain uninterrupted access to library facilities.
                </p>
            </div>

            <div class="qr-code">
                <img src="{{ $message->embedData($qrCodeRaw, 'qrcode.png', 'image/png') }}" alt="QR Code" width="200" height="200" style="display: block; margin: 0 auto;">
                @if(!empty($barcodeRaw))
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                        <img src="{{ $message->embedData($barcodeRaw, 'barcode.png', 'image/png') }}" alt="Barcode" width="240" height="60" style="display: block; margin: 0 auto;">
                        @if(!empty($barcodeText))
                            <p style="font-family: monospace, Courier, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-align: center; margin-top: 6px; color: #1e293b;">{{ $barcodeText }}</p>
                        @endif
                    </div>
                @endif
            </div>

            <p>Please keep your QR code secure. You can use it to verify your identity at library terminals.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} NAAP Library System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

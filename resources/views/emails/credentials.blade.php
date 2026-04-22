<!DOCTYPE html>
<html>
<head>
    <title>Library Credentials</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; background-color: #024495; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; text-align: center; }
        .qr-code { margin: 30px 0; padding: 20px; background: white; border: 2px solid #024495; display: inline-block; border-radius: 10px; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        .student-info { margin-bottom: 20px; }
        .highlight { color: #ffb300; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NAAP Library Credentials</h1>
        </div>
        <div class="content">
            <p>Hello, <span class="highlight">{{ $student->FN }} {{ $student->LN }}</span>!</p>
            <p>Your registration is complete. Below are your digital library credentials.</p>
            
            <div class="student-info">
                <p><strong>Library ID:</strong> {{ $student->LIBRARY_ID }}</p>
                <p><strong>Student Number:</strong> {{ $student->STUDENT_NUMBER }}</p>
            </div>

            <div class="qr-code">
                <img src="{{ $message->embedData($qrCodeBase64, 'qrcode.png', 'image/png') }}" alt="QR Code" width="200" height="200">
            </div>

            <p>Please keep this QR code secure. You can use it to verify your identity at the library terminals.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} NAAP Library System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

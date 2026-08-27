<!DOCTYPE html>
<html>
<head>
    <title>Library Account Information</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; background-color: #024495; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; text-align: center; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        .student-info { margin-bottom: 20px; text-align: left; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .highlight { color: #024495; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 20px;">NAAP Library System</h1>
        </div>
        <div class="content">
            <p>Hello, <span class="highlight">{{ $student->FN }} {{ $student->LN }}</span>!</p>
            <p>Here is an update regarding your library account information and activity record.</p>
            
            <div class="student-info">
                <p style="margin: 4px 0;"><strong>Student Name:</strong> {{ $student->FN }} {{ $student->LN }}</p>
                <p style="margin: 4px 0;"><strong>Library ID:</strong> {{ $student->LIBRARY_ID }}</p>
                <p style="margin: 4px 0;"><strong>Student Number:</strong> {{ $student->STUDENT_NUMBER }}</p>
                <p style="margin: 4px 0;"><strong>Program / Course:</strong> {{ $student->COURSE }}</p>
            </div>

            <div class="student-info">
                <p style="margin: 4px 0;"><strong>Category:</strong> {{ $violationType->name ?? 'Account Record' }}</p>
                <p style="margin: 4px 0;"><strong>Level:</strong> {{ $violationType->severity ?? 'Standard' }}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> {{ $formattedDate }}</p>
                @if(!empty($studentViolation->notes))
                    <p style="margin: 4px 0;"><strong>Notes:</strong> {{ $studentViolation->notes }}</p>
                @endif
            </div>

            <div style="margin: 20px 0; padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 14px;">
                <strong>Active Record Count:</strong> {{ $activeViolationsCount }} of {{ $maxAllowedViolations }}
            </div>

            @if($isExpired)
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px 16px; margin: 20px 0; text-align: left; border-radius: 6px; color: #991b1b; font-size: 13px;">
                    <strong>Account Status:</strong> Your account limit of {{ $maxAllowedViolations }} active records has been reached. Please contact the library office for account assistance.
                </div>
            @endif

            <p style="margin-top: 20px; font-size: 13px; color: #666;">Thank you for using the NAAP Library System.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} NAAP Library System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

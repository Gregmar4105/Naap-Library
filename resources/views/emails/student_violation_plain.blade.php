NAAP Library Service Notification
Official Update Regarding Your Library Account Record

Hello {{ $student->FN }} {{ $student->LN }},

This email is an official notice regarding an update to your library account activity record.

STUDENT SUMMARY:
- Student Name: {{ $student->FN }} {{ $student->MN ? $student->MN . ' ' : '' }}{{ $student->LN }}
- Student Number: {{ $student->STUDENT_NUMBER }}
- Library ID: {{ $student->LIBRARY_ID }}
- Program / Course: {{ $student->COURSE }}

ACTIVITY DETAILS:
- Record Title: {{ $violationType->name ?? 'Library Account Entry' }} (Severity: {{ $violationType->severity ?? 'Minor' }})
- Record Code: {{ $violationType->code ?? 'RECORD' }}
- Date & Time: {{ $formattedDate }}
@if(!empty($studentViolation->issued_by))
- Issued By: {{ $studentViolation->issued_by }}
@endif
@if(!empty($studentViolation->notes))
- Details / Notes: {{ $studentViolation->notes }}
@endif

ACCOUNT STATUS:
Active Account Entries: {{ $activeViolationsCount }} of {{ $maxAllowedViolations }} Allowance Limit

@if($isExpired)
LIBRARY ACCOUNT STATUS: INACTIVE
Your account has reached {{ $maxAllowedViolations }} active entries. Consequently, your library account status is currently set to inactive pending administrative review.

Next Step: Please visit the Library Administration Office during regular hours to update your account status.
@else
Note: You currently have {{ $activeViolationsCount }} active entry/entries on record. Reaching {{ $maxAllowedViolations }} active entries will update your account status to pending review.
@endif

If you have any questions regarding this account record, please feel free to reach out to the Library Staff.

--
NAAP Library Management System
This is an automated system notification.

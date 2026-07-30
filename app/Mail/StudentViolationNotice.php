<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentViolationNotice extends Mailable
{
    use Queueable, SerializesModels;

    public $studentViolation;
    public $student;
    public $violationType;
    public $activeViolationsCount;
    public $maxAllowedViolations;
    public $isExpired;
    public $formattedDate;

    /**
     * Create a new message instance.
     */
    public function __construct(
        $studentViolation,
        $student,
        $violationType,
        int $activeViolationsCount = 1,
        int $maxAllowedViolations = 3,
        bool $isExpired = false
    ) {
        $this->studentViolation = $studentViolation;
        $this->student = $student;
        $this->violationType = $violationType;
        $this->activeViolationsCount = $activeViolationsCount;
        $this->maxAllowedViolations = $maxAllowedViolations;
        $this->isExpired = $isExpired;

        $occurred = $studentViolation->occurred_at ?? now();
        $this->formattedDate = \Carbon\Carbon::parse($occurred)->format('F j, Y g:i A');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Library Account Information',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student_violation',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}

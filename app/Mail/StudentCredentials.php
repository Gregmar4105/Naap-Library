<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $qrCodeRaw;
    public $barcodeRaw;

    /**
     * Create a new message instance.
     */
    public function __construct($student, $qrCodeBase64, $barcodeBase64 = null)
    {
        $this->student = $student;
        $this->qrCodeRaw = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $qrCodeBase64));
        if ($barcodeBase64) {
            $this->barcodeRaw = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $barcodeBase64));
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Library Digital Credentials',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.credentials',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];
        
        if ($this->qrCodeRaw) {
            $attachments[] = Attachment::fromData(fn() => $this->qrCodeRaw, 'qrcode.png', 'image/png');
        }

        if ($this->barcodeRaw) {
            $attachments[] = Attachment::fromData(fn() => $this->barcodeRaw, 'barcode.png', 'image/png');
        }

        return $attachments;
    }
}

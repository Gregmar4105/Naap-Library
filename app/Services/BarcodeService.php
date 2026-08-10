<?php

namespace App\Services;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Picqer\Barcode\BarcodeGeneratorPNG;

class BarcodeService
{
    /**
     * Calculate EAN-13 Checksum (Modulo 10) for 12 numeric digits.
     */
    public static function calculateEan13Checksum(string $digits12): int
    {
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $digits12[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }
        return (10 - ($sum % 10)) % 10;
    }

    /**
     * Generate a system-wide barcode string from a Library ID.
     * Format: 2-digit year + '-' + 5-digit sequence (e.g., '26-00001')
     */
    public static function generateEan13(string $libraryId): string
    {
        $libraryId = trim($libraryId);

        // If already in YY-SEQUENCE format (e.g. 26-00001), return it directly
        if (preg_match('/^\d{2}-\d+$/', $libraryId)) {
            return $libraryId;
        }

        $year = date('y'); // e.g. "26"
        $sequenceNum = 1;

        if (preg_match('/^(\d{2,4})-(\d+)$/', $libraryId, $matches)) {
            $year = strlen($matches[1]) === 4 ? substr($matches[1], -2) : $matches[1];
            $sequenceNum = intval($matches[2]);
        } elseif (preg_match('/(\d+)/', $libraryId, $matches)) {
            $sequenceNum = intval($matches[1]);
        } else {
            $sequenceNum = abs(crc32($libraryId)) % 100000;
        }

        return str_pad($year, 2, '0', STR_PAD_LEFT) . '-' . str_pad((string)$sequenceNum, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Format barcode string for clean display: e.g. "26-0001", "26-0289"
     */
    public static function formatEan13Display(string $barcode): string
    {
        $barcode = trim($barcode);
        if (preg_match('/^\d{2}-\d+$/', $barcode)) {
            return $barcode;
        }

        // Fallback formatting for raw digits
        $digits = preg_replace('/\D/', '', $barcode);
        if (strlen($digits) >= 6) {
            $year = substr($digits, 0, 2);
            $seq = intval(substr($digits, 2));
            return $year . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
        }

        return $barcode;
    }

    /**
     * Encrypt or map a Library ID into a barcode format string (YY-SEQUENCE).
     */
    public static function encodeStudentSecret(string $libraryId): string
    {
        return self::generateEan13($libraryId);
    }

    /**
     * Decrypt or decode a scanned secret key / barcode back to the original Library ID.
     */
    public static function decodeStudentSecret(string $scannedText): string
    {
        $scannedText = trim($scannedText);

        if (preg_match('/^\d{2}-\d+$/', $scannedText)) {
            $student = \App\Models\StudentInfo::where('LIBRARY_ID', $scannedText)
                ->orWhere('STUDENT_NUMBER', $scannedText)
                ->first();

            if ($student) {
                return $student->LIBRARY_ID;
            }

            return $scannedText;
        }

        return $scannedText;
    }

    /**
     * Generate base64 Data URIs for both QR Code and Barcode (Code 128) - Pure crisp bars.
     */
    public static function generateStudentCredentialsImages(string $libraryId, bool $base64DataUri = true): array
    {
        $student = \App\Models\StudentInfo::where('LIBRARY_ID', $libraryId)
            ->orWhere('STUDENT_NUMBER', $libraryId)
            ->first();

        $studentNumber = ($student && !empty($student->STUDENT_NUMBER)) ? $student->STUDENT_NUMBER : $libraryId;
        $actualLibraryId = ($student && !empty($student->LIBRARY_ID)) ? $student->LIBRARY_ID : $libraryId;

        $qrValue = hash('sha256', $studentNumber);
        $barcodeCode = self::generateEan13($actualLibraryId);
        $formattedText = self::formatEan13Display($barcodeCode);

        // Check if GD extension is loaded, fallback to SVG if missing
        if (extension_loaded('gd')) {
            $options = new QROptions([
                'outputInterface' => QRGdImagePNG::class,
                'outputBase64' => $base64DataUri,
                'scale' => 6,
            ]);
            $qrCodeData = (new QRCode($options))->render($qrValue);

            $generator = new BarcodeGeneratorPNG();
            $rawBarcodeBinary = $generator->getBarcode($barcodeCode, $generator::TYPE_CODE_128, 2, 60);

            $barcodeData = $base64DataUri 
                ? 'data:image/png;base64,' . base64_encode($rawBarcodeBinary)
                : $rawBarcodeBinary;
        } else {
            $options = new QROptions([
                'outputInterface' => \chillerlan\QRCode\Output\QRMarkupSVG::class,
                'outputBase64' => $base64DataUri,
                'scale' => 6,
            ]);
            $qrCodeData = (new QRCode($options))->render($qrValue);

            $generator = new \Picqer\Barcode\BarcodeGeneratorSVG();
            $svgBarcode = $generator->getBarcode($barcodeCode, $generator::TYPE_CODE_128, 2, 60);
            $barcodeData = $base64DataUri
                ? 'data:image/svg+xml;base64,' . base64_encode($svgBarcode)
                : $svgBarcode;
        }

        return [
            'secret_key' => $barcodeCode,
            'ean13' => $barcodeCode,
            'formatted_ean13' => $formattedText,
            'qr_code' => $qrCodeData,
            'barcode' => $barcodeData,
        ];
    }

    /**
     * Render GD composite image putting barcode bars on top and human-readable text below.
     */
    private static function renderBarcodeWithText(string $rawBarcodePng, string $displayText): string
    {
        $srcImg = imagecreatefromstring($rawBarcodePng);
        if (!$srcImg) {
            return $rawBarcodePng;
        }

        $srcW = imagesx($srcImg);
        $srcH = imagesy($srcImg);

        $paddingTop = 8;
        $paddingBottom = 8;
        $paddingSide = 14;
        $textHeight = 16;

        $targetW = $srcW + ($paddingSide * 2);
        $targetH = $srcH + $paddingTop + $textHeight + $paddingBottom;

        $canvas = imagecreatetruecolor($targetW, $targetH);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        $black = imagecolorallocate($canvas, 0, 0, 0);

        imagefilledrectangle($canvas, 0, 0, $targetW, $targetH, $white);
        imagecopy($canvas, $srcImg, $paddingSide, $paddingTop, 0, 0, $srcW, $srcH);

        $font = 5; // GD built-in font 5 (~9px width per char)
        $fontWidth = imagefontwidth($font);
        $textWidth = strlen($displayText) * $fontWidth;

        $textX = (int) max(0, ($targetW - $textWidth) / 2);
        $textY = $paddingTop + $srcH + 2;

        imagestring($canvas, $font, $textX, $textY, $displayText, $black);

        ob_start();
        imagepng($canvas);
        $finalPng = ob_get_clean();

        imagedestroy($srcImg);
        imagedestroy($canvas);

        return $finalPng ?: $rawBarcodePng;
    }
}

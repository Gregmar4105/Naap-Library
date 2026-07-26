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
     * Generate a 13-digit EAN-13 numeric barcode string from a Library ID.
     * Format: '20' + 2-digit year + 8-digit sequence + 1-digit EAN-13 checksum
     * Example: '26-00001' => '2026000000015'
     */
    public static function generateEan13(string $libraryId): string
    {
        $libraryId = trim($libraryId);

        // If already a 13-digit numeric string, return it
        if (preg_match('/^\d{13}$/', $libraryId)) {
            return $libraryId;
        }

        $year = date('y'); // e.g. "26"
        $sequenceNum = 1;

        if (preg_match('/^(\d{2})-(\d+)$/', $libraryId, $matches)) {
            $year = $matches[1];
            $sequenceNum = intval($matches[2]);
        } elseif (preg_match('/(\d+)/', $libraryId, $matches)) {
            $sequenceNum = intval($matches[1]);
        } else {
            $sequenceNum = abs(crc32($libraryId)) % 100000000;
        }

        $digits12 = '20' . str_pad($year, 2, '0', STR_PAD_LEFT) . str_pad((string)$sequenceNum, 8, '0', STR_PAD_LEFT);
        $checksum = self::calculateEan13Checksum($digits12);

        return $digits12 . $checksum;
    }

    /**
     * Format EAN-13 string with spacing for clean display: e.g. "2026 0000 0001 5"
     */
    public static function formatEan13Display(string $ean13): string
    {
        $ean13 = preg_replace('/\D/', '', $ean13);
        if (strlen($ean13) !== 13) {
            return $ean13;
        }
        return substr($ean13, 0, 4) . ' ' . substr($ean13, 4, 4) . ' ' . substr($ean13, 8, 4) . ' ' . substr($ean13, 12, 1);
    }

    /**
     * Encrypt or map a Library ID into a compact secret key string (EAN-13 barcode format).
     */
    public static function encodeStudentSecret(string $libraryId): string
    {
        return self::generateEan13($libraryId);
    }

    /**
     * Decrypt or decode a scanned secret key / EAN-13 barcode back to the original Library ID.
     */
    public static function decodeStudentSecret(string $scannedText): string
    {
        $scannedText = trim($scannedText);

        // 1. If scanned text is a 13-digit numeric string starting with '20' (EAN-13 format)
        if (preg_match('/^20(\d{2})(\d{8})\d$/', $scannedText, $matches)) {
            $year = $matches[1];
            $seq = intval($matches[2]);
            $reconstructedId = $year . '-' . str_pad((string)$seq, 5, '0', STR_PAD_LEFT);

            // Check if student exists with reconstructed LIBRARY_ID or STUDENT_NUMBER
            $student = \App\Models\StudentInfo::where('LIBRARY_ID', $reconstructedId)
                ->orWhere('STUDENT_NUMBER', $reconstructedId)
                ->first();

            if ($student) {
                return $student->LIBRARY_ID;
            }

            return $reconstructedId;
        }

        // 2. Legacy SEC- prefix decryption fallback
        if (str_starts_with($scannedText, 'SEC-')) {
            $raw = substr($scannedText, 4);
            $base64 = strtr($raw, '-_', '+/');
            $padded = str_pad($base64, strlen($base64) + (4 - strlen($base64) % 4) % 4, '=', STR_PAD_RIGHT);
            $cipherText = base64_decode($padded, true);

            if ($cipherText !== false) {
                $appKey = config('app.key') ?? 'naap-secret-key';
                $key = substr(hash('sha256', $appKey), 0, 16);
                $iv = substr(hash('sha256', 'naap-barcode-iv-salt'), 0, 16);

                $decrypted = openssl_decrypt($cipherText, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
                if ($decrypted !== false && !empty($decrypted)) {
                    return $decrypted;
                }
            }
        }

        return $scannedText;
    }

    /**
     * Generate base64 Data URIs for both QR Code and EAN-13 Barcode with numbers rendered below.
     */
    public static function generateStudentCredentialsImages(string $libraryId, bool $base64DataUri = true): array
    {
        $student = \App\Models\StudentInfo::where('LIBRARY_ID', $libraryId)
            ->orWhere('STUDENT_NUMBER', $libraryId)
            ->first();

        $studentNumber = ($student && !empty($student->STUDENT_NUMBER)) ? $student->STUDENT_NUMBER : $libraryId;
        $actualLibraryId = ($student && !empty($student->LIBRARY_ID)) ? $student->LIBRARY_ID : $libraryId;

        $qrValue = hash('sha256', $studentNumber);
        $ean13Code = self::generateEan13($actualLibraryId);
        $formattedText = self::formatEan13Display($ean13Code);

        // Check if GD extension is loaded, fallback to SVG if missing
        if (extension_loaded('gd')) {
            $options = new QROptions([
                'outputInterface' => QRGdImagePNG::class,
                'outputBase64' => $base64DataUri,
                'scale' => 6,
            ]);
            $qrCodeData = (new QRCode($options))->render($qrValue);

            $generator = new BarcodeGeneratorPNG();
            $rawBarcodeBinary = $generator->getBarcode($ean13Code, $generator::TYPE_EAN_13, 2, 50);
            $barcodeBinary = self::renderBarcodeWithText($rawBarcodeBinary, $formattedText);

            $barcodeData = $base64DataUri 
                ? 'data:image/png;base64,' . base64_encode($barcodeBinary)
                : $barcodeBinary;
        } else {
            $options = new QROptions([
                'outputInterface' => \chillerlan\QRCode\Output\QRMarkupSVG::class,
                'outputBase64' => $base64DataUri,
                'scale' => 6,
            ]);
            $qrCodeData = (new QRCode($options))->render($qrValue);

            $generator = new \Picqer\Barcode\BarcodeGeneratorSVG();
            $svgBarcode = $generator->getBarcode($ean13Code, $generator::TYPE_EAN_13, 2, 50);
            $barcodeData = $base64DataUri
                ? 'data:image/svg+xml;base64,' . base64_encode($svgBarcode)
                : $svgBarcode;
        }

        return [
            'secret_key' => $ean13Code,
            'ean13' => $ean13Code,
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

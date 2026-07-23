<?php

namespace App\Services;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Picqer\Barcode\BarcodeGeneratorPNG;

class BarcodeService
{
    /**
     * Encrypt a Library ID into a compact secret key string for QR/Barcode encoding.
     */
    public static function encodeStudentSecret(string $libraryId): string
    {
        $appKey = config('app.key') ?? 'naap-secret-key';
        $key = substr(hash('sha256', $appKey), 0, 16);
        $iv = substr(hash('sha256', 'naap-barcode-iv-salt'), 0, 16);

        $rawEncrypted = openssl_encrypt($libraryId, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
        if ($rawEncrypted === false) {
            return $libraryId;
        }

        $urlSafeBase64 = rtrim(strtr(base64_encode($rawEncrypted), '+/', '-_'), '=');
        return 'SEC-' . $urlSafeBase64;
    }

    /**
     * Decrypt a scanned secret key back to the original Library ID.
     * Returns original string if not encoded with SEC- prefix or if decryption fails.
     */
    public static function decodeStudentSecret(string $scannedText): string
    {
        $scannedText = trim($scannedText);
        if (!str_starts_with($scannedText, 'SEC-')) {
            return $scannedText;
        }

        $raw = substr($scannedText, 4);
        $base64 = strtr($raw, '-_', '+/');
        $padded = str_pad($base64, strlen($base64) + (4 - strlen($base64) % 4) % 4, '=', STR_PAD_RIGHT);
        $cipherText = base64_decode($padded, true);

        if ($cipherText === false) {
            return $scannedText;
        }

        $appKey = config('app.key') ?? 'naap-secret-key';
        $key = substr(hash('sha256', $appKey), 0, 16);
        $iv = substr(hash('sha256', 'naap-barcode-iv-salt'), 0, 16);

        $decrypted = openssl_decrypt($cipherText, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return ($decrypted !== false && !empty($decrypted)) ? $decrypted : $scannedText;
    }

    /**
     * Generate base64 Data URIs for both QR Code and Barcode representing the student's secret key.
     */
    public static function generateStudentCredentialsImages(string $libraryId, bool $base64DataUri = true): array
    {
        $student = \App\Models\StudentInfo::where('LIBRARY_ID', $libraryId)->first();
        $studentNumber = ($student && !empty($student->STUDENT_NUMBER)) ? $student->STUDENT_NUMBER : $libraryId;

        $qrValue = hash('sha256', $studentNumber);
        $secretKey = self::encodeStudentSecret($studentNumber);

        // Generate QR Code
        $options = new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'outputBase64' => $base64DataUri,
            'scale' => 6,
        ]);
        $qrCodeData = (new QRCode($options))->render($qrValue);

        // Generate Barcode (Code 128) - optimized widthFactor (1.2) and height (45) to fit layouts perfectly
        $generator = new BarcodeGeneratorPNG();
        $barcodeBinary = $generator->getBarcode($secretKey, $generator::TYPE_CODE_128, 1.2, 45);

        $barcodeData = $base64DataUri 
            ? 'data:image/png;base64,' . base64_encode($barcodeBinary)
            : $barcodeBinary;

        return [
            'secret_key' => $secretKey,
            'qr_code' => $qrCodeData,
            'barcode' => $barcodeData,
        ];
    }
}

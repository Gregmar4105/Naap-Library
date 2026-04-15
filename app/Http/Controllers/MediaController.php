<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

class MediaController extends Controller
{
    /**
     * Serve an image from an absolute local path.
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function serve(Request $request)
    {
        $path = $request->query('path');

        if (!$path) {
            abort(404, 'Path not provided');
        }

        // Clean surrounding quotes and whitespace
        $path = trim($path, " \t\n\r\0\x0B\"");

        // Security check: Normalize path
        $path = realpath($path) ?: $path;

        if (!File::exists($path)) {
            abort(404, 'File not found on disk: ' . $path);
        }

        // Security check: Only allow images
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

        if (!in_array($extension, $allowedExtensions)) {
            abort(403, 'Access denied: Not a recognized image type.');
        }

        // Security check: Prevent path traversal (redundant because of realpath, but good for safety)
        if (str_contains($path, '..')) {
            abort(403, 'Access denied: Invalid path traversal detected.');
        }

        $file = File::get($path);
        $type = File::mimeType($path);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        return $response;
    }
}

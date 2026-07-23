<?php

namespace App\Http\Controllers;

use App\Services\AccessService;
use Illuminate\Http\Request;

class FaceLoginController extends Controller
{
    protected AccessService $accessService;

    public function __construct(AccessService $accessService)
    {
        $this->accessService = $accessService;
    }

    public function processFaceLogin(Request $request)
    {
        $request->validate([
            'library_id' => 'nullable|string',
            'rfid_number' => 'nullable|string',
            'descriptor' => 'required_without_all:library_id,rfid_number|array|size:128',
            'captured_image' => 'nullable|string',
            'method' => 'nullable|string',
        ]);

        $result = $this->accessService->processLogin($request->all());

        return response()->json($result, 200);
    }

    public function processFaceLogout(Request $request)
    {
        $request->validate([
            'library_id' => 'nullable|string',
            'rfid_number' => 'nullable|string',
            'descriptor' => 'required_without_all:library_id,rfid_number|array|size:128',
            'captured_image' => 'nullable|string',
            'method' => 'nullable|string',
        ]);

        $result = $this->accessService->processLogout($request->all());

        return response()->json($result, 200);
    }
}

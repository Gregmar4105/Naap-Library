<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditTrailController extends Controller
{
    /**
     * Display a listing of the audit trails.
     */
    public function index(Request $request)
    {
        $query = AuditTrail::orderBy('created_at', 'desc');

        // Simple search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('activity', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhere('auditable_type', 'like', "%{$search}%");
            });
        }

        // Filter by event
        if ($request->filled('event')) {
            $query->where('event', $request->input('event'));
        }

        $auditTrails = $query->paginate(20)->withQueryString();

        // Summary Statistics for KPI Cards
        $summary = [
            'totalLogs' => AuditTrail::count(),
            'totalToday' => AuditTrail::whereDate('created_at', now()->toDateString())->count(),
            'mostActiveUser' => AuditTrail::select('user_name', \DB::raw('count(*) as total'))
                ->groupBy('user_name')
                ->orderByDesc('total')
                ->first()?->user_name ?? 'N/A',
            'topEvent' => AuditTrail::select('event', \DB::raw('count(*) as total'))
                ->groupBy('event')
                ->orderByDesc('total')
                ->first()?->event ?? 'N/A',
        ];

        return Inertia::render('system-logs/index', [
            'auditTrails' => $auditTrails,
            'filters' => $request->only(['search', 'event']),
            'summary' => $summary,
        ]);
    }
}

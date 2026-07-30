import { Head, router } from '@inertiajs/react';
import {
    Plus,
    FileText,
    Settings,
    MoreVertical,
    BarChart3,
    Eye,
    Edit3,
    Trash2,
    Copy,
    Share2,
    CheckCircle2,
    AlignLeft,
    List,
    CheckSquare,
    ChevronDown,
    Star,
    CalendarDays,
    X,
    GripVertical,
    Loader2,
    Save,
    ArrowLeft,
    Users,
    Printer,
    QrCode,
    Check,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    Globe,
    Key
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

// Types
type QuestionType = 'short_text' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'rating' | 'date';

interface Question {
    id?: number;
    type: QuestionType;
    label: string;
    options?: string[];
    required: boolean;
    order?: number;
    google_item_id?: string;
}

interface Survey {
    id?: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed';
    google_form_id?: string;
    responder_uri?: string;
    edit_uri?: string;
    is_google_form?: boolean;
    questions_count?: number;
    responses_count?: number;
    created_at?: string;
    questions?: Question[];
}

interface GoogleFormsStatus {
    configured: boolean;
    success: boolean;
    message: string;
}

interface SurveyPageProps {
    surveys: Survey[];
    localIps?: string[];
    googleFormsStatus?: GoogleFormsStatus;
}

export default function SurveyPage({ surveys: initialSurveys, localIps = [], googleFormsStatus }: SurveyPageProps) {
    const [surveys, setSurveys] = useState<Survey[]>(initialSurveys);
    const [activeTab, setActiveTab] = useState<'list' | 'builder' | 'responses' | 'take'>('list');
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState<GoogleFormsStatus | undefined>(googleFormsStatus);

    const [showQrDialog, setShowQrDialog] = useState(false);
    const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
    const [selectedIp, setSelectedIp] = useState(localIps?.[0] || '127.0.0.1');
    const [serverPort, setServerPort] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.port || '';
        }
        return '';
    });
    const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null);
    const [isLoadingQr, setIsLoadingQr] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedQrSurvey, setSelectedQrSurvey] = useState<Survey | null>(null);

    useEffect(() => {
        // Fetch API status if not passed initially
        if (!apiStatus) {
            fetch('/api/survey/google-status')
                .then(res => res.json())
                .then(data => setApiStatus(data))
                .catch(err => console.error('Failed to fetch Google API status', err));
        }
    }, []);

    useEffect(() => {
        if (!showQrDialog) return;

        const fetchQrCode = async () => {
            setIsLoadingQr(true);
            try {
                const portSuffix = serverPort && serverPort !== '80' && serverPort !== '443' ? `:${serverPort}` : '';
                const surveyUrl = selectedQrSurvey
                    ? (selectedQrSurvey.responder_uri || `${window.location.protocol}//${selectedIp}${portSuffix}/s/${selectedQrSurvey.id}`)
                    : `${window.location.protocol}//${selectedIp}${portSuffix}/surveys`;
                
                const response = await fetch(`/api/student-registration/generate-url-qr?url=${encodeURIComponent(surveyUrl)}`);
                const data = await response.json();
                if (data.success) {
                    setQrCodeSrc(data.qr_code);
                }
            } catch (err) {
                console.error('Error generating Survey URL QR code:', err);
            } finally {
                setIsLoadingQr(false);
            }
        };

        const timer = setTimeout(fetchQrCode, 150);
        return () => clearTimeout(timer);
    }, [showQrDialog, selectedIp, serverPort, selectedQrSurvey]);

    const handlePrintQr = () => {
        if (!qrCodeSrc) return;
        const portSuffix = serverPort && serverPort !== '80' && serverPort !== '443' ? `:${serverPort}` : '';
        const surveyUrl = selectedQrSurvey
            ? (selectedQrSurvey.responder_uri || `${window.location.protocol}//${selectedIp}${portSuffix}/s/${selectedQrSurvey.id}`)
            : `${window.location.protocol}//${selectedIp}${portSuffix}/surveys`;
        
        const cardTitle = selectedQrSurvey ? selectedQrSurvey.title : "Library Surveys Portal";
        const cardSubtitle = selectedQrSurvey
            ? "Scan this QR code to participate and answer this Google survey on your mobile device"
            : "Scan this QR code to view active library surveys and share your feedback on your mobile device";

        const printWindow = window.open('', '_blank', 'width=600,height=650');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Survey QR Code</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                            background: white;
                            color: #1e293b;
                        }
                        .card {
                            border: 3px solid #024495;
                            border-radius: 24px;
                            padding: 40px;
                            max-width: 400px;
                            box-shadow: 0 10px 25px rgba(2, 68, 149, 0.08);
                            background: #ffffff;
                        }
                        h1 {
                            color: #024495;
                            margin-top: 0;
                            font-size: 24px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 8px;
                            line-height: 1.3;
                        }
                        .subtitle {
                            font-size: 14px;
                            color: #64748b;
                            margin: 0 0 24px 0;
                            line-height: 1.5;
                            font-weight: 500;
                        }
                        .qr-container {
                            background: #f8fafc;
                            padding: 24px;
                            border-radius: 16px;
                            display: inline-block;
                            margin-bottom: 20px;
                            border: 1px solid #e2e8f0;
                        }
                        .qr-img {
                            width: 240px;
                            height: 240px;
                            display: block;
                        }
                        .url {
                            font-family: monospace;
                            font-size: 13px;
                            background: #f1f5f9;
                            padding: 10px 16px;
                            border-radius: 10px;
                            word-break: break-all;
                            color: #024495;
                            font-weight: 700;
                            border: 1px solid #e2e8f0;
                        }
                        @media print {
                            body {
                                height: auto;
                                background: white;
                            }
                            .card {
                                border: none;
                                box-shadow: none;
                                padding: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>${cardTitle}</h1>
                        <div class="subtitle">${cardSubtitle}</div>
                        <div class="qr-container">
                            <img class="qr-img" src="${qrCodeSrc}" alt="QR Code" />
                        </div>
                        <div class="url">${surveyUrl}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleCopyUrl = () => {
        const portSuffix = serverPort && serverPort !== '80' && serverPort !== '443' ? `:${serverPort}` : '';
        const surveyUrl = selectedQrSurvey
            ? (selectedQrSurvey.responder_uri || `${window.location.protocol}//${selectedIp}${portSuffix}/s/${selectedQrSurvey.id}`)
            : `${window.location.protocol}//${selectedIp}${portSuffix}/surveys`;
        
        navigator.clipboard.writeText(surveyUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const fetchSurveys = () => {
        router.reload({ only: ['surveys', 'auth'], onSuccess: (page) => {
            if (page.props.surveys) setSurveys(page.props.surveys as unknown as Survey[]);
        }});
    };

    const handleCreateNew = () => {
        setSelectedSurvey({
            title: 'Untitled Google Survey',
            description: '',
            status: 'draft',
            is_google_form: true,
            questions: []
        });
        setActiveTab('builder');
    };

    const handleEdit = async (survey: Survey) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/survey/${survey.id}`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Could not fetch survey');
            const data = await res.json();
            setSelectedSurvey(data);
            setActiveTab('builder');
        } catch (e) {
            console.error(e);
            alert('Failed to load survey data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this survey and its Google Form?')) return;
        try {
            const res = await fetch(`/api/survey/${id}`, {
                method: 'DELETE',
                headers: { 
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Delete failed');
            fetchSurveys();
        } catch (e) {
            console.error(e);
            alert('Failed to delete survey.');
        }
    };

    const handleTakeSurvey = async (survey: Survey) => {
        if (survey.responder_uri) {
            window.open(survey.responder_uri, '_blank');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/survey/${survey.id}`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            setSelectedSurvey(data);
            setActiveTab('take');
        } catch (e) {
            console.error(e);
            alert('Failed to load survey.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewResponses = async (survey: Survey) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/survey/${survey.id}/responses`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            setSelectedSurvey(data.survey);
            setActiveTab('responses');
        } catch (e) {
            console.error(e);
            alert('Failed to load responses.');
        } finally {
            setIsLoading(false);
        }
    };

    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    return (
        <div className="relative min-h-screen flex flex-col bg-[#f4f6fa] overflow-hidden">
            <div 
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)`,
                    backgroundSize: '20px 20px',
                }}
            />

            <div className="relative z-10 flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full">
                {activeTab === 'list' && (
                    <SurveyList 
                        surveys={surveys}
                        apiStatus={apiStatus}
                        onCreateNew={handleCreateNew} 
                        onEdit={handleEdit}
                        onTake={handleTakeSurvey}
                        onDelete={handleDelete}
                        onViewResponses={handleViewResponses}
                        onOpenConfig={() => setShowGoogleConfigModal(true)}
                        onShare={(s: Survey) => {
                            setSelectedQrSurvey(s);
                            setShowQrDialog(true);
                        }}
                        onShareLocal={() => {
                            setSelectedQrSurvey(null);
                            setShowQrDialog(true);
                        }}
                    />
                )}
                {activeTab === 'builder' && selectedSurvey && (
                    <SurveyBuilder 
                        survey={selectedSurvey} 
                        apiStatus={apiStatus}
                        onClose={() => { setActiveTab('list'); fetchSurveys(); }} 
                    />
                )}
                {activeTab === 'take' && selectedSurvey && (
                    <SurveyTake 
                        survey={selectedSurvey} 
                        onClose={() => { setActiveTab('list'); }} 
                    />
                )}
                {activeTab === 'responses' && selectedSurvey && (
                    <SurveyResponses 
                        surveyId={selectedSurvey.id!} 
                        onClose={() => { setActiveTab('list'); fetchSurveys(); }} 
                    />
                )}
            </div>

            {/* Google Forms API Config Modal */}
            {showGoogleConfigModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md transition-all duration-300"
                    onClick={() => setShowGoogleConfigModal(false)}
                >
                    <div
                        className="w-full max-w-xl rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 relative flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-gray-100 pb-5 mb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-blue-50 text-[#024495] rounded-2xl flex items-center justify-center shadow-inner">
                                    <Globe className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Google Forms API Integration</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Service Account Authorization</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGoogleConfigModal(false)}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600">
                            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${apiStatus?.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                                {apiStatus?.success ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                                        <div>
                                            <p className="font-extrabold">Google Forms API Connected!</p>
                                            <p className="text-xs font-medium text-green-700">Surveys created in the system will automatically generate, update, and sync with official Google Forms.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                                        <div>
                                            <p className="font-extrabold">Google API Credentials Pending</p>
                                            <p className="text-xs font-medium text-amber-800">{apiStatus?.message || 'Set up Google Service Account JSON to enable live Google Forms creation.'}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                                <h4 className="font-black text-gray-900 flex items-center gap-2">
                                    <Key className="h-4 w-4 text-[#024495]" /> Setup Instructions:
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-xs font-medium text-gray-700">
                                    <li>Open Google Cloud Console & create a Service Account with <strong>Google Forms API</strong> and <strong>Google Drive API</strong> permissions enabled.</li>
                                    <li>Download the Service Account <strong>JSON key file</strong>.</li>
                                    <li>Save the file as <code className="bg-gray-200 px-1 py-0.5 rounded text-blue-900 font-bold">google-service-account.json</code> inside <code className="bg-gray-200 px-1 py-0.5 rounded">storage/app/</code> directory, OR set the raw JSON content in your <code className="bg-gray-200 px-1 py-0.5 rounded">.env</code> as <code className="bg-gray-200 px-1 py-0.5 rounded font-bold">GOOGLE_SERVICE_ACCOUNT_JSON</code>.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5 mt-6 flex justify-end">
                            <Button
                                onClick={() => setShowGoogleConfigModal(false)}
                                className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl px-6"
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Survey QR Modal Dialog */}
            {showQrDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md transition-all duration-300"
                    onClick={() => {
                        setShowQrDialog(false);
                        setSelectedQrSurvey(null);
                    }}
                >
                    <div
                        className="w-full max-w-lg rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 relative flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-gray-100 pb-5 mb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Survey QR Code</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mobile Share & Scan</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowQrDialog(false);
                                    setSelectedQrSurvey(null);
                                }}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-1 -mr-1">
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Students on mobile devices can scan this QR code to complete the survey directly.
                            </p>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    Select Survey
                                </label>
                                <select
                                    value={selectedQrSurvey?.id || 'portal'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'portal') {
                                            setSelectedQrSurvey(null);
                                        } else {
                                            const s = surveys.find(s => s.id === parseInt(val));
                                            if (s) setSelectedQrSurvey(s);
                                        }
                                    }}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                    <option value="portal">All Active Surveys (Portal)</option>
                                    {surveys.filter(s => s.status === 'active').map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/20 border-2 border-dashed border-emerald-600/20 rounded-3xl relative">
                                {isLoadingQr ? (
                                    <div className="h-48 w-48 flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                                    </div>
                                ) : qrCodeSrc ? (
                                    <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-md transition-transform hover:scale-[1.02] duration-200">
                                        <img
                                            src={qrCodeSrc}
                                            alt="Survey QR Code"
                                            className="h-48 w-48 block"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 w-48 flex flex-col items-center justify-center text-gray-400 text-xs">
                                        <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                        QR Generation Failed
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Survey Link URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedQrSurvey
                                            ? (selectedQrSurvey.responder_uri || `${window.location.protocol}//${selectedIp}:${serverPort || '80'}/s/${selectedQrSurvey.id}`)
                                            : `${window.location.protocol}//${selectedIp}:${serverPort || '80'}/surveys`
                                        }
                                        className="flex-1 min-w-0 font-mono text-xs font-semibold text-emerald-800 bg-emerald-50/50 border border-emerald-600/10 rounded-xl px-4 py-3 cursor-text focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyUrl}
                                        className="shrink-0 cursor-pointer flex h-11 w-11 items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 hover:text-[#024495] hover:bg-gray-100 transition-colors rounded-xl shadow-sm"
                                        title="Copy URL"
                                    >
                                        {copySuccess ? (
                                            <Check className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5 mt-5 flex shrink-0">
                            <button
                                onClick={handlePrintQr}
                                disabled={!qrCodeSrc || isLoadingQr}
                                className="w-full cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-[#024495] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#024495]/20 transition-all duration-200 hover:bg-[#013575] hover:shadow-xl hover:shadow-[#024495]/30 disabled:opacity-50"
                            >
                                <Printer className="h-5 w-5" />
                                Print QR Code Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------
// SURVEY LIST COMPONENT
// ---------------------------------------------------------
function SurveyList({ surveys, apiStatus, onCreateNew, onEdit, onTake, onDelete, onViewResponses, onOpenConfig, onShare, onShareLocal }: any) {
    const [syncingId, setSyncingId] = useState<number | null>(null);

    const handleSyncGoogle = async (survey: Survey) => {
        if (!survey.id) return;
        setSyncingId(survey.id);
        try {
            const res = await fetch(`/api/survey/${survey.id}/sync-google-responses`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const data = await res.json();
            if (data.success) {
                alert(`Google Forms Sync Completed! Synced ${data.synced_count} response(s).`);
            } else {
                alert(data.message || 'Sync failed.');
            }
        } catch (e) {
            console.error(e);
            alert('Error syncing Google Form responses.');
        } finally {
            setSyncingId(null);
        }
    };

    const handlePublishGoogle = async (survey: Survey) => {
        setSyncingId(survey.id);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch(`/api/survey/${survey.id}/publish-google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            });
            const data = await res.json();
            if (data.success) {
                alert('Successfully published to Google Forms!');
                window.location.reload();
            } else {
                alert('Google Forms Notice: ' + (data.message || 'Could not publish form'));
            }
        } catch (err: any) {
            alert('Error publishing to Google Forms: ' + (err.message || 'Server error'));
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#024495] flex items-center gap-3">
                        <div className="h-12 w-12 bg-[#024495] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#024495]/20">
                            <Globe className="h-6 w-6" />
                        </div>
                        Google Forms & Surveys
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium ml-16">
                        Create, edit, update, delete, and read live responses via Google Forms API.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenConfig}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-all shadow-sm ${apiStatus?.success ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100' : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                    >
                        <Globe className="h-4 w-4" />
                        {apiStatus?.success ? 'Google Forms API Active' : 'Configure Google API'}
                    </button>
                    <button 
                        onClick={onCreateNew}
                        className="flex items-center gap-2 bg-[#024495] text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" /> Create Google Form
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-gray-100 shadow-xl gap-4">
                {surveys.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-4">
                            <Globe className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">No Google Forms Yet</h3>
                        <p className="text-gray-500 mt-2">Create your first Google Form survey to start collecting responses.</p>
                    </div>
                ) : (
                    surveys.map((survey: Survey) => (
                        <div key={survey.id} className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-[#024495]/30 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-black text-gray-900">{survey.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1">{survey.description || 'No description'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0
                                        ${survey.status === 'active' ? 'bg-green-100 text-green-700' : 
                                          survey.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                                    `}>
                                        {survey.status}
                                    </div>
                                    {survey.google_form_id && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                            Google Form
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 mt-2 mb-6 text-sm text-gray-500 font-bold">
                                <div className="flex items-center gap-2">
                                    <List className="h-4 w-4" /> {survey.questions_count || 0} Questions
                                </div>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> {survey.responses_count || 0} Responses
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex gap-2 items-center">
                                    <button onClick={() => onEdit(survey)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg hover:text-[#024495] transition-colors" title="Edit Survey & Questions">
                                        <Edit3 className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onViewResponses(survey)} className="p-2 text-gray-400 hover:bg-blue-50 rounded-lg hover:text-[#024495] transition-colors" title="View Response Analytics">
                                        <BarChart3 className="h-5 w-5" />
                                    </button>
                                    {survey.google_form_id && (
                                        <button 
                                            onClick={() => handleSyncGoogle(survey)} 
                                            disabled={syncingId === survey.id}
                                            className="p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors" 
                                            title="Sync Live Responses from Google Forms"
                                        >
                                            <RefreshCw className={`h-5 w-5 ${syncingId === survey.id ? 'animate-spin text-emerald-600' : ''}`} />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(survey.id!)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => onShare(survey)} 
                                        disabled={survey.status !== 'active'}
                                        className={`p-2 rounded-lg transition-colors ${survey.status === 'active' ? 'text-gray-400 hover:bg-green-50 hover:text-green-600' : 'text-gray-200 cursor-not-allowed'}`} 
                                        title="Share QR Code"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                {survey.google_form_id ? (
                                    <div className="flex items-center gap-2">
                                        {survey.edit_uri && (
                                            <a
                                                href={survey.edit_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#024495] hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors border border-gray-200"
                                                title="Open in Google Forms Editor"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> Edit Form
                                            </a>
                                        )}
                                        {survey.responder_uri && (
                                            <a
                                                href={survey.responder_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[#024495] font-black hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors text-sm border border-blue-200 bg-blue-50/50"
                                                title="Open public Google Form for filling"
                                            >
                                                <Globe className="h-4 w-4" /> Fill Google Form
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handlePublishGoogle(survey)}
                                            disabled={syncingId === survey.id}
                                            className="flex items-center gap-2 bg-[#024495] text-white font-extrabold hover:bg-[#013575] px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-[#024495]/20"
                                            title="Publish survey to Google Forms"
                                        >
                                            {syncingId === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                            Publish to Google Forms
                                        </button>
                                        <button 
                                            onClick={() => onTake(survey)}
                                            className="flex items-center gap-1.5 text-gray-500 font-bold hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors text-xs border border-gray-200"
                                        >
                                            <Eye className="h-4 w-4" /> Preview
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SURVEY BUILDER COMPONENT
// ---------------------------------------------------------
function SurveyBuilder({ survey: initialData, apiStatus, onClose }: { survey: Survey, apiStatus?: GoogleFormsStatus, onClose: () => void }) {
    const [title, setTitle] = useState(initialData.title);
    const [description, setDescription] = useState(initialData.description);
    const [status, setStatus] = useState(initialData.status);
    const [questions, setQuestions] = useState<Question[]>(initialData.questions || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddQuestion = () => {
        setQuestions([...questions, { type: 'short_text', label: '', required: false }]);
    };

    const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
        const newQ = [...questions];
        newQ[index] = { ...newQ[index], ...updates };
        setQuestions(newQ);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) return alert('Title is required');
        if (questions.length === 0) return alert('Survey needs at least one question');
        
        const invalidQ = questions.find(q => !q.label.trim());
        if (invalidQ) return alert('All questions must have a label/title');

        setIsSaving(true);
        const payload = { title, description, status, questions };
        try {
            const url = initialData.id ? `/api/survey/${initialData.id}` : '/api/survey';
            const method = initialData.id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(payload)
            });
            
            const responseText = await res.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (pError) {
                console.error('JSON Parse Error:', pError, 'Raw response:', responseText);
                return alert('Backend error: ' + responseText.substring(0, 300));
            }

            if (data.success) {
                onClose();
            } else {
                alert(data.message || 'Failed to save survey.');
            }
        } catch (e) {
            console.error(e);
            alert('A network error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                    <ArrowLeft className="h-5 w-5" /> Back
                </button>
                <div className="flex items-center gap-4">
                    <select 
                        value={status} 
                        onChange={e => setStatus(e.target.value as any)}
                        className="border-gray-200 rounded-lg text-sm font-bold focus:ring-[#024495]"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#024495] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Save Google Form
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
                {/* Header Card */}
                <div className="bg-white rounded-b-3xl rounded-t-lg p-8 border border-gray-100 border-t-8 border-t-[#024495] shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            Google Forms API Builder
                        </span>
                        {initialData.edit_uri && (
                            <a href={initialData.edit_uri} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                Open in Google Forms <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Survey Title"
                        className="w-full text-4xl font-black border-none ring-0 focus:ring-0 px-0 pb-4 border-b border-gray-100 focus:border-[#024495] transition-colors placeholder:text-gray-300 bg-transparent"
                    />
                    <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Survey Description"
                        className="w-full mt-4 text-gray-600 border-none ring-0 focus:ring-0 px-0 resize-none bg-transparent"
                        rows={2}
                    />
                </div>

                {/* Questions */}
                {questions.map((q, i) => (
                    <QuestionBuilderBlock 
                        key={i} 
                        question={q} 
                        onChange={(updates: Partial<Question>) => handleUpdateQuestion(i, updates)}
                        onRemove={() => handleRemoveQuestion(i)}
                        index={i}
                    />
                ))}

                {/* Add Button */}
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={handleAddQuestion}
                        className="bg-white border text-gray-500 shadow-sm border-gray-200 px-6 py-3 rounded-full flex items-center gap-2 hover:border-[#024495] hover:text-[#024495] font-black transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" /> Add Question
                    </button>
                </div>
            </div>
        </div>
    );
}

const QUESTION_TYPES = [
    { value: 'short_text', label: 'Short Answer', icon: AlignLeft },
    { value: 'paragraph', label: 'Paragraph', icon: AlignLeft },
    { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle2 },
    { value: 'checkboxes', label: 'Checkboxes', icon: CheckSquare },
    { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
    { value: 'rating', label: 'Linear Range (1-5)', icon: Star },
    { value: 'date', label: 'Date', icon: CalendarDays },
];

function QuestionBuilderBlock({ question, onChange, onRemove, index }: any) {
    const handleTypeChange = (e: any) => {
        const newType = e.target.value;
        const needsOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(newType);
        onChange({ 
            type: newType, 
            options: needsOptions ? (question.options?.length ? question.options : ['Option 1']) : null 
        });
    };

    const updateOption = (idx: number, val: string) => {
        const newOpts = [...(question.options || [])];
        newOpts[idx] = val;
        onChange({ options: newOpts });
    };

    const addOption = () => {
        const current = question.options || [];
        onChange({ options: [...current, `Option ${current.length + 1}`] });
    };

    const removeOption = (idx: number) => {
        const newOpts = [...(question.options || [])];
        newOpts.splice(idx, 1);
        onChange({ options: newOpts });
    };

    const needsOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type);

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab px-1 py-4 hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="pl-6 flex flex-col md:flex-row gap-4 mb-4">
                <input 
                    type="text" 
                    value={question.label}
                    onChange={e => onChange({ label: e.target.value })}
                    placeholder="Question Title"
                    className="flex-1 text-lg font-bold bg-gray-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-[#024495]"
                />
                <select 
                    value={question.type}
                    onChange={handleTypeChange}
                    className="bg-gray-50 border-none rounded-xl font-bold text-gray-700 min-w-[200px] focus:ring-2 focus:ring-[#024495]"
                >
                    {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            <div className="pl-6 mb-6">
                {!needsOptions && question.type === 'short_text' && <div className="border-b border-dotted border-gray-300 w-1/2 pb-2 text-gray-400 text-sm">Short answer text</div>}
                {!needsOptions && question.type === 'paragraph' && <div className="border-b border-dotted border-gray-300 w-full pb-8 text-gray-400 text-sm">Long answer text</div>}
                {!needsOptions && question.type === 'rating' && <div className="flex gap-4 text-gray-400"><Star className="h-6 w-6"/> ... <Star className="h-6 w-6"/></div>}
                {!needsOptions && question.type === 'date' && <div className="flex items-center gap-2 text-gray-400 border-b border-dotted w-1/4 pb-2"><CalendarDays className="h-4 w-4"/> MM/DD/YYYY</div>}

                {needsOptions && (
                    <div className="space-y-3">
                        {(question.options || []).map((opt: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 group/opt">
                                {question.type === 'multiple_choice' ? <div className="h-4 w-4 rounded-full border-2 border-gray-300" /> : 
                                 question.type === 'checkboxes' ? <div className="h-4 w-4 rounded border-2 border-gray-300" /> : 
                                 <span className="text-gray-400 text-sm font-bold">{i+1}.</span>}
                                
                                <input 
                                    type="text" 
                                    value={opt}
                                    onChange={e => updateOption(i, e.target.value)}
                                    className="flex-1 bg-transparent border-none px-0 py-1 focus:ring-0 focus:border-b-2 border-gray-200 transition-colors"
                                />
                                {question.options.length > 1 && (
                                    <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center gap-3 mt-2">
                            {question.type === 'multiple_choice' ? <div className="h-4 w-4 rounded-full border-2 border-gray-200" /> : 
                             question.type === 'checkboxes' ? <div className="h-4 w-4 rounded border-2 border-gray-200" /> : 
                             <span className="text-gray-200 text-sm font-bold">{(question.options?.length||0)+1}.</span>}
                            <button onClick={addOption} className="text-sm font-bold text-gray-400 hover:text-[#024495]">Add option</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="pl-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-4">
                <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
                    Required
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${question.required ? 'bg-[#024495]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${question.required ? 'translate-x-5' : ''}`} />
                    </div>
                    <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={question.required}
                        onChange={e => onChange({ required: e.target.checked })}
                    />
                </label>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SURVEY FILLER COMPONENT (TAKE)
// ---------------------------------------------------------
function SurveyTake({ survey, onClose }: { survey: Survey, onClose: () => void }) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const checkRequired = () => {
        for (let q of survey.questions!) {
            if (q.required) {
                const ans = answers[String(q.id)];
                if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
                    alert(`Question "${q.label}" is required.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!checkRequired()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/survey/${survey.id}/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                alert(data.message || 'Failed to submit.');
            }
        } catch (e) {
            console.error(e);
            alert('A network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-10">
                <div className="bg-white rounded-[2rem] p-10 text-center shadow-xl border border-gray-100 flex flex-col items-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Response recorded!</h2>
                    <p className="text-gray-500 mb-8">Thank you for completing this survey.</p>
                    <button onClick={onClose} className="px-8 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
             <div className="mb-4">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                    <ArrowLeft className="h-5 w-5" /> Cancel
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
                <div className="bg-white rounded-b-3xl rounded-t-lg p-8 border border-gray-100 border-t-8 border-t-[#024495] shadow-xl">
                    <h1 className="text-3xl font-black text-gray-900">{survey.title}</h1>
                    {survey.description && <p className="mt-4 text-gray-600">{survey.description}</p>}
                    <p className="mt-4 text-xs font-bold text-red-500">* Indicates required question</p>
                </div>

                {survey.questions?.map((q) => (
                    <div key={q.id!} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-shadow focus-within:shadow-md">
                        <label className="text-lg font-bold text-gray-900 mb-6 block">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        <SurveyQuestionInput 
                            question={q} 
                            value={answers[String(q.id)]} 
                            onChange={(val: any) => setAnswers(prev => ({ ...prev, [String(q.id)]: val }))} 
                        />
                    </div>
                ))}

                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-8">
                    <p className="text-sm font-bold text-gray-400">Ensure all your answers are accurate before submitting.</p>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#024495] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

function SurveyQuestionInput({ question, value, onChange }: any) {
    if (question.type === 'short_text') {
        return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="w-1/2 border-none border-b-2 border-gray-200 focus:ring-0 focus:border-[#024495] bg-transparent px-0 py-2 transition-colors" placeholder="Your answer" />;
    }
    if (question.type === 'paragraph') {
        return <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} className="w-full border-none border-b-2 border-gray-200 focus:ring-0 focus:border-[#024495] bg-transparent px-0 py-2 resize-none transition-colors" placeholder="Your answer" />;
    }
    if (question.type === 'multiple_choice') {
        return (
            <div className="space-y-3 block">
                {question.options?.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group w-fit">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${value === opt ? 'border-[#024495]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                            {value === opt && <div className="h-2.5 w-2.5 rounded-full bg-[#024495]" />}
                        </div>
                        <span className="text-gray-700 font-medium">{opt}</span>
                    </label>
                ))}
            </div>
        );
    }
    if (question.type === 'checkboxes') {
        const arr = Array.isArray(value) ? value : [];
        const toggle = (opt: string) => {
            if (arr.includes(opt)) onChange(arr.filter((x: string) => x !== opt));
            else onChange([...arr, opt]);
        };
        return (
            <div className="space-y-3 block">
                {question.options?.map((opt: string) => {
                    const isChecked = arr.includes(opt);
                    return (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group w-fit">
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#024495] border-[#024495]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                {isChecked && <CheckSquare className="h-4 w-4 text-white" />}
                            </div>
                            <span className="text-gray-700 font-medium">{opt}</span>
                        </label>
                    );
                })}
            </div>
        );
    }
    if (question.type === 'dropdown') {
        return (
            <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-1/2 border-gray-200 rounded-xl focus:ring-[#024495]">
                <option value="" disabled>Choose</option>
                {question.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }
    if (question.type === 'rating') {
        return (
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => onChange(n)} className={`p-2 rounded-full transition-all hover:scale-110 ${value >= n ? 'text-yellow-400' : 'text-gray-200'}`}>
                        <Star className="h-8 w-8" fill={value >= n ? 'currentColor' : 'none'} />
                    </button>
                ))}
            </div>
        );
    }
    if (question.type === 'date') {
        return <input type="date" value={value || ''} onChange={e => onChange(e.target.value)} className="border-none border-b-2 border-gray-200 focus:ring-0 focus:border-[#024495] bg-transparent px-0 py-2 transition-colors" />;
    }
    return null;
}

SurveyPage.layout = (page: any) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Survey', href: '/survey' },
        ]}
    >
        {page}
    </AppLayout>
);

// ---------------------------------------------------------
// SURVEY RESPONSES & ANALYTICS COMPONENT
// ---------------------------------------------------------
function SurveyResponses({ surveyId, onClose }: { surveyId: number, onClose: () => void }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState<'analytics' | 'individual'>('analytics');

    useEffect(() => {
        fetchData();
    }, [surveyId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/survey/${surveyId}/responses`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Fetch failed');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncGoogle = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`/api/survey/${surveyId}/sync-google-responses`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const result = await res.json();
            if (result.success) {
                await fetchData();
                alert(`Google Forms Sync Successful! Synced ${result.synced_count} response(s).`);
            } else {
                alert(result.message || 'Failed to sync Google Forms responses.');
            }
        } catch (e) {
            console.error(e);
            alert('Error syncing Google Form responses.');
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-[#024495] animate-spin" />
            <p className="text-gray-500 mt-4 font-bold">Loading insights...</p>
        </div>
    );

    if (!data) return <div>Error loading data.</div>;

    const { survey, total, responses, analytics } = data;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft className="h-5 w-5" /> Back
                    </button>
                    <div className="h-8 w-px bg-gray-100 mx-2" />
                    <h2 className="text-xl font-black text-gray-900">{survey.title} — Responses</h2>
                </div>
                <div className="flex items-center gap-3">
                    {survey.google_form_id && (
                        <button
                            onClick={handleSyncGoogle}
                            disabled={isSyncing}
                            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Google Form
                        </button>
                    )}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('analytics')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'analytics' ? 'bg-white text-[#024495] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BarChart3 className="h-4 w-4 inline mr-2" /> Analytics
                        </button>
                        <button 
                            onClick={() => setViewMode('individual')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'individual' ? 'bg-white text-[#024495] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users className="h-4 w-4 inline mr-2" /> Individual ({total})
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-20">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 text-[#024495] rounded-2xl flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Responses</p>
                            <h4 className="text-2xl font-black text-gray-900">{total}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Completion Rate</p>
                            <h4 className="text-2xl font-black text-gray-900">{total > 0 ? '100%' : '0%'}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last Response</p>
                            <h4 className="text-lg font-black text-gray-900">{responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleDateString() : 'N/A'}</h4>
                        </div>
                    </div>
                </div>

                {viewMode === 'analytics' ? (
                    <div className="space-y-6">
                        {analytics.map((item: any) => (
                            <div key={item.question_id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center justify-between">
                                    {item.label}
                                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter">{item.total} responses</span>
                                </h3>

                                {item.counts && (
                                    <div className="space-y-4">
                                        {Object.entries(item.counts).map(([label, count]: [string, any]) => {
                                            const percentage = item.total > 0 ? ((count / item.total) * 100).toFixed(0) : '0';
                                            return (
                                                <div key={label} className="space-y-2">
                                                    <div className="flex justify-between text-sm font-bold">
                                                        <span className="text-gray-700">{label}</span>
                                                        <span className="text-gray-400">{count} ({percentage}%)</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                        <div 
                                                            className="h-full bg-[#024495] rounded-full transition-all duration-1000" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {item.type === 'rating' && (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex justify-center flex-col items-center">
                                            <span className="text-5xl font-black text-[#024495]">{item.average || 0}</span>
                                            <div className="flex gap-1 mt-2">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <Star key={n} className={`h-5 w-5 ${item.average >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 mt-2">AVERAGE RATING</p>
                                        </div>
                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map(n => {
                                                const count = item.distribution?.[n] || 0;
                                                const percentage = item.total > 0 ? (count / item.total) * 100 : 0;
                                                return (
                                                    <div key={n} className="flex items-center gap-4">
                                                        <span className="text-xs font-bold text-gray-400 w-4">{n}</span>
                                                        <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-400 w-8">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {item.text_answers && (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {item.text_answers.map((ans: string, i: number) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-2xl text-gray-700 text-sm font-medium border border-gray-100 italic">
                                                "{ans}"
                                            </div>
                                        ))}
                                        {item.text_answers.length === 0 && <p className="text-gray-400 text-sm italic">No responses yet.</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Respondent</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date Submitted</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map((resp: any) => (
                                    <tr key={resp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{resp.respondent_name}</div>
                                            <div className="text-xs text-gray-400">{resp.respondent_email || 'No email provided'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                            {new Date(resp.submitted_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full tracking-widest">Completed</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-300 hover:text-[#024495] hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm">
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {responses.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">No individual responses recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

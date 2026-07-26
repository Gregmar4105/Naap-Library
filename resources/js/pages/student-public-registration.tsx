import { Head, Link } from '@inertiajs/react';
import {
    UserPen,
    Search,
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    Smartphone,
    AlertCircle,
    Camera,
    X,
    ArrowLeft,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Eye,
    Zap,
    Printer,
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';

const getCsrfToken = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';

interface StudentData {
    LIBRARY_ID: string;
    STUDENT_RFID_NUMBER: string | null;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    SEX: string | null;
    BIRTHDAY: string | null;
    CONTACT_NUMBER: string | null;
    EMAIL: string | null;
    PIC: string | null;
    COURSE: string | null;
    ID_STATUS: string | null;
    REGISTERED_ON: string | null;
}

type ModeType = 'register' | 'link-existing';

interface Pose {
    key: string;
    label: string;
    instruction: string;
}

const POSES: Pose[] = [
    { key: 'center', label: 'Center', instruction: 'Look straight at the camera.' },
    { key: 'up', label: 'Look Up', instruction: 'Tilt your head slightly up.' },
    { key: 'down', label: 'Look Down', instruction: 'Tilt your head slightly down.' },
    { key: 'left', label: 'Look Left', instruction: 'Turn your head slightly to the left.' },
    { key: 'right', label: 'Look Right', instruction: 'Turn your head slightly to the right.' },
];

export default function StudentPublicRegistration({
    faceThreshold = 0.45,
}: {
    faceThreshold?: number;
}) {
    const [mode, setMode] = useState<ModeType>('register');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="min-h-screen bg-slate-900 animate-pulse" />;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ffb300] selection:text-[#024495] text-slate-800 flex flex-col">
            <Head title="Public Student Registration - NAAP Library" />

            {/* Public Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Link
                                href="/"
                                className="flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-[#024495] hover:bg-gray-100 transition-colors"
                                title="Back to Welcome"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <img
                                src="https://naap.edu.ph/wp-content/uploads/2020/09/Logo-NAAP-600x165.png"
                                alt="NAAP Logo"
                                className="h-10 sm:h-12 object-contain"
                            />
                            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-[#024495] font-black tracking-tight text-lg uppercase leading-tight">
                                    Student Registration
                                </span>
                                <span className="text-xs text-gray-500 font-semibold">
                                    Online Public Portal
                                </span>
                            </div>
                        </div>

                        {/* Mode Switcher Buttons */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                            <button
                                onClick={() => setMode('register')}
                                className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                    mode === 'register'
                                        ? 'bg-[#024495] text-white shadow-md'
                                        : 'text-gray-600 hover:text-[#024495]'
                                }`}
                            >
                                <UserPen className="w-4 h-4" />
                                <span>New Student</span>
                            </button>
                            <button
                                onClick={() => setMode('link-existing')}
                                className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                    mode === 'link-existing'
                                        ? 'bg-[#024495] text-white shadow-md'
                                        : 'text-gray-600 hover:text-[#024495]'
                                }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>Link Face</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Banner Subhead */}
            <div className="bg-gradient-to-r from-[#024495] via-[#013575] to-slate-900 text-white py-6 px-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-[#ffb300] font-extrabold text-xs tracking-widest uppercase mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Liveness-Verified Self-Registration</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            {mode === 'register'
                                ? 'Student Account & Face Registration'
                                : 'Existing Student Face Enrollment'}
                        </h1>
                        <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl font-normal">
                            Fill out your information and complete automated face scan verification. No login required.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-semibold">
                        <Sparkles className="w-4 h-4 text-[#ffb300]" />
                        <span>Hands-Free Blink & Oval Alignment Active</span>
                    </div>
                </div>
            </div>

            {/* Main Content View */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {mode === 'register' ? (
                    <PublicRegisterView />
                ) : (
                    <PublicFaceLinkView />
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-500 font-medium mt-auto">
                <p>© {new Date().getFullYear()} NAAP Villamor Campus Library System. All rights reserved.</p>
            </footer>
        </div>
    );
}

/* =========================================================================
   AUTOMATED LIVENESS FACE SCANNER COMPONENT
   ========================================================================= */
interface AutomatedFaceScannerProps {
    onDescriptorsComplete: (descriptors: Record<string, number[]>) => void;
    onCancel?: () => void;
    title?: string;
}

function AutomatedFaceScanner({
    onDescriptorsComplete,
    onCancel,
    title = 'Automated Face Scan Wizard',
}: AutomatedFaceScannerProps) {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [capturedDescriptors, setCapturedDescriptors] = useState<
        Record<string, number[]>
    >({});
    const [isModelsLoaded, setIsModelsLoaded] = useState<boolean>(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>(
        'user',
    );
    const [facingError, setFacingError] = useState<string | null>(null);

    // Liveness states
    const [faceState, setFaceState] = useState<
        'NO_FACE' | 'OUTSIDE_OVAL' | 'ALIGNED' | 'BLINKED' | 'FLASHING'
    >('NO_FACE');
    const [statusMessage, setStatusMessage] = useState<string>(
        'Position your face inside the oval guide',
    );
    const [flashActive, setFlashActive] = useState<boolean>(false);
    const [flashColor, setFlashColor] = useState<string>('rgba(255, 255, 255, 0.9)');

    const videoRef = useRef<HTMLVideoElement>(null);
    const hudCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isProcessingRef = useRef<boolean>(false);

    // Eye Aspect Ratio (EAR) Blink Tracking
    const eyeClosedRef = useRef<boolean>(false);
    const lastBlinkTimeRef = useRef<number>(0);

    const currentPose = POSES[currentStep] || null;
    const isComplete = currentStep >= POSES.length;

    // Load Face-API models
    useEffect(() => {
        let mounted = true;
        const loadModels = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                if (mounted) setIsModelsLoaded(true);
            } catch (err) {
                console.error('Failed to load face API models:', err);
                if (mounted) setFacingError('Failed to load face recognition engine.');
            }
        };
        loadModels();
        return () => {
            mounted = false;
        };
    }, []);

    // Initialize Camera Stream
    const startCamera = useCallback(async () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        try {
            setFacingError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraFacing,
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error('Camera access error:', err);
            setFacingError('Camera access denied or device unavailable.');
        }
    }, [cameraFacing]);

    useEffect(() => {
        if (isModelsLoaded && !isComplete) {
            startCamera();
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isModelsLoaded, isComplete, startCamera]);

    // Calculate Eye Aspect Ratio (EAR)
    const calculateEAR = (eyePoints: { x: number; y: number }[]) => {
        const v1 = Math.hypot(
            eyePoints[1].x - eyePoints[5].x,
            eyePoints[1].y - eyePoints[5].y,
        );
        const v2 = Math.hypot(
            eyePoints[2].x - eyePoints[4].x,
            eyePoints[2].y - eyePoints[4].y,
        );
        const h = Math.hypot(
            eyePoints[0].x - eyePoints[3].x,
            eyePoints[0].y - eyePoints[3].y,
        );
        return (v1 + v2) / (2.0 * h);
    };

    // Main Face Detection Loop & Liveness HUD
    useEffect(() => {
        if (!isModelsLoaded || isComplete || !currentPose) return;

        let animationFrameId: number;

        const processFrame = async () => {
            if (
                !videoRef.current ||
                !hudCanvasRef.current ||
                isProcessingRef.current
            ) {
                animationFrameId = requestAnimationFrame(processFrame);
                return;
            }

            const video = videoRef.current;
            const canvas = hudCanvasRef.current;

            if (video.paused || video.ended || video.readyState !== 4) {
                animationFrameId = requestAnimationFrame(processFrame);
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const width = canvas.width;
            const height = canvas.height;

            const ovalCx = width / 2;
            const ovalCy = height / 2;
            const ovalRx = width * 0.28;
            const ovalRy = height * 0.38;

            ctx.clearRect(0, 0, width, height);

            try {
                const faceapi = await import('@vladmandic/face-api');
                const detections = await faceapi
                    .detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions({
                            inputSize: 320,
                            scoreThreshold: 0.5,
                        }),
                    )
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length === 0) {
                    setFaceState('NO_FACE');
                    setStatusMessage('Position face inside the oval frame');
                    drawOvalGuide(ctx, ovalCx, ovalCy, ovalRx, ovalRy, '#94a3b8');
                } else {
                    const primary = detections.reduce((prev, current) =>
                        prev.detection.box.area > current.detection.box.area
                            ? prev
                            : current,
                    );

                    const box = primary.detection.box;
                    const landmarks = primary.landmarks;
                    const points = landmarks.positions;

                    const faceCx = box.x + box.width / 2;
                    const faceCy = box.y + box.height / 2;

                    const normalizedDist =
                        Math.pow(faceCx - ovalCx, 2) / Math.pow(ovalRx, 2) +
                        Math.pow(faceCy - ovalCy, 2) / Math.pow(ovalRy, 2);

                    const isInsideOval = normalizedDist <= 0.85;

                    if (!isInsideOval) {
                        setFaceState('OUTSIDE_OVAL');
                        setStatusMessage('Move face closer inside the oval');
                        drawOvalGuide(ctx, ovalCx, ovalCy, ovalRx, ovalRy, '#f59e0b');
                    } else {
                        drawOvalGuide(ctx, ovalCx, ovalCy, ovalRx, ovalRy, '#10b981');
                        drawFaceMesh(ctx, points);

                        const leftEye = points.slice(36, 42);
                        const rightEye = points.slice(42, 48);

                        const leftEAR = calculateEAR(leftEye);
                        const rightEAR = calculateEAR(rightEye);
                        const avgEAR = (leftEAR + rightEAR) / 2;

                        const BLINK_THRESHOLD_CLOSE = 0.21;
                        const BLINK_THRESHOLD_OPEN = 0.26;

                        if (avgEAR < BLINK_THRESHOLD_CLOSE) {
                            eyeClosedRef.current = true;
                            setStatusMessage('Blink detected! Keep eyes open...');
                        } else if (
                            eyeClosedRef.current &&
                            avgEAR > BLINK_THRESHOLD_OPEN
                        ) {
                            eyeClosedRef.current = false;
                            const now = Date.now();

                            if (now - lastBlinkTimeRef.current > 800) {
                                lastBlinkTimeRef.current = now;
                                setFaceState('BLINKED');
                                setStatusMessage('Liveness verified! Capturing pose...');

                                triggerAutomatedCapture(
                                    Array.from(primary.descriptor),
                                );
                            }
                        } else {
                            setFaceState('ALIGNED');
                            setStatusMessage(
                                `Face Aligned! ${currentPose.instruction} (Blink to capture)`,
                            );
                        }
                    }
                }
            } catch (err) {
                // Ignore frame processing errors
            }

            animationFrameId = requestAnimationFrame(processFrame);
        };

        processFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isModelsLoaded, currentStep, isComplete, currentPose]);

    const drawOvalGuide = (
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        strokeColor: string,
    ) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = strokeColor;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();
    };

    const drawFaceMesh = (
        ctx: CanvasRenderingContext2D,
        points: { x: number; y: number }[],
    ) => {
        ctx.save();
        ctx.fillStyle = '#ffb300';
        ctx.strokeStyle = '#024495';
        ctx.lineWidth = 1.5;

        points.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        const drawPoly = (indices: number[], close = false) => {
            ctx.beginPath();
            ctx.moveTo(points[indices[0]].x, points[indices[0]].y);
            for (let i = 1; i < indices.length; i++) {
                ctx.lineTo(points[indices[i]].x, points[indices[i]].y);
            }
            if (close) ctx.closePath();
            ctx.stroke();
        };

        drawPoly([36, 37, 38, 39, 40, 41], true);
        drawPoly([42, 43, 44, 45, 46, 47], true);
        drawPoly([17, 18, 19, 20, 21]);
        drawPoly([22, 23, 24, 25, 26]);
        drawPoly([27, 28, 29, 30]);
        drawPoly([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], true);

        ctx.restore();
    };

    const triggerAutomatedCapture = (descriptor: number[]) => {
        if (isProcessingRef.current || !currentPose) return;
        isProcessingRef.current = true;

        setFlashActive(true);
        setFlashColor('rgba(255, 255, 255, 0.95)');

        setTimeout(() => {
            setFlashColor('rgba(2, 68, 149, 0.8)');
        }, 120);

        setTimeout(() => {
            setFlashColor('rgba(255, 179, 0, 0.8)');
        }, 240);

        setTimeout(() => {
            setFlashActive(false);

            const updated = {
                ...capturedDescriptors,
                [currentPose.key]: descriptor,
            };
            setCapturedDescriptors(updated);

            const nextStepIndex = currentStep + 1;
            setCurrentStep(nextStepIndex);
            isProcessingRef.current = false;

            if (nextStepIndex >= POSES.length) {
                onDescriptorsComplete(updated);
            }
        }, 360);
    };

    const toggleCamera = () => {
        setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xl mx-auto bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                    <h3 className="font-extrabold text-[#024495] text-lg sm:text-xl flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#ffb300]" />
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Align face inside oval & blink to capture automatically
                    </p>
                </div>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="w-full grid grid-cols-5 gap-1.5 mb-5">
                {POSES.map((pose, idx) => (
                    <div key={pose.key} className="flex flex-col items-center">
                        <div
                            className={`h-2 w-full rounded-full transition-all duration-300 ${
                                idx < currentStep
                                    ? 'bg-green-500 shadow-xs'
                                    : idx === currentStep
                                      ? 'bg-[#024495] ring-2 ring-[#024495]/20 animate-pulse'
                                      : 'bg-gray-200'
                            }`}
                        />
                        <span
                            className={`text-[10px] font-bold mt-1 tracking-tight truncate ${
                                idx === currentStep
                                    ? 'text-[#024495]'
                                    : 'text-gray-400'
                            }`}
                        >
                            {pose.label}
                        </span>
                    </div>
                ))}
            </div>

            {!isComplete ? (
                <div className="relative w-full aspect-square max-w-[340px] bg-black rounded-3xl overflow-hidden shadow-inner border-4 border-gray-100 mx-auto">
                    {flashActive && (
                        <div
                            className="absolute inset-0 z-40 transition-colors duration-100 pointer-events-none"
                            style={{ backgroundColor: flashColor }}
                        />
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            transform:
                                cameraFacing === 'user'
                                    ? 'scaleX(-1)'
                                    : 'none',
                        }}
                        className="absolute inset-0 w-full h-full object-cover brightness-105"
                    />

                    <canvas
                        ref={hudCanvasRef}
                        style={{
                            transform:
                                cameraFacing === 'user'
                                    ? 'scaleX(-1)'
                                    : 'none',
                        }}
                        className="absolute inset-0 z-10 w-full h-full pointer-events-none"
                    />

                    {!isModelsLoaded && (
                        <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#ffb300] mb-3" />
                            <p className="font-bold text-sm">
                                Loading Liveness Face Engine...
                            </p>
                        </div>
                    )}

                    {facingError && (
                        <div className="absolute inset-0 z-30 bg-red-900/90 text-white p-6 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="w-10 h-10 text-red-300 mb-2" />
                            <p className="font-bold text-sm mb-2">{facingError}</p>
                            <button
                                onClick={startCamera}
                                className="px-4 py-2 bg-white text-red-700 rounded-xl font-bold text-xs"
                            >
                                Retry Camera
                            </button>
                        </div>
                    )}

                    {currentPose && isModelsLoaded && (
                        <div className="absolute top-3 inset-x-3 z-20 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-white text-center">
                            <span className="text-[10px] font-black text-[#ffb300] uppercase tracking-wider block">
                                Pose {currentStep + 1} of {POSES.length}: {currentPose.label}
                            </span>
                            <p className="text-xs font-bold mt-0.5">
                                {currentPose.instruction}
                            </p>
                        </div>
                    )}

                    <div className="absolute bottom-3 inset-x-3 z-20 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            {faceState === 'ALIGNED' || faceState === 'BLINKED' ? (
                                <Eye className="w-4 h-4 text-green-400 animate-bounce flex-shrink-0" />
                            ) : (
                                <Zap className="w-4 h-4 text-[#ffb300] flex-shrink-0" />
                            )}
                            <p className="text-xs font-bold truncate">
                                {statusMessage}
                            </p>
                        </div>

                        <button
                            onClick={toggleCamera}
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
                            title="Flip Camera"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900">
                        Face Scanning Complete!
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        All 5 facial poses have been liveness-verified and captured successfully.
                    </p>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   TAB 1: NEW STUDENT REGISTRATION VIEW
   ========================================================================= */
function PublicRegisterView() {
    const [form, setForm] = useState({
        STUDENT_NUMBER: '',
        FN: '',
        MN: '',
        LN: '',
        SEX: '',
        BIRTHDAY: '',
        CONTACT_NUMBER: '',
        EMAIL: '',
        COURSE: '',
    });

    const [previewLibraryId, setPreviewLibraryId] = useState<string>('');
    const [picFile, setPicFile] = useState<File | null>(null);
    const [picPreview, setPicPreview] = useState<string | null>(null);

    const [descriptors, setDescriptors] = useState<Record<string, number[]> | null>(null);
    const [showFaceScanner, setShowFaceScanner] = useState<boolean>(false);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        student?: StudentData;
        qrCode?: string;
        barcode?: string;
        secretKey?: string;
    } | null>(null);

    useEffect(() => {
        fetchNextLibraryId();
    }, []);

    const fetchNextLibraryId = async () => {
        try {
            const res = await fetch('/api/public-student-registration/next-library-id');
            const data = await res.json();
            if (data.library_id) setPreviewLibraryId(data.library_id);
        } catch {
            setPreviewLibraryId('LIB-PREVIEW');
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPicFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPicPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => formData.append(k, v));
            if (picFile) formData.append('PIC', picFile);
            if (descriptors) {
                formData.append('descriptor', JSON.stringify(descriptors));
            }

            const response = await fetch('/api/public-student-registration/register', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const data = await response.json();
            setResult({
                success: response.ok,
                message: data.message,
                student: data.student,
                qrCode: data.qr_code,
                barcode: data.barcode,
                secretKey: data.secret_key,
            });
        } catch {
            setResult({
                success: false,
                message: 'A network error occurred while submitting registration.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80">
                <h2 className="text-xl font-extrabold text-[#024495] mb-1 flex items-center gap-2">
                    <UserPen className="w-5 h-5 text-[#ffb300]" />
                    Student Details
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    Enter your personal and academic information below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Student Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="STUDENT_NUMBER"
                                value={form.STUDENT_NUMBER}
                                onChange={handleChange}
                                required
                                placeholder="e.g. 2026-00123"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Library ID <span className="text-gray-400 font-normal">(Auto)</span>
                            </label>
                            <input
                                type="text"
                                value={previewLibraryId}
                                readOnly
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="FN"
                                value={form.FN}
                                onChange={handleChange}
                                required
                                placeholder="Juan"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Middle Name
                            </label>
                            <input
                                type="text"
                                name="MN"
                                value={form.MN}
                                onChange={handleChange}
                                placeholder="Santos"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="LN"
                                value={form.LN}
                                onChange={handleChange}
                                required
                                placeholder="Dela Cruz"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Sex
                            </label>
                            <select
                                name="SEX"
                                value={form.SEX}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            >
                                <option value="">Select Sex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Birthday
                            </label>
                            <input
                                type="date"
                                name="BIRTHDAY"
                                value={form.BIRTHDAY}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Contact Number
                            </label>
                            <input
                                type="text"
                                name="CONTACT_NUMBER"
                                value={form.CONTACT_NUMBER}
                                onChange={handleChange}
                                placeholder="09XX-XXX-XXXX"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="EMAIL"
                                value={form.EMAIL}
                                onChange={handleChange}
                                placeholder="student@naap.edu.ph"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Course / Program <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="COURSE"
                            value={form.COURSE}
                            onChange={handleChange}
                            required
                            placeholder="e.g. BS AMT - 1st Year"
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Profile / 2x2 Photo <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="flex items-center gap-4">
                            {picPreview ? (
                                <img
                                    src={picPreview}
                                    alt="Preview"
                                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#024495]"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                    <User className="w-8 h-8" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#024495]/10 file:text-[#024495] hover:file:bg-[#024495]/20 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-[#024495] hover:bg-[#013575] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#024495]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Registering Account...</span>
                                </>
                            ) : (
                                <>
                                    <UserPen className="w-5 h-5" />
                                    <span>Complete Public Registration</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-[#ffb300]" />
                            <h3 className="font-extrabold text-[#024495] text-base">
                                Face Registration
                            </h3>
                        </div>
                        {descriptors ? (
                            <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                            </span>
                        ) : (
                            <span className="bg-amber-100 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                Required
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                        Register your face biometrics hands-free using our automated liveness detection (blink & oval guide).
                    </p>

                    {showFaceScanner ? (
                        <AutomatedFaceScanner
                            onDescriptorsComplete={(data) => {
                                setDescriptors(data);
                                setShowFaceScanner(false);
                            }}
                            onCancel={() => setShowFaceScanner(false)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-slate-50 text-center">
                            {descriptors ? (
                                <>
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="font-extrabold text-gray-800 text-sm">
                                        Face Biometrics Verified
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">
                                        5 facial poses successfully captured with blink liveness verification.
                                    </p>
                                    <button
                                        onClick={() => setShowFaceScanner(true)}
                                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                                    >
                                        Re-scan Face Poses
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-blue-50 text-[#024495] rounded-full flex items-center justify-center mb-3">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-extrabold text-gray-800 text-sm">
                                        Automated Face Scan
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-5 max-w-xs">
                                        Click below to launch automated camera. You will align your face in the oval and blink to scan.
                                    </p>
                                    <button
                                        onClick={() => setShowFaceScanner(true)}
                                        className="w-full py-3.5 bg-[#024495] hover:bg-[#013575] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#024495]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        <Camera className="w-4 h-4 text-[#ffb300]" />
                                        <span>Start Automated Face Scan</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
                        {result.success ? (
                            <>
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                                    Registration Successful!
                                </h3>
                                <p className="text-sm font-semibold text-[#024495] mb-4">
                                    {result.student?.FN} {result.student?.LN}
                                </p>

                                <div className="w-full rounded-2xl border-2 border-dashed border-[#024495]/30 bg-[#024495]/5 p-4 mb-5 flex flex-col items-center gap-3">
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-[#024495]/70 uppercase">
                                            Assigned Library ID
                                        </p>
                                        <p className="font-mono text-2xl font-black tracking-widest text-[#024495]">
                                            {result.student?.LIBRARY_ID}
                                        </p>
                                    </div>

                                    {result.qrCode && (
                                        <div className="flex flex-col gap-3 items-center w-full pt-3 border-t border-[#024495]/10">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                Digital Credentials
                                            </span>
                                            <div className="w-32 h-32 bg-white p-2 rounded-2xl border border-gray-200 flex items-center justify-center shadow-xs">
                                                <img
                                                    src={result.qrCode}
                                                    alt="QR Credentials"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            {result.barcode && (
                                                <div className="w-full bg-white p-2 rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-xs overflow-hidden">
                                                    <img
                                                        src={result.barcode}
                                                        alt="Barcode Credentials"
                                                        className="h-10 w-full object-contain"
                                                    />
                                                    {result.secretKey && (
                                                        <span className="mt-1 font-mono text-xs font-bold text-slate-800">
                                                            {result.secretKey}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-3 mb-5">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                                    >
                                        <Printer className="w-4 h-4" /> Print
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setResult(null);
                                        window.location.reload();
                                    }}
                                    className="w-full py-3.5 bg-[#024495] hover:bg-[#013575] text-white font-black text-sm rounded-2xl shadow-lg transition-all"
                                >
                                    Done / Back to Home
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-red-600 mb-2">
                                    Registration Failed
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    {result.message}
                                </p>
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-lg"
                                >
                                    Review & Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   TAB 2: EXISTING STUDENT FACE LINK VIEW
   ========================================================================= */
function PublicFaceLinkView() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
        null,
    );
    const [descriptors, setDescriptors] = useState<Record<string, number[]> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [linkResult, setLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (val.length < 2) {
            setResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `/api/public-student-registration/search?q=${encodeURIComponent(val)}`,
                );
                const data = await res.json();
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleLinkSubmit = async () => {
        if (!selectedStudent || !descriptors) return;
        setIsSubmitting(true);
        setLinkResult(null);

        try {
            const res = await fetch('/api/public-student-registration/link-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    library_id: selectedStudent.LIBRARY_ID,
                    descriptor: descriptors,
                }),
            });

            const data = await res.json();
            setLinkResult({ success: res.ok, message: data.message });
        } catch {
            setLinkResult({
                success: false,
                message: 'Failed to link face biometrics.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <h2 className="text-lg font-extrabold text-[#024495] mb-1 flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#ffb300]" />
                    Find Existing Student
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                    Search by name or student number to link face biometrics.
                </p>

                <div className="relative mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={handleSearch}
                        placeholder="Type student name or student number..."
                        className="w-full rounded-2xl border border-gray-300 pl-11 pr-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    {isSearching && (
                        <Loader2 className="w-5 h-5 animate-spin text-[#024495] absolute right-3.5 top-3.5" />
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {results.map((st) => (
                        <button
                            key={st.LIBRARY_ID}
                            onClick={() => {
                                setSelectedStudent(st);
                                setDescriptors(null);
                                setLinkResult(null);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                                selectedStudent?.LIBRARY_ID === st.LIBRARY_ID
                                    ? 'border-[#024495] bg-[#024495]/5 shadow-sm'
                                    : 'border-gray-100 hover:border-gray-300 bg-gray-50/50'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#024495] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                                {st.FN?.charAt(0)}
                                {st.LN?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-sm text-gray-900 truncate">
                                    {st.FN} {st.LN}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    ID: {st.STUDENT_NUMBER} · {st.COURSE}
                                </p>
                            </div>
                        </button>
                    ))}
                    {query.length >= 2 && results.length === 0 && !isSearching && (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                            No matching students found.
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
                {selectedStudent ? (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                        <div className="flex items-center gap-4 bg-[#024495]/5 p-4 rounded-2xl border border-[#024495]/20 mb-6">
                            <div className="w-12 h-12 rounded-full bg-[#024495] text-white font-black text-base flex items-center justify-center">
                                {selectedStudent.FN?.charAt(0)}
                                {selectedStudent.LN?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-base text-[#024495]">
                                    {selectedStudent.FN} {selectedStudent.LN}
                                </h3>
                                <p className="text-xs text-gray-600 font-medium">
                                    Student No: {selectedStudent.STUDENT_NUMBER} · Library ID: {selectedStudent.LIBRARY_ID}
                                </p>
                            </div>
                        </div>

                        <AutomatedFaceScanner
                            title="Enroll Face Biometrics"
                            onDescriptorsComplete={(data) => setDescriptors(data)}
                        />

                        {descriptors && (
                            <div className="mt-6">
                                <button
                                    onClick={handleLinkSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Saving Face Biometrics...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Save & Link Face to Student</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-200/80 text-center flex flex-col items-center justify-center">
                        <User className="w-16 h-16 text-gray-300 mb-3" />
                        <h3 className="font-black text-gray-800 text-base">
                            Select a Student
                        </h3>
                        <p className="text-xs text-gray-500 max-w-xs mt-1">
                            Search for an existing student on the left panel to begin automated face liveness enrollment.
                        </p>
                    </div>
                )}
            </div>

            {linkResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
                        {linkResult.success ? (
                            <>
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">
                                    Face Biometrics Linked!
                                </h3>
                                <p className="text-xs text-gray-600 mb-6">
                                    {linkResult.message}
                                </p>
                                <button
                                    onClick={() => {
                                        setLinkResult(null);
                                        setSelectedStudent(null);
                                        setDescriptors(null);
                                    }}
                                    className="w-full py-3.5 bg-[#024495] text-white font-bold text-sm rounded-2xl shadow-lg"
                                >
                                    Done
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-red-600 mb-2">
                                    Linking Failed
                                </h3>
                                <p className="text-xs text-gray-600 mb-6">
                                    {linkResult.message}
                                </p>
                                <button
                                    onClick={() => setLinkResult(null)}
                                    className="w-full py-3.5 bg-red-600 text-white font-bold text-sm rounded-2xl shadow-lg"
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

StudentPublicRegistration.layout = (page: any) => page;


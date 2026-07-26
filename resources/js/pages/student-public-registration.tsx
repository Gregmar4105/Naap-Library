import { Head } from '@inertiajs/react';
import {
    UserPen,
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    Smartphone,
    AlertCircle,
    Camera,
    X,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Eye,
    Zap,
    KeyRound,
    ArrowRight,
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
    { key: 'left', label: 'Look Left', instruction: 'Turn your head to the left.' },
    { key: 'right', label: 'Look Right', instruction: 'Turn your head to the right.' },
];

export default function StudentPublicRegistration({
    faceThreshold = 0.45,
}: {
    faceThreshold?: number;
}) {
    const [mode, setMode] = useState<ModeType>('register');
    const [isMounted, setIsMounted] = useState(false);

    // Pre-verified student passed from fresh registration
    const [preVerifiedStudent, setPreVerifiedStudent] = useState<StudentData | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="min-h-screen bg-slate-900 animate-pulse" />;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ffb300] selection:text-[#024495] text-slate-800 flex flex-col">
            <Head title="Public Student Registration - NAAP Library" />

            {/* Public Header (No Back Button, Large Logo, Responsive Tabs) */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-3 sm:py-4">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <img
                                src="https://naap.edu.ph/wp-content/uploads/2020/09/Logo-NAAP-600x165.png"
                                alt="NAAP Logo"
                                className="h-14 sm:h-16 md:h-20 object-contain"
                            />
                            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
                            <div className="hidden md:flex flex-col">
                                <span className="text-[#024495] font-black tracking-tight text-xl uppercase leading-tight">
                                    Student Registration
                                </span>
                                <span className="text-xs text-gray-500 font-semibold">
                                    Online Public Portal
                                </span>
                            </div>
                        </div>

                        {/* Responsive Mode Switcher Tabs */}
                        <div className="flex items-center w-full sm:w-auto justify-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                            <button
                                onClick={() => setMode('register')}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
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
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
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
            <div className="bg-gradient-to-r from-[#024495] via-[#013575] to-slate-900 text-white py-5 px-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-[#ffb300] font-extrabold text-xs tracking-widest uppercase mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Liveness-Verified Self-Registration</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            {mode === 'register'
                                ? 'Student Account Registration'
                                : 'Student Face Biometrics Enrollment'}
                        </h1>
                        <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl font-normal">
                            {mode === 'register'
                                ? 'Fill out your student details below. Once submitted, you will be redirected to complete face scan.'
                                : 'Verify your account using Student Number and Birthday to launch hands-free face registration.'}
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
                    <PublicRegisterView
                        onRegistrationSuccess={(student) => {
                            setPreVerifiedStudent(student);
                            setMode('link-existing');
                        }}
                    />
                ) : (
                    <PublicFaceLinkView
                        initialStudent={preVerifiedStudent}
                        onClearInitialStudent={() => setPreVerifiedStudent(null)}
                    />
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
   AUTOMATED LIVENESS FACE SCANNER COMPONENT (UNZOOMED & CYBER GEOMETRIC MESH)
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

    // Dynamic GREEN (Correct Pose + Aligned) / RED (Wrong Pose or Unaligned)
    const [isPoseMatched, setIsPoseMatched] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>(
        'ALIGN FACE INSIDE OVAL',
    );

    const [flashActive, setFlashActive] = useState<boolean>(false);
    const [flashColor, setFlashColor] = useState<string>('rgba(255, 255, 255, 0.9)');

    const videoRef = useRef<HTMLVideoElement>(null);
    const hudCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isProcessingRef = useRef<boolean>(false);

    // Blink & Hold-Steady Alignment Timers
    const eyeClosedRef = useRef<boolean>(false);
    const poseMatchedTimeRef = useRef<number | null>(null);

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

    // Initialize Unzoomed Camera Stream
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

    // Evaluate Facial Yaw & Pitch Head Pose Orientation
    const evaluateHeadPose = (
        points: { x: number; y: number }[],
        targetKey: string,
    ): { matched: boolean; hint: string } => {
        const noseTip = points[30];
        const leftEyeOuter = points[36];
        const rightEyeOuter = points[45];
        const chin = points[8];

        const eyeDistance = Math.hypot(
            rightEyeOuter.x - leftEyeOuter.x,
            rightEyeOuter.y - leftEyeOuter.y,
        );
        const eyesCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
        const eyesCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

        // Yaw Offset (-left, +right relative to video frame)
        const yawOffset = (noseTip.x - eyesCenterX) / (eyeDistance || 1);

        // Pitch Ratio (distance eyes->nose vs nose->chin)
        const eyeToNose = Math.abs(noseTip.y - eyesCenterY);
        const noseToChin = Math.abs(chin.y - noseTip.y);
        const pitchRatio = eyeToNose / (noseToChin || 1);

        switch (targetKey) {
            case 'center': {
                const okYaw = Math.abs(yawOffset) <= 0.16;
                const okPitch = pitchRatio >= 0.40 && pitchRatio <= 0.75;
                if (!okYaw || !okPitch) {
                    return { matched: false, hint: 'LOOK STRAIGHT AT THE CAMERA' };
                }
                return { matched: true, hint: 'CENTERED! HOLD STEADY OR BLINK' };
            }
            case 'up': {
                const okUp = pitchRatio < 0.42;
                if (!okUp) {
                    return { matched: false, hint: 'PLEASE TILT YOUR HEAD UP' };
                }
                return { matched: true, hint: 'LOOKING UP! HOLD STEADY OR BLINK' };
            }
            case 'down': {
                const okDown = pitchRatio > 0.72;
                if (!okDown) {
                    return { matched: false, hint: 'PLEASE TILT YOUR HEAD DOWN' };
                }
                return { matched: true, hint: 'LOOKING DOWN! HOLD STEADY OR BLINK' };
            }
            case 'left': {
                // Front camera (user view): turning head physical left moves nose to positive yawOffset
                const okLeft = cameraFacing === 'user' ? yawOffset > 0.14 : yawOffset < -0.14;
                if (!okLeft) {
                    return { matched: false, hint: 'PLEASE TURN HEAD TO THE LEFT' };
                }
                return { matched: true, hint: 'TURNING LEFT! HOLD STEADY OR BLINK' };
            }
            case 'right': {
                // Front camera (user view): turning head physical right moves nose to negative yawOffset
                const okRight = cameraFacing === 'user' ? yawOffset < -0.14 : yawOffset > 0.14;
                if (!okRight) {
                    return { matched: false, hint: 'PLEASE TURN HEAD TO THE RIGHT' };
                }
                return { matched: true, hint: 'TURNING RIGHT! HOLD STEADY OR BLINK' };
            }
            default:
                return { matched: true, hint: 'ALIGNED!' };
        }
    };

    // Draw Cyber Geometric Mesh & Triangulation Mask
    const drawCyberMesh = (
        ctx: CanvasRenderingContext2D,
        box: { x: number; y: number; width: number; height: number },
        points: { x: number; y: number }[],
        color: string,
    ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // 1. CORNER SIGHT BRACKETS
        ctx.lineWidth = 4;
        const bLen = Math.min(box.width, box.height) * 0.2;
        // TL
        ctx.beginPath(); ctx.moveTo(box.x, box.y + bLen); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + bLen, box.y); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + bLen); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - bLen); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + bLen, box.y + box.height); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - bLen); ctx.stroke();

        // 2. DENSE TRIANGULATED MESH MASK
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        const triLinks = [
            [17, 37], [18, 38], [19, 38], [20, 39], [21, 39], // Brows to Eye
            [22, 42], [23, 43], [24, 44], [25, 45], [26, 45],
            [36, 17], [45, 26],                               // Temples
            [21, 27], [22, 27], [27, 39], [27, 42],           // Nose Bridge
            [31, 39], [35, 42], [33, 51], [33, 48], [33, 54], // Nose to Mouth
            [48, 4], [54, 12], [57, 8], [51, 8],              // Mouth to Jaw
            [31, 2], [35, 14], [39, 31], [42, 35]             // Cheek Triangles
        ];
        triLinks.forEach(([p1, p2]) => {
            if (points[p1] && points[p2]) {
                ctx.moveTo(points[p1].x, points[p1].y);
                ctx.lineTo(points[p2].x, points[p2].y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. CORE FEATURE OUTLINES
        ctx.lineWidth = 2;
        const segments = [
            [0, 16, false],  // Jawline
            [17, 21, false], // L-Brow
            [22, 26, false], // R-Brow
            [27, 30, false], // Nose Bridge
            [31, 35, true],  // Nose Base
            [36, 41, true],  // L-Eye
            [42, 47, true],  // R-Eye
            [48, 59, true],  // Outer Lips
        ];
        segments.forEach(([start, end, close]) => {
            ctx.beginPath();
            ctx.moveTo(points[start as number].x, points[start as number].y);
            for (let i = (start as number) + 1; i <= (end as number); i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            if (close) ctx.lineTo(points[start as number].x, points[start as number].y);
            ctx.stroke();
        });

        // 4. POINT CLOUD NODES
        for (let i = 0; i < 68; i++) {
            if (points[i]) {
                ctx.beginPath();
                ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
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

            try {
                const faceapi = await import('@vladmandic/face-api');
                const dims = faceapi.matchDimensions(canvas, video, true);

                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, dims.width, dims.height);

                const detections = await faceapi
                    .detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions({
                            inputSize: 320,
                            scoreThreshold: 0.45,
                        }),
                    )
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length === 0) {
                    setIsPoseMatched(false);
                    setStatusMessage('ALIGN FACE INSIDE OVAL (NO FACE)');
                    poseMatchedTimeRef.current = null;
                } else {
                    const primary = detections.reduce((prev, current) =>
                        prev.detection.box.area > current.detection.box.area
                            ? prev
                            : current,
                    );

                    const resized = faceapi.resizeResults(primary, dims);
                    const box = resized.detection.box;
                    const points = resized.landmarks.positions;

                    // Check normalized face center against oval guide
                    const normCx = (box.x + box.width / 2) / dims.width;
                    const normCy = (box.y + box.height / 2) / dims.height;

                    const insideOval =
                        Math.pow((normCx - 0.5) / 0.36, 2) +
                            Math.pow((normCy - 0.48) / 0.40, 2) <=
                        1.0;

                    // Evaluate specific target pose (Center, Up, Down, Left, Right)
                    const poseEval = evaluateHeadPose(points, currentPose.key);
                    const isValidPose = insideOval && poseEval.matched;

                    // Draw Cyber Geometric Mesh in GREEN (if valid) or RED (if invalid)
                    const hudColor = isValidPose ? '#10b981' : '#ef4444';
                    if (ctx) {
                        drawCyberMesh(ctx, box, points, hudColor);
                    }

                    if (!isValidPose) {
                        setIsPoseMatched(false);
                        setStatusMessage(
                            insideOval
                                ? poseEval.hint
                                : 'MOVE FACE INSIDE OVAL (RED)',
                        );
                        poseMatchedTimeRef.current = null;
                    } else {
                        // Pose & Alignment OK!
                        setIsPoseMatched(true);

                        const now = Date.now();
                        if (poseMatchedTimeRef.current === null) {
                            poseMatchedTimeRef.current = now;
                        }

                        const durationMatched =
                            now - (poseMatchedTimeRef.current || now);

                        // EAR Blink Check
                        const leftEye = points.slice(36, 42);
                        const rightEye = points.slice(42, 48);

                        const leftEAR = calculateEAR(leftEye);
                        const rightEAR = calculateEAR(rightEye);
                        const avgEAR = (leftEAR + rightEAR) / 2;

                        if (avgEAR < 0.22) {
                            eyeClosedRef.current = true;
                            setStatusMessage('BLINK DETECTED! OPEN EYES...');
                        } else if (
                            eyeClosedRef.current &&
                            avgEAR > 0.25
                        ) {
                            eyeClosedRef.current = false;
                            setStatusMessage('LIVENESS VERIFIED! CAPTURING...');
                            triggerAutomatedCapture(Array.from(primary.descriptor));
                        } else if (durationMatched > 1200) {
                            // Hold steady auto-capture fallback
                            setStatusMessage('POSE VERIFIED! CAPTURING...');
                            triggerAutomatedCapture(Array.from(primary.descriptor));
                        } else {
                            setStatusMessage(
                                `${poseEval.hint} (HOLD STEADY / BLINK)`,
                            );
                        }
                    }
                }
            } catch (err) {
                // Ignore loop errors
            }

            animationFrameId = requestAnimationFrame(processFrame);
        };

        processFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isModelsLoaded, currentStep, isComplete, currentPose]);

    // Trigger Automated Capture with Flash Effect
    const triggerAutomatedCapture = (descriptor: number[]) => {
        if (isProcessingRef.current || !currentPose) return;
        isProcessingRef.current = true;

        setFlashActive(true);
        setFlashColor('rgba(255, 255, 255, 0.95)');

        setTimeout(() => {
            setFlashColor('rgba(16, 185, 129, 0.8)'); // Green
        }, 120);

        setTimeout(() => {
            setFlashColor('rgba(255, 179, 0, 0.8)'); // Gold
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
            poseMatchedTimeRef.current = null;

            if (nextStepIndex >= POSES.length) {
                onDescriptorsComplete(updated);
            }
        }, 360);
    };

    const toggleCamera = () => {
        setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div>
                    <h3 className="font-extrabold text-[#024495] text-base sm:text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#ffb300]" />
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Follow the pose instruction & blink or hold steady to capture
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

            {/* Pose Progress Bar */}
            <div className="w-full grid grid-cols-5 gap-1.5 mb-4">
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

            {/* Camera Viewport (Normal Aspect Ratio object-contain, No Crop Zooming) */}
            {!isComplete ? (
                <div className="relative w-full aspect-[3/4] max-w-[380px] bg-[#0a0f1d] rounded-3xl overflow-hidden shadow-lg border-2 border-gray-200 mx-auto">
                    {/* Screen Color Flash Overlay */}
                    {flashActive && (
                        <div
                            className="absolute inset-0 z-40 transition-colors duration-100 pointer-events-none"
                            style={{ backgroundColor: flashColor }}
                        />
                    )}

                    {/* Unzoomed Normal Camera Video Stream */}
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
                        className="absolute inset-0 w-full h-full object-contain bg-[#0a0f1d]"
                    />

                    {/* SVG Oval Guide Mask Overlay (GREEN = Pose Matched, RED = Pose Mismatched) */}
                    <svg
                        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <ellipse
                            cx="50%"
                            cy="48%"
                            rx="36%"
                            ry="40%"
                            fill="none"
                            stroke={isPoseMatched ? '#10b981' : '#ef4444'}
                            strokeWidth="3.5"
                            strokeDasharray={isPoseMatched ? 'none' : '4 3'}
                            className="transition-colors duration-200"
                        />
                    </svg>

                    {/* Real-Time Cyber Landmark Mesh & Sight Brackets Overlay */}
                    <canvas
                        ref={hudCanvasRef}
                        style={{
                            transform:
                                cameraFacing === 'user'
                                    ? 'scaleX(-1)'
                                    : 'none',
                        }}
                        className="absolute inset-0 z-20 w-full h-full pointer-events-none object-contain"
                    />

                    {/* Loading State Overlay */}
                    {!isModelsLoaded && (
                        <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#ffb300] mb-3" />
                            <p className="font-bold text-sm">
                                Loading Face API Engine...
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

                    {/* Top Pose Instruction Banner */}
                    {currentPose && isModelsLoaded && (
                        <div className="absolute top-3 inset-x-3 z-30 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white text-center">
                            <span className="text-[10px] font-black text-[#ffb300] uppercase tracking-widest block">
                                POSE {currentStep + 1} OF {POSES.length}: {currentPose.label}
                            </span>
                            <p className="text-xs font-extrabold mt-0.5">
                                {currentPose.instruction}
                            </p>
                        </div>
                    )}

                    {/* Bottom Live Feedback Bar (GREEN = Pose Correct, RED = Pose Wrong) */}
                    <div
                        className={`absolute bottom-3 inset-x-3 z-30 backdrop-blur-md px-4 py-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                            isPoseMatched
                                ? 'bg-green-950/85 border-green-500 text-green-300'
                                : 'bg-red-950/85 border-red-500 text-red-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            {isPoseMatched ? (
                                <Eye className="w-4 h-4 text-green-400 animate-bounce flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <p className="text-xs font-black tracking-tight truncate">
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
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900">
                        Face Scanning Complete!
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        All 5 facial poses have been verified and captured successfully.
                    </p>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   TAB 1: NEW STUDENT REGISTRATION VIEW
   ========================================================================= */
function PublicRegisterView({
    onRegistrationSuccess,
}: {
    onRegistrationSuccess: (student: StudentData) => void;
}) {
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
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-200/80">
            <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-black text-[#024495] flex items-center gap-2">
                    <UserPen className="w-6 h-6 text-[#ffb300]" />
                    New Student Information
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Complete your registration details. After submitting, you will proceed directly to face scan.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Student Number & Library ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Library ID <span className="text-gray-400 font-normal">(Auto-generated)</span>
                        </label>
                        <input
                            type="text"
                            value={previewLibraryId}
                            readOnly
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 font-mono text-sm text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Sex & Birthday */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Sex
                        </label>
                        <select
                            name="SEX"
                            value={form.SEX}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Birthday <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="BIRTHDAY"
                            value={form.BIRTHDAY}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Contact & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
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
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Course */}
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
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                    />
                </div>

                {/* Profile Photo */}
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
                            className="text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#024495]/10 file:text-[#024495] hover:file:bg-[#024495]/20 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#024495] hover:bg-[#013575] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#024495]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Registering Student Account...</span>
                            </>
                        ) : (
                            <>
                                <UserPen className="w-5 h-5" />
                                <span>Register & Proceed to Face Scan</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Registration Credentials & Redirect Modal */}
            {result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
                        {result.success && result.student ? (
                            <>
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                                    Account Registered!
                                </h3>
                                <p className="text-sm font-semibold text-[#024495] mb-4">
                                    {result.student.FN} {result.student.LN}
                                </p>

                                <div className="w-full rounded-2xl border-2 border-dashed border-[#024495]/30 bg-[#024495]/5 p-4 mb-5 flex flex-col items-center gap-3">
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-[#024495]/70 uppercase">
                                            Assigned Library ID
                                        </p>
                                        <p className="font-mono text-2xl font-black tracking-widest text-[#024495]">
                                            {result.student.LIBRARY_ID}
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
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        const st = result.student!;
                                        setResult(null);
                                        onRegistrationSuccess(st);
                                    }}
                                    className="w-full py-4 bg-[#024495] hover:bg-[#013575] text-white font-extrabold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <span>Proceed to Face Scan</span>
                                    <ArrowRight className="w-5 h-5 text-[#ffb300]" />
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
                                    {result?.message}
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
   TAB 2: LINK FACE VIEW (CLEAN SINGLE-CONTAINER LAYOUT)
   ========================================================================= */
function PublicFaceLinkView({
    initialStudent,
    onClearInitialStudent,
}: {
    initialStudent: StudentData | null;
    onClearInitialStudent: () => void;
}) {
    const [studentNumber, setStudentNumber] = useState('');
    const [birthday, setBirthday] = useState('');

    const [verifiedStudent, setVerifiedStudent] = useState<StudentData | null>(
        initialStudent,
    );

    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const [descriptors, setDescriptors] = useState<Record<string, number[]> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [linkResult, setLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        if (initialStudent) {
            setVerifiedStudent(initialStudent);
        }
    }, [initialStudent]);

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setVerifyError(null);

        try {
            const res = await fetch('/api/public-student-registration/verify-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    student_number: studentNumber,
                    birthday: birthday,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setVerifiedStudent(data.student);
            } else {
                setVerifyError(data.message || 'Verification failed. Please check inputs.');
            }
        } catch {
            setVerifyError('A network error occurred while verifying student details.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLinkFaceSubmit = async () => {
        if (!verifiedStudent || !descriptors) return;
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
                    library_id: verifiedStudent.LIBRARY_ID,
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
        <div className="w-full max-w-xl mx-auto space-y-4">
            {verifiedStudent ? (
                <>
                    {/* Verified Student Banner (Single Clean Container) */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#024495] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                {verifiedStudent.FN?.charAt(0)}
                                {verifiedStudent.LN?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-sm sm:text-base text-[#024495] truncate">
                                    {verifiedStudent.FN} {verifiedStudent.LN}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium truncate">
                                    Student No: {verifiedStudent.STUDENT_NUMBER} · Library ID: {verifiedStudent.LIBRARY_ID}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setVerifiedStudent(null);
                                onClearInitialStudent();
                                setDescriptors(null);
                            }}
                            className="text-xs font-bold text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                            Change
                        </button>
                    </div>

                    {/* Automated Multi-Pose Scanner Component Directly */}
                    <AutomatedFaceScanner
                        title="Enroll Face Biometrics"
                        onDescriptorsComplete={(data) => setDescriptors(data)}
                    />

                    {descriptors && (
                        <div className="mt-4">
                            <button
                                onClick={handleLinkFaceSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-95"
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
                </>
            ) : (
                /* Verification Form (Student Number + Birthday) */
                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-200/80">
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-black text-[#024495] flex items-center gap-2">
                            <KeyRound className="w-6 h-6 text-[#ffb300]" />
                            Verify Student Account
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Enter your Student Number and Birthday to verify ownership before face enrollment.
                        </p>
                    </div>

                    <form onSubmit={handleVerifySubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Student Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={studentNumber}
                                onChange={(e) => setStudentNumber(e.target.value)}
                                required
                                placeholder="e.g. 12324MN-000141"
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Birthday <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                required
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>

                        {verifyError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                                <span>{verifyError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full py-4 bg-[#024495] hover:bg-[#013575] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#024495]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying Student Account...</span>
                                </>
                            ) : (
                                <>
                                    <KeyRound className="w-5 h-5" />
                                    <span>Verify & Proceed to Face Scan</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Link Result Modal */}
            {linkResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center border border-gray-100">
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
                                        setVerifiedStudent(null);
                                        onClearInitialStudent();
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

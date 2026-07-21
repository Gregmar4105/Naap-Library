import { Head } from '@inertiajs/react';
import { User, Camera, ShieldCheck, Lock, QrCode, CreditCard, ScanLine, Send, CircleUserRound, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { resolveImageUrl } from '@/lib/media';
import jsQR from 'jsqr';

interface StudentData {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    PIC: string | null;
    COURSE: string;
    ID_STATUS: string;
    time_out?: string;
    tap_status?: 'success' | 'already_in' | 'already_out' | 'has_locker';
    message?: string;
}

export default function TapToLogout() {
    const [scannedStudent, setScannedStudent] = useState<StudentData | null>(null);
    const [inactiveStudent, setInactiveStudent] = useState<StudentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [authMethod, setAuthMethod] = useState<'face' | 'qr' | 'rfid' | null>(null);
    
    const [selectedMethod, setSelectedMethod] = useState<'face' | 'qr' | 'barcode' | 'rfid'>('face');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hudCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const scannerBuffer = useRef<string>('');
    const scannerTimeout = useRef<NodeJS.Timeout | null>(null);

    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isProcessingRef = useRef(isProcessing);
    const scannedStudentRef = useRef(scannedStudent);
    const selectedMethodRef = useRef(selectedMethod);

    useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
    useEffect(() => { scannedStudentRef.current = scannedStudent; }, [scannedStudent]);
    useEffect(() => { selectedMethodRef.current = selectedMethod; }, [selectedMethod]);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            setErrorMessage(null);
        }, 4000);
    };

    // Global listener for Barcode/RFID scanners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing || scannedStudent) return;
            
            // Ignore if modifier keys are pressed
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            
            if (e.key === 'Enter') {
                if (scannerBuffer.current.trim().length > 2) {
                    const id = scannerBuffer.current.trim();
                    scannerBuffer.current = '';
                    processLogout({ rfid_number: id, method: 'rfid' });
                }
            } else if (e.key.length === 1) {
                scannerBuffer.current += e.key;
                
                if (scannerTimeout.current) clearTimeout(scannerTimeout.current);
                scannerTimeout.current = setTimeout(() => {
                    scannerBuffer.current = '';
                }, 200); // 200ms window for scanner burst
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isProcessing, scannedStudent]);

    // Play danger sound when locker key unreturned
    useEffect(() => {
        if (scannedStudent?.tap_status === 'has_locker') {
            const playDangerSound = () => {
                try {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioContext) return;
                    const ctx = new AudioContext();
                    
                    const playBuzzer = (time: number) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(400, time);
                        osc.frequency.exponentialRampToValueAtTime(100, time + 0.3);
                        
                        gain.gain.setValueAtTime(0, time);
                        gain.gain.linearRampToValueAtTime(1, time + 0.05);
                        gain.gain.linearRampToValueAtTime(0, time + 0.35);
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(time);
                        osc.stop(time + 0.4);
                    };

                    playBuzzer(ctx.currentTime);
                    playBuzzer(ctx.currentTime + 0.5);
                    playBuzzer(ctx.currentTime + 1.0);

                } catch(e) {
                    console.error('Audio synthesis failed:', e);
                }
            };
            playDangerSound();
        }
    }, [scannedStudent]);


    // Load models and start video
    useEffect(() => {
        setIsMounted(true);
        startVideo();

        const loadModels = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load face-api models", err);
                showError("Failed to load facial recognition models.");
            }
        };
        loadModels();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, []);

    // REAL-TIME HUD TRACKING LOOP
    useEffect(() => {
        let animationId: number;
        
        const trackHUD = async () => {
            if (selectedMethodRef.current === 'qr') {
                const canvas = hudCanvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (ctx && canvas) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    const boxSize = Math.min(canvas.width, canvas.height) * 0.65;
                    const x = (canvas.width - boxSize) / 2;
                    const y = (canvas.height - boxSize) / 2;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(0, 0, canvas.width, y);
                    ctx.fillRect(0, y + boxSize, canvas.width, canvas.height - (y + boxSize));
                    ctx.fillRect(0, y, x, boxSize);
                    ctx.fillRect(x + boxSize, y, canvas.width - (x + boxSize), boxSize);

                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 4;
                    const cLen = 20;
                    
                    ctx.beginPath(); ctx.moveTo(x, y + cLen); ctx.lineTo(x, y); ctx.lineTo(x + cLen, y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x + boxSize - cLen, y); ctx.lineTo(x + boxSize, y); ctx.lineTo(x + boxSize, y + cLen); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x, y + boxSize - cLen); ctx.lineTo(x, y + boxSize); ctx.lineTo(x + cLen, y + boxSize); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x + boxSize - cLen, y + boxSize); ctx.lineTo(x + boxSize, y + boxSize); ctx.lineTo(x + boxSize, y + boxSize - cLen); ctx.stroke();

                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#10b981';
                    
                    const time = Date.now() * 0.003;
                    const laserY = y + (Math.sin(time) * 0.5 + 0.5) * boxSize;
                    
                    ctx.beginPath();
                    ctx.moveTo(x + 5, laserY);
                    ctx.lineTo(x + boxSize - 5, laserY);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
                animationId = requestAnimationFrame(trackHUD);
                return;
            }

            if (selectedMethodRef.current !== 'face' || !isModelsLoaded || !videoRef.current || !hudCanvasRef.current || (scannedStudent && scannedStudent.tap_status !== 'has_locker')) {
                if (hudCanvasRef.current) {
                    const ctx = hudCanvasRef.current.getContext('2d');
                    ctx?.clearRect(0, 0, hudCanvasRef.current.width, hudCanvasRef.current.height);
                }
                animationId = requestAnimationFrame(trackHUD);
                return;
            }

            const video = videoRef.current;
            const canvas = hudCanvasRef.current;
            if (video.paused || video.ended || video.readyState !== 4) {
                animationId = requestAnimationFrame(trackHUD);
                return;
            }

            try {
                const faceapi = await import('@vladmandic/face-api');
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                    .withFaceLandmarks();

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    if (detections.length > 0) {
                        const primaryDetection = detections.reduce((prev, current) => 
                            (prev.detection.box.area > current.detection.box.area) ? prev : current
                        );

                        const dims = faceapi.matchDimensions(canvas, video, true);
                        const resizedResult = faceapi.resizeResults(primaryDetection, dims);
                        const points = resizedResult.landmarks.positions;
                        const box = resizedResult.detection.box;

                        // 1. CORNER BRACKETS
                        ctx.strokeStyle = '#ccff00';
                        ctx.lineWidth = 4;
                        const bLen = Math.min(box.width, box.height) * 0.2;
                        ctx.beginPath(); ctx.moveTo(box.x, box.y + bLen); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + bLen, box.y); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + bLen); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - bLen); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + bLen, box.y + box.height); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - bLen); ctx.stroke();
                        
                        // 2. MESH
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.setLineDash([1, 1]);
                        const triLinks = [[17, 37], [18, 38], [19, 38], [20, 39], [21, 39], [22, 42], [23, 43], [24, 44], [25, 45], [26, 45], [36, 17], [45, 26], [21, 27], [22, 27], [27, 39], [27, 42], [31, 39], [35, 42], [33, 51], [33, 48], [33, 54], [48, 4], [54, 12], [57, 8], [51, 8], [31, 2], [35, 14], [39, 31], [42, 35]];
                        triLinks.forEach(([p1, p2]) => { ctx.moveTo(points[p1].x, points[p1].y); ctx.lineTo(points[p2].x, points[p2].y); });
                        ctx.stroke(); ctx.setLineDash([]);

                        // 3. OUTLINES
                        ctx.lineWidth = 3.5;
                        [[0, 16, false], [17, 21, false], [22, 26, false], [27, 30, false], [31, 35, true], [36, 41, true], [42, 47, true], [48, 59, true]].forEach(([start, end, close]) => {
                            ctx.beginPath(); ctx.moveTo(points[start].x, points[start].y);
                            for(let i = start + 1; i <= end; i++) ctx.lineTo(points[i].x, points[i].y);
                            if(close) ctx.lineTo(points[start].x, points[start].y); ctx.stroke();
                        });

                        // 4. NODES
                        ctx.fillStyle = '#ffff00';
                        for(let i=0; i<68; i++) {
                            ctx.beginPath(); ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2); ctx.fill();
                            if([0, 8, 16, 27, 33, 36, 45, 48, 54].includes(i)) { ctx.shadowBlur = 12; ctx.shadowColor = '#ffff00'; ctx.stroke(); ctx.shadowBlur = 0; }
                        }
                    }
                }
            } catch (err) {}
            animationId = requestAnimationFrame(trackHUD);
        };
        trackHUD();
        return () => cancelAnimationFrame(animationId);
    }, [isModelsLoaded, isProcessing, scannedStudent, selectedMethod]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Webcam error:", err);
            showError("Cannot access webcam. Please allow permissions.");
        }
    };

    const handleVideoPlay = () => {
        let lastFaceScan = 0;
        const intervalId = setInterval(async () => {
            if (isProcessingRef.current || (scannedStudentRef.current && scannedStudentRef.current.tap_status !== 'has_locker') || !videoRef.current) return;

            const video = videoRef.current;
            if (video.paused || video.ended) return;

            // 1. QUICK SCAN FOR QR (Every ~500ms)
            if (selectedMethodRef.current === 'qr') {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                        if (code) {
                            processLogout({ library_id: code.data, method: 'qr' });
                            return;
                        }
                    }
                } catch (err) {}
            }

            // 2. FACE SCAN (Throttled every ~3.5s)
            if (selectedMethodRef.current === 'face') {
                const now = Date.now();
                if (now - lastFaceScan > 3500 && isModelsLoaded) {
                    lastFaceScan = now;
                    try {
                        const faceapi = await import('@vladmandic/face-api');
                        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.75 }))
                            .withFaceLandmarks()
                            .withFaceDescriptors();

                        if (detections.length > 0) {
                            const primaryFace = detections.reduce((prev, current) => 
                                (prev.detection.box.area > current.detection.box.area) ? prev : current
                            );

                            const captureCanvas = document.createElement('canvas');
                            captureCanvas.width = video.videoWidth;
                            captureCanvas.height = video.videoHeight;
                            const ctx = captureCanvas.getContext('2d');
                            if (ctx) { ctx.translate(captureCanvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0); }
                            const capturedImage = captureCanvas.toDataURL('image/jpeg', 0.8);

                            processLogout({ descriptor: Array.from(primaryFace.descriptor), captured_image: capturedImage, method: 'face' });
                        }
                    } catch (err) {}
                }
            }
        }, 500); 

        return () => clearInterval(intervalId);
    };

    const processLogout = async ({ descriptor, library_id, rfid_number, captured_image, method }: { descriptor?: number[], library_id?: string, rfid_number?: string, captured_image?: string, method: 'face' | 'qr' | 'rfid' }) => {
        setIsProcessing(true);
        setAuthMethod(method);
        
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/api/face-logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ 
                    descriptor,
                    library_id,
                    rfid_number,
                    captured_image
                 })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.success || data.status === 'already_out' || data.status === 'has_locker') {
                    setScannedStudent({
                        ...data.student,
                        time_out: data.time_out,
                        tap_status: data.status || 'success',
                        message: data.message
                    });

                    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                    resetTimeoutRef.current = setTimeout(() => {
                        setScannedStudent(null);
                        setAuthMethod(null);
                        setTimeout(() => setIsProcessing(false), 2000);
                    }, 4000);
                } else if (data.status === 'inactive') {
                    setInactiveStudent(data.student);
                    showError(data.message || 'Account is currently Inactive.');
                    
                    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                    resetTimeoutRef.current = setTimeout(() => {
                        setInactiveStudent(null);
                        setAuthMethod(null);
                        setTimeout(() => setIsProcessing(false), 2000);
                    }, 5000);
                } else {
                    showError(data.message || 'Unknown error');
                    setTimeout(() => {
                        setIsProcessing(false);
                        setAuthMethod(null);
                    }, 3000);
                }
            } else {
                showError(data.message || 'Error communicating with server.');
                setTimeout(() => {
                    setIsProcessing(false);
                    setAuthMethod(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Network Error:', error);
            showError('Network error. Check connection.');
            setTimeout(() => {
                setIsProcessing(false);
                setAuthMethod(null);
            }, 3000);
        }
    };

    const getProgramAndYear = (course: string = '') => {
        const yearMatch = course.match(/(\d+(?:st|nd|rd|th)?\s+Year)$/i);
        if (yearMatch) {
            const yearLevel = yearMatch[0];
            const program = course.replace(yearLevel, '').trim();
            return { program, yearLevel };
        }
        return { program: course, yearLevel: 'N/A' };
    };

    const StudentCard = () => {
        if (!scannedStudent) return null;
        const { program, yearLevel } = getProgramAndYear(scannedStudent.COURSE);

        return (
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 border border-gray-100 flex flex-col p-10 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-full border-[3px] border-[#024495] flex items-center justify-center p-1 mb-4 overflow-hidden">
                        {scannedStudent.PIC ? (
                            <img src={resolveImageUrl(scannedStudent.PIC)} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <User className="text-[#024495] w-12 h-12" />
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-[#024495] text-center leading-tight">
                        {scannedStudent.FN} {scannedStudent.MN ? `${scannedStudent.MN.charAt(0)}.` : ''} {scannedStudent.LN}
                    </h2>
                    <p className="text-[#ffb300] font-bold text-sm mt-1">
                        ID: {scannedStudent.STUDENT_NUMBER}
                    </p>
                </div>

                <div className="flex flex-col gap-4 text-sm w-full divide-y divide-gray-100 border-t border-b border-gray-100 py-6 mb-6">
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-[#024495]">Program:</span>
                        <span className="text-gray-600 text-right">{program}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <span className="font-bold text-[#024495]">Year Level:</span>
                        <span className="text-gray-600">{yearLevel}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <span className="font-bold text-[#024495]">Status:</span>
                        <span className="text-green-600 font-semibold">{scannedStudent.ID_STATUS}</span>
                    </div>
                    {scannedStudent.time_out && (
                        <div className="flex justify-between items-center pt-4">
                            <span className="font-bold text-[#024495]">Time Out:</span>
                            <span className="text-gray-600">{scannedStudent.time_out}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-2">
                    {scannedStudent.tap_status === 'already_out' ? (
                        <div className="bg-red-100/80 text-red-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border border-red-200 text-center">
                            ALREADY LOGGED OUT
                        </div>
                    ) : scannedStudent.tap_status === 'has_locker' ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-[#ffb300]/20 text-[#b37a00] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border border-[#ffb300]/30 text-center">
                                KEY RETURN REQUIRED
                            </div>
                            {scannedStudent.message && (
                                <p className="text-[10px] text-[#b37a00] font-bold mt-2 text-center px-4 leading-tight">{scannedStudent.message}</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-green-100/80 text-green-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border border-green-200 text-center">
                            EXIT AUTHORIZED
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!isMounted) return <div className="min-h-screen bg-[#f4f6f9]" />;

    return (
        <div className="flex min-h-screen w-full bg-[#f4f6f9] font-sans relative">
            <Head title="Face Logout - NAAP Library System" />

            <style>{`
                @keyframes shineSweep {
                    0% { transform: translateX(-100%) skewX(35deg) scale(0.8); opacity: 0; }
                    5% { opacity: 1; }
                    15% { transform: translateX(50%) skewX(35deg) scale(1.5); opacity: 1; }
                    25% { transform: translateX(250%) skewX(35deg) scale(0.8); opacity: 1; }
                    30% { transform: translateX(250%) skewX(35deg) scale(0.8); opacity: 0; }
                    100% { transform: translateX(250%) skewX(35deg); opacity: 0; }
                }
                @keyframes shakeWarning {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-15px); }
                    20%, 40%, 60%, 80% { transform: translateX(15px); }
                }
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                .animate-ping-slow {
                    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>

            {/* Danger Modal */}
            {scannedStudent?.tap_status === 'has_locker' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#ffb300] rounded-[3rem] p-12 md:p-20 flex flex-col items-center justify-center text-center shadow-2xl max-w-5xl w-[90%] border-8 border-white/30 animate-[shakeWarning_0.5s_ease-in-out]">
                        <div className="bg-white text-[#ffb300] rounded-full p-8 mb-8 animate-pulse shadow-[0_0_50px_rgba(255,255,255,0.4)]">
                            <Lock className="w-24 h-24" strokeWidth={3} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#024495] uppercase tracking-tight leading-tight mb-8 drop-shadow-sm">
                            Return Locker Key!
                        </h1>
                        <p className="text-2xl md:text-4xl font-bold text-[#013575] mb-10 max-w-4xl px-4 leading-relaxed tracking-tight">
                            You cannot leave the library. Please return <span className="text-[#ffb300] bg-[#024495] px-6 py-2 rounded-2xl mx-2 font-black shadow-inner whitespace-nowrap">{scannedStudent.message?.match(/Locker #\d+/)?.[0] || 'your key'}</span> to the depository first.
                        </p>
                    </div>
                </div>
            )}

            <div className="hidden lg:flex flex-col justify-center items-center w-[55%] bg-[#024495] text-white p-14 lg:p-20 relative overflow-hidden transition-all duration-500">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div 
                        className="absolute -top-[20%] -bottom-[20%] w-[60%] bg-gradient-to-r from-transparent via-white/30 to-transparent mix-blend-overlay blur-[2px]"
                        style={{ animation: 'shineSweep 6s ease-in-out infinite' }}
                    />
                </div>

                {scannedStudent && scannedStudent.tap_status !== 'has_locker' ? (
                    <div className="relative z-10 w-full flex justify-center items-center h-full">
                        <StudentCard />
                    </div>
                ) : inactiveStudent ? (
                    <div className="relative z-10 w-full flex justify-center items-center h-full animate-in fade-in zoom-in duration-500">
                        <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(239,68,68,0.2)] overflow-hidden relative z-10 border border-red-100 flex flex-col p-10">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-red-600 text-center leading-tight">
                                    Account Inactive
                                </h2>
                                <p className="text-slate-500 text-sm text-center mt-2 leading-relaxed">
                                    Dear <strong>{inactiveStudent.FN} {inactiveStudent.LN}</strong>, your library account status is currently set to <span className="text-red-600 font-bold uppercase">{inactiveStudent.ID_STATUS || 'Inactive'}</span>.
                                </p>
                            </div>
                            
                            <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/80 text-xs text-red-700 leading-relaxed text-center font-medium">
                                Please visit the library desk or contact the administrator to reactivate your credentials.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 w-full flex flex-col justify-between h-full py-8">
                        <div className="pt-4 animate-in fade-in duration-500">
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95]">
                                NAAP<br />
                                <span className="text-[#ffb300]">LIBRARY</span><br />
                                SYSTEM
                            </h1>
                            <p className="mt-8 text-base lg:text-lg font-light text-blue-50 max-w-md leading-relaxed opacity-90">
                                Powered by NAAP Intelligence. Our multi-input system supports Biometrics, QR, Barcode, and RFID for a frictionless experience.
                            </p>
                        </div>
                        <div className="flex flex-col mt-20">
                            <div className="relative mb-24 w-max">
                                <span className="text-2xl font-bold italic opacity-80 tracking-widest">#NAAPviator</span>
                                <Send
                                    className="absolute w-44 h-44 -left-8 -top-8 text-white opacity-[0.04] -rotate-[15deg] pointer-events-none"
                                    strokeWidth={1}
                                />
                            </div>
                            <div className="text-xs text-blue-200/80 space-y-1.5 font-light">
                                <p>Support: support@naap.edu.ph</p>
                                <p>Facebook Page: https://www.facebook.com/VillamorCampus</p>
                                <p>Official Portal: https://www.naap.edu.ph</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center w-full lg:w-[45%] p-6 sm:p-12 relative">
                <div className={`w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden relative z-10 border border-gray-100/50 transition-all duration-500 ${
                    selectedMethod === 'qr' ? 'max-w-[650px]' : 'max-w-[440px]'
                }`}>
                    <div className={`h-1.5 w-full transition-all duration-500 ${
                        selectedMethod === 'qr' ? 'opacity-0 h-0' : 'opacity-100'
                    } ${
                        inactiveStudent ? 'bg-red-500' : 
                        scannedStudent?.tap_status === 'already_out' ? 'bg-red-500' : 
                        scannedStudent?.tap_status === 'has_locker' ? 'bg-[#ffb300]' : 
                        scannedStudent ? 'bg-green-500' : 
                        'bg-[#024495]'
                    }`}></div>

                    <div className="p-10 flex flex-col items-center text-center w-full">
                        <div className={`w-full overflow-hidden transition-all duration-500 flex flex-col items-center ${
                            selectedMethod === 'qr' ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-[100px] opacity-100 mb-8'
                        }`}>
                            <h2 className={`text-[28px] font-black tracking-tight mb-2 transition-colors duration-500 ${inactiveStudent ? 'text-red-600' : scannedStudent?.tap_status === 'already_out' ? 'text-red-600' : scannedStudent?.tap_status === 'has_locker' ? 'text-[#ffb300]' : scannedStudent ? 'text-green-600' : 'text-[#024495]'}`}>
                                Intelligent Exit
                            </h2>
                            <p className="text-slate-500 text-sm">Waiting for identification...</p>
                        </div>

                        <div 
                            onClick={() => {
                                if (selectedMethod === 'qr' && (!scannedStudent || scannedStudent.tap_status === 'has_locker') && !isProcessing) {
                                    setSelectedMethod('face');
                                }
                            }}
                            className={`relative flex items-center justify-center overflow-hidden bg-slate-100 mb-8 transition-all duration-500 ease-in-out ${
                                selectedMethod === 'qr' 
                                    ? 'w-full max-w-[480px] h-[270px] border-[12px] rounded-[3rem] cursor-pointer hover:scale-[1.01] shadow-[0_15px_35px_-8px_rgba(2,68,149,0.2)]' 
                                    : 'w-[220px] h-[220px] border-4 rounded-[2rem]'
                            } ${
                                inactiveStudent ? 'border-red-500' : 
                                scannedStudent?.tap_status === 'already_out' ? 'border-red-500' : 
                                scannedStudent?.tap_status === 'has_locker' ? 'border-[#ffb300]' : 
                                scannedStudent ? 'border-green-500' : 
                                'border-[#024495]'
                            }`}
                        >
                            {!isMounted ? (
                                <div className="text-slate-400 text-sm flex flex-col items-center loading-pulse">
                                    <Camera className="mb-2 opacity-50" size={32}/>
                                    Initializing...
                                </div>
                            ) : (
                                <>
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        muted 
                                        playsInline
                                        onPlay={handleVideoPlay}
                                        style={{ transform: 'scaleX(-1)' }}
                                        className={`absolute inset-0 w-full h-full object-cover ${(isProcessing || (scannedStudent && scannedStudent.tap_status !== 'has_locker')) ? 'opacity-50 blur-sm' : ''} transition-all duration-300`}
                                    />
                                    <canvas 
                                        ref={canvasRef} 
                                        style={{ transform: 'scaleX(-1)' }}
                                        className="absolute inset-0 w-full h-full pointer-events-none" 
                                    />
                                    <canvas 
                                        ref={hudCanvasRef} 
                                        style={{ transform: 'scaleX(-1)' }}
                                        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                                    />
                                    
                                    {selectedMethod === 'face' && !isModelsLoaded && (
                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
                                            <Loader2 className="w-10 h-10 text-[#ffb300] mb-3 animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-wider text-[#ffb300] mb-1">Loading Face Models</p>
                                            <p className="text-[10px] text-slate-300 text-center leading-relaxed">Initializing facial recognition components...</p>
                                        </div>
                                    )}

                                    {selectedMethod === 'rfid' && (
                                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
                                            <CreditCard className="w-12 h-12 text-[#ffb300] mb-3 animate-bounce" />
                                            <p className="text-xs font-black uppercase tracking-wider text-[#ffb300] mb-1">RFID Mode Active</p>
                                            <p className="text-[10px] text-slate-300 text-center leading-relaxed">Please tap your RFID card on the scanner device.</p>
                                        </div>
                                    )}

                                    {selectedMethod === 'barcode' && (
                                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
                                            <ScanLine className="w-12 h-12 text-[#ffb300] mb-3 animate-bounce" />
                                            <p className="text-xs font-black uppercase tracking-wider text-[#ffb300] mb-1">Barcode Mode Active</p>
                                            <p className="text-[10px] text-slate-300 text-center leading-relaxed">Please scan your Library card barcode on the reader.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* INPUT METHODS HUB */}
                        <div className={`grid grid-cols-4 gap-4 w-full px-2 transition-all duration-500 ${
                            selectedMethod === 'qr' ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-20 opacity-100 mb-8'
                        }`}>
                            {[
                                { id: 'face', icon: CircleUserRound, label: 'Face' },
                                { id: 'qr', icon: QrCode, label: 'QR' },
                                { id: 'barcode', icon: ScanLine, label: 'Barcode' },
                                { id: 'rfid', icon: CreditCard, label: 'RFID' }
                            ].map((m) => {
                                const isSelected = selectedMethod === m.id;
                                const isListening = (!scannedStudent || scannedStudent.tap_status === 'has_locker') && !isProcessing && (m.id === 'face' ? isModelsLoaded : true);
                                const isUsed = authMethod === m.id && (isProcessing || (scannedStudent && scannedStudent.tap_status !== 'has_locker'));

                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            if ((!scannedStudent || scannedStudent.tap_status === 'has_locker') && !isProcessing) {
                                                setSelectedMethod(m.id as any);
                                            }
                                        }}
                                        className="flex flex-col items-center cursor-pointer focus:outline-none"
                                    >
                                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                            isUsed ? 'bg-[#024495] text-[#ffb300] shadow-[0_8px_20px_-4px_rgba(2,68,149,0.3)] scale-110 z-10' : 
                                            'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200'
                                        }`}>
                                            {isListening && isSelected && (
                                                <div className="absolute inset-0 rounded-2xl border-2 border-[#ffb300] animate-ping-slow" />
                                            )}
                                            <m.icon size={22} strokeWidth={isUsed ? 2.5 : 1.5} className={(isUsed || (isSelected && isListening)) ? 'animate-pulse' : ''} />
                                            
                                            {isListening && (
                                                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isSelected ? 'bg-[#ffb300]' : 'bg-green-400'} shadow-sm`} />
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isUsed ? 'text-[#024495]' : 'text-slate-400'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedMethod === 'qr' && (!scannedStudent || scannedStudent.tap_status === 'has_locker') && !inactiveStudent && !isProcessing && (
                            <button
                                type="button"
                                onClick={() => setSelectedMethod('face')}
                                className="px-10 py-3 bg-[#024495] text-white hover:bg-[#023373] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all duration-300 transform hover:scale-105 mb-4 mt-2"
                            >
                                Switch to Facial Scan
                            </button>
                        )}

                        {errorMessage && (
                            <div className="mb-6 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-sm w-full animate-in fade-in zoom-in duration-300">
                                {errorMessage}
                            </div>
                        )}

                        {selectedMethod === 'qr' && (!scannedStudent || scannedStudent.tap_status === 'has_locker') && !inactiveStudent && !isProcessing && (
                            <div className="px-6 py-2.5 rounded-full text-xs font-bold border border-slate-200/80 bg-white text-slate-500 shadow-sm flex items-center gap-2 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                Scanning Systems Active
                            </div>
                        )}

                        {!(selectedMethod === 'qr' && (!scannedStudent || scannedStudent.tap_status === 'has_locker') && !inactiveStudent && !isProcessing) && (
                            <div className={`px-6 py-3 rounded-full text-sm font-bold border shadow-sm transition-all duration-500 flex items-center gap-2 ${
                                inactiveStudent
                                    ? 'bg-red-100/80 text-red-700 border-red-200'
                                    : scannedStudent?.tap_status === 'already_out'
                                    ? 'bg-red-100/80 text-red-700 border-red-200'
                                    : scannedStudent?.tap_status === 'has_locker'
                                    ? 'bg-[#ffb300]/20 text-[#b37a00] border-[#ffb300]/30'
                                    : scannedStudent
                                    ? 'bg-green-100/80 text-green-700 border-green-200'
                                    : isProcessing ? 'bg-blue-100/80 text-[#024495] border-blue-200' : 'bg-slate-100/80 text-slate-600 border-slate-200'
                            }`}>
                            {inactiveStudent ? (
                                <>Access Denied</>
                            ) : scannedStudent?.tap_status === 'already_out' ? (
                                <>Invalid Tap</>
                            ) : scannedStudent?.tap_status === 'has_locker' ? (
                                <>Locker Key Unreturned</>
                            ) : scannedStudent ? (
                                <>Validation Complete</>
                            ) : isProcessing ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                                    Identifying...
                                </>
                            ) : (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffb300] animate-pulse" />
                                    Scanning Systems Active
                                </>
                            )}
                        </div>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

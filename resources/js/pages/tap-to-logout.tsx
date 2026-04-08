import { Head } from '@inertiajs/react';
import { User, Camera, ShieldCheck, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hudCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            setErrorMessage(null);
        }, 4000);
    };

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
        const loadModels = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelsLoaded(true);
                startVideo();
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
            if (!isModelsLoaded || !videoRef.current || !hudCanvasRef.current || isProcessing || (scannedStudent && scannedStudent.tap_status !== 'has_locker')) {
                // Clear HUD if not tracking
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
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
                    .withFaceLandmarks();

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    if (detection) {
                        const dims = faceapi.matchDimensions(canvas, video, true);
                        const resizedResult = faceapi.resizeResults(detection, dims);
                        const points = resizedResult.landmarks.positions;
                        
                        // Draw stylized geometric mesh
                        ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)'; // Magenta
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        
                        // Jawline (0-16)
                        for(let i=0; i<16; i++) {
                            ctx.moveTo(points[i].x, points[i].y);
                            ctx.lineTo(points[i+1].x, points[i+1].y);
                        }
                        // Eyebrows
                        for(let i=17; i<21; i++) { ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i+1].x, points[i+1].y); }
                        for(let i=22; i<26; i++) { ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i+1].x, points[i+1].y); }
                        // Nose
                        for(let i=27; i<30; i++) { ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i+1].x, points[i+1].y); }
                        for(let i=31; i<35; i++) { ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i+1].x, points[i+1].y); }
                        
                        // Cross-connections for "polygons"
                        ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[17].x, points[17].y);
                        ctx.moveTo(points[16].x, points[16].y); ctx.lineTo(points[26].x, points[26].y);
                        ctx.moveTo(points[8].x, points[8].y); ctx.lineTo(points[30].x, points[30].y);
                        
                        ctx.stroke();

                        // Nodes
                        ctx.fillStyle = '#ff00ff'; // Magenta
                        [0, 8, 16, 17, 21, 22, 26, 30].forEach(i => {
                            ctx.beginPath();
                            ctx.arc(points[i].x, points[i].y, 2, 0, Math.PI * 2);
                            ctx.fill();
                        });
                    }
                }
            } catch (err) {
                // Silent fail
            }

            animationId = requestAnimationFrame(trackHUD);
        };

        trackHUD();
        return () => cancelAnimationFrame(animationId);
    }, [isModelsLoaded, isProcessing, scannedStudent]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Webcam error:", err);
            showError("Cannot access webcam. Please allow permissions.");
        }
    };

    const handleVideoPlay = () => {
        const intervalId = setInterval(async () => {
            if (isProcessing || scannedStudent || !videoRef.current || !isModelsLoaded) return;

            const video = videoRef.current;
            if (video.paused || video.ended) return;

            try {
                const faceapi = await import('@vladmandic/face-api');
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    // Capture Frame
                    const captureCanvas = document.createElement('canvas');
                    captureCanvas.width = video.videoWidth;
                    captureCanvas.height = video.videoHeight;
                    const ctx = captureCanvas.getContext('2d');
                    if (ctx) {
                        ctx.translate(captureCanvas.width, 0);
                        ctx.scale(-1, 1);
                        ctx.drawImage(video, 0, 0);
                    }
                    const capturedImage = captureCanvas.toDataURL('image/jpeg', 0.8);

                    // Process Face
                    processFace(Array.from(detection.descriptor), capturedImage);
                } else {
                    if (canvasRef.current) {
                        const context = canvasRef.current.getContext('2d');
                        if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                }
            } catch (err) {
                console.error("Error with face detection:", err);
            }
        }, 3500); 

        return () => clearInterval(intervalId);
    };

    const processFace = async (descriptor: number[], capturedImage: string) => {
        setIsProcessing(true);
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
                    captured_image: capturedImage
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
                        // Delay before allowing next scan (3.5s)
                        setTimeout(() => setIsProcessing(false), 3500);
                    }, 4000);
                } else {
                    if (data.best_distance) {
                        showError(`${data.message || 'Face not recognized'} (Dist: ${data.best_distance.toFixed(3)})`);
                    } else {
                        showError(data.message || 'Unknown error');
                    }
                    setTimeout(() => setIsProcessing(false), 3000);
                }
            } else {
                showError(data.message || 'Unknown error');
                setTimeout(() => setIsProcessing(false), 3000);
            }
        } catch (error) {
            console.error('Network Error:', error);
            showError('Network Error connecting to the server. Check your backend.');
            setTimeout(() => setIsProcessing(false), 3000);
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
                            <img src={scannedStudent.PIC} alt="Profile" className="w-full h-full object-cover rounded-full" />
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
                ) : (
                    <div className="relative z-10 w-full flex flex-col justify-between h-full py-8">
                        <div className="pt-4 animate-in fade-in duration-500">
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95]">
                                NAAP<br />
                                <span className="text-[#ffb300]">LIBRARY</span><br />
                                SYSTEM
                            </h1>
                            <p className="mt-8 text-base lg:text-lg font-light text-blue-50 max-w-md leading-relaxed opacity-90">
                                Experience seamless facility exit. Present your face to the camera to conclude your session automatically.
                            </p>
                        </div>
                        <div className="flex flex-col mt-20">
                            <div className="relative mb-24 w-max">
                                <span className="text-2xl font-bold italic opacity-80 tracking-widest">#NAAPviator</span>
                                <ShieldCheck
                                    className="absolute w-44 h-44 -left-8 -top-8 text-white opacity-[0.04] -rotate-[15deg] pointer-events-none"
                                    strokeWidth={1}
                                />
                            </div>
                            <div className="text-xs text-blue-200/80 space-y-1.5 font-light">
                                <p>Support: example@gmail.com</p>
                                <p>Facebook Page: https://www.facebook.com/VillamorCampus</p>
                                <p>Official Portal: https://www.naap.edu.ph</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center w-full lg:w-[45%] p-6 sm:p-12 relative">
                <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden relative z-10 border border-gray-100/50">
                    <div className={`h-1.5 w-full transition-colors duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'bg-red-500' : scannedStudent?.tap_status === 'has_locker' ? 'bg-[#ffb300]' : scannedStudent ? 'bg-green-500' : 'bg-[#024495]'}`}></div>

                    <div className="p-10 flex flex-col items-center text-center">
                        <h2 className={`text-[28px] font-black tracking-tight mb-2 transition-colors duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'text-red-600' : scannedStudent?.tap_status === 'has_locker' ? 'text-[#ffb300]' : scannedStudent ? 'text-green-600' : 'text-[#024495]'}`}>
                            Face Logout
                        </h2>
                        <p className="text-slate-500 mb-8 text-sm">Look at the camera</p>

                        <div className={`relative flex items-center justify-center w-[240px] h-[240px] rounded-2xl overflow-hidden border-4 bg-slate-100 mb-8 transition-all duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'border-red-500' : scannedStudent?.tap_status === 'has_locker' ? 'border-[#ffb300]' : scannedStudent ? 'border-green-500' : 'border-[#024495]'}`}>
                            {!isModelsLoaded ? (
                                <div className="text-slate-400 text-sm flex flex-col items-center loading-pulse">
                                    <Camera className="mb-2 opacity-50" size={32}/>
                                    Loading Models...
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
                                </>
                            )}
                        </div>

                        {errorMessage && (
                            <div className="mb-4 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-sm w-full animate-in fade-in zoom-in duration-300">
                                {errorMessage}
                            </div>
                        )}

                        <div className={`px-6 py-2.5 rounded-full text-sm font-medium border shadow-sm transition-all duration-500 ${scannedStudent?.tap_status === 'already_out'
                                ? 'bg-red-100/80 text-red-700 border-red-200'
                                : scannedStudent?.tap_status === 'has_locker'
                                    ? 'bg-[#ffb300]/20 text-[#b37a00] border-[#ffb300]/30'
                                    : scannedStudent
                                        ? 'bg-green-100/80 text-green-700 border-green-200'
                                        : isProcessing ? 'bg-blue-100/80 text-[#024495] border-blue-200' : 'bg-slate-100/80 text-slate-600 border-slate-200'
                            }`}>
                            {scannedStudent?.tap_status === 'already_out' ? 'Invalid Tap' : scannedStudent?.tap_status === 'has_locker' ? 'Locker Key Unreturned' : scannedStudent ? 'Validation Complete' : isProcessing ? 'Identifying...' : 'Scanning for face...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

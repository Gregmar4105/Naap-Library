import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    let isCollapsed = false;
    try {
        const { state } = useSidebar();
        isCollapsed = state === 'collapsed';
    } catch {
        isCollapsed = false;
    }

    if (isCollapsed) {
        return (
            <div className="relative flex flex-col items-center justify-center overflow-hidden group w-11 h-11 bg-[#024495] text-white font-black text-2xl rounded-full shadow-sm transition-transform hover:scale-[1.05] border-2 border-[#ffb300]">
                <style>{`
                    @keyframes shineSweepN {
                        0% { transform: translateX(-40px) skewX(35deg); opacity: 0; }
                        20% { opacity: 0.8; }
                        50% { transform: translateX(60px) skewX(35deg); opacity: 0; }
                        100% { transform: translateX(60px) skewX(35deg); opacity: 0; }
                    }
                `}</style>
                <span className="relative z-10">N</span>
                {/* Silver Shining Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full z-20">
                    <div
                        className="absolute -top-full -bottom-full w-[15px] bg-gradient-to-r from-transparent via-white/90 to-transparent mix-blend-overlay blur-[1px]"
                        style={{ animation: 'shineSweepN 2s ease-in-out infinite' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col items-center justify-center overflow-hidden group w-full bg-white rounded-md py-1.5 px-2 shadow-sm transition-transform hover:scale-[1.02]">
            <style>{`
                @keyframes shineSweepLogo {
                    0% { transform: translateX(-100px) skewX(35deg); opacity: 0; }
                    20% { opacity: 0.8; }
                    50% { transform: translateX(400px) skewX(35deg); opacity: 0; }
                    100% { transform: translateX(400px) skewX(35deg); opacity: 0; }
                }
            `}</style>

            <div className="bg-[#024495] text-white w-full text-center pt-1.5 pb-1 font-black text-2xl sm:text-[26px] leading-none tracking-tight rounded-[4px] relative z-10">
                NAAP
            </div>
            <div className="text-[#024495] font-black text-sm leading-none tracking-[0.25em] mt-1 uppercase relative z-10">
                LIBRARY
            </div>

            {/* Silver Shining Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
                <div
                    className="absolute -top-full -bottom-full w-[40px] bg-gradient-to-r from-transparent via-white/80 to-transparent mix-blend-overlay blur-[1px]"
                    style={{ animation: 'shineSweepLogo 3s ease-in-out infinite' }}
                />
            </div>
        </div>
    );
}

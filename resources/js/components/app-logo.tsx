export default function AppLogo() {
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

import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, MapPin, Clock, Lock, Monitor, ArrowRight, ShieldCheck, Search, Users, Laptop } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<any>().props;

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ffb300] selection:text-[#024495] overflow-x-hidden text-slate-800">
            <Head title="Welcome - NAAP Library System" />

            {/* Navigation / Header */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-24">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <img src="https://naap.edu.ph/wp-content/uploads/2020/09/Logo-NAAP-600x165.png" alt="NAAP Logo" className="h-16 sm:h-[72px] object-contain" />
                            <div className="h-12 w-px bg-gray-300 hidden md:block"></div>
                            <span className="text-[#024495] font-black tracking-tight text-2xl hidden md:block uppercase leading-tight">
                                Library System
                            </span>
                        </div>
                        <nav className="flex items-center gap-3 sm:gap-6">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-2.5 rounded-full bg-[#024495] text-white font-semibold text-sm hover:bg-[#013575] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Access Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-[#024495] font-semibold text-sm hover:text-[#013575] transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href="/register"
                                            className="px-6 py-2.5 rounded-full bg-[#ffb300] text-[#024495] font-bold text-sm hover:bg-[#e6a100] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            Register
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://naap.edu.ph/wp-content/uploads/2025/09/cover-1024x575.png"
                        alt="Library Interior"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-[#024495]/60 to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-12">
                    <div className="animate-in fade-in zoom-in slide-in-from-bottom flex flex-col items-center duration-1000">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-10 shadow-lg">
                            <Monitor className="w-4 h-4 text-[#ffb300]" />
                            <span>Online Public Access Catalogue (OPAC) Enabled</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight uppercase leading-[1.05] mb-8">
                            Center of <span className="text-[#ffb300]">Aviation</span><br />Knowledge
                        </h1>
                        <p className="text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
                            Welcome to the NAAP Villamor Campus Library. Explore our vast collections spanning engineering, aeronautics, and Filipiniana, secured by state-of-the-art RFID depository systems.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-4 rounded-full bg-[#ffb300] text-[#024495] font-black tracking-wide hover:bg-[#ffbd1e] hover:shadow-[0_0_40px_rgba(255,179,0,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                                >
                                    Enter Library Portal <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-8 py-4 rounded-full bg-[#ffb300] text-[#024495] font-black tracking-wide hover:bg-[#ffbd1e] hover:shadow-[0_0_40px_rgba(255,179,0,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                                >
                                    Student Login <ArrowRight className="w-5 h-5" />
                                </Link>
                            )}
                            <a
                                href="#facilities"
                                className="px-8 py-4 rounded-full bg-white/10 text-white border border-white/20 font-bold tracking-wide hover:bg-white/20 transition-all duration-300 flex items-center justify-center backdrop-blur-md text-lg"
                            >
                                Explore Facilities
                            </a>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce cursor-pointer opacity-80 hover:opacity-100">
                    <a href="#depository">
                        <div className="w-8 h-12 rounded-full border-2 border-white/40 flex items-start justify-center p-2 bg-white/5 backdrop-blur-md">
                            <div className="w-1.5 h-3 bg-[#ffb300] rounded-full animate-[pulse_2s_infinite]"></div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Smart Depository Section */}
            <section id="depository" className="py-24 lg:py-36 bg-white relative overflow-hidden">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-blue-50/50 rounded-bl-[100px] -z-0"></div>
                <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-slate-50 rounded-tr-[100px] -z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="order-2 lg:order-1 relative group mt-10 lg:mt-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#024495] to-[#ffb300] rounded-[2.5rem] transform translate-x-4 -translate-y-4 opacity-15 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-700 blur"></div>
                            <div className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden p-2">
                                <img
                                    src="https://naap.edu.ph/wp-content/uploads/2025/10/lib02.png"
                                    alt="RFID Depository System"
                                    className="w-full h-auto rounded-[2rem] object-cover hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Status</p>
                                        <p className="text-gray-900 font-black">100% Secured</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[#024495] mb-8 shadow-inner border border-blue-100">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#024495] mb-8 leading-[1.15] tracking-tight">
                                Smart RFID <br /><span className="text-[#ffb300]">Depository System</span>
                            </h2>
                            <p className="text-slate-600 text-lg lg:text-xl mb-6 leading-relaxed">
                                Security and convenience combined. All NAAP library users are required to deposit their personal bags, folders, envelopes, and binders before entering the main facility.
                            </p>
                            <p className="text-slate-600 text-lg lg:text-xl mb-12 leading-relaxed">
                                Our integrated Library Depository System uses <strong>Radio Frequency Identification (RFID) technology</strong> to securely assign and monitor locker usage, ensuring real-time identification and total peace of mind while you study.
                            </p>

                            <ul className="space-y-6">
                                {[
                                    'Secure electronic locker assignment via Student ID',
                                    'Mandatory baggage deposit for a focused learning environment',
                                    'Real-time automated logging and locker monitoring',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#024495] to-[#013575] text-white flex items-center justify-center shadow-md">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-slate-700 font-medium text-lg pt-0.5">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Facilities Section */}
            <section id="facilities" className="py-24 lg:py-36 bg-slate-50 border-t border-gray-200 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-[#ffb300] mb-8 shadow-inner border border-amber-100">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-[#024495] tracking-tight mb-6">Dedicated Learning Spaces</h2>
                        <p className="text-slate-500 text-lg lg:text-xl">Thoughtfully designed for collaborative engagement, quiet research, and academic excellence within the Villamor Campus.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            { title: 'Learning Commons', icon: Users, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib01.png', desc: 'A participatory space built for social learning, creativity, and student collaboration.' },
                            { title: 'Computer Area', icon: Laptop, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib06.png', desc: 'Tablets and PCs available for intensive online research and digital academia.' },
                            { title: 'Collaboration Area', icon: Users, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib03.png', desc: 'Dynamic seating arrangements for DIY group projects and knowledge dissemination.' },
                            { title: 'Periodicals & Serials', icon: BookOpen, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib04.png', desc: 'Current journals and a digital bulletin board displayed on a modern 50" television.' },
                            { title: 'Quiet Study Area', icon: Search, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib05.png', desc: 'Whiteboards and dedicated electrical outlets to support focused discussions.' },
                            { title: 'Circulation & Filipiniana', icon: BookOpen, img: 'https://naap.edu.ph/wp-content/uploads/2025/10/lib07.png', desc: 'Extensive core collections featuring local literature and aeronautics references.' },
                        ].map((facility, idx) => (
                            <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                                <div className="h-56 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[#024495]/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply"></div>
                                    <img src={facility.img} alt={facility.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#024495] mb-6 shadow-sm">
                                        <facility.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{facility.title}</h3>
                                    <p className="text-gray-500 leading-relaxed flex-1">{facility.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gradient-to-b from-[#024495] to-[#013575] border-t-8 border-[#ffb300] pt-24 pb-12 text-white relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Decorative large logo watermark */}
                <div className="absolute -bottom-24 -right-24 opacity-5 pointer-events-none select-none mix-blend-overlay">
                    <img src="https://naap.edu.ph/wp-content/uploads/2020/09/Logo-NAAP-600x165.png" alt="" className="w-[800px] blur-[2px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                        <div className="lg:col-span-4 pr-4">
                            <div className="flex items-center gap-3 mb-8">
                                <img src="https://naap.edu.ph/wp-content/uploads/2020/09/Logo-NAAP-600x165.png" alt="NAAP Logo" className="h-14 object-contain brightness-0 invert" />
                            </div>
                            <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6 font-light">
                                <strong className="font-bold text-white block mb-2">National Aviation Academy of the Philippines</strong>
                                Equipping the next generation of aviation professionals with comprehensive resources and world-class learning environments.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://www.facebook.com/VillamorCampus" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-[#ffb300] hover:text-[#024495] hover:shadow-[0_0_20px_rgba(255,179,0,0.4)] transition-all duration-300 border border-white/20">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-4 lg:pl-10">
                            <h4 className="text-xl font-bold mb-8 text-white tracking-wider uppercase flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#ffb300]" /> Location
                            </h4>
                            <ul className="space-y-6">
                                <li>
                                    <p className="text-blue-100 text-base leading-relaxed font-light">
                                        <strong className="font-semibold text-white">NAAP Library, 3rd Floor, Building A</strong><br />
                                        Piccio Garden, Villamor Air Base<br />
                                        Pasay City, Philippines
                                    </p>
                                </li>
                                <li>
                                    <a href="mailto:philscalibrary69@gmail.com" className="group inline-flex items-center gap-3 text-base text-blue-100 hover:text-[#ffb300] transition-colors font-light">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#ffb300]/20 transition-colors">
                                            <svg className="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        example@gmail.com
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="lg:col-span-4 lg:pl-8">
                            <h4 className="text-xl font-bold mb-8 text-white tracking-wider uppercase flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#ffb300]" /> Operating Hours
                            </h4>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                <div className="mb-4 pb-4 border-b border-white/10">
                                    <p className="font-bold text-white mb-2 tracking-wide">Regular Semester</p>
                                    <p className="text-blue-100 font-light flex justify-between">
                                        <span>Mon - Fri:</span>
                                        <span className="font-medium text-white">7:00 AM – 7:00 PM</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-[#ffb300] mb-2 tracking-wide">Weekend / IGS</p>
                                    <p className="text-blue-100 font-light flex justify-between">
                                        <span>Sat - Sun:</span>
                                        <span className="font-medium text-white">8:00 AM – 1:00 PM</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/20 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-blue-200">
                        <p className="font-light">© {new Date().getFullYear()} NAAP Library System. All rights reserved.</p>
                        <p className="flex gap-8 font-medium">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

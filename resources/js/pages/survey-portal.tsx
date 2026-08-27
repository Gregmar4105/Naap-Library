import { Head } from '@inertiajs/react';
import {
    CheckSquare,
    List,
    ArrowRight,
    ClipboardList,
    Library
} from 'lucide-react';

interface Survey {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed';
    questions_count?: number;
}

interface SurveyPortalProps {
    surveys: Survey[];
}

export default function SurveyPortal({ surveys }: SurveyPortalProps) {
    return (
        <div className="min-h-screen bg-[#f8fafc] py-12 px-6 sm:px-12 flex flex-col justify-between">
            <Head title="Library Surveys Portal" />

            {/* Background Accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto space-y-10 flex-1 flex flex-col justify-center">
                {/* Brand / Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex h-20 w-20 bg-gradient-to-tr from-[#024495] to-blue-600 text-white rounded-3xl items-center justify-center shadow-xl shadow-blue-900/20 mb-2">
                        <Library className="h-10 w-10" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 bg-clip-text text-transparent">
                        Library Surveys Portal
                    </h1>
                    <p className="text-gray-500 text-lg font-bold max-w-lg mx-auto">
                        Please choose a survey from the list below to share your feedback and help us improve.
                    </p>
                </div>

                {/* Surveys Grid / List */}
                <div className="grid grid-cols-1 gap-6 w-full max-w-2xl mx-auto">
                    {surveys.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center shadow-2xl shadow-blue-900/5">
                            <div className="h-20 w-20 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <ClipboardList className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Surveys</h3>
                            <p className="text-gray-500 font-bold">
                                There are no surveys available for answering right now. Please check back later.
                            </p>
                        </div>
                    ) : (
                        surveys.map((survey) => (
                            <a
                                key={survey.id}
                                href={`/s/${survey.id}`}
                                className="group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-blue-500/20 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 cursor-pointer"
                            >
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-blue-50 text-[#024495] rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#024495] group-hover:text-white transition-all duration-300">
                                            <CheckSquare className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-[#024495] transition-colors leading-tight">
                                            {survey.title}
                                        </h2>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium pl-13 line-clamp-2">
                                        {survey.description || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest pl-13 pt-1">
                                        <List className="h-4 w-4" /> {survey.questions_count || 0} Questions
                                    </div>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#024495] transition-all duration-300 self-end sm:self-center shrink-0">
                                    <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1.5 transition-transform duration-300" />
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-12 text-center text-gray-400 font-bold text-sm">
                Powered by NAAP Library Survey System
            </div>
        </div>
    );
}

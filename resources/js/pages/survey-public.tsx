import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Loader2,
    Star,
    CheckSquare,
    ArrowLeft
} from 'lucide-react';
import { useState } from 'react';

// Types
type QuestionType = 'short_text' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'rating' | 'date';

interface Question {
    id: number;
    type: QuestionType;
    label: string;
    options?: string[];
    required: boolean;
    order?: number;
}

interface Survey {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed';
    questions?: Question[];
}

interface PublicSurveyProps {
    survey: Survey;
}

export default function PublicSurvey({ survey }: PublicSurveyProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const checkRequired = () => {
        const newErrors: Record<string, string> = {};
        for(let q of survey.questions!) {
            if (q.required) {
                const ans = answers[String(q.id)];
                if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
                    newErrors[String(q.id)] = `This question is required.`;
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if(!checkRequired()) {
            const firstErrorId = Object.keys(errors)[0];
            if (firstErrorId) {
                document.getElementById(`q-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/survey/${survey.id}/submit-public`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if(data.success) {
                setSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <Head title="Success - Survey Submitted" />
                <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-12 text-center shadow-2xl shadow-blue-900/5 border border-gray-100 animate-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-inner">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Response Recorded</h2>
                    <p className="text-gray-500 text-lg mb-10 font-medium leading-relaxed">
                        Thank you for your valuable feedback! Your response has been securely saved.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-10 py-4 bg-[#024495] text-white font-black rounded-2xl hover:bg-[#013370] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
                    >
                        Submit Another Response
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] py-12 px-6 sm:px-12">
            <Head title={survey.title} />
            
            {/* Background Accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="relative z-10 w-full max-w-3xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-3xl p-10 border border-gray-100 border-t-[12px] border-t-[#024495] shadow-2xl shadow-blue-900/5">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{survey.title}</h1>
                    {survey.description && (
                        <div className="mt-6 text-gray-600 text-lg font-medium leading-relaxed">
                            {survey.description}
                        </div>
                    )}
                    <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-sm font-bold text-red-500/80 uppercase tracking-wider">* Required question</p>
                        <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#024495] rounded-full transition-all duration-500" style={{ width: `${(Object.keys(answers).length / (survey.questions?.length || 1)) * 100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                {survey.questions?.map((q) => (
                    <div 
                        key={q.id} 
                        id={`q-${q.id}`}
                        className={`bg-white rounded-3xl p-10 border transition-all duration-300 ${errors[String(q.id)] ? 'border-red-200 shadow-red-900/5 shadow-2xl' : 'border-gray-100 shadow-xl shadow-blue-900/5 hover:shadow-2xl'}`}
                    >
                        <label className="text-xl font-bold text-gray-900 mb-8 block leading-snug">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        
                        <div className="mt-2">
                            <SurveyQuestionInput 
                                question={q} 
                                value={answers[String(q.id)]} 
                                onChange={(val: any) => {
                                    setAnswers(prev => ({ ...prev, [String(q.id)]: val }));
                                    if (errors[String(q.id)]) {
                                        const newErrors = { ...errors };
                                        delete newErrors[String(q.id)];
                                        setErrors(newErrors);
                                    }
                                }} 
                            />
                        </div>

                        {errors[String(q.id)] && (
                            <div className="mt-6 text-red-500 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                                <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                                {errors[String(q.id)]}
                            </div>
                        )}
                    </div>
                ))}

                {/* Submit Section */}
                <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-8">
                    <p className="text-gray-500 font-medium text-center sm:text-left">
                        By submitting, you agree to provide your feedback for this survey.
                    </p>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-[#024495] text-white px-12 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            'Submit Survey'
                        )}
                    </button>
                </div>

                <div className="pt-8 text-center text-gray-400 font-bold text-sm">
                    Powered by NAAP Library Survey System
                </div>
            </div>
        </div>
    );
}

function SurveyQuestionInput({ question, value, onChange }: any) {
    if (question.type === 'short_text') {
        return (
            <input 
                type="text" 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                className="w-full sm:w-2/3 text-lg border-none border-b-2 border-gray-100 focus:border-[#024495] focus:ring-0 bg-transparent px-0 py-3 transition-all placeholder:text-gray-300 font-medium" 
                placeholder="Type your answer here..." 
            />
        );
    }
    
    if (question.type === 'paragraph') {
        return (
            <textarea 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                rows={4} 
                className="w-full text-lg border-none border-b-2 border-gray-100 focus:border-[#024495] focus:ring-0 bg-transparent px-0 py-3 resize-none transition-all placeholder:text-gray-300 font-medium" 
                placeholder="Type your detailed answer here..." 
            />
        );
    }

    if (question.type === 'multiple_choice') {
        return (
            <div className="grid grid-cols-1 gap-4">
                {question.options?.map((opt: string) => (
                    <label key={opt} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all group hover:bg-blue-50/30 ${value === opt ? 'border-[#024495] bg-blue-50/50' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${value === opt ? 'border-[#024495] bg-[#024495]' : 'border-gray-300'}`}>
                            {value === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-lg font-bold ${value === opt ? 'text-[#024495]' : 'text-gray-700'}`}>{opt}</span>
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
            <div className="grid grid-cols-1 gap-4">
                {question.options?.map((opt: string) => {
                    const isChecked = arr.includes(opt);
                    return (
                        <label key={opt} onClick={() => toggle(opt)} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all group hover:bg-blue-50/30 ${isChecked ? 'border-[#024495] bg-blue-50/50' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}>
                            <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'border-[#024495] bg-[#024495]' : 'border-gray-300'}`}>
                                {isChecked && <CheckSquare className="h-4 w-4 text-white" />}
                            </div>
                            <span className={`text-lg font-bold ${isChecked ? 'text-[#024495]' : 'text-gray-700'}`}>{opt}</span>
                        </label>
                    );
                })}
            </div>
        );
    }

    if (question.type === 'dropdown') {
        return (
            <div className="relative w-full sm:w-2/3">
                <select 
                    value={value || ''} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full text-lg border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-[#024495] focus:ring-0 bg-white shadow-sm font-bold text-gray-700 cursor-pointer appearance-none transition-all hover:border-gray-200"
                >
                    <option value="" disabled>Choose an option</option>
                    {question.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <CheckCircle2 className="h-5 w-5 bg-white" />
                </div>
            </div>
        );
    }

    if (question.type === 'rating') {
        return (
            <div className="flex flex-wrap items-center gap-4">
                {[1,2,3,4,5].map(n => (
                    <button 
                        key={n} 
                        type="button" 
                        onClick={() => onChange(n)} 
                        className={`group relative p-4 rounded-2xl border-2 transition-all hover:scale-110 active:scale-95 ${value >= n ? 'border-yellow-100 bg-yellow-50/30' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                    >
                        <Star className={`h-10 w-10 transition-colors ${value >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 group-hover:text-gray-300'}`} />
                        <span className="sr-only">Rate {n} out of 5</span>
                    </button>
                ))}
                <span className="ml-4 text-xl font-black text-gray-900">{value > 0 ? `${value} / 5` : ''}</span>
            </div>
        );
    }

    if (question.type === 'date') {
        return (
            <input 
                type="date" 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                className="w-full sm:w-2/3 text-lg border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-[#024495] focus:ring-0 bg-white shadow-sm font-bold text-gray-700 transition-all hover:border-gray-200" 
            />
        );
    }

    return null;
}

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
    Users
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
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
}

interface Survey {
    id?: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed';
    questions_count?: number;
    responses_count?: number;
    created_at?: string;
    questions?: Question[];
}

interface SurveyPageProps {
    surveys: Survey[];
}

export default function SurveyPage({ surveys: initialSurveys }: SurveyPageProps) {
    const [surveys, setSurveys] = useState<Survey[]>(initialSurveys);
    const [activeTab, setActiveTab] = useState<'list' | 'builder' | 'responses' | 'take'>('list');
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sharingSurvey, setSharingSurvey] = useState<Survey | null>(null);
    const [isCopying, setIsCopying] = useState(false);

    // Refresh surveys list
    const fetchSurveys = () => {
        router.reload({ only: ['surveys', 'auth'], onSuccess: (page) => {
            if(page.props.surveys) setSurveys(page.props.surveys as unknown as Survey[]);
        }});
    };

    const handleCreateNew = () => {
        setSelectedSurvey({
            title: 'Untitled Survey',
            description: '',
            status: 'draft',
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
        if (!confirm('Are you sure you want to delete this survey?')) return;
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

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
    };

    const getPublicUrl = (id: number) => `${window.location.origin}/s/${id}`;

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
                        onCreateNew={handleCreateNew} 
                        onEdit={handleEdit}
                        onTake={handleTakeSurvey}
                        onDelete={handleDelete}
                        onViewResponses={handleViewResponses}
                        onShare={(s: Survey) => setSharingSurvey(s)}
                    />
                )}
                {activeTab === 'builder' && selectedSurvey && (
                    <SurveyBuilder 
                        survey={selectedSurvey} 
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

            {/* Share Modal */}
            <Dialog open={!!sharingSurvey} onOpenChange={(open) => !open && setSharingSurvey(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-[#024495] p-8 text-white relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <DialogTitle className="text-2xl font-black mb-2 flex items-center gap-3 relative z-10">
                            <Share2 className="h-6 w-6" /> Share Survey
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium relative z-10 leading-relaxed">
                            Provide this link or QR code to participants to collect responses anonymously.
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-8 bg-white">
                        {sharingSurvey && (
                            <>
                                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner group">
                                    <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100 mb-4 transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:rotate-1">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getPublicUrl(sharingSurvey.id!))}`} 
                                            alt="Survey QR Code" 
                                            className="w-40 h-40"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Scan to Open Form</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Shareable Link</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-600 truncate shadow-inner">
                                            {getPublicUrl(sharingSurvey.id!)}
                                        </div>
                                        <button 
                                            onClick={() => handleCopyLink(getPublicUrl(sharingSurvey.id!))}
                                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg ${isCopying ? 'bg-green-500 text-white shadow-green-200' : 'bg-[#024495] text-white hover:bg-blue-800 shadow-blue-200'}`}
                                        >
                                            {isCopying ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                            {isCopying ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="pt-4">
                                    <button 
                                        onClick={() => setSharingSurvey(null)}
                                        className="w-full py-4 text-gray-400 font-black hover:text-gray-900 transition-colors uppercase text-xs tracking-widest"
                                    >
                                        Close Window
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ---------------------------------------------------------
// SURVEY LIST COMPONENT
// ---------------------------------------------------------
function SurveyList({ surveys, onCreateNew, onEdit, onTake, onDelete, onViewResponses, onShare }: any) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#024495] flex items-center gap-3">
                        <div className="h-12 w-12 bg-[#024495] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#024495]/20">
                            <CheckSquare className="h-6 w-6" />
                        </div>
                        Surveys & Feedback
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium ml-16">
                        Create dynamic forms and collect insights from students.
                    </p>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="flex items-center gap-2 bg-[#024495] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="h-5 w-5" /> Create Survey
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-gray-100 shadow-xl gap-4">
                {surveys.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-4">
                            <FileText className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">No Surveys Yet</h3>
                        <p className="text-gray-500 mt-2">Create your first survey to start collecting responses.</p>
                    </div>
                ) : (
                    surveys.map((survey: Survey) => (
                        <div key={survey.id} className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-[#024495]/30 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <h3 className="text-xl font-black text-gray-900 mb-1">{survey.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">{survey.description || 'No description'}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0
                                    ${survey.status === 'active' ? 'bg-green-100 text-green-700' : 
                                      survey.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                                `}>
                                    {survey.status}
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
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(survey)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg hover:text-[#024495] transition-colors" title="Edit">
                                        <Edit3 className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onViewResponses(survey)} className="p-2 text-gray-400 hover:bg-blue-50 rounded-lg hover:text-[#024495] transition-colors" title="View Responses">
                                        <BarChart3 className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDelete(survey.id!)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => onShare(survey)} 
                                        disabled={survey.status !== 'active'}
                                        className={`p-2 rounded-lg transition-colors ${survey.status === 'active' ? 'text-gray-400 hover:bg-green-50 hover:text-green-600' : 'text-gray-200 cursor-not-allowed'}`} 
                                        title="Share (Only for Active Surveys)"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={() => onTake(survey)}
                                    className="flex items-center gap-2 text-[#024495] font-black hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Eye className="h-4 w-4" /> Preview
                                </button>
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
function SurveyBuilder({ survey: initialData, onClose }: { survey: Survey, onClose: () => void }) {
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

            if(data.success) {
                onClose();
            } else {
                alert(data.message || 'Failed to save');
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
                        Save Survey
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
                {/* Header Card */}
                <div className="bg-white rounded-b-3xl rounded-t-lg p-8 border border-gray-100 border-t-8 border-t-[#024495] shadow-xl">
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
                        onChange={(updates) => handleUpdateQuestion(i, updates)}
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
        for(let q of survey.questions!) {
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
        if(!checkRequired()) return;

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
            if(data.success) {
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
                {[1,2,3,4,5].map(n => (
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
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft className="h-5 w-5" /> Back
                    </button>
                    <div className="h-8 w-px bg-gray-100 mx-2" />
                    <h2 className="text-xl font-black text-gray-900">{survey.title} — Responses</h2>
                </div>
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

                                {/* Choice-based visualization */}
                                {item.counts && (
                                    <div className="space-y-4">
                                        {Object.entries(item.counts).map(([label, count]: [string, any]) => {
                                            const percentage = ((count / item.total) * 100).toFixed(0);
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

                                {/* Rating visualization */}
                                {item.type === 'rating' && (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex justify-center flex-col items-center">
                                            <span className="text-5xl font-black text-[#024495]">{item.average || 0}</span>
                                            <div className="flex gap-1 mt-2">
                                                {[1,2,3,4,5].map(n => (
                                                    <Star key={n} className={`h-5 w-5 ${item.average >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 mt-2">AVERAGE RATING</p>
                                        </div>
                                        <div className="space-y-2">
                                            {[5,4,3,2,1].map(n => {
                                                const count = item.distribution[n] || 0;
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

                                {/* Text-based visualization */}
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

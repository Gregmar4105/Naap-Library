import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, BarChart3, Search, TrendingUp, Lightbulb, 
    RefreshCw, AlertTriangle, Settings, Loader2,
    ChevronRight,
    BrainCircuit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface AIInsightsPanelProps {
    dateRange: DateRange | undefined;
}

type TabKey = 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';

interface TabConfig {
    key: TabKey;
    label: string;
    icon: React.ElementType;
    emoji: string;
    color: string;
    activeColor: string;
    bgGradient: string;
    description: string;
}

const TABS: TabConfig[] = [
    {
        key: 'descriptive',
        label: 'Descriptive',
        icon: BarChart3,
        emoji: '📊',
        color: 'text-blue-600 dark:text-blue-400',
        activeColor: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        bgGradient: 'from-blue-500/5 to-transparent dark:from-blue-500/10 dark:to-transparent',
        description: 'Analyzes library usage data to explain what happened during the selected period.',
    },
    {
        key: 'diagnostic',
        label: 'Diagnostic',
        icon: Search,
        emoji: '🔍',
        color: 'text-purple-600 dark:text-purple-400',
        activeColor: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
        bgGradient: 'from-purple-500/5 to-transparent dark:from-purple-500/10 dark:to-transparent',
        description: 'Identifies patterns in student entries and registration trends.',
    },
    {
        key: 'predictive',
        label: 'Predictive',
        icon: TrendingUp,
        emoji: '📈',
        color: 'text-emerald-600 dark:text-emerald-400',
        activeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        bgGradient: 'from-emerald-500/5 to-transparent dark:from-emerald-500/10 dark:to-transparent',
        description: 'Forecasts future peak hours and upcoming registration volumes.',
    },
    {
        key: 'prescriptive',
        label: 'Prescriptive',
        icon: Lightbulb,
        emoji: '💡',
        color: 'text-amber-600 dark:text-amber-400',
        activeColor: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        bgGradient: 'from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-transparent',
        description: 'Provides recommendations to optimize library staffing and resource allocation.',
    },
];

// Parse the AI's markdown response into the four sections
function parseSections(text: string): Record<TabKey, string> {
    const sections: Record<TabKey, string> = {
        descriptive: '',
        diagnostic: '',
        predictive: '',
        prescriptive: '',
    };

    if (!text) return sections;

    const chunks = text.split(/(?=^##\s+)/m);
    
    for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed.startsWith('##')) continue;
        
        const lines = trimmed.split('\n');
        const header = lines[0].toLowerCase();
        const content = lines.slice(1).join('\n').trim();
        
        if (header.includes('descriptive')) sections.descriptive = content;
        else if (header.includes('diagnostic')) sections.diagnostic = content;
        else if (header.includes('predictive')) sections.predictive = content;
        else if (header.includes('prescriptive')) sections.prescriptive = content;
    }

    // Fallback regex
    if (!sections.descriptive || !sections.prescriptive) {
        const getMatch = (keyword: string) => {
            const regex = new RegExp(`##\\s*.*?${keyword}.*?\\n?([\\s\\S]*?)(?=##\\s*|$)`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        if (!sections.descriptive) sections.descriptive = getMatch('descriptive');
        if (!sections.diagnostic) sections.diagnostic = getMatch('diagnostic');
        if (!sections.predictive) sections.predictive = getMatch('predictive');
        if (!sections.prescriptive) sections.prescriptive = getMatch('prescriptive');
    }

    return sections;
}

function renderMarkdown(text: string) {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${listKey++}`} className="space-y-2 my-3">
                    {listItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                            <ChevronRight className="w-3.5 h-3.5 mt-1 text-primary shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/^[-*]\s+/)) {
            listItems.push(line.replace(/^[-*]\s+/, ''));
            continue;
        }

        flushList();

        if (line.match(/^###\s+/)) {
            elements.push(
                <h4 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">
                    {line.replace(/^###\s+/, '')}
                </h4>
            );
        } else if (line.trim() === '') {
            // skip empty lines
        } else {
            elements.push(
                <p key={i} className="text-sm leading-relaxed text-muted-foreground my-1.5" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
        }
    }

    flushList();

    return <>{elements}</>;
}

function formatInline(text: string): string {
    let result = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
    result = result.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-primary text-xs font-mono">$1</code>');
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return result;
}

export function AIInsightsPanel({ dateRange }: AIInsightsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('descriptive');
    const [rawText, setRawText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const sections = parseSections(rawText);

    const generateAnalysis = useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) return;

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);
        setRawText('');
        setHasGenerated(true);
        setActiveTab('descriptive');

        try {
            const xsrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const res = await fetch('/reports/ai-analyze', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken ?? ''),
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    start_date: format(dateRange.from, 'yyyy-MM-dd'),
                    end_date: format(dateRange.to, 'yyyy-MM-dd'),
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${res.status}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let accumulated = '';
            let lineBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = (lineBuffer + chunk).split('\n');
                
                lineBuffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        const jsonStr = trimmedLine.slice(6).trim();
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.text) {
                                accumulated += data.text;
                                setRawText(accumulated);

                                if (data.text.includes('##')) {
                                    const lowerAcc = accumulated.toLowerCase();
                                    const lastHeaderIndex = lowerAcc.lastIndexOf('##');
                                    const lastHeader = lowerAcc.slice(lastHeaderIndex);
                                    
                                    if (lastHeader.includes('prescriptive')) setActiveTab('prescriptive');
                                    else if (lastHeader.includes('predictive')) setActiveTab('predictive');
                                    else if (lastHeader.includes('diagnostic')) setActiveTab('diagnostic');
                                }
                            }
                        } catch {
                            // Skip chunks
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Failed to generate analysis');
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    const activeTabConfig = TABS.find(t => t.key === activeTab)!;
    const currentContent = sections[activeTab];

    const isCurrentTabStreaming = isLoading && !currentContent;
    const showStreamingRaw = isLoading && !sections.descriptive;

    return (
        <Card className="h-full overflow-hidden border-0 shadow-none bg-background">
            <CardHeader className="relative overflow-hidden border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            AI Strategic Analysis
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                EXPERIMENTAL
                            </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Automated insights for library management
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {!hasGenerated && !error && (
                    <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                            {TABS.map((tab) => (
                                <div key={tab.key} className="p-4 rounded-xl border border-border bg-card/50 text-left">
                                    <div className="flex items-center gap-2 mb-2">
                                        <tab.icon className={cn("w-4 h-4", tab.color)} />
                                        <h3 className="font-bold text-xs">{tab.label}</h3>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {tab.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={generateAnalysis}
                            disabled={isLoading || !dateRange?.from || !dateRange?.to}
                            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-6 rounded-full font-bold"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Library Data...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Run AI Assessment</>
                            )}
                        </Button>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">Analysis Failed</h3>
                            <p className="text-sm text-red-500 max-w-sm mx-auto">{error}</p>
                        </div>
                        <Button onClick={generateAnalysis} variant="outline" className="gap-2 mt-4">
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </Button>
                        <a href="/settings/ai-assistant" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5" /> Check AI Settings
                        </a>
                    </div>
                )}

                {hasGenerated && !error && (
                    <div className="space-y-4">
                        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl overflow-x-auto">
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            "flex-1 min-w-0 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all",
                                            isActive
                                                ? tab.activeColor + " border shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="truncate w-full text-center">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className={cn("p-6 rounded-2xl border border-border bg-gradient-to-br min-h-[400px]", activeTabConfig.bgGradient)}
                            >
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{activeTabConfig.emoji}</span>
                                        <h3 className={cn("font-bold text-sm", activeTabConfig.color)}>
                                            {activeTabConfig.label} Analysis
                                        </h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={generateAnalysis}
                                        disabled={isLoading}
                                        className="h-8 text-xs gap-2 text-muted-foreground hover:text-primary"
                                    >
                                        <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                                        Regenerate
                                    </Button>
                                </div>
                                
                                <div className="prose prose-sm max-w-none">
                                    {currentContent ? (
                                        renderMarkdown(currentContent)
                                    ) : isLoading ? (
                                        <div className="space-y-4">
                                            {showStreamingRaw && rawText ? (
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap animate-pulse">
                                                    {rawText}
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        AI is analyzing this section...
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                                                        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                                                        <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No information available for this section.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

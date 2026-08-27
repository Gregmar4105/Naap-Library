import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface Props {
    data: Array<{ name: string; logs: number }>;
}

export function DailyLogsChart({ data }: Props) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#024495" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#024495" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                />
                <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                    contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="logs"
                    stroke="#024495"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLogs)"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

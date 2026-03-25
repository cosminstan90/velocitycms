'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface ChartItem {
  date: string   // YYYY-MM-DD
  count: number
}

function shortDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="text-violet-300 font-bold">{payload[0].value} articole</p>
    </div>
  )
}

export default function ActivityChart({ data }: { data: ChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={14} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
        <Bar dataKey="count" fill="#7c3aed" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

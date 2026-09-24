import React, { useState } from "react";
import Tooltip from "../../components/ui/Tooltip";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [product, setProduct] = useState("all");
  const [bda, setBda] = useState("all");

  // BDA Leaderboard data
  const bdaLeaderboard = [
    { rank: 1, name: "Dheepak Ajith", calls: 42, avgDuration: "24m", followUpRate: "96%", convRate: "42.8%", avgProb: "78%" },
    { rank: 2, name: "Sneha Raman", calls: 38, avgDuration: "21m", followUpRate: "92%", convRate: "39.5%", avgProb: "74%" },
    { rank: 3, name: "Karthik Verma", calls: 35, avgDuration: "26m", followUpRate: "88%", convRate: "36.0%", avgProb: "71%" },
    { rank: 4, name: "Ananya Iyer", calls: 31, avgDuration: "19m", followUpRate: "94%", convRate: "34.2%", avgProb: "69%" },
    { rank: 5, name: "Rohit Deshmukh", calls: 28, avgDuration: "23m", followUpRate: "85%", convRate: "31.0%", avgProb: "66%" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Consultation & Conversion Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Performance metrics, conversion velocity, and sentiment patterns derived from Classify video calls.
          </p>
        </div>

        {/* Global Chart Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter (Q3)</option>
            <option>Year to Date</option>
          </select>

          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
          >
            <option value="all">All Programs</option>
            <option value="fs">Full Stack Web Dev</option>
            <option value="ds">Data Science</option>
            <option value="ai">AI / Machine Learning</option>
          </select>

          <select
            value={bda}
            onChange={(e) => setBda(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
          >
            <option value="all">All BDAs</option>
            <option value="dheepak">Dheepak Ajith (Admin)</option>
            <option value="sneha">Sneha Raman</option>
          </select>
        </div>
      </div>

      {/* Row 1: Conversion Trend (Line/Area) & Outcome Distribution (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Weekly Conversion Trend
              </h3>
              <p className="text-xs text-slate-500">Scheduled Consultations vs Completed vs Enrolled</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-violet-700">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Converted
              </span>
            </div>
          </div>

          {/* SVG Line / Area Graph */}
          <div className="h-56 w-full pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Scheduled Line (Violet) */}
              <path
                d="M 20,130 C 100,100 180,120 260,70 C 340,50 420,90 500,40 L 580,30"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Completed Line (Emerald) */}
              <path
                d="M 20,150 C 100,130 180,140 260,95 C 340,80 420,110 500,65 L 580,55"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Converted Line (Indigo with Area) */}
              <path
                d="M 20,180 C 100,165 180,170 260,140 C 340,125 420,150 500,110 L 580,95 L 580,190 L 20,190 Z"
                fill="url(#violetGradient)"
              />
              <path
                d="M 20,180 C 100,165 180,170 260,140 C 340,125 420,150 500,110 L 580,95"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Week 5</span>
            </div>
          </div>
        </div>

        {/* Outcome Distribution (Donut Chart Simulation) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
              Outcome Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution across 175 completed calls</p>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Interested (52%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="52 48" strokeDashoffset="0" />
                {/* Follow-up Required (28%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="28 72" strokeDashoffset="-52" />
                {/* Not Interested (12%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeDasharray="12 88" strokeDashoffset="-80" />
                {/* No-show (8%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="8 92" strokeDashoffset="-92" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">52%</span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Interested</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Interested (52%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Follow-up (28%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Not Interested (12%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> No-Show (8%)</div>
          </div>
        </div>
      </div>

      {/* Row 2: Conversion Probability Histogram & Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Probability Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
              Conversion Probability Cohorts
            </h3>
            <p className="text-xs text-slate-500">Grouped by low, medium, and high purchase intent</p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">High Intent (70 - 100%)</span>
                <span className="text-slate-800">92 Leads (52.5%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "52.5%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Medium Intent (40 - 69%)</span>
                <span className="text-slate-800">54 Leads (30.8%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "30.8%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Low Intent (0 - 39%)</span>
                <span className="text-slate-800">29 Leads (16.7%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "16.7%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment and Mood Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
              Sentiment & Voice Mood Breakdown
            </h3>
            <p className="text-xs text-slate-500">Extracted from Zenclass S3 transcripts</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex h-7 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-emerald-500 hover:opacity-90 transition" style={{ width: "58%" }} title="Positive: 58%" />
              <div className="bg-slate-300 hover:opacity-90 transition" style={{ width: "24%" }} title="Neutral: 24%" />
              <div className="bg-amber-400 hover:opacity-90 transition" style={{ width: "12%" }} title="Hesitant / Mixed: 12%" />
              <div className="bg-rose-500 hover:opacity-90 transition" style={{ width: "6%" }} title="Frustrated: 6%" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive (58%)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Neutral (24%)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Hesitant / Mixed (12%)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Frustrated (6%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: BDA Leaderboard & Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base">BDA Performance Leaderboard</h3>
          <p className="text-xs text-slate-500">Ranked by consultations completed, follow-up agility, and conversion efficiency</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-4">BDA Representative</th>
                <th className="py-3 px-4">Calls Completed</th>
                <th className="py-3 px-4">Avg Duration</th>
                <th className="py-3 px-4">Follow-up SLA</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-6 text-right">Avg Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {bdaLeaderboard.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-6 font-bold text-violet-700">#{item.rank}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-4 px-4 font-mono">{item.calls}</td>
                  <td className="py-4 px-4 text-slate-600">{item.avgDuration}</td>
                  <td className="py-4 px-4 text-emerald-700 font-bold">{item.followUpRate}</td>
                  <td className="py-4 px-4 font-bold text-violet-700">{item.convRate}</td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">{item.avgProb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

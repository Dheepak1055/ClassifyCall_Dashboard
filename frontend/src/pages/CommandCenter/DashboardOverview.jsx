import React, { useState } from "react";
import StatCard from "../../components/ui/StatCard";
import StatusChip from "../../components/ui/StatusChip";
import ProbabilityMeter from "../../components/ui/ProbabilityMeter";
import Tooltip from "../../components/ui/Tooltip";

export default function DashboardOverview({
  calls = [],
  onScheduleClick,
  onSelectCall,
  onNavigateToLeads,
}) {
  const [selectedFunnelStage, setSelectedFunnelStage] = useState(null);

  // Compute realistic KPIs
  const scheduledTodayCount = calls.filter((c) => c.status === "scheduled").length || 4;
  const completedCount = calls.filter((c) => c.status === "completed").length || 18;
  const avgProb = 76; // e.g. 76% average probability across active leads
  const followUpsDue = 7;

  // Funnel Data
  const FUNNEL_STAGES = [
    { name: "New Lead", count: 480, rate: "100%", drop: "-22%" },
    { name: "Contacted", count: 374, rate: "78%", drop: "-42%" },
    { name: "Meeting Scheduled", count: 216, rate: "45%", drop: "-19%" },
    { name: "Call Completed", count: 175, rate: "36%", drop: "-38%" },
    { name: "Follow-up Active", count: 108, rate: "23%", drop: "-41%" },
    { name: "Converted", count: 64, rate: "13.3%", drop: "Final" },
  ];

  // Today's Calls timeline entries
  const todayCalls = calls.slice(0, 4);

  return (
    <div className="space-y-7 p-6 max-w-7xl mx-auto">
      {/* 1. Header with Greeting and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Good morning, Dheepak Ajith 👋
            </h1>
            <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              ● Online
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            BDA Command Center · You have <strong className="text-slate-800">{scheduledTodayCount} video consultations</strong> scheduled today on HCL GUVI Classify.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Disabled Instant Call CTA with Mandatory Tooltip */}
          <Tooltip text="Coming soon - Classify instant meeting integration pending" position="bottom">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-75 select-none"
            >
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              Start Instant Call
            </button>
          </Tooltip>

          <button
            onClick={onScheduleClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/25 active:scale-95 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            + Schedule Call
          </button>
        </div>
      </div>

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Calls Scheduled Today"
          value={scheduledTodayCount}
          trend="14.2%"
          trendPositive={true}
          subtitle="vs yesterday"
          sparklineData={[3, 4, 3, 5, 4, 6, 5, 6]}
          sparklineColor="#6366f1"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        />

        <StatCard
          title="Completed This Week"
          value={completedCount}
          trend="8.5%"
          trendPositive={true}
          subtitle="vs last week"
          sparklineData={[10, 14, 12, 17, 15, 20, 18, 22]}
          sparklineColor="#10b981"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        />

        <StatCard
          title="Avg. Conversion Probability"
          value={`${avgProb}%`}
          trend="5.4%"
          trendPositive={true}
          subtitle="high intent cohort"
          sparklineData={[65, 68, 70, 72, 71, 75, 74, 76]}
          sparklineColor="#8b5cf6"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        />

        <StatCard
          title="Follow-ups Due Today"
          value={followUpsDue}
          trend="3 pending"
          trendPositive={false}
          subtitle="require action"
          sparklineData={[8, 9, 7, 8, 6, 9, 8, 7]}
          sparklineColor="#f59e0b"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        />
      </div>

      {/* 3. Main Dashboard Grid: Today's Calls Timeline & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Today's Calls Timeline (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Today’s Video Consultations</h3>
                <p className="text-xs text-slate-500">Live & upcoming calls scheduled via Classify room codes</p>
              </div>
              <button
                onClick={onNavigateToLeads}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
              >
                View all scheduled →
              </button>
            </div>

            <div className="space-y-3">
              {todayCalls.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No video calls scheduled for today. Click "+ Schedule Call" to book a consultation.
                </div>
              ) : (
                todayCalls.map((call) => {
                  const isLive = call.status === "in_progress";
                  return (
                    <div
                      key={call.id}
                      onClick={() => onSelectCall && onSelectCall(call)}
                      className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 ${
                        isLive
                          ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-violet-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {call.lead_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{call.lead_name}</h4>
                            <span className="text-[11px] text-slate-400 font-medium">· Full Stack Bootcamp</span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>🕒 {new Date(call.scheduled_time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} IST</span>
                            <span>•</span>
                            <span>{call.lead_phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusChip status={call.status} size="sm" />
                        {isLive ? (
                          <a
                            href={call.classify?.host_join_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                          >
                            Join Meeting →
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCall && onSelectCall(call);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                          >
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Classify Room Server: <code className="text-slate-600">apiclassify.zenclass.in</code></span>
            <span className="text-violet-700 font-bold">Auto-recording: Enabled</span>
          </div>
        </div>

        {/* 4. Conversion Funnel (1 Column) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Conversion Funnel</h3>
              <p className="text-xs text-slate-500">Pipeline progression from lead inquiry to enrollment</p>
            </div>

            <div className="space-y-3">
              {FUNNEL_STAGES.map((stage, i) => {
                const widthPercent = Math.max(18, 100 - i * 16);
                return (
                  <div
                    key={stage.name}
                    onClick={() => setSelectedFunnelStage(stage.name)}
                    className="group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 group-hover:text-violet-700 transition">
                        {stage.name}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        <strong className="text-slate-800">{stage.count}</strong> ({stage.rate})
                      </span>
                    </div>
                    <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500 group-hover:from-violet-600 group-hover:to-indigo-700"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-violet-50 border border-violet-100 text-[11px] text-violet-900 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[9px] text-violet-700">Funnel Highlight</span>
            <p className="leading-snug">
              Calls completed after Classify video consultation show a <strong>+38% higher conversion probability</strong> than standard phone calls.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Recent Call Intelligence & Post-Call Insights List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Recent Post-Call Intelligence</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                AI Estimates
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automated transcripts, sentiment, and conversion probability generated upon Classify session close
            </p>
          </div>
          <button
            onClick={() => onSelectCall && onSelectCall(calls.find((c) => c.status === "completed") || calls[0])}
            className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            Launch 3-Column Workspace →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {calls
            .filter((c) => c.analysis?.status === "done" || c.status === "completed")
            .slice(0, 3)
            .map((call) => {
              const a = call.analysis || {};
              return (
                <div
                  key={call.id}
                  onClick={() => onSelectCall && onSelectCall(call)}
                  className="rounded-2xl p-4 border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-violet-300 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{call.lead_name}</h4>
                      <p className="text-[11px] text-slate-500">{call.lead_phone}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(a.outcome || "Interested").toUpperCase()}
                    </span>
                  </div>

                  {/* Probability Meter */}
                  <ProbabilityMeter value={a.conversion_probability || 84} showLabel={true} size="sm" />

                  {/* Summary & Voice Tone */}
                  <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                    "{a.summary || "Lead showed strong purchase intent for the Full Stack cohort, requesting EMI details."}"
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Mood: <strong className="text-slate-700 capitalize">{a.mood || "Positive"}</strong></span>
                    <span className="text-violet-700 font-bold hover:underline">View Transcript →</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

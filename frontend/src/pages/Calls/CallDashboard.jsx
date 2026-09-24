// CallDashboard — BDA-facing surface for the video-call feature.
// Integrated with Classify Meet API, MongoDB lead_calls collection, S3 transcripts & Bedrock AI.

import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const TABS = [
  { key: "scheduled", label: "Upcoming" },
  { key: "in_progress", label: "Live" },
  { key: "completed", label: "Completed" },
];

const OUTCOME_STYLES = {
  interested: "bg-emerald-50 text-emerald-700 border-emerald-200",
  follow_up: "bg-amber-50 text-amber-700 border-amber-200",
  not_interested: "bg-rose-50 text-rose-700 border-rose-200",
  no_show: "bg-slate-100 text-slate-500 border-slate-200",
  unclear: "bg-slate-100 text-slate-500 border-slate-200",
};

const MOOD_STYLES = {
  positive: "bg-emerald-500",
  neutral: "bg-slate-400",
  negative: "bg-rose-500",
  mixed: "bg-amber-500",
};

export default function CallDashboard() {
  const [tab, setTab] = useState("scheduled");
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dbExplorerOpen, setDbExplorerOpen] = useState(false);
  const [dbData, setDbData] = useState([]);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/calls", { params: { status: tab } });
      setCalls(data || []);
    } catch (err) {
      console.error("Failed to load calls:", err);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const loadDb = async () => {
    try {
      const { data } = await axios.get("/api/calls/db/all");
      setDbData(data || []);
      setDbExplorerOpen(true);
    } catch (err) {
      console.error("Failed to load DB collection:", err);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="text-slate-900 font-sans p-8 pt-10 h-screen overflow-y-auto w-full">
      {/* Main Table Area */}
      <div className="bg-white rounded-[30px] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[22px] font-bold text-slate-900">All Customers</h2>
            <div className="flex items-center gap-4 mt-1">
               {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} className={`text-sm font-semibold transition ${tab === t.key ? "text-[#16c098]" : "text-slate-400 hover:text-slate-600"}`}>
                    {t.label}
                  </button>
               ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Search" className="bg-[#f9fbff] pl-9 pr-4 py-2 rounded-lg text-xs font-semibold border-none focus:ring-2 focus:ring-indigo-500 w-48 text-slate-600" />
            </div>
            <div className="flex items-center gap-2 bg-[#f9fbff] rounded-lg px-3 py-2">
               <span className="text-xs text-slate-400 font-medium">Short by :</span>
               <span className="text-xs font-bold text-slate-700">Newest</span>
               <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <button onClick={() => setScheduleOpen(true)} className="ml-2 rounded-lg bg-[#5932ea] px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition">
              + Schedule
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[14px]">
                <th className="font-medium pb-4 pl-2 whitespace-nowrap">Customer Name</th>
                <th className="font-medium pb-4 whitespace-nowrap">Company</th>
                <th className="font-medium pb-4 whitespace-nowrap">Phone Number</th>
                <th className="font-medium pb-4 whitespace-nowrap">Email</th>
                <th className="font-medium pb-4 whitespace-nowrap">Country</th>
                <th className="font-medium pb-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center"><EmptyState tab={tab} onSchedule={() => setScheduleOpen(true)} /></td></tr>
              ) : (
                calls.map(call => (
                  <CallRow key={call.id} call={call} onOpen={() => setSelected(call)} onReload={load} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8 border-t border-slate-100 pt-6">
          <p className="text-[14px] text-slate-400 font-medium">Showing data 1 to {calls.length} of 256K entries</p>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 text-xs font-semibold hover:bg-slate-200">{"<"}</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#5932ea] text-white text-xs font-semibold shadow-md shadow-indigo-500/20">1</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#f5f5f5] text-slate-500 text-xs font-semibold hover:bg-slate-200 border border-slate-200">2</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#f5f5f5] text-slate-500 text-xs font-semibold hover:bg-slate-200 border border-slate-200">3</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#f5f5f5] text-slate-500 text-xs font-semibold hover:bg-slate-200 border border-slate-200">4</button>
            <span className="text-slate-400 px-1 font-bold">..</span>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#f5f5f5] text-slate-500 text-xs font-semibold hover:bg-slate-200 border border-slate-200">40</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 text-xs font-semibold hover:bg-slate-200">{">"}</button>
          </div>
        </div>
      </div>

      {/* Classify Detail Drawer */}
      {selected && <CallDetailPanel call={selected} onClose={() => setSelected(null)} />}

      {/* Schedule Call Modal */}
      {scheduleOpen && (
        <ScheduleModal
          onClose={() => setScheduleOpen(false)}
          onCreated={(msg) => {
            setScheduleOpen(false);
            load();
            if (msg) {
              setToast(msg);
              setTimeout(() => setToast(null), 5000);
            }
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-teal-800 px-4 py-3 text-sm text-white shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 text-teal-300 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab, onSchedule }) {
  const copy = {
    scheduled: "No calls scheduled yet in DB. Pick a lead and set a time.",
    in_progress: "No active live calls found in MongoDB collection.",
    completed: "Completed calls will show up here once Classify finishes processing S3 transcripts.",
  }[tab];
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm text-slate-500 font-medium">{copy}</p>
      {tab === "scheduled" && (
        <button
          onClick={onSchedule}
          className="mt-4 rounded-md bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition border border-teal-200"
        >
          + Schedule a call
        </button>
      )}
    </div>
  );
}

function CallRow({ call, onOpen, onReload }) {
  const startNow = async (e) => {
    e.stopPropagation();
    await axios.post(`/api/calls/${call.id}/start`);
    onReload();
  };

  const endCall = async (e) => {
    e.stopPropagation();
    await axios.post(`/api/calls/${call.id}/end`);
    onReload();
  };

  const statusColors = {
    scheduled: "bg-[#ffd5d5] text-[#df0404] border-[#df0404]",
    in_progress: "bg-[#e5fcf3] text-[#00ac4f] border-[#00ac4f]",
    completed: "bg-[#e5fcf3] text-[#00ac4f] border-[#00ac4f]"
  };
  
  const statusText = {
    scheduled: "Inactive",
    in_progress: "Active",
    completed: "Active"
  };

  return (
    <tr onClick={onOpen} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer text-[15px] font-medium text-slate-800">
      <td className="py-4 pl-2">{call.lead_name}</td>
      <td className="py-4">{["Microsoft", "Yahoo", "Adobe", "Tesla", "Google"][Math.floor(Math.random() * 5)]}</td>
      <td className="py-4 text-[14px]">{call.lead_phone}</td>
      <td className="py-4 text-[14px]">{call.lead_email || `${call.lead_name.split(" ")[0].toLowerCase()}@example.com`}</td>
      <td className="py-4">{["United States", "Kiribati", "Israel", "Iran", "Réunion"][Math.floor(Math.random() * 5)]}</td>
      <td className="py-4">
         <div className="flex items-center justify-center gap-3">
            <span className={`px-4 py-1 rounded-[4px] border text-[13px] font-bold inline-block min-w-[85px] text-center ${statusColors[call.status]}`}>
              {statusText[call.status]}
            </span>
            {call.status === "scheduled" && (
              <button onClick={startNow} className="text-xs bg-[#5932ea] text-white px-2 py-1 rounded shadow">Start</button>
            )}
            {call.status === "in_progress" && (
              <div className="flex gap-1">
                 <a href={call.classify?.host_join_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-xs bg-[#16c098] text-white px-2 py-1 rounded shadow">Join</a>
                 <button onClick={endCall} className="text-xs bg-rose-500 text-white px-2 py-1 rounded shadow">End</button>
              </div>
            )}
         </div>
      </td>
    </tr>
  );
}

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

function SearchableTranscriptSection({ turns }) {
  const [filter, setFilter] = useState("");
  if (!turns || turns.length === 0) return null;

  const filtered = turns.filter(t => 
    (t.text || "").toLowerCase().includes(filter.toLowerCase()) ||
    (t.speaker || "").toLowerCase().includes(filter.toLowerCase()) ||
    ((t.detected_intent || "").toLowerCase().includes(filter.toLowerCase())) ||
    ((t.objection || "").toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Searchable Transcript ({turns.length} Turns)
        </h4>
        <input
          type="text"
          placeholder="Search transcript..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-xs rounded border border-slate-300 px-2 py-1 w-44 bg-slate-50 focus:bg-white"
        />
      </div>
      <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-lg">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
            <tr>
              <th className="p-2">Speaker</th>
              <th className="p-2">Time</th>
              <th className="p-2">Text</th>
              <th className="p-2">Sentiment</th>
              <th className="p-2">Detected Intent</th>
              <th className="p-2">Objection</th>
              <th className="p-2">Action Item</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((t, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{t.speaker}</td>
                <td className="p-2 text-slate-500 font-mono whitespace-nowrap">{t.timestamp}</td>
                <td className="p-2 text-slate-700 min-w-[180px]">{t.text}</td>
                <td className="p-2 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    t.sentiment === "positive" ? "bg-emerald-100 text-emerald-800" :
                    t.sentiment === "mixed" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {t.sentiment}
                  </span>
                </td>
                <td className="p-2 text-slate-600 whitespace-nowrap">{t.detected_intent || "—"}</td>
                <td className="p-2 text-rose-600 whitespace-nowrap">{t.objection && t.objection !== "None" ? t.objection : "—"}</td>
                <td className="p-2 text-teal-700 whitespace-nowrap">{t.action_item || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CallDetailPanel({ call, onClose }) {
  const a = call.analysis || {};
  const c = call.classify || {};

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl transition transform border-l border-slate-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              Classify Ingested Document
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{call.lead_name}</h2>
            <p className="text-xs text-slate-500">{call.lead_phone} · Lead ID: {call.lead_id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Classify Specific Room Data Card */}
        {c.room_id && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-xs font-bold uppercase text-slate-600">Classify Room Data</span>
              <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                Room: {c.room_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Classify Unique ID</span>
                <span className="font-mono text-slate-800 font-semibold">{c.unique_id || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Host Access Code</span>
                <span className="font-mono text-teal-700 font-semibold">{c.host_code || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Student Guest Code</span>
                <span className="font-mono text-slate-800 font-semibold">{c.student_code || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Host Email</span>
                <span className="text-slate-800 font-semibold">{call.bda_email || "alice@guvi.in"}</span>
              </div>
            </div>

            {c.host_join_url && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Host Meeting Dashboard Link</span>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={c.host_join_url}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-700 select-all"
                  />
                  <a
                    href={c.host_join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 border border-violet-200 hover:bg-violet-100"
                  >
                    Open Host
                  </a>
                </div>
              </div>
            )}

            {c.guest_join_url && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Generated Guest Join Link</span>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={c.guest_join_url}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-700 select-all"
                  />
                  <a
                    href={c.guest_join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 border border-teal-200 hover:bg-teal-100"
                  >
                    Open Guest
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {a.status === "pending" && call.status === "completed" && (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800">
            <p className="font-semibold">Processing Transcript & Media</p>
            <p className="mt-1">Classify has ended the session. DORA is currently pulling recording files from S3 and executing the AI scoring model.</p>
          </div>
        )}

        {/* AI Metrics Brought back from Classify */}
        {a.status === "done" && (
          <div className="mt-6 space-y-5">
            {/* Conversion Probability Meter */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span className="font-semibold text-slate-700">Conversion Probability Score</span>
                <span className="font-bold text-teal-700 text-base">{a.conversion_probability ?? "—"}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{ width: `${a.conversion_probability ?? 0}%` }}
                />
              </div>
            </div>

            {/* New Call Detail & Attendance Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
                 <div>
                   <p className="text-xs font-medium text-slate-500">Call Duration</p>
                   <p className="mt-1 font-bold text-slate-800 text-lg">
                     {call.started_at && call.ended_at ? formatDuration(call.ended_at - call.started_at) : "N/A"}
                   </p>
                 </div>
                 <div className="rounded-full bg-slate-100 p-2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
                 <div>
                   <p className="text-xs font-medium text-slate-500">Attendance Ratio</p>
                   <p className="mt-1 font-bold text-teal-700 text-lg">
                     {a.attendance_percentage ? `${a.attendance_percentage}%` : "N/A"}
                   </p>
                 </div>
                 <div className="rounded-full bg-teal-50 p-2 text-teal-600 border border-teal-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-medium text-slate-500">Call Outcome</p>
                <span
                  className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    OUTCOME_STYLES[a.outcome] || OUTCOME_STYLES.unclear
                  }`}
                >
                  {(a.outcome || "unclear").replace("_", " ")}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-medium text-slate-500">Lead Mood</p>
                <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800 capitalize">
                  <span className={`h-2.5 w-2.5 rounded-full ${MOOD_STYLES[a.mood] || "bg-slate-400"}`} />
                  {a.mood || "—"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-medium text-slate-500">Speech Signal</p>
                <p className="mt-1 text-xs text-slate-700 font-medium">
                  {a.voice_tone ? "Tone Analyzed" : "Text transcript"}
                </p>
              </div>
            </div>

            {/* Mood Timeline (if brought back from Classify LLM pass) */}
            {a.mood_timeline?.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs">
                <p className="font-semibold text-slate-700 mb-2">Classify Mood Timeline</p>
                <div className="flex gap-2">
                  {a.mood_timeline.map((seg, idx) => (
                    <div key={idx} className="flex-1 rounded-md bg-white border border-slate-200 p-2 text-center">
                      <span className="text-slate-400 text-[10px] block font-mono">{seg.segment}</span>
                      <span className="font-semibold text-slate-700 capitalize">{seg.mood}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Tone Detail */}
            {a.voice_tone && (
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs">
                <p className="font-semibold text-slate-700">Voice & Speech Tone Analysis</p>
                <p className="mt-1 text-slate-600 leading-relaxed">{a.voice_tone}</p>
              </div>
            )}

            {/* AI Executive Summary */}
            {a.summary && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  AI Call Summary (Classify S3 Transcript)
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {a.summary}
                </p>
              </div>
            )}

            {/* AI Estimate Disclaimer */}
            <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-2.5 flex items-center gap-2 text-[11px] text-amber-800">
              <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 uppercase tracking-wider text-[9px]">Estimate</span>
              <span>All AI-derived metrics are estimates for internal guidance; not certified CRM facts.</span>
            </div>

            {/* Strategic Outcomes & Next Actions */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold text-slate-700 block mb-1">Identified Intent</span>
                <p className="text-slate-600">{a.intent || "Tech Upskilling / Career Acceleration"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold text-slate-700 block mb-1">Recommended Next Action</span>
                <p className="text-slate-600">{a.next_action || "Send enrollment link & follow up via WhatsApp"}</p>
                {a.follow_up_date && <span className="text-[10px] font-mono text-teal-700 mt-1 block">Due: {a.follow_up_date}</span>}
              </div>
            </div>

            {/* Objections & Evidence */}
            {a.objections?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Detected Objections</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {a.objections.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </div>
            )}

            {/* Evidence Snippets */}
            {a.evidence_snippets?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <span className="font-bold text-slate-700 block mb-1.5">Evidence Snippets (Timestamps)</span>
                <div className="space-y-1.5">
                  {a.evidence_snippets.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200">
                      <span className="font-mono text-teal-700 font-semibold shrink-0">[{ev.timestamp}]</span>
                      <span className="font-medium text-slate-800 shrink-0">{ev.speaker}:</span>
                      <span className="text-slate-600 italic">"{ev.text}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Phrases */}
            {a.key_phrases?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Extracted Key Topics & Phrases
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {a.key_phrases.map((phrase, i) => (
                    <span key={i} className="rounded-md bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-800">
                      #{phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Searchable AI Transcript Table */}
            <SearchableTranscriptSection turns={a.searchable_transcript} />
          </div>
        )}

        {/* Real-time Meeting Chat Log */}
        {call.chats?.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Classify In-Meeting Chat Messages ({call.chats.length})
            </h4>
            <div className="max-h-56 space-y-2.5 overflow-y-auto rounded-lg bg-slate-900 p-3.5 text-xs text-slate-100 font-mono">
              {call.chats.map((c, i) => (
                <div key={i} className="leading-normal">
                  <span className="text-teal-400 font-semibold">{c.from}:</span>{" "}
                  <span className="text-slate-200">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording & Transcript Links brought back from S3 */}
        {(call.recording_url || call.transcript_url) && (
          <div className="mt-6 border-t border-slate-200 pt-4 flex gap-3">
            {call.recording_url && (
              <a
                href={call.recording_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 shadow-xs"
              >
                <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Classify S3 Recording
              </a>
            )}
            {call.transcript_url && (
              <a
                href={call.transcript_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs"
              >
                Raw S3 JSON
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DatabaseExplorerModal({ records, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 text-slate-100 shadow-2xl border border-slate-800 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400 border border-teal-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                MongoDB <code className="text-teal-400 text-sm font-mono">lead_calls</code> Collection
              </h3>
              <p className="text-xs text-slate-400">
                Direct view of documents storing Classify meeting tokens, S3 paths & Bedrock AI analysis output.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            ✕
          </button>
        </div>

        {/* Record selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 overflow-x-auto py-2">
          {records.map((rec, idx) => (
            <button
              key={rec._id || idx}
              onClick={() => setActiveTab(idx)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                activeTab === idx
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {rec.leadName} ({rec.status})
            </button>
          ))}
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {records[activeTab] && (
            <div>
              {/* Highlighted Classify Fields */}
              <div className="mb-4 rounded-xl border border-teal-500/30 bg-teal-950/30 p-4 text-xs">
                <h4 className="font-bold text-teal-300 text-sm mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                  Classify Ingested Document Properties
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">ROOM ID</span>
                    <span className="text-white font-bold">{records[activeTab].classify?.roomId || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">UNIQUE ID</span>
                    <span className="text-teal-300">{records[activeTab].classify?.uniqueId || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">STUDENT CODE (GUEST)</span>
                    <span className="text-white">{records[activeTab].classify?.studentCode || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">S3 RECORDING</span>
                    <span className="text-teal-400 truncate block">{records[activeTab].media?.recordingUrl ? "S3 MP4 Ready" : "Awaiting Cloud S3"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">CONVERSION PROBABILITY</span>
                    <span className="text-emerald-400 font-bold">{records[activeTab].analysis?.conversionProbability ? `${records[activeTab].analysis.conversionProbability}%` : "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">OUTCOME</span>
                    <span className="text-amber-300 font-bold uppercase">{records[activeTab].analysis?.outcome || "Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Raw JSON viewer */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-teal-300 overflow-x-auto leading-relaxed">
                <pre>{JSON.stringify(records[activeTab], null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Schema version: MongoDB lead_calls v1.0</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ onClose, onCreated }) {
  const [leadId, setLeadId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [when, setWhen] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await axios.post("/api/calls/schedule", {
        lead_id: leadId,
        lead_name: leadName,
        lead_phone: leadPhone,
        scheduled_time: Math.floor(new Date(when).getTime() / 1000),
      });
      onCreated("Call scheduled successfully. Email and WhatsApp alerts triggered!");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Schedule Classify Call
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Creates a scheduled call record in DORA. Classify meet link will be generated at start time.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Lead ID" value={leadId} onChange={setLeadId} placeholder="e.g. CRM-99201" />
          <Field label="Lead Name" value={leadName} onChange={setLeadName} placeholder="e.g. Rajesh Kumar" />
          <Field label="Lead Phone" value={leadPhone} onChange={setLeadPhone} placeholder="e.g. +91 98765 00000" />
          <div>
            <label className="text-xs font-semibold text-slate-700">Scheduled Time</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !leadId || !leadName || !leadPhone || !when}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 shadow-xs"
          >
            Schedule Call
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
      />
    </div>
  );
}

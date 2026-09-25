import React, { useState, useEffect } from "react";
import StatusChip from "../../components/ui/StatusChip";
import ProbabilityMeter from "../../components/ui/ProbabilityMeter";
import Tooltip from "../../components/ui/Tooltip";

export default function CallIntelligenceWorkspace({
  call,
  onBack,
  onScheduleFollowUp,
}) {
  const [activeTab, setActiveTab] = useState("transcript"); // "transcript" | "chats"
  const [transcriptFilter, setTranscriptFilter] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  // Media Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45); // simulated 45s
  const [duration, setDuration] = useState(720); // 12 mins
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [taskCreated, setTaskCreated] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedStudent, setCopiedStudent] = useState(false);

  if (!call) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No call selected for intelligence analysis.</p>
        <button onClick={onBack} className="mt-3 text-xs font-bold text-violet-600 hover:underline">
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  const a = call.analysis || {};
  const c = call.classify || {};
  const media = call.media || {};

  const hostJoinUrl =
    c.host_join_url ||
    (c.room_id && c.host_code
      ? `https://classify.zenclass.in/meet/${c.room_id}?code=${c.host_code}&role=host`
      : `https://classify.zenclass.in/meet-dashboard-new?session=${c.unique_id || call.id}`);

  const studentJoinUrl =
    c.guest_join_url ||
    (c.room_id && c.student_code
      ? `https://classify.zenclass.in/meet/${c.room_id}?code=${c.student_code}&role=student`
      : `https://classify.zenclass.in/meet-dashboard-new?session=${c.unique_id || call.id}`);

  const isAnalyzed = Boolean(a && a.status === "done" && (a.summary || (a.searchable_transcript && a.searchable_transcript.length > 0)));

  // Formatted transcript turns (Only show when real analysis is present)
  const turns = isAnalyzed ? (a.searchable_transcript || []) : [];

  // In-call chats
  const chats = call.chats || call.media?.chats || [];

  // Seek player when transcript row is clicked
  const handleSeekFromRow = (timeStr) => {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      setCurrentTime(seconds);
      setIsPlaying(true);
    }
  };

  const filteredTurns = turns.filter((t) => {
    if (speakerFilter !== "all" && !t.speaker.toLowerCase().includes(speakerFilter.toLowerCase())) return false;
    if (sentimentFilter !== "all" && t.sentiment !== sentimentFilter) return false;
    if (transcriptFilter.trim()) {
      const q = transcriptFilter.toLowerCase();
      const matchText = t.text.toLowerCase().includes(q);
      const matchIntent = t.detected_intent?.toLowerCase().includes(q);
      const matchObjection = t.objection?.toLowerCase().includes(q);
      if (!matchText && !matchIntent && !matchObjection) return false;
    }
    return true;
  });

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          ← Back to All Consultations
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Classify Room ID:</span>
          <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {c.room_id || "room-cls-904"}
          </code>
        </div>
      </div>

      {/* 1. Top Summary Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Lead Information */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-violet-500/20">
              {call.lead_name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{call.lead_name}</h1>
                <StatusChip status={call.status} size="md" />
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Full Stack Web Dev
                </span>
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>📞 {call.lead_phone}</span>
                <span>•</span>
                <span>✉️ {call.lead_email || "lead@example.com"}</span>
                <span>•</span>
                <span>Owner: <strong>{call.bda_email && !call.bda_email.includes("dheepa.ajith@guvi.in") && !call.bda_email.includes("dheepak.ajith@hclguvi.com") ? call.bda_email : "dheepak.ajith@hclguvi.in"}</strong></span>
                <span>•</span>
                <span>Scheduled: <strong>{call.scheduled_time ? new Date(call.scheduled_time * 1000).toLocaleDateString() : "Today"}</strong></span>
              </p>
            </div>
          </div>

          {/* Conversion Probability & Score Gauge */}
          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span>Conversion Probability</span>
                <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${isAnalyzed ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-700"}`}>
                  {isAnalyzed ? "AI Estimate" : "Pending"}
                </span>
              </div>
              {isAnalyzed ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-violet-700 font-mono">
                      {a.conversion_probability || 88}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {a.confidence || 92}% Confidence
                    </span>
                  </div>
                  <div className="w-40">
                    <ProbabilityMeter value={a.conversion_probability || 88} showLabel={false} size="sm" />
                  </div>
                </>
              ) : (
                <div className="py-1">
                  <span className="text-sm font-semibold text-slate-500 italic">
                    ⏳ AI Analysis Pending
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 border-l border-slate-200 pl-4 flex flex-col justify-center min-w-[210px]">
              <a
                href={hostJoinUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 active:scale-95 transition flex items-center justify-center gap-1.5 text-center"
              >
                <span>Open Host Dashboard</span>
                <span>↗</span>
              </a>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hostJoinUrl);
                    setCopiedHost(true);
                    setTimeout(() => setCopiedHost(false), 3000);
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition text-center"
                  title="Copy Classify Host URL (meet-dashboard-new?session=...)"
                >
                  {copiedHost ? "Copied Host! ✓" : "Copy Host"}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(studentJoinUrl);
                    setCopiedStudent(true);
                    setTimeout(() => setCopiedStudent(false), 3000);
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition text-center"
                  title="Copy Student Guest Invite Link"
                >
                  {copiedStudent ? "Copied Student! ✓" : "Copy Student"}
                </button>
              </div>
              <button
                onClick={onScheduleFollowUp}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition text-center"
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three-Column Intelligence Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SECTION (3 Cols): Timeline, Recording Player, Attendance ================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Classify Room & Session Links */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Classify Room & Links
              </h3>
              <span className="text-[10px] font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded font-bold">
                {c.unique_id || call.id}
              </span>
            </div>

            {/* Host Dashboard Link */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                  Host Meeting Dashboard
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hostJoinUrl);
                    setCopiedHost(true);
                    setTimeout(() => setCopiedHost(false), 3000);
                  }}
                  className="font-bold text-violet-700 text-[10px] hover:underline"
                >
                  {copiedHost ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <input
                readOnly
                value={hostJoinUrl}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-mono text-slate-700 select-all"
              />
              <div className="pt-1">
                <a
                  href={hostJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] shadow-xs transition flex items-center justify-center gap-1"
                >
                  <span>Launch Host Dashboard</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Student Guest Invite Link */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Student Guest Invite
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(studentJoinUrl);
                    setCopiedStudent(true);
                    setTimeout(() => setCopiedStudent(false), 3000);
                  }}
                  className="font-bold text-emerald-700 text-[10px] hover:underline"
                >
                  {copiedStudent ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <input
                readOnly
                value={studentJoinUrl}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-mono text-slate-700 select-all"
              />
            </div>
          </div>

          {/* Milestone Timeline Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Meeting Lifecycle
            </h3>

            <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
              {[
                { title: "Room Created (Classify)", time: "14:00 IST", state: "done" },
                { title: "Host & Student Joined", time: "14:02 IST", state: "done" },
                { title: "Session Concluded", time: "14:24 IST", state: "done" },
                { title: "S3 Recording Uploaded", time: "14:25 IST", state: "done" },
                { title: "Zenclass Transcript Ready", time: "14:26 IST", state: "done" },
                { title: "AI Intelligence Ingested", time: "14:27 IST", state: "done" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 relative pl-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-2 top-1 border-2 border-white ring-2 ring-emerald-100" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">{item.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* S3 Recording Audio/Video Player */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Call Playback
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                S3 Secure MP4
              </span>
            </div>

            {/* Waveform / Visualizer Simulation */}
            <div className="h-16 bg-slate-900 rounded-2xl p-3 flex items-end gap-1 overflow-hidden relative group">
              {Array.from({ length: 32 }).map((_, idx) => {
                const height = Math.sin(idx * 0.4) * 20 + 24;
                const isPassed = (idx / 32) * duration <= currentTime;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full transition-all ${
                      isPassed ? "bg-violet-400" : "bg-slate-700"
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>

            {/* Player Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="w-full accent-violet-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-violet-500/20 active:scale-95 transition"
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  {[1, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        playbackSpeed === spd
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <a
                  href={media.recording_url || "https://s3.amazonaws.com/classify-recordings/call-104.mp4"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                  title="Download S3 Recording"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Attendance & Participation Summary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Attendance & Attention
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Host (Dheepak):</span>
                <span className="font-bold text-slate-800">22m (100% presence)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Student (Guest):</span>
                <span className="font-bold text-emerald-700">20m (91% attention)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CENTER SECTION (5 Cols): Searchable Transcript & Chats ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Header Tabs: Transcript vs Chats */}
          <div className="flex items-center justify-between px-5 pt-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`pb-3 text-xs font-bold transition border-b-2 ${
                  activeTab === "transcript"
                    ? "text-violet-600 border-violet-600"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                Transcript Breakdown ({turns.length})
              </button>
              <button
                onClick={() => setActiveTab("chats")}
                className={`pb-3 text-xs font-bold transition border-b-2 ${
                  activeTab === "chats"
                    ? "text-violet-600 border-violet-600"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                In-Meeting Chats ({chats.length})
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono pb-2">Sync: Enabled</span>
          </div>

          {activeTab === "transcript" ? (
            <div className="flex flex-col flex-1">
              {/* Transcript Search and Filter Controls */}
              <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Filter text, intent, objection..."
                  value={transcriptFilter}
                  onChange={(e) => setTranscriptFilter(e.target.value)}
                  className="col-span-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-violet-500"
                />
                <select
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  className="bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                >
                  <option value="all">All Speakers</option>
                  <option value="BDA">BDA (Host)</option>
                  <option value="Lead">Lead (Guest)</option>
                </select>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Interactive Sticky Transcript Table */}
              <div className="overflow-y-auto max-h-[580px] p-2 space-y-2">
                {filteredTurns.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No transcript rows matching filters.
                  </div>
                ) : (
                  filteredTurns.map((turn, idx) => {
                    const isBda = turn.speaker.toLowerCase().includes("bda");
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSeekFromRow(turn.timestamp)}
                        className="p-3 rounded-2xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/20 transition-all cursor-pointer space-y-1.5 group text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                isBda ? "bg-violet-100 text-violet-800" : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {turn.speaker}
                            </span>
                            <span className="font-mono text-slate-400 text-[10px] group-hover:text-violet-600 font-bold">
                              ▶ {turn.timestamp}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                turn.sentiment === "positive"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : turn.sentiment === "mixed"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {turn.sentiment}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-800 leading-relaxed font-medium">{turn.text}</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] border-t border-slate-50">
                          {turn.detected_intent && (
                            <span className="text-slate-500 font-medium">
                              Intent: <strong className="text-slate-700">{turn.detected_intent}</strong>
                            </span>
                          )}
                          {turn.objection && turn.objection !== "None" && (
                            <span className="text-rose-600 font-semibold bg-rose-50 px-1 rounded">
                              Objection: {turn.objection}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 overflow-y-auto max-h-[580px] space-y-3 text-xs">
              {chats.map((c, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-violet-700">{c.from}</span>
                    <span className="text-slate-400 font-mono">{c.ts}</span>
                  </div>
                  <p className="text-slate-800">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT SECTION (4 Cols): AI Intelligence Card & Next Best Action ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Call Intelligence Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  AI Call Intelligence
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                AI Estimate
              </span>
            </div>

            {/* Suggested Outcome & Voice Tone */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Suggested Outcome</span>
                <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block capitalize">
                  {isAnalyzed ? (a.outcome || "Interested") : "Pending Analysis"}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mood & Tone</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block capitalize">
                  {isAnalyzed ? (a.mood || "Positive") : "Pending Review"}
                </span>
              </div>
            </div>

            {/* Buying Signals */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Detected Buying Signals
              </span>
              {isAnalyzed ? (
                <div className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 text-emerald-900 space-y-1 text-xs">
                  <p className="font-semibold">✓ Inquired directly about EMI payment flexibility</p>
                  <p className="font-semibold">✓ Requested upcoming cohort syllabus PDF</p>
                  <p className="font-semibold">✓ Mentioned 100% commitment to career transition</p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 italic text-xs">
                  No buying signals detected yet. AI call processing in progress.
                </div>
              )}
            </div>

            {/* Key Objections */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Primary Objections
              </span>
              {isAnalyzed ? (
                <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 text-rose-900 text-xs">
                  <p className="font-semibold">⚠️ Time management with ongoing 9-to-6 employment.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Recommended mitigation: Emphasize weekend batch schedule and recorded class archive.</p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 italic text-xs">
                  No objections detected yet. AI call processing in progress.
                </div>
              )}
            </div>

            {/* Evidence Snippets Linked to Timestamps */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Evidence Snippets (Timestamps)
              </span>
              {isAnalyzed ? (
                <div className="space-y-1.5">
                  {[
                    { ts: "01:25", quote: "I really want to switch to tech and your placement record looks solid." },
                    { ts: "04:50", quote: "Could you send me the EMI breakdown? If it's under 5k a month, I'm ready." },
                  ].map((ev, i) => (
                    <div
                      key={i}
                      onClick={() => handleSeekFromRow(ev.ts)}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-violet-300 cursor-pointer transition text-[11px]"
                    >
                      <span className="font-mono text-violet-700 font-bold block mb-0.5">[{ev.ts}]</span>
                      <span className="text-slate-700 italic font-medium">"{ev.quote}"</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 italic text-xs">
                  No evidence snippets available yet.
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              * Note: Every metric in this card is an automated AI estimate for BDA guidance and must not be treated as official CRM facts.
            </div>
          </div>

          {/* BDA Speech & Approach Adherence Scorecard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  BDA Pitch & Speech Adherence
                </h3>
                <p className="text-[11px] text-slate-500">Evaluation against BDA sales & counseling protocol</p>
              </div>
              {isAnalyzed ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs font-mono">
                  {(a.bda_performance?.protocol_adherence_score || 92)}% Score
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                  Pending
                </span>
              )}
            </div>

            {isAnalyzed ? (
              <div className="space-y-4 text-xs">
                {/* Tone & Delivery Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Confidence & Tone</span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {a.bda_performance?.tone_analysis?.confidence || "High & Professional"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Talk : Listen Ratio</span>
                    <span className="font-extrabold text-violet-700 mt-0.5 block">
                      {a.bda_performance?.tone_analysis?.talk_to_listen_ratio || "42% BDA / 58% Lead"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Empathy Level</span>
                    <span className="font-extrabold text-emerald-700 mt-0.5 block">
                      {a.bda_performance?.tone_analysis?.empathy || "Excellent"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Speech Pacing</span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {a.bda_performance?.tone_analysis?.pacing || "Optimal (132 WPM)"}
                    </span>
                  </div>
                </div>

                {/* Approaches Checklist */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    BDA Approach Guidelines Checklist
                  </span>
                  <div className="space-y-2">
                    {(
                      a.bda_performance?.approaches_checklist || [
                        { approach: "Warm Greeting & Rapport Building", status: "followed", feedback: "Welcomed lead warmly and identified career background." },
                        { approach: "Active Listening & Needs Discovery", status: "followed", feedback: "Asked open questions and maintained 58% lead listening ratio." },
                        { approach: "Program Value Proposition", status: "followed", feedback: "Highlighted 1-on-1 mentorship, capstone projects & placement support." },
                        { approach: "Empathetic Objection Handling", status: "followed", feedback: "Addressed 9-to-6 work schedule concerns with weekend cohort option." },
                        { approach: "Financing & EMI Explanation", status: "followed", feedback: "Clearly presented 0% EMI installment breakdown." },
                        { approach: "Actionable Closing & Next Steps", status: "followed", feedback: "Agreed on follow-up timeline and syllabus PDF sharing." }
                      ]
                    ).map((item, idx) => {
                      const isFollowed = item.status === "followed";
                      const isNeedsWork = item.status === "needs_work";
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.approach}</span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                                isFollowed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isNeedsWork
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isFollowed ? "✓ Followed" : isNeedsWork ? "⚠️ Needs Attention" : "✗ Missed"}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[10px]">{item.feedback}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BDA Coaching Tips */}
                <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-200 text-violet-900 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] block text-violet-800">
                    💡 AI BDA Coaching Tips
                  </span>
                  {(
                    a.bda_performance?.coaching_recommendations || [
                      "Maintained ideal active listening ratio (58% candidate speak time).",
                      "Great empathy when addressing schedule conflicts.",
                      "Recommendation: Share syllabus preview link slightly earlier when buying intent is expressed."
                    ]
                  ).map((tip, idx) => (
                    <p key={idx} className="text-[10px] text-violet-950 font-medium">
                      • {tip}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 italic text-xs text-center">
                ⏳ BDA speech & protocol analysis pending call recording processing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

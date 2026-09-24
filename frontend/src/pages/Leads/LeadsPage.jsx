import React, { useState, useMemo } from "react";
import StatusChip from "../../components/ui/StatusChip";
import ProbabilityMeter from "../../components/ui/ProbabilityMeter";
import Tooltip from "../../components/ui/Tooltip";

export default function LeadsPage({
  calls = [],
  onScheduleClick,
  onSelectCall,
  onStartCall,
  onEndCall,
}) {
  const [tab, setTab] = useState("all"); // "all" | "scheduled" | "in_progress" | "completed" | "follow_up"
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [minProb, setMinProb] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [drawerLead, setDrawerLead] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filter Logic
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      // Tab filter
      if (tab === "scheduled" && c.status !== "scheduled") return false;
      if (tab === "in_progress" && c.status !== "in_progress") return false;
      if (tab === "completed" && c.status !== "completed") return false;
      if (tab === "follow_up" && c.analysis?.outcome !== "follow_up" && c.status !== "completed") return false;

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = c.lead_name?.toLowerCase().includes(query);
        const matchPhone = c.lead_phone?.includes(query);
        const matchEmail = c.lead_email?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }

      // Probability filter
      const prob = c.analysis?.conversion_probability ?? 50;
      if (prob < minProb) return false;

      return true;
    });
  }, [calls, tab, search, minProb]);

  // Pagination slice
  const paginatedCalls = filteredCalls.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredCalls.length / pageSize) || 1;

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(new Set(paginatedCalls.map((c) => c.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["Lead Name", "Company", "Phone", "Email", "Status", "Outcome", "Conversion Probability"];
    const rows = filteredCalls.map((c) => [
      `"${c.lead_name}"`,
      `"${c.company || "HCL Tech / Partner"}"`,
      `"${c.lead_phone}"`,
      `"${c.lead_email || ""}"`,
      `"${c.status}"`,
      `"${c.analysis?.outcome || "Pending"}"`,
      `"${c.analysis?.conversion_probability ?? "N/A"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classify_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leads & Video Consultations</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time lead registry integrated with Classify room provisioning and AI transcript evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>

          {/* Disabled Instant Call CTA with Mandatory Tooltip */}
          <Tooltip text="Coming soon - Classify instant meeting integration pending" position="bottom">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-75"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              Instant Call
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

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
          {[
            { id: "all", label: "All Leads", count: calls.length },
            { id: "scheduled", label: "Upcoming Consultations", count: calls.filter((c) => c.status === "scheduled").length },
            { id: "in_progress", label: "Live Now", count: calls.filter((c) => c.status === "in_progress").length },
            { id: "completed", label: "Completed Calls", count: calls.filter((c) => c.status === "completed").length },
            { id: "follow_up", label: "Needs Follow-up", count: 4 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`px-4 py-3 text-xs font-bold transition-all relative shrink-0 flex items-center gap-2 ${
                tab === t.id ? "text-violet-600" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  tab === t.id ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.count}
              </span>
              {tab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search leads, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white px-3 py-2 pl-8 rounded-xl text-xs font-medium border border-slate-200 text-slate-800 focus:border-violet-500"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-700"
          >
            <option value="all">All Programs (Full Stack, DS, AI)</option>
            <option value="fs">Full Stack Web Development</option>
            <option value="ds">Data Science & Analytics</option>
            <option value="ai">AI & Machine Learning</option>
            <option value="cloud">Cloud Computing & DevOps</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-700"
          >
            <option value="all">All Locations</option>
            <option value="chennai">Chennai</option>
            <option value="bengaluru">Bengaluru</option>
            <option value="hyderabad">Hyderabad</option>
            <option value="remote">Pan-India (Remote)</option>
          </select>

          {/* Min Conversion Probability */}
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] font-semibold">Min Prob: <strong className="text-slate-800">{minProb}%</strong></span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minProb}
              onChange={(e) => setMinProb(Number(e.target.value))}
              className="w-24 accent-violet-600"
            />
          </div>

          {/* Bulk Selection Summary or Clear */}
          <div className="flex items-center justify-end gap-2 text-xs">
            {selectedLeads.size > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-bold border border-violet-200">
                {selectedLeads.size} selected
              </span>
            ) : (
              <button
                onClick={() => {
                  setSearch("");
                  setMinProb(0);
                  setProductFilter("all");
                  setLocationFilter("all");
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 pl-6 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === paginatedCalls.length && paginatedCalls.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th className="py-3.5 px-3">Lead Name</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Program</th>
                <th className="py-3.5 px-3">Scheduled At (IST)</th>
                <th className="py-3.5 px-3">Call Status</th>
                <th className="py-3.5 px-3">Outcome</th>
                <th className="py-3.5 px-3 min-w-[140px]">Conversion Prob.</th>
                <th className="py-3.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No leads found in this view</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or schedule a new consultation.</p>
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => {
                  const isChecked = selectedLeads.has(call.id);
                  const a = call.analysis || {};
                  return (
                    <tr
                      key={call.id}
                      onClick={() => setDrawerLead(call)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isChecked ? "bg-violet-50/30" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(call.id)}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>

                      {/* Lead Name with Avatar */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {call.lead_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{call.lead_name}</span>
                            <span className="text-[10px] text-slate-400">ID: {call.lead_id || call.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-3 font-mono text-[11px] text-slate-600">
                        <div>{call.lead_phone}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{call.lead_email}</div>
                      </td>

                      {/* Program */}
                      <td className="py-4 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          Full Stack Web Dev
                        </span>
                      </td>

                      {/* Scheduled At */}
                      <td className="py-4 px-3 text-slate-600 text-[11px]">
                        {call.scheduled_time
                          ? new Date(call.scheduled_time * 1000).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Immediate"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <StatusChip status={call.status} size="sm" />
                      </td>

                      {/* Outcome */}
                      <td className="py-4 px-3">
                        {a.outcome ? (
                          <span className="font-semibold capitalize text-[11px] text-slate-700">
                            {a.outcome.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px]">—</span>
                        )}
                      </td>

                      {/* Conversion Probability */}
                      <td className="py-4 px-3">
                        <ProbabilityMeter value={a.conversion_probability} compact={true} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {call.status === "in_progress" ? (
                          <a
                            href={call.classify?.host_join_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                          >
                            Join
                          </a>
                        ) : call.status === "scheduled" ? (
                          <button
                            onClick={() => onStartCall && onStartCall(call.id)}
                            className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] shadow-xs"
                          >
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectCall && onSelectCall(call)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                          >
                            Insights
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination & Result Count */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
          <p>
            Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
            <strong>{Math.min(page * pageSize, filteredCalls.length)}</strong> of{" "}
            <strong>{filteredCalls.length}</strong> leads
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-semibold"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  page === i + 1 ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out Lead History Drawer */}
      {drawerLead && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in"
          onClick={() => setDrawerLead(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto space-y-6"
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                  Lead Profile & History
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">{drawerLead.lead_name}</h3>
                <p className="text-xs text-slate-500">{drawerLead.lead_phone} · {drawerLead.lead_email}</p>
              </div>
              <button onClick={() => setDrawerLead(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onSelectCall && onSelectCall(drawerLead);
                  setDrawerLead(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-center shadow-xs"
              >
                Open Full Insights →
              </button>
              <button
                onClick={() => {
                  onScheduleClick();
                  setDrawerLead(null);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-center"
              >
                Schedule Follow-up
              </button>
            </div>

            {/* Classify Meeting Links */}
            {drawerLead.classify && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Classify Meeting Links
                </span>

                {/* Host Join Link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                      Host Dashboard Link (BDA Admin)
                    </span>
                    <a
                      href={drawerLead.classify.host_join_url || `https://classify.zenclass.in/meet-dashboard-new?session=${drawerLead.classify.unique_id || drawerLead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-violet-700 hover:underline"
                    >
                      Open Host Dashboard ↗
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={drawerLead.classify.host_join_url || `https://classify.zenclass.in/meet-dashboard-new?session=${drawerLead.classify.unique_id || drawerLead.id}`}
                      className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] text-slate-700 select-all"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(drawerLead.classify.host_join_url || `https://classify.zenclass.in/meet-dashboard-new?session=${drawerLead.classify.unique_id || drawerLead.id}`)}
                      className="px-2.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg font-bold text-[10px] hover:bg-violet-100 shrink-0"
                    >
                      Copy Host
                    </button>
                  </div>
                </div>

                {/* Student Guest Link */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Student Guest Invite Link
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={drawerLead.classify.guest_join_url}
                      className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] text-slate-700 select-all"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(drawerLead.classify.guest_join_url)}
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] hover:bg-emerald-100 shrink-0"
                    >
                      Copy Student
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Call Records (Last 3 calls) */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Historical Interactions</h4>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Classify Video Consultation</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Completed</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Duration: 22m · S3 recording & AI score (84%) processed</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Lead Call API Intake</span>
                    <span className="text-[10px] text-slate-500 font-semibold">CRM Ingested</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Connected with BDA Dheepak · Course interest logged</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

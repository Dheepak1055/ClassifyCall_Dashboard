import React, { useState } from "react";
import Tooltip from "./ui/Tooltip";

export default function TopBar({
  currentPage = "Dashboard",
  onScheduleClick,
  onSearchSelect,
  leads = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const filteredLeads = searchQuery.trim()
    ? leads.filter(
        (l) =>
          l.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.lead_phone?.includes(searchQuery) ||
          l.lead_email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">Classify Video CRM</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800 text-sm tracking-tight">{currentPage}</span>
          <span className="hidden sm:inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-100">
            BDA Workspace
          </span>
        </div>

        {/* Center: Global Lead Search */}
        <div className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search leads by name, phone, or email (Press '/' to focus)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-slate-50 pl-9 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-slate-800 placeholder-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Autocomplete Dropdown */}
          {searchOpen && searchQuery && (
            <div
              className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs max-h-64 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="p-2 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-100">
                Matching Leads ({filteredLeads.length})
              </div>
              {filteredLeads.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No leads found matching "{searchQuery}"</div>
              ) : (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect(lead);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{lead.lead_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {lead.lead_phone} · {lead.lead_email}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                      View →
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Disabled Instant Call CTA with Mandatory Tooltip */}
          <Tooltip text="Coming soon - Classify instant meeting integration pending" position="bottom">
            <button
              disabled
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-75 select-none"
              aria-disabled="true"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Instant Call</span>
              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-200 text-slate-500 font-bold">
                Soon
              </span>
            </button>
          </Tooltip>

          {/* Primary + Schedule Call Button */}
          <button
            onClick={onScheduleClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 active:scale-95 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Call
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                  <span>Notifications</span>
                  <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">2 New</span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800">Priya Nair consultation completed</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">S3 recording & AI score (88%) ready</p>
                    <span className="text-[10px] text-slate-400 block mt-1">10 mins ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800">Upcoming Call with Aarav Sharma</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Starts in 30 minutes on Classify</p>
                    <span className="text-[10px] text-slate-400 block mt-1">25 mins ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BDA Avatar & Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              DA
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-800">Dheepak Ajith</p>
              <p className="text-[10px] text-slate-400 font-medium">Internal GUVI Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

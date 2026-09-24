import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout({
  children,
  currentTab = "dashboard",
  onTabChange,
  onScheduleClick,
  leads = [],
  onSearchSelect,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const tabTitles = {
    dashboard: "BDA Command Center",
    leads: "Lead Management",
    scheduled: "Scheduled Video Calls",
    insights: "Call Intelligence Workspace",
    recordings: "Call Recordings & Transcripts",
    analytics: "Conversion & Performance Analytics",
    settings: "Workspace Settings",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex text-slate-900">
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <TopBar
          currentPage={tabTitles[currentTab] || "Command Center"}
          onScheduleClick={onScheduleClick}
          leads={leads}
          onSearchSelect={onSearchSelect}
        />
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Layout from "./components/Layout";
import DashboardOverview from "./pages/CommandCenter/DashboardOverview";
import LeadsPage from "./pages/Leads/LeadsPage";
import CallIntelligenceWorkspace from "./pages/Calls/CallIntelligenceWorkspace";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import ScheduleModal from "./components/ScheduleModal";

// Realistic Seed Data in case backend connection is loading or initializing
const DEFAULT_SEED_CALLS = [
  {
    id: "call-101",
    org_id: "dheepak.ajith@hclguvi.in",
    lead_id: "lead-8821",
    lead_name: "Aarav Sharma",
    company: "Infosys",
    lead_phone: "+91 98765 43210",
    lead_email: "aarav.sharma@example.com",
    bda_id: "bda-admin-101",
    bda_email: "dheepak.ajith@hclguvi.in",
    call_mode: "scheduled",
    status: "scheduled",
    lifecycle_state: "meeting_created",
    scheduled_time: Math.floor(Date.now() / 1000) + 3600,
    started_at: null,
    ended_at: null,
    classify: {
      unique_id: "08320032-aa91-4657-9230-d535e3ac92a9",
      room_id: "6ab4c555c42bb32b75d3107b",
      label: "Aarav Sharma - BDA consultation",
      thumbnail: "Default",
      host_join_url: "https://classify.zenclass.in/meet-dashboard-new?session=08320032-aa91-4657-9230-d535e3ac92a9",
      guest_join_url: "https://classify.zenclass.in/meet/6ab4c555c42bb32b75d3107b?code=dgm-ebls-cur&role=student",
      host_code: "nva-nnyi-rhi",
      student_code: "dgm-ebls-cur",
    },
    analysis: {
      status: "pending",
      outcome: null,
      conversion_probability: 72,
      confidence: 85,
      attendance_percentage: 0,
      mood: "neutral",
      is_estimate: true,
    },
    created_at: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: "call-104",
    org_id: "dheepak.ajith@hclguvi.in",
    lead_id: "crm-lead-97654",
    lead_name: "Priya Nair",
    company: "Wipro Technologies",
    lead_phone: "+91 97654 32109",
    lead_email: "priya.nair@example.com",
    bda_id: "bda-admin-101",
    bda_email: "dheepak.ajith@hclguvi.in",
    call_mode: "scheduled",
    status: "completed",
    lifecycle_state: "analysis_ready",
    scheduled_time: Math.floor(Date.now() / 1000) - 7200,
    started_at: Math.floor(Date.now() / 1000) - 7200,
    ended_at: Math.floor(Date.now() / 1000) - 5880,
    classify: {
      unique_id: "cls-uuid-904128",
      room_id: "room-p904",
      label: "Priya Nair - BDA consultation",
      thumbnail: "https://classifyprod.s3.amazonaws.com/thumbnails/room-p904.jpg",
      host_join_url: "https://classify.zenclass.in/meet-dashboard-new?session=cls-uuid-904128",
      guest_join_url: "https://classify.zenclass.in/meet/room-p904?code=guest-code-104&role=student",
      host_code: "host-code-104",
      student_code: "guest-code-104",
    },
    media: {
      recording_url: "http://localhost:4000/static/sample_consultation.wav",
      transcript_url: null,
    },
    analysis: {
      status: "done",
      outcome: "interested",
      conversion_probability: 88,
      confidence: 92,
      attendance_percentage: 85,
      mood: "positive",
      summary: "Lead demonstrated high purchase intent for Full Stack Web Development. Inquired in detail about no-cost EMI options, cohort timings, and live placement support.",
      intent: "Career transition to Tech / Full Stack Engineering",
      objections: ["Worried about managing live classes alongside current full-time employment schedule"],
      next_action: "Share syllabus PDF and EMI payment link via WhatsApp; follow up on Friday",
      follow_up_date: "2026-09-26",
      key_phrases: ["Full Stack Web Dev", "EMI installment options", "Career placement support", "Weekend batch flexibility"],
      is_estimate: true,
    },
    created_at: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: "call-105",
    org_id: "dheepak.ajith@hclguvi.in",
    lead_id: "lead-4412",
    lead_name: "Rohan Gupta",
    company: "Tata Consultancy Services",
    lead_phone: "+91 91234 56789",
    lead_email: "rohan.g@example.com",
    bda_id: "bda-admin-101",
    bda_email: "dheepak.ajith@hclguvi.in",
    call_mode: "scheduled",
    status: "in_progress",
    lifecycle_state: "in_progress",
    scheduled_time: Math.floor(Date.now() / 1000) - 300,
    started_at: Math.floor(Date.now() / 1000) - 300,
    ended_at: null,
    classify: {
      unique_id: "cls-rohan-552",
      room_id: "room-rohan-552",
      label: "Rohan Gupta - BDA consultation",
      thumbnail: "https://classifyprod.s3.amazonaws.com/thumbnails/room-rohan.jpg",
      host_join_url: "https://classify.zenclass.in/meet-dashboard-new?session=cls-rohan-552",
      guest_join_url: "https://classify.zenclass.in/meet/room-rohan-552?code=guest-552&role=student",
      host_code: "host-552",
      student_code: "guest-552",
    },
    analysis: {
      status: "pending",
      conversion_probability: 79,
      is_estimate: true,
    },
    created_at: Math.floor(Date.now() / 1000) - 1800,
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [calls, setCalls] = useState(DEFAULT_SEED_CALLS);
  const [selectedCall, setSelectedCall] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preselectedLead, setPreselectedLead] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch real calls from backend
  const loadCalls = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/calls");
      if (Array.isArray(data) && data.length > 0) {
        setCalls(data);
        if (!selectedCall) {
          const completedOne = data.find((c) => c.status === "completed") || data[0];
          setSelectedCall(completedOne);
        }
      }
    } catch (err) {
      console.warn("Using offline simulated leads pool:", err.message);
    }
  }, [selectedCall]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleStartCall = async (callId) => {
    try {
      await axios.post(`/api/calls/${callId}/start`);
      showToast("Classify meeting room started! Host and guest join links active.");
      loadCalls();
    } catch (err) {
      console.error("Start call failed:", err);
      showToast("Failed to start call. Check Classify credentials.");
    }
  };

  const handleEndCall = async (callId) => {
    try {
      await axios.post(`/api/calls/${callId}/end`);
      showToast("Call ended. Ingesting recordings & running AI scoring model...");
      loadCalls();
    } catch (err) {
      console.error("End call failed:", err);
    }
  };

  const handleOpenScheduleForLead = (lead) => {
    setPreselectedLead(lead);
    setScheduleModalOpen(true);
  };

  return (
    <Layout
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      onScheduleClick={() => {
        setPreselectedLead(null);
        setScheduleModalOpen(true);
      }}
      leads={calls}
      onSearchSelect={(lead) => {
        setSelectedCall(lead);
        setCurrentTab("insights");
      }}
    >
      {/* Tab: Dashboard (BDA Command Center) */}
      {currentTab === "dashboard" && (
        <DashboardOverview
          calls={calls}
          onScheduleClick={() => setScheduleModalOpen(true)}
          onSelectCall={(call) => {
            setSelectedCall(call);
            setCurrentTab("insights");
          }}
          onNavigateToLeads={() => setCurrentTab("leads")}
        />
      )}

      {/* Tab: Leads */}
      {currentTab === "leads" && (
        <LeadsPage
          calls={calls}
          onScheduleClick={() => setScheduleModalOpen(true)}
          onSelectCall={(call) => {
            setSelectedCall(call);
            setCurrentTab("insights");
          }}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
        />
      )}

      {/* Tab: Scheduled Calls */}
      {currentTab === "scheduled" && (
        <LeadsPage
          calls={calls.filter((c) => c.status === "scheduled")}
          onScheduleClick={() => setScheduleModalOpen(true)}
          onSelectCall={(call) => {
            setSelectedCall(call);
            setCurrentTab("insights");
          }}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
        />
      )}

      {/* Tab: Call Insights / 3-Column Intelligence Workspace */}
      {currentTab === "insights" && (
        <CallIntelligenceWorkspace
          call={selectedCall || calls[0]}
          onBack={() => setCurrentTab("dashboard")}
          onScheduleFollowUp={() => handleOpenScheduleForLead(selectedCall)}
        />
      )}

      {/* Tab: Recordings */}
      {currentTab === "recordings" && (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">S3 Recordings & Transcripts</h1>
            <p className="text-xs text-slate-500 mt-1">Browse all media and Zenclass transcript documents saved from completed calls.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {calls.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{c.lead_name}</h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">MP4 Ready</span>
                </div>
                <p className="text-xs text-slate-500">Room: {c.classify?.room_id || "room-p904"} · 22 mins</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedCall(c);
                      setCurrentTab("insights");
                    }}
                    className="text-violet-600 font-bold hover:underline"
                  >
                    Open Intelligence →
                  </button>
                  {c.media?.recording_url ? (
                    <a
                      href={c.media.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Download S3
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">S3 Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Analytics */}
      {currentTab === "analytics" && <AnalyticsPage />}

      {/* Tab: Settings */}
      {currentTab === "settings" && (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h1 className="text-xl font-extrabold text-slate-900">Workspace Settings</h1>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Classify Integration Endpoint</span>
                <code className="text-violet-700 font-mono text-[11px]">https://apiclassify.zenclass.in</code>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Authenticated Admin Account</span>
                <p className="text-slate-800 font-mono">dheepak.ajith@hclguvi.in (Locked)</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Instant Call Release State</span>
                <p className="text-slate-600">
                  Instant calls are disabled in current release pending Classify instant meeting endpoint stabilization. Only scheduled consultations are active.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setPreselectedLead(null);
        }}
        preselectedLead={preselectedLead}
        onCreated={(msg) => {
          showToast(msg);
          loadCalls();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3 text-xs font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
          <span className="text-emerald-400 text-sm">✓</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </Layout>
  );
}

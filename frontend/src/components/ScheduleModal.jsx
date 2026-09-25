import React, { useState } from "react";
import Tooltip from "./ui/Tooltip";
import axios from "axios";

export default function ScheduleModal({ isOpen, onClose, onCreated, preselectedLead }) {
  const [step, setStep] = useState("form"); // "form" | "review" | "confirmed"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [leadName, setLeadName] = useState(preselectedLead?.lead_name || "");
  const [leadPhone, setLeadPhone] = useState(preselectedLead?.lead_phone || "");
  const [leadEmail, setLeadEmail] = useState(preselectedLead?.lead_email || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("14:30");
  const [duration, setDuration] = useState("30");
  const [callType, setCallType] = useState("Curriculum Consultation");
  const [agenda, setAgenda] = useState("Full Stack Web Development - Career Roadmap & EMI Breakdown");
  const [notes, setNotes] = useState("");

  // Confirmed Meeting Details
  const [confirmedCall, setConfirmedCall] = useState(null);
  const [copiedGuest, setCopiedGuest] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);

  if (!isOpen) return null;

  const handleReview = (e) => {
    e.preventDefault();
    if (!leadName.trim()) {
      setError("Please provide the lead's full name");
      return;
    }
    if (!leadPhone.trim()) {
      setError("Please provide a valid phone number");
      return;
    }
    setError(null);
    setStep("review");
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      const scheduledTimestamp = Math.floor(scheduledDateTime.getTime() / 1000);

      const payload = {
        lead_id: preselectedLead?.id || `lead-${Date.now().toString().slice(-5)}`,
        lead_name: leadName.trim(),
        lead_phone: leadPhone.trim(),
        lead_email: leadEmail.trim() || `${leadName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        scheduled_time: scheduledTimestamp,
      };

      const { data } = await axios.post("/api/calls/schedule", payload);
      setConfirmedCall(data);
      setStep("confirmed");
      if (onCreated) onCreated("Call successfully scheduled in HCL GUVI Classify!");
    } catch (err) {
      console.error("Failed to schedule call:", err);
      setError(err.response?.data?.detail || "Could not schedule call. Please verify inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const hostJoinUrl =
    confirmedCall?.classify?.host_join_url ||
    (confirmedCall?.classify?.room_id && confirmedCall?.classify?.host_code
      ? `https://classify.zenclass.in/meet/${confirmedCall.classify.room_id}?code=${confirmedCall.classify.host_code}&role=host`
      : `https://classify.zenclass.in/meet-dashboard-new?session=${confirmedCall?.classify?.unique_id || confirmedCall?.id || "cls-room"}`);

  const studentJoinUrl =
    confirmedCall?.classify?.guest_join_url ||
    (confirmedCall?.classify?.room_id && confirmedCall?.classify?.student_code
      ? `https://classify.zenclass.in/meet/${confirmedCall.classify.room_id}?code=${confirmedCall.classify.student_code}&role=student`
      : `https://classify.zenclass.in/meet-dashboard-new?session=${confirmedCall?.classify?.unique_id || confirmedCall?.id || "cls-room"}`);

  const copyHostLink = () => {
    navigator.clipboard.writeText(hostJoinUrl);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 3000);
  };

  const copyGuestLink = () => {
    navigator.clipboard.writeText(studentJoinUrl);
    setCopiedGuest(true);
    setTimeout(() => setCopiedGuest(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
              📅
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Schedule Lead Consultation</h3>
              <p className="text-[11px] text-slate-500 font-medium">Classify Video Room · Asia/Kolkata (IST)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {step === "form" && (
            <form onSubmit={handleReview} className="space-y-4 text-xs">
              {/* Internal BDA Host (Locked) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">Internal Admin Host (Classify)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">Locked</span>
                </div>
                <p className="font-semibold text-slate-800 text-xs">Dheepak Ajith · <code className="font-mono text-violet-700">dheepak.ajith@hclguvi.in</code></p>
                <p className="text-[10px] text-slate-400">Classify security policy requires internal GUVI admin credentials as primary host.</p>
              </div>

              {/* Lead Details */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Lead / Student Participant
                </label>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Ananya Sen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Lead Email (Guest Code)</label>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="lead@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time & Timezone */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 text-slate-800"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-slate-600 font-medium mb-1">Time (IST)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 text-slate-800"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-slate-600 font-medium mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 text-slate-800 bg-white"
                  >
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                  </select>
                </div>
              </div>

              {/* Consultation Type & Agenda */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Call Type</label>
                  <select
                    value={callType}
                    onChange={(e) => setCallType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 text-slate-800 bg-white"
                  >
                    <option value="Curriculum Consultation">Curriculum & Placement Consultation</option>
                    <option value="Admissions Follow-up">Admissions & Scholarship Follow-up</option>
                    <option value="Career Transition Counseling">Career Transition Counseling</option>
                    <option value="Technical Demo">Course Platform & Coding Playground Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Agenda & Goals</label>
                  <input
                    type="text"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="Brief agenda for this consultation"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-violet-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Internal Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Candidate background, current CTC, or course preference..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-normal focus:border-violet-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {/* Disabled Instant Call CTA with Mandatory Tooltip */}
                <Tooltip text="Coming soon - Classify instant meeting integration pending" position="top">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-75"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                    Start Instant Call
                  </button>
                </Tooltip>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 transition active:scale-95"
                  >
                    Review Schedule →
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === "review" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Schedule Summary</span>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">LEAD NAME</span>
                    <span className="font-bold text-slate-900 text-sm">{leadName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CONTACT</span>
                    <span className="font-medium text-slate-800">{leadPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">SCHEDULED TIME (IST)</span>
                    <span className="font-bold text-violet-900">{date} at {time} ({duration} mins)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CONSULTATION TYPE</span>
                    <span className="font-semibold text-slate-800">{callType}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-violet-100/60">
                  <span className="text-[10px] text-slate-400 block">HOST & PARTICIPANT SPECIFICATION</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong>Host:</strong> dheepak.ajith@hclguvi.in (Internal Admin) <br />
                    <strong>Guest:</strong> {leadEmail || "Lead Phone Contact"} (Student role)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmSubmit}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/25 active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? "Booking on Classify..." : "Confirm & Create Meeting"}
                </button>
              </div>
            </div>
          )}

          {step === "confirmed" && confirmedCall && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mx-auto shadow-sm">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Call Confirmed & Room Provisioned!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled for <strong>{date} at {time} IST</strong> with <strong>{leadName}</strong>.
                </p>
              </div>

              {/* 1. Host Meeting Dashboard Link (Internal Admin) */}
              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    <span className="font-bold text-slate-800 text-xs">Host Meeting Dashboard Link</span>
                    <span className="text-[10px] bg-violet-200/70 text-violet-800 font-bold px-1.5 py-0.5 rounded">
                      BDA Host
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyHostLink}
                      className="text-[11px] font-bold text-violet-700 hover:text-violet-900 hover:underline"
                    >
                      {copiedHost ? "Copied! ✓" : "Copy Link"}
                    </button>
                    <a
                      href={hostJoinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1 rounded-lg shadow-xs transition"
                    >
                      Join as Host →
                    </a>
                  </div>
                </div>
                <input
                  readOnly
                  value={hostJoinUrl}
                  className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-violet-200 font-mono text-[11px] text-slate-800 select-all"
                />
                <p className="text-[10px] text-slate-500">
                  Internal BDA link to host, manage participants, and control recording in Classify: <code className="text-violet-700 font-mono">https://classify.zenclass.in/meet-dashboard-new?session=...</code>
                </p>
              </div>

              {/* 2. Student Guest Invite Link (Lead) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-700 text-xs">Student Guest Invite Link</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Lead Guest
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyGuestLink}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    {copiedGuest ? "Copied! ✓" : "Copy Link"}
                  </button>
                </div>
                <input
                  readOnly
                  value={studentJoinUrl}
                  className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] text-slate-700 select-all"
                />
                <p className="text-[10px] text-slate-400">
                  Share this link with {leadName}. The guest will join with the student role without needing GUVI admin credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

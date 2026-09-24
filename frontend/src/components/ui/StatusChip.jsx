import React from "react";

export default function StatusChip({ status, size = "md", pulse = false }) {
  const norm = (status || "").toLowerCase().replace(/[\s-]/g, "_");

  const config = {
    scheduled: {
      label: "Scheduled",
      classes: "bg-violet-50 text-violet-700 border-violet-200/80",
      dot: "bg-violet-500",
    },
    live: {
      label: "Live Now",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-500",
      pulse: true,
    },
    in_progress: {
      label: "Live",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-500",
      pulse: true,
    },
    completed: {
      label: "Completed",
      classes: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    },
    assets_processing: {
      label: "Assets Processing",
      classes: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
      pulse: true,
    },
    assets_pending: {
      label: "Assets Processing",
      classes: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
      pulse: true,
    },
    failed: {
      label: "Failed",
      classes: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    },
    no_show: {
      label: "No Show",
      classes: "bg-slate-100 text-slate-500 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const item = config[norm] || {
    label: status || "Unknown",
    classes: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const shouldPulse = pulse || item.pulse;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border tracking-wide select-none ${
        sizeStyles[size] || sizeStyles.md
      } ${item.classes}`}
    >
      <span className="relative flex h-2 w-2">
        {shouldPulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${item.dot}`} />
      </span>
      {item.label}
    </span>
  );
}

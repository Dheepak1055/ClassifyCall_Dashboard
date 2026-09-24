import React from "react";

export default function ProbabilityMeter({ value, showLabel = true, size = "md", compact = false }) {
  const num = typeof value === "number" ? Math.min(100, Math.max(0, value)) : null;

  if (num === null) {
    return <span className="text-xs text-slate-400 font-mono">—</span>;
  }

  let tier = "Low";
  let barColor = "bg-rose-500";
  let textColor = "text-rose-700";
  let badgeBg = "bg-rose-50 border-rose-200";

  if (num >= 70) {
    tier = "High";
    barColor = "bg-emerald-500";
    textColor = "text-emerald-700";
    badgeBg = "bg-emerald-50 border-emerald-200";
  } else if (num >= 40) {
    tier = "Medium";
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    badgeBg = "bg-amber-50 border-amber-200";
  }

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[90px]">
        <div className={`flex-1 rounded-full bg-slate-100 overflow-hidden ${heightStyles[size] || "h-2"}`}>
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${num}%` }}
          />
        </div>
        <span className={`text-[11px] font-bold font-mono ${textColor}`}>
          {num}%
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-medium">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeBg} ${textColor}`}>
            {tier}
          </span>
          <span className="font-bold text-slate-900 font-mono">{num}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-100 overflow-hidden ${heightStyles[size] || "h-2"}`}>
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${num}%` }}
        />
      </div>
    </div>
  );
}

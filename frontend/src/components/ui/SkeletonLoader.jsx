import React from "react";

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="h-10 bg-slate-100 rounded-lg w-full mb-4" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-3 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-4 bg-slate-100 rounded ${c === 0 ? "w-1/4" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-3">
      <div className="h-4 bg-slate-100 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-full mt-4" />
    </div>
  );
}

export function TranscriptSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-16 h-4 bg-slate-200 rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="w-24 h-3 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

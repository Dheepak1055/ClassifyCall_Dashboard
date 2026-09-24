import React, { useState } from "react";

export default function Tooltip({ text, children, position = "top", disabled = false }) {
  const [visible, setVisible] = useState(false);

  if (disabled || !text) return children;

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute ${positions[position]} z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-xl transition-all pointer-events-none animate-in fade-in duration-150 border border-slate-700/60 max-w-xs text-center`}
        >
          {text}
          <div
            className={`absolute h-1.5 w-1.5 bg-slate-900 rotate-45 ${
              position === "top"
                ? "top-full -mt-1 left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "bottom-full -mb-1 left-1/2 -translate-x-1/2"
                : ""
            }`}
          />
        </div>
      )}
    </div>
  );
}

import React, { useEffect } from "react";

const Toast = ({ msg, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-right-10 fade-in">
      <div className={`px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border ${
        type === "error" ? "bg-white border-red-100 text-red-600" : "bg-[#285B4B] border-[#285B4B] text-white"
      }`}>
        <span className="text-sm font-medium">{msg}</span>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 text-lg">&times;</button>
      </div>
    </div>
  );
};

export default Toast;
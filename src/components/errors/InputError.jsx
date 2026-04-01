import React from "react";

const FormError = ({ msg }) => {
  if (!msg) return null;
  return (
    <div className="bg-red-50 border-l-2 border-red-500 p-2.5 mb-3 rounded-[4px] flex items-center gap-2 animate-in fade-in zoom-in-95">
      <div className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">!</div>
      <p className="text-red-700 text-[11px] font-medium leading-tight">{msg}</p>
    </div>
  );
};

export default FormError;
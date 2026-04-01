import React from "react";

const InputError = ({ msg }) => {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-[10px] mt-1 flex items-start gap-1 leading-tight animate-in fade-in slide-in-from-top-1">
      <svg className="w-2.5 h-2.5 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{msg}</span>
    </p>
  );
};

export default InputError;
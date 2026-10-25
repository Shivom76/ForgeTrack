import { useEffect, useId } from "react";

// Shared dialog frame: dark backdrop, Escape to close, click outside to close.
export default function ModalShell({ title, description, onClose, children, size = "md" }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      // mousedown (not click) so dragging a text selection out of an input doesn't close the dialog
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full ${size === "lg" ? "max-w-lg" : "max-w-md"} overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

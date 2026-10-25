import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NAV_ITEMS } from "../lib/nav";
import Brand from "./Brand";

// The list of links, shared by the desktop sidebar and the mobile drawer.
function NavList({ onNavigate }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <nav aria-label="Main" className="space-y-1">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-amber-50 text-slate-900 ring-1 ring-amber-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} aria-hidden="true" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ open, onClose }) {
  // Escape closes the mobile drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Desktop: a real column in the layout, so the page content shrinks to make room */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 px-3 py-6">
          <NavList />
        </div>
      </aside>

      {/* Mobile: a drawer that slides OVER the page. `inert` keeps it unfocusable while closed. */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <Brand />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-3">
            <NavList onNavigate={onClose} />
          </div>
        </aside>
      </div>
    </>
  );
}

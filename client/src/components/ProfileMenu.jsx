import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";
import {ROLES} from "../lib/roles.js";

// To add a menu entry later, add one line here, e.g.:
//   { label: "Manage users", to: "/users", icon: Users, roles: [ROLES.ADMIN] }
const MENU_ITEMS = [
  { label: "My profile", to: "/profile", icon: User },
  {label:"Manage users", to: "/users", icon: User, roles: [ROLES.ADMIN]}];

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none";

export default function ProfileMenu() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Avatar name={user.name} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-800 sm:block">
          {user.name}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {/* Who am I signed in as */}
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <RoleBadge role={user.role} />
                {tenant && (
                  <span className="truncate text-xs text-slate-500">{tenant.companyName}</span>
                )}
              </div>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {visibleItems.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {label}
            </Link>
          ))}

          <div className="my-1 border-t border-slate-100" />

          <button type="button" role="menuitem" onClick={handleLogout} className={`${itemClass} text-red-600 hover:bg-red-50 focus:bg-red-50`}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

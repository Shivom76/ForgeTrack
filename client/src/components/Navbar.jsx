import { Menu } from "lucide-react";
import Brand from "./Brand";
import ProfileMenu from "./ProfileMenu";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {/* Hamburger: only on screens smaller than `lg` */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Brand />
        </div>
        <ProfileMenu />
      </div>
    </header>
  );
}

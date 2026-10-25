import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// Navbar on top; below it the sidebar and the page side by side.
// `min-w-0` on <main> lets wide tables scroll inside it instead of stretching the page.
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onMenuClick={() => setMenuOpen(true)} />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar open={menuOpen} onClose={closeMenu} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

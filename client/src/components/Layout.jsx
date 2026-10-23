import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

// Wraps every logged-in page: navbar on top, page content below.
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

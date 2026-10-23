import Brand from "./Brand";
import ProfileMenu from "./ProfileMenu";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Brand />
        {/* Page links (Assets, Maintenance, ...) will go in the middle later. */}
        <ProfileMenu />
      </div>
    </header>
  );
}

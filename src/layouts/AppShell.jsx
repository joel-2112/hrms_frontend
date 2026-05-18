import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";

/**
 * Layer 1 — outermost authenticated shell.
 * Composes Sidebar + Topbar around an <Outlet/> that renders Layer 2 module layouts.
 */
export default function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-gradient-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

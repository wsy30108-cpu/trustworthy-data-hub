import { Outlet } from "react-router-dom";
import { GlobalHeader } from "./GlobalHeader";
import { GlobalSidebar } from "./GlobalSidebar";

export function PlatformLayout() {
  return (
    <div className="min-h-screen">
      <GlobalHeader />
      <GlobalSidebar />
      <main className="shell-main p-6">
        <Outlet />
      </main>
    </div>
  );
}

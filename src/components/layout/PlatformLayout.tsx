import { useState } from "react";
import { Outlet } from "react-router-dom";
import { GlobalHeader } from "./GlobalHeader";
import { GlobalSidebar } from "./GlobalSidebar";

export function PlatformLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div>
      <GlobalHeader />
      <GlobalSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <main className={`shell-main p-6${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

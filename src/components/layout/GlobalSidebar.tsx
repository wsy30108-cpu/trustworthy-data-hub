import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { subPlatforms, platformMenus, mockWorkspaces } from "@/config/platform";

export function GlobalSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(mockWorkspaces[0]);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [wsSearch, setWsSearch] = useState("");

  const activePlatform = subPlatforms.find(p => location.pathname.startsWith(p.routePrefix));
  const isConsole = activePlatform?.id === "007" || location.pathname.startsWith("/console");
  const menuItems = activePlatform ? platformMenus[activePlatform.id] || [] : [];

  const filteredWorkspaces = mockWorkspaces.filter(ws =>
    ws.name.toLowerCase().includes(wsSearch.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    "个": "bg-blue-100 text-blue-700",
    "团": "bg-green-100 text-green-700",
    "组": "bg-orange-100 text-orange-700",
  };

  return (
    <aside className={`shell-sidebar flex flex-col ${collapsed ? "collapsed" : ""}`}>
      {/* 功能菜单区 */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-0.5">
          {menuItems.map(item => {
            const isActive = location.pathname === item.route ||
              location.pathname.startsWith(item.route + "/");
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "menu-item-active"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 空间切换器 - 控制台下不显示 */}
      {!isConsole && (
        <div className="border-t">
          {!collapsed && showWorkspaces && (
            <div className="p-2 border-b max-h-48 overflow-y-auto animate-fade-in">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={wsSearch}
                  onChange={e => setWsSearch(e.target.value)}
                  placeholder="搜索空间..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-0.5">
                {filteredWorkspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setCurrentWorkspace(ws); setShowWorkspaces(false); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                      ws.id === currentWorkspace.id ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${typeColors[ws.type]}`}>
                      {ws.type}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/console/spaces")}
                className="w-full text-xs text-primary hover:underline mt-2 text-center"
              >
                空间管理 →
              </button>
            </div>
          )}

          <div
            className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 ${collapsed ? "justify-center px-2" : ""}`}
            onClick={() => !collapsed && setShowWorkspaces(!showWorkspaces)}
          >
            <span className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium shrink-0 ${typeColors[currentWorkspace.type]}`}>
              {currentWorkspace.type}
            </span>
            {!collapsed && (
              <>
                <span className="text-xs truncate flex-1">{currentWorkspace.name}</span>
                {showWorkspaces ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" />}
              </>
            )}
          </div>
        </div>
      )}

      {/* 折叠按钮 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-3 -right-3 w-6 h-6 rounded-full border bg-card shadow-sm flex items-center justify-center hover:bg-muted/50 z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

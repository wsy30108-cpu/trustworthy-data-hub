import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, ChevronDown, ChevronUp, Settings, Users } from "lucide-react";
import { subPlatforms, platformMenus, mockWorkspaces } from "@/config/platform";
import { cn } from "@/lib/utils";

export function GlobalSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(mockWorkspaces[0]);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [wsSearch, setWsSearch] = useState("");
  const wsRef = useRef<HTMLDivElement>(null);

  const activePlatform = subPlatforms.find(p => location.pathname.startsWith(p.routePrefix));
  const isConsole = activePlatform?.id === "007" || location.pathname.startsWith("/console");
  const menuItems = activePlatform ? platformMenus[activePlatform.id] || [] : [];

  const filteredWorkspaces = mockWorkspaces.filter(ws =>
    ws.name.toLowerCase().includes(wsSearch.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setShowWorkspaces(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColors: Record<string, string> = {
    "个": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "团": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "组": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };

  const typeBorderColors: Record<string, string> = {
    "个": "border-blue-200 dark:border-blue-800",
    "团": "border-green-200 dark:border-green-800",
    "组": "border-orange-200 dark:border-orange-800",
  };

  const handleSwitchWorkspace = (ws: typeof mockWorkspaces[0]) => {
    setCurrentWorkspace(ws);
    setShowWorkspaces(false);
    setWsSearch("");
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "project-mgmt": true,
    "workbench": true,
    "mgmt-center": true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderMenuItem = (item: any, isChild = false) => {
    const isActive = location.pathname === item.route ||
      (item.route !== "#" && location.pathname.startsWith(item.route + "/"));
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups[item.id];

    // 逻辑调整：所有核心业务子平台均使用扁平分组结构
    const hierarchicalPlatforms = ["002", "003", "004", "005", "006"];
    const isFlatGroup = hierarchicalPlatforms.includes(activePlatform?.id || "") && hasChildren;

    if (isFlatGroup) {
      return (
        <div key={item.id} className="pt-2">
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider select-none">
              {item.label}
            </div>
          )}
          <div className="space-y-0.5 mt-0.5">
            {item.children.map((child: any) => renderMenuItem(child, true))}
          </div>
        </div>
      );
    }

    const isFlatMode = hierarchicalPlatforms.includes(activePlatform?.id || "");

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-0.5">
          <button
            onClick={() => toggleGroup(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              "text-foreground/80 hover:bg-muted/50 font-semibold",
              collapsed ? "justify-center px-2" : ""
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="space-y-0.5 mt-0.5">
              {item.children.map((child: any) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => navigate(item.route)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary font-medium shadow-sm"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          collapsed ? "justify-center px-2" : isChild ? (isFlatMode ? "pl-3" : "pl-10") : "pl-3",
          !isChild && !hasChildren && "font-medium"
        )}
        title={collapsed ? item.label : undefined}
      >
        {(!isChild || (isChild && isFlatMode)) && (
          <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
        )}
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside className={`shell-sidebar flex flex-col ${collapsed ? "collapsed" : ""}`}>
      {/* 功能菜单区 */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
        <nav className="px-2 space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {/* 空间切换器 - 控制台下不显示 */}
      {!isConsole && (
        <div className="border-t relative" ref={wsRef}>
          {/* Expanded workspace panel */}
          {!collapsed && showWorkspaces && (
            <div className="absolute bottom-full left-0 right-0 border border-b-0 rounded-t-lg bg-popover shadow-lg animate-fade-in z-20 max-h-[400px] flex flex-col">
              {/* Search */}
              <div className="p-2.5 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={wsSearch}
                    onChange={e => setWsSearch(e.target.value)}
                    placeholder="搜索空间名称..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Workspace cards list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredWorkspaces.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">无匹配空间</p>
                )}
                {filteredWorkspaces.map(ws => {
                  const isSelected = ws.id === currentWorkspace.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws)}
                      className={cn(
                        "w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                        isSelected
                          ? `bg-primary/5 ${typeBorderColors[ws.type]} ring-1 ring-primary/20`
                          : "border-transparent hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-md text-[11px] flex items-center justify-center font-semibold shrink-0 mt-0.5",
                        typeColors[ws.type]
                      )}>
                        {ws.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-xs font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                            {ws.name}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate">{ws.desc}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                            <Users className="w-2.5 h-2.5" />{ws.members}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Space management link */}
              <div className="p-2 border-t">
                <button
                  onClick={() => { navigate("/console/spaces"); setShowWorkspaces(false); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  空间管理
                </button>
              </div>
            </div>
          )}

          {/* Current workspace indicator (bottom fixed) */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-3 cursor-pointer transition-colors",
              showWorkspaces ? "bg-muted/50" : "hover:bg-muted/30",
              collapsed ? "justify-center px-2" : ""
            )}
            onClick={() => { if (!collapsed) { setShowWorkspaces(!showWorkspaces); setWsSearch(""); } }}
          >
            <span className={cn(
              "w-7 h-7 rounded-md text-[11px] flex items-center justify-center font-semibold shrink-0",
              typeColors[currentWorkspace.type]
            )}>
              {currentWorkspace.type}
            </span>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{currentWorkspace.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentWorkspace.desc}</p>
                </div>
                {showWorkspaces
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                }
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

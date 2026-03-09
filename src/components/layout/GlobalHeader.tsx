import { useLocation, useNavigate } from "react-router-dom";
import { Bell, FileText, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { subPlatforms } from "@/config/platform";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function GlobalHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const activePlatform = subPlatforms.find(p => location.pathname.startsWith(p.routePrefix));
  const isHome = location.pathname === "/";

  return (
    <header className="shell-header px-4">
      {/* 左侧: Logo + 平台名 */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">可</span>
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">可信数据平台</span>
        </div>
        {activePlatform && (
          <>
            <span className="text-border mx-1">/</span>
            <span className="text-sm text-muted-foreground">{activePlatform.name}</span>
          </>
        )}
      </div>

      {/* 中间: 子平台导航 */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {subPlatforms.map(p => {
          const isActive = location.pathname.startsWith(p.routePrefix);
          return (
            <button
              key={p.id}
              onClick={() => navigate(p.defaultRoute)}
              className={`relative px-4 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {p.name}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 右侧: 通知 + 文档 + 用户 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
              3
            </span>
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 animate-fade-in">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-medium text-sm">通知消息</span>
                <button className="text-xs text-primary hover:underline">全部已读</button>
              </div>
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {[
                  { title: "数据集审批已通过", desc: "您申请的「中文情感数据集」已通过审批", time: "5分钟前", from: "数据服务" },
                  { title: "工作流运行完成", desc: "「文本清洗流水线」运行成功，共处理12,350条数据", time: "1小时前", from: "数据处理" },
                  { title: "标注任务已分配", desc: "您被分配了新的文本分类标注任务", time: "2小时前", from: "数据标注" },
                ].map((n, i) => (
                  <div key={i} className="p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="status-tag status-tag-info">{n.from}</span>
                      <span className="text-xs text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t text-center">
                <button className="text-xs text-primary hover:underline">查看全部通知</button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground">
          <FileText className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-medium">{mockUser.name[0]}</span>
            </div>
            <span className="text-sm hidden md:inline">{mockUser.name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border rounded-lg shadow-lg z-50 animate-fade-in">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">{mockUser.name}</p>
                <p className="text-xs text-muted-foreground">{mockUser.role}</p>
              </div>
              <div className="p-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted/50">
                  <User className="w-4 h-4" /> 个人设置
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted/50">
                  <Settings className="w-4 h-4" /> 系统设置
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted/50 text-destructive"
                >
                  <LogOut className="w-4 h-4" /> 退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 点击遮罩关闭弹窗 */}
      {(showNotif || showUser) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowUser(false); }} />
      )}
    </header>
  );
}

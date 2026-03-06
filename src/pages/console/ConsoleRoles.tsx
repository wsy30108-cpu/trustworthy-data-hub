import { useState } from "react";
import { Plus, Edit2, Eye, ShieldCheck } from "lucide-react";

const platformRoles = [
  { id: 1, name: "平台超级管理员", desc: "拥有平台全部权限", type: "预设", members: 2, permissions: ["概览", "空间管理", "组织管理", "成员管理", "角色管理", "系统设置", "存储管理", "数据源配置", "数据目录管理"] },
  { id: 2, name: "平台运营", desc: "管理平台日常运营", type: "预设", members: 3, permissions: ["概览", "空间管理", "组织管理", "成员管理"] },
  { id: 3, name: "平台技术支持", desc: "负责平台技术维护", type: "自定义", members: 2, permissions: ["概览", "存储管理", "数据源配置", "系统设置"] },
];

const spaceRoles = [
  { id: 4, name: "空间管理员", desc: "管理空间内全部事务", type: "预设", members: 8, permissions: ["空间信息", "成员管理", "任务管理", "资源配额", "数据集管理"] },
  { id: 5, name: "数据开发", desc: "负责数据集开发与处理", type: "预设", members: 15, permissions: ["数据集管理", "工作流", "模板", "算子"] },
  { id: 6, name: "标注员", desc: "执行数据标注任务", type: "预设", members: 45, permissions: ["标注任务", "任务大厅"] },
  { id: 7, name: "质检员", desc: "负责标注质量审核", type: "预设", members: 12, permissions: ["标注任务", "质检审核", "统计分析"] },
];

const ConsoleRoles = () => {
  const [tab, setTab] = useState<"platform" | "space">("platform");
  const [showDetail, setShowDetail] = useState<number | null>(null);

  const roles = tab === "platform" ? platformRoles : spaceRoles;
  const detail = [...platformRoles, ...spaceRoles].find(r => r.id === showDetail);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">角色管理</h1>
          <p className="page-description">配置平台内角色和空间内角色的权限体系</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增角色
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab("platform")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "platform" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
          平台内角色
        </button>
        <button onClick={() => setTab("space")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "space" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
          空间内角色
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(r => (
          <div key={r.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-sm">{r.name}</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.type === "预设" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{r.type}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{r.desc}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {r.permissions.slice(0, 4).map(p => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
              ))}
              {r.permissions.length > 4 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{r.permissions.length - 4}</span>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-muted-foreground">{r.members} 个成员</span>
              <div className="flex gap-1">
                <button onClick={() => setShowDetail(r.id)} className="p-1 rounded hover:bg-muted/50"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1 rounded hover:bg-muted/50"><Edit2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2">{detail.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{detail.desc}</p>
            <h3 className="text-sm font-medium mb-2">权限列表</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {detail.permissions.map(p => (
                <span key={p} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">{p}</span>
              ))}
            </div>
            <div className="flex justify-end"><button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleRoles;

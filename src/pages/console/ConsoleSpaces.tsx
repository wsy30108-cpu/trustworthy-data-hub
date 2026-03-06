import { useState } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit2, Power, Trash2, Boxes } from "lucide-react";

type SpaceType = "all" | "org" | "team" | "personal";
type SpaceStatus = "all" | "active" | "disabled";

const mockSpaces = [
  { id: "WS-001", name: "AI大模型研发组", identifier: "ai-llm-rd", type: "团队空间", org: "北京AI研究院", admin: "张明", members: 24, storage: "5.2TB", status: "启用", createdAt: "2025-08-12" },
  { id: "WS-002", name: "NLP基础研究团队", identifier: "nlp-base", type: "团队空间", org: "北京AI研究院", admin: "李华", members: 18, storage: "3.8TB", status: "启用", createdAt: "2025-09-05" },
  { id: "WS-003", name: "北京AI研究院", identifier: "bj-ai-org", type: "组织空间", org: "北京AI研究院", admin: "王芳", members: 56, storage: "12.3TB", status: "启用", createdAt: "2025-06-01" },
  { id: "WS-004", name: "计算机视觉实验室", identifier: "cv-lab", type: "团队空间", org: "清华大学", admin: "赵强", members: 15, storage: "8.1TB", status: "启用", createdAt: "2025-10-20" },
  { id: "WS-005", name: "张明的个人空间", identifier: "zhangming-personal", type: "个人空间", org: "-", admin: "张明", members: 1, storage: "256GB", status: "启用", createdAt: "2025-08-12" },
  { id: "WS-006", name: "语音识别团队", identifier: "asr-team", type: "团队空间", org: "北京AI研究院", admin: "孙丽", members: 12, storage: "2.3TB", status: "停用", createdAt: "2025-11-15" },
  { id: "WS-007", name: "数据标注中心", identifier: "annotation-center", type: "团队空间", org: "数据服务公司", admin: "周杰", members: 45, storage: "1.5TB", status: "启用", createdAt: "2025-07-08" },
  { id: "WS-008", name: "李华的个人空间", identifier: "lihua-personal", type: "个人空间", org: "-", admin: "李华", members: 1, storage: "128GB", status: "启用", createdAt: "2025-09-05" },
];

const typeMap: Record<string, SpaceType> = { "组织空间": "org", "团队空间": "team", "个人空间": "personal" };

const ConsoleSpaces = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SpaceType>("all");
  const [statusFilter, setStatusFilter] = useState<SpaceStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = mockSpaces.filter(s => {
    if (search && !s.name.includes(search) && !s.identifier.includes(search)) return false;
    if (typeFilter !== "all" && typeMap[s.type] !== typeFilter) return false;
    if (statusFilter === "active" && s.status !== "启用") return false;
    if (statusFilter === "disabled" && s.status !== "停用") return false;
    return true;
  });

  const detail = mockSpaces.find(s => s.id === showDetail);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">空间管理</h1>
          <p className="page-description">管理组织、团队和个人空间的全生命周期</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增空间
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "空间总数", value: mockSpaces.length, color: "bg-primary/10 text-primary" },
          { label: "组织空间", value: mockSpaces.filter(s => s.type === "组织空间").length, color: "bg-orange-50 text-orange-600" },
          { label: "团队空间", value: mockSpaces.filter(s => s.type === "团队空间").length, color: "bg-green-50 text-green-600" },
          { label: "个人空间", value: mockSpaces.filter(s => s.type === "个人空间").length, color: "bg-blue-50 text-blue-600" },
        ].map((c, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索空间名称或标识..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as SpaceType)} className="px-3 py-2 text-sm border rounded-md bg-card">
          <option value="all">全部类型</option>
          <option value="org">组织空间</option>
          <option value="team">团队空间</option>
          <option value="personal">个人空间</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SpaceStatus)} className="px-3 py-2 text-sm border rounded-md bg-card">
          <option value="all">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">停用</option>
        </select>
      </div>

      {/* 列表 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["空间名称", "空间标识", "空间类型", "所属机构", "管理员", "成员数", "存储用量", "状态", "创建时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <button onClick={() => setShowDetail(s.id)} className="text-primary hover:underline">{s.name}</button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{s.identifier}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${s.type === "组织空间" ? "status-tag-warning" : s.type === "团队空间" ? "status-tag-success" : "status-tag-info"}`}>{s.type}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{s.org}</td>
                  <td className="py-3 px-4">{s.admin}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.members}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.storage}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${s.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{s.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <button onClick={() => setActionMenu(actionMenu === s.id ? null : s.id)} className="p-1 rounded hover:bg-muted/50">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenu === s.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-32 bg-card border rounded-lg shadow-lg z-50 p-1">
                            <button onClick={() => { setShowDetail(s.id); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Eye className="w-3 h-3" />查看详情</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Edit2 className="w-3 h-3" />编辑</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Power className="w-3 h-3" />{s.status === "启用" ? "停用" : "启用"}</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50 text-destructive"><Trash2 className="w-3 h-3" />删除</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">暂无匹配的空间数据</div>
        )}
      </div>

      {/* 创建空间弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增空间</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">空间类型</label>
                <select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>团队空间</option></select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">空间名称</label>
                <input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="输入空间名称" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">空间标识</label>
                <input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="英文标识，如 my-team" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">描述</label>
                <textarea className="w-full px-3 py-2 text-sm border rounded-md bg-background" rows={3} placeholder="空间用途描述" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">空间管理员</label>
                <select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>张明</option><option>李华</option></select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">默认存储</label>
                <select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>MinIO-主存储</option><option>OSS-备份存储</option></select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 空间详情弹窗 */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{detail.name}</h2>
              <span className={`status-tag ${detail.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{detail.status}</span>
            </div>
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{detail.storage}</div>
                <div className="text-xs text-muted-foreground mt-1">存储使用率</div>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{Math.floor(Math.random() * 20)}</div>
                <div className="text-xs text-muted-foreground mt-1">运行中任务</div>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{detail.members}</div>
                <div className="text-xs text-muted-foreground mt-1">空间成员</div>
              </div>
            </div>
            {/* 基本信息 */}
            <div className="space-y-3 text-sm">
              <h3 className="font-medium text-foreground">基本信息</h3>
              {[
                ["空间标识", detail.identifier],
                ["空间类型", detail.type],
                ["所属机构", detail.org],
                ["管理员", detail.admin],
                ["创建时间", detail.createdAt],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center py-2 border-b border-dashed">
                  <span className="w-24 text-muted-foreground shrink-0">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleSpaces;

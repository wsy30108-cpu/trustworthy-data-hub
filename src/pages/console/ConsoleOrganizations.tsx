import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Users, Eye } from "lucide-react";

const mockOrgs = [
  { id: "ORG-001", name: "北京AI研究院", identifier: "bj-ai", contact: "王芳", phone: "138****1234", desc: "人工智能基础研究与应用", members: 56, spaces: 3, createdAt: "2025-06-01" },
  { id: "ORG-002", name: "清华大学计算机系", identifier: "thu-cs", contact: "赵强", phone: "139****5678", desc: "高校科研组织", members: 32, spaces: 2, createdAt: "2025-07-15" },
  { id: "ORG-003", name: "数据服务公司", identifier: "data-svc", contact: "周杰", phone: "137****9012", desc: "专业数据标注与处理服务", members: 45, spaces: 1, createdAt: "2025-08-20" },
  { id: "ORG-004", name: "中科院自动化所", identifier: "casia", contact: "刘洋", phone: "136****3456", desc: "自动化与智能科学研究", members: 28, spaces: 2, createdAt: "2025-09-10" },
];

const ConsoleOrganizations = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState<string | null>(null);

  const filtered = mockOrgs.filter(o => !search || o.name.includes(search) || o.identifier.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">组织管理</h1>
          <p className="page-description">管理平台入驻的组织机构信息</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增组织
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索组织名称或标识..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["组织标识", "组织名称", "联系人", "联系电话", "描述", "成员数", "空间数", "创建时间", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{o.identifier}</td>
                <td className="py-3 px-4 font-medium">{o.name}</td>
                <td className="py-3 px-4">{o.contact}</td>
                <td className="py-3 px-4 text-muted-foreground">{o.phone}</td>
                <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{o.desc}</td>
                <td className="py-3 px-4">{o.members}</td>
                <td className="py-3 px-4">{o.spaces}</td>
                <td className="py-3 px-4 text-muted-foreground">{o.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowMembers(o.id)} className="p-1 rounded hover:bg-muted/50" title="查看成员"><Users className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted/50 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增组织</h2>
            <div className="space-y-4">
              {[["组织名称", "输入组织名称"], ["组织标识", "英文标识"], ["联系人", "联系人姓名"], ["联系电话", "联系电话"], ["邮箱", "联系邮箱"]].map(([label, ph]) => (
                <div key={label}><label className="text-sm font-medium mb-1 block">{label}</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder={ph} /></div>
              ))}
              <div><label className="text-sm font-medium mb-1 block">描述</label><textarea className="w-full px-3 py-2 text-sm border rounded-md bg-background" rows={3} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">创建</button>
            </div>
          </div>
        </div>
      )}

      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowMembers(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-xl p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{mockOrgs.find(o => o.id === showMembers)?.name} - 成员列表</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 px-3 text-xs text-muted-foreground">账号</th><th className="text-left py-2 px-3 text-xs text-muted-foreground">姓名</th><th className="text-left py-2 px-3 text-xs text-muted-foreground">角色</th></tr></thead>
              <tbody>
                {[{ acc: "zhangming", name: "张明", role: "空间管理员" }, { acc: "lihua", name: "李华", role: "数据开发" }, { acc: "wangfang", name: "王芳", role: "标注员" }].map((m, i) => (
                  <tr key={i} className="border-b last:border-0"><td className="py-2 px-3 font-mono text-xs">{m.acc}</td><td className="py-2 px-3">{m.name}</td><td className="py-2 px-3"><span className="status-tag status-tag-info">{m.role}</span></td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4"><button onClick={() => setShowMembers(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleOrganizations;

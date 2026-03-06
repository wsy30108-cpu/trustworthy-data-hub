import { useState } from "react";
import { Search, MoreHorizontal, Power, KeyRound, ShieldCheck } from "lucide-react";

const mockMembers = [
  { id: 1, account: "zhangming", name: "张明", phone: "138****1234", email: "zhang@ai.com", role: "平台超级管理员", org: "北京AI研究院", status: "启用", lastLogin: "2026-03-06 10:30" },
  { id: 2, account: "lihua", name: "李华", phone: "139****5678", email: "li@ai.com", role: "空间管理员", org: "北京AI研究院", status: "启用", lastLogin: "2026-03-06 09:15" },
  { id: 3, account: "wangfang", name: "王芳", phone: "137****9012", email: "wang@thu.edu", role: "平台运营", org: "清华大学计算机系", status: "启用", lastLogin: "2026-03-05 16:42" },
  { id: 4, account: "zhaoqiang", name: "赵强", phone: "136****3456", email: "zhao@thu.edu", role: "数据开发", org: "清华大学计算机系", status: "启用", lastLogin: "2026-03-05 14:20" },
  { id: 5, account: "sunli", name: "孙丽", phone: "135****7890", email: "sun@data.com", role: "标注员", org: "数据服务公司", status: "停用", lastLogin: "2026-02-28 11:00" },
  { id: 6, account: "zhoujie", name: "周杰", phone: "134****2345", email: "zhou@data.com", role: "质检员", org: "数据服务公司", status: "启用", lastLogin: "2026-03-06 08:50" },
];

const ConsoleMembers = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  const filtered = mockMembers.filter(m => {
    if (search && !m.name.includes(search) && !m.account.includes(search) && !m.email.includes(search)) return false;
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    return true;
  });

  const roles = [...new Set(mockMembers.map(m => m.role))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">成员管理</h1>
          <p className="page-description">查看和管理平台全部成员信息</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索账号、姓名或邮箱..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-md bg-card">
          <option value="all">全部角色</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["用户账号", "用户姓名", "联系电话", "邮箱", "所属组织", "角色", "状态", "最后登录", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono text-xs">{m.account}</td>
                  <td className="py-3 px-4 font-medium">{m.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.phone}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.email}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.org}</td>
                  <td className="py-3 px-4"><span className="status-tag status-tag-info">{m.role}</span></td>
                  <td className="py-3 px-4"><span className={`status-tag ${m.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{m.status}</span></td>
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{m.lastLogin}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title={m.status === "启用" ? "禁用" : "启用"}><Power className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded hover:bg-muted/50" title="重置密码"><KeyRound className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded hover:bg-muted/50" title="分配角色"><ShieldCheck className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsoleMembers;

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronUp, ChevronDown, Eye } from "lucide-react";

const mockOrgs: Record<string, string> = {
  "ORG-001": "北京AI研究院",
  "ORG-002": "清华大学计算机系",
  "ORG-003": "数据服务公司",
  "ORG-004": "中科院自动化所",
};

interface Member {
  id: string;
  account: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  joinedAt: string;
}

const allMockMembers: Record<string, Member[]> = {
  "ORG-001": [
    { id: "M001", account: "zhangming", name: "张明", phone: "138****1234", email: "zm@ai.cn", role: "组织管理员", joinedAt: "2025-06-01" },
    { id: "M002", account: "lihua", name: "李华", phone: "139****5678", email: "lh@ai.cn", role: "数据开发", joinedAt: "2025-06-15" },
    { id: "M003", account: "wangfang", name: "王芳", phone: "137****9012", email: "wf@ai.cn", role: "标注员", joinedAt: "2025-07-01" },
    { id: "M004", account: "zhaolei", name: "赵磊", phone: "136****3456", email: "zl@ai.cn", role: "数据开发", joinedAt: "2025-07-10" },
    { id: "M005", account: "sunli", name: "孙丽", phone: "135****7890", email: "sl@ai.cn", role: "成员", joinedAt: "2025-07-20" },
    { id: "M006", account: "zhoujie", name: "周杰", phone: "134****2345", email: "zj@ai.cn", role: "成员", joinedAt: "2025-08-01" },
    { id: "M007", account: "wuqiang", name: "吴强", phone: "133****6789", email: "wq@ai.cn", role: "标注员", joinedAt: "2025-08-15" },
    { id: "M008", account: "chenxi", name: "陈希", phone: "132****0123", email: "cx@ai.cn", role: "数据开发", joinedAt: "2025-09-01" },
    { id: "M009", account: "yangfei", name: "杨飞", phone: "131****4567", email: "yf@ai.cn", role: "成员", joinedAt: "2025-09-10" },
    { id: "M010", account: "huangyan", name: "黄燕", phone: "130****8901", email: "hy@ai.cn", role: "成员", joinedAt: "2025-09-20" },
    { id: "M011", account: "xuming", name: "徐明", phone: "138****1111", email: "xm@ai.cn", role: "标注员", joinedAt: "2025-10-01" },
    { id: "M012", account: "hejia", name: "何佳", phone: "139****2222", email: "hj@ai.cn", role: "数据开发", joinedAt: "2025-10-10" },
  ],
  "ORG-002": [
    { id: "M101", account: "zhaoqiang", name: "赵强", phone: "139****5678", email: "zq@thu.edu.cn", role: "组织管理员", joinedAt: "2025-07-15" },
    { id: "M102", account: "qianwen", name: "钱文", phone: "138****6789", email: "qw@thu.edu.cn", role: "成员", joinedAt: "2025-08-01" },
  ],
  "ORG-003": [
    { id: "M201", account: "zhoujie2", name: "周杰", phone: "137****9012", email: "zj@data.cn", role: "组织管理员", joinedAt: "2025-08-20" },
  ],
  "ORG-004": [
    { id: "M301", account: "liuyang", name: "刘洋", phone: "136****3456", email: "ly@casia.cn", role: "组织管理员", joinedAt: "2025-09-10" },
    { id: "M302", account: "tangwei", name: "唐伟", phone: "135****4567", email: "tw@casia.cn", role: "成员", joinedAt: "2025-09-15" },
    { id: "M303", account: "malin", name: "马琳", phone: "134****5678", email: "ml@casia.cn", role: "数据开发", joinedAt: "2025-10-01" },
  ],
};

type SortField = "name" | "joinedAt";
type SortDir = "asc" | "desc";

const PAGE_OPTIONS = [10, 20, 50];

const ConsoleOrgMembers = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const orgName = orgId ? mockOrgs[orgId] || "未知组织" : "未知组织";
  const members = orgId ? allMockMembers[orgId] || [] : [];

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.trim().toLowerCase();
    return members.filter(
      m => m.name.toLowerCase().includes(q) || m.account.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
    );
  }, [members, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1 -space-y-1">
      <ChevronUp className={`w-3 h-3 ${sortField === field && sortDir === "asc" ? "text-primary" : "text-muted-foreground/40"}`} />
      <ChevronDown className={`w-3 h-3 ${sortField === field && sortDir === "desc" ? "text-primary" : "text-muted-foreground/40"}`} />
    </span>
  );

  const renderPageButtons = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`e${idx}`} className="px-2 py-1 text-xs text-muted-foreground">...</span>
      ) : (
        <button
          key={p}
          onClick={() => setPage(p as number)}
          className={`min-w-[32px] h-8 px-2 text-xs rounded-md ${safePage === p ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
        >
          {p}
        </button>
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/console/organizations")} className="p-1.5 rounded-md hover:bg-muted/50" title="返回组织管理">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{orgName} - 关联成员</h1>
          <p className="text-sm text-muted-foreground mt-0.5">共 {totalCount} 条数据</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜索姓名、账号或角色..."
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {paged.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("name")}>
                  成员姓名 <SortIcon field="name" />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">成员账号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">联系电话</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">角色</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("joinedAt")}>
                  加入时间 <SortIcon field="joinedAt" />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(m => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">{m.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{m.account}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.phone}</td>
                  <td className="py-3 px-4"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{m.role}</span></td>
                  <td className="py-3 px-4 text-muted-foreground">{m.joinedAt}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setDetailMember(m)} className="p-1 rounded hover:bg-muted/50" title="查看详情">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{search.trim() ? "未找到符合条件的成员" : "暂无关联成员，可在成员管理中添加"}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">共 {totalCount} 条数据</span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 text-xs border rounded-md bg-card"
            >
              {PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>{n} 条/页</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="h-8 px-2 text-xs rounded-md hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed">上一页</button>
              {renderPageButtons()}
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="h-8 px-2 text-xs rounded-md hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed">下一页</button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Dialog */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailMember(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">成员详情</h2>
            <div className="space-y-3 text-sm">
              {[
                ["用户账号", detailMember.account],
                ["用户姓名", detailMember.name],
                ["联系电话", detailMember.phone],
                ["邮箱", detailMember.email || "未填写"],
                ["角色", detailMember.role],
                ["加入时间", detailMember.joinedAt],
              ].map(([label, value]) => (
                <div key={label} className="flex">
                  <span className="w-20 text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setDetailMember(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleOrgMembers;

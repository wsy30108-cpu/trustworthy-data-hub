import { useState, useRef, useEffect } from "react";
import { Search, Power, KeyRound, ShieldCheck, Eye, Edit, Trash2, Plus, RotateCcw, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, UserPlus, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface Member {
  id: number;
  account: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
  org: string;
  status: "启用" | "停用";
  lastLogin: string;
  createdAt: string;
  dept?: string;
}

/* ─── Mock Data ─── */
const mockMembers: Member[] = [
  { id: 1, account: "zhangming", name: "张明", phone: "138****1234", email: "zhang@ai.com", roles: ["平台超级管理员"], org: "北京AI研究院", dept: "技术部", status: "启用", lastLogin: "2026-03-06 10:30", createdAt: "2025-06-01" },
  { id: 2, account: "lihua", name: "李华", phone: "139****5678", email: "li@ai.com", roles: ["空间管理员"], org: "北京AI研究院", dept: "数据部", status: "启用", lastLogin: "2026-03-06 09:15", createdAt: "2025-07-15" },
  { id: 3, account: "wangfang", name: "王芳", phone: "137****9012", email: "wang@thu.edu", roles: ["平台运营"], org: "清华大学计算机系", dept: "运营部", status: "启用", lastLogin: "2026-03-05 16:42", createdAt: "2025-08-20" },
  { id: 4, account: "zhaoqiang", name: "赵强", phone: "136****3456", email: "zhao@thu.edu", roles: ["数据开发", "标注员"], org: "清华大学计算机系", dept: "开发部", status: "启用", lastLogin: "2026-03-05 14:20", createdAt: "2025-09-10" },
  { id: 5, account: "sunli", name: "孙丽", phone: "135****7890", email: "sun@data.com", roles: ["标注员"], org: "数据服务公司", dept: "标注部", status: "停用", lastLogin: "2026-02-28 11:00", createdAt: "2025-10-05" },
  { id: 6, account: "zhoujie", name: "周杰", phone: "134****2345", email: "zhou@data.com", roles: ["质检员"], org: "数据服务公司", dept: "质检部", status: "启用", lastLogin: "2026-03-06 08:50", createdAt: "2025-11-12" },
  { id: 7, account: "chenwei", name: "陈伟", phone: "133****6789", email: "chen@ai.com", roles: ["数据开发"], org: "北京AI研究院", dept: "算法部", status: "启用", lastLogin: "2026-03-04 17:30", createdAt: "2025-12-01" },
  { id: 8, account: "huangyan", name: "黄燕", phone: "132****0123", email: "huang@data.com", roles: ["标注员", "质检员"], org: "数据服务公司", dept: "标注部", status: "启用", lastLogin: "2026-03-03 09:45", createdAt: "2026-01-08" },
];

const ALL_ROLES = ["平台超级管理员", "空间管理员", "平台运营", "数据开发", "标注员", "质检员", "观察员"];
const ALL_ORGS = [...new Set(mockMembers.map(m => m.org))];
const PAGE_SIZES = [10, 20, 50];

/* ─── Detail Dialog ─── */
function MemberDetailDialog({ open, onClose, member }: { open: boolean; onClose: () => void; member: Member | null }) {
  if (!member) return null;
  const fields = [
    { label: "用户账号", value: member.account },
    { label: "用户姓名", value: member.name },
    { label: "联系电话", value: member.phone },
    { label: "邮箱", value: member.email },
    { label: "所属组织", value: member.org },
    { label: "部门", value: member.dept || "—" },
    { label: "角色", value: member.roles.join("、") },
    { label: "状态", value: member.status },
    { label: "创建时间", value: member.createdAt },
    { label: "最后登录", value: member.lastLogin },
  ];
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>成员详情</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
              {member.name[0]}
            </div>
            <div>
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.account} · {member.org}</p>
            </div>
            <span className={cn("ml-auto px-2 py-0.5 rounded text-xs font-medium",
              member.status === "启用" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>{member.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Role Assignment Dialog ─── */
function RoleAssignDialog({ open, onClose, member, onSave }: {
  open: boolean; onClose: () => void; member: Member | null; onSave: (id: number, roles: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { if (member && open) setSelected([...member.roles]); }, [member, open]);
  const toggle = (r: string) => setSelected(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  if (!member) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>分配角色 - {member.name}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">选择要分配给该成员的角色（可多选）</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {ALL_ROLES.map(r => (
              <label key={r} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} className="rounded accent-primary w-4 h-4" />
                {r}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => { onSave(member.id, selected); onClose(); }} disabled={selected.length === 0}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Add Member Dialog ─── */
function AddMemberDialog({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (m: Partial<Member>) => void;
}) {
  const [form, setForm] = useState({ account: "", name: "", phone: "", email: "", org: ALL_ORGS[0], roles: [] as string[] });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const toggleRole = (r: string) => setForm(prev => ({ ...prev, roles: prev.roles.includes(r) ? prev.roles.filter(x => x !== r) : [...prev.roles, r] }));

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!form.account.trim()) e.account = true;
    if (!form.name.trim()) e.name = true;
    if (!form.email.trim()) e.email = true;
    if (form.roles.length === 0) e.roles = true;
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onAdd(form);
    setForm({ account: "", name: "", phone: "", email: "", org: ALL_ORGS[0], roles: [] });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>新增成员</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">用户账号 <span className="text-destructive">*</span></label>
            <Input value={form.account} onChange={e => { setForm({ ...form, account: e.target.value }); setErrors({ ...errors, account: false }); }}
              placeholder="请输入账号" className={cn(errors.account && "border-destructive")} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">用户姓名 <span className="text-destructive">*</span></label>
            <Input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: false }); }}
              placeholder="请输入姓名" className={cn(errors.name && "border-destructive")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">联系电话</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="选填" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">邮箱 <span className="text-destructive">*</span></label>
              <Input value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: false }); }}
                placeholder="请输入邮箱" className={cn(errors.email && "border-destructive")} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">所属组织</label>
            <select value={form.org} onChange={e => setForm({ ...form, org: e.target.value })}
              className="w-full h-9 px-3 text-sm border rounded-md bg-card">
              {ALL_ORGS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className={cn("text-sm font-medium", errors.roles && "text-destructive")}>角色 <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(r => (
                <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} className="rounded accent-primary" />{r}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}>确认新增</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Edit Member Dialog ─── */
function EditMemberDialog({ open, onClose, member, onSave }: {
  open: boolean; onClose: () => void; member: Member | null; onSave: (m: Member) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", org: "" });
  useEffect(() => { if (member && open) setForm({ name: member.name, phone: member.phone, email: member.email, org: member.org }); }, [member, open]);
  if (!member) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>编辑成员 - {member.account}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">用户姓名</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">联系电话</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">邮箱</label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">所属组织</label>
            <select value={form.org} onChange={e => setForm({ ...form, org: e.target.value })}
              className="w-full h-9 px-3 text-sm border rounded-md bg-card">
              {ALL_ORGS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => { onSave({ ...member, ...form }); onClose(); }}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ open, onClose, onConfirm, title, desc }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; desc: string;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{desc}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Pagination ─── */
function PaginationBar({ total, page, pageSize, onPageChange, onPageSizeChange }: {
  total: number; page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [jumpInput, setJumpInput] = useState("");
  const jump = () => { const n = parseInt(jumpInput); if (n >= 1 && n <= totalPages) { onPageChange(n); setJumpInput(""); } };
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
  }
  const deduped: (number | "...")[] = [];
  pages.forEach((p, idx) => { if (idx > 0 && p - pages[idx - 1] > 1) deduped.push("..."); deduped.push(p); });

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-xs text-muted-foreground">共 {total} 条数据</span>
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="px-2 py-1 text-xs border rounded bg-card">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}条/页</option>)}
        </select>
        <div className="flex gap-0.5">
          <button disabled={page <= 1} onClick={() => onPageChange(1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronsLeft className="w-3 h-3 mx-auto" /></button>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronLeft className="w-3 h-3 mx-auto" /></button>
          {deduped.map((p, i) => p === "..." ? (
            <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p as number)}
              className={cn("w-7 h-7 text-xs rounded border", p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground")}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronRight className="w-3 h-3 mx-auto" /></button>
          <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronsRight className="w-3 h-3 mx-auto" /></button>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          跳至<input value={jumpInput} onChange={e => setJumpInput(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && jump()}
            className="w-10 h-7 text-center text-xs border rounded bg-card" />页
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */
const ConsoleMembers = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [detailTarget, setDetailTarget] = useState<Member | null>(null);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [roleTarget, setRoleTarget] = useState<Member | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  // Sort
  const [sortField, setSortField] = useState<"name" | "lastLogin" | "createdAt" | "">(""); 
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (f: "name" | "lastLogin" | "createdAt") => {
    if (sortField === f) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortField(f); setSortDir("asc"); }
  };

  const filtered = members.filter(m => {
    if (search && !m.name.includes(search) && !m.account.includes(search) && !m.email.includes(search)) return false;
    if (roleFilter !== "all" && !m.roles.includes(roleFilter)) return false;
    if (orgFilter !== "all" && m.org !== orgFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => {
    if (!sortField) return 0;
    const va = a[sortField] || "";
    const vb = b[sortField] || "";
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const hasActiveFilters = search || roleFilter !== "all" || orgFilter !== "all" || statusFilter !== "all";
  const resetFilters = () => { setSearch(""); setRoleFilter("all"); setOrgFilter("all"); setStatusFilter("all"); setPage(1); };

  const handleToggleStatus = (m: Member) => {
    const next = m.status === "启用" ? "停用" : "启用";
    setConfirmDialog({
      title: `${next === "停用" ? "停用" : "启用"}成员`,
      desc: `确认${next === "停用" ? "停用" : "启用"}成员「${m.name}」吗？${next === "停用" ? "停用后该成员将无法登录系统。" : "启用后该成员可正常登录系统。"}`,
      onConfirm: () => {
        setMembers(prev => prev.map(x => x.id === m.id ? { ...x, status: next } : x));
        toast({ title: `成员「${m.name}」已${next}` });
      },
    });
  };

  const handleResetPassword = (m: Member) => {
    setConfirmDialog({
      title: "重置密码",
      desc: `确认重置成员「${m.name}」的密码吗？重置后密码将发送至其邮箱 ${m.email}。`,
      onConfirm: () => toast({ title: `密码已重置，新密码已发送至 ${m.email}` }),
    });
  };

  const handleDelete = (m: Member) => {
    setConfirmDialog({
      title: "删除成员",
      desc: `确认删除成员「${m.name}」（${m.account}）吗？删除后该成员所有数据将被清除，此操作不可恢复。`,
      onConfirm: () => {
        setMembers(prev => prev.filter(x => x.id !== m.id));
        toast({ title: `成员「${m.name}」已删除` });
      },
    });
  };

  const handleRoleSave = (id: number, roles: string[]) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, roles } : m));
    toast({ title: "角色已更新" });
  };

  const handleAdd = (data: Partial<Member>) => {
    const newMember: Member = {
      id: Date.now(),
      account: data.account || "",
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      roles: data.roles || [],
      org: data.org || "",
      status: "启用",
      lastLogin: "—",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setMembers(prev => [newMember, ...prev]);
    toast({ title: `成员「${newMember.name}」已创建` });
  };

  const handleEdit = (m: Member) => {
    setMembers(prev => prev.map(x => x.id === m.id ? m : x));
    toast({ title: `成员「${m.name}」信息已更新` });
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className={cn("inline-flex flex-col ml-0.5 cursor-pointer", sortField === field ? "text-primary" : "text-muted-foreground/40")}>
      <ChevronLeft className={cn("w-2.5 h-2.5 rotate-90", sortField === field && sortDir === "asc" && "text-primary")} />
      <ChevronLeft className={cn("w-2.5 h-2.5 -rotate-90 -mt-1", sortField === field && sortDir === "desc" && "text-primary")} />
    </span>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">成员管理</h1>
          <p className="page-description">查看和管理平台全部成员信息，包括账号管理、角色分配、状态控制等</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索账号、姓名或邮箱..."
              className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-md bg-muted/30">
            <option value="all">全部角色</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-md bg-muted/30">
            <option value="all">全部组织</option>
            {ALL_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-md bg-muted/30">
            <option value="all">全部状态</option>
            <option value="启用">启用</option>
            <option value="停用">停用</option>
          </select>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={resetFilters} className={cn("h-9 gap-1.5 text-xs", !hasActiveFilters && "opacity-50")} disabled={!hasActiveFilters}>
            <RotateCcw className="w-3 h-3" />重置
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="h-9 gap-1.5 text-xs">
            <UserPlus className="w-3.5 h-3.5" />新增成员
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        {[
          { label: "总成员数", value: members.length, color: "text-foreground" },
          { label: "已启用", value: members.filter(m => m.status === "启用").length, color: "text-green-600 dark:text-green-400" },
          { label: "已停用", value: members.filter(m => m.status === "停用").length, color: "text-red-600 dark:text-red-400" },
          { label: "筛选结果", value: filtered.length, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card px-4 py-3 min-w-[120px]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-semibold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">用户账号</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  用户姓名 <SortIcon field="name" />
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">联系电话</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">邮箱</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">所属组织</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">角色</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">状态</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("lastLogin")}>
                  最后登录 <SortIcon field="lastLogin" />
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{m.account}</td>
                  <td className="py-3 px-3">
                    <button className="text-primary hover:underline font-medium" onClick={() => setDetailTarget(m)}>{m.name}</button>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{m.phone}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{m.email}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{m.org}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {m.roles.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                      m.status === "启用"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>{m.status}</span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs whitespace-nowrap">{m.lastLogin}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-0.5">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情" onClick={() => setDetailTarget(m)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="编辑" onClick={() => setEditTarget(m)}>
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="分配角色" onClick={() => setRoleTarget(m)}>
                        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title={m.status === "启用" ? "停用" : "启用"} onClick={() => handleToggleStatus(m)}>
                        <Power className={cn("w-3.5 h-3.5", m.status === "启用" ? "text-green-600" : "text-red-500")} />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="重置密码" onClick={() => handleResetPassword(m)}>
                        <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="删除" onClick={() => handleDelete(m)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{hasActiveFilters ? "无匹配结果" : "暂无成员数据"}</p>
                    {hasActiveFilters && <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1 text-xs"><RotateCcw className="w-3 h-3" />重置筛选</Button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>

      {/* Dialogs */}
      <MemberDetailDialog open={!!detailTarget} onClose={() => setDetailTarget(null)} member={detailTarget} />
      <EditMemberDialog open={!!editTarget} onClose={() => setEditTarget(null)} member={editTarget} onSave={handleEdit} />
      <RoleAssignDialog open={!!roleTarget} onClose={() => setRoleTarget(null)} member={roleTarget} onSave={handleRoleSave} />
      <AddMemberDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      {confirmDialog && <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />}
    </div>
  );
};

export default ConsoleMembers;

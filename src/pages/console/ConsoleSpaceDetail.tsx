import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Edit, Save, X, Plus, Trash2, Search, Eye, ShieldCheck, UserPlus, Power, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, HardDrive, Check, Loader2, AlertTriangle, ExternalLink, Settings, Star, TestTube2, ChevronDown, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface SpaceData {
  id: string; name: string; identifier: string; type: string; org: string;
  admin: string; admins?: string[]; members: number; storage: string; status: string; createdAt: string;
  desc?: string; updatedAt?: string; updatedBy?: string; storageLocation?: string;
}

interface SpaceMember {
  id: string; name: string; account: string; roles: string[]; joinedAt: string; status: "启用" | "停用";
}

/* ─── Mock Org Members (same org candidates) ─── */
const CURRENT_USER = "张明";
const MOCK_ORG_MEMBERS = [
  { id: "om1", name: "张明", account: "zhangming", dept: "数据平台部" },
  { id: "om2", name: "李华", account: "lihua", dept: "数据平台部" },
  { id: "om3", name: "王芳", account: "wangfang", dept: "AI标注组" },
  { id: "om4", name: "赵强", account: "zhaoqiang", dept: "质量管理部" },
  { id: "om5", name: "孙丽", account: "sunli", dept: "AI标注组" },
  { id: "om6", name: "周杰", account: "zhoujie", dept: "数据平台部" },
  { id: "om7", name: "陈伟", account: "chenwei", dept: "项目验收组" },
  { id: "om8", name: "吴刚", account: "wugang", dept: "数据平台部" },
  { id: "om9", name: "刘洋", account: "liuyang", dept: "AI标注组" },
  { id: "om10", name: "黄敏", account: "huangmin", dept: "质量管理部" },
  { id: "om11", name: "许涛", account: "xutao", dept: "运维支持组" },
  { id: "om12", name: "何静", account: "hejing", dept: "数据平台部" },
];

/* ─── All admin candidates ─── */
const ALL_ADMIN_CANDIDATES = MOCK_ORG_MEMBERS.map(m => m.name);

interface SpaceTask {
  id: string; name: string; type: "数据处理" | "标注" | "清洗" | "特征提取" | "评测";
  progress: number; status: "运行中" | "等待中" | "已完成" | "失败";
  executor: string; startedAt: string; elapsed: string; route: string;
}

interface StorageResource {
  id: string; name: string; type: "MinIO" | "OSS" | "HDFS" | "NFS" | "S3";
  endpoint: string; bucket: string; usedSize: string; totalSize: string;
  usagePercent: number; isDefault: boolean; status: "在线" | "离线" | "迁移中";
}

interface MigrationDetail {
  id: string; datasetName: string; sourceStorage: string; targetStorage: string;
  progress: number; status: "迁移中" | "已完成" | "失败"; failReason?: string;
  fileCount: number; size: string;
}

/* ─── Mock Data ─── */
const MOCK_MEMBERS: SpaceMember[] = [
  { id: "m1", name: "张明", account: "zhangming", roles: ["空间管理员"], joinedAt: "2025-08-12", status: "启用" },
  { id: "m2", name: "李华", account: "lihua", roles: ["数据工程师"], joinedAt: "2025-09-01", status: "启用" },
  { id: "m3", name: "王芳", account: "wangfang", roles: ["标注员"], joinedAt: "2025-09-15", status: "启用" },
  { id: "m4", name: "赵强", account: "zhaoqiang", roles: ["质检员"], joinedAt: "2025-10-01", status: "启用" },
  { id: "m5", name: "孙丽", account: "sunli", roles: ["标注员"], joinedAt: "2025-10-20", status: "停用" },
  { id: "m6", name: "周杰", account: "zhoujie", roles: ["数据工程师"], joinedAt: "2025-11-05", status: "启用" },
  { id: "m7", name: "陈伟", account: "chenwei", roles: ["验收员"], joinedAt: "2025-12-01", status: "启用" },
];

const SPACE_ROLES = ["空间管理员", "数据工程师", "标注员", "质检员", "验收员", "仲裁员", "观察员"];

const MOCK_TASKS: SpaceTask[] = [
  { id: "T001", name: "金融语料清洗流水线", type: "数据处理", progress: 72, status: "运行中", executor: "张明", startedAt: "2026-03-10 09:30", elapsed: "4h 20m", route: "/data-process/workflows" },
  { id: "T002", name: "医疗图像标注-批次A", type: "标注", progress: 45, status: "运行中", executor: "王芳", startedAt: "2026-03-10 10:00", elapsed: "3h 50m", route: "/data-annotation/tasks" },
  { id: "T003", name: "多模态特征提取", type: "特征提取", progress: 88, status: "运行中", executor: "李华", startedAt: "2026-03-09 14:00", elapsed: "18h 10m", route: "/data-process/feature-extract" },
  { id: "T004", name: "客服对话数据清洗", type: "清洗", progress: 100, status: "已完成", executor: "赵强", startedAt: "2026-03-08 08:00", elapsed: "6h 30m", route: "/data-process/workflows" },
  { id: "T005", name: "工业缺陷标注-批次C", type: "标注", progress: 15, status: "等待中", executor: "孙丽", startedAt: "—", elapsed: "—", route: "/data-annotation/tasks" },
  { id: "T006", name: "语音数据质量评测", type: "评测", progress: 60, status: "运行中", executor: "周杰", startedAt: "2026-03-10 11:15", elapsed: "2h 35m", route: "/data-process/quality" },
  { id: "T007", name: "翻译语料清洗V2", type: "数据处理", progress: 0, status: "失败", executor: "陈伟", startedAt: "2026-03-09 16:00", elapsed: "0h 12m", route: "/data-process/workflows" },
];

const MOCK_STORAGE: StorageResource[] = [
  { id: "st1", name: "MinIO-主存储", type: "MinIO", endpoint: "minio.internal:9000", bucket: "ai-platform-main", usedSize: "3.2TB", totalSize: "10TB", usagePercent: 32, isDefault: true, status: "在线" },
  { id: "st2", name: "OSS-备份存储", type: "OSS", endpoint: "oss-cn-beijing.aliyuncs.com", bucket: "ai-backup-bj", usedSize: "1.8TB", totalSize: "5TB", usagePercent: 36, isDefault: false, status: "在线" },
  { id: "st3", name: "HDFS-大数据存储", type: "HDFS", endpoint: "hdfs-namenode:8020", bucket: "/data/ai-platform", usedSize: "8.5TB", totalSize: "50TB", usagePercent: 17, isDefault: false, status: "在线" },
];

const STORAGE_TYPES = ["MinIO", "OSS", "HDFS", "NFS", "S3"];

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

/* ─── Multi-Select Admin Dropdown ─── */
function AdminMultiSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = ALL_ADMIN_CANDIDATES.filter(n => n.includes(search));

  const toggle = (name: string) => {
    if (name === CURRENT_USER && selected.includes(name)) return; // can't remove self
    onChange(selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name]);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="min-h-[32px] flex flex-wrap items-center gap-1 px-2 py-1 border rounded-md bg-background cursor-pointer"
        onClick={() => setOpen(!open)}>
        {selected.length === 0 && <span className="text-sm text-muted-foreground">选择管理员...</span>}
        {selected.map(n => (
          <span key={n} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
            {n}
            {n !== CURRENT_USER && (
              <button onClick={e => { e.stopPropagation(); toggle(n); }} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 border rounded-md bg-popover shadow-md max-h-48 overflow-hidden">
          <div className="p-1.5 border-b">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..."
              className="w-full h-7 px-2 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div className="max-h-36 overflow-y-auto p-1">
            {filtered.map(n => (
              <button key={n} onClick={() => toggle(n)}
                className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/50 text-left",
                  selected.includes(n) && "bg-primary/5")}>
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                  selected.includes(n) ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                  {selected.includes(n) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <span>{n}</span>
                {n === CURRENT_USER && <span className="text-[10px] text-muted-foreground ml-auto">(当前用户)</span>}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">无匹配结果</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Tab 1: Space Info ═══════════════ */
function SpaceInfoTab({ space, onUpdate }: { space: SpaceData; onUpdate: (s: SpaceData) => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", status: "", storageLocation: "", admins: [] as string[] });

  useEffect(() => {
    setForm({
      name: space.name,
      desc: space.desc || "",
      status: space.status,
      storageLocation: space.storageLocation || "MinIO-主存储",
      admins: space.admins || [space.admin],
    });
  }, [space]);

  const save = () => {
    if (form.name.trim().length < 2) { toast({ title: "空间名称至少2个字符", variant: "destructive" }); return; }
    if (form.admins.length === 0) { toast({ title: "至少保留一个空间管理员", variant: "destructive" }); return; }
    onUpdate({ ...space, ...form, admin: form.admins[0] });
    setEditing(false);
    toast({ title: "空间信息已更新" });
  };

  const runningTasks = MOCK_TASKS.filter(t => t.status === "运行中").length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "存储使用率", value: space.storage, sub: "已使用 / 10TB", color: "text-primary" },
          { label: "运行中任务", value: `${runningTasks}`, sub: "进行中的数据处理任务", color: "text-orange-600 dark:text-orange-400" },
          { label: "空间成员", value: `${space.members}`, sub: "活跃成员", color: "text-green-600 dark:text-green-400" },
        ].map(c => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className={cn("text-2xl font-bold", c.color)}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold text-foreground">基本信息</h3>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-7 gap-1 text-xs">
              <Edit className="w-3 h-3" />编辑
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-7 gap-1 text-xs">
                <X className="w-3 h-3" />取消
              </Button>
              <Button size="sm" onClick={save} className="h-7 gap-1 text-xs">
                <Save className="w-3 h-3" />保存
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "空间ID", value: space.id },
              { label: "空间标识", value: space.identifier },
              { label: "空间类型", value: space.type },
              { label: "所属组织", value: space.org },
              { label: "创建人", value: space.admin },
              { label: "创建时间", value: space.createdAt },
              { label: "更新时间", value: space.updatedAt || "—" },
              { label: "最后更新人", value: space.updatedBy || "—" },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                <p className="text-sm text-foreground">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">空间名称</label>
              {editing ? (
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
              ) : (
                <p className="text-sm text-foreground">{space.name}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">描述</label>
              {editing ? (
                <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none" rows={2} maxLength={300} />
              ) : (
                <p className="text-sm text-foreground">{space.desc || "暂无描述"}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">状态</label>
                {editing ? (
                  <div className="flex gap-3">
                    {["启用", "停用"].map(s => (
                      <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" checked={form.status === s} onChange={() => setForm({ ...form, status: s })} className="accent-primary" />{s}
                      </label>
                    ))}
                  </div>
                ) : (
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                    space.status === "启用" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>{space.status}</span>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">存储位置</label>
                {editing ? (
                  <select value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })}
                    className="h-8 px-3 text-sm border rounded-md bg-background w-full">
                    {MOCK_STORAGE.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-foreground">{space.storageLocation || "MinIO-主存储"}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">空间管理员</label>
                {editing ? (
                  <AdminMultiSelect selected={form.admins} onChange={admins => setForm({ ...form, admins })} />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(space.admins || [space.admin]).map(a => (
                      <span key={a} className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Tab 2: Permissions ═══════════════ */
function PermissionsTab({ space }: { space: SpaceData }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<SpaceMember[]>(MOCK_MEMBERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [roleTarget, setRoleTarget] = useState<SpaceMember | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  // Add member form
  const [addName, setAddName] = useState("");
  const [addAccount, setAddAccount] = useState("");
  const [addRole, setAddRole] = useState(SPACE_ROLES[1]);

  // Role edit
  const [editRole, setEditRole] = useState("");

  const filtered = members.filter(m => {
    if (search && !m.name.includes(search) && !m.account.includes(search)) return false;
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    return true;
  });

  const handleAdd = () => {
    if (!addName.trim() || !addAccount.trim()) { toast({ title: "请填写完整信息", variant: "destructive" }); return; }
    setMembers(prev => [...prev, { id: `m${Date.now()}`, name: addName, account: addAccount, role: addRole, joinedAt: new Date().toISOString().slice(0, 10), status: "启用" }]);
    toast({ title: `成员「${addName}」已添加` });
    setAddName(""); setAddAccount(""); setShowAdd(false);
  };

  const handleRemove = (m: SpaceMember) => {
    setConfirmDialog({
      title: "移除成员",
      desc: `确认将「${m.name}」从空间中移除吗？移除后该成员将无法访问本空间的资源。`,
      onConfirm: () => { setMembers(prev => prev.filter(x => x.id !== m.id)); toast({ title: `成员「${m.name}」已移除` }); },
    });
  };

  const handleRoleSave = () => {
    if (!roleTarget || !editRole) return;
    setMembers(prev => prev.map(m => m.id === roleTarget.id ? { ...m, role: editRole } : m));
    toast({ title: `「${roleTarget.name}」角色已更新为「${editRole}」` });
    setRoleTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Filter + Add */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索成员..."
              className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 px-3 text-sm border rounded-md bg-muted/30">
            <option value="all">全部角色</option>
            {SPACE_ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setShowAdd(true)} className="h-9 gap-1.5 text-xs">
            <UserPlus className="w-3.5 h-3.5" />新增成员
          </Button>
        </div>
      </div>

      {/* Role stats */}
      <div className="flex gap-3 flex-wrap">
        {SPACE_ROLES.filter(r => members.some(m => m.role === r)).map(r => (
          <div key={r} className="px-3 py-1.5 rounded-lg border bg-card text-xs">
            <span className="text-muted-foreground">{r}</span>
            <span className="ml-2 font-semibold text-foreground">{members.filter(m => m.role === r).length}</span>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["姓名", "账号", "角色", "加入时间", "状态", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium">{m.name}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{m.account}</td>
                <td className="py-3 px-4"><span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">{m.role}</span></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{m.joinedAt}</td>
                <td className="py-3 px-4">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                    m.status === "启用" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>{m.status}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-muted/50" title="编辑角色" onClick={() => { setRoleTarget(m); setEditRole(m.role); }}>
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted/50" title="移除" onClick={() => handleRemove(m)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">暂无成员数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAdd} onOpenChange={v => !v && setShowAdd(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>新增空间成员</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">姓名 <span className="text-destructive">*</span></label>
              <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="成员姓名" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">账号 <span className="text-destructive">*</span></label>
              <Input value={addAccount} onChange={e => setAddAccount(e.target.value)} placeholder="成员账号" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">角色</label>
              <select value={addRole} onChange={e => setAddRole(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {SPACE_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog open={!!roleTarget} onOpenChange={v => !v && setRoleTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>编辑角色 - {roleTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {SPACE_ROLES.map(r => (
              <label key={r} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                <input type="radio" checked={editRole === r} onChange={() => setEditRole(r)} className="accent-primary" />{r}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>取消</Button>
            <Button onClick={handleRoleSave}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog && <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />}
    </div>
  );
}

/* ═══════════════ Tab 3: Task Progress ═══════════════ */
function TaskProgressTab() {
  const tasksByType = MOCK_TASKS.reduce((acc, t) => {
    (acc[t.type] = acc[t.type] || []).push(t);
    return acc;
  }, {} as Record<string, SpaceTask[]>);

  const statusColor = (s: string) => {
    switch (s) {
      case "运行中": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "已完成": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "等待中": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "失败": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const progressColor = (p: number, s: string) => {
    if (s === "失败") return "bg-red-500";
    if (p >= 80) return "bg-green-500";
    if (p >= 40) return "bg-blue-500";
    return "bg-yellow-500";
  };

  // Stats
  const running = MOCK_TASKS.filter(t => t.status === "运行中").length;
  const waiting = MOCK_TASKS.filter(t => t.status === "等待中").length;
  const completed = MOCK_TASKS.filter(t => t.status === "已完成").length;
  const failed = MOCK_TASKS.filter(t => t.status === "失败").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "运行中", value: running, color: "text-blue-600 dark:text-blue-400" },
          { label: "等待中", value: waiting, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "已完成", value: completed, color: "text-green-600 dark:text-green-400" },
          { label: "失败", value: failed, color: "text-red-600 dark:text-red-400" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grouped by type */}
      {Object.entries(tasksByType).map(([type, tasks]) => (
        <div key={type} className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground">{type} <span className="text-muted-foreground font-normal">({tasks.length})</span></h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                {["任务名称", "进度", "状态", "执行人", "开始时间", "耗时", "操作"].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-2.5 px-4 font-medium text-foreground">{t.name}</td>
                  <td className="py-2.5 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", progressColor(t.progress, t.status))}
                          style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{t.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4"><span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", statusColor(t.status))}>{t.status}</span></td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{t.executor}</td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{t.startedAt}</td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{t.elapsed}</td>
                  <td className="py-2.5 px-4">
                    <button className="p-1 rounded hover:bg-muted/50" title="查看任务">
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ Tab 4: Resources & Quotas ═══════════════ */
function ResourcesTab() {
  const { toast } = useToast();
  const [storages, setStorages] = useState<StorageResource[]>(MOCK_STORAGE);
  const [showAddStorage, setShowAddStorage] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);
  const [editTarget, setEditTarget] = useState<StorageResource | null>(null);

  // Add storage form
  const [addForm, setAddForm] = useState({ name: "", type: "MinIO" as string, endpoint: "", bucket: "", accessKey: "", secretKey: "", totalSize: "1TB" });
  const [testResult, setTestResult] = useState<"idle" | "testing" | "success" | "fail">("idle");

  // Delete with migration
  const [deleteTarget, setDeleteTarget] = useState<StorageResource | null>(null);
  const [deleteMode, setDeleteMode] = useState<"direct" | "migrate">("direct");
  const [migrateTarget, setMigrateTarget] = useState("");
  const [showMigration, setShowMigration] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationDetails, setMigrationDetails] = useState<MigrationDetail[]>([]);

  const runConnTest = () => {
    setTestResult("testing");
    setTimeout(() => setTestResult(addForm.endpoint ? "success" : "fail"), 1500);
  };

  const handleAddStorage = () => {
    if (!addForm.name || !addForm.endpoint) { toast({ title: "请填写必填项", variant: "destructive" }); return; }
    const newSt: StorageResource = {
      id: `st${Date.now()}`, name: addForm.name, type: addForm.type as any,
      endpoint: addForm.endpoint, bucket: addForm.bucket,
      usedSize: "0GB", totalSize: addForm.totalSize, usagePercent: 0,
      isDefault: false, status: "在线",
    };
    setStorages(prev => [...prev, newSt]);
    toast({ title: `存储「${addForm.name}」已添加` });
    setShowAddStorage(false);
    setAddForm({ name: "", type: "MinIO", endpoint: "", bucket: "", accessKey: "", secretKey: "", totalSize: "1TB" });
    setTestResult("idle");
  };

  const handleSetDefault = (id: string) => {
    setStorages(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
    toast({ title: "默认存储已更新" });
  };

  const handleDeleteStorage = (s: StorageResource) => {
    setDeleteTarget(s);
    setDeleteMode("direct");
    setMigrateTarget(storages.find(x => x.id !== s.id)?.id || "");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteMode === "migrate") {
      // Start migration
      setShowMigration(true);
      const details: MigrationDetail[] = [
        { id: "mg1", datasetName: "中文情感分析训练集", sourceStorage: deleteTarget.name, targetStorage: storages.find(s => s.id === migrateTarget)?.name || "", progress: 0, status: "迁移中", fileCount: 12350, size: "2.4GB" },
        { id: "mg2", datasetName: "医疗影像CT扫描数据集", sourceStorage: deleteTarget.name, targetStorage: storages.find(s => s.id === migrateTarget)?.name || "", progress: 0, status: "迁移中", fileCount: 50000, size: "45.8GB" },
        { id: "mg3", datasetName: "多语种平行翻译语料", sourceStorage: deleteTarget.name, targetStorage: storages.find(s => s.id === migrateTarget)?.name || "", progress: 0, status: "迁移中", fileCount: 2000000, size: "8.1GB" },
      ];
      setMigrationDetails(details);
      setMigrationProgress(0);
      // Simulate progress
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) { p = 100; clearInterval(interval); }
        setMigrationProgress(Math.min(100, Math.round(p)));
        setMigrationDetails(prev => prev.map((d, i) => ({
          ...d,
          progress: Math.min(100, Math.round(p + (i * -10))),
          status: Math.min(100, Math.round(p + (i * -10))) >= 100 ? "已完成" : "迁移中",
        })));
      }, 800);
      setDeleteTarget(null);
    } else {
      setStorages(prev => prev.filter(x => x.id !== deleteTarget.id));
      toast({ title: `存储「${deleteTarget.name}」已删除` });
      setDeleteTarget(null);
    }
  };

  const totalMigrationData = "56.3GB";
  const totalMigrationFiles = 2062350;

  return (
    <div className="space-y-5">
      {/* Migration progress view */}
      {showMigration && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Loader2 className={cn("w-4 h-4", migrationProgress < 100 ? "animate-spin text-primary" : "text-green-500")} />
              数据迁移{migrationProgress >= 100 ? "完成" : "中"}
            </h3>
            {migrationProgress >= 100 && (
              <Button variant="outline" size="sm" onClick={() => setShowMigration(false)} className="h-7 text-xs">关闭</Button>
            )}
          </div>

          {/* Migration stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "迁移数据集", value: `${migrationDetails.length}`, color: "text-primary" },
              { label: "已同步文件数", value: `${Math.round(totalMigrationFiles * migrationProgress / 100).toLocaleString()}`, color: "text-blue-600 dark:text-blue-400" },
              { label: "迁移数据总量", value: totalMigrationData, color: "text-foreground" },
              { label: "预计剩余时间", value: migrationProgress >= 100 ? "已完成" : `${Math.round((100 - migrationProgress) * 0.3)}min`, color: "text-orange-600 dark:text-orange-400" },
            ].map(c => (
              <div key={c.label} className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={cn("text-xl font-bold", c.color)}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">总体进度</span>
              <span className="text-sm font-bold text-primary">{migrationProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", migrationProgress >= 100 ? "bg-green-500" : "bg-primary")}
                style={{ width: `${migrationProgress}%` }} />
            </div>
          </div>

          {/* Migration details table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["数据集", "原存储", "目标存储", "文件数", "数据量", "进度", "状态", "失败原因"].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {migrationDetails.map(d => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium">{d.datasetName}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{d.sourceStorage}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{d.targetStorage}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{d.fileCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{d.size}</td>
                    <td className="py-2.5 px-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full", d.status === "已完成" ? "bg-green-500" : d.status === "失败" ? "bg-red-500" : "bg-primary")}
                            style={{ width: `${Math.max(0, d.progress)}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.max(0, d.progress)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                        d.status === "已完成" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        d.status === "失败" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>{d.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.failReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storage list */}
      {!showMigration && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">存储资源</h3>
            <Button size="sm" onClick={() => setShowAddStorage(true)} className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />新增存储
            </Button>
          </div>

          <div className="grid gap-4">
            {storages.map(s => (
              <div key={s.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{s.name}</span>
                        {s.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" />默认
                          </span>
                        )}
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                          s.status === "在线" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>{s.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.type} · {s.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!s.isDefault && (
                      <button className="p-1.5 rounded hover:bg-muted/50 text-xs text-muted-foreground hover:text-primary" title="设为默认" onClick={() => handleSetDefault(s.id)}>
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button className="p-1.5 rounded hover:bg-muted/50" title="编辑" onClick={() => setEditTarget(s)}>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50" title="删除" onClick={() => handleDeleteStorage(s)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">已用 {s.usedSize} / {s.totalSize}</span>
                      <span className="text-xs font-medium text-foreground">{s.usagePercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all",
                        s.usagePercent > 80 ? "bg-red-500" : s.usagePercent > 50 ? "bg-yellow-500" : "bg-primary"
                      )} style={{ width: `${s.usagePercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Bucket: {s.bucket}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Storage Dialog */}
      <Dialog open={showAddStorage} onOpenChange={v => { if (!v) { setShowAddStorage(false); setTestResult("idle"); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>新增存储</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">存储名称 <span className="text-destructive">*</span></label>
              <Input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="例：OSS-华东存储" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">存储类型</label>
              <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })}
                className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {STORAGE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">端点地址 <span className="text-destructive">*</span></label>
              <Input value={addForm.endpoint} onChange={e => setAddForm({ ...addForm, endpoint: e.target.value })} placeholder="例：oss-cn-shanghai.aliyuncs.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Bucket / 路径</label>
              <Input value={addForm.bucket} onChange={e => setAddForm({ ...addForm, bucket: e.target.value })} placeholder="例：my-data-bucket" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Access Key</label>
                <Input value={addForm.accessKey} onChange={e => setAddForm({ ...addForm, accessKey: e.target.value })} type="password" placeholder="••••••" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Secret Key</label>
                <Input value={addForm.secretKey} onChange={e => setAddForm({ ...addForm, secretKey: e.target.value })} type="password" placeholder="••••••" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">总容量</label>
              <Input value={addForm.totalSize} onChange={e => setAddForm({ ...addForm, totalSize: e.target.value })} placeholder="例：10TB" />
            </div>

            {/* Connectivity test */}
            <div className="border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">连通性测试</span>
                <Button variant="outline" size="sm" onClick={runConnTest} disabled={testResult === "testing"} className="h-7 gap-1 text-xs">
                  {testResult === "testing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube2 className="w-3 h-3" />}
                  {testResult === "testing" ? "测试中..." : "开始测试"}
                </Button>
              </div>
              {testResult === "success" && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <Check className="w-3.5 h-3.5" />连接成功
                </div>
              )}
              {testResult === "fail" && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />连接失败，请检查配置
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddStorage(false); setTestResult("idle"); }}>取消</Button>
            <Button onClick={handleAddStorage}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Storage Dialog */}
      <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>编辑存储 - {editTarget?.name}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">存储名称</label>
                <Input defaultValue={editTarget.name} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">端点地址</label>
                <Input defaultValue={editTarget.endpoint} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Bucket / 路径</label>
                <Input defaultValue={editTarget.bucket} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">总容量</label>
                <Input defaultValue={editTarget.totalSize} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button onClick={() => { toast({ title: "存储配置已更新" }); setEditTarget(null); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Storage Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>删除存储 - {deleteTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              该存储当前已使用 <span className="font-medium text-foreground">{deleteTarget?.usedSize}</span>，请选择处理方式：
            </p>
            <div className="space-y-2">
              <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                <input type="radio" checked={deleteMode === "direct"} onChange={() => setDeleteMode("direct")} className="accent-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">直接删除</p>
                  <p className="text-xs text-muted-foreground">立即删除存储及其所有数据，此操作不可恢复</p>
                </div>
              </label>
              <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                <input type="radio" checked={deleteMode === "migrate"} onChange={() => setDeleteMode("migrate")} className="accent-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">迁移数据后删除</p>
                  <p className="text-xs text-muted-foreground">先将数据迁移到其他存储，迁移完成后自动删除</p>
                </div>
              </label>
            </div>
            {deleteMode === "migrate" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">目标存储</label>
                <select value={migrateTarget} onChange={e => setMigrateTarget(e.target.value)}
                  className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                  {storages.filter(s => s.id !== deleteTarget?.id).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.totalSize} - 已用 {s.usedSize})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {deleteMode === "migrate" ? "开始迁移" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog && <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />}
    </div>
  );
}

/* ═══════════════ Main Space Detail ═══════════════ */
const TABS = ["空间信息", "权限管理", "任务进度监控", "资源与配额管理"];

export default function ConsoleSpaceDetail({ space: initialSpace, onBack }: {
  space: SpaceData;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [space, setSpace] = useState<SpaceData>({
    ...initialSpace,
    desc: initialSpace.desc || "暂无描述",
    updatedAt: "2026-03-10",
    updatedBy: initialSpace.admin,
    storageLocation: "MinIO-主存储",
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{space.name}</h1>
          <p className="text-xs text-muted-foreground">{space.identifier} · {space.type}</p>
        </div>
        <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
          space.status === "启用" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>{space.status}</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={cn("px-4 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === i ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <SpaceInfoTab space={space} onUpdate={setSpace} />}
      {activeTab === 1 && <PermissionsTab space={space} />}
      {activeTab === 2 && <TaskProgressTab />}
      {activeTab === 3 && <ResourcesTab />}
    </div>
  );
}

import { useState, useCallback } from "react";
import { ArrowLeft, Plus, Search, RotateCcw, Eye, Download, Upload, Trash2, Share2, Sparkles, Tag, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface KVTag { key: string; value: string }

interface DatasetVersion {
  id: string;
  version: string;
  fileCount: number;
  size: string;
  tags: KVTag[];
  annotationStatus: "未标注" | "标注中" | "已标注";
  cleanStatus: "未清洗" | "清洗中" | "已清洗";
  publishStatus: "未发布" | "已发布";
  creator: string;
  createdAt: string;
  updatedAt: string;
  status: "可用" | "创建中" | "导入中";
}

interface DatasetInfo {
  id: string;
  name: string;
  modality: string;
  purpose: string;
  storageLocation: string;
  tags: KVTag[];
  scope: string;
}

/* ─── Mock Data ─── */
const MOCK_VERSIONS: DatasetVersion[] = [
  { id: "VER-001", version: "V3.0", fileCount: 12350, size: "2.4GB", tags: [{ key: "阶段", value: "生产" }], annotationStatus: "已标注", cleanStatus: "已清洗", publishStatus: "已发布", creator: "张明", createdAt: "2026-03-01", updatedAt: "2026-03-05", status: "可用" },
  { id: "VER-002", version: "V2.0", fileCount: 8200, size: "1.8GB", tags: [{ key: "阶段", value: "测试" }], annotationStatus: "已标注", cleanStatus: "已清洗", publishStatus: "未发布", creator: "张明", createdAt: "2026-02-15", updatedAt: "2026-02-20", status: "可用" },
  { id: "VER-003", version: "V1.0", fileCount: 5000, size: "1.1GB", tags: [], annotationStatus: "已标注", cleanStatus: "未清洗", publishStatus: "未发布", creator: "张明", createdAt: "2026-02-01", updatedAt: "2026-02-10", status: "可用" },
];

const PAGE_SIZES = [10, 20, 50];

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

/* ─── Tag Editor Dialog ─── */
function TagEditorDialog({ open, onClose, tags, onSave, title }: {
  open: boolean; onClose: () => void; tags: KVTag[]; onSave: (t: KVTag[]) => void; title: string;
}) {
  const [draft, setDraft] = useState<KVTag[]>([]);
  const { toast } = useToast();
  const handleOpen = () => setDraft(tags.map(t => ({ ...t })));
  const add = () => {
    if (draft.length >= 20) { toast({ title: "最多支持20个标签", variant: "destructive" }); return; }
    setDraft([...draft, { key: "", value: "" }]);
  };
  const remove = (i: number) => setDraft(draft.filter((_, idx) => idx !== i));
  const update = (i: number, f: "key" | "value", v: string) => { const n = [...draft]; n[i] = { ...n[i], [f]: v }; setDraft(n); };
  const save = () => { onSave(draft.filter(t => t.key.trim() && t.value.trim())); onClose(); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {draft.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="Key" value={t.key} onChange={e => update(i, "key", e.target.value)} className="flex-1 h-8 text-sm" />
              <Input placeholder="Value" value={t.value} onChange={e => update(i, "value", e.target.value)} className="flex-1 h-8 text-sm" />
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          ))}
          {draft.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无标签</p>}
        </div>
        <Button variant="outline" size="sm" onClick={add} className="w-full gap-1"><Plus className="w-3 h-3" />添加标签</Button>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={save}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Export Dialog ─── */
function ExportDialog({ open, onClose, version }: { open: boolean; onClose: () => void; version: string }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportRange, setExportRange] = useState("全量导出");
  const [exportMode, setExportMode] = useState("本地下载");
  const { toast } = useToast();
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>导出 {version}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">导出格式</label>
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
              {["CSV", "JSON", "ZIP"].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">导出范围</label>
            <div className="flex gap-3">
              {["全量导出", "按标签过滤", "按样本量过滤"].map(r => (
                <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={exportRange === r} onChange={() => setExportRange(r)} className="accent-primary" />{r}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">导出方式</label>
            <div className="flex gap-3">
              {["本地下载", "导出至指定存储"].map(m => (
                <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={exportMode === m} onChange={() => setExportMode(m)} className="accent-primary" />{m}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => { toast({ title: `${version} 导出任务已创建` }); onClose(); }}>开始导出</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Share Dialog ─── */
function ShareDialog({ open, onClose, version }: { open: boolean; onClose: () => void; version: string }) {
  const [shareType, setShareType] = useState("指定用户");
  const [perms, setPerms] = useState<string[]>(["读数据集"]);
  const [expiry, setExpiry] = useState("永久有效");
  const { toast } = useToast();
  const togglePerm = (p: string) => setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>分享 {version}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">分享对象类型</label>
            <div className="flex gap-3">
              {["指定用户", "指定空间角色", "空间内全体成员"].map(t => (
                <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={shareType === t} onChange={() => setShareType(t)} className="accent-primary" />{t}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">授权权限</label>
            <div className="flex gap-3">
              {["读数据集", "写数据集", "创建数据集版本"].map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={perms.includes(p)} onChange={() => togglePerm(p)} className="rounded accent-primary" />{p}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">有效期</label>
            <div className="flex gap-3">
              {["永久有效", "自定义有效期"].map(e => (
                <label key={e} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={expiry === e} onChange={() => setExpiry(e)} className="accent-primary" />{e}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => { toast({ title: `${version} 分享成功` }); onClose(); }}>确认分享</Button>
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
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-xs text-muted-foreground">共 {total} 条</span>
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }} className="px-2 py-1 text-xs border rounded bg-card">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}条/页</option>)}
        </select>
        <div className="flex gap-0.5">
          <button disabled={page <= 1} onClick={() => onPageChange(1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronsLeft className="w-3 h-3 mx-auto" /></button>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronLeft className="w-3 h-3 mx-auto" /></button>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronRight className="w-3 h-3 mx-auto" /></button>
          <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30"><ChevronsRight className="w-3 h-3 mx-auto" /></button>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          跳至<input value={jumpInput} onChange={e => setJumpInput(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && jump()} className="w-10 h-7 text-center text-xs border rounded bg-card" />页
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export default function DatasetVersionList({ dataset, onBack, onViewDetail, onCreateVersion }: {
  dataset: DatasetInfo;
  onBack: () => void;
  onViewDetail: (version: DatasetVersion, dataset: DatasetInfo) => void;
  onCreateVersion: (dataset: DatasetInfo, versions: DatasetVersion[]) => void;
}) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<DatasetVersion[]>(MOCK_VERSIONS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filterVersion, setFilterVersion] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);
  const [exportTarget, setExportTarget] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [tagEditTarget, setTagEditTarget] = useState<number | null>(null);

  const resetFilters = () => { setFilterVersion(""); setFilterCreator(""); setFilterDateFrom(undefined); setFilterDateTo(undefined); setPage(1); };

  const filtered = versions.filter(v => {
    if (filterVersion && !v.version.toLowerCase().includes(filterVersion.toLowerCase())) return false;
    if (filterCreator && !v.creator.includes(filterCreator)) return false;
    if (filterDateFrom && new Date(v.createdAt) < filterDateFrom) return false;
    if (filterDateTo && new Date(v.createdAt) > new Date(filterDateTo.getTime() + 86400000)) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const statusBadge = (s: string, color: string) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", color)}>{s}</span>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{dataset.name}</h1>
          <p className="text-xs text-muted-foreground">数据集版本管理</p>
        </div>
      </div>

      {/* Dataset Info Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">模态：</span>
            <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{dataset.modality}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">数据用途：</span>
            <span className="text-foreground">{dataset.purpose}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">存储位置：</span>
            <span className="text-foreground">{dataset.storageLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">可见范围：</span>
            <span className="text-foreground">{dataset.scope}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">标签：</span>
            {dataset.tags.length > 0 ? dataset.tags.map((t, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">{t.key}: {t.value}</span>
            )) : <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={filterVersion} onChange={e => { setFilterVersion(e.target.value); setPage(1); }}
              placeholder="搜索版本号..."
              className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative max-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={filterCreator} onChange={e => { setFilterCreator(e.target.value); setPage(1); }}
              placeholder="创建人..."
              className="w-full h-9 pl-8 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 px-3 text-sm border rounded-md bg-muted/30 flex items-center gap-2 min-w-[200px] hover:border-primary/50">
                {filterDateFrom ? (
                  <span className="text-foreground text-xs">{format(filterDateFrom, "yyyy-MM-dd")} ~ {filterDateTo ? format(filterDateTo, "yyyy-MM-dd") : "..."}</span>
                ) : <span className="text-muted-foreground">选择时间范围</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={filterDateFrom && filterDateTo ? { from: filterDateFrom, to: filterDateTo } : undefined}
                onSelect={r => { setFilterDateFrom(r?.from); setFilterDateTo(r?.to); setPage(1); }}
                numberOfMonths={2} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 gap-1.5 text-xs">
              <RotateCcw className="w-3 h-3" />重置
            </Button>
            <Button size="sm" onClick={() => onCreateVersion(dataset, versions)} className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />新增版本
            </Button>
          </div>
        </div>
      </div>

      {/* Version Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                {["版本", "文件数量", "大小", "标签", "标注状态", "清洗状态", "发布状态", "创建人", "创建时间", "更新时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((v, idx) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {v.version}
                      {v.status !== "可用" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{v.status}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{v.fileCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-muted-foreground">{v.size}</td>
                  <td className="py-3 px-3">
                    {v.tags.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">{v.tags.length}</span>
                        <button onClick={() => setTagEditTarget(versions.indexOf(v))} className="p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100">
                          <Edit className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setTagEditTarget(versions.indexOf(v))} className="text-xs text-muted-foreground hover:text-primary">+ 标签</button>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {statusBadge(v.annotationStatus,
                      v.annotationStatus === "已标注" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      v.annotationStatus === "标注中" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-muted text-muted-foreground"
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {statusBadge(v.cleanStatus,
                      v.cleanStatus === "已清洗" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      v.cleanStatus === "清洗中" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-muted text-muted-foreground"
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {statusBadge(v.publishStatus,
                      v.publishStatus === "已发布" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{v.creator}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{v.createdAt}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{v.updatedAt}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-0.5">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看" onClick={() => onViewDetail(v, dataset)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="导出" onClick={() => setExportTarget(v.version)}>
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="清洗" onClick={() => toast({ title: `${v.version} 清洗任务已创建` })}>
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="标注" onClick={() => toast({ title: `${v.version} 标注任务已创建` })}>
                        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="分享" onClick={() => setShareTarget(v.version)}>
                        <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="删除" onClick={() => setConfirmDialog({
                        title: "删除版本",
                        desc: `确认删除版本「${v.version}」吗？删除后版本内所有数据将无法恢复。`,
                        onConfirm: () => { setVersions(prev => prev.filter(x => x.id !== v.id)); toast({ title: "版本已删除" }); }
                      })}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={11} className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">暂无版本数据</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>

      {/* Dialogs */}
      {confirmDialog && <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />}
      {exportTarget && <ExportDialog open={!!exportTarget} onClose={() => setExportTarget(null)} version={exportTarget} />}
      {shareTarget && <ShareDialog open={!!shareTarget} onClose={() => setShareTarget(null)} version={shareTarget} />}
      {tagEditTarget !== null && (
        <TagEditorDialog open={tagEditTarget !== null} onClose={() => setTagEditTarget(null)}
          tags={versions[tagEditTarget]?.tags || []}
          onSave={t => { setVersions(prev => prev.map((v, i) => i === tagEditTarget ? { ...v, tags: t } : v)); setTagEditTarget(null); }}
          title="版本标签编辑" />
      )}
    </div>
  );
}

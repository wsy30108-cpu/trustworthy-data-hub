import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Search, RotateCcw, Edit, Trash2, Eye, X, Tag, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import DatasetCreateForm, { type DatasetEditData } from "./DatasetCreateForm";
import DatasetVersionList from "./DatasetVersionList";
import DatasetVersionCreate from "./DatasetVersionCreate";
import DatasetVersionDetail from "./DatasetVersionDetail";
import DatasetImportConfig from "./DatasetImportConfig";

/* ─── Types ─── */
interface KVTag { key: string; value: string }
interface Dataset {
  id: string; name: string; modality: string; purpose: string; type: string;
  scope: string; versions: number; latestVersion: string; size: string; files: number;
  tags: KVTag[]; status: string; creator: string; createdAt: string; updatedAt: string;
  desc?: string;
}
interface SubscribedDataset extends Dataset {
  publisher: string; subscribedAt: string; authLevel: "只读" | "读写";
  subscribedVersions: string[];
}
interface SharedDataset extends Dataset {
  sharer: string; sharedAt: string; authPerms: string[];
  sharedVersions: string[];
}

/* ─── Mock Data ─── */
const myDatasets: Dataset[] = [
  { id: "DS-001", name: "中文情感分析训练集", modality: "文本", purpose: "模型微调", type: "文本分类", scope: "空间内全体成员", versions: 3, latestVersion: "V3.0", size: "2.4GB", files: 12350, tags: [{ key: "语言", value: "中文" }, { key: "领域", value: "金融" }], status: "活跃", creator: "张明", createdAt: "2026-02-15", updatedAt: "2026-03-01" },
  { id: "DS-002", name: "医疗影像CT扫描数据集", modality: "图像", purpose: "预训练", type: "-", scope: "指定用户", versions: 5, latestVersion: "V5.0", size: "45.8GB", files: 50000, tags: [{ key: "领域", value: "医疗" }], status: "活跃", creator: "李芳", createdAt: "2026-01-20", updatedAt: "2026-02-28" },
  { id: "DS-003", name: "多语种平行翻译语料", modality: "文本", purpose: "预训练", type: "机器翻译", scope: "仅数据集所有者", versions: 2, latestVersion: "V2.0", size: "8.1GB", files: 2000000, tags: [{ key: "语言", value: "多语种" }], status: "活跃", creator: "王强", createdAt: "2026-02-01", updatedAt: "2026-03-03" },
  { id: "DS-004", name: "智能客服对话语料", modality: "文本", purpose: "模型微调", type: "对话生成", scope: "空间内全体成员", versions: 1, latestVersion: "V1.0", size: "1.2GB", files: 800000, tags: [{ key: "领域", value: "客服" }], status: "活跃", creator: "赵丽", createdAt: "2026-02-20", updatedAt: "2026-02-25" },
  { id: "DS-005", name: "工业缺陷检测图像集", modality: "图像", purpose: "模型微调", type: "-", scope: "指定空间角色", versions: 4, latestVersion: "V4.0", size: "23.5GB", files: 35000, tags: [{ key: "领域", value: "工业" }, { key: "标注", value: "已标注" }], status: "归档", creator: "孙伟", createdAt: "2025-12-10", updatedAt: "2026-01-15" },
  { id: "DS-006", name: "语音识别标注数据集", modality: "语音", purpose: "模型微调", type: "-", scope: "空间内全体成员", versions: 2, latestVersion: "V2.0", size: "12.3GB", files: 85000, tags: [{ key: "语言", value: "中文" }, { key: "采样率", value: "16kHz" }], status: "活跃", creator: "张明", createdAt: "2026-01-05", updatedAt: "2026-02-18" },
  { id: "DS-007", name: "跨模态图文对齐数据", modality: "跨模态", purpose: "预训练", type: "-", scope: "仅数据集所有者", versions: 1, latestVersion: "V1.0", size: "67.2GB", files: 120000, tags: [{ key: "类型", value: "图文对" }], status: "活跃", creator: "李芳", createdAt: "2026-03-01", updatedAt: "2026-03-08" },
];

const subscribedDatasets: SubscribedDataset[] = [
  { id: "DS-S001", name: "金融新闻语料库", modality: "文本", purpose: "预训练", type: "通用文本", scope: "只读", versions: 6, latestVersion: "V6.0", size: "15.2GB", files: 3200000, tags: [{ key: "领域", value: "金融" }, { key: "语言", value: "中文" }], status: "活跃", creator: "数据市场官方", createdAt: "2026-01-10", updatedAt: "2026-03-05", publisher: "数据市场官方", subscribedAt: "2026-02-01", authLevel: "只读", subscribedVersions: ["V3.0", "V2.0"] },
  { id: "DS-S002", name: "开源医学影像数据集", modality: "图像", purpose: "模型微调", type: "-", scope: "读写", versions: 3, latestVersion: "V3.0", size: "89.5GB", files: 75000, tags: [{ key: "领域", value: "医疗" }], status: "活跃", creator: "医疗AI实验室", createdAt: "2025-11-20", updatedAt: "2026-02-15", publisher: "医疗AI实验室", subscribedAt: "2026-01-15", authLevel: "读写", subscribedVersions: ["V3.0", "V1.0"] },
  { id: "DS-S003", name: "多语言翻译平行语料", modality: "文本", purpose: "预训练", type: "机器翻译", scope: "只读", versions: 8, latestVersion: "V8.0", size: "32.1GB", files: 5000000, tags: [{ key: "语言", value: "多语种" }], status: "活跃", creator: "NLP开放联盟", createdAt: "2025-10-01", updatedAt: "2026-03-02", publisher: "NLP开放联盟", subscribedAt: "2026-02-20", authLevel: "只读", subscribedVersions: ["V2.0"] },
];

const sharedDatasets: SharedDataset[] = [
  { id: "DS-H001", name: "内部标注训练集", modality: "文本", purpose: "模型微调", type: "文本 SFT", scope: "只读", versions: 2, latestVersion: "V2.0", size: "3.5GB", files: 45000, tags: [{ key: "部门", value: "AI中心" }], status: "活跃", creator: "王强", createdAt: "2026-01-25", updatedAt: "2026-03-01", sharer: "王强", sharedAt: "2026-02-10", authPerms: ["读数据集"], sharedVersions: ["V2.0"] },
  { id: "DS-H002", name: "产品图像分类数据集", modality: "图像", purpose: "模型微调", type: "-", scope: "可写", versions: 4, latestVersion: "V4.0", size: "18.7GB", files: 28000, tags: [{ key: "领域", value: "电商" }, { key: "标注", value: "已标注" }], status: "活跃", creator: "赵丽", createdAt: "2025-12-15", updatedAt: "2026-02-28", sharer: "赵丽 / 电商空间", sharedAt: "2026-01-20", authPerms: ["读数据集", "写数据集", "创建数据集版本"], sharedVersions: ["V3.0", "V2.0", "V1.0"] },
];

/* ─── Constants ─── */
const MODALITIES = ["文本", "图像", "语音", "视频", "表格", "跨模态"];
const AUTH_SCOPES_MINE = ["仅数据集所有者", "指定用户", "指定空间角色", "空间内全体成员"];
const AUTH_SCOPES_SUB = ["只读", "读写"];

// Tag tree structure: key -> values[]
const TAG_TREE: Record<string, string[]> = {
  "语言": ["中文", "多语种", "英文"],
  "领域": ["金融", "医疗", "客服", "工业", "电商"],
  "标注": ["已标注", "未标注"],
  "采样率": ["16kHz", "44.1kHz"],
  "类型": ["图文对", "文本对"],
  "部门": ["AI中心", "数据中心"],
};

const PAGE_SIZES = [10, 20, 50];

/* ─── Multi-check dropdown ─── */
function MultiCheckDropdown({ options, selected, onChange, placeholder, className }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full h-9 px-3 text-sm border rounded-md bg-muted/30 text-left flex items-center justify-between gap-1 hover:border-primary/50 transition-colors">
        {selected.length ? (
          <span className="text-foreground truncate">{selected.length}项已选</span>
        ) : <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[140px] bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map(o => (
            <label key={o} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded accent-primary w-3.5 h-3.5" />{o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tag Tree Multi-Select Dropdown ─── */
function TagTreeDropdown({ selected, onChange, className }: {
  selected: string[]; // stored as "key:value" pairs
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelect = (tagKey: string, tagValue: string) => {
    const id = `${tagKey}:${tagValue}`;
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const toggleSelectAll = (tagKey: string) => {
    const values = TAG_TREE[tagKey] || [];
    const allIds = values.map(v => `${tagKey}:${v}`);
    const allSelected = allIds.every(id => selected.includes(id));
    if (allSelected) {
      onChange(selected.filter(s => !allIds.includes(s)));
    } else {
      onChange([...selected.filter(s => !allIds.includes(s)), ...allIds]);
    }
  };

  // Filter tree by search
  const filteredTree = Object.entries(TAG_TREE).filter(([key, values]) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return key.toLowerCase().includes(s) || values.some(v => v.toLowerCase().includes(s));
  });

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full h-9 px-3 text-sm border rounded-md bg-muted/30 text-left flex items-center justify-between gap-1 hover:border-primary/50 transition-colors">
        {selected.length ? (
          <span className="text-foreground truncate">{selected.length}项已选</span>
        ) : <span className="text-muted-foreground">标签筛选</span>}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-[260px] bg-popover border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标签..."
                className="w-full h-8 pl-7 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredTree.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">无匹配标签</p>}
            {filteredTree.map(([tagKey, values]) => {
              const filteredValues = search ? values.filter(v => v.toLowerCase().includes(search.toLowerCase()) || tagKey.toLowerCase().includes(search.toLowerCase())) : values;
              const expanded = expandedKeys.includes(tagKey) || !!search;
              const allIds = filteredValues.map(v => `${tagKey}:${v}`);
              const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
              const someSelected = allIds.some(id => selected.includes(id));

              return (
                <div key={tagKey}>
                  <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer" onClick={() => toggleExpand(tagKey)}>
                    {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <div className="flex items-center gap-1.5 flex-1" onClick={e => { e.stopPropagation(); toggleSelectAll(tagKey); }}>
                      <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px]",
                        allSelected ? "bg-primary border-primary text-primary-foreground" : someSelected ? "bg-primary/30 border-primary" : "border-muted-foreground/40")}>
                        {allSelected && <Check className="w-2.5 h-2.5" />}
                        {someSelected && !allSelected && <span className="block w-1.5 h-0.5 bg-primary rounded" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{tagKey}</span>
                    </div>
                  </div>
                  {expanded && filteredValues.map(val => {
                    const id = `${tagKey}:${val}`;
                    const isSelected = selected.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-2 pl-8 pr-2 py-1.5 hover:bg-muted/50 cursor-pointer rounded text-sm">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(tagKey, val)} className="rounded accent-primary w-3.5 h-3.5" />
                        {val}
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tag Hover Card ─── */
function TagCell({ tags, onEdit }: { tags: KVTag[]; onEdit?: () => void }) {
  const [hover, setHover] = useState(false);
  if (!tags.length) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center gap-1.5 cursor-default">
        <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs font-medium">{tags.length}</span>
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity" title="编辑标签">
            <Edit className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {hover && (
        <div className="absolute z-40 left-0 top-full mt-1 bg-popover border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
          <div className="text-xs font-medium text-foreground mb-2">数据集标签</div>
          <div className="space-y-1">
            {tags.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium min-w-[50px]">{t.key}:</span>
                <span className="text-foreground">{t.value}</span>
              </div>
            ))}
          </div>
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
              <Edit className="w-3 h-3" />编辑标签
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tag Editor Dialog (key & value both required) ─── */
function TagEditorDialog({ open, onClose, tags, onSave }: {
  open: boolean; onClose: () => void; tags: KVTag[]; onSave: (t: KVTag[]) => void;
}) {
  const [draft, setDraft] = useState<KVTag[]>([]);
  const [errors, setErrors] = useState<{ key?: boolean; value?: boolean }[]>([]);
  const { toast } = useToast();
  useEffect(() => {
    if (open) {
      setDraft(tags.map(t => ({ ...t })));
      setErrors([]);
    }
  }, [open, tags]);
  const add = () => {
    if (draft.length >= 20) { toast({ title: "最多支持20个标签", variant: "destructive" }); return; }
    setDraft([...draft, { key: "", value: "" }]);
    setErrors([...errors, {}]);
  };
  const remove = (i: number) => {
    setDraft(draft.filter((_, idx) => idx !== i));
    setErrors(errors.filter((_, idx) => idx !== i));
  };
  const update = (i: number, f: "key" | "value", v: string) => {
    const n = [...draft]; n[i] = { ...n[i], [f]: v }; setDraft(n);
    const e = [...errors]; e[i] = { ...e[i], [f]: false }; setErrors(e);
  };
  const save = () => {
    // Validate all tags have both key and value
    const newErrors = draft.map(t => ({
      key: !t.key.trim(),
      value: !t.value.trim(),
    }));
    const hasErrors = newErrors.some(e => e.key || e.value);
    if (hasErrors) {
      setErrors(newErrors);
      toast({ title: "标签的键和值均为必填项", variant: "destructive" });
      return;
    }
    onSave(draft);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>编辑数据集标签</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {draft.map((t, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input placeholder="Key（必填）" value={t.key} onChange={e => update(i, "key", e.target.value)}
                    className={cn("h-8 text-sm", errors[i]?.key && "border-destructive")} />
                </div>
                <div className="flex-1">
                  <Input placeholder="Value（必填）" value={t.value} onChange={e => update(i, "value", e.target.value)}
                    className={cn("h-8 text-sm", errors[i]?.value && "border-destructive")} />
                </div>
                <button onClick={() => remove(i)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              {(errors[i]?.key || errors[i]?.value) && (
                <p className="text-xs text-destructive pl-1">
                  {errors[i]?.key && errors[i]?.value ? "标签键和值均不能为空" : errors[i]?.key ? "标签键不能为空" : "标签值不能为空"}
                </p>
              )}
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

/* ─── Import Version Dialog ─── */
function ImportVersionDialog({ open, onClose, dsName, authLevel }: {
  open: boolean; onClose: () => void; dsName: string; authLevel: string;
}) {
  const [version, setVersion] = useState("V1.0");
  const [targetDs, setTargetDs] = useState("");
  const [importMode, setImportMode] = useState<"copy" | "ref">("ref");
  const { toast } = useToast();
  const readOnly = authLevel === "只读";
  const submit = () => {
    toast({ title: `已将「${dsName}」${version} 以${importMode === "copy" ? "复制" : "引用"}方式导入` });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>导入版本 - {dsName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">选择源版本</label>
            <select value={version} onChange={e => setVersion(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-card">
              <option>V1.0</option><option>V2.0</option><option>V3.0</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">目标数据集</label>
            <Input value={targetDs} onChange={e => setTargetDs(e.target.value)} placeholder="输入目标数据集名称" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">导入方式</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={importMode === "ref"} onChange={() => setImportMode("ref")} className="accent-primary" />
                引用导入<span className="text-xs text-muted-foreground">（节省存储）</span>
              </label>
              <label className={cn("flex items-center gap-1.5 text-sm", readOnly ? "opacity-40 cursor-not-allowed" : "cursor-pointer")}>
                <input type="radio" checked={importMode === "copy"} onChange={() => !readOnly && setImportMode("copy")} disabled={readOnly} className="accent-primary" />
                复制导入<span className="text-xs text-muted-foreground">（占用存储）</span>
              </label>
            </div>
            {readOnly && <p className="text-xs text-destructive">当前授权为"只读"，仅支持引用导入</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}>确认导入</Button>
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
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
  }
  const deduped: (number | "...")[] = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) deduped.push("...");
    deduped.push(p);
  });
  const jump = () => {
    const n = parseInt(jumpInput);
    if (n >= 1 && n <= totalPages) { onPageChange(n); setJumpInput(""); }
  };
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
          跳至
          <input value={jumpInput} onChange={e => setJumpInput(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && jump()}
            className="w-10 h-7 text-center text-xs border rounded bg-card" />
          页
        </div>
      </div>
    </div>
  );
}

/* ─── Date Range Picker ─── */
function DateRangePicker({ from, to, onChange, placeholder }: {
  from: Date | undefined; to: Date | undefined; onChange: (f: Date | undefined, t: Date | undefined) => void; placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-9 px-3 text-sm border rounded-md bg-muted/30 text-left flex items-center gap-2 min-w-[200px] hover:border-primary/50 transition-colors">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {from ? (
            <span className="text-foreground">{format(from, "yyyy-MM-dd")} ~ {to ? format(to, "yyyy-MM-dd") : "..."}</span>
          ) : <span className="text-muted-foreground">{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={from && to ? { from, to } : undefined}
          onSelect={(range) => onChange(range?.from, range?.to)}
          numberOfMonths={2} className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}

/* ─── Active Filter Tags ─── */
function ActiveFilterTags({ filters, onRemove, onClear }: {
  filters: ReturnType<typeof defaultFilters>;
  onRemove: (key: string, value?: string) => void;
  onClear: () => void;
}) {
  const chips: { label: string; key: string; value?: string }[] = [];
  filters.modalities.forEach(m => chips.push({ label: `模态=${m}`, key: "modalities", value: m }));
  filters.scopes.forEach(s => chips.push({ label: `授权范围=${s}`, key: "scopes", value: s }));
  if (filters.dateFrom) chips.push({ label: `开始时间=${format(filters.dateFrom, "yyyy-MM-dd")}`, key: "dateFrom" });
  if (filters.dateTo) chips.push({ label: `结束时间=${format(filters.dateTo, "yyyy-MM-dd")}`, key: "dateTo" });
  filters.selectedTags.forEach(t => chips.push({ label: `标签=${t}`, key: "selectedTags", value: t }));
  if (filters.creator) chips.push({ label: `创建人=${filters.creator}`, key: "creator" });

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">已选筛选条件：</span>
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
          {c.label}
          <button onClick={() => onRemove(c.key, c.value)} className="hover:bg-primary/20 rounded p-0.5">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button onClick={onClear} className="text-xs text-destructive hover:underline flex items-center gap-0.5">
        <X className="w-3 h-3" />清空
      </button>
    </div>
  );
}

/* ─── Filter Bar (redesigned - single row with inline buttons) ─── */
function FilterBar({ tab, filters, setFilters, onReset, onAdd }: {
  tab: number; filters: ReturnType<typeof defaultFilters>; setFilters: (f: ReturnType<typeof defaultFilters>) => void; onReset: () => void; onAdd?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const timeLabel = tab === 0 ? "创建/更新时间" : tab === 1 ? "订购/更新时间" : "分享/更新时间";
  const creatorLabel = tab === 0 ? "创建人" : tab === 1 ? "发布方" : "分享方";
  const scopeOptions = tab === 0 ? AUTH_SCOPES_MINE : AUTH_SCOPES_SUB;

  const hasActiveFilters = filters.modalities.length > 0 || filters.scopes.length > 0 ||
    filters.dateFrom || filters.dateTo || filters.selectedTags.length > 0 || filters.creator || filters.name;

  const handleRemoveFilter = (key: string, value?: string) => {
    const next = { ...filters };
    if (key === "modalities" && value) next.modalities = next.modalities.filter(m => m !== value);
    else if (key === "scopes" && value) next.scopes = next.scopes.filter(s => s !== value);
    else if (key === "dateFrom") next.dateFrom = undefined;
    else if (key === "dateTo") next.dateTo = undefined;
    else if (key === "selectedTags" && value) next.selectedTags = next.selectedTags.filter(t => t !== value);
    else if (key === "creator") next.creator = "";
    setFilters(next);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Primary row: search + basic filters + buttons (all in one row) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })}
              placeholder="模糊搜索数据集名称..."
              className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
          </div>

          {/* Modality */}
          <MultiCheckDropdown options={MODALITIES} selected={filters.modalities}
            onChange={v => setFilters({ ...filters, modalities: v })} placeholder="模态 ∨ 全部" className="w-[130px]" />

          {/* Auth scope */}
          <MultiCheckDropdown options={scopeOptions} selected={filters.scopes}
            onChange={v => setFilters({ ...filters, scopes: v })} placeholder="授权范围 ∨ 全部" className="w-[150px]" />

          {/* Time */}
          <DateRangePicker from={filters.dateFrom} to={filters.dateTo}
            onChange={(f, t) => setFilters({ ...filters, dateFrom: f, dateTo: t })} placeholder={timeLabel} />

          {/* Advanced toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn("h-9 px-3 text-sm border rounded-md flex items-center gap-1.5 transition-colors shrink-0",
              showAdvanced ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30")}>
            <Filter className="w-3.5 h-3.5" />
            高级筛选
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Spacer to push buttons right */}
          <div className="flex-1" />

          {/* Reset button */}
          <Button variant="outline" size="sm" onClick={onReset}
            className={cn("h-9 gap-1.5 text-xs shrink-0", !hasActiveFilters && "opacity-50")} disabled={!hasActiveFilters}>
            <RotateCcw className="w-3 h-3" />重置
          </Button>

          {/* Create button */}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="h-9 gap-1.5 text-xs shrink-0">
              <Plus className="w-3.5 h-3.5" />新增数据集
            </Button>
          )}
        </div>

        {/* Advanced filters row */}
        {showAdvanced && (
          <div className="flex items-center gap-3 pt-2 border-t border-dashed">
            {/* Tag tree dropdown (single control replacing two inputs) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">标签</span>
              <TagTreeDropdown
                selected={filters.selectedTags}
                onChange={v => setFilters({ ...filters, selectedTags: v })}
                className="w-[180px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{creatorLabel}</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={filters.creator} onChange={e => setFilters({ ...filters, creator: e.target.value })}
                  placeholder="模糊搜索"
                  className="h-9 w-[140px] pl-8 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active filter tags */}
      <ActiveFilterTags filters={filters} onRemove={handleRemoveFilter} onClear={onReset} />
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ message, guide, onReset }: { message: string; guide: string; onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{message}</p>
      <p className="text-xs text-muted-foreground mb-3">{guide}</p>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5 text-xs">
          <RotateCcw className="w-3 h-3" />重置筛选
        </Button>
      )}
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */
const defaultFilters = () => ({ name: "", modalities: [] as string[], scopes: [] as string[], dateFrom: undefined as Date | undefined, dateTo: undefined as Date | undefined, selectedTags: [] as string[], creator: "" });

const DataManagementDatasets = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState(defaultFilters());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sub-page navigation
  type SubPage = "list" | "versionList" | "versionCreate" | "versionDetail" | "importConfig";
  const [subPage, setSubPage] = useState<SubPage>("list");
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [currentVersions, setCurrentVersions] = useState<any[]>([]);

  // Data states
  const [myDs, setMyDs] = useState<Dataset[]>(myDatasets);
  const [subDs, setSubDs] = useState<SubscribedDataset[]>(subscribedDatasets);
  const [shareDs, setShareDs] = useState<SharedDataset[]>(sharedDatasets);

  // Dialogs
  const [tagEditTarget, setTagEditTarget] = useState<{ idx: number; tab: number } | null>(null);
  const [importTarget, setImportTarget] = useState<{ name: string; authLevel: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  const resetFilters = () => { setFilters(defaultFilters()); setPage(1); };

  // Filter logic
  const applyFilters = useCallback(<T extends { name: string; modality: string; scope: string; tags: KVTag[]; creator?: string; createdAt?: string; updatedAt?: string }>(data: T[]): T[] => {
    return data.filter(d => {
      if (filters.name && !d.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.modalities.length && !filters.modalities.includes(d.modality)) return false;
      if (filters.scopes.length && !filters.scopes.includes(d.scope)) return false;
      // Tag tree filter: selectedTags are "key:value" pairs
      if (filters.selectedTags.length > 0) {
        const dTags = d.tags || [];
        const match = filters.selectedTags.some(st => {
          const [tk, tv] = st.split(":");
          return dTags.some(t => t.key === tk && t.value === tv);
        });
        if (!match) return false;
      }
      if (filters.creator) {
        const creatorField = (d as any).creator || (d as any).publisher || (d as any).sharer || "";
        if (!creatorField.toLowerCase().includes(filters.creator.toLowerCase())) return false;
      }
      if (filters.dateFrom && d.createdAt && new Date(d.createdAt) < filters.dateFrom) return false;
      if (filters.dateTo && d.updatedAt && new Date(d.updatedAt) > new Date(filters.dateTo.getTime() + 86400000)) return false;
      return true;
    });
  }, [filters]);

  // Build edit data from dataset
  const buildEditData = (ds: Dataset): DatasetEditData => ({
    id: ds.id, name: ds.name, desc: ds.desc || "", purpose: ds.purpose, modality: ds.modality,
    textType: ds.type !== "-" ? ds.type : "", dsTags: ds.tags, scope: ds.scope,
    selectedUsers: [], selectedRoles: [], authPerms: ["读数据集"],
    sysCatalogs: ["文本数据"], customCatalogs: [],
    version: ds.latestVersion, storageLocation: "系统默认存储", storageFormat: "Lance", versionDesc: "",
  });

  const buildDatasetInfo = (ds: Dataset) => ({
    id: ds.id, name: ds.name, modality: ds.modality, purpose: ds.purpose,
    storageLocation: "系统默认存储", tags: ds.tags, scope: ds.scope,
  });

  // Sub-page routing
  // Build permissions for version list based on source tab
  const buildVersionPermissions = () => {
    if (activeTab === 1) {
      // Subscribed dataset
      const sds = currentDataset as SubscribedDataset;
      return {
        source: 'subscribed' as const,
        canRead: true,
        canWrite: sds?.authLevel === "读写",
        canCreateVersion: false,
        visibleVersions: sds?.subscribedVersions,
      };
    }
    if (activeTab === 2) {
      // Shared dataset
      const shds = currentDataset as SharedDataset;
      const perms = shds?.authPerms || [];
      return {
        source: 'shared' as const,
        canRead: perms.includes("读数据集"),
        canWrite: perms.includes("写数据集"),
        canCreateVersion: perms.includes("创建数据集版本"),
        visibleVersions: shds?.sharedVersions,
      };
    }
    return { source: 'mine' as const, canRead: true, canWrite: true, canCreateVersion: true };
  };

  if (subPage === "versionList" && currentDataset) {
    const perms = buildVersionPermissions();
    return (
      <DatasetVersionList
        dataset={buildDatasetInfo(currentDataset)}
        permissions={perms}
        onBack={() => { setSubPage("list"); setCurrentDataset(null); }}
        onViewDetail={(ver, ds) => { setCurrentVersion(ver); setSubPage("versionDetail"); }}
        onCreateVersion={(ds, versions) => { setCurrentVersions(versions); setSubPage("versionCreate"); }}
      />
    );
  }

  if (subPage === "versionCreate" && currentDataset) {
    return (
      <DatasetVersionCreate
        dataset={buildDatasetInfo(currentDataset)}
        existingVersions={currentVersions.map((v: any) => v.version)}
        onBack={() => setSubPage("versionList")}
        onCreated={() => setSubPage("versionList")}
      />
    );
  }

  if (subPage === "versionDetail" && currentDataset && currentVersion) {
    return (
      <DatasetVersionDetail
        dataset={buildDatasetInfo(currentDataset)}
        version={{ version: currentVersion.version, publishStatus: currentVersion.publishStatus }}
        onBack={() => setSubPage("versionList")}
        onUpload={() => setSubPage("importConfig")}
      />
    );
  }

  if (subPage === "importConfig" && currentDataset && currentVersion) {
    return (
      <DatasetImportConfig
        dataset={{ id: currentDataset.id, name: currentDataset.name, modality: currentDataset.modality }}
        version={{ version: currentVersion.version }}
        onBack={() => setSubPage("versionDetail")}
        onComplete={() => setSubPage("versionDetail")}
      />
    );
  }

  // Create/Edit form
  if (showCreate || editTarget) {
    return (
      <DatasetCreateForm
        onBack={() => { setShowCreate(false); setEditTarget(null); }}
        onCreated={(ds: any) => {
          if (editTarget) {
            setMyDs(prev => prev.map(d => d.id === editTarget.id ? { ...d, ...ds, createdAt: d.createdAt } : d));
          } else {
            setMyDs(prev => [ds, ...prev]);
          }
          setShowCreate(false); setEditTarget(null); setActiveTab(0);
        }}
        editData={editTarget ? buildEditData(editTarget) : undefined}
      />
    );
  }

  // Paginate helper
  const paginate = <T,>(data: T[]) => {
    const start = (page - 1) * pageSize;
    return { items: data.slice(start, start + pageSize), total: data.length };
  };

  const tabs = ["我的数据集", "我订购的数据集", "分享给我的数据集"];

  const renderMyDatasets = () => {
    const filtered = applyFilters(myDs);
    const { items, total } = paginate(filtered);
    const noFiltersActive = !filters.name && !filters.modalities.length && !filters.scopes.length && !filters.dateFrom && !filters.selectedTags.length && !filters.creator;
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                {["数据集名称", "数据集ID", "模态", "数据集标签", "最新版本", "授权范围", "创建人", "创建时间", "更新时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((ds) => (
                <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3 font-medium max-w-[200px] truncate">
                    <button className="text-primary hover:underline" onClick={() => { setCurrentDataset(ds); setSubPage("versionList"); }}>{ds.name}</button>
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{ds.id}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{ds.modality}</span></td>
                  <td className="py-3 px-3">
                    <TagCell tags={ds.tags} onEdit={() => setTagEditTarget({ idx: myDs.indexOf(ds), tab: 0 })} />
                  </td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-primary hover:underline font-medium" onClick={() => { setCurrentDataset(ds); setCurrentVersion({ version: ds.latestVersion, publishStatus: "未知" }); setSubPage("versionDetail"); }}>
                      {ds.latestVersion}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground">{ds.scope}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.creator}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.createdAt}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.updatedAt}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="编辑" onClick={() => setEditTarget(ds)}>
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="删除" onClick={() => setConfirmDialog({
                        title: "删除数据集", desc: `确认删除「${ds.name}」吗？删除后数据将无法恢复。`,
                        onConfirm: () => { setMyDs(prev => prev.filter(d => d.id !== ds.id)); toast({ title: "数据集已删除" }); }
                      })}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={10}>
                  <EmptyState
                    message={noFiltersActive ? "暂无数据集" : "无匹配结果"}
                    guide={noFiltersActive ? "点击上方「新增数据集」按钮创建" : "请调整筛选条件重试"}
                    onReset={noFiltersActive ? undefined : resetFilters} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && <PaginationBar total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>
    );
  };

  const renderSubscribedDatasets = () => {
    const filtered = applyFilters(subDs);
    const { items, total } = paginate(filtered);
    if (subDs.length === 0) {
      return <div className="rounded-lg border bg-card"><EmptyState message="您还没有订购任何数据集" guide="前往「数据集市」或「数据集共享广场」浏览并订购数据集" /></div>;
    }
    const navigateToVersionList = (ds: SubscribedDataset) => {
      setCurrentDataset(ds);
      setSubPage("versionList");
    };
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                {["数据集名称", "数据集ID", "模态", "数据集标签", "最新版本", "授权范围", "发布方", "订购时间", "更新时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(ds => (
                <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3 font-medium max-w-[200px] truncate">
                    <button className="text-primary hover:underline" onClick={() => navigateToVersionList(ds)}>{ds.name}</button>
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{ds.id}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{ds.modality}</span></td>
                  <td className="py-3 px-3"><TagCell tags={ds.tags} /></td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-primary hover:underline font-medium" onClick={() => { setCurrentDataset(ds); setCurrentVersion({ version: ds.latestVersion, publishStatus: "未知" }); setSubPage("versionDetail"); }}>
                      {ds.latestVersion}
                    </button>
                  </td>
                  <td className="py-3 px-3"><span className={cn("px-1.5 py-0.5 rounded text-[10px]", ds.authLevel === "读写" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground")}>{ds.authLevel}</span></td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.publisher}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.subscribedAt}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.updatedAt}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情" onClick={() => navigateToVersionList(ds)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="取消订购" onClick={() => setConfirmDialog({
                        title: "取消订购", desc: `确认取消对「${ds.name}」的订购吗？取消后您将无法再查看和使用该数据集。`,
                        onConfirm: () => { setSubDs(prev => prev.filter(d => d.id !== ds.id)); toast({ title: "已取消订购" }); }
                      })}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={10}><EmptyState message="无匹配结果" guide="请调整筛选条件重试" onReset={resetFilters} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && <PaginationBar total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>
    );
  };

  const renderSharedDatasets = () => {
    const filtered = applyFilters(shareDs);
    const { items, total } = paginate(filtered);
    if (shareDs.length === 0) {
      return <div className="rounded-lg border bg-card"><EmptyState message="暂无分享给您的数据集" guide="联系同事或空间管理员，申请分享数据集" /></div>;
    }
    const navigateToVersionList = (ds: SharedDataset) => {
      setCurrentDataset(ds);
      setSubPage("versionList");
    };
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                {["数据集名称", "数据集ID", "模态", "数据集标签", "最新版本", "授权范围", "分享方", "分享时间", "更新时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(ds => (
                <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3 font-medium max-w-[200px] truncate">
                    <button className="text-primary hover:underline" onClick={() => navigateToVersionList(ds)}>{ds.name}</button>
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{ds.id}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{ds.modality}</span></td>
                  <td className="py-3 px-3"><TagCell tags={ds.tags} /></td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-primary hover:underline font-medium" onClick={() => { setCurrentDataset(ds); setCurrentVersion({ version: ds.latestVersion, publishStatus: "未知" }); setSubPage("versionDetail"); }}>
                      {ds.latestVersion}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {ds.authPerms.map(p => (
                        <span key={p} className={cn("px-1.5 py-0.5 rounded text-[10px]",
                          p === "创建数据集版本" ? "bg-primary/10 text-primary" :
                            p === "写数据集" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              "bg-accent text-accent-foreground"
                        )}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.sharer}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.sharedAt}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{ds.updatedAt}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情" onClick={() => navigateToVersionList(ds)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="取消接收" onClick={() => setConfirmDialog({
                        title: "取消接收分享", desc: `确认取消接收「${ds.name}」的分享吗？取消后您将无法再查看和使用该数据集。`,
                        onConfirm: () => { setShareDs(prev => prev.filter(d => d.id !== ds.id)); toast({ title: "已取消接收" }); }
                      })}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={10}><EmptyState message="无匹配结果" guide="请调整筛选条件重试" onReset={resetFilters} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && <PaginationBar total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>
    );
  };

  // Tag editor
  const getTagEditTags = (): KVTag[] => {
    if (!tagEditTarget) return [];
    if (tagEditTarget.tab === 0) return myDs[tagEditTarget.idx]?.tags || [];
    return [];
  };
  const handleTagSave = (newTags: KVTag[]) => {
    if (!tagEditTarget) return;
    if (tagEditTarget.tab === 0) {
      setMyDs(prev => prev.map((d, i) => i === tagEditTarget.idx ? { ...d, tags: newTags } : d));
    }
    setTagEditTarget(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据集管理</h1>
          <p className="page-description">管理您的数据集、订购的数据集和分享给您的数据集</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => { setActiveTab(i); setPage(1); resetFilters(); }}
            className={cn("px-4 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === i ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab}</button>
        ))}
      </div>

      {/* Filter Bar */}
      <FilterBar tab={activeTab} filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }}
        onReset={resetFilters} onAdd={activeTab === 0 ? () => setShowCreate(true) : undefined} />

      {/* Table */}
      {activeTab === 0 && renderMyDatasets()}
      {activeTab === 1 && renderSubscribedDatasets()}
      {activeTab === 2 && renderSharedDatasets()}

      {/* Tag Edit Dialog */}
      <TagEditorDialog open={!!tagEditTarget} onClose={() => setTagEditTarget(null)}
        tags={getTagEditTags()} onSave={handleTagSave} />

      {/* Import Version Dialog */}
      {importTarget && (
        <ImportVersionDialog open={!!importTarget} onClose={() => setImportTarget(null)}
          dsName={importTarget.name} authLevel={importTarget.authLevel} />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />
      )}
    </div>
  );
};

export default DataManagementDatasets;

import { useState } from "react";
import { ArrowLeft, Upload, FolderPlus, Trash2, Eye, Download, RotateCcw, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, File, Folder, AlertCircle, Check, Loader2, X, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface KVTag { key: string; value: string }
interface DatasetInfo { id: string; name: string; modality: string; purpose: string; storageLocation: string; tags: KVTag[]; scope: string; }
interface VersionInfo { version: string; publishStatus: string; }

type FileStatus = "导入中" | "导入失败" | "解析中" | "解析失败" | "导入完成";

interface FileItem {
  id: string;
  name: string;
  isFolder: boolean;
  size: string;
  status: FileStatus;
  statusMessage?: string;
  creator: string;
  createdAt: string;
  children?: FileItem[];
}

/* ─── Mock Data ─── */
const MOCK_FILES: FileItem[] = [
  { id: "f1", name: "training_data/", isFolder: true, size: "—", status: "导入完成", creator: "张明", createdAt: "2026-03-01", children: [
    { id: "f1-1", name: "batch_001.json", isFolder: false, size: "245MB", status: "导入完成", creator: "张明", createdAt: "2026-03-01" },
    { id: "f1-2", name: "batch_002.json", isFolder: false, size: "312MB", status: "导入完成", creator: "张明", createdAt: "2026-03-01" },
  ]},
  { id: "f2", name: "validation_data.jsonl", isFolder: false, size: "89MB", status: "导入完成", creator: "张明", createdAt: "2026-03-02" },
  { id: "f3", name: "test_samples.txt", isFolder: false, size: "12MB", status: "导入完成", creator: "李芳", createdAt: "2026-03-03" },
  { id: "f4", name: "metadata.json", isFolder: false, size: "2.1KB", status: "导入完成", creator: "张明", createdAt: "2026-03-01" },
  { id: "f5", name: "failed_import.csv", isFolder: false, size: "45MB", status: "导入失败", statusMessage: "CSV 编码格式不支持，请转换为 UTF-8 后重新上传", creator: "王强", createdAt: "2026-03-04" },
  { id: "f6", name: "parsing_data.xml", isFolder: false, size: "18MB", status: "解析中", creator: "张明", createdAt: "2026-03-05" },
];

const PAGE_SIZES = [10, 20, 50];
const FOLDER_NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/;

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
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── File Preview Dialog ─── */
function PreviewDialog({ open, onClose, file }: { open: boolean; onClose: () => void; file: FileItem | null }) {
  if (!file) return null;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const canPreview = ["txt", "json", "jsonl", "csv", "xml", "html"].includes(ext || "");

  const mockContent = ext === "json" ? `{
  "dataset": "训练集",
  "samples": [
    {"input": "这是一个测试文本", "label": "正面"},
    {"input": "服务质量很差", "label": "负面"},
    {"input": "产品性能一般", "label": "中性"}
  ],
  "version": "3.0",
  "created": "2026-03-01"
}` : ext === "txt" ? `样本1: 今天天气真好，心情不错。\n样本2: 这家餐厅的菜品质量下降了。\n样本3: 新发布的产品功能很强大。\n...(更多数据)` : "文件内容预览";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader><DialogTitle>查看数据 {file.name}</DialogTitle></DialogHeader>
        {canPreview ? (
          <div className="space-y-2">
            <pre className="p-4 rounded-lg bg-muted/50 text-sm font-mono overflow-auto max-h-[50vh] whitespace-pre-wrap">{mockContent}</pre>
            <p className="text-[11px] text-muted-foreground">仅支持预览 100KB 的文件内容，若需查看完整内容，可下载后在本地查看详情</p>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">当前文件格式不支持预览</p>
            <p className="text-xs mt-1">请下载后在本地查看</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Create Folder Dialog ─── */
function CreateFolderDialog({ open, onClose, onCreate, existingNames }: {
  open: boolean; onClose: () => void; onCreate: (name: string) => void; existingNames: string[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!name.trim()) { setError("请输入文件夹名称"); return false; }
    if (!FOLDER_NAME_REGEX.test(name)) { setError("仅支持中英文、数字、- 和 _"); return false; }
    if (name.length > 255) { setError("名称长度不可超过255字符"); return false; }
    if (existingNames.includes(name + "/")) { setError("文件夹名称已存在，请重新输入"); return false; }
    setError("");
    return true;
  };

  const submit = () => { if (validate()) { onCreate(name); setName(""); onClose(); } };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setName(""); setError(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>创建文件夹</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">文件夹名称 <span className="text-destructive">*</span></label>
          <Input value={name} onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="支持中英文、数字、- 和 _" maxLength={255} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setName(""); setError(""); }}>取消</Button>
          <Button onClick={submit}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Import Detail Dialog ─── */
function ImportDetailDialog({ open, onClose, file }: { open: boolean; onClose: () => void; file: FileItem | null }) {
  if (!file) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>导入详情 - {file.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">导入ID：</span><span className="font-mono text-xs">IMP-{file.id}</span></div>
            <div><span className="text-muted-foreground">导入方式：</span>本地导入</div>
            <div><span className="text-muted-foreground">文件大小：</span>{file.size}</div>
            <div><span className="text-muted-foreground">数据量：</span>{Math.floor(Math.random() * 10000)} 条</div>
            <div><span className="text-muted-foreground">开始时间：</span>{file.createdAt} 10:30</div>
            <div><span className="text-muted-foreground">结束时间：</span>{file.status === "导入中" || file.status === "解析中" ? "—" : `${file.createdAt} 10:45`}</div>
            <div><span className="text-muted-foreground">导入状态：</span>
              <span className={cn("font-medium",
                file.status === "导入完成" ? "text-green-600" :
                file.status.includes("失败") ? "text-destructive" : "text-blue-600"
              )}>{file.status}</span>
            </div>
          </div>
          {file.statusMessage && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs">
              <p className="font-medium mb-1">错误详情：</p>
              <p>{file.statusMessage}</p>
            </div>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>关闭</Button></DialogFooter>
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
      <span className="text-xs text-muted-foreground">共 {total} 个文件</span>
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground">跳至<input value={jumpInput} onChange={e => setJumpInput(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && jump()} className="w-10 h-7 text-center text-xs border rounded bg-card" />页</div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export default function DatasetVersionDetail({ dataset, version, onBack, onUpload }: {
  dataset: DatasetInfo;
  version: VersionInfo;
  onBack: () => void;
  onUpload: () => void;
}) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [importDetailFile, setImportDetailFile] = useState<FileItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Navigate folder
  const getCurrentFiles = (): FileItem[] => {
    let current = files;
    for (const path of currentPath) {
      const folder = current.find(f => f.name === path);
      current = folder?.children || [];
    }
    return current;
  };

  const currentFiles = getCurrentFiles();
  const filteredFiles = currentFiles.filter(f => {
    if (searchName && !f.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterStatus && f.status !== filterStatus) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const pagedFiles = filteredFiles.slice(start, start + pageSize);

  // Stats
  const allFlat: FileItem[] = [];
  const flatten = (items: FileItem[]) => { items.forEach(f => { allFlat.push(f); if (f.children) flatten(f.children); }); };
  flatten(files);
  const totalFiles = allFlat.filter(f => !f.isFolder).length;
  const completedFiles = allFlat.filter(f => !f.isFolder && f.status === "导入完成").length;
  const failedFiles = allFlat.filter(f => !f.isFolder && (f.status === "导入失败" || f.status === "解析失败")).length;

  // Selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === pagedFiles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pagedFiles.map(f => f.id)));
  };

  const selectedFailedCount = pagedFiles.filter(f => selectedIds.has(f.id) && (f.status === "导入失败" || f.status === "解析失败")).length;

  // Delete files
  const deleteFile = (file: FileItem) => {
    const removeFromList = (items: FileItem[]): FileItem[] => items.filter(f => f.id !== file.id).map(f => f.children ? { ...f, children: removeFromList(f.children) } : f);
    setFiles(removeFromList(files));
    toast({ title: `已删除${file.isFolder ? "文件夹" : "文件"}「${file.name}」` });
  };

  // Batch delete
  const batchDelete = () => {
    const ids = selectedIds;
    const removeFromList = (items: FileItem[]): FileItem[] => items.filter(f => !ids.has(f.id)).map(f => f.children ? { ...f, children: removeFromList(f.children) } : f);
    setFiles(removeFromList(files));
    setSelectedIds(new Set());
    toast({ title: `已批量删除 ${ids.size} 个文件` });
  };

  // Create folder
  const createFolder = (name: string) => {
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`, name: name + "/", isFolder: true,
      size: "—", status: "导入完成", creator: "当前用户", createdAt: new Date().toISOString().slice(0, 10), children: [],
    };
    if (currentPath.length === 0) {
      setFiles(prev => [newFolder, ...prev]);
    }
    toast({ title: `文件夹「${name}」创建成功` });
  };

  const statusIcon = (s: FileStatus) => {
    switch (s) {
      case "导入完成": return <Check className="w-3.5 h-3.5 text-green-600" />;
      case "导入中": case "解析中": return <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
      case "导入失败": case "解析失败": return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{dataset.name} / {version.version}</h1>
          <p className="text-xs text-muted-foreground">版本详情</p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div><span className="text-muted-foreground">模态：</span><span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{dataset.modality}</span></div>
          <div><span className="text-muted-foreground">用途：</span>{dataset.purpose}</div>
          <div><span className="text-muted-foreground">存储：</span>{dataset.storageLocation}</div>
          <div><span className="text-muted-foreground">范围：</span>{dataset.scope}</div>
          <div><span className="text-muted-foreground">文件数量：</span><span className="font-medium">{totalFiles}</span></div>
          <div><span className="text-muted-foreground">版本状态：</span>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
              version.publishStatus === "已发布" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>{version.publishStatus}</span>
          </div>
        </div>
        {/* Import stats */}
        {(failedFiles > 0 || completedFiles < totalFiles) && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            共计 <span className="font-medium text-foreground">{totalFiles}</span> 个文件需要导入，
            已完成 <span className="font-medium text-green-600">{completedFiles}</span> 个导入，
            失败 <span className="font-medium text-destructive">{failedFiles}</span> 个
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={onUpload} className="h-8 gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" />上传数据
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowCreateFolder(true)} className="h-8 gap-1.5 text-xs">
          <FolderPlus className="w-3.5 h-3.5" />创建文件夹
        </Button>
        {selectedIds.size > 1 && (
          <Button variant="outline" size="sm" onClick={() => setConfirmDialog({
            title: "批量删除", desc: `确认删除选中的 ${selectedIds.size} 个文件吗？删除后将无法恢复。`,
            onConfirm: batchDelete
          })} className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-3.5 h-3.5" />批量删除 ({selectedIds.size})
          </Button>
        )}
        {selectedFailedCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => { toast({ title: `${selectedFailedCount} 个文件重新导入任务已创建` }); setSelectedIds(new Set()); }}
            className="h-8 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />重新导入 ({selectedFailedCount})
          </Button>
        )}
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => toast({ title: version.publishStatus === "未发布" ? "发布任务已创建" : "更新发布成功" })}>
            {version.publishStatus === "未发布" ? "发布到数据集市" : "更新发布到数据集市"}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchName} onChange={e => { setSearchName(e.target.value); setPage(1); }}
            placeholder="搜索文件名..."
            className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm border rounded-md bg-muted/30">
          <option value="">全部状态</option>
          {["导入中", "导入失败", "解析中", "解析失败", "导入完成"].map(s => <option key={s}>{s}</option>)}
        </select>
        {/* Breadcrumb */}
        {currentPath.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => setCurrentPath([])} className="text-primary hover:underline">根目录</button>
            {currentPath.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                <button onClick={() => setCurrentPath(currentPath.slice(0, i + 1))} className="text-primary hover:underline">{p.replace("/", "")}</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* File Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="py-3 px-3 w-10">
                  <input type="checkbox" checked={pagedFiles.length > 0 && selectedIds.size === pagedFiles.length}
                    onChange={toggleSelectAll} className="rounded accent-primary" />
                </th>
                {["文件名称", "文件大小", "状态", "创建时间", "创建人", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedFiles.map(f => (
                <tr key={f.id} className="border-b last:border-0 hover:bg-muted/20 group">
                  <td className="py-3 px-3">
                    <input type="checkbox" checked={selectedIds.has(f.id)} onChange={() => toggleSelect(f.id)} className="rounded accent-primary" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {f.isFolder ? <Folder className="w-4 h-4 text-primary/70" /> : <File className="w-4 h-4 text-muted-foreground" />}
                      {f.isFolder ? (
                        <button className="font-medium text-primary hover:underline" onClick={() => setCurrentPath([...currentPath, f.name])}>{f.name}</button>
                      ) : (
                        <span className="text-foreground">{f.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{f.size}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 relative group/status">
                      {statusIcon(f.status)}
                      <span className={cn("text-xs",
                        f.status === "导入完成" ? "text-green-600" :
                        f.status.includes("失败") ? "text-destructive" : "text-blue-600"
                      )}>{f.status}</span>
                      {f.statusMessage && (
                        <div className="hidden group-hover/status:block absolute left-0 top-full mt-1 z-40 p-2 bg-popover border rounded-md shadow-lg max-w-[300px]">
                          <p className="text-xs text-destructive">{f.statusMessage}</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{f.createdAt}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{f.creator}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-0.5">
                      {!f.isFolder && f.status === "导入完成" && (
                        <>
                          <button className="p-1 rounded hover:bg-muted/50" title="预览" onClick={() => setPreviewFile(f)}>
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted/50" title="下载" onClick={() => toast({ title: `正在下载 ${f.name}` })}>
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </>
                      )}
                      {!f.isFolder && (f.status === "导入失败" || f.status === "解析失败") && (
                        <button className="p-1 rounded hover:bg-muted/50" title="重新上传" onClick={() => toast({ title: `${f.name} 重新导入任务已创建` })}>
                          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <button className="p-1 rounded hover:bg-muted/50" title="导入详情" onClick={() => setImportDetailFile(f)}>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="删除" onClick={() => setConfirmDialog({
                        title: f.isFolder ? "删除文件夹" : "删除文件",
                        desc: f.isFolder
                          ? `确认删除文件夹「${f.name}」吗？删除后文件夹将无法被恢复，文件夹下文件将被一并删除。`
                          : `确认删除文件「${f.name}」吗？删除后文件将无法被恢复。`,
                        onConfirm: () => deleteFile(f)
                      })}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedFiles.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                  {searchName || filterStatus ? "无匹配文件" : "暂无文件，点击「上传数据」添加"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredFiles.length > 0 && <PaginationBar total={filteredFiles.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      </div>

      {/* Dialogs */}
      {confirmDialog && <ConfirmDialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog.title} desc={confirmDialog.desc} onConfirm={confirmDialog.onConfirm} />}
      <PreviewDialog open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
      <ImportDetailDialog open={!!importDetailFile} onClose={() => setImportDetailFile(null)} file={importDetailFile} />
      <CreateFolderDialog open={showCreateFolder} onClose={() => setShowCreateFolder(false)}
        onCreate={createFolder} existingNames={currentFiles.filter(f => f.isFolder).map(f => f.name)} />
    </div>
  );
}

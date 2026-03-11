import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Play, Copy, Trash2, Edit2, MoreHorizontal, RotateCcw, FileText, Save, ChevronDown, Check, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ─── Types ─── */
type WorkflowStatus = "草稿" | "已发布" | "已归档";

interface Workflow {
  id: string;
  name: string;
  desc: string;
  status: WorkflowStatus;
  runCount: number;
  input: string;
  output: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Mock Data ─── */
const CURRENT_USER = "张明";

const mockWorkflows: Workflow[] = [
  { id: "WF-001", name: "中文文本清洗标准流程", desc: "包含去重、脱敏、格式化等8个算子", status: "已发布", runCount: 23, input: "中文情感数据集 V1.2, 评论数据集 V3", output: "清洗后数据集 V2", creator: "张明", createdAt: "2026-02-15 10:30", updatedAt: "2026-03-04 14:22" },
  { id: "WF-002", name: "图像质量筛选管线", desc: "分辨率过滤→模糊检测→美学评分", status: "已发布", runCount: 15, input: "医疗影像数据集 V2.0", output: "高质量图像集 V1", creator: "李芳", createdAt: "2026-02-20 09:15", updatedAt: "2026-03-05 11:08" },
  { id: "WF-003", name: "多语种翻译数据预处理", desc: "语言检测→编码转换→低质过滤→去重", status: "草稿", runCount: 0, input: "—", output: "—", creator: "王强", createdAt: "2026-03-01 16:40", updatedAt: "2026-03-03 09:55" },
  { id: "WF-004", name: "对话数据脱敏流水线", desc: "手机号脱敏→邮箱脱敏→地址脱敏", status: "已发布", runCount: 42, input: "客服对话数据 V4.1", output: "脱敏对话数据 V4.1", creator: "赵丽", createdAt: "2026-01-10 08:00", updatedAt: "2026-03-02 17:30" },
  { id: "WF-005", name: "废弃清洗流程", desc: "旧版流程，已停用", status: "已归档", runCount: 5, input: "旧数据集 V1", output: "旧输出 V1", creator: "张明", createdAt: "2025-12-01 12:00", updatedAt: "2026-01-15 10:00" },
];

const allCreators = [...new Set(mockWorkflows.map(w => w.creator))];
const allStatuses: WorkflowStatus[] = ["草稿", "已发布", "已归档"];

const statusColors: Record<WorkflowStatus, string> = {
  "草稿": "bg-muted text-muted-foreground",
  "已发布": "bg-primary/10 text-primary",
  "已归档": "bg-muted text-muted-foreground/60",
};

/* ─── Mock templates for "from template" ─── */
const mockTemplates = [
  { id: "T-001", name: "通用文本清洗模板", category: "文本处理", operators: 6, desc: "适用于大规模文本数据的清洗与标准化，包含去重、分词、格式化等步骤", creator: "张三" },
  { id: "T-002", name: "图像增强标准模板", category: "图像处理", operators: 4, desc: "对图像进行亮度调整、对比度增强、噪声去除等预处理操作", creator: "李四" },
  { id: "T-003", name: "多模态数据预处理", category: "多模态处理", operators: 8, desc: "支持文本、图像、音频等多种模态数据的统一预处理流程", creator: "王五" },
  { id: "T-004", name: "语音降噪管线", category: "语音处理", operators: 5, desc: "针对语音数据进行降噪、分段、特征提取等处理", creator: "赵六" },
  { id: "T-005", name: "表格数据ETL模板", category: "表格处理", operators: 7, desc: "实现表格数据的抽取、转换、加载全流程自动化处理", creator: "张三" },
];

/* ─── Mock datasets ─── */
const mockDatasets = [
  { name: "中文情感数据集", versions: ["V1.0", "V1.1", "V1.2"] },
  { name: "医疗影像数据集", versions: ["V1.0", "V2.0"] },
  { name: "客服对话数据", versions: ["V3.0", "V4.0", "V4.1"] },
  { name: "评论数据集", versions: ["V1", "V2", "V3"] },
  { name: "翻译平行语料", versions: ["V1", "V2"] },
];

/* ─── Multi-select dropdown component ─── */
const MultiSelectDropdown = ({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg bg-card hover:bg-muted/50 min-w-[120px]">
        <span className="truncate">{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-48 rounded-lg border bg-popover shadow-lg p-1 max-h-56 overflow-y-auto">
          {options.map(o => (
            <label key={o} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={selected.includes(o)} onCheckedChange={() => toggle(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const DataProcessWorkflows = () => {
  const navigate = useNavigate();

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialogs
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState<Workflow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Workflow | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState<Workflow | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // New-from-template
  const [newMode, setNewMode] = useState<"select" | "template">("select");
  const [templateSearch, setTemplateSearch] = useState("");

  // Run dialog state
  const [runName, setRunName] = useState("");
  const [runPriority, setRunPriority] = useState("中");
  const [runInputDatasets, setRunInputDatasets] = useState<string[]>([]);
  const [runOutputDatasets, setRunOutputDatasets] = useState<string[]>([]);
  const [runNewVersion, setRunNewVersion] = useState("");

  // Save-as-template state
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplTags, setTplTags] = useState<string[]>([]);

  const allCategoryTags = ["文本处理", "图像处理", "语音处理", "视频处理", "表格处理", "多模态处理"];

  // ─── Filtering ───
  const filtered = mockWorkflows.filter(wf => {
    if (searchText && !wf.name.includes(searchText)) return false;
    if (selectedCreators.length > 0 && !selectedCreators.includes(wf.creator)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(wf.status)) return false;
    if (dateFrom) {
      const d = new Date(wf.createdAt);
      if (d < dateFrom) return false;
    }
    if (dateTo) {
      const d = new Date(wf.createdAt);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchText("");
    setSelectedCreators([]);
    setSelectedStatuses([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = searchText || selectedCreators.length > 0 || selectedStatuses.length > 0 || dateFrom || dateTo;

  // ─── Selection ───
  const allSelected = filtered.length > 0 && filtered.every(wf => selectedIds.includes(wf.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map(wf => wf.id));
  };
  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ─── Actions ───
  const canEdit = (wf: Workflow) => wf.creator === CURRENT_USER;

  const openRunDialog = (wf: Workflow) => {
    setRunName(`${wf.name}_${format(new Date(), "yyyyMMdd_HHmmss")}`);
    setRunPriority("中");
    setRunInputDatasets([]);
    setRunOutputDatasets([]);
    setRunNewVersion("");
    setShowRunDialog(wf);
  };

  const openSaveTemplate = (wf: Workflow) => {
    setTplName(wf.name);
    setTplDesc(wf.desc);
    setTplTags([]);
    setShowSaveTemplate(wf);
  };

  const filteredTemplates = mockTemplates.filter(t => !templateSearch || t.name.includes(templateSearch) || t.category.includes(templateSearch));

  const datasetOptions = mockDatasets.flatMap(ds => ds.versions.map(v => `${ds.name} ${v}`));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">工作流</h1>
          <p className="page-description">创建和管理数据处理工作流</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-4 py-2 border border-destructive/30 text-destructive rounded-lg text-sm hover:bg-destructive/10 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> 批量删除 ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setNewMode("select"); setShowNewDialog(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
            <Plus className="w-4 h-4" /> 新建工作流
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索工作流名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <MultiSelectDropdown label="创建人" options={allCreators} selected={selectedCreators} onChange={setSelectedCreators} />
        <MultiSelectDropdown label="状态" options={allStatuses} selected={selectedStatuses} onChange={setSelectedStatuses} />

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg bg-card hover:bg-muted/50">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate">
                {dateFrom || dateTo
                  ? `${dateFrom ? format(dateFrom, "MM/dd") : "起始"} ~ ${dateTo ? format(dateTo, "MM/dd") : "结束"}`
                  : "创建时间"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">开始日期</p>
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-2 pointer-events-auto" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">结束日期</p>
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-2 pointer-events-auto" />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 w-10 text-center">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">工作流名称</th>
                <th className="p-3 text-left font-medium text-muted-foreground">状态</th>
                <th className="p-3 text-left font-medium text-muted-foreground">运行次数</th>
                <th className="p-3 text-left font-medium text-muted-foreground max-w-[180px]">输入</th>
                <th className="p-3 text-left font-medium text-muted-foreground max-w-[180px]">输出</th>
                <th className="p-3 text-left font-medium text-muted-foreground">创建人</th>
                <th className="p-3 text-left font-medium text-muted-foreground">创建时间</th>
                <th className="p-3 text-left font-medium text-muted-foreground">更新时间</th>
                <th className="p-3 text-right font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">暂无工作流</td></tr>
              )}
              {filtered.map(wf => (
                <tr key={wf.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-center">
                    <Checkbox checked={selectedIds.includes(wf.id)} onCheckedChange={() => toggleOne(wf.id)} />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-foreground">{wf.name}</div>
                    {wf.desc && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">{wf.desc}</div>}
                  </td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[wf.status])}>{wf.status}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{wf.runCount}</td>
                  <td className="p-3 text-muted-foreground text-xs truncate max-w-[180px]" title={wf.input}>{wf.input}</td>
                  <td className="p-3 text-muted-foreground text-xs truncate max-w-[180px]" title={wf.output}>{wf.output}</td>
                  <td className="p-3 text-muted-foreground">{wf.creator}</td>
                  <td className="p-3 text-muted-foreground text-xs">{wf.createdAt}</td>
                  <td className="p-3 text-muted-foreground text-xs">{wf.updatedAt}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {canEdit(wf) && (
                        <button onClick={() => navigate(`/data-process/workflow-canvas?name=${encodeURIComponent(wf.name)}`)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground" title="编辑">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit(wf) && wf.status === "已发布" && (
                        <button onClick={() => openRunDialog(wf)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground" title="运行">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => {/* copy logic */}} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground" title="复制">
                        <Copy className="w-4 h-4" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit(wf) && (
                            <DropdownMenuItem onClick={() => openSaveTemplate(wf)}>
                              <Save className="w-4 h-4 mr-2" /> 另存为模板
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/data-process/run-records?workflow=${encodeURIComponent(wf.name)}`)}>
                            <FileText className="w-4 h-4 mr-2" /> 查看日志
                          </DropdownMenuItem>
                          {canEdit(wf) && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteConfirm(wf)}>
                              <Trash2 className="w-4 h-4 mr-2" /> 删除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ New Workflow Dialog ═══ */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建工作流</DialogTitle>
            <DialogDescription>选择创建方式</DialogDescription>
          </DialogHeader>
          {newMode === "select" ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button onClick={() => { setShowNewDialog(false); navigate("/data-process/workflow-canvas?name=新建工作流"); }} className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
                <Plus className="w-8 h-8 text-primary" />
                <span className="font-medium">完全新建</span>
                <span className="text-xs text-muted-foreground text-center">从空白画布开始</span>
              </button>
              <button onClick={() => setNewMode("template")} className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
                <FileText className="w-8 h-8 text-primary" />
                <span className="font-medium">从模板创建</span>
                <span className="text-xs text-muted-foreground text-center">基于已有模板快速开始</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setNewMode("select")} className="text-sm text-muted-foreground hover:text-foreground">← 返回</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="搜索模板..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredTemplates.map(t => (
                  <button key={t.id} onClick={() => { setShowNewDialog(false); navigate(`/data-process/workflow-canvas?name=${encodeURIComponent(t.name)}&template=${t.id}`); }} className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.category} · {t.operators} 个算子 · 创建人：{t.creator}</div>
                      {t.desc && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</div>}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 shrink-0" />
                  </button>
                ))}
                {filteredTemplates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">无匹配模板</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Run Workflow Dialog ═══ */}
      <Dialog open={!!showRunDialog} onOpenChange={() => setShowRunDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>运行工作流</DialogTitle>
            <DialogDescription>确认运行参数后提交到执行队列</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">运行记录名称</label>
              <input value={runName} onChange={e => setRunName(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-sm font-medium">运行优先级</label>
              <select value={runPriority} onChange={e => setRunPriority(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-card">
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">输入数据集及版本</label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                {datasetOptions.map(ds => (
                  <label key={ds} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                    <Checkbox checked={runInputDatasets.includes(ds)} onCheckedChange={() => setRunInputDatasets(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds])} />
                    {ds}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">输出数据集及版本</label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                {datasetOptions.filter(ds => !runInputDatasets.includes(ds)).map(ds => (
                  <label key={ds} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                    <Checkbox checked={runOutputDatasets.includes(ds)} onCheckedChange={() => setRunOutputDatasets(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds])} />
                    {ds}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input value={runNewVersion} onChange={e => setRunNewVersion(e.target.value)} placeholder="新建输出版本名称..." className="flex-1 px-3 py-1.5 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <Button size="sm" variant="outline" disabled={!runNewVersion} onClick={() => { if (runNewVersion) { setRunOutputDatasets(prev => [...prev, runNewVersion]); setRunNewVersion(""); } }}>添加</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(null)}>取消</Button>
            <Button onClick={() => setShowRunDialog(null)}>确认运行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm ═══ */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除后工作流将移入回收站</DialogDescription>
          </DialogHeader>
          <p className="text-sm py-2">确定删除工作流 <strong>{showDeleteConfirm?.name}</strong> 吗？</p>
          {showDeleteConfirm?.status === "已发布" && showDeleteConfirm.runCount > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">⚠ 该工作流有正在运行的实例时不可删除</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(null)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Batch Delete Confirm ═══ */}
      <Dialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>批量删除</DialogTitle>
            <DialogDescription>此操作不可撤销</DialogDescription>
          </DialogHeader>
          <p className="text-sm py-2">确定删除选中的 <strong>{selectedIds.length}</strong> 个工作流吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteConfirm(false)}>取消</Button>
            <Button variant="destructive" onClick={() => { setSelectedIds([]); setShowBatchDeleteConfirm(false); }}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Save as Template Dialog ═══ */}
      <Dialog open={!!showSaveTemplate} onOpenChange={() => setShowSaveTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>另存为模板</DialogTitle>
            <DialogDescription>将当前工作流保存为可复用模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">模板名称 <span className="text-destructive">*</span></label>
              <input value={tplName} onChange={e => setTplName(e.target.value.slice(0, 50))} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <p className="text-xs text-muted-foreground mt-1">{tplName.length}/50</p>
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <textarea value={tplDesc} onChange={e => setTplDesc(e.target.value.slice(0, 500))} rows={3} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              <p className="text-xs text-muted-foreground mt-1">{tplDesc.length}/500</p>
            </div>
            <div>
              <label className="text-sm font-medium">分类标签</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {allCategoryTags.map(tag => (
                  <button key={tag} onClick={() => setTplTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors", tplTags.includes(tag) ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(null)}>取消</Button>
            <Button disabled={!tplName.trim()} onClick={() => setShowSaveTemplate(null)}>保存模板</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataProcessWorkflows;

import { useState, useCallback } from "react";
import {
  Plus, Search, Eye, MoreHorizontal, ClipboardList, Users, BarChart3, CheckCircle,
  ChevronDown, Trash2, Copy, ArrowUpCircle, ArrowDownCircle, Filter, X, Calendar,
  AlertTriangle, Edit, Play, Pause, FileText
} from "lucide-react";
import { toast } from "sonner";
import DataAnnotationTaskCreate from "./DataAnnotationTaskCreate";
import DataAnnotationTaskDetail from "./DataAnnotationTaskDetail";

/* ─── Types ─── */
interface AnnotationTask {
  id: string;
  name: string;
  description: string;
  type: string;
  projectType: string;
  annotationProgress: number;
  qaProgress: number;
  acceptProgress: number;
  creator: string;
  createdAt: string;
  status: "待处理" | "已发布" | "进行中" | "已完成" | "已下线" | "已删除";
  totalBatches: number;
  claimedBatches: number;
  totalData: number;
  annotatedData: number;
  totalQA: number;
  annotatedQA: number;
  totalAccept: number;
  annotatedAccept: number;
}

const mockTasks: AnnotationTask[] = [
  { id: "AT-001", name: "金融文本情感标注", description: "对金融新闻和研报进行情感极性标注", type: "文本类", projectType: "内容分类与审核", annotationProgress: 78, qaProgress: 65, acceptProgress: 45, creator: "张明", createdAt: "2026-02-20", status: "进行中", totalBatches: 25, claimedBatches: 22, totalData: 12500, annotatedData: 9750, totalQA: 12500, annotatedQA: 8125, totalAccept: 12500, annotatedAccept: 5625 },
  { id: "AT-002", name: "医疗图像分类标注", description: "CT/MRI影像分类与病灶区域标注", type: "图像类", projectType: "图像分类", annotationProgress: 100, qaProgress: 90, acceptProgress: 80, creator: "李芳", createdAt: "2026-02-15", status: "进行中", totalBatches: 10, claimedBatches: 10, totalData: 5000, annotatedData: 5000, totalQA: 5000, annotatedQA: 4500, totalAccept: 5000, annotatedAccept: 4000 },
  { id: "AT-003", name: "客服对话意图标注", description: "客服对话文本意图分类标注", type: "文本类", projectType: "内容分类与审核", annotationProgress: 100, qaProgress: 100, acceptProgress: 100, creator: "王强", createdAt: "2026-01-28", status: "已完成", totalBatches: 40, claimedBatches: 40, totalData: 20000, annotatedData: 20000, totalQA: 20000, annotatedQA: 20000, totalAccept: 20000, annotatedAccept: 20000 },
  { id: "AT-004", name: "语音转写质检", description: "语音转写结果校正与质检", type: "音频类", projectType: "音频转写", annotationProgress: 35, qaProgress: 0, acceptProgress: 0, creator: "赵丽", createdAt: "2026-03-01", status: "进行中", totalBatches: 15, claimedBatches: 8, totalData: 3000, annotatedData: 1050, totalQA: 1050, annotatedQA: 0, totalAccept: 1050, annotatedAccept: 0 },
  { id: "AT-005", name: "视频内容审核标注", description: "短视频内容审核与分类标注", type: "视频类", projectType: "视频分类", annotationProgress: 0, qaProgress: 0, acceptProgress: 0, creator: "孙伟", createdAt: "2026-03-05", status: "已发布", totalBatches: 8, claimedBatches: 1, totalData: 1500, annotatedData: 0, totalQA: 0, annotatedQA: 0, totalAccept: 0, annotatedAccept: 0 },
  { id: "AT-006", name: "表格数据时序标注", description: "金融时序数据异常点标注", type: "表格类", projectType: "时间序列标注", annotationProgress: 50, qaProgress: 20, acceptProgress: 0, creator: "张明", createdAt: "2026-03-08", status: "进行中", totalBatches: 12, claimedBatches: 10, totalData: 6000, annotatedData: 3000, totalQA: 3000, annotatedQA: 600, totalAccept: 600, annotatedAccept: 0 },
  { id: "AT-007", name: "圖文跨模態對齊", description: "圖像與文本描述對齊標注", type: "跨模態類", projectType: "跨模態對齊", annotationProgress: 15, qaProgress: 0, acceptProgress: 0, creator: "李芳", createdAt: "2026-03-10", status: "已发布", totalBatches: 20, claimedBatches: 5, totalData: 10000, annotatedData: 1500, totalQA: 1500, annotatedQA: 0, totalAccept: 1500, annotatedAccept: 0 },
  { id: "AT-008", name: "自动驾驶场景点云标注", description: "Lidar点云动态目标连续帧标注", type: "跨模态类", projectType: "3D点云标注", annotationProgress: 0, qaProgress: 0, acceptProgress: 0, creator: "张明", createdAt: "2026-03-15", status: "待处理", totalBatches: 0, claimedBatches: 0, totalData: 8000, annotatedData: 0, totalQA: 0, annotatedQA: 0, totalAccept: 0, annotatedAccept: 0 },
  { id: "AT-009", name: "多语言语音合成评测", description: "英文/德语合成语音质量主观评价", type: "音频类", projectType: "语音质量评测", annotationProgress: 0, qaProgress: 0, acceptProgress: 0, creator: "李芳", createdAt: "2026-03-16", status: "待处理", totalBatches: 0, claimedBatches: 0, totalData: 1500, annotatedData: 0, totalQA: 0, annotatedQA: 0, totalAccept: 0, annotatedAccept: 0 },
  { id: "AT-010", name: "结构化文档提取标注", description: "复杂发票与合同关键字段提取", type: "文本类", projectType: "内容分类与审核", annotationProgress: 0, qaProgress: 0, acceptProgress: 0, creator: "王强", createdAt: "2026-03-17", status: "待处理", totalBatches: 0, claimedBatches: 0, totalData: 3500, annotatedData: 0, totalQA: 0, annotatedQA: 0, totalAccept: 0, annotatedAccept: 0 },
];

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "表格类": "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "跨模态类": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const statusColors: Record<string, string> = {
  "待处理": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "已发布": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "进行中": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "已完成": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "已下线": "bg-muted text-muted-foreground",
  "已删除": "bg-destructive/10 text-destructive",
};

const DataAnnotationTasks = () => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [creatorFilter, setCreatorFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [detailTask, setDetailTask] = useState<AnnotationTask | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AnnotationTask | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [tasks, setTasks] = useState(mockTasks);

  const filtered = tasks.filter(t => {
    if (typeFilter !== "全部类型" && t.type !== typeFilter) return false;
    if (statusFilter !== "全部状态" && t.status !== statusFilter) return false;
    if (searchText && !t.name.includes(searchText) && !t.id.includes(searchText) && !t.creator.includes(searchText)) return false;
    if (creatorFilter && !t.creator.includes(creatorFilter)) return false;
    if (dateRange.start && t.createdAt < dateRange.start) return false;
    if (dateRange.end && t.createdAt > dateRange.end) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOnline = (task: AnnotationTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "已发布" as const } : t));
    toast.success(`任务「${task.name}」已上线`);
  };

  const handleOffline = (task: AnnotationTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "已下线" as const } : t));
    toast.success(`任务「${task.name}」已下线`);
  };

  const handleClone = (task: AnnotationTask) => {
    const cloned: AnnotationTask = {
      ...task,
      id: `AT-${String(tasks.length + 1).padStart(3, "0")}`,
      name: `${task.name} (副本)`,
      status: "待处理",
      annotationProgress: 0, qaProgress: 0, acceptProgress: 0,
      annotatedData: 0, annotatedQA: 0, annotatedAccept: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks(prev => [cloned, ...prev]);
    toast.success(`已克隆任务配置，新任务「${cloned.name}」已创建`);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteInput !== deleteConfirm.id) {
      toast.error("请输入正确的任务ID确认删除");
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== deleteConfirm.id));
    toast.success(`任务「${deleteConfirm.name}」已删除，所有标注批次已销毁`);
    setDeleteConfirm(null);
    setDeleteInput("");
  };

  if (showCreateWizard) {
    return <DataAnnotationTaskCreate onBack={() => setShowCreateWizard(false)} />;
  }

  if (detailTask) {
    return <DataAnnotationTaskDetail task={detailTask} onBack={() => setDetailTask(null)} />;
  }

  const stats = [
    { title: "进行中任务", value: tasks.filter(t => t.status === "进行中").length, icon: ClipboardList, color: "text-blue-600" },
    { title: "标注人员", value: 48, icon: Users, color: "text-green-600" },
    { title: "标注总量", value: tasks.reduce((s, t) => s + t.totalData, 0).toLocaleString(), icon: BarChart3, color: "text-orange-600" },
    { title: "已完成任务", value: tasks.filter(t => t.status === "已完成").length, icon: CheckCircle, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">标注任务</h1>
          <p className="page-description">创建和管理数据标注任务全生命周期</p>
        </div>
        <button onClick={() => setShowCreateWizard(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建任务
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={s.color}><s.icon className="w-8 h-8" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.title}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索任务名称、ID或创建人..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部类型</option>
          {["文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类"].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部状态</option>
          {["待处理", "已发布", "进行中", "已完成", "已下线"].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-1 ${showFilters ? "bg-primary/10 border-primary text-primary" : "bg-card text-muted-foreground hover:text-foreground"}`}>
          <Filter className="w-4 h-4" /> 高级筛选
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">创建人：</label>
            <input value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} placeholder="输入创建人" className="px-2 py-1.5 text-sm border rounded bg-card w-32" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">创建时间：</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="px-2 py-1.5 text-sm border rounded bg-card" />
            <span className="text-muted-foreground">-</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="px-2 py-1.5 text-sm border rounded bg-card" />
          </div>
          <button onClick={() => { setCreatorFilter(""); setDateRange({ start: "", end: "" }); }} className="text-xs text-primary hover:underline">重置</button>
        </div>
      )}

      {/* 任务表格 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标注进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">质检进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">验收进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(task => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="font-medium text-foreground cursor-pointer hover:text-primary" onClick={() => setDetailTask(task)}>{task.name}</div>
                  <div className="text-xs text-muted-foreground">{task.id}</div>
                </td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[task.type] || "bg-muted text-muted-foreground"}`}>{task.type}</span></td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-foreground font-medium">{task.annotatedData.toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {task.totalData.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${task.annotationProgress}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-foreground font-medium">{task.annotatedQA.toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {task.totalQA.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${task.qaProgress}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-foreground font-medium">{task.annotatedAccept.toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {task.totalAccept.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${task.acceptProgress}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`status-tag ${task.status === "已完成" ? "status-tag-success" :
                    task.status === "进行中" ? "status-tag-info" :
                      task.status === "已发布" ? "status-tag-info bg-blue-50 text-blue-600 border-blue-100" :
                        "status-tag-warning bg-slate-100 text-slate-500 border-slate-200"
                    }`}>{task.status}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{task.creator}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{task.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-3">
                    {task.status === "待处理" && (
                      <button onClick={() => setShowCreateWizard(true)} className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">编辑</button>
                    )}
                    {task.status === "已下线" && (
                      <button onClick={() => handleOnline(task)} className="text-[11px] font-bold text-slate-600 hover:text-primary transition-colors">上线</button>
                    )}
                    {(task.status === "进行中" || task.status === "已发布") && (
                      <button onClick={() => handleOffline(task)} className="text-[11px] font-bold text-slate-600 hover:text-orange-600 transition-colors">下线</button>
                    )}
                    <button onClick={() => handleClone(task)} className="text-[11px] font-bold text-slate-600 hover:text-primary transition-colors">克隆</button>
                    <button onClick={() => setDeleteConfirm(task)} className="text-[11px] font-bold text-slate-400 hover:text-destructive transition-colors">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 条数据</span>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 text-xs border rounded bg-card">
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 text-xs rounded border ${page === i + 1 ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h3 className="text-lg font-semibold">确认删除任务</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">删除后任务下所有标注批次将被销毁，此操作不可恢复。</p>
            <p className="text-sm text-foreground mb-4">请输入任务ID <span className="font-mono font-bold text-destructive">{deleteConfirm.id}</span> 确认删除：</p>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="输入任务ID" className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-destructive/20" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setDeleteConfirm(null); setDeleteInput(""); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleDelete} disabled={deleteInput !== deleteConfirm.id} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50">确认删除</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataAnnotationTasks;

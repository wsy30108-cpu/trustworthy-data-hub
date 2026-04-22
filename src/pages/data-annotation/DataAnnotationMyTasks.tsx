import { useState } from "react";
import {
  Search, Play, Eye, ArrowRightLeft, Unlock,
  ClipboardList, CheckCircle, Clock, X, Send, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown,
  Brain, Loader2, Sparkles, Zap, MousePointer2
} from "lucide-react";
import { toast } from "sonner";
import DataAnnotationWorkbench from "./DataAnnotationWorkbench";
import BatchExecutionDetail from "./BatchExecutionDetail";
import { useTaskPreannotationStore } from "@/stores/useTaskPreannotationStore";
import { usePreannotationProgress } from "@/hooks/usePreannotationProgress";

interface MyTask {
  id: string;
  taskName: string;
  authorizedTo: string;
  progress: number;
  total: number;
  done: number;
  status: "进行中" | "已完成";
  projectType: string;
  taskType: "标注" | "标注-质检" | "标注-质检-验收" | "标注-验收";
  currentStage: string;
  source: "任务大厅" | "质检驳回" | "验收驳回" | "转派";
  currentStatus: "标注中" | "质检中" | "验收中" | "已完成" | "已归档";
  latestOperator: string;
  history: Array<{ operator: string, action: string, time: string, comment?: string }>;
  creator: string;
  createdAt: string;
}

const mockMyTasks: MyTask[] = [
  {
    id: "BT-001", taskName: "金融文本情感标注", authorizedTo: "任务池", progress: 65, total: 200, done: 130, status: "进行中", projectType: "文本类", taskType: "标注-质检-验收", currentStage: "标注", source: "任务大厅",
    currentStatus: "标注中", latestOperator: "张明", creator: "张明", createdAt: "2026-02-20",
    history: [{ operator: "系统", action: "创建批次", time: "2026-02-20 09:00" }, { operator: "张明", action: "领取任务", time: "2026-02-20 10:30" }]
  },
  {
    id: "BT-005", taskName: "无人驾驶路测图像分割", authorizedTo: "AI数据团队", progress: 12, total: 1000, done: 120, status: "进行中", projectType: "图像类", taskType: "标注-质检", currentStage: "标注", source: "质检驳回",
    currentStatus: "标注中", latestOperator: "李芳", creator: "孙伟", createdAt: "2026-03-05",
    history: [
      { operator: "孙伟", action: "领取任务", time: "2026-03-05 10:00" },
      { operator: "李芳", action: "接收转派", time: "2026-03-06 14:00" },
      { operator: "王强", action: "质检驳回", time: "2026-03-07 09:00", comment: "分割边缘不够平滑" }
    ]
  },
  {
    id: "BT-009", taskName: "方言语音识别校对", authorizedTo: "任务池", progress: 85, total: 300, done: 255, status: "进行中", projectType: "音频类", taskType: "标注-质检-验收", currentStage: "标注", source: "转派",
    currentStatus: "标注中", latestOperator: "周杰", creator: "李华", createdAt: "2026-03-02",
    history: [
      { operator: "系统", action: "分配任务", time: "2026-03-02 08:00" },
      { operator: "周杰", action: "开始作业", time: "2026-03-02 11:30" }
    ]
  },
  {
    id: "BT-011", taskName: "电商直播商品识别", authorizedTo: "AI数据团队", progress: 45, total: 600, done: 270, status: "进行中", projectType: "视频类", taskType: "标注-验收", currentStage: "标注", source: "验收驳回",
    currentStatus: "标注中", latestOperator: "赵丽", creator: "王强", createdAt: "2026-03-10",
    history: [
      { operator: "赵丽", action: "提交标注", time: "2026-03-12 10:00" },
      { operator: "张明", action: "验收驳回", time: "2026-03-13 15:00", comment: "部分关键帧商品漏标" }
    ]
  },
  {
    id: "BT-014", taskName: "多轮对话逻辑一致性校验", authorizedTo: "NLP研发组", progress: 92, total: 100, done: 92, status: "进行中", projectType: "文本类", taskType: "标注-质检", currentStage: "标注", source: "任务大厅",
    currentStatus: "标注中", latestOperator: "孙伟", creator: "钱进", createdAt: "2026-03-15",
    history: [
      { operator: "系统", action: "创建批次", time: "2026-03-15 09:00" },
      { operator: "孙伟", action: "开始标注", time: "2026-03-15 13:00" }
    ]
  },
  {
    id: "BT-018", taskName: "法律文书NER识别", authorizedTo: "任务池", progress: 0, total: 200, done: 0, status: "进行中", projectType: "文本类", taskType: "标注", currentStage: "标注", source: "任务大厅",
    currentStatus: "标注中", latestOperator: "刘洋", creator: "赵敏", createdAt: "2026-03-18",
    history: [
      { operator: "刘洋", action: "从大厅领取", time: "2026-03-18 10:20" }
    ]
  },
  {
    id: "BT-004", taskName: "语音转写质检", authorizedTo: "NLP研发组", progress: 40, total: 50, done: 20, status: "进行中", projectType: "音频类", taskType: "标注-质检", currentStage: "标注", source: "转派",
    currentStatus: "标注中", latestOperator: "赵丽", creator: "赵丽", createdAt: "2026-03-01",
    history: [{ operator: "系统", action: "分配", time: "2026-03-01 10:00" }]
  },
  {
    id: "BT-025", taskName: "医疗影像病灶质检", authorizedTo: "质检组", progress: 30, total: 100, done: 30, status: "进行中", projectType: "图像类", taskType: "标注-质检", currentStage: "质检", source: "任务大厅",
    currentStatus: "质检中", latestOperator: "张明", creator: "李芳", createdAt: "2026-03-15",
    history: [
      { operator: "李芳", action: "提交标注", time: "2026-03-16 09:00" },
      { operator: "张明", action: "开始质检", time: "2026-03-18 10:00" }
    ]
  },
  {
    id: "BT-030", taskName: "法律条款合规验收", authorizedTo: "验收委员会", progress: 60, total: 50, done: 30, status: "进行中", projectType: "文本类", taskType: "标注-质检-验收", currentStage: "验收", source: "任务大厅",
    currentStatus: "验收中", latestOperator: "张明", creator: "孙伟", createdAt: "2026-03-10",
    history: [
      { operator: "孙伟", action: "提交标注", time: "2026-03-12 14:00" },
      { operator: "李晓", action: "质检通过", time: "2026-03-14 11:00" },
      { operator: "张明", action: "开始验收", time: "2026-03-18 11:30" }
    ]
  },
  {
    id: "BT-007", taskName: "客服对话意图标注", authorizedTo: "任务池", progress: 100, total: 500, done: 500, status: "已完成", projectType: "文本类", taskType: "标注-质检-验收", currentStage: "已完成", source: "任务大厅",
    currentStatus: "质检中", latestOperator: "李华", creator: "王强", createdAt: "2026-01-28",
    history: [
      { operator: "王强", action: "提交标注", time: "2026-02-01 14:00" },
      { operator: "李华", action: "开始质检", time: "2026-02-02 09:00" }
    ]
  },
  {
    id: "BT-008", taskName: "医疗图像分类标注", authorizedTo: "AI数据团队", progress: 100, total: 100, done: 100, status: "已完成", projectType: "图像类", taskType: "标注-质检", currentStage: "已完成", source: "任务大厅",
    currentStatus: "已归档", latestOperator: "系统", creator: "李芳", createdAt: "2026-02-15",
    history: [
      { operator: "李芳", action: "提交标注", time: "2026-02-16 11:00" },
      { operator: "赵敏", action: "质检通过", time: "2026-02-17 15:30" },
      { operator: "系统", action: "自动归档", time: "2026-02-18 00:00" }
    ]
  },
  {
    id: "BT-021", taskName: "多轮对话逻辑校验", authorizedTo: "任务池", progress: 100, total: 100, done: 100, status: "已完成", projectType: "文本类", taskType: "标注-质检", currentStage: "质检", source: "任务大厅",
    currentStatus: "验收中", latestOperator: "钱进", creator: "张明", createdAt: "2026-03-18",
    history: [
      { operator: "张明", action: "提交标注", time: "2026-03-18 10:00" },
      { operator: "李晓", action: "质检通过", time: "2026-03-18 14:00" },
      { operator: "钱进", action: "开始验收", time: "2026-03-18 16:00" }
    ]
  },
  {
    id: "BT-040", taskName: "城市街景违章识别", authorizedTo: "任务池", progress: 80, total: 400, done: 320, status: "已完成", projectType: "图像类", taskType: "标注-质检-验收", currentStage: "标注", source: "任务大厅",
    currentStatus: "标注中", latestOperator: "系统", creator: "张明", createdAt: "2026-03-10",
    history: [
      { operator: "张明", action: "提交部分标注 (80%)", time: "2026-03-15 10:00" },
      { operator: "系统", action: "等待整体批次提交", time: "2026-03-15 10:05" }
    ]
  },
  {
    id: "BT-045", taskName: "保险理赔单据OCR", authorizedTo: "AI数据团队", progress: 100, total: 200, done: 200, status: "已完成", projectType: "文本类", taskType: "标注-质检", currentStage: "质检", source: "转派",
    currentStatus: "质检中", latestOperator: "李芳", creator: "赵丽", createdAt: "2026-03-12",
    history: [
      { operator: "赵丽", action: "提交标注", time: "2026-03-14 09:00" },
      { operator: "李芳", action: "开始质检", time: "2026-03-16 11:00" }
    ]
  },
  {
    id: "BT-050", taskName: "视频人体姿态手工标注", authorizedTo: "任务池", progress: 100, total: 100, done: 100, status: "已完成", projectType: "视频类", taskType: "标注-验收", currentStage: "验收", source: "任务大厅",
    currentStatus: "验收中", latestOperator: "孙伟", creator: "王强", createdAt: "2026-03-05",
    history: [
      { operator: "王强", action: "提交标注", time: "2026-03-08 14:00" },
      { operator: "孙伟", action: "开始验收", time: "2026-03-18 13:00" }
    ]
  },
  {
    id: "BT-055", taskName: "情感分析种子数据", authorizedTo: "NLP研发组", progress: 100, total: 500, done: 500, status: "已完成", projectType: "文本类", taskType: "标注", currentStage: "已完成", source: "任务大厅",
    currentStatus: "已完成", latestOperator: "系统", creator: "钱进", createdAt: "2026-02-10",
    history: [
      { operator: "钱进", action: "提交标注", time: "2026-02-12 10:00" },
      { operator: "系统", action: "流程办结", time: "2026-02-12 10:05" }
    ]
  },
  {
    id: "BT-060", taskName: "历史存档：通用OCR", authorizedTo: "AI数据团队", progress: 100, total: 1000, done: 1000, status: "已完成", projectType: "文本类", taskType: "标注-质检", currentStage: "已完成", source: "任务大厅",
    currentStatus: "已归档", latestOperator: "系统", creator: "李芳", createdAt: "2026-01-20",
    history: [
      { operator: "李芳", action: "提交标注", time: "2026-01-25 09:00" },
      { operator: "赵敏", action: "质检通过", time: "2026-01-26 14:00" },
      { operator: "系统", action: "自动归档", time: "2026-02-01 00:00" }
    ]
  },
];

const PAGE_SIZES = [10, 20, 50];

const statusColors: Record<string, string> = {
  "进行中": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "标注中": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "质检中": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  "验收中": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  "已完成": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  "已归档": "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300",
};

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const sourceColors: Record<string, string> = {
  "任务大厅": "bg-slate-50 text-slate-600 border-slate-100",
  "质检驳回": "bg-amber-50 text-amber-600 border-amber-100",
  "验收驳回": "bg-rose-50 text-rose-600 border-rose-100",
  "转派": "bg-purple-50 text-purple-600 border-purple-100",
};

const DataAnnotationMyTasks = () => {
  usePreannotationProgress();
  const preannotationConfigs = useTaskPreannotationStore((s) => s.configs);

  const [tab, setTab] = useState<"active" | "done">("active");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [workflowFilter, setWorkflowFilter] = useState("全部流程");
  const [workbenchTask, setWorkbenchTask] = useState<MyTask | null>(null);
  const [transferModal, setTransferModal] = useState<MyTask | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState<MyTask | null>(null);
  const [releaseConfirm, setReleaseConfirm] = useState<MyTask | null>(null);
  const [detailTask, setDetailTask] = useState<MyTask | null>(null);
  const [tasks, setTasks] = useState(mockMyTasks);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [executionDetail, setExecutionDetail] = useState<MyTask | null>(null);
  const [workbenchResourceId, setWorkbenchResourceId] = useState<number | undefined>(undefined);

  const members = ["张明", "李芳", "王强", "赵丽", "孙伟", "周杰"];

  const filtered = tasks.filter(t => {
    if (tab === "active" && t.status !== "进行中") return false;
    if (tab === "done" && t.status !== "已完成") return false;
    if (typeFilter !== "全部类型" && t.projectType !== typeFilter) return false;
    if (workflowFilter !== "全部流程" && t.taskType !== workflowFilter) return false;
    if (searchText && !t.taskName.includes(searchText) && !t.id.includes(searchText)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleRelease = () => {
    if (!releaseConfirm) return;
    setTasks(prev => prev.filter(t => t.id !== releaseConfirm.id));
    toast.success(`批次 ${releaseConfirm.id} 已释放，未提交的标注数据不保留`);
    setReleaseConfirm(null);
  };

  const handleTransfer = () => {
    if (!transferModal || !transferTarget) return;
    setTasks(prev => prev.filter(t => t.id !== transferModal.id));
    toast.success(`批次 ${transferModal.id} 已转派给 ${transferTarget}`);
    setTransferModal(null); setTransferTarget("");
  };

  const handleSubmit = () => {
    if (!submitConfirm) return;
    setTasks(prev => prev.map(t => t.id === submitConfirm.id ? { ...t, status: "已完成" as const, progress: 100, done: t.total } : t));
    toast.success(`批次 ${submitConfirm.id} 已提交，进入下一流程环节`);
    setSubmitConfirm(null);
  };

  if (workbenchTask) {
    return (
      <DataAnnotationWorkbench
        task={workbenchTask}
        onBack={() => {
          setWorkbenchTask(null);
          setWorkbenchResourceId(undefined);
        }}
        initialResourceId={workbenchResourceId}
      />
    );
  }

  if (executionDetail) {
    return (
      <BatchExecutionDetail
        task={executionDetail}
        onBack={() => setExecutionDetail(null)}
        onResourceClick={(id) => {
          setWorkbenchResourceId(id);
          setWorkbenchTask(executionDetail);
        }}
      />
    );
  }

  const activeCount = tasks.filter(t => t.status === "进行中").length;
  const doneCount = tasks.filter(t => t.status === "已完成").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">我的任务</h1>
          <p className="page-description">管理个人认领的所有标注批次</p>
        </div>
      </div>


      <div className="flex items-center gap-1 border-b">
        <button onClick={() => { setTab("active"); setPage(1); }} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "active" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>进行中的任务 ({activeCount})</button>
        <button onClick={() => { setTab("done"); setPage(1); }} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "done" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>已提交的任务 ({doneCount})</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} placeholder="搜索任务名称或批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部类型</option>
          {["文本类", "图像类", "音频类", "视频类"].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={workflowFilter} onChange={e => { setWorkflowFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部流程</option>
          {["标注", "标注-质检", "标注-质检-验收", "标注-验收"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground text-nowrap">批次ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">授权对象</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground min-w-[120px]">进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground min-w-[140px]">
                <div className="flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-primary" /> 预标注
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务流程</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务来源</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">当前状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{tab === "active" ? "创建人" : "最新操作人"}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{tab === "active" ? "创建时间" : "提交时间"}</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(t => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium">{t.id}</td>
                <td className="py-3 px-4 text-foreground">{t.taskName}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 bg-muted rounded text-xs">{t.authorizedTo}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${t.progress}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{t.done}/{t.total}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    const pc = preannotationConfigs[t.id];
                    if (!pc || !pc.batchEnabled) {
                      return <span className="text-[10px] text-muted-foreground/60">未开启</span>;
                    }
                    const percent = Math.round((pc.preannotated / pc.total) * 100);
                    const isDone = pc.status === "已完成" || pc.status === "部分失败";
                    return (
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                          )}
                          <span className="text-[11px] font-mono">
                            <span className={isDone ? "text-emerald-700 font-semibold" : "text-primary font-semibold"}>
                              {pc.preannotated.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">/{pc.total.toLocaleString()}</span>
                          </span>
                          <span className="text-[9px] text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isDone ? "bg-emerald-500" : "bg-primary"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span
                            className="text-[9px] text-muted-foreground truncate max-w-[90px]"
                            title={pc.modelName}
                          >
                            {pc.modelName}
                          </span>
                          {pc.interactiveEnabled && (
                            <span
                              className="text-[8px] px-1 rounded bg-purple-50 text-purple-700 font-bold"
                              title="支持交互式预标注"
                            >
                              交互
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[t.projectType] || "bg-muted text-muted-foreground"}`}>{t.projectType}</span></td>
                <td className="py-3 px-4 text-sm text-foreground">{t.taskType}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sourceColors[t.source] || "bg-muted text-muted-foreground border-muted-200"}`}>
                    {t.source}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[t.currentStatus]}`}>
                    {t.currentStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{tab === "active" ? t.creator : t.latestOperator}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{t.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    {t.status === "进行中" ? (
                      <>
                        <button onClick={() => setWorkbenchTask(t)} className="p-1 rounded hover:bg-muted/50" title="继续标注">
                          <Play className="w-4 h-4 text-primary" />
                        </button>
                        <button onClick={() => setExecutionDetail(t)} className="p-1 rounded hover:bg-muted/50" title="查看详情">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDetailTask(t)} className="p-1 rounded hover:bg-muted/50" title="查看历程">
                        <Eye className="w-4 h-4 text-primary" />
                      </button>
                    )}
                    {tab === "active" && (
                      <>
                        <button onClick={() => setTransferModal(t)} className="p-1 rounded hover:bg-muted/50" title="转派任务">
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setReleaseConfirm(t)} className="p-1 rounded hover:bg-muted/50" title="释放任务">
                          <Unlock className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setSubmitConfirm(t)} className="p-1 rounded hover:bg-muted/50" title="提交任务">
                          <Send className="w-4 h-4 text-emerald-600" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 条数据</span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 text-xs border rounded bg-card outline-none"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}条/页</option>)}
            </select>
            <div className="flex gap-0.5">
              <button disabled={page <= 1} onClick={() => setPage(1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"><ChevronsLeft className="w-3.5 h-3.5" /></button>
              <button disabled={page <= 1} onClick={() => setPage(prev => prev - 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>

              <div className="flex items-center px-2 text-xs text-foreground font-medium">
                第 {page} / {totalPages} 页
              </div>

              <button disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"><ChevronsRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Release confirm */}
      {releaseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">释放确认</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">您确定要释放批次 <span className="font-medium text-foreground">{releaseConfirm.id}</span> 吗？释放后，该批次内所有<span className="text-destructive">未提交的标注数据将无法找回</span>。</p>
            <div className="flex justify-end gap-2 text-sm">
              <button onClick={() => setReleaseConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">取消</button>
              <button onClick={handleRelease} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">确认释放</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-3">转派批次 {transferModal.id}</h3>
            <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-4">
              <option value="">选择目标处理人</option>
              {members.map(m => <option key={m}>{m}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTransferModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleTransfer} disabled={!transferTarget} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">确认转派</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirm */}
      {submitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Send className="w-5 h-5" />
              <h3 className="font-semibold">提交确认</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">当前已标注 <span className="text-foreground font-medium">{submitConfirm.done}/{submitConfirm.total}</span>，仍有 <span className="text-foreground font-medium">{submitConfirm.total - submitConfirm.done}</span> 条记录未完成，确定提交吗？</p>
            <p className="text-xs text-amber-600 mb-5 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">注：提交后该批次将进入质检/验收环节，您将无法再修改内容。</p>
            <div className="flex justify-end gap-2 text-sm">
              <button onClick={() => setSubmitConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">确认提交</button>
            </div>
          </div>
        </div>
      )}
      {/* 针对历程详情的逻辑 */}
      {detailTask && (
        // ... (keep existing detailTask content)
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  任务流转追踪 - {detailTask.id}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{detailTask.taskName}</p>
              </div>
              <button onClick={() => setDetailTask(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {/* 基础信息 */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">项目类型</label>
                  <span className="text-sm font-medium">{detailTask.projectType}</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">任务流程</label>
                  <span className="text-sm font-medium text-primary">{detailTask.taskType}</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">当前状态</label>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[detailTask.currentStatus]}`}>
                    {detailTask.currentStatus}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">最新操作人</label>
                  <span className="text-sm font-medium">{detailTask.latestOperator}</span>
                </div>
              </div>

              {/* 操作历程时间轴 */}
              <div>
                <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  操作历史与流转
                </h4>
                <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {detailTask.history.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-card flex items-center justify-center z-10 ${idx === detailTask.history.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        {idx === detailTask.history.length - 1 && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-bold text-sm text-foreground">{step.action}</span>
                        <span className="text-xs text-muted-foreground font-mono">{step.time}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">操作人：</span>
                        <span className="text-xs font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded">{step.operator}</span>
                      </div>
                      {step.comment && (
                        <div className="mt-2 text-xs text-muted-foreground bg-rose-50 border border-rose-100 p-2 rounded italic">
                          备注：{step.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-muted/20 flex justify-end">
              <button onClick={() => setDetailTask(null)} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95 text-sm">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationMyTasks;

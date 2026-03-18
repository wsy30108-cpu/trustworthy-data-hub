import { useState } from "react";
import {
  ArrowLeft, Eye, MoreHorizontal, Search, Filter, ChevronDown,
  Trash2, RefreshCw, ArrowRightLeft, Unlock, AlertTriangle, X,
  CheckCircle2, Clock, Users, BarChart3, Percent, FileText,
  Archive, ChevronRight, Info, Database, Layers
} from "lucide-react";
import { toast } from "sonner";

interface BatchItem {
  id: string;
  size: number;
  stage: "标注" | "质检" | "验收" | "判定" | "已完成";
  status: "待处理" | "处理中" | "已完成" | "已废弃";
  isAnnotated: boolean;
  isSkipped: boolean;
  isQA: boolean;
  isAccepted: boolean;
  rejectCount: number;
  annotator: string;
  judge: string;
  qaer: string;
  accepter: string;
  createdAt: string;
  updatedAt: string;
  updater: string;
}

const mockBatches: BatchItem[] = [
  { id: "BT-001", size: 500, stage: "质检", status: "处理中", isAnnotated: true, isSkipped: false, isQA: false, isAccepted: false, rejectCount: 0, annotator: "张明", judge: "-", qaer: "王强", accepter: "-", createdAt: "2026-02-20", updatedAt: "2026-03-05", updater: "王强" },
  { id: "BT-002", size: 500, stage: "验收", status: "处理中", isAnnotated: true, isSkipped: false, isQA: true, isAccepted: false, rejectCount: 1, annotator: "李芳", judge: "-", qaer: "王强", accepter: "赵丽", createdAt: "2026-02-20", updatedAt: "2026-03-08", updater: "赵丽" },
  { id: "BT-003", size: 500, stage: "已完成", status: "已完成", isAnnotated: true, isSkipped: false, isQA: true, isAccepted: true, rejectCount: 0, annotator: "孙伟", judge: "-", qaer: "王强", accepter: "赵丽", createdAt: "2026-02-20", updatedAt: "2026-03-06", updater: "赵丽" },
  { id: "BT-004", size: 500, stage: "标注", status: "处理中", isAnnotated: false, isSkipped: false, isQA: false, isAccepted: false, rejectCount: 0, annotator: "张明", judge: "-", qaer: "-", accepter: "-", createdAt: "2026-02-20", updatedAt: "2026-03-01", updater: "张明" },
  { id: "BT-005", size: 500, stage: "标注", status: "待处理", isAnnotated: false, isSkipped: false, isQA: false, isAccepted: false, rejectCount: 0, annotator: "-", judge: "-", qaer: "-", accepter: "-", createdAt: "2026-02-20", updatedAt: "2026-02-20", updater: "-" },
  { id: "BT-006", size: 500, stage: "判定", status: "处理中", isAnnotated: true, isSkipped: false, isQA: false, isAccepted: false, rejectCount: 2, annotator: "李芳", judge: "张明", qaer: "王强", accepter: "-", createdAt: "2026-02-20", updatedAt: "2026-03-10", updater: "张明" },
];

const mockAcceptResults = [
  { batchId: "BT-003", annotated: 500, accepted: 480, sampleRatio: "30%", errors: 8, accuracy: "98.3%", minPassRate: "95%", accepter: "赵丽", result: "通过", archived: true, time: "2026-03-06 14:30" },
  { batchId: "BT-002", annotated: 500, accepted: 150, sampleRatio: "30%", errors: 12, accuracy: "92.0%", minPassRate: "95%", accepter: "赵丽", result: "未通过", archived: false, time: "2026-03-08 10:20" },
  { batchId: "BT-007", annotated: 500, accepted: 495, sampleRatio: "30%", errors: 2, accuracy: "99.6%", minPassRate: "95%", accepter: "赵丽", result: "通过", archived: false, time: "2026-03-11 09:30" },
  { batchId: "BT-008", annotated: 400, accepted: 385, sampleRatio: "25%", errors: 5, accuracy: "98.7%", minPassRate: "95%", accepter: "张明", result: "通过", archived: false, time: "2026-03-11 11:15" },
  { batchId: "BT-009", annotated: 600, accepted: 580, sampleRatio: "40%", errors: 10, accuracy: "98.3%", minPassRate: "95%", accepter: "李芳", result: "通过", archived: false, time: "2026-03-12 14:20" },
  { batchId: "BT-010", annotated: 300, accepted: 290, sampleRatio: "20%", errors: 3, accuracy: "99.0%", minPassRate: "95%", accepter: "赵丽", result: "通过", archived: false, time: "2026-03-12 16:45" },
  { batchId: "BT-011", annotated: 500, accepted: 478, sampleRatio: "30%", errors: 9, accuracy: "98.1%", minPassRate: "95%", accepter: "张明", result: "通过", archived: false, time: "2026-03-13 10:00" },
  { batchId: "BT-012", annotated: 450, accepted: 440, sampleRatio: "30%", errors: 4, accuracy: "99.1%", minPassRate: "95%", accepter: "李芳", result: "通过", archived: false, time: "2026-03-13 13:30" },
  { batchId: "BT-013", annotated: 500, accepted: 492, sampleRatio: "30%", errors: 1, accuracy: "99.8%", minPassRate: "95%", accepter: "孙伟", result: "通过", archived: false, time: "2026-03-14 09:00" },
  { batchId: "BT-014", annotated: 550, accepted: 535, sampleRatio: "35%", errors: 6, accuracy: "98.9%", minPassRate: "95%", accepter: "张明", result: "通过", archived: false, time: "2026-03-14 11:45" },
  { batchId: "BT-015", annotated: 420, accepted: 410, sampleRatio: "28%", errors: 2, accuracy: "99.5%", minPassRate: "95%", accepter: "孙伟", result: "通过", archived: false, time: "2026-03-15 14:10" },
  { batchId: "BT-016", annotated: 500, accepted: 485, sampleRatio: "30%", errors: 7, accuracy: "98.6%", minPassRate: "95%", accepter: "赵丽", result: "通过", archived: false, time: "2026-03-15 16:30" },
  { batchId: "BT-017", annotated: 500, accepted: 498, sampleRatio: "30%", errors: 0, accuracy: "100%", minPassRate: "95%", accepter: "李芳", result: "通过", archived: false, time: "2026-03-16 10:20" },
  { batchId: "BT-018", annotated: 480, accepted: 470, sampleRatio: "30%", errors: 5, accuracy: "98.9%", minPassRate: "95%", accepter: "张明", result: "通过", archived: false, time: "2026-03-16 15:00" },
  { batchId: "BT-019", annotated: 520, accepted: 510, sampleRatio: "30%", errors: 4, accuracy: "99.2%", minPassRate: "95%", accepter: "孙伟", result: "通过", archived: false, time: "2026-03-17 09:30" },
];

interface Props {
  task: {
    id: string; name: string; type: string; projectType: string; status: string; creator: string; createdAt: string;
    totalData: number; annotatedData: number;
    totalBatches: number; claimedBatches: number;
    annotationProgress: number; qaProgress: number; acceptProgress: number;
    totalQA: number; annotatedQA: number;
    totalAccept: number; annotatedAccept: number;
  };
  onBack: () => void;
}

const stageColors: Record<string, string> = {
  "标注": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "质检": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "验收": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "判定": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "已完成": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const DataAnnotationTaskDetail = ({ task, onBack }: Props) => {
  const [tab, setTab] = useState<"batches" | "results">("batches");
  const [searchText, setSearchText] = useState("");
  const [stageFilter, setStageFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [batches, setBatches] = useState(mockBatches);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [resultsPage, setResultsPage] = useState(1);
  const resultsPageSize = 10;
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [acceptResults, setAcceptResults] = useState(mockAcceptResults);
  const [transferModal, setTransferModal] = useState<BatchItem | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [batchDetail, setBatchDetail] = useState<BatchItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "destructive" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: () => { },
  });
  const [archiveModal, setArchiveModal] = useState<string | null>(null);
  const [archiveDataset, setArchiveDataset] = useState("");
  const [archiveVersion, setArchiveVersion] = useState("创建新版本");

  const members = ["张明", "李芳", "王强", "赵丽", "孙伟", "周杰", "刘洋"];

  const filteredBatches = batches.filter(b => {
    if (stageFilter !== "全部" && b.stage !== stageFilter) return false;
    if (statusFilter !== "全部" && b.status !== statusFilter) return false;
    if (searchText && !b.id.includes(searchText)) return false;

    // Unified Personnel search (Current processor OR any role member)
    if (personnelSearch) {
      const currentProcessor = b.status === "待处理" ? "-" :
        b.stage === "标注" ? b.annotator :
          b.stage === "质检" ? b.qaer :
            b.stage === "验收" ? b.accepter :
              b.stage === "判定" ? b.judge : "-";
      const allMembers = [b.annotator, b.qaer, b.accepter, b.judge].join(",");

      if (!currentProcessor.includes(personnelSearch) && !allMembers.includes(personnelSearch)) {
        return false;
      }
    }

    // Date range filter
    if (startDate && b.updatedAt < startDate) return false;
    if (endDate && b.updatedAt > endDate) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredBatches.length / pageSize);
  const paginatedBatches = filteredBatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleAll = () => {
    const pageIds = paginatedBatches.filter(b => b.status !== "已废弃" && b.status !== "已完成").map(b => b.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedBatches.has(id));

    setSelectedBatches(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedBatches(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllResults = () => {
    const selectableIds = acceptResults
      .slice((resultsPage - 1) * resultsPageSize, resultsPage * resultsPageSize)
      .filter(r => r.result === "通过" && !r.archived)
      .map(r => r.batchId);

    const allOnPageSelected = selectableIds.length > 0 && selectableIds.every(id => selectedResults.has(id));

    setSelectedResults(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        selectableIds.forEach(id => next.delete(id));
      } else {
        selectableIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleOneResult = (id: string) => {
    setSelectedResults(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalResultsPages = Math.ceil(acceptResults.length / resultsPageSize);
  const paginatedResults = acceptResults.slice((resultsPage - 1) * resultsPageSize, resultsPage * resultsPageSize);

  const handleBulkArchiveSelection = () => {
    if (selectedResults.size === 0) return;
    setArchiveModal(""); // Use empty string to signal bulk archive
  };

  const handleBulkDiscardSelected = () => {
    if (selectedBatches.size === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: "批量废弃已选",
      message: `确定要废弃已选的 ${selectedBatches.size} 个批次吗？废弃后批次对全员不可见，此操作不可恢复。`,
      type: "destructive",
      onConfirm: () => {
        setBatches(prev => prev.map(b => selectedBatches.has(b.id) ? { ...b, status: "已废弃" as const } : b));
        toast.success(`已批量废弃 ${selectedBatches.size} 个批次`);
        setSelectedBatches(new Set());
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleTransfer = () => {
    if (!transferModal || !transferTarget) return;
    setBatches(prev => prev.map(b => b.id === transferModal.id ? { ...b, annotator: transferTarget, updater: transferTarget, updatedAt: new Date().toISOString().split("T")[0] } : b));
    toast.success(`批次 ${transferModal.id} 已转派给 ${transferTarget}`);
    setTransferModal(null); setTransferTarget("");
  };

  const handleRelease = (batch: BatchItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "释放批次",
      message: `确定要释放批次 ${batch.id} 吗？释放后批次将回归任务池，当前未提交的标注进度将丢失。`,
      type: "warning",
      onConfirm: () => {
        setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: "待处理" as const, annotator: "-", stage: "标注" as const } : b));
        toast.success(`批次 ${batch.id} 已释放，可被其他人员重新领取`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDiscard = (batch: BatchItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "废弃批次",
      message: `确定要废弃批次 ${batch.id} 吗？废弃后批次对全员不可见，已领取的批次同步释放，此操作不可恢复。`,
      type: "destructive",
      onConfirm: () => {
        setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: "已废弃" as const } : b));
        toast.success(`批次 ${batch.id} 已废弃`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBatchDiscard = () => {
    const pending = batches.filter(b => b.status === "待处理").map(b => b.id);
    if (pending.length === 0) {
      toast.info("没有待处理的批次");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "批量废弃未处理",
      message: `确定要废弃全部 ${pending.length} 个未处理批次吗？废弃后批次对全员不可见，此操作不可恢复。`,
      type: "destructive",
      onConfirm: () => {
        setBatches(prev => prev.map(b => pending.includes(b.id) ? { ...b, status: "已废弃" as const } : b));
        toast.success(`已批量废弃 ${pending.length} 个未处理批次`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleArchive = () => {
    if (archiveModal === null && selectedResults.size === 0) return;
    const idsToArchive = archiveModal && archiveModal !== "" ? [archiveModal] : Array.from(selectedResults);

    setAcceptResults(prev => prev.map(r => idsToArchive.includes(r.batchId) ? { ...r, archived: true } : r));
    toast.success(`已归档 ${idsToArchive.length} 个批次至 ${archiveDataset || "金融新闻语料库"} (${archiveVersion})`);
    setArchiveModal(null);
    setSelectedResults(new Set());
  };

  const overviewStats = [
    {
      label: "任务领取率",
      percentage: `${Math.round(task.claimedBatches / task.totalBatches * 100).toFixed(2)}%`,
      leftVal: task.totalBatches, leftLabel: "总标注批次",
      rightVal: task.claimedBatches, rightLabel: "已领取标注批次",
      showInfo: true,
      infoTooltip: "已领取标注批次含废弃批次",
      icon: Users
    },
    {
      label: "标注完成率",
      percentage: `${Math.round(task.annotatedData / task.totalData * 100).toFixed(2)}%`,
      leftVal: task.totalData, leftLabel: "总数据量",
      rightVal: task.annotatedData, rightLabel: "已提交标注量",
      showInfo: true,
      infoTooltip: "已提交标注量含提交被打回数据量",
      icon: BarChart3
    },
    {
      label: "质检合格率",
      percentage: "10.10%", // Mocking specific reference values for style match
      leftVal: 1000, leftLabel: "总抽检量",
      rightVal: 101, rightLabel: "抽检通过量",
      showInfo: false,
      infoTooltip: "",
      icon: Percent
    },
    {
      label: "验收合格率",
      percentage: "10.10%", // Mocking specific reference values for style match
      leftVal: 1000, leftLabel: "总验收量",
      rightVal: 101, rightLabel: "验收通过量",
      showInfo: false,
      infoTooltip: "",
      icon: CheckCircle2
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{task.name}</h1>
          <p className="text-sm text-muted-foreground">{task.id} · {task.projectType} · {task.type} · {task.status}</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((s, i) => (
          <div key={i} className="flex flex-col rounded-xl border overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow">
            {/* Header section (Light blue) */}
            <div className="bg-[#f0f4ff] px-4 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#475569]">{s.label}</span>
              <span className="text-2xl font-bold text-[#0F172A] tracking-tight">{s.percentage}</span>
            </div>
            {/* Details section (White) */}
            <div className="flex bg-white py-4">
              <div className="flex-1 px-4 flex flex-col items-center">
                <span className="text-lg font-bold text-[#0F172A]">{s.leftVal.toLocaleString()}</span>
                <span className="text-[11px] text-[#94A3B8] mt-0.5">{s.leftLabel}</span>
              </div>
              <div className="w-[1px] bg-gray-100 self-stretch" />
              <div className="flex-1 px-4 flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-[#0F172A]">{s.rightVal.toLocaleString()}</span>
                  {s.showInfo && (
                    <span title={s.infoTooltip} className="cursor-help">
                      <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-0.5">{s.rightLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b mb-4">
        {[{ key: "batches", label: "标注批次" }, { key: "results", label: "标注结果" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "batches" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchText} onChange={e => { setSearchText(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} placeholder="搜索批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
              <option>全部阶段</option>{["标注", "质检", "验收", "判定", "已完成"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
              <option>全部状态</option>{["待处理", "处理中", "已完成", "已废弃"].map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={personnelSearch} onChange={e => { setPersonnelSearch(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} placeholder="搜索处理人/参与成员..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} className="px-2 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" title="更新时间从" />
              <span className="text-muted-foreground">-</span>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); setSelectedBatches(new Set()); }} className="px-2 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" title="更新时间至" />
            </div>
            {selectedBatches.size > 0 ? (
              <button
                onClick={handleBulkDiscardSelected}
                className="ml-auto px-4 py-2 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 flex items-center gap-2 transition-all animate-in slide-in-from-right-4"
              >
                <Trash2 className="w-4 h-4" />
                批量废弃 ({selectedBatches.size})
              </button>
            ) : (
              <button onClick={handleBatchDiscard} className="ml-auto px-3 py-2 text-sm border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors">废弃全部未处理</button>
            )}
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto min-h-[400px] flex flex-col">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-muted/30 border-b text-[#64748b]">
                  <th className="py-3 px-4 text-left w-10">
                    <input
                      type="checkbox"
                      onChange={toggleAll}
                      checked={paginatedBatches.filter(b => b.status !== "已废弃" && b.status !== "已完成").length > 0 && paginatedBatches.filter(b => b.status !== "已废弃" && b.status !== "已完成").every(b => selectedBatches.has(b.id))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="py-3 px-4 text-left">批次ID</th>
                  <th className="py-3 px-4 text-right">大小</th>
                  <th className="py-3 px-4 text-left">阶段</th>
                  <th className="py-3 px-4 text-left">状态</th>
                  <th className="py-3 px-4 text-center">标注</th>
                  <th className="py-3 px-4 text-center">质检</th>
                  <th className="py-3 px-4 text-center">验收</th>
                  <th className="py-3 px-4 text-right">打回</th>
                  <th className="py-3 px-4 text-left">标注人</th>
                  <th className="py-3 px-4 text-left">质检人</th>
                  <th className="py-3 px-4 text-left">验收人</th>
                  <th className="py-3 px-4 text-left">更新时间</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.map(b => (
                  <tr key={b.id} className={`border-b last:border-0 hover:bg-muted/20 ${selectedBatches.has(b.id) ? "bg-primary/5" : ""}`}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedBatches.has(b.id)}
                        onChange={() => toggleOne(b.id)}
                        disabled={b.status === "已废弃" || b.status === "已完成"}
                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{b.id}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{b.size}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[b.stage] || "bg-muted text-muted-foreground"}`}>{b.stage}</span></td>
                    <td className="py-3 px-4"><span className={`text-xs ${b.status === "已废弃" ? "text-destructive" : b.status === "已完成" ? "text-emerald-600" : "text-muted-foreground"}`}>{b.status}</span></td>
                    <td className="py-3 px-4 text-center">{b.isAnnotated ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                    <td className="py-3 px-4 text-center">{b.isQA ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                    <td className="py-3 px-4 text-center">{b.isAccepted ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                    <td className="py-3 px-4 text-right">{b.rejectCount > 0 ? <span className="text-destructive font-medium">{b.rejectCount}</span> : "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{b.annotator}</td>
                    <td className="py-3 px-4 text-muted-foreground">{b.qaer}</td>
                    <td className="py-3 px-4 text-muted-foreground">{b.accepter}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{b.updatedAt}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setBatchDetail(b)} className="p-1 rounded hover:bg-muted/50" title="查看"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        {b.status === "处理中" && (
                          <>
                            <button onClick={() => setTransferModal(b)} className="p-1 rounded hover:bg-muted/50" title="转派"><ArrowRightLeft className="w-4 h-4 text-muted-foreground" /></button>
                            <button onClick={() => handleRelease(b)} className="p-1 rounded hover:bg-muted/50" title="释放"><Unlock className="w-4 h-4 text-muted-foreground" /></button>
                          </>
                        )}
                        {b.status !== "已废弃" && b.status !== "已完成" && (
                          <button onClick={() => handleDiscard(b)} className="p-1 rounded hover:bg-muted/50" title="废弃"><Trash2 className="w-4 h-4 text-destructive/60" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 mt-auto">
              <span className="text-xs text-muted-foreground">共 {filteredBatches.length} 个批次，当前显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredBatches.length)}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <span className="text-xs font-medium px-2">{currentPage} / {totalPages || 1}</span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card overflow-hidden min-h-[400px] flex flex-col">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">已验收详情</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkArchiveSelection}
                  className={`px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5 ${selectedResults.size > 0 ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"}`}
                  disabled={selectedResults.size === 0}
                >
                  <Archive className="w-3.5 h-3.5" />
                  批量归档 {selectedResults.size > 0 && `(${selectedResults.size})`}
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b text-[#64748b]">
                  <th className="py-3 px-4 text-left w-10">
                    <input
                      type="checkbox"
                      onChange={toggleAllResults}
                      checked={paginatedResults.filter(r => r.result === "通过" && !r.archived).length > 0 && paginatedResults.filter(r => r.result === "通过" && !r.archived).every(r => selectedResults.has(r.batchId))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="py-3 px-4 text-left">批次ID</th>
                  <th className="py-3 px-4 text-right">标注量</th>
                  <th className="py-3 px-4 text-right">验收量</th>
                  <th className="py-3 px-4 text-right">抽样比例</th>
                  <th className="py-3 px-4 text-right">错误量</th>
                  <th className="py-3 px-4 text-right">准确率</th>
                  <th className="py-3 px-4 text-left">验收人</th>
                  <th className="py-3 px-4 text-left">结果</th>
                  <th className="py-3 px-4 text-center">归档</th>
                  <th className="py-3 px-4 text-left">验收时间</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((r) => (
                  <tr key={r.batchId} className={`hover:bg-muted/20 transition-colors ${selectedResults.has(r.batchId) ? "bg-primary/5" : ""}`}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedResults.has(r.batchId)}
                        onChange={() => toggleOneResult(r.batchId)}
                        disabled={r.result === "未通过" || r.archived}
                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">{r.batchId}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.annotated}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.accepted}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.sampleRatio}</td>
                    <td className="py-3 px-4 text-right">{r.errors > 0 ? <span className="text-destructive font-medium">{r.errors}</span> : "0"}</td>
                    <td className="py-3 px-4 text-right"><span className={`font-semibold ${parseFloat(r.accuracy) >= 95 ? "text-emerald-600" : "text-destructive"}`}>{r.accuracy}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{r.accepter}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${r.result === "通过" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>{r.result}</span></td>
                    <td className="py-3 px-4 text-center">{r.archived ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{r.time}</td>
                    <td className="py-3 px-4 text-center">
                      {r.result === "通过" && !r.archived && (
                        <button onClick={() => setArchiveModal(r.batchId)} className="text-xs text-primary hover:underline font-medium">归档</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 mt-auto">
              <span className="text-xs text-muted-foreground">共 {acceptResults.length} 条记录，当前显示 {(resultsPage - 1) * resultsPageSize + 1}-{Math.min(resultsPage * resultsPageSize, acceptResults.length)}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={resultsPage === 1}
                  onClick={() => { setResultsPage(p => p - 1); setSelectedResults(new Set()); }}
                  className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <span className="text-xs font-medium px-2">{resultsPage} / {totalResultsPages || 1}</span>
                <button
                  disabled={resultsPage === totalResultsPages || totalResultsPages === 0}
                  onClick={() => { setResultsPage(p => p + 1); setSelectedResults(new Set()); }}
                  className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-3">转派批次 {transferModal.id}</h3>
            <p className="text-sm text-muted-foreground mb-3">选择目标处理人，转派后原处理人失去操作权限，标注进度保留。</p>
            <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-4">
              <option value="">选择目标处理人</option>
              {members.filter(m => m !== transferModal.annotator).map(m => <option key={m}>{m}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTransferModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleTransfer} disabled={!transferTarget} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">确认转派</button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl border shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-full ${confirmDialog.type === "destructive" ? "bg-destructive/10" : "bg-amber-100"}`}>
                {confirmDialog.type === "destructive" ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <Unlock className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <h3 className="font-semibold text-foreground">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted transition-colors"
              >
                取消操作
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmDialog.type === "destructive"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-amber-600 hover:bg-amber-700"
                  }`}
              >
                确认{confirmDialog.title.includes("释放") ? "释放" : "废弃"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive modal */}
      {archiveModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
          <div className="bg-card rounded-xl border shadow-2xl p-0 max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-muted/20 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Archive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {archiveModal === "" ? "批量归档数据" : "归档标注批次"}
                </h3>
                <p className="text-[11px] text-muted-foreground">将验收通过的数据回流至特定数据集</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Section */}
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">待归档对象</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {archiveModal === "" ? `已选记录 (${selectedResults.size})` : `批次 ID: ${archiveModal}`}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold">已验收通过</span>
                </div>
              </div>

              {/* Path Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">回流路径配置 (Return Path)</span>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-muted-foreground" />
                      目标数据集
                    </label>
                    <select
                      value={archiveDataset}
                      onChange={e => setArchiveDataset(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">金融新闻语料库 (Financial_News_v1)</option>
                      <option>医疗CT影像集中库 (Medical_Imaging_Main)</option>
                      <option>多语种客服对话集 (CS_Chat_Global)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      目标版本
                    </label>
                    <select
                      value={archiveVersion}
                      onChange={e => setArchiveVersion(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option>创建新版本</option>
                      <option>v1.0.5</option>
                      <option>v2.0.0</option>
                      <option>v2.1.0</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground italic">注意：回流操作不可逆，数据将增量插入数据集版本。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-muted/10 border-t">
              <button
                onClick={() => {
                  setArchiveModal(null);
                  if (archiveModal === "") setSelectedResults(new Set());
                }}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleArchive}
                className="px-6 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                确认并执行归档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch detail side panel */}
      {batchDetail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setBatchDetail(null)} />
          <div className="w-[480px] bg-card border-l shadow-xl overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold">批次详情 {batchDetail.id}</h3>
              <button onClick={() => setBatchDetail(null)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "批次ID", v: batchDetail.id },
                  { k: "标注量", v: `${batchDetail.size} 条` },
                  { k: "当前阶段", v: batchDetail.stage },
                  { k: "状态", v: batchDetail.status },
                  { k: "打回次数", v: batchDetail.rejectCount },
                  { k: "标注人员", v: batchDetail.annotator },
                  { k: "质检人员", v: batchDetail.qaer },
                  { k: "验收人员", v: batchDetail.accepter },
                  { k: "判定专家", v: batchDetail.judge },
                  { k: "创建时间", v: batchDetail.createdAt },
                  { k: "更新时间", v: batchDetail.updatedAt },
                  { k: "更新人", v: batchDetail.updater },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">{item.k}</p>
                    <p className="text-sm font-medium">{item.v}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">操作日志</h4>
                <div className="space-y-2">
                  {[
                    { time: "2026-02-20 10:00", user: "系统", action: "创建批次", note: "自动拆分生成" },
                    { time: "2026-02-21 09:30", user: batchDetail.annotator, action: "领取批次", note: "" },
                    { time: batchDetail.updatedAt + " 14:00", user: batchDetail.updater, action: "更新状态", note: `进入${batchDetail.stage}阶段` },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-muted-foreground w-32 shrink-0">{log.time}</span>
                      <span className="text-foreground font-medium w-16 shrink-0">{log.user}</span>
                      <span className="text-muted-foreground">{log.action} {log.note && `(${log.note})`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationTaskDetail;

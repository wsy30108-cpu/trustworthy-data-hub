import { useState } from "react";
import {
  ArrowLeft, Eye, MoreHorizontal, Search, Filter, ChevronDown,
  Trash2, RefreshCw, ArrowRightLeft, Unlock, AlertTriangle, X,
  CheckCircle2, Clock, Users, BarChart3, Percent, FileText,
  Archive, Download, ChevronRight
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
];

interface Props {
  task: { id: string; name: string; type: string; status: string; creator: string; createdAt: string; totalData: number; annotatedData: number; totalBatches: number; claimedBatches: number; annotationProgress: number; qaProgress: number; acceptProgress: number };
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
  const [batches, setBatches] = useState(mockBatches);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [transferModal, setTransferModal] = useState<BatchItem | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [discardConfirm, setDiscardConfirm] = useState<BatchItem | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchItem | null>(null);
  const [archiveModal, setArchiveModal] = useState<string | null>(null);
  const [archiveDataset, setArchiveDataset] = useState("");
  const [archiveVersion, setArchiveVersion] = useState("新建版本");

  const members = ["张明","李芳","王强","赵丽","孙伟","周杰","刘洋"];

  const filteredBatches = batches.filter(b => {
    if (stageFilter !== "全部" && b.stage !== stageFilter) return false;
    if (statusFilter !== "全部" && b.status !== statusFilter) return false;
    if (searchText && !b.id.includes(searchText)) return false;
    return true;
  });

  const handleTransfer = () => {
    if (!transferModal || !transferTarget) return;
    setBatches(prev => prev.map(b => b.id === transferModal.id ? { ...b, annotator: transferTarget, updater: transferTarget, updatedAt: new Date().toISOString().split("T")[0] } : b));
    toast.success(`批次 ${transferModal.id} 已转派给 ${transferTarget}`);
    setTransferModal(null); setTransferTarget("");
  };

  const handleRelease = (batch: BatchItem) => {
    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: "待处理" as const, annotator: "-", stage: "标注" as const } : b));
    toast.success(`批次 ${batch.id} 已释放，可被其他人员重新领取`);
  };

  const handleDiscard = () => {
    if (!discardConfirm) return;
    setBatches(prev => prev.map(b => b.id === discardConfirm.id ? { ...b, status: "已废弃" as const } : b));
    toast.success(`批次 ${discardConfirm.id} 已废弃`);
    setDiscardConfirm(null);
  };

  const handleBatchDiscard = () => {
    const pending = batches.filter(b => b.status === "待处理").map(b => b.id);
    if (pending.length === 0) { toast.info("没有待处理的批次"); return; }
    setBatches(prev => prev.map(b => pending.includes(b.id) ? { ...b, status: "已废弃" as const } : b));
    toast.success(`已批量废弃 ${pending.length} 个未处理批次`);
  };

  const handleArchive = () => {
    toast.success(`批次 ${archiveModal} 已归档至数据集 ${archiveDataset || "金融新闻语料库"} 的 ${archiveVersion}`);
    setArchiveModal(null);
  };

  const overviewStats = [
    { label: "任务领取率", value: `${Math.round(task.claimedBatches / task.totalBatches * 100)}%`, icon: Users },
    { label: "标注完成率", value: `${task.annotationProgress}%`, icon: BarChart3 },
    { label: "质检合格率", value: `${task.qaProgress}%`, icon: Percent },
    { label: "验收合格率", value: `${task.acceptProgress}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{task.name}</h1>
          <p className="text-sm text-muted-foreground">{task.id} · {task.type} · {task.status}</p>
        </div>
        <button className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> 导出</button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewStats.map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <s.icon className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
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
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
              <option>全部</option>{["标注","质检","验收","判定","已完成"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
              <option>全部</option>{["待处理","处理中","已完成","已废弃"].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={handleBatchDiscard} className="px-3 py-2 text-sm border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10">批量废弃未处理</button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">批次ID</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注量</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">阶段</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">标注</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">质检</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">验收</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">打回</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标注人</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">质检人</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">验收人</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">更新时间</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
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
                          <button onClick={() => setDiscardConfirm(b)} className="p-1 rounded hover:bg-muted/50" title="废弃"><Trash2 className="w-4 h-4 text-destructive/60" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">共 {filteredBatches.length} 个批次</span>
            </div>
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h4 className="text-sm font-medium">已验收详情</h4>
              <button onClick={() => toast.info("批量归档功能")} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"><Archive className="w-3.5 h-3.5" /> 批量归档</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">批次ID</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">抽样比例</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">错误量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">准确率</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">验收人</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">结果</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">归档</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">验收时间</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockAcceptResults.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{r.batchId}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.annotated}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.accepted}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{r.sampleRatio}</td>
                    <td className="py-3 px-4 text-right">{r.errors > 0 ? <span className="text-destructive font-medium">{r.errors}</span> : "0"}</td>
                    <td className="py-3 px-4 text-right"><span className={`font-medium ${parseFloat(r.accuracy) >= 95 ? "text-emerald-600" : "text-destructive"}`}>{r.accuracy}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{r.accepter}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${r.result === "通过" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>{r.result}</span></td>
                    <td className="py-3 px-4 text-center">{r.archived ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{r.time}</td>
                    <td className="py-3 px-4 text-center">
                      {r.result === "通过" && !r.archived && (
                        <button onClick={() => setArchiveModal(r.batchId)} className="text-xs text-primary hover:underline">归档</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Discard confirm */}
      {discardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-destructive" /><h3 className="font-semibold">废弃批次</h3></div>
            <p className="text-sm text-muted-foreground mb-4">废弃后批次对全员不可见，已领取的批次同步释放，此操作不可恢复。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDiscardConfirm(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleDiscard} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">确认废弃</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive modal */}
      {archiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-3">归档批次 {archiveModal}</h3>
            <p className="text-sm text-muted-foreground mb-3">归档的标注批次将回流到特定数据集的特定版本</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">目标数据集</label>
                <select value={archiveDataset} onChange={e => setArchiveDataset(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background">
                  <option value="">金融新闻语料库</option>
                  <option>医疗CT影像集</option>
                  <option>客服对话数据</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">目标版本</label>
                <select value={archiveVersion} onChange={e => setArchiveVersion(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background">
                  <option>新建版本</option>
                  <option>v1.0</option>
                  <option>v2.0</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setArchiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleArchive} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认归档</button>
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

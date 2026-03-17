import { useState } from "react";
import {
  Search, Play, Eye, ArrowRightLeft, Unlock,
  ClipboardList, CheckCircle, Clock, X, Send, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import DataAnnotationWorkbench from "./DataAnnotationWorkbench";

interface MyTask {
  id: string;
  taskName: string;
  authorizedTo: string;
  progress: number;
  total: number;
  done: number;
  status: "进行中" | "已完成";
  projectType: string;
  taskType: string;
  creator: string;
  createdAt: string;
}

const mockMyTasks: MyTask[] = [
  { id: "BT-001", taskName: "金融文本情感标注", authorizedTo: "任务池", progress: 65, total: 200, done: 130, status: "进行中", projectType: "文本类", taskType: "情感与倾向", creator: "张明", createdAt: "2026-02-20" },
  { id: "BT-004", taskName: "语音转写质检", authorizedTo: "NLP研发组", progress: 40, total: 50, done: 20, status: "进行中", projectType: "音频类", taskType: "音频转写", creator: "赵丽", createdAt: "2026-03-01" },
  { id: "BT-007", taskName: "客服对话意图标注", authorizedTo: "任务池", progress: 100, total: 500, done: 500, status: "已完成", projectType: "文本类", taskType: "内容分类与审核", creator: "王强", createdAt: "2026-01-28" },
  { id: "BT-008", taskName: "医疗图像分类标注", authorizedTo: "AI数据团队", progress: 100, total: 100, done: 100, status: "已完成", projectType: "图像类", taskType: "图像分类", creator: "李芳", createdAt: "2026-02-15" },
  { id: "BT-010", taskName: "电商评论极性标注", authorizedTo: "任务池", progress: 30, total: 300, done: 90, status: "进行中", projectType: "文本类", taskType: "情感与倾向", creator: "周杰", createdAt: "2026-03-05" },
  { id: "BT-011", taskName: "街景目标检测标注", authorizedTo: "任务池", progress: 15, total: 1000, done: 150, status: "进行中", projectType: "图像类", taskType: "目标检测", creator: "孙伟", createdAt: "2026-03-08" },
  { id: "BT-012", taskName: "多意图对话分类", authorizedTo: "NLP研发组", progress: 50, total: 200, done: 100, status: "进行中", projectType: "文本类", taskType: "内容分类与审核", creator: "刘洋", createdAt: "2026-03-10" },
  { id: "BT-013", taskName: "视频人脸关键点", authorizedTo: "AI数据团队", progress: 80, total: 500, done: 400, status: "进行中", projectType: "视频类", taskType: "特征提取", creator: "王强", createdAt: "2026-03-12" },
  { id: "BT-014", taskName: "德语翻译质量评价", authorizedTo: "任务池", progress: 0, total: 100, done: 0, status: "进行中", projectType: "文本类", taskType: "翻译评估", creator: "张明", createdAt: "2026-03-14" },
  { id: "BT-015", taskName: "遥感图像建筑物提取", authorizedTo: "任务池", progress: 45, total: 400, done: 180, status: "进行中", projectType: "图像类", taskType: "语义分割", creator: "李芳", createdAt: "2026-03-15" },
  { id: "BT-016", taskName: "法律条款实体抽取", authorizedTo: "NLP研发组", progress: 75, total: 600, done: 450, status: "进行中", projectType: "文本类", taskType: "命名实体识别", creator: "赵丽", createdAt: "2026-03-16" },
  { id: "BT-002", taskName: "商品图像分类", authorizedTo: "任务池", progress: 100, total: 250, done: 250, status: "已完成", projectType: "图像类", taskType: "图像分类", creator: "孙伟", createdAt: "2026-02-10" },
];

const PAGE_SIZES = [10, 20, 50];

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const DataAnnotationMyTasks = () => {
  const [tab, setTab] = useState<"active" | "done">("active");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [workbenchTask, setWorkbenchTask] = useState<MyTask | null>(null);
  const [transferModal, setTransferModal] = useState<MyTask | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState<MyTask | null>(null);
  const [releaseConfirm, setReleaseConfirm] = useState<MyTask | null>(null);
  const [tasks, setTasks] = useState(mockMyTasks);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const members = ["张明", "李芳", "王强", "赵丽", "孙伟", "周杰"];

  const filtered = tasks.filter(t => {
    if (tab === "active" && t.status !== "进行中") return false;
    if (tab === "done" && t.status !== "已完成") return false;
    if (typeFilter !== "全部" && t.projectType !== typeFilter) return false;
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
    return <DataAnnotationWorkbench task={workbenchTask} onBack={() => setWorkbenchTask(null)} />;
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card flex items-center gap-3"><ClipboardList className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">进行中</p><p className="text-xl font-bold text-foreground">{activeCount}</p></div></div>
        <div className="stat-card flex items-center gap-3"><CheckCircle className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">已完成</p><p className="text-xl font-bold text-foreground">{doneCount}</p></div></div>
        <div className="stat-card flex items-center gap-3"><Clock className="w-8 h-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">总标注量</p><p className="text-xl font-bold text-foreground">{tasks.reduce((s, t) => s + t.done, 0)}</p></div></div>
        <div className="stat-card flex items-center gap-3"><Play className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">待标注</p><p className="text-xl font-bold text-foreground">{tasks.filter(t => t.status === "进行中").reduce((s, t) => s + t.total - t.done, 0)}</p></div></div>
      </div>

      <div className="flex items-center gap-1 border-b">
        <button onClick={() => { setTab("active"); setPage(1); }} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "active" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>进行中的任务 ({activeCount})</button>
        <button onClick={() => { setTab("done"); setPage(1); }} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "done" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>已完成的任务 ({doneCount})</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} placeholder="搜索任务名称或批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          {["文本类", "图像类", "音频类", "视频类"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">批次ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">授权对象</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">项目类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
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
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "已完成" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>{t.status}</span></td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[t.projectType]}`}>{t.projectType}</span></td>
                <td className="py-3 px-4 text-muted-foreground">{t.creator}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{t.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setWorkbenchTask(t)} className="p-1 rounded hover:bg-muted/50" title={t.status === "进行中" ? "继续标注" : "查看详情"}>
                      {t.status === "进行中" ? <Play className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {t.status === "进行中" && (
                      <>
                        <button onClick={() => setTransferModal(t)} className="p-1 rounded hover:bg-muted/50" title="转派"><ArrowRightLeft className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => setReleaseConfirm(t)} className="p-1 rounded hover:bg-muted/50" title="释放"><Unlock className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => setSubmitConfirm(t)} className="p-1 rounded hover:bg-muted/50" title="提交"><Send className="w-4 h-4 text-muted-foreground" /></button>
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
    </div>
  );
};

export default DataAnnotationMyTasks;

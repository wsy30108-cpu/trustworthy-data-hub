import { useState } from "react";
import {
  Search, Play, Eye, ArrowRightLeft, Unlock, MoreHorizontal,
  ClipboardList, CheckCircle, Clock, X, Send
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
];

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
  const [tasks, setTasks] = useState(mockMyTasks);

  const members = ["张明","李芳","王强","赵丽","孙伟","周杰"];

  const filtered = tasks.filter(t => {
    if (tab === "active" && t.status !== "进行中") return false;
    if (tab === "done" && t.status !== "已完成") return false;
    if (typeFilter !== "全部" && t.projectType !== typeFilter) return false;
    if (searchText && !t.taskName.includes(searchText) && !t.id.includes(searchText)) return false;
    return true;
  });

  const handleRelease = (task: MyTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    toast.success(`批次 ${task.id} 已释放，未提交的标注数据不保留`);
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
        <button onClick={() => setTab("active")} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "active" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>进行中的任务 ({activeCount})</button>
        <button onClick={() => setTab("done")} className={`px-4 py-2.5 text-sm border-b-2 ${tab === "done" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>已完成的任务 ({doneCount})</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索任务名称或批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          {["文本类","图像类","音频类","视频类"].map(t => <option key={t}>{t}</option>)}
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
            {filtered.map(t => (
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
                        <button onClick={() => handleRelease(t)} className="p-1 rounded hover:bg-muted/50" title="释放"><Unlock className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => setSubmitConfirm(t)} className="p-1 rounded hover:bg-muted/50" title="提交"><Send className="w-4 h-4 text-muted-foreground" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            <h3 className="font-semibold mb-2">提交批次</h3>
            <p className="text-sm text-muted-foreground mb-2">当前已标注 {submitConfirm.done}/{submitConfirm.total}，有 {submitConfirm.total - submitConfirm.done} 条未标注，是否提交？</p>
            <p className="text-xs text-amber-600 mb-4">提交后将进入下一流程环节，标注人员不可再修改内容</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSubmitConfirm(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">确认提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationMyTasks;

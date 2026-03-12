import { useState, useCallback } from "react";
import {
  ArrowLeft, Undo2, Redo2, BookOpen, Keyboard, Ban, Send,
  ChevronLeft, ChevronRight, Tag, MessageSquare, List, Link2,
  Save, Clock, CheckCircle2, X, AlertTriangle, Info
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  task: { id: string; taskName: string; total: number; done: number };
  onBack: () => void;
}

type SampleStatus = "未标注" | "已标注" | "无效跳过";

interface Sample {
  id: number;
  content: string;
  status: SampleStatus;
  label: string | null;
  metadata: Record<string, string>;
}

const labels = [
  { value: "正面", color: "#22c55e", shortcut: "1" },
  { value: "负面", color: "#ef4444", shortcut: "2" },
  { value: "中性", color: "#6b7280", shortcut: "3" },
];

const DataAnnotationWorkbench = ({ task, onBack }: Props) => {
  const [samples] = useState<Sample[]>(() =>
    Array.from({ length: task.total }, (_, i) => ({
      id: i + 1,
      content: i % 3 === 0
        ? "央行今日公布最新货币政策，维持基准利率不变。市场分析人士认为，这一决定符合预期，有助于稳定当前经济形势。"
        : i % 3 === 1
          ? "某科技公司股价暴跌20%，投资者恐慌性抛售。公司回应称正在积极调整战略，但市场信心仍然不足。"
          : "A股今日窄幅震荡，成交量持续萎缩。多空双方力量均衡，市场等待进一步政策指引。",
      status: i < task.done ? "已标注" : "未标注",
      label: i < task.done ? labels[i % 3].value : null,
      metadata: {},
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(task.done < task.total ? task.done : 0);
  const [sampleStates, setSampleStates] = useState<Map<number, { status: SampleStatus; label: string | null }>>(
    () => new Map(samples.map(s => [s.id, { status: s.status, label: s.label }]))
  );
  const [rightTab, setRightTab] = useState<"info" | "log" | "list" | "relation">("info");
  const [showSpec, setShowSpec] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [undoStack, setUndoStack] = useState<{ id: number; prev: { status: SampleStatus; label: string | null } }[]>([]);
  const [redoStack, setRedoStack] = useState<{ id: number; prev: { status: SampleStatus; label: string | null } }[]>([]);

  const current = samples[currentIndex];
  const currentState = sampleStates.get(current.id) || { status: "未标注", label: null };

  const setLabel = useCallback((label: string) => {
    const prev = sampleStates.get(current.id)!;
    setUndoStack(s => [...s, { id: current.id, prev: { ...prev } }]);
    setRedoStack([]);
    setSampleStates(prev => {
      const next = new Map(prev);
      next.set(current.id, { status: "已标注", label });
      return next;
    });
    toast.success(`已标注: ${label}`, { duration: 1000 });
    // Auto advance
    if (currentIndex < samples.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  }, [current, currentIndex, samples.length, sampleStates]);

  const markInvalid = useCallback(() => {
    const prev = sampleStates.get(current.id)!;
    setUndoStack(s => [...s, { id: current.id, prev: { ...prev } }]);
    setRedoStack([]);
    setSampleStates(prev => {
      const next = new Map(prev);
      next.set(current.id, { status: "无效跳过", label: null });
      return next;
    });
    if (currentIndex < samples.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  }, [current, currentIndex, samples.length, sampleStates]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const current = sampleStates.get(last.id)!;
    setRedoStack(s => [...s, { id: last.id, prev: { ...current } }]);
    setSampleStates(prev => { const n = new Map(prev); n.set(last.id, last.prev); return n; });
    setUndoStack(s => s.slice(0, -1));
  }, [undoStack, sampleStates]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    const current = sampleStates.get(last.id)!;
    setUndoStack(s => [...s, { id: last.id, prev: { ...current } }]);
    setSampleStates(prev => { const n = new Map(prev); n.set(last.id, last.prev); return n; });
    setRedoStack(s => s.slice(0, -1));
  }, [redoStack, sampleStates]);

  const annotatedCount = Array.from(sampleStates.values()).filter(s => s.status === "已标注").length;
  const invalidCount = Array.from(sampleStates.values()).filter(s => s.status === "无效跳过").length;
  const unannotatedCount = samples.length - annotatedCount - invalidCount;

  const handleSubmit = () => {
    toast.success("批次已提交，进入下一流程环节");
    onBack();
  };

  const getStatusColor = (status: SampleStatus) => {
    if (status === "已标注") return "bg-emerald-500";
    if (status === "无效跳过") return "bg-destructive";
    return "bg-muted-foreground/30";
  };

  // Keyboard shortcuts
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "ArrowLeft") setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex(i => Math.min(samples.length - 1, i + 1));
      labels.forEach(l => { if (e.key === l.shortcut) setLabel(l.value); });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Top toolbar */}
      <div className="h-12 border-b bg-card flex items-center px-4 gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-muted/50"><ArrowLeft className="w-4 h-4" /></button>
        <span className="text-sm font-medium truncate">{task.taskName}</span>
        <span className="text-xs text-muted-foreground">批次 {task.id}</span>
        <div className="flex-1" />
        <button onClick={undo} disabled={undoStack.length === 0} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30" title="撤销 (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
        <button onClick={redo} disabled={redoStack.length === 0} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30" title="恢复 (Ctrl+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-border" />
        <button onClick={() => setShowSpec(true)} className="p-1.5 rounded hover:bg-muted/50 flex items-center gap-1 text-xs"><BookOpen className="w-4 h-4" /> 标注规范</button>
        <button onClick={() => setShowShortcuts(true)} className="p-1.5 rounded hover:bg-muted/50 flex items-center gap-1 text-xs"><Keyboard className="w-4 h-4" /> 快捷键</button>
        <div className="w-px h-5 bg-border" />
        <button onClick={markInvalid} className="p-1.5 rounded hover:bg-muted/50 text-destructive flex items-center gap-1 text-xs"><Ban className="w-4 h-4" /> 无效</button>
        <button onClick={() => setShowSubmitConfirm(true)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"><Send className="w-3.5 h-3.5" /> 提交</button>
        <div className="w-px h-5 bg-border" />
        <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-xs text-muted-foreground">{currentIndex + 1} / {samples.length}</span>
        <button onClick={() => setCurrentIndex(i => Math.min(samples.length - 1, i + 1))} disabled={currentIndex === samples.length - 1} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Annotation canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Label bar */}
          <div className="h-10 border-b bg-card/50 flex items-center gap-2 px-4 overflow-x-auto">
            {labels.map(l => {
              const count = Array.from(sampleStates.values()).filter(s => s.label === l.value).length;
              return (
                <button key={l.value} onClick={() => setLabel(l.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors ${currentState.label === l.value ? "ring-2 ring-offset-1" : "hover:bg-muted/50"}`}
                  style={{ borderColor: l.color, color: l.color, ...(currentState.label === l.value ? { backgroundColor: l.color + "20", ringColor: l.color } : {}) }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.value} ({count})
                  <kbd className="ml-1 text-[10px] text-muted-foreground">{l.shortcut}</kbd>
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
            <div className="max-w-2xl w-full">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(currentState.status)}`} />
                <span className="text-xs text-muted-foreground">#{current.id} · {currentState.status}</span>
                {currentState.label && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: labels.find(l => l.value === currentState.label)?.color, backgroundColor: (labels.find(l => l.value === currentState.label)?.color || "#666") + "15" }}>
                    {currentState.label}
                  </span>
                )}
              </div>
              <div className="rounded-lg border bg-card p-6 text-base leading-relaxed select-text">
                {current.content}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="w-72 border-l bg-card flex flex-col shrink-0">
          <div className="flex border-b">
            {[
              { key: "info", label: "标注信息", icon: Tag },
              { key: "log", label: "日志", icon: Clock },
              { key: "list", label: "列表", icon: List },
              { key: "relation", label: "关系", icon: Link2 },
            ].map(t => (
              <button key={t.key} onClick={() => setRightTab(t.key as any)}
                className={`flex-1 py-2 text-[10px] border-b-2 flex flex-col items-center gap-0.5 ${rightTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === "info" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">标注ID</p>
                  <p className="text-sm">#{current.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">当前标签</p>
                  <p className="text-sm">{currentState.label || "未标注"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">状态</p>
                  <p className="text-sm">{currentState.status}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-[10px] text-muted-foreground mb-2">自定义元数据</p>
                  <button className="text-xs text-primary hover:underline">+ 添加元数据</button>
                </div>
              </div>
            )}
            {rightTab === "log" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">标注操作日志</p>
                {undoStack.slice(-10).reverse().map((entry, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">#{entry.id}: {entry.prev.label || "未标注"} → {sampleStates.get(entry.id)?.label || "未标注"}</p>
                  </div>
                ))}
                {undoStack.length === 0 && <p className="text-xs text-muted-foreground">暂无操作记录</p>}
              </div>
            )}
            {rightTab === "list" && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2">当前样本标注列表</p>
                {Array.from(sampleStates.entries()).filter(([_, s]) => s.label).slice(0, 20).map(([id, s]) => (
                  <div key={id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30 cursor-pointer" onClick={() => setCurrentIndex(id - 1)}>
                    <span className="text-muted-foreground">#{id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ color: labels.find(l => l.value === s.label)?.color, backgroundColor: (labels.find(l => l.value === s.label)?.color || "#666") + "15" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
            {rightTab === "relation" && (
              <div className="text-xs text-muted-foreground">
                <p>标签间关系管理</p>
                <p className="mt-2">暂无关系配置</p>
                <button className="mt-2 text-primary hover:underline">+ 建立关系</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Sample navigation */}
      <div className="h-10 border-t bg-card flex items-center px-4 gap-1 overflow-x-auto shrink-0">
        {samples.slice(0, Math.min(samples.length, 50)).map((s, i) => {
          const state = sampleStates.get(s.id);
          return (
            <button key={s.id} onClick={() => setCurrentIndex(i)}
              className={`w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center shrink-0 transition-colors ${
                i === currentIndex ? "ring-2 ring-primary ring-offset-1" : ""
              } ${getStatusColor(state?.status || "未标注")} text-white`}>
              {s.id}
            </button>
          );
        })}
        {samples.length > 50 && <span className="text-xs text-muted-foreground ml-2">... 共{samples.length}条</span>}
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 已标注 {annotatedCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> 无效 {invalidCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> 未标注 {unannotatedCount}</span>
        </div>
      </div>

      {/* Spec modal */}
      {showSpec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> 标注规范</h3>
              <button onClick={() => setShowSpec(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="prose prose-sm text-sm">
              <p>请根据文本整体情感倾向进行分类标注：</p>
              <ul>
                <li><strong>正面</strong>：文本表达积极、乐观的情感，如利好消息、业绩增长等</li>
                <li><strong>负面</strong>：文本表达消极、悲观的情感，如风险预警、亏损下跌等</li>
                <li><strong>中性</strong>：文本无明显情感倾向，如事实陈述、数据报告等</li>
              </ul>
              <p><strong>注意事项：</strong></p>
              <ol>
                <li>以文本整体情感为准，不要被个别词汇影响</li>
                <li>如遇模糊情况，优先标注为中性</li>
                <li>同一文本不可标注多个标签</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">快捷键</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-sm">
              {labels.map(l => (
                <div key={l.value} className="flex justify-between"><span>{l.value}</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">{l.shortcut}</kbd></div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-2">
                <div className="flex justify-between"><span>上一题</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">←</kbd></div>
                <div className="flex justify-between"><span>下一题</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">→</kbd></div>
                <div className="flex justify-between"><span>撤销</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd></div>
                <div className="flex justify-between"><span>恢复</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">Ctrl+Shift+Z</kbd></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirm */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-2">提交批次</h3>
            <p className="text-sm text-muted-foreground mb-2">
              当前已标注 {annotatedCount}/{samples.length}，有 {unannotatedCount} 条未标注
              {invalidCount > 0 && `，${invalidCount} 条无效跳过`}
              ，是否提交？
            </p>
            {unannotatedCount > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>存在未标注数据，提交后不可再修改</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSubmitConfirm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationWorkbench;

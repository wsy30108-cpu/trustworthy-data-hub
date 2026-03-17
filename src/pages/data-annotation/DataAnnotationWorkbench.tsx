import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft, Undo2, Redo2, BookOpen, Keyboard, Ban, Send,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Tag, Clock, List, Link2,
  X, AlertTriangle, Plus, Filter, SortAsc, Search, PanelRightClose, PanelRightOpen
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

interface Annotation {
  id: string;
  sampleId: number;
  label: string;
  content: string;
  group: string;
  tool: string;
  createdAt: string;
  score: number;
}

interface LabelRelation {
  id: string;
  from: string;
  to: string;
  relationType: string;
}

interface AnnotationLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  target: string;
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
  const [rightUpperTab, setRightUpperTab] = useState<"info" | "log">("info");
  const [rightLowerTab, setRightLowerTab] = useState<"list" | "relation">("list");
  const [showSpec, setShowSpec] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [undoStack, setUndoStack] = useState<{ id: number; prev: { status: SampleStatus; label: string | null } }[]>([]);
  const [redoStack, setRedoStack] = useState<{ id: number; prev: { status: SampleStatus; label: string | null } }[]>([]);
  const [listGroupMode, setListGroupMode] = useState<"none" | "tool" | "label" | "manual">("none");
  const [listSortMode, setListSortMode] = useState<"time" | "score">("time");
  const [metadataKey, setMetadataKey] = useState("");
  const [metadataValue, setMetadataValue] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<number, Record<string, string>>>({});
  const [listSearch, setListSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<AnnotationLogEntry[]>([]);

  // Label relations
  const [relations, setRelations] = useState<LabelRelation[]>([]);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRelFrom, setNewRelFrom] = useState("");
  const [newRelTo, setNewRelTo] = useState("");
  const [newRelType, setNewRelType] = useState("相关");
  const [labelSearch, setLabelSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Annotations list for current sample
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const initial: Annotation[] = [];
    samples.filter(s => s.label).forEach(s => {
      initial.push({
        id: `ann-${s.id}`,
        sampleId: s.id,
        label: s.label!,
        content: s.content.slice(0, 30) + "...",
        group: s.id % 2 === 0 ? "组A" : "组B",
        tool: s.id % 4 === 0 ? "文本提取器" : "手动辅助",
        createdAt: `2026-03-10 14:${30 + (s.id % 20)}`,
        score: Math.floor(Math.random() * 40) + 60,
      });
    });
    return initial;
  });

  // Initialize mock logs
  useEffect(() => {
    if (logs.length === 0 && annotations.length > 0) {
      const initialLogs: AnnotationLogEntry[] = annotations.map((ann, i) => ({
        id: `log-init-${i}`,
        timestamp: ann.createdAt,
        operator: ann.sampleId % 3 === 0 ? "标注员B" : "标注员A",
        action: `打标:${ann.label}`,
        target: `SAMPLE #${ann.sampleId}`
      }));
      setLogs(initialLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    }
  }, [annotations]);

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
    // Update or add annotation
    setAnnotations(prev => {
      const existing = prev.findIndex(a => a.sampleId === current.id);
      const logEntry: AnnotationLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        operator: "标注员A",
        action: `打标:${label}`,
        target: `SAMPLE #${current.id}`
      };
      setLogs(l => [logEntry, ...l]);

      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], label, createdAt: new Date().toLocaleString() };
        return updated;
      }
      return [...prev, {
        id: `ann-${current.id}`,
        sampleId: current.id,
        label,
        content: current.content.slice(0, 30) + "...",
        group: "默认",
        tool: "手动标注",
        createdAt: new Date().toLocaleString(),
        score: 100
      }];
    });
    toast.success(`已标注: ${label}`, { duration: 1000 });
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
    setLogs(l => [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      operator: "标注员A",
      action: "标记无效",
      target: `SAMPLE #${current.id}`
    }, ...l]);
    if (currentIndex < samples.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  }, [current, currentIndex, samples.length, sampleStates]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const cur = sampleStates.get(last.id)!;
    setRedoStack(s => [...s, { id: last.id, prev: { ...cur } }]);
    setSampleStates(prev => {
      const next = new Map(prev);
      next.set(last.id, last.prev);
      return next;
    });
    setUndoStack(s => s.slice(0, -1));
  }, [undoStack, sampleStates]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    const cur = sampleStates.get(last.id)!;
    setUndoStack(s => [...s, { id: last.id, prev: { ...cur } }]);
    setSampleStates(prev => {
      const next = new Map(prev);
      next.set(last.id, last.prev);
      return next;
    });
    setRedoStack(s => s.slice(0, -1));
  }, [redoStack, sampleStates]);

  const addMetadata = useCallback(() => {
    if (!metadataKey.trim()) return;
    setCustomMetadata(prev => ({
      ...prev,
      [current.id]: {
        ...(prev[current.id] || {}),
        [metadataKey.trim()]: metadataValue
      }
    }));
    setMetadataKey("");
    setMetadataValue("");
    toast.success("元数据已添加");
  }, [current.id, metadataKey, metadataValue]);

  const removeMetadata = useCallback((key: string) => {
    setCustomMetadata(prev => {
      if (!prev[current.id]) return prev;
      const next = { ...prev };
      const nextSub = { ...next[current.id] };
      delete nextSub[key];
      next[current.id] = nextSub;
      return next;
    });
    toast.info("元数据已移除");
  }, [current.id]);

  const annotatedCount = Array.from(sampleStates.values()).filter(s => s.status === "已标注").length;
  const invalidCount = Array.from(sampleStates.values()).filter(s => s.status === "无效跳过").length;
  const unannotatedCount = samples.length - annotatedCount - invalidCount;

  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const handleSubmit = () => {
    toast.success("批次已提交，进入下一流程环节");
    onBack();
  };

  const getStatusColor = (status: SampleStatus) => {
    if (status === "已标注") return "bg-emerald-500";
    if (status === "无效跳过") return "bg-destructive";
    return "bg-muted-foreground/30";
  };


  // Group annotations
  const getGroupedAnnotations = () => {
    let filteredAnnotations = annotations.filter(a => {
      const matchesSearch = listSearch === "" ||
        a.label.includes(listSearch) ||
        a.content.includes(listSearch) ||
        a.id.includes(listSearch);
      return matchesSearch;
    });

    filteredAnnotations.sort((a, b) => {
      if (listSortMode === "score") return b.score - a.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (listGroupMode === "none") {
      return { "全部标注": filteredAnnotations };
    }

    const groups: Record<string, Annotation[]> = {};
    filteredAnnotations.forEach(a => {
      let key = "其它";
      if (listGroupMode === "label") key = a.label;
      else if (listGroupMode === "tool") key = a.tool;
      else if (listGroupMode === "manual") key = a.group;

      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "ArrowLeft") setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex(i => Math.min(samples.length - 1, i + 1));
      labels.forEach(l => { if (e.key === l.shortcut) setLabel(l.value); });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, setLabel, samples.length]);

  // Handle active sample scroll centering
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector(`[data-sample-index="${currentIndex}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    }
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Top toolbar */}
      <div className="h-12 border-b bg-card flex items-center px-4 gap-2 shrink-0">
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
        <button onClick={handleSubmitClick} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"><Send className="w-3.5 h-3.5" /> 提交</button>
        <div className="w-px h-5 bg-border ml-1" />
        <button
          onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
          className={`p-1.5 rounded transition-colors ${rightSidebarVisible ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted/50"}`}
          title={rightSidebarVisible ? "收起侧边栏" : "展开侧边栏"}
        >
          {rightSidebarVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Annotation canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top label bar */}
          <div className="border-b bg-card p-4 space-y-4 shadow-sm z-10">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                value={labelSearch}
                onChange={e => setLabelSearch(e.target.value)}
                placeholder="快速过滤标签..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.filter(l => l.value.includes(labelSearch)).map(l => {
                const isSelected = currentState.label === l.value;
                const count = Array.from(sampleStates.values()).filter(s => s.label === l.value).length;
                return (
                  <button
                    key={l.value}
                    onClick={() => setLabel(l.value)}
                    className={`flex items-center rounded-sm overflow-hidden border transition-all hover:shadow-sm h-8 ${isSelected ? "ring-1 ring-primary ring-offset-0 border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30 bg-card"}`}
                  >
                    <div className="w-1 h-full shrink-0" style={{ backgroundColor: l.color }} />
                    <div className="px-3 py-1 flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: isSelected ? "inherit" : "#374151" }}>{l.value}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono bg-muted/30 px-1 rounded">{l.shortcut}</span>
                      {count > 0 && <span className="text-[10px] text-muted-foreground">({count})</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content area - annotation canvas */}
          <div className="flex-1 p-12 overflow-y-auto flex items-start justify-center bg-[#f8fafc] dark:bg-slate-900/10">
            <div className="max-w-4xl w-full space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-2">请阅读标注内容</h2>
                <div className="text-sm text-slate-500 mb-4">Sample: #{current.id} · {currentState.status}</div>
                <div className="rounded-xl border border-slate-200 bg-card overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex divide-x divide-slate-100">
                    <div className="bg-slate-50/50 py-8 px-4 flex flex-col items-end select-none text-slate-300 font-mono text-xs gap-[1.6em]">
                      {current.content.split("\n").map((_, i) => (
                        <span key={i}>{i + 1} |</span>
                      ))}
                    </div>
                    <div className="flex-1 p-8 text-[17px] leading-[1.6] text-slate-700 select-text cursor-text whitespace-pre-wrap font-medium">
                      {current.content.split("\n").map((line, i) => (
                        <div key={i} className="min-h-[1.6em]">
                          {line || " "}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4">选择对应标注片段的答案：</h2>
                <div className="flex flex-wrap gap-3">
                  {currentState.label ? (
                    <div className="flex items-center rounded-sm overflow-hidden border border-primary/20 bg-primary/5 h-8">
                      <div className="w-1 h-full shrink-0" style={{ backgroundColor: labels.find(l => l.value === currentState.label)?.color || "currentColor" }} />
                      <div className="px-3 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{currentState.label}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-mono bg-muted/30 px-1 rounded">
                          {labels.find(l => l.value === currentState.label)?.shortcut}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">尚未选择标签...</div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* Right: Info panel - unified and collapsible */}
        <div className={`border-l bg-[#f8fafc] flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${rightSidebarVisible ? "w-80 opacity-100" : "w-0 opacity-0 border-l-0"}`}>
          <div className="flex-1 flex flex-col min-w-0 m-4 rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Upper Tab Section */}
            <div className="flex-1 flex flex-col min-h-0 border-b overflow-hidden">
              <div className="flex border-b bg-muted/5">
                {[
                  { key: "info", label: "标注信息", icon: Tag },
                  { key: "log", label: "标注日志", icon: Clock },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setRightUpperTab(t.key as any)}
                    className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${rightUpperTab === t.key
                      ? "border-primary text-primary bg-primary/[0.02]"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {rightUpperTab === "info" && (
                  <div className="space-y-5">
                    <section>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Basic Info</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">标注ID</span>
                          <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">#{current.id}</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs text-slate-500">当前结果</span>
                          {currentState.label ? (
                            <div className="flex items-center rounded-sm overflow-hidden border border-primary/20 bg-primary/5 h-8">
                              <div className="w-1 h-full shrink-0" style={{ backgroundColor: labels.find(l => l.value === currentState.label)?.color || "currentColor" }} />
                              <div className="px-3 flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">{currentState.label}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic bg-slate-50/80 p-2 rounded border border-dashed text-center">未选择标签</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500">当前状态</span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(currentState.status)}`} />
                            <span className="text-xs font-medium text-slate-700">{currentState.status}</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="border-t pt-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Metadata</p>
                      <div className="space-y-2">
                        {customMetadata[current.id] && Object.entries(customMetadata[current.id]).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 group">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-slate-400 truncate uppercase">{k}</span>
                              <span className="text-xs text-slate-700 font-medium truncate">{v}</span>
                            </div>
                            <button
                              onClick={() => removeMetadata(k)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-destructive transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-1.5 pt-1">
                          <div className="flex-1 flex flex-col gap-1">
                            <input
                              value={metadataKey}
                              onChange={e => setMetadataKey(e.target.value)}
                              placeholder="Key"
                              className="w-full px-2 py-1 text-[11px] border rounded focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                            />
                            <input
                              value={metadataValue}
                              onChange={e => setMetadataValue(e.target.value)}
                              placeholder="Value"
                              className="w-full px-2 py-1 text-[11px] border rounded focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                            />
                          </div>
                          <button
                            onClick={addMetadata}
                            disabled={!metadataKey.trim()}
                            className="px-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 self-stretch flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
                {rightUpperTab === "log" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Annotation Activity</p>
                    <div className="space-y-2 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      {logs.length > 0 ? (
                        logs.map((entry, i) => (
                          <div key={entry.id} className="relative pl-6 pb-4 last:pb-0">
                            <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-primary shadow-sm z-10" />
                            <div className="text-[11px] p-2.5 rounded-xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-sm transition-all group/log">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                    {entry.operator.charAt(entry.operator.length - 1)}
                                  </div>
                                  <span className="font-bold text-slate-700">{entry.operator}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">{entry.timestamp}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-lg border border-slate-50">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold text-[9px] whitespace-nowrap">{entry.action}</span>
                                <span className="text-slate-400 text-[10px]">针对</span>
                                <span className="font-mono font-bold text-slate-700 text-[10px] truncate">{entry.target}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="text-xs text-slate-400">暂无任何操作记录</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lower Tab Section */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex border-b bg-muted/5">
                {[
                  { key: "list", label: "标注列表", icon: List },
                  { key: "relation", label: "标签间关系", icon: Link2 },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setRightLowerTab(t.key as any)}
                    className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${rightLowerTab === t.key
                      ? "border-primary text-primary bg-primary/[0.02]"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {rightLowerTab === "list" && (
                  <div className="space-y-4">
                    {/* List Search */}
                    <div className="relative group/search">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within/search:text-primary transition-colors" />
                      <input
                        value={listSearch}
                        onChange={e => setListSearch(e.target.value)}
                        placeholder="搜索标注标签或内容..."
                        className="w-full pl-8 pr-3 py-1.5 text-[10px] border rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      {listSearch && (
                        <button onClick={() => setListSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Sort & Group controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <select
                          value={listGroupMode}
                          onChange={e => setListGroupMode(e.target.value as any)}
                          className="w-full text-[10px] border rounded-md pl-6 pr-1 py-1 bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <option value="none">不分组</option>
                          <option value="manual">手动分组</option>
                          <option value="tool">按工具分组</option>
                          <option value="label">按标签分组</option>
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <SortAsc className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <select
                          value={listSortMode}
                          onChange={e => setListSortMode(e.target.value as any)}
                          className="w-full text-[10px] border rounded-md pl-6 pr-1 py-1 bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <option value="time">按时间</option>
                          <option value="score">按分数</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(getGroupedAnnotations()).map(([group, anns]) => {
                        const isCollapsed = collapsedGroups.has(group);
                        return (
                          <div key={group} className="space-y-1.5">
                            {listGroupMode !== "none" && (
                              <div
                                onClick={() => {
                                  const next = new Set(collapsedGroups);
                                  if (next.has(group)) next.delete(group);
                                  else next.add(group);
                                  setCollapsedGroups(next);
                                }}
                                className="flex items-center gap-2 px-1 cursor-pointer group/header hover:opacity-80 transition-opacity"
                              >
                                <div className="h-px flex-1 bg-slate-100" />
                                <div className="flex items-center gap-1.5 bg-white px-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                                </div>
                                <div className="h-px flex-1 bg-slate-100" />
                              </div>
                            )}
                            {!isCollapsed && (
                              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {anns.slice(0, 30).map(ann => (
                                  <div
                                    key={ann.id}
                                    onClick={() => setCurrentIndex(ann.sampleId - 1)}
                                    className="group flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                  >
                                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-50 border-l border-b border-slate-100 rounded-bl-lg text-[9px] font-bold text-slate-400">
                                      {ann.id}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-tight"
                                        style={{
                                          color: labels.find(l => l.value === ann.label)?.color,
                                          backgroundColor: (labels.find(l => l.value === ann.label)?.color || "#666") + "10",
                                          borderLeft: `2px solid ${labels.find(l => l.value === ann.label)?.color || "#666"}`
                                        }}
                                      >
                                        {ann.label}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-medium">来自 {ann.tool}</span>
                                      <span className={`ml-auto text-[10px] font-bold ${ann.score >= 90 ? "text-emerald-500" : "text-amber-500"}`}>
                                        {ann.score}分
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                                      <span className="font-mono">SAMPLE #{ann.sampleId}</span>
                                      <span>{ann.createdAt}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {annotations.length === 0 && (
                        <div className="text-center py-10 opacity-40">
                          <List className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs text-slate-400">当前样本暂无标注</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {rightLowerTab === "relation" && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Relationship Graph</p>
                    <div className="space-y-2">
                      {relations.map(rel => (
                        <div key={rel.id} className="group relative flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center justify-between gap-2 overflow-hidden">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-slate-100 border border-slate-200 text-slate-600 truncate max-w-[80px]">{rel.from}</span>
                            <div className="flex-1 flex flex-col items-center gap-0.5 overflow-hidden">
                              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter truncate w-full text-center">{rel.relationType}</span>
                              <div className="w-full flex items-center gap-1">
                                <div className="h-[1px] flex-1 bg-primary/20" />
                                <div className="w-1.5 h-1.5 rounded-full border border-primary shrink-0 rotate-45 border-t-0 border-l-0" />
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-slate-100 border border-slate-200 text-slate-600 truncate max-w-[80px]">{rel.to}</span>
                          </div>
                          <button
                            onClick={() => setRelations(prev => prev.filter(r => r.id !== rel.id))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 hover:text-destructive hover:border-destructive/30 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {relations.length === 0 && (
                        <div className="text-center py-10 opacity-40">
                          <Link2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs text-slate-400">暂无关联关系配置</p>
                        </div>
                      )}
                    </div>
                    {!showAddRelation ? (
                      <button
                        onClick={() => setShowAddRelation(true)}
                        className="w-full h-9 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/[0.02] flex items-center justify-center gap-2 transition-all mt-4"
                      >
                        <Plus className="w-3.5 h-3.5" /> 建立新关系
                      </button>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/[0.02] mt-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-primary/60 uppercase">Source Label</label>
                            <select value={newRelFrom} onChange={e => setNewRelFrom(e.target.value)} className="w-full text-xs border rounded-md px-3 py-1.5 bg-background shadow-inner outline-none focus:ring-1 focus:ring-primary/30">
                              <option value="">选择起始标签</option>
                              {labels.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center justify-center py-1">
                            <div className="h-px flex-1 bg-primary/20" />
                            <span className="px-2 text-[10px] text-primary/40">TO</span>
                            <div className="h-px flex-1 bg-primary/20" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-primary/60 uppercase">Target Label</label>
                            <select value={newRelTo} onChange={e => setNewRelTo(e.target.value)} className="w-full text-xs border rounded-md px-3 py-1.5 bg-background shadow-inner outline-none focus:ring-1 focus:ring-primary/30">
                              <option value="">选择目标标签</option>
                              {labels.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-primary/60 uppercase">Relationship Type</label>
                          <input value={newRelType} onChange={e => setNewRelType(e.target.value)} placeholder="关系类型 (如: 属于)" className="w-full text-xs border rounded-md px-3 py-1.5 bg-background shadow-inner outline-none focus:ring-1 focus:ring-primary/30" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setShowAddRelation(false)} className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">取消</button>
                          <button
                            onClick={() => {
                              if (newRelFrom && newRelTo) {
                                const newRel = {
                                  id: `rel-${Date.now()}`,
                                  from: newRelFrom,
                                  to: newRelTo,
                                  relationType: newRelType
                                };
                                setRelations([...relations, newRel]);
                                setLogs(l => [{
                                  id: `log-${Date.now()}`,
                                  timestamp: new Date().toLocaleTimeString(),
                                  operator: "标注员A",
                                  action: `新增关系:${newRelType}`,
                                  target: `标签 ${newRelFrom} → ${newRelTo}`
                                }, ...l]);
                                setShowAddRelation(false);
                              }
                            }}
                            disabled={!newRelFrom || !newRelTo}
                            className="flex-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-shadow shadow-sm font-bold"
                          >
                            确认添加
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Sample navigation */}
      <div className="h-12 border-t bg-card flex items-center px-4 gap-4 shrink-0 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
          {samples.map((s, i) => {
            const state = sampleStates.get(s.id);
            const isActive = i === currentIndex;
            return (
              <button
                key={s.id}
                data-sample-index={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md" : "hover:scale-105 opacity-80 hover:opacity-100"
                  } ${getStatusColor(state?.status || "未标注")} text-white`}
              >
                {s.id}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex(i => Math.min(samples.length - 1, i + 1))}
              disabled={currentIndex === samples.length - 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-2" />

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground whitespace-nowrap">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 已标注 <span className="font-bold text-foreground">{annotatedCount}</span></span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-destructive" /> 无效 <span className="font-bold text-foreground">{invalidCount}</span></span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> 未标注 <span className="font-bold text-foreground">{unannotatedCount}</span></span>
            <span className="ml-2 font-mono text-[11px] bg-muted px-2 py-0.5 rounded">共 {samples.length}</span>
          </div>
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
                <li><strong>正面</strong>：文本表达积极、乐观的情感</li>
                <li><strong>负面</strong>：文本表达消极、悲观的情感</li>
                <li><strong>中性</strong>：文本无明显情感倾向</li>
              </ul>
              <p><strong>注意：</strong>以文本整体情感为准，模糊情况优先标注中性。</p>
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
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              {unannotatedCount > 0 && <AlertTriangle className="w-6 h-6 text-amber-500" />}
              <h3 className="text-lg font-semibold">确认提交</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">已标注</span>
                <span className="font-medium text-emerald-600">{annotatedCount} / {samples.length}</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex justify-between text-sm p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">无效跳过</span>
                  <span className="font-medium text-destructive">{invalidCount}</span>
                </div>
              )}
              {unannotatedCount > 0 && (
                <div className="flex justify-between text-sm p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-700 dark:text-amber-400">未标注</span>
                  <span className="font-medium text-amber-700 dark:text-amber-400">{unannotatedCount} 条</span>
                </div>
              )}
            </div>
            {unannotatedCount > 0 && (
              <p className="text-sm text-amber-600 mb-4">⚠ 当前有 {unannotatedCount} 条未标注数据，是否确认提交？</p>
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

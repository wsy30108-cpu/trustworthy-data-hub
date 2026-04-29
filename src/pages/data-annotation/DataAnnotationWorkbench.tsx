import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft, Undo2, Redo2, BookOpen, Keyboard, Ban, Send,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Tag, Clock, List, Link2,
  X, AlertTriangle, Plus, Filter, SortAsc, Search, PanelRightClose, PanelRightOpen,
  Play, Pause, RotateCcw, Maximize, Type, Image as ImageIcon, Video,
  Brain, Check
} from "lucide-react";
import { toast } from "sonner";
import { useTaskPreannotationStore } from "@/stores/useTaskPreannotationStore";
import { usePreannotationProgress } from "@/hooks/usePreannotationProgress";

interface Props {
  task: {
    id: string;
    taskName: string;
    total: number;
    done: number;
    projectType: string;
    annotationMode?: "classification" | "ner";
  };
  onBack: () => void;
  initialResourceId?: number;
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

const classificationLabels = [
  { value: "正面", color: "#22c55e", shortcut: "1" },
  { value: "负面", color: "#ef4444", shortcut: "2" },
  { value: "中性", color: "#6b7280", shortcut: "3" },
];

const nerEntityLabels = [
  { value: "人名", color: "#3b82f6", shortcut: "1" },
  { value: "地名", color: "#a855f7", shortcut: "2" },
  { value: "动物", color: "#f97316", shortcut: "3" },
];

const relationTypes = ["属于", "等同", "并列", "由于", "涉及", "冲突"];

type PreannotationReviewStatus = "pending" | "accepted" | "rejected";

interface PreannotationAlternative {
  id: string;
  label: string;
  confidence: number;
  reviewStatus: PreannotationReviewStatus;
}

interface PreannotationSuggestion {
  sampleId: number;
  label: string;
  confidence: number;
  reviewStatus: PreannotationReviewStatus;
  nerEntities?: Array<{ entityType: string; mention: string; confidence: number }>;
  alternatives?: PreannotationAlternative[];
}

function buildClassificationAlternatives(sampleId: number, primaryLabel: string, primaryConf: number): PreannotationAlternative[] {
  const pool = classificationLabels.map((l) => l.value).filter((v) => v !== primaryLabel);
  if (pool.length < 2) return [];
  const c1 = pool[sampleId % pool.length];
  const c2 = pool[(sampleId + 1) % pool.length];
  const raw1 = primaryConf - 0.08 - ((sampleId * 17) % 10) / 100;
  const raw2 = Math.max(0.05, Math.min(0.42, 1 - primaryConf - 0.1));
  return [
    { id: `${sampleId}-alt-1`, label: c1, confidence: Math.round(Math.max(0.05, Math.min(0.9, raw1)) * 100) / 100, reviewStatus: "pending" },
    { id: `${sampleId}-alt-2`, label: c2, confidence: Math.round(Math.max(0.05, Math.min(0.88, raw2)) * 100) / 100, reviewStatus: "pending" },
  ];
}

const DataAnnotationWorkbench = ({ task, onBack, initialResourceId }: Props) => {
  usePreannotationProgress();
  const preannotationConfig = useTaskPreannotationStore((s) => s.configs[task.id]);
  const labels = task.annotationMode === "ner" ? nerEntityLabels : classificationLabels;

  const [samples] = useState<Sample[]>(() => {
    const ner = task.annotationMode === "ner";
    const labList = ner ? nerEntityLabels : classificationLabels;
    return Array.from({ length: task.total }, (_, i) => {
      let content = "";
      if (task.projectType === "音频类") {
        content = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      } else if (task.projectType === "图像类") {
        content = `https://picsum.photos/seed/${i + 1}/800/600`;
      } else if (task.projectType === "视频类") {
        content = "https://www.w3schools.com/html/mov_bbb.mp4";
      } else if (ner) {
        const corpus = [
          "国务院总理李克强在北京大熊猫基地会见德国嘉宾，双方就滇金丝猴与藏羚羊保护交换意见。",
          "记者王芳在深圳湾记录到金丝猴与白鹭同框，生态学家张明称这一现象极为罕见。",
          "成都在建湿地公园引进一批大熊猫与梅花鹿混养实验，动物学家质疑其长期可行性。",
        ];
        content = corpus[i % corpus.length];
      } else {
        content = i % 3 === 0
          ? "央行今日公布最新货币政策，维持基准利率不变。市场分析人士认为，这一决定符合预期，有助于稳定当前经济形势。"
          : i % 3 === 1
            ? "某科技公司股价暴跌20%，投资者恐慌性抛售。公司回应称正在积极调整战略，但市场信心仍然不足。"
            : "A股今日窄幅震荡，成交量持续萎缩。多空双方力量均衡，市场等待进一步政策指引。";
      }
      return {
        id: i + 1,
        content,
        status: i < task.done ? "已标注" : "未标注",
        label: i < task.done ? labList[i % labList.length].value : null,
        metadata: {},
      };
    });
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialResourceId !== undefined) {
      const idx = initialResourceId - 1;
      if (idx >= 0 && idx < task.total) return idx;
    }
    return task.done < task.total ? task.done : 0;
  });
  const [sampleStates, setSampleStates] = useState<Map<number, { status: SampleStatus; label: string | null }>>(
    () => new Map(samples.map(s => [s.id, { status: s.status, label: s.label }]))
  );

  const current = samples[currentIndex];
  const currentState = sampleStates.get(current.id) || { status: "未标注", label: null };
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

  // Multi-modal states
  const [transcription, setTranscription] = useState<Record<number, string>>({});
  const [shapes, setShapes] = useState<Record<number, any[]>>({});
  const [videoTime, setVideoTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);

  // Label relations
  const [relations, setRelations] = useState<LabelRelation[]>([]);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRelFrom, setNewRelFrom] = useState("");
  const [newRelTo, setNewRelTo] = useState("");
  const [newRelType, setNewRelType] = useState(relationTypes[0]);
  const [labelSearch, setLabelSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const renderTextContent = () => {
    return (
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-2">请阅读标注内容</h2>
        <div className="text-sm text-slate-500 mb-4">Sample: #{current.id} · {currentState.status}</div>
        <div className="rounded-xl border border-slate-200 bg-card overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex divide-x divide-slate-100">
            <div className="bg-slate-50/50 py-6 px-4 flex flex-col items-end select-none text-slate-300 font-mono text-xs gap-[1.4em]">
              {current.content.split("\n").map((_, i) => (
                <span key={i}>{i + 1} |</span>
              ))}
            </div>
            <div className="flex-1 p-6 md:p-8 text-[17px] leading-[1.6] text-slate-700 select-text cursor-text whitespace-pre-wrap font-medium">
              {current.content.split("\n").map((line, i) => (
                <div key={i} className="min-h-[1.5em]">
                  {line || " "}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderAudioContent = () => (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2">请听取音频并核对转写</h2>
      <div className="text-sm text-slate-500 mb-4">Sample: #{current.id} · {currentState.status}</div>
      <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-8">
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMediaPlaying(!isMediaPlaying)}
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              {isMediaPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <div className="flex-1 space-y-2">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 w-1/3 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>00:12</span>
                <span>00:45</span>
              </div>
            </div>
            <select
              value={playbackRate}
              onChange={e => setPlaybackRate(Number(e.target.value))}
              className="text-xs bg-white border rounded px-2 py-1 outline-none"
            >
              {[0.5, 0.8, 1.0, 1.2, 1.5, 2.0].map(r => (
                <option key={r} value={r}>{r}x</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> 音频转写文字
            </label>
            <span className="text-[10px] text-slate-400">已保存</span>
          </div>
          <textarea
            value={transcription[current.id] || "这里是模拟的音频转译文字内容，请根据听到的音频进行校对和修改..."}
            onChange={e => setTranscription(prev => ({ ...prev, [current.id]: e.target.value }))}
            className="w-full h-32 p-4 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
            placeholder="请输入音频转写内容..."
          />
        </div>
      </div>
    </section>
  );

  const renderImageContent = () => (
    <section className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 font-heading">请在图像中绘制标注框</h2>
          <div className="text-sm text-slate-500">Sample: #{current.id} · {currentState.status}</div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-600 shadow-sm" title="适应屏幕"><Maximize className="w-4 h-4" /></button>
          <button className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-600 shadow-sm" title="重置"><RotateCcw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-2xl group cursor-crosshair">
        <img
          src={current.content}
          alt="Annotation"
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-[20%] left-[30%] w-[15%] h-[20%] border-2 border-primary bg-primary/10 rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.5)]">
          <span className="absolute -top-6 left-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-t-sm font-bold shadow-sm">车辆</span>
        </div>
        <div className="absolute top-[45%] left-[55%] w-[10%] h-[15%] border-2 border-emerald-500 bg-emerald-500/10 rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.5)]">
          <span className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-t-sm font-bold shadow-sm">行人</span>
        </div>

        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white flex items-center gap-3 border border-white/10 uppercase tracking-widest font-mono">
          <span>X: 1024</span>
          <span>Y: 768</span>
          <span>Zoom: 100%</span>
        </div>
      </div>
    </section>
  );

  const renderVideoContent = () => (
    <section className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 font-heading">请针对视频画面进行动态标注</h2>
          <div className="text-sm text-slate-500">Sample: #{current.id} · {currentState.status}</div>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl border border-slate-200 bg-black overflow-hidden shadow-2xl flex flex-col">
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
          <video
            src={current.content}
            className="max-h-full max-w-full"
            onTimeUpdate={e => setVideoTime(e.currentTarget.currentTime)}
          />
          <div className="absolute top-[30%] left-[40%] w-[100px] h-[100px] border-2 border-amber-500 bg-amber-500/20" />
        </div>

        <div className="bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMediaPlaying(!isMediaPlaying)}
              className="text-white hover:text-primary transition-colors"
            >
              {isMediaPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full relative cursor-pointer">
              <div className="h-full bg-primary rounded-full" style={{ width: '45%' }} />
              <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
              <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
              <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-2.5 h-2.5 bg-primary border-2 border-white rounded-full shadow-lg" />
            </div>
            <span className="text-[10px] font-mono text-white/60">00:15 / 00:34</span>
          </div>

          <div className="flex items-center gap-4 border-t border-white/5 pt-4">
            <div className="flex gap-2">
              {['0.5x', '1.0x', '1.5x', '2.0x'].map(v => (
                <button key={v} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/50 hover:bg-white/10 hover:text-white transition-all uppercase tracking-tighter">{v}</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="text-white/40 hover:text-white transition-colors"><RotateCcw className="w-4 h-4" /></button>
              <button className="text-white/40 hover:text-white transition-colors"><Maximize className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderContent = () => {
    switch (task.projectType) {
      case "音频类": return renderAudioContent();
      case "图像类": return renderImageContent();
      case "视频类": return renderVideoContent();
      default: return renderTextContent();
    }
  };

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

  const annotatedLabelsInCurrentSample = Array.from(
    new Set(annotations.filter(a => a.sampleId === current.id).map(a => a.label))
  );

  const [preAnnotations, setPreAnnotations] = useState<Map<number, PreannotationSuggestion>>(() => {
    const m = new Map<number, PreannotationSuggestion>();
    if (!preannotationConfig?.batchEnabled) return m;
    const covered = Math.min(preannotationConfig.preannotated, task.total);
    const labList = task.annotationMode === "ner" ? nerEntityLabels : classificationLabels;
    const ner = task.annotationMode === "ner";
    const names = ["李克强", "张明", "王芳", "刘洋"];
    const places = ["北京", "深圳", "成都", "上海"];
    const animals = ["大熊猫", "金丝猴", "白鹭", "藏羚羊"];
    for (let i = 0; i < covered; i++) {
      const sampleId = i + 1;
      if (ner) {
        const nerEntities = [
          { entityType: "人名", mention: names[i % names.length], confidence: 0.91 },
          { entityType: "地名", mention: places[(i + 1) % places.length], confidence: 0.86 },
          { entityType: "动物", mention: animals[(i + 2) % animals.length], confidence: 0.79 },
        ];
        const avgConf = Math.round(((nerEntities.reduce((s, x) => s + x.confidence, 0) / nerEntities.length) * 100)) / 100;
        m.set(sampleId, {
          sampleId,
          label: nerEntities.map((e) => `${e.entityType}:${e.mention}`).join(" · "),
          confidence: avgConf,
          reviewStatus: "pending",
          nerEntities,
        });
      } else {
        const labelIdx = (sampleId * 7) % labList.length;
        const baseConf = 0.55 + ((sampleId * 13) % 45) / 100;
        const primaryConf = Math.round(baseConf * 100) / 100;
        const primaryLab = labList[labelIdx].value;
        m.set(sampleId, {
          sampleId,
          label: primaryLab,
          confidence: primaryConf,
          reviewStatus: "pending",
          alternatives: buildClassificationAlternatives(sampleId, primaryLab, primaryConf),
        });
      }
    }
    return m;
  });

  useEffect(() => {
    if (!preannotationConfig?.batchEnabled) return;
    setPreAnnotations((prev) => {
      const covered = Math.min(preannotationConfig.preannotated, task.total);
      if (prev.size >= covered) return prev;
      const next = new Map(prev);
      const labList = task.annotationMode === "ner" ? nerEntityLabels : classificationLabels;
      const ner = task.annotationMode === "ner";
      const names = ["李克强", "张明", "王芳", "刘洋"];
      const places = ["北京", "深圳", "成都", "上海"];
      const animals = ["大熊猫", "金丝猴", "白鹭", "藏羚羊"];
      for (let i = prev.size; i < covered; i++) {
        const sampleId = i + 1;
        if (next.has(sampleId)) continue;
        if (ner) {
          const nerEntities = [
            { entityType: "人名", mention: names[i % names.length], confidence: 0.91 },
            { entityType: "地名", mention: places[(i + 1) % places.length], confidence: 0.86 },
            { entityType: "动物", mention: animals[(i + 2) % animals.length], confidence: 0.79 },
          ];
          const avgConf = Math.round(((nerEntities.reduce((s, x) => s + x.confidence, 0) / nerEntities.length) * 100)) / 100;
          next.set(sampleId, {
            sampleId,
            label: nerEntities.map((e) => `${e.entityType}:${e.mention}`).join(" · "),
            confidence: avgConf,
            reviewStatus: "pending",
            nerEntities,
          });
        } else {
          const labelIdx = (sampleId * 7) % labList.length;
          const baseConf = 0.55 + ((sampleId * 13) % 45) / 100;
          const primaryConf = Math.round(baseConf * 100) / 100;
          const primaryLab = labList[labelIdx].value;
          next.set(sampleId, {
            sampleId,
            label: primaryLab,
            confidence: primaryConf,
            reviewStatus: "pending",
            alternatives: buildClassificationAlternatives(sampleId, primaryLab, primaryConf),
          });
        }
      }
      return next;
    });
  }, [preannotationConfig?.preannotated, preannotationConfig?.batchEnabled, task.total, task.annotationMode]);

  const preAnnotationStats = useMemo(() => {
    const suggestions = Array.from(preAnnotations.values());
    const pending = suggestions.filter((p) => p.reviewStatus === "pending").length;
    const accepted = suggestions.filter((p) => p.reviewStatus === "accepted").length;
    const rejected = suggestions.filter((p) => p.reviewStatus === "rejected").length;
    const threshold = preannotationConfig?.confidenceThreshold || 0.6;
    const highConfidencePending = suggestions.filter(
      (p) => p.reviewStatus === "pending" && p.confidence >= threshold
    ).length;
    return { total: suggestions.length, pending, accepted, rejected, highConfidencePending };
  }, [preAnnotations, preannotationConfig?.confidenceThreshold]);

  const currentPreAnnotation = preAnnotations.get(current.id);

  const labelPreConfidence = useMemo(() => {
    const m = new Map<string, number>();
    if (currentState.status !== "未标注") return m;
    const pre = preAnnotations.get(current.id);
    if (!pre || pre.reviewStatus !== "pending") return m;
    const mode = task.annotationMode ?? "classification";
    if (mode === "ner") {
      pre.nerEntities?.forEach((e) => {
        m.set(e.entityType, e.confidence);
      });
      return m;
    }
    m.set(pre.label, pre.confidence);
    pre.alternatives?.forEach((a) => {
      m.set(a.label, a.confidence);
    });
    return m;
  }, [current.id, currentState.status, preAnnotations, task.annotationMode]);

  type AnnotationTableRow =
    | { kind: "ann"; key: string; ann: Annotation }
    | {
        kind: "pre-primary";
        key: string;
        sampleId: number;
        label: string;
        confidence: number;
      }
    | {
        kind: "pre-alt";
        key: string;
        sampleId: number;
        altId: string;
        label: string;
        confidence: number;
      }
    | {
        kind: "pre-ner";
        key: string;
        sampleId: number;
        label: string;
        content: string;
        confidence: number;
        showActions: boolean;
      };

  const annotationTableRows = useMemo((): AnnotationTableRow[] => {
    const anns = annotations
      .filter((a) => a.sampleId === current.id)
      .filter((a) => listSearch === "" || a.label.includes(listSearch) || a.content.includes(listSearch));
    const pre = preAnnotations.get(current.id);
    const rows: AnnotationTableRow[] = [];

    if (pre && pre.reviewStatus === "pending") {
      if (task.annotationMode === "ner") {
        const ents = pre.nerEntities ?? [];
        if (ents.length > 0) {
          ents.forEach((e, ei) => {
            rows.push({
              kind: "pre-ner",
              key: `pre-ner-${current.id}-${ei}`,
              sampleId: current.id,
              label: e.entityType,
              content: `「${e.mention}」`,
              confidence: e.confidence,
              showActions: ei === 0,
            });
          });
        } else {
          rows.push({
            kind: "pre-ner",
            key: `pre-ner-${current.id}`,
            sampleId: current.id,
            label: "—",
            content: pre.label,
            confidence: pre.confidence,
            showActions: true,
          });
        }
      } else {
        rows.push({
          kind: "pre-primary",
          key: `pre-p-${current.id}`,
          sampleId: current.id,
          label: pre.label,
          confidence: pre.confidence,
        });
        (pre.alternatives || []).forEach((a) =>
          rows.push({
            kind: "pre-alt",
            key: a.id,
            sampleId: current.id,
            altId: a.id,
            label: a.label,
            confidence: a.confidence,
          })
        );
      }
    }

    anns.forEach((ann) => rows.push({ kind: "ann", key: ann.id, ann }));
    return rows;
  }, [annotations, current.id, listSearch, preAnnotations, task.annotationMode]);

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

  const acceptPreAnnotation = useCallback(
    (sampleId: number, chosenLabel?: string, chosenConfidence?: number) => {
      const pre = preAnnotations.get(sampleId);
      if (!pre) return;
      const applyLabel = chosenLabel ?? pre.label;
      const applyConf = chosenConfidence ?? pre.confidence;
      const state = sampleStates.get(sampleId);
      setUndoStack((s) => [...s, { id: sampleId, prev: { ...(state || { status: "未标注", label: null }) } }]);
      setRedoStack([]);
      setSampleStates((prev) => {
        const next = new Map(prev);
        next.set(sampleId, { status: "已标注", label: applyLabel });
        return next;
      });
      setPreAnnotations((prev) => {
        const next = new Map(prev);
        next.delete(sampleId);
        return next;
      });
      setAnnotations((prev) => {
        const existing = prev.findIndex((a) => a.sampleId === sampleId);
        const sample = samples.find((s) => s.id === sampleId);
        const payload: Annotation = {
          id: `ann-${sampleId}`,
          sampleId,
          label: applyLabel,
          content: (sample?.content || "").slice(0, 30) + "...",
          group: "AI 预标注",
          tool:
            task.annotationMode === "ner"
              ? `NER · ${preannotationConfig?.modelName || "预标注"}`
              : `模型 · ${preannotationConfig?.modelName || "预标注"}`,
          createdAt: new Date().toLocaleString(),
          score: Math.round(applyConf * 100),
        };
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = payload;
          return updated;
        }
        return [...prev, payload];
      });
      setLogs((l) => [
        {
          id: `log-accept-${sampleId}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          operator: "标注员A",
          action: `接受预标注:${applyLabel} (${Math.round(applyConf * 100)}%)`,
          target: `SAMPLE #${sampleId}`,
        },
        ...l,
      ]);
    },
    [preAnnotations, sampleStates, samples, preannotationConfig, task.annotationMode]
  );

  const rejectPreAnnotation = useCallback((sampleId: number) => {
    const pre = preAnnotations.get(sampleId);
    setPreAnnotations((prev) => {
      const next = new Map(prev);
      next.delete(sampleId);
      return next;
    });
    setAnnotations((prev) =>
      prev.filter(
        (a) =>
          a.sampleId !== sampleId ||
          (!a.tool.includes("模型 ·") && !a.tool.includes("NER ·"))
      )
    );
    setSampleStates((prev) => {
      const currentState = prev.get(sampleId);
      if (!currentState || currentState.status !== "已标注") return prev;
      if (pre && (currentState.label === pre.label || (pre.alternatives || []).some((a) => a.label === currentState.label))) {
        const next = new Map(prev);
        next.set(sampleId, { status: "未标注", label: null });
        return next;
      }
      return prev;
    });
    setLogs((l) => [
      {
        id: `log-reject-${sampleId}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        operator: "标注员A",
        action: `拒绝预标注`,
        target: `SAMPLE #${sampleId}`,
      },
      ...l,
    ]);
    toast.info(`已拒绝并删除样本 #${sampleId} 的预标注`, { duration: 1200 });
  }, [preAnnotations]);

  const rejectPreAnnotationAlternative = useCallback(
    (sampleId: number, altId: string) => {
      setPreAnnotations((prev) => {
        const pre = prev.get(sampleId);
        if (!pre?.alternatives?.length) return prev;
        const filtered = pre.alternatives.filter((a) => a.id !== altId);
        const next = new Map(prev);
        next.set(sampleId, { ...pre, alternatives: filtered });
        return next;
      });
    },
    []
  );

  const deletePreAnnotation = useCallback((sampleId: number) => {
    setPreAnnotations((prev) => {
      const next = new Map(prev);
      next.delete(sampleId);
      return next;
    });
    toast.info(`已删除样本 #${sampleId} 的预标注结果`);
  }, []);

  const acceptAllPreAnnotationsInCurrentSample = useCallback(() => {
    const pre = preAnnotations.get(current.id);
    if (!pre) return toast.info("当前样本无预标注数据");
    acceptPreAnnotation(current.id);
  }, [preAnnotations, current.id, acceptPreAnnotation]);

  const rejectAllPreAnnotationsInCurrentSample = useCallback(() => {
    const pre = preAnnotations.get(current.id);
    if (!pre) return toast.info("当前样本无预标注数据");
    rejectPreAnnotation(current.id);
  }, [preAnnotations, current.id, rejectPreAnnotation]);

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
      if (a.sampleId !== current.id) return false;
      const matchesSearch = listSearch === "" ||
        a.label.includes(listSearch) ||
        a.content.includes(listSearch) ||
        a.id.includes(listSearch);
      return matchesSearch;
    });

    const pre = preAnnotations.get(current.id);
    if (pre && pre.reviewStatus === "pending" && !filteredAnnotations.some((x) => x.id === `pre-${current.id}`)) {
      const nerContent =
        task.annotationMode === "ner" && pre.nerEntities?.length
          ? pre.nerEntities.map((e) => `${e.entityType}: ${e.mention}`).join("；")
          : "来自预标注结果";
      filteredAnnotations.push({
        id: `pre-${current.id}`,
        sampleId: current.id,
        label: pre.label,
        content: nerContent,
        group: "AI 预标注",
        tool:
          task.annotationMode === "ner"
            ? `NER · ${preannotationConfig?.modelName || "预标注"}`
            : `模型 · ${preannotationConfig?.modelName || "预标注"}`,
        createdAt: new Date().toLocaleString(),
        score: Math.round(pre.confidence * 100),
      });
    }

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
      if ((e.key === "y" || e.key === "Y") && currentPreAnnotation && currentPreAnnotation.reviewStatus === "pending") {
        e.preventDefault();
        acceptPreAnnotation(current.id);
        return;
      }
      if ((e.key === "n" || e.key === "N") && currentPreAnnotation && currentPreAnnotation.reviewStatus === "pending") {
        e.preventDefault();
        rejectPreAnnotation(current.id);
        return;
      }
      labels.forEach(l => { if (e.key === l.shortcut) setLabel(l.value); });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, setLabel, samples.length, currentPreAnnotation, current.id, acceptPreAnnotation, rejectPreAnnotation]);

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
                const pconf = labelPreConfidence.get(l.value);
                return (
                  <button
                    key={l.value}
                    onClick={() => setLabel(l.value)}
                    className={`flex items-center rounded-sm overflow-hidden border transition-all hover:shadow-sm min-h-8 max-w-full ${isSelected ? "ring-1 ring-primary ring-offset-0 border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30 bg-card"}`}
                  >
                    <div className="w-1 h-full shrink-0 self-stretch min-h-[32px]" style={{ backgroundColor: l.color }} />
                    <div className="px-2.5 py-1 flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-xs font-semibold truncate" style={{ color: isSelected ? "inherit" : "#374151" }}>{l.value}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono bg-muted/30 px-1 rounded shrink-0">{l.shortcut}</span>
                      {count > 0 && <span className="text-[10px] text-muted-foreground shrink-0">({count})</span>}
                      {pconf !== undefined && (
                        <span className="text-[10px] font-mono font-semibold text-primary shrink-0 tabular-nums">
                          {(pconf * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content area - annotation canvas */}
          <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center bg-[#f8fafc] dark:bg-slate-900/10">
            <div className="max-w-4xl w-full space-y-6">
              {renderContent()}

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
                    <div className="relative group/search">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within/search:text-primary transition-colors" />
                      <input
                        value={listSearch}
                        onChange={e => setListSearch(e.target.value)}
                        placeholder="搜索标签或内容..."
                        className="w-full pl-8 pr-3 py-1.5 text-[10px] border rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      {listSearch && (
                        <button onClick={() => setListSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={acceptAllPreAnnotationsInCurrentSample}
                        className="px-2 py-1 text-[10px] rounded bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary/90"
                      >
                        一键接受
                      </button>
                      <button
                        onClick={rejectAllPreAnnotationsInCurrentSample}
                        className="px-2 py-1 text-[10px] rounded border border-slate-200 font-bold hover:bg-muted/50"
                      >
                        一键拒绝
                      </button>
                    </div>

                    <div className="overflow-hidden border rounded-lg">
                      <table className="table-fixed w-full text-[11px] leading-tight">
                        <colgroup>
                          <col className="w-8" />
                          <col className="w-[92px]" />
                          <col />
                          <col className="w-[68px]" />
                        </colgroup>
                        <thead className="bg-muted/20 border-b">
                          <tr>
                            <th className="text-left px-1.5 py-1.5">序号</th>
                            <th className="text-left px-1.5 py-1.5">标签</th>
                            <th className="text-left px-1.5 py-1.5">内容</th>
                            <th className="text-right px-1.5 py-1.5">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annotationTableRows.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400">当前样本暂无标注</td>
                            </tr>
                          ) : (
                            annotationTableRows.map((row, index) => {
                              if (row.kind === "ann") {
                                const ann = row.ann;
                                return (
                                  <tr key={row.key} onClick={() => setCurrentIndex(ann.sampleId - 1)} className="border-b last:border-b-0 cursor-pointer hover:bg-muted/30">
                                    <td className="px-1.5 py-1 text-slate-500 align-middle">{index + 1}</td>
                                    <td className="px-1.5 py-1 align-middle min-w-0">
                                      <span className="font-semibold text-slate-800 block truncate">{ann.label}</span>
                                    </td>
                                    <td className="px-1.5 py-1 align-middle max-w-0 min-w-0">
                                      <span className="block truncate text-slate-700" title={ann.content}>{ann.content}</span>
                                    </td>
                                    <td className="px-1.5 py-1 text-right align-middle text-[10px] text-muted-foreground">—</td>
                                  </tr>
                                );
                              }

                              const isPreAlt = row.kind === "pre-alt";
                              const isPrePrimary = row.kind === "pre-primary";
                              const isPreNer = row.kind === "pre-ner";
                              const sd = row.sampleId;
                              const preNerShowActions = !isPreNer || row.showActions;

                              let contentHint = "";
                              if (isPrePrimary) contentHint = "主候选标注";
                              else if (isPreAlt) contentHint = "备选标注候选";
                              else if (isPreNer) contentHint = row.content;

                              const metaConf = row.confidence;

                              return (
                                <tr
                                  key={row.key}
                                  onClick={() => setCurrentIndex(sd - 1)}
                                  className="border-b last:border-b-0 cursor-pointer bg-red-50/90 dark:bg-red-950/15 hover:bg-red-50 dark:hover:bg-red-950/25"
                                >
                                  <td className="px-1.5 py-1 text-slate-500 align-middle">{index + 1}</td>
                                  <td className="px-1.5 py-1 align-middle min-w-0">
                                    <div className="flex items-center gap-1 min-w-0" title={`${row.label} ${(metaConf * 100).toFixed(1)}%`}>
                                      <span className="font-semibold text-slate-800 truncate flex-1 min-w-0">{row.label}</span>
                                      <span className="text-[9px] font-mono tabular-nums text-primary shrink-0">{(metaConf * 100).toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-1.5 py-1 align-middle max-w-0 min-w-0">
                                    <span className="block truncate text-slate-700" title={contentHint}>{contentHint}</span>
                                  </td>
                                  <td className="px-1.5 py-1 text-right align-middle whitespace-nowrap">
                                    {preNerShowActions ? (
                                      <div className="inline-flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          title={isPreAlt ? `接受备选：${row.label}` : "接受预标注"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPreAlt) {
                                              acceptPreAnnotation(sd, row.label, row.confidence);
                                            } else {
                                              acceptPreAnnotation(sd);
                                            }
                                          }}
                                          className="h-6 w-6 inline-flex items-center justify-center rounded border border-primary/40 bg-white text-primary hover:bg-primary/10"
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          title={isPreAlt ? "移除此备选" : "拒绝预标注"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPreAlt) {
                                              rejectPreAnnotationAlternative(sd, row.altId);
                                            } else {
                                              rejectPreAnnotation(sd);
                                            }
                                          }}
                                          className="h-6 w-6 inline-flex items-center justify-center rounded border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                                        >
                                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground"> </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
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
                              {annotatedLabelsInCurrentSample.map(l => <option key={l} value={l}>{l}</option>)}
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
                              {annotatedLabelsInCurrentSample.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-primary/60 uppercase">Relationship Type</label>
                          <select value={newRelType} onChange={e => setNewRelType(e.target.value)} className="w-full text-xs border rounded-md px-3 py-1.5 bg-background shadow-inner outline-none focus:ring-1 focus:ring-primary/30">
                            {relationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
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
            const pre = preAnnotations.get(s.id);
            return (
              <button
                key={s.id}
                data-sample-index={i}
                onClick={() => setCurrentIndex(i)}
                className={`relative w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md" : "hover:scale-105 opacity-80 hover:opacity-100"
                  } ${getStatusColor(state?.status || "未标注")} text-white`}
                title={pre ? `预标注: ${pre.label} (${(pre.confidence * 100).toFixed(0)}%) ${pre.reviewStatus === "pending" ? "待审" : pre.reviewStatus === "accepted" ? "已接受" : "已拒绝"}` : `样本 #${s.id}`}
              >
                {s.id}
                {pre && pre.reviewStatus === "pending" && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm"
                    aria-label="待审预标注"
                  />
                )}
                {pre && pre.reviewStatus === "accepted" && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm flex items-center justify-center"
                  >
                    <Check className="w-1.5 h-1.5 text-white" strokeWidth={4} />
                  </span>
                )}
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
            {preannotationConfig?.batchEnabled && (
              <span className="flex items-center gap-1.5"><Brain className="w-2.5 h-2.5 text-primary" /> 预标注 <span className="font-bold text-foreground">{preAnnotationStats.total}</span></span>
            )}
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
              <div className="border-t pt-2 mt-2 space-y-2">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">智能预标注</p>
                <div className="flex justify-between"><span>接受预标注</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">Y</kbd></div>
                <div className="flex justify-between"><span>拒绝预标注</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">N</kbd></div>
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

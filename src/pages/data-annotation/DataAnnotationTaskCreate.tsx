import { useState, useCallback } from "react";
import {
  ArrowLeft, Check, ChevronRight, Plus, X, Trash2, Upload, Eye, Info,
  AlertTriangle, FileText, Settings, Users, Shield, BookOpen, Zap, ChevronDown,
  Database, Type, Image, Mic, Video, Table2, Layers
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

/* ─── Project types ─── */
const projectTypes = [
  { category: "文本类", icon: Type, color: "bg-blue-100 text-blue-700", sub: ["基础序列","实体与关系","内容分类与审核","情感与倾向","生成式与对话标注"] },
  { category: "图像类", icon: Image, color: "bg-green-100 text-green-700", sub: ["图像分类","对象检测","像素级标注","语义分割","OCR标注"] },
  { category: "音频类", icon: Mic, color: "bg-amber-100 text-amber-700", sub: ["音频转写","音频分段","说话人与声学标注","内容与事件标注"] },
  { category: "视频类", icon: Video, color: "bg-purple-100 text-purple-700", sub: ["视频对象检测","视频分类","时序跟踪","内容理解"] },
  { category: "表格类", icon: Table2, color: "bg-cyan-100 text-cyan-700", sub: ["时间序列标注"] },
  { category: "跨模态类", icon: Layers, color: "bg-rose-100 text-rose-700", sub: ["跨模态对齐","跨模态匹配与关联","多模态内容理解与生成标注"] },
];

const mockDatasets = [
  { id: "DS-001", name: "金融新闻语料库", type: "文本类", files: 12500, size: "2.3GB", creator: "张明", versions: ["v1.0","v1.1","v2.0"] },
  { id: "DS-002", name: "医疗CT影像集", type: "图像类", files: 5000, size: "45GB", creator: "李芳", versions: ["v1.0"] },
  { id: "DS-003", name: "客服对话数据", type: "文本类", files: 20000, size: "850MB", creator: "王强", versions: ["v1.0","v2.0"] },
  { id: "DS-004", name: "语音采集样本", type: "音频类", files: 3000, size: "12GB", creator: "赵丽", versions: ["v1.0"] },
  { id: "DS-005", name: "短视频素材集", type: "视频类", files: 1500, size: "120GB", creator: "孙伟", versions: ["v1.0"] },
];

const mockTools = [
  { id: "TL-001", name: "文本分类标注", type: "文本类", isPreset: true },
  { id: "TL-002", name: "实体关系标注", type: "文本类", isPreset: true },
  { id: "TL-003", name: "图像分类标注", type: "图像类", isPreset: true },
  { id: "TL-004", name: "矩形框标注", type: "图像类", isPreset: true },
  { id: "TL-006", name: "金融情感三分类", type: "文本类", isPreset: false },
];

const mockMembers = ["张明","李芳","王强","赵丽","孙伟","周杰","刘洋","陈思","黄磊","吴敏"];

interface Props { onBack: () => void; }

const DataAnnotationTaskCreate = ({ onBack }: Props) => {
  const [step, setStep] = useState(0);
  const steps = ["基础信息", "数据集配置", "标注工具", "任务配置", "标注规范", "发布确认"];

  // Step 0: Basic info
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");

  // Step 1: Dataset
  const [selectedDatasets, setSelectedDatasets] = useState<{ id: string; version: string }[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");

  // Step 2: Tool
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [annotationField, setAnnotationField] = useState("");
  const [labels, setLabels] = useState<{ value: string; color: string }[]>([
    { value: "正面", color: "#22c55e" },
    { value: "负面", color: "#ef4444" },
    { value: "中性", color: "#6b7280" },
  ]);
  const [labelMode, setLabelMode] = useState<"single" | "multi">("single");

  // Step 3: Task config
  const [batchMode, setBatchMode] = useState<"dataset" | "count" | "single">("dataset");
  const [batchSize, setBatchSize] = useState(100);
  const [samplingOrder, setSamplingOrder] = useState<"original" | "random">("original");
  const [assignMode, setAssignMode] = useState<"person" | "team" | "pool">("person");
  const [assignedPersons, setAssignedPersons] = useState<string[]>(["张明"]);
  const [personBatchLimit, setPersonBatchLimit] = useState(5);
  const [qaEnabled, setQaEnabled] = useState(false);
  const [qaNodes, setQaNodes] = useState<{
    persons: string[];
    method: string;
    batchRatio: number;
    dataRatio: number;
  }[]>([{ persons: ["王强"], method: "batch", batchRatio: 100, dataRatio: 30 }]);
  const [acceptEnabled, setAcceptEnabled] = useState(false);
  const [acceptPersons, setAcceptPersons] = useState<string[]>(["李芳"]);
  const [acceptMethod, setAcceptMethod] = useState("batch");
  const [acceptBatchRatio, setAcceptBatchRatio] = useState(100);
  const [acceptDataRatio, setAcceptDataRatio] = useState(20);
  const [managers, setManagers] = useState<string[]>([]);
  const [maxSkip, setMaxSkip] = useState(20);
  const [timeoutEnabled, setTimeoutEnabled] = useState(false);
  const [timeoutHours, setTimeoutHours] = useState(48);
  const [allowRelease, setAllowRelease] = useState(true);
  const [allowAppend, setAllowAppend] = useState(true);
  const [crossAnnotation, setCrossAnnotation] = useState(false);
  const [crossMax, setCrossMax] = useState(2);
  const [judgeExpert, setJudgeExpert] = useState("张明");

  // Step 4: Spec
  const [specMode, setSpecMode] = useState<"text" | "file" | "none">("none");
  const [specText, setSpecText] = useState("");
  const [specForceRead, setSpecForceRead] = useState(false);

  // Step 5: generated batches preview
  const [generatedBatches, setGeneratedBatches] = useState<{ id: string; size: number }[]>([]);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return taskName.trim().length > 0 && selectedCategory !== "" && selectedSubType !== "";
      case 1: return selectedDatasets.length > 0;
      case 2: return selectedTool !== null;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  }, [step, taskName, selectedCategory, selectedSubType, selectedDatasets, selectedTool]);

  const handleGenerateBatches = () => {
    const total = selectedDatasets.reduce((s, d) => {
      const ds = mockDatasets.find(dd => dd.id === d.id);
      return s + (ds?.files || 0);
    }, 0);
    let batches: { id: string; size: number }[] = [];
    if (batchMode === "dataset") {
      selectedDatasets.forEach((d, i) => {
        const ds = mockDatasets.find(dd => dd.id === d.id);
        batches.push({ id: `BT-${String(i + 1).padStart(3, "0")}`, size: ds?.files || 0 });
      });
    } else if (batchMode === "count") {
      let rem = total;
      let idx = 1;
      while (rem > 0) {
        const sz = Math.min(batchSize, rem);
        batches.push({ id: `BT-${String(idx).padStart(3, "0")}`, size: sz });
        rem -= sz;
        idx++;
      }
    } else {
      for (let i = 0; i < Math.min(total, 20); i++) {
        batches.push({ id: `BT-${String(i + 1).padStart(3, "0")}`, size: 1 });
      }
    }
    setGeneratedBatches(batches);
    toast.success(`已生成 ${batches.length} 个标注批次`);
  };

  const handlePublish = () => {
    toast.success("任务发布成功！系统已自动拆分标注批次并放置在任务池中");
    onBack();
  };

  const filteredDatasets = mockDatasets.filter(d => {
    if (selectedCategory && d.type !== selectedCategory) return false;
    if (datasetSearch && !d.name.includes(datasetSearch)) return false;
    return true;
  });

  const filteredTools = mockTools.filter(t => !selectedCategory || t.type === selectedCategory);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">新建标注任务</h1>
          <p className="text-sm text-muted-foreground">按步骤完成任务配置后发布</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <button onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span>{s}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="max-w-4xl">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> 基础信息</h3>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">任务名称 <span className="text-destructive">*</span></label>
                <input value={taskName} onChange={e => setTaskName(e.target.value.slice(0, 50))} placeholder="请输入任务名称" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <p className="text-xs text-muted-foreground mt-1">{taskName.length}/50 字符</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">任务描述</label>
                <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value.slice(0, 300))} placeholder="请输入任务描述" rows={3} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                <p className="text-xs text-muted-foreground mt-1">{taskDesc.length}/300 字符</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> 项目类型 <span className="text-destructive text-sm">*</span></h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 创建后不可修改，不支持混合多种类型</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {projectTypes.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <button key={pt.category} onClick={() => { setSelectedCategory(pt.category); setSelectedSubType(""); }}
                      className={`p-4 rounded-lg border text-left transition-all ${selectedCategory === pt.category ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/30"}`}>
                      <div className={`w-8 h-8 rounded-lg ${pt.color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
                      <p className="text-sm font-medium">{pt.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pt.sub.length} 种标注能力</p>
                    </button>
                  );
                })}
              </div>
              {selectedCategory && (
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground mb-2 block">选择标注能力</label>
                  <div className="flex flex-wrap gap-2">
                    {projectTypes.find(p => p.category === selectedCategory)?.sub.map(sub => (
                      <button key={sub} onClick={() => setSelectedSubType(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${selectedSubType === sub ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"}`}>{sub}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Dataset */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> 数据集配置</h3>
              <p className="text-xs text-muted-foreground">选择与项目类型匹配的数据集，支持选择多个数据集的某个版本</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input value={datasetSearch} onChange={e => setDatasetSearch(e.target.value)} placeholder="搜索数据集..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredDatasets.map(ds => {
                  const selected = selectedDatasets.find(s => s.id === ds.id);
                  return (
                    <div key={ds.id} className={`p-3 rounded-lg border flex items-center justify-between ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{ds.name}</span>
                          <span className="text-xs text-muted-foreground">{ds.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${typeColors[ds.type] || "bg-muted text-muted-foreground"}`}>{ds.type}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{ds.files.toLocaleString()} 文件 · {ds.size} · {ds.creator}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected ? (
                          <>
                            <select value={selected.version} onChange={e => setSelectedDatasets(prev => prev.map(s => s.id === ds.id ? { ...s, version: e.target.value } : s))}
                              className="px-2 py-1 text-xs border rounded bg-background">
                              {ds.versions.map(v => <option key={v}>{v}</option>)}
                            </select>
                            <button onClick={() => setSelectedDatasets(prev => prev.filter(s => s.id !== ds.id))} className="p-1 rounded hover:bg-destructive/10"><X className="w-4 h-4 text-destructive" /></button>
                          </>
                        ) : (
                          <button onClick={() => setSelectedDatasets(prev => [...prev, { id: ds.id, version: ds.versions[ds.versions.length - 1] }])}
                            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">选择</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedDatasets.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">已选 {selectedDatasets.length} 个数据集</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDatasets.map(s => {
                      const ds = mockDatasets.find(d => d.id === s.id);
                      return (
                        <span key={s.id} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                          {ds?.name} ({s.version})
                          <button onClick={() => setSelectedDatasets(prev => prev.filter(p => p.id !== s.id))}><X className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Tool */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> 标注工具配置</h3>
              <div className="space-y-2">
                {filteredTools.map(tool => (
                  <button key={tool.id} onClick={() => setSelectedTool(tool.id)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between ${selectedTool === tool.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/30"}`}>
                    <div>
                      <span className="text-sm font-medium">{tool.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{tool.isPreset ? "预置" : "自定义"}</span>
                    </div>
                    {selectedTool === tool.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {selectedTool && (
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <h4 className="text-sm font-medium">标注内容字段映射</h4>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标注内容所在字段</label>
                  <input value={annotationField} onChange={e => setAnnotationField(e.target.value)} placeholder="例如: content, text" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> 选择数据集中待标注的对应字段</p>
                </div>

                <h4 className="text-sm font-medium mt-4">标签配置</h4>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={labelMode === "single"} onChange={() => setLabelMode("single")} /> 单选
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={labelMode === "multi"} onChange={() => setLabelMode("multi")} /> 多选
                  </label>
                </div>
                <div className="space-y-2">
                  {labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={l.color} onChange={e => setLabels(prev => prev.map((p, j) => j === i ? { ...p, color: e.target.value } : p))} className="w-8 h-8 rounded border cursor-pointer" />
                      <input value={l.value} onChange={e => setLabels(prev => prev.map((p, j) => j === i ? { ...p, value: e.target.value } : p))} className="flex-1 px-3 py-1.5 text-sm border rounded bg-background" />
                      <button onClick={() => setLabels(prev => prev.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  ))}
                  <button onClick={() => setLabels(prev => [...prev, { value: "", color: "#3b82f6" }])} className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> 添加标签</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Task config */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Batch config */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> 标注批次配置</h3>
              <div className="space-y-2">
                {([
                  { key: "dataset", label: "以数据集维度打包成一个标注批次" },
                  { key: "count", label: "每N条数据打包成一个标注批次" },
                  { key: "single", label: "单条数据打包成一个标注批次" },
                ] as const).map(opt => (
                  <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${batchMode === opt.key ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                    <input type="radio" checked={batchMode === opt.key} onChange={() => setBatchMode(opt.key)} />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {batchMode === "count" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">每</label>
                  <input type="number" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className="w-24 px-2 py-1.5 text-sm border rounded bg-background" min={1} />
                  <label className="text-sm text-muted-foreground">条为一个批次</label>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">数据抽样：</label>
                <select value={samplingOrder} onChange={e => setSamplingOrder(e.target.value as any)} className="px-2 py-1.5 text-sm border rounded bg-background">
                  <option value="original">按数据原始顺序抽样</option>
                  <option value="random">随机排序抽样</option>
                </select>
              </div>
              <button onClick={handleGenerateBatches} className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                立即生成标注批次
              </button>
              {generatedBatches.length > 0 && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg max-h-[150px] overflow-y-auto">
                  <p className="text-xs font-medium mb-2">已生成 {generatedBatches.length} 个批次：</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedBatches.map(b => (
                      <span key={b.id} className="px-2 py-1 bg-card rounded border text-xs">{b.id} ({b.size}条)</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personnel config */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 标注人员配置</h3>
              <div className="flex gap-2">
                {(["person","team","pool"] as const).map(m => (
                  <button key={m} onClick={() => setAssignMode(m)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${assignMode === m ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"}`}>
                    {m === "person" ? "分配至个人" : m === "team" ? "分配至团队" : "分配至任务池"}
                  </button>
                ))}
              </div>
              {assignMode !== "pool" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {assignedPersons.map((p, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                        {p} <button onClick={() => setAssignedPersons(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <select onChange={e => { if (e.target.value && !assignedPersons.includes(e.target.value)) setAssignedPersons(prev => [...prev, e.target.value]); e.target.value = ""; }}
                    className="px-2 py-1.5 text-sm border rounded bg-background">
                    <option value="">添加人员...</option>
                    {mockMembers.filter(m => !assignedPersons.includes(m)).map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">每人可标注批次上限：</label>
                    <input type="number" value={personBatchLimit} onChange={e => setPersonBatchLimit(Number(e.target.value))} className="w-20 px-2 py-1 text-sm border rounded bg-background" min={1} />
                  </div>
                </div>
              )}
              {assignMode === "pool" && <p className="text-xs text-muted-foreground">空间内所有人均可查看并领取批次</p>}
            </div>

            {/* QA config */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> 质检节点配置</h3>
                <Switch checked={qaEnabled} onCheckedChange={setQaEnabled} />
              </div>
              {qaEnabled && qaNodes.map((node, ni) => (
                <div key={ni} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">质检节点 {ni + 1}</span>
                    {qaNodes.length > 1 && <button onClick={() => setQaNodes(prev => prev.filter((_, i) => i !== ni))} className="text-xs text-destructive">删除</button>}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">质检人员</label>
                    <select onChange={e => { if (e.target.value && !node.persons.includes(e.target.value)) { const newNodes = [...qaNodes]; newNodes[ni].persons.push(e.target.value); setQaNodes(newNodes); } e.target.value = ""; }}
                      className="px-2 py-1 text-xs border rounded bg-background">
                      <option value="">添加质检员...</option>
                      {mockMembers.filter(m => !node.persons.includes(m)).map(m => <option key={m}>{m}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {node.persons.map((p, pi) => (
                        <span key={pi} className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs flex items-center gap-1">
                          {p} <button onClick={() => { const nn = [...qaNodes]; nn[ni].persons = nn[ni].persons.filter((_, i) => i !== pi); setQaNodes(nn); }}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">质检方式</label>
                    <select value={node.method} onChange={e => { const nn = [...qaNodes]; nn[ni].method = e.target.value; setQaNodes(nn); }}
                      className="px-2 py-1.5 text-xs border rounded bg-background">
                      <option value="batch">按批次抽检</option>
                      <option value="task_batch">按任务抽检随机批次的全部数据</option>
                      <option value="task_random">按任务抽检随机批次的随机数据</option>
                    </select>
                  </div>
                  {(node.method === "batch" || node.method === "task_random") && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">批次内数据抽检比例：</label>
                      <input type="number" value={node.dataRatio} onChange={e => { const nn = [...qaNodes]; nn[ni].dataRatio = Number(e.target.value); setQaNodes(nn); }} className="w-16 px-2 py-1 text-xs border rounded bg-background" min={0} max={100} />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                  {(node.method === "task_batch" || node.method === "task_random") && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">批次抽检比例：</label>
                      <input type="number" value={node.batchRatio} onChange={e => { const nn = [...qaNodes]; nn[ni].batchRatio = Number(e.target.value); setQaNodes(nn); }} className="w-16 px-2 py-1 text-xs border rounded bg-background" min={0} max={100} />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              ))}
              {qaEnabled && (
                <button onClick={() => setQaNodes(prev => [...prev, { persons: [], method: "batch", batchRatio: 100, dataRatio: 30 }])}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> 添加质检节点</button>
              )}
            </div>

            {/* Accept config */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> 验收环节配置</h3>
                <Switch checked={acceptEnabled} onCheckedChange={setAcceptEnabled} />
              </div>
              {acceptEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">验收人员</label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {acceptPersons.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded text-xs flex items-center gap-1">
                          {p} <button onClick={() => setAcceptPersons(prev => prev.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <select onChange={e => { if (e.target.value && !acceptPersons.includes(e.target.value)) setAcceptPersons(prev => [...prev, e.target.value]); e.target.value = ""; }}
                      className="px-2 py-1 text-xs border rounded bg-background">
                      <option value="">添加验收员...</option>
                      {mockMembers.filter(m => !acceptPersons.includes(m)).map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">验收方式</label>
                    <select value={acceptMethod} onChange={e => setAcceptMethod(e.target.value)} className="px-2 py-1.5 text-xs border rounded bg-background">
                      <option value="batch">按批次抽检</option>
                      <option value="task_batch">按任务抽检随机批次的全部数据</option>
                      <option value="task_random">按任务抽检随机批次的随机数据</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Manager & advanced */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> 高级配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">标注批次最大跳过条数</span>
                  <input type="number" value={maxSkip} onChange={e => setMaxSkip(Number(e.target.value))} className="w-16 px-2 py-1 text-sm border rounded bg-background" />
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">超时回收</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={timeoutEnabled} onCheckedChange={setTimeoutEnabled} />
                    {timeoutEnabled && <input type="number" value={timeoutHours} onChange={e => setTimeoutHours(Number(e.target.value))} className="w-16 px-2 py-1 text-sm border rounded bg-background" />}
                    {timeoutEnabled && <span className="text-xs text-muted-foreground">小时</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">允许标注人员释放批次</span>
                  <Switch checked={allowRelease} onCheckedChange={setAllowRelease} />
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">允许追加标注数据集</span>
                  <Switch checked={allowAppend} onCheckedChange={setAllowAppend} />
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">多人交叉标注</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={crossAnnotation} onCheckedChange={setCrossAnnotation} />
                    {crossAnnotation && <input type="number" value={crossMax} onChange={e => setCrossMax(Number(e.target.value))} className="w-12 px-2 py-1 text-sm border rounded bg-background" min={2} />}
                    {crossAnnotation && <span className="text-xs text-muted-foreground">人</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">判定专家</span>
                  <select value={judgeExpert} onChange={e => setJudgeExpert(e.target.value)} className="px-2 py-1 text-sm border rounded bg-background">
                    {mockMembers.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Spec */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> 标注规范配置</h3>
              <p className="text-xs text-muted-foreground">单任务仅允许选择一种规范方式</p>
              <div className="flex gap-2">
                {(["none","text","file"] as const).map(m => (
                  <button key={m} onClick={() => setSpecMode(m)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${specMode === m ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"}`}>
                    {m === "none" ? "不配置" : m === "text" ? "填写说明文本" : "上传附件"}
                  </button>
                ))}
              </div>
              {specMode === "text" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标注规范（支持 Markdown / HTML）</label>
                  <textarea value={specText} onChange={e => setSpecText(e.target.value)} placeholder="请输入标注规范说明..." rows={8}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono" />
                </div>
              )}
              {specMode === "file" && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">点击或拖拽上传文件</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 PDF(1个) 或图片(≤5张)，单文件≤10MB，总计≤20MB</p>
                </div>
              )}
              {specMode !== "none" && (
                <div className="flex items-center gap-2">
                  <Switch checked={specForceRead} onCheckedChange={setSpecForceRead} />
                  <span className="text-sm">标注前强制阅读规范</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Publish */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 发布确认</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">任务名称</p>
                    <p className="text-sm font-medium">{taskName}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">项目类型</p>
                    <p className="text-sm font-medium">{selectedCategory} - {selectedSubType}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">数据集</p>
                    <p className="text-sm font-medium">{selectedDatasets.length} 个数据集</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">标注工具</p>
                    <p className="text-sm font-medium">{mockTools.find(t => t.id === selectedTool)?.name || "未选择"}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">批次模式</p>
                    <p className="text-sm font-medium">{batchMode === "dataset" ? "数据集维度" : batchMode === "count" ? `每${batchSize}条` : "单条"}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">分配模式</p>
                    <p className="text-sm font-medium">{assignMode === "person" ? "分配至个人" : assignMode === "team" ? "分配至团队" : "分配至任务池"}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">质检</p>
                    <p className="text-sm font-medium">{qaEnabled ? `${qaNodes.length} 个质检节点` : "未开启"}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">验收</p>
                    <p className="text-sm font-medium">{acceptEnabled ? `${acceptPersons.length} 名验收员` : "未开启"}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">项目类型、标注工具等核心配置发布后无法修改。发布后系统将自动拆分标注批次并放入任务池。</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t">
          <button onClick={() => step > 0 ? setStep(step - 1) : onBack()} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">
            {step === 0 ? "取消" : "上一步"}
          </button>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}
                className="px-6 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                下一步
              </button>
            ) : (
              <button onClick={() => setPublishConfirmOpen(true)} className="px-6 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                发布任务
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Publish confirmation dialog */}
      {publishConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">确认发布任务</h3>
            <p className="text-sm text-muted-foreground mb-4">项目类型、标注工具等核心配置发布后无法修改，确认发布？</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPublishConfirmOpen(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handlePublish} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "表格类": "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "跨模态类": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default DataAnnotationTaskCreate;

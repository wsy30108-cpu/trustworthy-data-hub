import { useState, useMemo } from "react";
import {
  Plus, Search, Brain, Zap, MousePointer2, RefreshCw, Star, StarOff,
  CheckCircle2, AlertTriangle, Clock, X, Trash2, Edit3,
  Cpu, Type, Image as ImageIcon, Mic, Video, Table2, Layers,
  Activity, PlayCircle, Globe, KeyRound, Link2
} from "lucide-react";
import { toast } from "sonner";
import {
  useMLModelStore,
  type MLModel,
  type LabelScope,
  type LowConfidencePolicy,
  type ModelModality,
  type ModelSource,
  type ModelHealth,
} from "@/stores/useMLModelStore";

const modalityIcons: Record<ModelModality, any> = {
  文本类: Type,
  图像类: ImageIcon,
  音频类: Mic,
  视频类: Video,
  表格类: Table2,
  跨模态类: Layers,
};

const modalityColors: Record<ModelModality, string> = {
  文本类: "bg-blue-50 text-blue-700 border-blue-200",
  图像类: "bg-green-50 text-green-700 border-green-200",
  音频类: "bg-amber-50 text-amber-700 border-amber-200",
  视频类: "bg-purple-50 text-purple-700 border-purple-200",
  表格类: "bg-cyan-50 text-cyan-700 border-cyan-200",
  跨模态类: "bg-rose-50 text-rose-700 border-rose-200",
};

const sourceColors: Record<ModelSource, string> = {
  内置: "bg-slate-100 text-slate-700 border-slate-200",
  自建: "bg-sky-50 text-sky-700 border-sky-200",
  市场: "bg-violet-50 text-violet-700 border-violet-200",
};

const healthColors: Record<ModelHealth, string> = {
  健康: "bg-emerald-50 text-emerald-700 border-emerald-200",
  异常: "bg-rose-50 text-rose-700 border-rose-200",
  未检测: "bg-slate-50 text-slate-500 border-slate-200",
};

const modalityOptions: ModelModality[] = [
  "文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类",
];

interface ConnectFormState {
  name: string;
  description: string;
  modality: ModelModality;
  taskTypes: string;
  backendUrl: string;
  authType: "none" | "basic" | "token";
  authValue: string;
  supportsBatch: boolean;
  supportsInteractive: boolean;
  supportsTraining: boolean;
  avgInferenceMs: number;
  defaultConfidence: number;
  lowConfidencePolicy: LowConfidencePolicy;
  labelScope: LabelScope;
  capabilityBoundary: string;
  source: ModelSource;
  version: string;
}

const emptyForm: ConnectFormState = {
  name: "",
  description: "",
  modality: "文本类",
  taskTypes: "",
  backendUrl: "",
  authType: "none",
  authValue: "",
  supportsBatch: true,
  supportsInteractive: false,
  supportsTraining: false,
  avgInferenceMs: 200,
  defaultConfidence: 0.6,
  lowConfidencePolicy: "人工复核",
  labelScope: "固定标签集",
  capabilityBoundary: "",
  source: "自建",
  version: "v1.0.0",
};

const DataAnnotationModels = () => {
  const { models, addModel, updateModel, removeModel, testConnection, setDefault } = useMLModelStore();

  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState<"全部" | ModelModality>("全部");
  const [sourceFilter, setSourceFilter] = useState<"全部" | ModelSource>("全部");

  const [showConnect, setShowConnect] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MLModel | null>(null);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (modalityFilter !== "全部" && m.modality !== modalityFilter) return false;
      if (sourceFilter !== "全部" && m.source !== sourceFilter) return false;
      if (search && !m.name.includes(search) && !m.id.includes(search)) return false;
      return true;
    });
  }, [models, modalityFilter, sourceFilter, search]);

  const stats = useMemo(() => {
    const healthy = models.filter((m) => m.health === "健康").length;
    const batchReady = models.filter((m) => m.supportsBatch).length;
    const interactive = models.filter((m) => m.supportsInteractive).length;
    return [
      { label: "已接入模型", value: models.length, icon: Brain, color: "text-blue-600" },
      { label: "健康在线", value: healthy, icon: Activity, color: "text-emerald-600" },
      { label: "支持批量", value: batchReady, icon: Zap, color: "text-amber-600" },
      { label: "支持交互", value: interactive, icon: MousePointer2, color: "text-purple-600" },
    ];
  }, [models]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowConnect(true);
  };

  const openEdit = (m: MLModel) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description,
      modality: m.modality,
      taskTypes: m.taskTypes.join("，"),
      backendUrl: m.backendUrl,
      authType: m.authType,
      authValue: m.authValue || "",
      supportsBatch: m.supportsBatch,
      supportsInteractive: m.supportsInteractive,
      supportsTraining: m.supportsTraining,
      avgInferenceMs: m.avgInferenceMs,
      defaultConfidence: m.defaultConfidence,
      lowConfidencePolicy: m.lowConfidencePolicy,
      labelScope: m.labelScope,
      capabilityBoundary: m.capabilityBoundary,
      source: m.source,
      version: m.version,
    });
    setShowConnect(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("请填写模型名称");
    if (!form.backendUrl.trim()) return toast.error("请填写模型 Backend URL");
    if (!/^https?:\/\//.test(form.backendUrl)) return toast.error("Backend URL 必须以 http:// 或 https:// 开头");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      modality: form.modality,
      taskTypes: form.taskTypes
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      backendUrl: form.backendUrl.trim(),
      authType: form.authType,
      authValue: form.authValue,
      supportsBatch: form.supportsBatch,
      supportsInteractive: form.supportsInteractive,
      supportsTraining: form.supportsTraining,
      avgInferenceMs: form.avgInferenceMs,
      defaultConfidence: form.defaultConfidence,
      lowConfidencePolicy: form.lowConfidencePolicy,
      labelScope: form.labelScope,
      capabilityBoundary: form.capabilityBoundary.trim(),
      source: form.source,
      version: form.version,
      creator: "当前用户",
    };

    if (editingId) {
      updateModel(editingId, payload);
      toast.success(`模型「${payload.name}」已更新`);
    } else {
      const id = addModel(payload);
      toast.success(`模型「${payload.name}」已接入（${id}）`);
    }
    setShowConnect(false);
  };

  const handleTest = (m: MLModel) => {
    const result = testConnection(m.id);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const handleToggleDefault = (m: MLModel) => {
    if (m.isDefault) {
      toast.info(`${m.modality}至少保留一个默认模型`);
      return;
    }
    setDefault(m.modality, m.id);
    toast.success(`已将「${m.name}」设为${m.modality}默认模型`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeModel(deleteTarget.id);
    toast.success(`模型「${deleteTarget.name}」已删除`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型管理</h1>
          <p className="page-description">接入并管理用于数据预标注的 AI 模型服务</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 连接模型
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={s.color}><s.icon className="w-8 h-8" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索模型名称或 ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border rounded-lg bg-card"
        >
          <option value="全部">全部模态</option>
          {modalityOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border rounded-lg bg-card"
        >
          <option value="全部">全部来源</option>
          <option value="内置">内置</option>
          <option value="自建">自建</option>
          <option value="市场">市场</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const Icon = modalityIcons[m.modality];
          return (
            <div
              key={m.id}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative"
            >
              {m.isDefault && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 默认
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${modalityColors[m.modality]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{m.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">{m.version}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{m.id}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                {m.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${modalityColors[m.modality]}`}>
                  {m.modality}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sourceColors[m.source]}`}>
                  {m.source}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${healthColors[m.health]}`}>
                  {m.health === "健康" && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                  {m.health === "异常" && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                  {m.health === "未检测" && <Clock className="w-3 h-3 inline mr-0.5" />}
                  {m.health}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {m.taskTypes.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="flex items-center gap-1 text-[10px]">
                  <Zap className={`w-3 h-3 ${m.supportsBatch ? "text-primary" : "text-muted-foreground/40"}`} />
                  <span className={m.supportsBatch ? "text-foreground" : "text-muted-foreground/60"}>
                    批量
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <MousePointer2 className={`w-3 h-3 ${m.supportsInteractive ? "text-primary" : "text-muted-foreground/40"}`} />
                  <span className={m.supportsInteractive ? "text-foreground" : "text-muted-foreground/60"}>
                    交互
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <RefreshCw className={`w-3 h-3 ${m.supportsTraining ? "text-primary" : "text-muted-foreground/40"}`} />
                  <span className={m.supportsTraining ? "text-foreground" : "text-muted-foreground/60"}>
                    训练
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">平均推理</span>
                  <span className="font-mono text-foreground">{m.avgInferenceMs}ms/条</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">置信度阈值</span>
                  <span className="font-mono text-foreground">{m.defaultConfidence.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-md p-2">
                <p>
                  标签范围：<span className="text-foreground">{m.labelScope}</span>
                </p>
                <p>
                  低置信度：<span className="text-foreground">{m.lowConfidencePolicy}</span>
                </p>
                <p className="mt-1 line-clamp-2">
                  能力边界：<span className="text-foreground">{m.capabilityBoundary || "未填写"}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t">
                <button
                  onClick={() => handleTest(m)}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center justify-center gap-1 transition-colors"
                  title="测试连接"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> 测试
                </button>
                <button
                  onClick={() => handleToggleDefault(m)}
                  className={`flex-1 px-2 py-1.5 text-xs border rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    m.isDefault ? "bg-amber-50 border-amber-200 text-amber-700" : "hover:bg-muted/50"
                  }`}
                  title={m.isDefault ? "当前默认" : "设为默认"}
                >
                  {m.isDefault ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : <StarOff className="w-3.5 h-3.5" />}
                  默认
                </button>
                <button
                  onClick={() => openEdit(m)}
                  className="px-2 py-1.5 text-xs border rounded-lg hover:bg-muted/50 transition-colors"
                  title="编辑"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {m.source !== "内置" && (
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="px-2 py-1.5 text-xs border rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">暂无符合条件的模型</p>
            <button
              onClick={openCreate}
              className="mt-3 text-xs text-primary hover:underline"
            >
              立即连接第一个模型
            </button>
          </div>
        )}
      </div>

      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {editingId ? "编辑模型" : "连接模型"}
              </h3>
              <button onClick={() => setShowConnect(false)} className="p-1 rounded hover:bg-muted/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    模型名称 <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如：通用文本情感分类"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">版本</label>
                  <input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">模型描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="简要描述模型能力、适用场景..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    模型模态 <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value as ModelModality })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    {modalityOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">模型来源</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as ModelSource })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="自建">自建</option>
                    <option value="市场">市场</option>
                    <option value="内置">内置</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  任务类型标签 <span className="text-muted-foreground/60">（逗号分隔）</span>
                </label>
                <input
                  value={form.taskTypes}
                  onChange={(e) => setForm({ ...form, taskTypes: e.target.value })}
                  placeholder="如：文本分类，情感分析，NER"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Backend URL <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.backendUrl}
                    onChange={(e) => setForm({ ...form, backendUrl: e.target.value })}
                    placeholder="http://ml-backend.internal:9090"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  遵循 Label Studio ML Backend 协议，需实现 /predict、/setup 等端点
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">认证方式</label>
                  <select
                    value={form.authType}
                    onChange={(e) => setForm({ ...form, authType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="none">无认证</option>
                    <option value="basic">Basic Auth</option>
                    <option value="token">Token</option>
                  </select>
                </div>
                {form.authType !== "none" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <KeyRound className="w-3 h-3" /> 认证凭据
                    </label>
                    <input
                      value={form.authValue}
                      onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                      type="password"
                      placeholder="Token 或 user:password"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                <p className="text-xs font-semibold text-foreground">能力声明</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "supportsBatch", label: "批量预标注", icon: Zap },
                    { key: "supportsInteractive", label: "交互式预标注", icon: MousePointer2 },
                    { key: "supportsTraining", label: "模型训练", icon: RefreshCw },
                  ].map(({ key, label, icon: I }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        (form as any)[key] ? "border-primary bg-primary/5" : "bg-card"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      />
                      <I className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">平均推理耗时 (ms/条)</label>
                  <input
                    type="number"
                    value={form.avgInferenceMs}
                    onChange={(e) => setForm({ ...form, avgInferenceMs: Number(e.target.value) })}
                    min={10}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">默认置信度阈值 (0-1)</label>
                  <input
                    type="number"
                    value={form.defaultConfidence}
                    onChange={(e) => setForm({ ...form, defaultConfidence: Number(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">低置信度策略</label>
                  <select
                    value={form.lowConfidencePolicy}
                    onChange={(e) => setForm({ ...form, lowConfidencePolicy: e.target.value as LowConfidencePolicy })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="人工复核">人工复核</option>
                    <option value="自动驳回">自动驳回</option>
                    <option value="进入质检池">进入质检池</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标签范围能力</label>
                  <select
                    value={form.labelScope}
                    onChange={(e) => setForm({ ...form, labelScope: e.target.value as LabelScope })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="固定标签集">固定标签集</option>
                    <option value="开放标签集">开放标签集</option>
                    <option value="候选集约束">候选集约束</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">能力边界说明</label>
                <textarea
                  value={form.capabilityBoundary}
                  onChange={(e) => setForm({ ...form, capabilityBoundary: e.target.value })}
                  placeholder="说明该模型不擅长或不支持的场景，避免误用"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t flex items-center justify-between gap-2 bg-muted/20">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" /> 连接后可在任务创建时选用
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConnect(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {editingId ? "保存修改" : "连接并保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">删除模型</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              确定要删除模型 <span className="font-medium text-foreground">{deleteTarget.name}</span> 吗？
              <br />
              使用该模型的任务将无法继续执行预标注。
            </p>
            <div className="flex justify-end gap-2 text-sm">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg hover:bg-muted/50">
                取消
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationModels;

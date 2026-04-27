import { useMemo, useState } from "react";
import { Brain, Plus, Search, Sparkles, ShieldCheck, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  useMLModelStore,
  type ActiveLearningStrategy,
  type LabelScope,
  type LowConfidencePolicy,
  type MLModel,
  type ModelModality,
  type ModelSource,
} from "@/stores/useMLModelStore";

interface BasicFormState {
  name: string;
  description: string;
  modality: ModelModality;
  source: ModelSource;
  taskTypes: string;
  supportsBatch: boolean;
  supportsInteractive: boolean;
  supportsTraining: boolean;
  avgInferenceMs: number;
  defaultConfidence: number;
  lowConfidencePolicy: LowConfidencePolicy;
  labelScope: LabelScope;
  isOpenVocabulary: boolean;
  supportsActiveLearning: boolean;
  activeLearningStrategy: ActiveLearningStrategy;
  capabilityBoundary: string;
  taskTypeDescriptions: string;
}

const emptyForm: BasicFormState = {
  name: "",
  description: "",
  modality: "文本类",
  source: "自建",
  taskTypes: "",
  supportsBatch: true,
  supportsInteractive: false,
  supportsTraining: false,
  avgInferenceMs: 200,
  defaultConfidence: 0.6,
  lowConfidencePolicy: "人工复核",
  labelScope: "固定标签集",
  isOpenVocabulary: false,
  supportsActiveLearning: false,
  activeLearningStrategy: "不启用",
  capabilityBoundary: "",
  taskTypeDescriptions: "",
};

const modalityOptions: ModelModality[] = [
  "文本类",
  "图像类",
  "音频类",
  "视频类",
  "表格类",
  "跨模态类",
];

const DataAnnotationModelBasic = () => {
  const { models, addModel, updateModel, removeModel } = useMLModelStore();
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState<"全部" | ModelModality>("全部");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BasicFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MLModel | null>(null);

  const filtered = useMemo(
    () =>
      models.filter((m) => {
        if (modalityFilter !== "全部" && m.modality !== modalityFilter) return false;
        if (search && !(`${m.name}${m.id}`.includes(search))) return false;
        return true;
      }),
    [models, modalityFilter, search]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (m: MLModel) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description,
      modality: m.modality,
      source: m.source,
      taskTypes: m.taskTypes.join("，"),
      supportsBatch: m.supportsBatch,
      supportsInteractive: m.supportsInteractive,
      supportsTraining: m.supportsTraining,
      avgInferenceMs: m.avgInferenceMs,
      defaultConfidence: m.defaultConfidence,
      lowConfidencePolicy: m.lowConfidencePolicy,
      labelScope: m.labelScope,
      isOpenVocabulary: m.isOpenVocabulary,
      supportsActiveLearning: m.supportsActiveLearning,
      activeLearningStrategy: m.activeLearningStrategy,
      capabilityBoundary: m.capabilityBoundary,
      taskTypeDescriptions: Object.entries(m.taskTypeDescriptions || {})
        .map(([k, v]) => `${k}:${v}`)
        .join("\n"),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("请填写模型名称");
    const taskTypes = form.taskTypes
      .split(/[,，、\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!taskTypes.length) return toast.error("请至少填写一个任务类型");

    const taskTypeDescriptions = form.taskTypeDescriptions
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, line) => {
        const [taskType, ...desc] = line.split(":");
        if (taskType?.trim() && desc.length) acc[taskType.trim()] = desc.join(":").trim();
        return acc;
      }, {});

    if (form.supportsActiveLearning && form.activeLearningStrategy === "不启用") {
      return toast.error("已勾选支持主动学习，请选择策略");
    }

    if (editingId) {
      updateModel(editingId, {
        name: form.name.trim(),
        description: form.description.trim(),
        modality: form.modality,
        source: form.source,
        taskTypes,
        supportsBatch: form.supportsBatch,
        supportsInteractive: form.supportsInteractive,
        supportsTraining: form.supportsTraining,
        avgInferenceMs: form.avgInferenceMs,
        defaultConfidence: form.defaultConfidence,
        lowConfidencePolicy: form.lowConfidencePolicy,
        labelScope: form.labelScope,
        isOpenVocabulary: form.isOpenVocabulary,
        supportsActiveLearning: form.supportsActiveLearning,
        activeLearningStrategy: form.supportsActiveLearning
          ? form.activeLearningStrategy
          : "不启用",
        capabilityBoundary: form.capabilityBoundary.trim(),
        taskTypeDescriptions,
      });
      toast.success("模型基本信息已更新");
    } else {
      addModel({
        name: form.name.trim(),
        description: form.description.trim(),
        modality: form.modality,
        taskTypes,
        backendUrl: "http://ml-backend.internal:9000/predict",
        authType: "none",
        authValue: "",
        supportsBatch: form.supportsBatch,
        supportsInteractive: form.supportsInteractive,
        supportsTraining: form.supportsTraining,
        source: form.source,
        avgInferenceMs: form.avgInferenceMs,
        defaultConfidence: form.defaultConfidence,
        lowConfidencePolicy: form.lowConfidencePolicy,
        labelScope: form.labelScope,
        capabilityBoundary: form.capabilityBoundary.trim(),
        isOpenVocabulary: form.isOpenVocabulary,
        supportsActiveLearning: form.supportsActiveLearning,
        activeLearningStrategy: form.supportsActiveLearning
          ? form.activeLearningStrategy
          : "不启用",
        taskTypeDescriptions,
        versions: [],
        creator: "当前用户",
        version: "v1.0.0",
      });
      toast.success("模型已创建，请前往模型版本管理补充连接配置");
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型基本信息管理</h1>
          <p className="page-description">维护模型模态、开放词汇能力、主动学习策略与任务能力说明</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 新建模型主档
        </button>
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
          onChange={(e) => setModalityFilter(e.target.value as "全部" | ModelModality)}
          className="px-3 py-2 text-sm border rounded-lg bg-card"
        >
          <option value="全部">全部模态</option>
          {modalityOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{m.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">{m.id}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {m.modality}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
            <div className="text-[11px] space-y-1">
              <p>
                开放词汇：<span className="font-medium">{m.isOpenVocabulary ? "是" : "否"}</span>
              </p>
              <p>
                主动学习：<span className="font-medium">{m.supportsActiveLearning ? m.activeLearningStrategy : "不支持"}</span>
              </p>
              <p>
                低置信度策略：<span className="font-medium">{m.lowConfidencePolicy}</span>
              </p>
              <p>
                标签范围：<span className="font-medium">{m.labelScope}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {m.taskTypes.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2">
              <p className="line-clamp-2">{m.capabilityBoundary || "未填写能力边界说明"}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <button
                onClick={() => openEdit(m)}
                className="flex-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> 编辑
              </button>
              {m.source !== "内置" && (
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {editingId ? "编辑模型基本信息" : "新建模型基本信息"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">
                关闭
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">模型名称 *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">模型模态 *</label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value as ModelModality })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    {modalityOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">模型描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">任务类型（逗号分隔）*</label>
                  <input
                    value={form.taskTypes}
                    onChange={(e) => setForm({ ...form, taskTypes: e.target.value })}
                    placeholder="如：目标检测，图像分类"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">任务能力说明（每行 task:desc）</label>
                  <textarea
                    value={form.taskTypeDescriptions}
                    onChange={(e) => setForm({ ...form, taskTypeDescriptions: e.target.value })}
                    rows={3}
                    placeholder={"目标检测:支持中小目标\n图像分类:支持多标签"}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isOpenVocabulary}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isOpenVocabulary: e.target.checked,
                        labelScope: e.target.checked ? "开放标签集" : "固定标签集",
                      })
                    }
                  />
                  <Sparkles className="w-4 h-4 text-primary" /> 开放词汇模型
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.supportsActiveLearning}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supportsActiveLearning: e.target.checked,
                        activeLearningStrategy: e.target.checked ? form.activeLearningStrategy : "不启用",
                      })
                    }
                  />
                  <ShieldCheck className="w-4 h-4 text-primary" /> 支持主动学习
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">主动学习策略</label>
                  <select
                    value={form.activeLearningStrategy}
                    disabled={!form.supportsActiveLearning}
                    onChange={(e) =>
                      setForm({ ...form, activeLearningStrategy: e.target.value as ActiveLearningStrategy })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background disabled:opacity-60"
                  >
                    <option value="不启用">不启用</option>
                    <option value="不确定性采样">不确定性采样</option>
                    <option value="多样性采样">多样性采样</option>
                    <option value="不确定性+多样性">不确定性+多样性</option>
                  </select>
                </div>
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
                <label className="text-xs text-muted-foreground mb-1 block">模型能力边界说明</label>
                <textarea
                  value={form.capabilityBoundary}
                  onChange={(e) => setForm({ ...form, capabilityBoundary: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg">
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
              >
                {editingId ? "保存修改" : "创建模型"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-3">删除模型</h3>
            <p className="text-sm text-muted-foreground mb-4">
              确定删除模型「{deleteTarget.name}」吗？该模型的版本记录也将被移除。
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">
                取消
              </button>
              <button
                onClick={() => {
                  removeModel(deleteTarget.id);
                  setDeleteTarget(null);
                  toast.success("模型已删除");
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationModelBasic;

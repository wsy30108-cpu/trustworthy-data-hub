import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  X as XIcon,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  Image as ImageIcon,
  Mic,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Type,
  Video,
  Table2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMLModelStore, type MLModel, type ModelHealth, type ModelModality } from "@/stores/useMLModelStore";
import { ANNOTATION_TASK_TYPES } from "@/constants/annotationTaskTypes";

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

const healthColors: Record<ModelHealth, string> = {
  健康: "bg-emerald-50 text-emerald-700 border-emerald-200",
  异常: "bg-rose-50 text-rose-700 border-rose-200",
  未检测: "bg-slate-50 text-slate-500 border-slate-200",
};

const modalityOptions: ModelModality[] = ["文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类"];

interface ConnectFormState {
  name: string;
  description: string;
  modality: ModelModality;
  taskTypes: string[];
  supportsBatch: boolean;
  supportsInteractive: boolean;
  supportsTraining: boolean;
  avgInferenceMs: number;
  labelScope: "固定标签集" | "开放标签集";
  supportsActiveLearning: boolean;
  activeLearningTriggerCondition: string;
}

const emptyForm: ConnectFormState = {
  name: "",
  description: "",
  modality: "文本类",
  taskTypes: [],
  supportsBatch: true,
  supportsInteractive: false,
  supportsTraining: false,
  avgInferenceMs: 200,
  labelScope: "固定标签集",
  supportsActiveLearning: false,
  activeLearningTriggerCondition: "100",
};

const DataAnnotationModels = () => {
  const navigate = useNavigate();
  const { models, addModel, updateModel, removeModel, testConnection } = useMLModelStore();
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState<"全部" | ModelModality>("全部");
  const [showConnect, setShowConnect] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectFormState>(emptyForm);
  const [taskTypePopoverOpen, setTaskTypePopoverOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MLModel | null>(null);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (modalityFilter !== "全部" && m.modality !== modalityFilter) return false;
      if (search && !m.name.includes(search) && !m.id.includes(search)) return false;
      return true;
    });
  }, [models, modalityFilter, search]);

  const stats = useMemo(() => {
    const healthyModelCount = models.filter((m) => m.health === "健康").length;
    const totalVersions = models.reduce((sum, m) => sum + m.versions.length, 0);
    const healthyVersions = models.reduce(
      (sum, m) => sum + m.versions.filter((v) => v.health === "健康").length,
      0
    );
    return [
      { label: "模型总数", value: models.length, icon: Brain, color: "text-blue-600" },
      { label: "模型健康数", value: healthyModelCount, icon: Activity, color: "text-emerald-600" },
      { label: "版本总数", value: totalVersions, icon: RefreshCw, color: "text-amber-600" },
      { label: "版本健康数", value: healthyVersions, icon: CheckCircle2, color: "text-purple-600" },
    ];
  }, [models]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTaskTypePopoverOpen(false);
    setShowConnect(true);
  };

  const toggleTaskType = (t: string) => {
    setForm((prev) => {
      const has = prev.taskTypes.includes(t);
      return {
        ...prev,
        taskTypes: has ? prev.taskTypes.filter((x) => x !== t) : [...prev.taskTypes, t],
      };
    });
  };

  const openEdit = (m: MLModel) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description,
      modality: m.modality,
      taskTypes: m.taskTypes,
      supportsBatch: m.supportsBatch,
      supportsInteractive: m.supportsInteractive,
      supportsTraining: m.supportsTraining,
      avgInferenceMs: m.avgInferenceMs,
      labelScope: m.labelScope,
      supportsActiveLearning: m.supportsActiveLearning,
      activeLearningTriggerCondition: m.activeLearningTriggerCondition || "",
    });
    setShowConnect(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("请填写模型名称");
    if (form.taskTypes.length === 0) return toast.error("请至少选择一个任务类型");
    if (form.supportsActiveLearning && !form.activeLearningTriggerCondition.trim()) {
      return toast.error("支持主动学习时请填写主动学习触发条件");
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      modality: form.modality,
      taskTypes: form.taskTypes
        .map((t) => t.trim())
        .filter(Boolean),
      supportsBatch: form.supportsBatch,
      supportsInteractive: form.supportsInteractive,
      supportsTraining: form.supportsTraining,
      avgInferenceMs: form.avgInferenceMs,
      labelScope: form.labelScope,
      supportsActiveLearning: form.supportsActiveLearning,
      activeLearningTriggerCondition: form.supportsActiveLearning
        ? form.activeLearningTriggerCondition.trim()
        : undefined,
      creator: "当前用户",
    };

    if (editingId) {
      updateModel(editingId, payload);
      toast.success(`模型「${payload.name}」已更新`);
    } else {
      const id = addModel(payload);
      toast.success(`模型「${payload.name}」已创建（${id}）`);
    }
    setShowConnect(false);
  };

  const handleTest = (m: MLModel) => {
    const result = testConnection(m.id);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型管理</h1>
          <p className="page-description">维护模型基本信息，点击模型卡片进入版本管理</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 新增模型
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={s.color}>
              <s.icon className="w-8 h-8" />
            </div>
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
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card"
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
        {filtered.map((m) => {
          const Icon = modalityIcons[m.modality] ?? Type;
          return (
            <div
              key={m.id}
              role="presentation"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative cursor-pointer group"
              onClick={() => navigate(`/data-annotation/models/versions?modelId=${m.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${modalityColors[m.modality]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{m.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{m.id}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">{m.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${modalityColors[m.modality]}`}>
                  {m.modality}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${healthColors[m.health]}`}>
                  {m.health === "健康" && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                  {m.health === "异常" && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                  {m.health === "未检测" && <Clock className="w-3 h-3 inline mr-0.5" />}
                  {m.health}
                </span>
              </div>
              {m.taskTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.taskTypes.slice(0, 6).map((tt) => (
                    <span
                      key={tt}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-primary/20 bg-primary/5 text-primary"
                    >
                      {tt}
                    </span>
                  ))}
                  {m.taskTypes.length > 6 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] border border-muted text-muted-foreground">
                      +{m.taskTypes.length - 6}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-md p-2">
                <p>
                  标签范围：<span className="text-foreground">{m.labelScope}</span>
                </p>
                <p>
                  主动学习：
                  <span className="text-foreground">
                    {m.supportsActiveLearning ? m.activeLearningTriggerCondition || "已开启" : "不支持"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleTest(m)}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center justify-center gap-1"
                >
                  <Cpu className="w-3.5 h-3.5" /> 连接测试
                </button>
                <button type="button" onClick={() => openEdit(m)} className="px-2 py-1.5 text-xs border rounded-lg hover:bg-muted/50">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(m)} className="px-2 py-1.5 text-xs border rounded-lg hover:bg-destructive/10 text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">暂无符合条件的模型</p>
          </div>
        )}
      </div>

      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {editingId ? "编辑模型" : "新增模型"}
              </h3>
              <button type="button" onClick={() => setShowConnect(false)} className="p-1 rounded hover:bg-muted/50" aria-label="关闭">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">任务类型（可多选）</label>
                <Popover open={taskTypePopoverOpen} onOpenChange={setTaskTypePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background flex items-center justify-between gap-2 text-left"
                    >
                      <span className={cn("truncate", form.taskTypes.length === 0 && "text-muted-foreground")}>
                        {form.taskTypes.length ? `已选 ${form.taskTypes.length} 项` : "点击选择任务类型（支持多选）"}
                      </span>
                      <Brain className="w-4 h-4 shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 max-h-64 overflow-y-auto" align="start">
                    <div className="space-y-1">
                      {ANNOTATION_TASK_TYPES.map((taskType) => (
                        <label
                          key={taskType}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/60",
                            form.taskTypes.includes(taskType) && "bg-primary/5 text-primary"
                          )}
                        >
                          <Checkbox
                            checked={form.taskTypes.includes(taskType)}
                            onCheckedChange={() => toggleTaskType(taskType)}
                          />
                          <span>{taskType}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.taskTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTaskType(t)}
                      className="px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-medium text-primary hover:bg-primary/10"
                      title="点击移除"
                    >
                      {t}
                      <span className="ml-1 opacity-60">✕</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标签范围</label>
                  <select
                    value={form.labelScope}
                    onChange={(e) => setForm({ ...form, labelScope: e.target.value as "固定标签集" | "开放标签集" })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="固定标签集">固定标签集</option>
                    <option value="开放标签集">开放标签集</option>
                  </select>
                </div>
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
              </div>

              <div className="rounded-lg border p-3 bg-muted/20">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.supportsActiveLearning}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supportsActiveLearning: e.target.checked,
                        activeLearningTriggerCondition: e.target.checked ? form.activeLearningTriggerCondition : "",
                      })
                    }
                  />
                  是否支持主动学习
                </label>
                {form.supportsActiveLearning && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={form.activeLearningTriggerCondition}
                      onChange={(e) => setForm({ ...form, activeLearningTriggerCondition: e.target.value })}
                      type="number"
                      min={1}
                      className="w-24 px-3 py-2 text-sm border rounded-lg bg-background"
                    />
                    <span className="text-sm text-muted-foreground">条</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2 bg-muted/20">
              <button onClick={() => setShowConnect(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                保存
              </button>
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
            </p>
            <div className="flex justify-end gap-2 text-sm">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg hover:bg-muted/50">
                取消
              </button>
              <button
                onClick={() => {
                  removeModel(deleteTarget.id);
                  setDeleteTarget(null);
                  toast.success("模型已删除");
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg"
              >
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

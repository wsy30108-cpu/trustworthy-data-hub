import { useMemo, useState } from "react";
import { AlertTriangle, Brain, Edit3, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useMLModelStore,
  type MLModel,
  type ModelPromptBinding,
  type VocabularyMapping,
} from "@/stores/useMLModelStore";

interface VersionFormState {
  version: string;
  endpointUrl: string;
  authType: "none" | "basic" | "token";
  authValue: string;
  promptBindingsText: string;
  vocabularyMappingsText: string;
}

const emptyVersionForm: VersionFormState = {
  version: "v1.0.0",
  endpointUrl: "",
  authType: "none",
  authValue: "",
  promptBindingsText: "",
  vocabularyMappingsText: "",
};

const promptBindingsToText = (bindings: ModelPromptBinding[]) =>
  bindings.map((x) => `${x.taskType}::${x.prompt}`).join("\n");

const vocabMappingsToText = (mappings: VocabularyMapping[]) =>
  mappings.map((x) => `${x.source}=>${x.target}${x.notes ? `|${x.notes}` : ""}`).join("\n");

const parsePromptBindings = (text: string): ModelPromptBinding[] =>
  text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const [taskType, ...rest] = line.split("::");
      return { taskType: taskType?.trim() || "未命名任务", prompt: rest.join("::").trim() };
    })
    .filter((x) => x.prompt);

const parseVocabularyMappings = (text: string): VocabularyMapping[] =>
  text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const [pair, notes] = line.split("|");
      const [source, target] = pair.split("=>").map((x) => x.trim());
      return { source, target, notes: notes?.trim() };
    })
    .filter((x) => x.source && x.target);

const DataAnnotationModelVersions = () => {
  const { models, addVersion, updateVersion, removeVersion, setDefaultVersion } = useMLModelStore();
  const [search, setSearch] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VersionFormState>(emptyVersionForm);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (!search.trim()) return true;
      return m.name.includes(search) || m.id.includes(search);
    });
  }, [models, search]);

  const selectedModel: MLModel | undefined = useMemo(() => {
    const selected = models.find((m) => m.id === selectedModelId);
    return selected || filteredModels[0];
  }, [models, selectedModelId, filteredModels]);

  const openCreate = () => {
    if (!selectedModel) {
      toast.error("请先选择模型");
      return;
    }
    setEditingVersionId(null);
    setForm({
      ...emptyVersionForm,
      endpointUrl: selectedModel.backendUrl,
    });
    setShowForm(true);
  };

  const openEdit = (versionId: string) => {
    if (!selectedModel) return;
    const version = selectedModel.versions.find((v) => v.id === versionId);
    if (!version) return;
    setEditingVersionId(versionId);
    setForm({
      version: version.version,
      endpointUrl: version.endpointUrl,
      authType: version.authType,
      authValue: version.authValue || "",
      promptBindingsText: promptBindingsToText(version.promptBindings),
      vocabularyMappingsText: vocabMappingsToText(version.vocabularyMappings),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!selectedModel) return toast.error("请先选择模型");
    if (!form.version.trim()) return toast.error("请填写版本号");
    if (!/^https?:\/\//.test(form.endpointUrl)) return toast.error("链接必须以 http:// 或 https:// 开头");

    const promptBindings = parsePromptBindings(form.promptBindingsText);
    const vocabularyMappings = parseVocabularyMappings(form.vocabularyMappingsText);

    if (selectedModel.isOpenVocabulary && vocabularyMappings.length === 0) {
      return toast.error("开放词汇模型需至少配置一条词汇映射");
    }
    if (!selectedModel.isOpenVocabulary && promptBindings.length === 0) {
      return toast.error("非开放词汇模型需至少配置一条任务 Prompt 绑定");
    }

    const payload = {
      version: form.version.trim(),
      endpointUrl: form.endpointUrl.trim(),
      authType: form.authType,
      authValue: form.authValue.trim(),
      creator: "当前用户",
      promptBindings,
      vocabularyMappings,
    };

    if (editingVersionId) {
      updateVersion(selectedModel.id, editingVersionId, payload);
      toast.success("模型版本已更新");
    } else {
      addVersion(selectedModel.id, payload);
      toast.success("模型版本已新增");
    }
    setShowForm(false);
  };

  const handleDelete = (versionId: string) => {
    if (!selectedModel) return;
    if (selectedModel.versions.length <= 1) {
      toast.error("至少保留一个版本");
      return;
    }
    removeVersion(selectedModel.id, versionId);
    toast.success("版本已删除");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型版本管理</h1>
          <p className="page-description">维护版本链接、认证方式、Prompt/词汇映射等可运行配置</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 新增版本
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索模型"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card"
            />
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {filteredModels.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  (selectedModel?.id || selectedModelId) === m.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/30"
                }`}
              >
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.id} · {m.isOpenVocabulary ? "开放词汇" : "非开放词汇"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          {!selectedModel ? (
            <div className="text-center py-20 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              请先选择模型
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">{selectedModel.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedModel.isOpenVocabulary ? "开放词汇模型：维护词汇映射" : "非开放词汇模型：维护任务 Prompt 绑定"}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {selectedModel.versions.length} 个版本
                </span>
              </div>

              <div className="space-y-2">
                {selectedModel.versions.map((v) => (
                  <div key={v.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          {v.version}
                          {v.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              默认
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">{v.endpointUrl}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          认证：{v.authType} · 创建人：{v.creator} · 创建时间：{v.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!v.isDefault && (
                          <button
                            onClick={() => setDefaultVersion(selectedModel.id, v.id)}
                            className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(v.id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {selectedModel.isOpenVocabulary ? (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        词汇映射：{v.vocabularyMappings.length} 条
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Prompt 绑定：{v.promptBindings.length} 条
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingVersionId ? "编辑模型版本" : "新增模型版本"}</h3>
              <button onClick={() => setShowForm(false)} className="px-2 py-1 text-xs border rounded">关闭</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">版本号</label>
                  <input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">认证方式</label>
                  <select
                    value={form.authType}
                    onChange={(e) => setForm({ ...form, authType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="none">无认证</option>
                    <option value="basic">Basic</option>
                    <option value="token">Token</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">模型链接（Endpoint）</label>
                <input
                  value={form.endpointUrl}
                  onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                />
              </div>
              {form.authType !== "none" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">认证凭据</label>
                  <input
                    type="password"
                    value={form.authValue}
                    onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                  />
                </div>
              )}

              {selectedModel.isOpenVocabulary ? (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    词汇映射表（每行：source=&gt;target|notes）
                  </label>
                  <textarea
                    rows={8}
                    value={form.vocabularyMappingsText}
                    onChange={(e) => setForm({ ...form, vocabularyMappingsText: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                    placeholder={"car=>汽车|COCO标准类\nperson=>行人|通用映射"}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Prompt 绑定（每行：任务类型::Prompt）
                  </label>
                  <textarea
                    rows={8}
                    value={form.promptBindingsText}
                    onChange={(e) => setForm({ ...form, promptBindingsText: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                    placeholder={"文本分类::请从候选标签中选择一个最匹配标签并返回score\n信息抽取::提取字段并按json返回"}
                  />
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>
                  {selectedModel.isOpenVocabulary
                    ? "开放词汇模型请优先维护词汇映射，确保模型输出可落在业务标签体系。"
                    : "非开放词汇模型请绑定任务 Prompt，保证不同任务调用策略清晰可控。"}
                </p>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg">取消</button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg flex items-center gap-1"
              >
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationModelVersions;

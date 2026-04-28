import { useMemo, useState } from "react";
import { ArrowUpDown, Brain, Edit3, Plus, Trash2, Upload } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useMLModelStore,
  type MLModel,
  type TaskPromptBinding,
  type VocabularyMappingItem,
} from "@/stores/useMLModelStore";

interface VersionFormState {
  version: string;
  endpointUrl: string;
  authType: "none" | "apikey";
  authValue: string;
  prompts: TaskPromptBinding[];
  vocabularyMappings: VocabularyMappingItem[];
}

const emptyVersionForm: VersionFormState = {
  version: "v1.0.0",
  endpointUrl: "",
  authType: "none",
  authValue: "",
  prompts: [{ taskType: "", prompt: "" }],
  vocabularyMappings: [{ sourceLabel: "", commonMappedLabel: "" }],
};

const DataAnnotationModelVersionManage = () => {
  const { models, addVersion, updateVersion, removeVersion } = useMLModelStore();
  const [searchParams] = useSearchParams();
  const queryModelId = searchParams.get("modelId") || "";
  const [selectedModelId, setSelectedModelId] = useState<string>(queryModelId);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VersionFormState>(emptyVersionForm);

  const selectedModel: MLModel | undefined = useMemo(() => {
    return models.find((m) => m.id === (selectedModelId || queryModelId)) || models[0];
  }, [models, selectedModelId, queryModelId]);

  const openCreate = () => {
    if (!selectedModel) return;
    setEditingVersionId(null);
    setForm({
      ...emptyVersionForm,
      endpointUrl: selectedModel.backendUrl,
      prompts: [{ taskType: selectedModel.taskTypes[0] || "", prompt: "" }],
      vocabularyMappings: [{ sourceLabel: "", commonMappedLabel: "" }],
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
      prompts: version.prompts.length ? version.prompts : [{ taskType: "", prompt: "" }],
      vocabularyMappings: version.vocabularyMappings.length
        ? version.vocabularyMappings
        : [{ sourceLabel: "", commonMappedLabel: "" }],
    });
    setShowForm(true);
  };

  const importVocabularyFromLastVersion = () => {
    if (!selectedModel) return;
    const sorted = [...selectedModel.versions].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    const latest = sorted[0];
    if (!latest || latest.vocabularyMappings.length === 0) {
      toast.info("上一版本没有可引入的词汇表映射");
      return;
    }
    setForm((prev) => ({ ...prev, vocabularyMappings: latest.vocabularyMappings.map((x) => ({ ...x })) }));
    toast.success(`已从版本 ${latest.version} 引入 ${latest.vocabularyMappings.length} 条映射`);
  };

  const importVocabularyByText = () => {
    const text = window.prompt("按每行 source=>common 导入：");
    if (!text) return;
    const rows = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sourceLabel, commonMappedLabel] = line.split("=>").map((x) => x.trim());
        return { sourceLabel, commonMappedLabel };
      })
      .filter((x) => x.sourceLabel && x.commonMappedLabel);
    if (rows.length === 0) return toast.error("未解析到有效词汇映射");
    setForm((prev) => ({ ...prev, vocabularyMappings: rows }));
    toast.success(`导入成功：${rows.length} 条`);
  };

  const handleSubmit = () => {
    if (!selectedModel) return;
    if (!form.version.trim()) return toast.error("请填写版本号");
    if (!/^https?:\/\//.test(form.endpointUrl)) return toast.error("模型链接需以 http:// 或 https:// 开头");
    if (form.authType !== "none" && !form.authValue.trim()) return toast.error("请填写 API KEY");

    const prompts = form.prompts
      .map((x) => ({ taskType: x.taskType.trim(), prompt: x.prompt.trim() }))
      .filter((x) => x.taskType && x.prompt);
    const vocabularyMappings = form.vocabularyMappings
      .map((x) => ({
        sourceLabel: x.sourceLabel.trim(),
        commonMappedLabel: x.commonMappedLabel?.trim() || "",
      }))
      .filter((x) => x.sourceLabel && x.commonMappedLabel);

    if (selectedModel.labelScope === "开放词汇") {
      if (prompts.length === 0) return toast.error("开放词汇模型需至少维护一条 Prompt 绑定");
    } else if (vocabularyMappings.length === 0) {
      return toast.error("非开放词汇模型需至少维护一条词汇映射");
    }

    const payload = {
      version: form.version.trim(),
      endpointUrl: form.endpointUrl.trim(),
      authType: form.authType,
      authValue: form.authValue.trim() || undefined,
      prompts: selectedModel.labelScope === "开放词汇" ? prompts : [],
      vocabularyMappings: selectedModel.labelScope === "开放词汇" ? [] : vocabularyMappings,
    };

    if (editingVersionId) {
      updateVersion(selectedModel.id, editingVersionId, payload);
      toast.success("版本配置已更新");
    } else {
      addVersion(selectedModel.id, payload);
      toast.success("版本已新增");
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型版本管理</h1>
          <p className="page-description">上方展示模型基本信息，下方仅维护当前模型版本</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 新增模型版本
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">选择模型</p>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {models.map((m) => (
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
                  {m.id} · {m.labelScope} · {m.versions.length} 个版本
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card p-4 space-y-3">
          {!selectedModel ? (
            <div className="text-center py-16 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              暂无模型
            </div>
          ) : (
            <>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-semibold">{selectedModel.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  模态：{selectedModel.modality} · 标签范围：{selectedModel.labelScope} · 任务类型：{selectedModel.taskTypes.join("、")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedModel.description}</p>
              </div>

              <div className="space-y-2">
                {selectedModel.versions.map((v) => (
                  <div key={v.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{v.version}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{v.endpointUrl}</p>
                        <p className="text-[10px] text-muted-foreground">
                          认证：{v.authType === "none" ? "无认证" : "API KEY认证"} · {v.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(v.id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                          title="编辑版本"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (selectedModel.versions.length <= 1) {
                              toast.error("至少保留一个版本");
                              return;
                            }
                            removeVersion(selectedModel.id, v.id);
                            toast.success("版本已删除");
                          }}
                          className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 text-destructive"
                          title="删除版本"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {selectedModel.labelScope === "开放词汇"
                        ? `Prompt 数：${v.prompts.length}`
                        : `词汇映射数：${v.vocabularyMappings.length}`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingVersionId ? "编辑模型版本" : "新增模型版本"}</h3>
              <button onClick={() => setShowForm(false)} className="px-2 py-1 text-xs border rounded hover:bg-muted/50">
                关闭
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">版本号</label>
                  <input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">模型链接（Endpoint）</label>
                  <input
                    value={form.endpointUrl}
                    onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">认证方式</label>
                  <select
                    value={form.authType}
                    onChange={(e) => setForm({ ...form, authType: e.target.value as "none" | "apikey" })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  >
                    <option value="none">无认证</option>
                    <option value="apikey">API KEY认证</option>
                  </select>
                </div>
                {form.authType !== "none" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">API KEY</label>
                    <input
                      type="password"
                      value={form.authValue}
                      onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono"
                    />
                  </div>
                )}
              </div>

              {selectedModel.labelScope === "开放词汇" ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Prompt 绑定（任务类型）</p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          prompts: [...prev.prompts, { taskType: selectedModel.taskTypes[0] || "", prompt: "" }],
                        }))
                      }
                      className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      新增 Prompt
                    </button>
                  </div>
                  {form.prompts.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <select
                        value={item.taskType}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            prompts: prev.prompts.map((x, i) => (i === idx ? { ...x, taskType: e.target.value } : x)),
                          }))
                        }
                        className="col-span-3 px-2 py-2 text-sm border rounded bg-background"
                      >
                        <option value="">选择任务类型</option>
                        {selectedModel.taskTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={item.prompt}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            prompts: prev.prompts.map((x, i) => (i === idx ? { ...x, prompt: e.target.value } : x)),
                          }))
                        }
                        rows={2}
                        placeholder="输入 prompt 内容"
                        className="col-span-8 px-2 py-2 text-sm border rounded bg-background resize-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            prompts: prev.prompts.filter((_, i) => i !== idx),
                          }))
                        }
                        className="col-span-1 px-2 py-2 text-xs border rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">词汇表映射（表格）</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={importVocabularyByText}
                        className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                      >
                        <Upload className="w-3.5 h-3.5 inline mr-1" />
                        导入
                      </button>
                      <button
                        type="button"
                        onClick={importVocabularyFromLastVersion}
                        className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                        从上一版本引入
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            vocabularyMappings: [...prev.vocabularyMappings, { sourceLabel: "", commonMappedLabel: "" }],
                          }))
                        }
                        className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" />
                        新增行
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-2 text-xs text-muted-foreground">源标签</th>
                          <th className="py-2 pr-2 text-xs text-muted-foreground">常见映射标签</th>
                          <th className="py-2 text-xs text-muted-foreground">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.vocabularyMappings.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="py-1 pr-2">
                              <input
                                value={row.sourceLabel}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    vocabularyMappings: prev.vocabularyMappings.map((x, i) =>
                                      i === idx ? { ...x, sourceLabel: e.target.value } : x
                                    ),
                                  }))
                                }
                                className="w-full px-2 py-1 border rounded bg-background"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                value={row.commonMappedLabel || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    vocabularyMappings: prev.vocabularyMappings.map((x, i) =>
                                      i === idx ? { ...x, commonMappedLabel: e.target.value } : x
                                    ),
                                  }))
                                }
                                className="w-full px-2 py-1 border rounded bg-background"
                              />
                            </td>
                            <td className="py-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    vocabularyMappings: prev.vocabularyMappings.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 text-destructive"
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2 bg-muted/20">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                保存版本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationModelVersionManage;

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, ChevronDown, Edit3, Plus, Trash2, Upload } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useMLModelStore,
  normalizeTaskPromptBinding,
  type MLModel,
  type TaskPromptBinding,
  type VocabularyMappingItem,
} from "@/stores/useMLModelStore";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VersionFormState {
  version: string;
  endpointUrl: string;
  authType: "none" | "api_key";
  authUsername: string;
  authPassword: string;
  prompts: TaskPromptBinding[];
  vocabularyMappings: VocabularyMappingItem[];
}

const emptyVersionForm: VersionFormState = {
  version: "v1.0.0",
  endpointUrl: "",
  authType: "none",
  authUsername: "",
  authPassword: "",
  prompts: [{ taskTypes: [], prompt: "" }],
  vocabularyMappings: [{ sourceLabel: "", commonMappedLabel: "" }],
};

const DataAnnotationModelVersionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get("modelId") || "";
  const versionId = searchParams.get("versionId") || "";

  const { models, addVersion, updateVersion } = useMLModelStore();
  const selectedModel: MLModel | undefined = useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId]
  );

  const [form, setForm] = useState<VersionFormState>(emptyVersionForm);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptDialogIdx, setPromptDialogIdx] = useState(0);
  const [promptDraft, setPromptDraft] = useState("");
  const [bindingsTaskPopover, setBindingsTaskPopover] = useState<number | null>(null);

  useEffect(() => {
    if (!modelId) {
      toast.error("缺少 modelId");
      navigate("/data-annotation/models");
      return;
    }
    if (!selectedModel) return;

    if (!versionId) {
      setForm({
        ...emptyVersionForm,
        endpointUrl: selectedModel.backendUrl || "https://ml-backend.internal/placeholder",
        prompts: [
          {
            taskTypes: selectedModel.taskTypes[0] ? [selectedModel.taskTypes[0]] : [],
            prompt: "",
          },
        ],
        vocabularyMappings: [
          { sourceLabel: "positive", commonMappedLabel: "正面" },
          { sourceLabel: "negative", commonMappedLabel: "负面" },
          { sourceLabel: "PER", commonMappedLabel: "人名" },
        ],
      });
      return;
    }

    const version = selectedModel.versions.find((v) => v.id === versionId);
    if (!version) {
      toast.error("未找到该版本");
      navigate(`/data-annotation/models/versions?modelId=${encodeURIComponent(modelId)}`);
      return;
    }
    setForm({
      version: version.version,
      endpointUrl: version.endpointUrl,
      authType: version.authType,
      authUsername: version.authUsername || "",
      authPassword: version.authPassword || "",
      prompts: version.prompts.length
        ? version.prompts.map((p) => normalizeTaskPromptBinding(p as TaskPromptBinding & { taskType?: string }))
        : [{ taskTypes: [], prompt: "" }],
      vocabularyMappings: version.vocabularyMappings.length
        ? version.vocabularyMappings
        : [{ sourceLabel: "", commonMappedLabel: "" }],
    });
  }, [modelId, versionId, selectedModel, navigate]);

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

  const openPromptEditor = (idx: number) => {
    const row = form.prompts[idx];
    if (!row) return;
    setPromptDialogIdx(idx);
    setPromptDraft(row.prompt);
    setPromptDialogOpen(true);
  };

  const savePromptEditor = () => {
    setForm((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p, i) => (i === promptDialogIdx ? { ...p, prompt: promptDraft } : p)),
    }));
    setPromptDialogOpen(false);
  };

  const togglePromptBindingTaskType = (rowIdx: number, tt: string) => {
    setForm((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p, i) => {
        if (i !== rowIdx) return p;
        const n = normalizeTaskPromptBinding(p as TaskPromptBinding & { taskType?: string });
        const next = new Set(n.taskTypes);
        if (next.has(tt)) next.delete(tt);
        else next.add(tt);
        return { taskTypes: Array.from(next), prompt: p.prompt };
      }),
    }));
  };

  const handleSubmit = () => {
    if (!selectedModel) return;
    if (!form.version.trim()) return toast.error("请填写版本号");
    if (!/^https?:\/\//.test(form.endpointUrl)) return toast.error("模型链接需以 http:// 或 https:// 开头");
    if (form.authType === "api_key" && (!form.authUsername.trim() || !form.authPassword.trim())) {
      return toast.error("请填写 API KEY 用户名和密码");
    }

    const prompts = form.prompts
      .map((raw) => normalizeTaskPromptBinding(raw as TaskPromptBinding & { taskType?: string }))
      .map((x) => ({
        taskTypes: [...x.taskTypes].filter((t) => t.trim()),
        prompt: x.prompt.trim(),
      }))
      .filter((x) => x.taskTypes.length > 0 && x.prompt);
    const vocabularyMappings = form.vocabularyMappings
      .map((x) => ({
        sourceLabel: x.sourceLabel.trim(),
        commonMappedLabel: x.commonMappedLabel?.trim() || "",
      }))
      .filter((x) => x.sourceLabel && x.commonMappedLabel);

    if (selectedModel.labelScope === "开放标签集") {
      if (prompts.length === 0) return toast.error("开放标签集模型需至少维护一条 Prompt 绑定");
    } else if (vocabularyMappings.length === 0) {
      return toast.error("固定标签集模型需至少维护一条词汇映射");
    }

    const payload = {
      version: form.version.trim(),
      endpointUrl: form.endpointUrl.trim(),
      authType: form.authType,
      authUsername: form.authType === "api_key" ? form.authUsername.trim() : undefined,
      authPassword: form.authType === "api_key" ? form.authPassword.trim() : undefined,
      prompts: selectedModel.labelScope === "开放标签集" ? prompts : [],
      vocabularyMappings: selectedModel.labelScope === "开放标签集" ? [] : vocabularyMappings,
    };

    if (versionId) {
      updateVersion(selectedModel.id, versionId, payload);
      toast.success("版本配置已更新");
    } else {
      addVersion(selectedModel.id, { ...payload, source: "manual" });
      toast.success("版本已新增");
    }
    navigate(`/data-annotation/models/versions?modelId=${encodeURIComponent(selectedModel.id)}`);
  };

  const backToList = () => {
    if (!selectedModel) {
      navigate("/data-annotation/models");
      return;
    }
    navigate(`/data-annotation/models/versions?modelId=${encodeURIComponent(selectedModel.id)}`);
  };

  if (!selectedModel) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center text-muted-foreground text-sm">
        加载模型信息…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-[1440px] h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={backToList} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight">{versionId ? "编辑模型版本" : "新增模型版本"}</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>TrustData Hub</span>
                <span>/</span>
                <span>标注引擎</span>
                <span>/</span>
                <span>{selectedModel.name}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            保存版本
          </button>
        </div>
      </header>

      <main className="flex-1 container max-w-[960px] py-8 px-6">
        <div className="rounded-xl border bg-card">
          <div className="p-5 border-b flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{versionId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</div>
            <div>
              <h2 className="text-lg font-semibold">版本信息与推理配置</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                模态：{selectedModel.modality} · 标签范围：{selectedModel.labelScope}
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
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
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">认证方式</label>
                <select
                  value={form.authType}
                  onChange={(e) => setForm({ ...form, authType: e.target.value as "none" | "api_key" })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                  <option value="none">无认证</option>
                  <option value="api_key">API KEY认证</option>
                </select>
              </div>
              {form.authType === "api_key" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">用户名</label>
                    <input
                      value={form.authUsername}
                      onChange={(e) => setForm({ ...form, authUsername: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">密码</label>
                    <input
                      type="password"
                      value={form.authPassword}
                      onChange={(e) => setForm({ ...form, authPassword: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                    />
                  </div>
                </>
              )}
            </div>

            {selectedModel.labelScope === "开放标签集" ? (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Prompt 绑定（表格）</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        prompts: [
                          ...prev.prompts,
                          {
                            taskTypes: selectedModel.taskTypes[0] ? [selectedModel.taskTypes[0]] : [],
                            prompt: "",
                          },
                        ],
                      }))
                    }
                    className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    新增 Prompt
                  </button>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left bg-muted/30 border-b">
                        <th className="py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap w-[30%] min-w-[180px]">
                          绑定任务类型（可多选）
                        </th>
                        <th className="py-2 px-2 font-semibold text-muted-foreground">Prompt</th>
                        <th className="py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap w-16 text-center">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.prompts.map((raw, idx) => {
                        const item = normalizeTaskPromptBinding(raw as TaskPromptBinding & { taskType?: string });
                        const preview = item.prompt.trim()
                          ? item.prompt.trim().length > 96
                            ? `${item.prompt.trim().slice(0, 96)}…`
                            : item.prompt.trim()
                          : "（暂无内容）";
                        return (
                          <tr key={idx} className="border-b last:border-b-0 align-top hover:bg-muted/10">
                            <td className="py-2 px-2">
                              <Popover
                                open={bindingsTaskPopover === idx}
                                onOpenChange={(open) => setBindingsTaskPopover(open ? idx : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="w-full max-w-[220px] px-2 py-1.5 border rounded-lg bg-background text-left flex items-center justify-between gap-2"
                                  >
                                    <span className={cn("truncate text-[11px]", item.taskTypes.length === 0 && "text-muted-foreground")}>
                                      {item.taskTypes.length ? item.taskTypes.join("、") : "请选择任务类型"}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[260px] p-2 space-y-1 max-h-56 overflow-y-auto" align="start">
                                  {selectedModel.taskTypes.map((tt) => (
                                    <label
                                      key={tt}
                                      className={cn(
                                        "flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted/70 text-xs",
                                        item.taskTypes.includes(tt) && "bg-primary/10"
                                      )}
                                    >
                                      <Checkbox
                                        checked={item.taskTypes.includes(tt)}
                                        onCheckedChange={() => togglePromptBindingTaskType(idx, tt)}
                                      />
                                      <span>{tt}</span>
                                    </label>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="py-2 px-2">
                              <button
                                type="button"
                                className="w-full text-left rounded-md border px-2 py-1.5 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2 min-w-0"
                                onClick={() => openPromptEditor(idx)}
                              >
                                <span className={cn("line-clamp-2 break-all text-[11px]", !item.prompt.trim() && "text-muted-foreground")}>
                                  {preview}
                                </span>
                                <Edit3 className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                              </button>
                            </td>
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              <button
                                type="button"
                                title="删除行"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    prompts: prev.prompts.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="p-2 text-destructive border border-transparent hover:border-destructive/30 hover:bg-destructive/10 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">词汇表映射（表格）</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={importVocabularyByText} className="px-2 py-1 text-xs border rounded hover:bg-muted/50">
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      导入
                    </button>
                    <button type="button" onClick={importVocabularyFromLastVersion} className="px-2 py-1 text-xs border rounded hover:bg-muted/50">
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
            <button onClick={backToList} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50" type="button">
              取消
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90" type="button">
              保存版本
            </button>
          </div>
        </div>
      </main>

      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>编辑 Prompt</DialogTitle>
          </DialogHeader>
          <textarea
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            rows={14}
            className="w-full flex-1 min-h-[200px] px-3 py-2 text-sm border rounded-lg bg-background resize-y font-mono leading-relaxed"
            placeholder="在此输入完整 Prompt 内容…"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50"
              onClick={() => setPromptDialogOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={savePromptEditor}
            >
              确定
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataAnnotationModelVersionForm;

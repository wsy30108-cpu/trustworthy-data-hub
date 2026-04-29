import { useMemo } from "react";
import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useMLModelStore, type MLModel } from "@/stores/useMLModelStore";

const DataAnnotationModelVersionManage = () => {
  const navigate = useNavigate();
  const { models, removeVersion } = useMLModelStore();
  const [searchParams] = useSearchParams();
  const queryModelId = searchParams.get("modelId") || "";

  const selectedModel: MLModel | undefined = useMemo(() => {
    return models.find((m) => m.id === queryModelId) || models[0];
  }, [models, queryModelId]);

  const openCreate = () => {
    if (!selectedModel) return;
    navigate(`/data-annotation/models/version-form?modelId=${encodeURIComponent(selectedModel.id)}`);
  };

  const openEdit = (versionId: string) => {
    if (!selectedModel) return;
    navigate(
      `/data-annotation/models/version-form?modelId=${encodeURIComponent(selectedModel.id)}&versionId=${encodeURIComponent(versionId)}`
    );
  };

  const currentVersions = selectedModel?.versions ?? [];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans animate-fade-in">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-[1440px] h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/data-annotation/models")}
              className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight">模型版本管理</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>TrustData Hub</span>
                <span>/</span>
                <span>标注引擎</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> 新增版本
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-[1440px] py-8 px-6 space-y-6">
        <div>
          <p className="page-description text-sm text-muted-foreground">维护当前模型的版本连接、词汇与 Prompt 绑定</p>
        </div>

        {!selectedModel ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">暂无可维护模型</div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedModel.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    模态：{selectedModel.modality} · 标签范围：{selectedModel.labelScope} · 任务类型：
                    {selectedModel.taskTypes.join("、")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedModel.description}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>模型健康：{selectedModel.health}</p>
                  <p>版本总数：{currentVersions.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-semibold">版本列表</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-muted/30">
                      <th className="py-3 px-4 text-xs text-muted-foreground">版本</th>
                      <th className="py-3 px-4 text-xs text-muted-foreground">链接</th>
                      <th className="py-3 px-4 text-xs text-muted-foreground">认证方式</th>
                      <th className="py-3 px-4 text-xs text-muted-foreground">健康状态</th>
                      <th className="py-3 px-4 text-xs text-muted-foreground">创建时间</th>
                      <th className="py-3 px-4 text-xs text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVersions.map((v) => (
                      <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium">{v.version}</td>
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{v.endpointUrl}</td>
                        <td className="py-3 px-4">{v.authType === "none" ? "无认证" : "API KEY认证"}</td>
                        <td className="py-3 px-4">{v.health}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{v.createdAt}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(v.id)}
                              className="px-2 py-1 text-xs border rounded hover:bg-muted/50"
                              title="编辑版本"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (currentVersions.length <= 1) {
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DataAnnotationModelVersionManage;

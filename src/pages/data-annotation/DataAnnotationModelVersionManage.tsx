import { useMemo } from "react";
import { ArrowLeft, Edit3, Plus, Trash2, Wifi } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMLModelStore, type MLModel } from "@/stores/useMLModelStore";

const DataAnnotationModelVersionManage = () => {
  const navigate = useNavigate();
  const { models, removeVersion, testConnection } = useMLModelStore();
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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/data-annotation/models")}
          className="p-1.5 rounded-lg hover:bg-muted"
          title="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{selectedModel?.name ?? "模型"}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">模型版本管理</p>
          </div>
        </div>
      </div>

      {!selectedModel ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">暂无可维护模型</div>
      ) : (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">模态：</span>
                <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{selectedModel.modality}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">标签范围：</span>
                <span className="text-foreground">{selectedModel.labelScope}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">任务类型：</span>
                <span className="text-foreground">{selectedModel.taskTypes.join("、") || "—"}</span>
              </div>
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-muted-foreground">模型 ID：</span>
                <span className="text-xs font-mono text-muted-foreground">{selectedModel.id}</span>
              </div>
              {selectedModel.description && (
                <div className="w-full text-xs text-muted-foreground leading-relaxed border-t pt-3 mt-1">
                  {selectedModel.description}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> 新增版本
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">版本</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">链接</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">认证方式</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">健康状态</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">创建时间</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVersions.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-3 font-medium">{v.version}</td>
                      <td className="py-3 px-3 text-xs font-mono text-muted-foreground max-w-[220px] truncate" title={v.endpointUrl}>
                        {v.endpointUrl}
                      </td>
                      <td className="py-3 px-3">{v.authType === "none" ? "无认证" : "API KEY认证"}</td>
                      <td className="py-3 px-3">{v.health}</td>
                      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">{v.createdAt}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(v.id)}
                            className="px-2 py-1 text-xs border rounded hover:bg-muted/50 inline-flex items-center gap-1"
                            title="编辑版本"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const result = testConnection(selectedModel!.id);
                              if (result.ok) {
                                toast.success(`${result.message}（${result.latency} ms）`);
                              } else {
                                toast.error(result.message);
                              }
                            }}
                            className="px-2 py-1 text-xs border rounded hover:bg-muted/50 inline-flex items-center gap-1"
                            title="测试连接（使用该模型配置的推理入口）"
                          >
                            <Wifi className="w-3.5 h-3.5" />
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
                            className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 text-destructive inline-flex items-center gap-1"
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
              {currentVersions.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">暂无版本</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataAnnotationModelVersionManage;

import { useState } from "react";
import { Search, Plus, Eye, Play, CheckCircle, Clock, XCircle, Loader2, Sparkles } from "lucide-react";

const mockTasks = [
  { id: "FE-001", name: "金融文本领域标签抽取", dataset: "中文情感分析训练集", model: "GPT-4o", status: "已完成", fileCount: 12350, processedCount: 12350, fields: ["领域", "情感倾向", "关键实体"], creator: "张明", createdAt: "2026-02-20", duration: "2小时15分" },
  { id: "FE-002", name: "医疗影像特征打标", dataset: "医疗影像CT扫描数据集", model: "Claude-3.5", status: "运行中", fileCount: 50000, processedCount: 23400, fields: ["部位", "病变类型", "严重程度"], creator: "李芳", createdAt: "2026-03-01", duration: "-" },
  { id: "FE-003", name: "对话数据场景分类", dataset: "智能客服对话语料", model: "GPT-4o", status: "已完成", fileCount: 800000, processedCount: 799800, fields: ["场景", "意图", "情绪"], creator: "赵丽", createdAt: "2026-02-25", duration: "8小时32分" },
  { id: "FE-004", name: "工业图像质量评估", dataset: "工业缺陷检测图像集", model: "Gemini-Pro", status: "失败", fileCount: 35000, processedCount: 12000, fields: ["缺陷类型", "严重等级"], creator: "孙伟", createdAt: "2026-03-03", duration: "-", failReason: "模型服务不可用：Gemini-Pro API 请求超时" },
];

const statusConfig: Record<string, { icon: any; tagClass: string }> = {
  "已完成": { icon: CheckCircle, tagClass: "status-tag-success" },
  "运行中": { icon: Loader2, tagClass: "status-tag-info" },
  "失败": { icon: XCircle, tagClass: "status-tag-error" },
  "待运行": { icon: Clock, tagClass: "status-tag-warning" },
};

const DataProcessFeatureExtract = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">特征抽取</h1>
          <p className="page-description">使用大模型自动为数据文件抽取特征标签，提升数据可发现性</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建抽取任务
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "抽取任务总数", value: "28", icon: Sparkles },
          { label: "已处理文件", value: "1,847,550", icon: CheckCircle },
          { label: "抽取字段数", value: "86", icon: Play },
          { label: "运行中任务", value: "3", icon: Loader2 },
        ].map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <s.icon className="w-8 h-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索任务名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">抽取字段</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map(t => {
              const sc = statusConfig[t.status];
              const Icon = sc.icon;
              const progress = t.fileCount > 0 ? Math.round((t.processedCount / t.fileCount) * 100) : 0;
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.id}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{t.dataset}</td>
                  <td className="py-3 px-4"><span className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">{t.model}</span></td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${sc.tagClass} flex items-center gap-1 w-fit`}>
                      <Icon className={`w-3 h-3 ${t.status === "运行中" ? "animate-spin" : ""}`} />
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {t.fields.map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{t.creator}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataProcessFeatureExtract;

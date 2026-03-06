import { useState } from "react";
import { Search, Plus, Eye, Download, FileText, CheckCircle, XCircle, Loader2, Clock, GaugeCircle, BarChart3 } from "lucide-react";

const mockAssessments = [
  { id: "QA-001", name: "金融文本质量评估", dataset: "中文情感分析训练集", status: "已完成", score: 85, grade: "良好", indicators: 5, creator: "张明", createdAt: "2026-03-01", completedAt: "2026-03-01 15:30" },
  { id: "QA-002", name: "医疗影像数据质量", dataset: "医疗影像CT扫描数据集", status: "已完成", score: 92, grade: "优秀", indicators: 6, creator: "李芳", createdAt: "2026-02-28", completedAt: "2026-02-28 10:15" },
  { id: "QA-003", name: "翻译语料完整性检查", dataset: "多语种平行翻译语料", status: "运行中", score: null, grade: null, indicators: 4, creator: "王强", createdAt: "2026-03-05", completedAt: null },
  { id: "QA-004", name: "客服对话数据评估", dataset: "智能客服对话语料", status: "已完成", score: 55, grade: "不合格", indicators: 5, creator: "赵丽", createdAt: "2026-02-25", completedAt: "2026-02-25 16:00" },
  { id: "QA-005", name: "工业图像标注质量", dataset: "工业缺陷检测图像集", status: "已完成", score: 73, grade: "一般", indicators: 4, creator: "孙伟", createdAt: "2026-03-03", completedAt: "2026-03-03 12:45" },
];

const gradeColor = (g: string | null) => {
  if (g === "优秀") return "text-success";
  if (g === "良好") return "text-primary";
  if (g === "一般") return "text-warning";
  if (g === "不合格") return "text-destructive";
  return "text-muted-foreground";
};

const gradeTag = (g: string | null) => {
  if (g === "优秀") return "status-tag-success";
  if (g === "良好") return "status-tag-info";
  if (g === "一般") return "status-tag-warning";
  if (g === "不合格") return "status-tag-error";
  return "status-tag-default";
};

const dimensions = ["完整性", "准确性", "一致性", "时效性", "唯一性", "规范性", "可用性", "多样性"];

const DataProcessQuality = () => {
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState<"tasks" | "indicators">("tasks");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">质量评估</h1>
          <p className="page-description">定义评估指标，对数据集进行质量门控与评估</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建评估任务
        </button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "tasks", label: "评估任务" }, { key: "indicators", label: "指标库管理" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "tasks" ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索评估任务..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">综合得分</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">质量等级</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">指标数</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">完成时间</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockAssessments.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.id}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{a.dataset}</td>
                    <td className="py-3 px-4">
                      <span className={`status-tag ${a.status === "已完成" ? "status-tag-success" : "status-tag-info"} flex items-center gap-1 w-fit`}>
                        {a.status === "已完成" ? <CheckCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {a.score !== null ? (
                        <span className={`text-lg font-bold ${gradeColor(a.grade)}`}>{a.score}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {a.grade ? <span className={`status-tag ${gradeTag(a.grade)}`}>{a.grade}</span> : "-"}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{a.indicators}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{a.creator}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{a.completedAt || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 rounded hover:bg-muted/50" title="查看报告"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        {a.status === "已完成" && (
                          <>
                            <button className="p-1 rounded hover:bg-muted/50" title="导出PDF"><FileText className="w-4 h-4 text-muted-foreground" /></button>
                            <button className="p-1 rounded hover:bg-muted/50" title="导出Excel"><Download className="w-4 h-4 text-muted-foreground" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">八大质量评估维度下的指标定义与管理</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dimensions.map((dim, i) => (
              <div key={dim} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GaugeCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{dim}</h4>
                    <p className="text-xs text-muted-foreground">{[3, 4, 2, 2, 3, 2, 3, 2][i]} 个指标</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <span>评估方法: 规则/模型/统计</span>
                  <button className="text-primary hover:underline">管理</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataProcessQuality;

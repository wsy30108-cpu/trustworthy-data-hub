import { useState } from "react";
import { BarChart3, Clock, CheckCircle, Target, TrendingUp, Download } from "lucide-react";

const DataAnnotationPerformance = () => {
  const [tab, setTab] = useState<"annotation" | "qa">("annotation");
  const [timeRange, setTimeRange] = useState("近30天");

  const annotationStats = {
    taskCount: 8, totalAnnotated: 4560, validAnnotated: 4320, validHours: "125小时",
    efficiency: "36.5条/小时", firstPassRate: "94.8%", qaPassRate: "92.1%", acceptRate: "96.3%",
  };

  const qaStats = {
    taskCount: 5, totalQA: 2340, validQA: 2280, qaHours: "78小时",
    efficiency: "30条/小时", voteConsistency: "91.2%",
  };

  const taskDetails = [
    { name: "金融文本情感标注", type: "标注", annotated: 1200, valid: 1150, hours: "32h", efficiency: "37.5/h", passRate: "95.8%", period: "2026-02-20 ~ 03-05" },
    { name: "医疗图像分类标注", type: "标注", annotated: 800, valid: 760, hours: "28h", efficiency: "28.6/h", passRate: "95.0%", period: "2026-02-15 ~ 03-01" },
    { name: "客服对话意图标注", type: "标注", annotated: 2560, valid: 2410, hours: "65h", efficiency: "39.4/h", passRate: "94.1%", period: "2026-01-28 ~ 02-25" },
    { name: "金融文本情感标注", type: "质检", annotated: 600, valid: 580, hours: "18h", efficiency: "33.3/h", passRate: "96.7%", period: "2026-03-01 ~ 03-05" },
  ];

  const stats = tab === "annotation" ? annotationStats : qaStats;
  const filteredDetails = taskDetails.filter(d => tab === "annotation" ? d.type === "标注" : d.type === "质检");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">我的绩效</h1>
          <p className="page-description">查看个人标注和质检工作绩效</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
            <option>近7天</option>
            <option>近30天</option>
            <option>近90天</option>
            <option>自定义</option>
          </select>
          <button className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出报表
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "annotation", label: "标注任务" }, { key: "qa", label: "质检任务" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tab === "annotation" ? (
          <>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">参与任务数</p><p className="text-2xl font-bold text-foreground">{stats.taskCount}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">标注总量 / 有效标注量</p><p className="text-2xl font-bold text-foreground">{annotationStats.totalAnnotated} <span className="text-sm text-muted-foreground">/ {annotationStats.validAnnotated}</span></p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">标注效率</p><p className="text-2xl font-bold text-primary">{annotationStats.efficiency}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">质检合格率</p><p className="text-2xl font-bold text-success">{annotationStats.qaPassRate}</p></div>
          </>
        ) : (
          <>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">参与任务数</p><p className="text-2xl font-bold text-foreground">{qaStats.taskCount}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">质检总量 / 有效质检量</p><p className="text-2xl font-bold text-foreground">{qaStats.totalQA} <span className="text-sm text-muted-foreground">/ {qaStats.validQA}</span></p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">质检效率</p><p className="text-2xl font-bold text-primary">{qaStats.efficiency}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">投票一致率</p><p className="text-2xl font-bold text-success">{qaStats.voteConsistency}</p></div>
          </>
        )}
      </div>

      {tab === "annotation" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">有效标注时长</p><p className="text-lg font-bold text-foreground">{annotationStats.validHours}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">初检合格率</p><p className="text-lg font-bold text-foreground">{annotationStats.firstPassRate}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">总体质检合格率</p><p className="text-lg font-bold text-foreground">{annotationStats.qaPassRate}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">验收合格率</p><p className="text-lg font-bold text-foreground">{annotationStats.acceptRate}</p></div>
        </div>
      )}

      {/* 任务明细 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h4 className="text-sm font-medium">任务绩效明细</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">处理量</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">有效量</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">耗时</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">效率</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">合格率</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间范围</th>
            </tr>
          </thead>
          <tbody>
            {filteredDetails.map((d, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.annotated}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.valid}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.hours}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.efficiency}</td>
                <td className="py-3 px-4 text-right"><span className="text-success font-medium">{d.passRate}</span></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{d.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataAnnotationPerformance;

import { useState } from "react";
import { BarChart3, Clock, CheckCircle, Target, TrendingUp, Download } from "lucide-react";

const DataAnnotationPerformance = () => {
  const [tab, setTab] = useState<"annotation" | "qa" | "accept">("annotation");
  const [timeRange, setTimeRange] = useState("近30天");
  const [typeFilter, setTypeFilter] = useState("全部");

  const annotationStats = {
    taskCount: 8, totalAnnotated: 4560, validAnnotated: 4320, validHours: "125小时",
    efficiency: "36.5条/小时", firstPassRate: "94.8%", qaPassRate: "92.1%", acceptRate: "96.3%",
    preAnnotationModified: 120, invalidData: 240,
  };

  const qaStats = {
    taskCount: 5, totalQA: 2340, validQA: 2280, qaHours: "78小时",
    efficiency: "30条/小时", firstPassRate: "93.5%", qaPassRate: "91.2%", voteConsistency: "91.2%", invalidData: 60,
  };

  const acceptStats = {
    taskCount: 3, totalAccept: 1800, acceptPassed: 1720, acceptHours: "52小时",
    efficiency: "34.6条/小时", acceptRate: "95.6%", voteConsistency: "93.1%", invalidData: 30,
  };

  const annotationDetails = [
    { name: "金融文本情感标注", assigned: 1500, submitted: 1200, completed: 1150, progress: "76.7%", hours: "32h", efficiency: "37.5/h", passRate: "95.8%", invalid: 15 },
    { name: "医疗图像分类标注", assigned: 1000, submitted: 800, completed: 760, progress: "76.0%", hours: "28h", efficiency: "28.6/h", passRate: "95.0%", invalid: 20 },
    { name: "客服对话意图标注", assigned: 3000, submitted: 2560, completed: 2410, progress: "80.3%", hours: "65h", efficiency: "39.4/h", passRate: "94.1%", invalid: 45 },
  ];

  const qaDetails = [
    { name: "金融文本情感标注", assigned: 600, submitted: 580, completed: 560, progress: "93.3%", hours: "18h", efficiency: "33.3/h", passRate: "96.7%", invalid: 5 },
    { name: "客服对话意图标注", assigned: 1740, submitted: 1700, completed: 1720, progress: "98.9%", hours: "60h", efficiency: "28.3/h", passRate: "97.0%", invalid: 10 },
  ];

  const acceptDetails = [
    { name: "客服对话意图标注", assigned: 1800, submitted: 1720, completed: 1720, progress: "95.6%", hours: "52h", efficiency: "34.6/h", passRate: "95.6%", invalid: 30 },
  ];

  const currentDetails = tab === "annotation" ? annotationDetails : tab === "qa" ? qaDetails : acceptDetails;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">我的绩效</h1>
          <p className="page-description">查看个人标注、质检和验收工作绩效</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
            <option>全部</option>
            <option>文本类</option><option>图像类</option><option>音频类</option><option>视频类</option>
          </select>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
            <option>近7天</option><option>近30天</option><option>近90天</option><option>自定义</option>
          </select>
          <button className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"><Download className="w-4 h-4" /> 导出报表</button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "annotation", label: "标注任务" }, { key: "qa", label: "质检任务" }, { key: "accept", label: "验收任务" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "annotation" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "参与任务数", value: annotationStats.taskCount },
              { label: "标注总量/有效", value: `${annotationStats.totalAnnotated}/${annotationStats.validAnnotated}` },
              { label: "有效标注时长", value: annotationStats.validHours },
              { label: "标注效率", value: annotationStats.efficiency },
              { label: "初检合格率", value: annotationStats.firstPassRate },
            ].map((s, i) => (
              <div key={i} className="stat-card"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "总体质检合格率", value: annotationStats.qaPassRate },
              { label: "验收合格率", value: annotationStats.acceptRate },
              { label: "预标注修改量", value: annotationStats.preAnnotationModified },
              { label: "无效数据量", value: annotationStats.invalidData },
            ].map((s, i) => (
              <div key={i} className="stat-card"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><p className="text-lg font-bold text-foreground">{s.value}</p></div>
            ))}
          </div>
        </>
      )}

      {tab === "qa" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "参与任务数", value: qaStats.taskCount },
            { label: "质检总量/有效", value: `${qaStats.totalQA}/${qaStats.validQA}` },
            { label: "有效质检时长", value: qaStats.qaHours },
            { label: "质检效率", value: qaStats.efficiency },
            { label: "初检合格率", value: qaStats.firstPassRate },
            { label: "总体质检合格率", value: qaStats.qaPassRate },
            { label: "投票一致率", value: qaStats.voteConsistency },
            { label: "无效数据量", value: qaStats.invalidData },
          ].map((s, i) => (
            <div key={i} className="stat-card"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
          ))}
        </div>
      )}

      {tab === "accept" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "参与任务数", value: acceptStats.taskCount },
            { label: "验收总量", value: acceptStats.totalAccept },
            { label: "验收通过量", value: acceptStats.acceptPassed },
            { label: "有效验收时长", value: acceptStats.acceptHours },
            { label: "验收效率", value: acceptStats.efficiency },
            { label: "验收合格率", value: acceptStats.acceptRate },
            { label: "投票一致率", value: acceptStats.voteConsistency },
            { label: "无效数据量", value: acceptStats.invalidData },
          ].map((s, i) => (
            <div key={i} className="stat-card"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b"><h4 className="text-sm font-medium">任务绩效明细</h4></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">分配总量</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">已提交</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">完成量</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">进度</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">有效时长</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">效率</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">合格率</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">无效量</th>
            </tr>
          </thead>
          <tbody>
            {currentDetails.map((d, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.assigned}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.submitted}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.completed}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.progress}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.hours}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.efficiency}</td>
                <td className="py-3 px-4 text-right"><span className="text-emerald-600 font-medium">{d.passRate}</span></td>
                <td className="py-3 px-4 text-right text-muted-foreground">{d.invalid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataAnnotationPerformance;

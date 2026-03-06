import { useState } from "react";
import { Download, RefreshCw, TrendingUp, Users, ClipboardList, BarChart3, PieChart } from "lucide-react";

const DataAnnotationStatistics = () => {
  const [tab, setTab] = useState<"overview" | "task" | "person">("overview");
  const [timeRange, setTimeRange] = useState("近30天");

  const overviewStats = [
    { label: "任务领取率", value: "87.5%", trend: "+2.3%", icon: ClipboardList },
    { label: "标注完成率", value: "72.8%", trend: "+5.1%", icon: BarChart3 },
    { label: "质检合格率", value: "91.2%", trend: "-0.8%", icon: TrendingUp },
    { label: "验收合格率", value: "95.6%", trend: "+1.2%", icon: PieChart },
  ];

  const taskStats = [
    { name: "金融文本情感标注", type: "文本类", total: 12350, annotated: 9630, qaPass: 8900, accepted: 8200, claimRate: "92%", annotationRate: "78%", qaRate: "92.4%", acceptRate: "92.1%" },
    { name: "医疗图像分类标注", type: "图像类", total: 5000, annotated: 5000, qaPass: 4500, accepted: 4200, claimRate: "100%", annotationRate: "100%", qaRate: "90%", acceptRate: "93.3%" },
    { name: "客服对话意图标注", type: "文本类", total: 20000, annotated: 20000, qaPass: 19500, accepted: 19500, claimRate: "100%", annotationRate: "100%", qaRate: "97.5%", acceptRate: "100%" },
    { name: "语音转写质检", type: "音频类", total: 3000, annotated: 1050, qaPass: 0, accepted: 0, claimRate: "65%", annotationRate: "35%", qaRate: "-", acceptRate: "-" },
    { name: "视频内容审核标注", type: "视频类", total: 1500, annotated: 0, qaPass: 0, accepted: 0, claimRate: "12%", annotationRate: "0%", qaRate: "-", acceptRate: "-" },
  ];

  const personStats = [
    { name: "张明", tasks: 5, annotated: 4560, valid: 4320, hours: "125h", efficiency: "36.5/h", qaRate: "94.8%", acceptRate: "96.3%" },
    { name: "李芳", tasks: 4, annotated: 3800, valid: 3650, hours: "110h", efficiency: "34.5/h", qaRate: "96.1%", acceptRate: "97.2%" },
    { name: "王强", tasks: 6, annotated: 5200, valid: 4900, hours: "140h", efficiency: "37.1/h", qaRate: "94.2%", acceptRate: "95.8%" },
    { name: "赵丽", tasks: 3, annotated: 2100, valid: 2050, hours: "60h", efficiency: "35.0/h", qaRate: "97.6%", acceptRate: "98.1%" },
    { name: "孙伟", tasks: 4, annotated: 3100, valid: 2800, hours: "95h", efficiency: "32.6/h", qaRate: "90.3%", acceptRate: "93.5%" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">统计分析</h1>
          <p className="page-description">空间内标注任务核心指标大盘</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
            <option>近7天</option>
            <option>近30天</option>
            <option>近90天</option>
          </select>
          <button className="px-3 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> 手动更新
          </button>
          <button className="px-3 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">数据更新时间: 2026-03-06 00:00 (T+1 自动更新)</p>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "overview", label: "指标大盘" }, { key: "task", label: "任务维度" }, { key: "person", label: "人员维度" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className="w-5 h-5 text-primary" />
                  <span className={`text-xs font-medium ${s.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>{s.trend}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-5">
              <h4 className="text-sm font-medium mb-4">标注质量分布</h4>
              <div className="space-y-3">
                {[{ label: "优秀 (≥95%)", pct: 35, color: "bg-success" }, { label: "良好 (85-95%)", pct: 45, color: "bg-primary" }, { label: "一般 (70-85%)", pct: 15, color: "bg-warning" }, { label: "不合格 (<70%)", pct: 5, color: "bg-destructive" }].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28">{d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <h4 className="text-sm font-medium mb-4">各类型任务产出占比</h4>
              <div className="space-y-3">
                {[{ label: "文本类", pct: 65, color: "bg-primary" }, { label: "图像类", pct: 20, color: "bg-success" }, { label: "音频类", pct: 10, color: "bg-warning" }, { label: "视频类", pct: 5, color: "bg-purple-500" }].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">{d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "task" && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">总量</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">已标注</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">领取率</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注完成率</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">质检合格率</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收合格率</th>
              </tr>
            </thead>
            <tbody>
              {taskStats.map((t, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{t.name}</td>
                  <td className="py-3 px-4"><span className="status-tag status-tag-info">{t.type}</span></td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.total.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.annotated.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.claimRate}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.annotationRate}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.qaRate}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{t.acceptRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "person" && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">姓名</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">参与任务</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注总量</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">有效量</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">工时</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">效率</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">质检合格率</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收合格率</th>
              </tr>
            </thead>
            <tbody>
              {personStats.map((p, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.tasks}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.annotated.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.valid.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.hours}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.efficiency}</td>
                  <td className="py-3 px-4 text-right"><span className="text-success font-medium">{p.qaRate}</span></td>
                  <td className="py-3 px-4 text-right"><span className="text-success font-medium">{p.acceptRate}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationStatistics;

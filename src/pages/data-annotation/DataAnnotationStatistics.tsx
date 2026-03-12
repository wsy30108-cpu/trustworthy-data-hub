import { useState } from "react";
import { Download, RefreshCw, TrendingUp, Users, ClipboardList, BarChart3, PieChart, Search } from "lucide-react";

const DataAnnotationStatistics = () => {
  const [tab, setTab] = useState<"overview" | "task" | "person">("overview");
  const [timeRange, setTimeRange] = useState("近30天");
  const [searchText, setSearchText] = useState("");
  const [dimension, setDimension] = useState<"day" | "sample">("sample");

  const overviewStats = [
    { label: "任务领取率", value: "87.5%", trend: "+2.3%" },
    { label: "标注完成率", value: "72.8%", trend: "+5.1%" },
    { label: "质检合格率", value: "91.2%", trend: "-0.8%" },
    { label: "验收合格率", value: "95.6%", trend: "+1.2%" },
  ];

  const overviewExtra = [
    { label: "总标注批次", value: "125" },
    { label: "已领取批次", value: "109" },
    { label: "总数据量", value: "58,350" },
    { label: "已提交标注量", value: "42,480" },
    { label: "总抽检量", value: "12,500" },
    { label: "抽检通过量", value: "11,400" },
    { label: "总验收量", value: "8,200" },
    { label: "验收通过量", value: "7,840" },
  ];

  const taskStats = [
    { name: "金融文本情感标注", id: "AT-001", total: 12350, valid: 9630, persons: 8, preModified: 120, hours: "340h", efficiency: "28.3/h", qa: 3200, firstQA: "92.4%", totalQA: "94.8%", accepted: 2800, acceptRate: "92.1%", invalid: 45, voteRate: "89.5%" },
    { name: "医疗图像分类标注", id: "AT-002", total: 5000, valid: 5000, persons: 5, preModified: 80, hours: "210h", efficiency: "23.8/h", qa: 1500, firstQA: "90.0%", totalQA: "93.3%", accepted: 1200, acceptRate: "93.3%", invalid: 20, voteRate: "91.2%" },
    { name: "客服对话意图标注", id: "AT-003", total: 20000, valid: 20000, persons: 12, preModified: 250, hours: "520h", efficiency: "38.5/h", qa: 6000, firstQA: "97.5%", totalQA: "98.2%", accepted: 5800, acceptRate: "100%", invalid: 30, voteRate: "95.0%" },
    { name: "语音转写质检", id: "AT-004", total: 3000, valid: 1050, persons: 4, preModified: 30, hours: "45h", efficiency: "23.3/h", qa: 0, firstQA: "-", totalQA: "-", accepted: 0, acceptRate: "-", invalid: 10, voteRate: "-" },
  ];

  const personStats = [
    { name: "张明", total: 4560, valid: 4320, tasks: 5, preModified: 55, hours: "125h", efficiency: "36.5/h", qaTotal: 600, validQA: 580, firstQA: "94.8%", totalQA: "96.3%", accepted: 400, acceptPassed: 390, acceptRate: "97.5%", invalid: 15 },
    { name: "李芳", total: 3800, valid: 3650, tasks: 4, preModified: 40, hours: "110h", efficiency: "34.5/h", qaTotal: 800, validQA: 780, firstQA: "96.1%", totalQA: "97.2%", accepted: 600, acceptPassed: 585, acceptRate: "97.5%", invalid: 12 },
    { name: "王强", total: 5200, valid: 4900, tasks: 6, preModified: 75, hours: "140h", efficiency: "37.1/h", qaTotal: 1200, validQA: 1150, firstQA: "94.2%", totalQA: "95.8%", accepted: 800, acceptPassed: 770, acceptRate: "96.3%", invalid: 25 },
    { name: "赵丽", total: 2100, valid: 2050, tasks: 3, preModified: 20, hours: "60h", efficiency: "35.0/h", qaTotal: 500, validQA: 490, firstQA: "97.6%", totalQA: "98.1%", accepted: 300, acceptPassed: 295, acceptRate: "98.3%", invalid: 8 },
    { name: "孙伟", total: 3100, valid: 2800, tasks: 4, preModified: 60, hours: "95h", efficiency: "32.6/h", qaTotal: 400, validQA: 370, firstQA: "90.3%", totalQA: "93.5%", accepted: 200, acceptPassed: 185, acceptRate: "92.5%", invalid: 20 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">统计分析</h1>
          <p className="page-description">空间内标注任务核心指标大盘与多维度统计</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
            <option>近7天</option><option>近30天</option><option>近90天</option>
          </select>
          <button onClick={() => { /* manual update */ }} className="px-3 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><RefreshCw className="w-4 h-4" /> 手动更新</button>
          <button className="px-3 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-4 h-4" /> 导出</button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">数据更新时间: 2026-03-11 00:00 (T+1 自动更新)</p>

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
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <span className={`text-xs font-medium ${s.trend.startsWith("+") ? "text-emerald-600" : "text-destructive"}`}>{s.trend}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewExtra.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-5">
              <h4 className="text-sm font-medium mb-4">标注质量分布</h4>
              <div className="space-y-3">
                {[{ label: "优秀 (≥95%)", pct: 35, color: "bg-emerald-500" }, { label: "良好 (85-95%)", pct: 45, color: "bg-primary" }, { label: "一般 (70-85%)", pct: 15, color: "bg-amber-500" }, { label: "不合格 (<70%)", pct: 5, color: "bg-destructive" }].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28">{d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} /></div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <h4 className="text-sm font-medium mb-4">各类型任务产出占比</h4>
              <div className="space-y-3">
                {[{ label: "文本类", pct: 65, color: "bg-primary" }, { label: "图像类", pct: 20, color: "bg-emerald-500" }, { label: "音频类", pct: 10, color: "bg-amber-500" }, { label: "视频类", pct: 5, color: "bg-purple-500" }].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">{d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} /></div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "task" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索任务名称或ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-1">
              {(["sample","day"] as const).map(d => (
                <button key={d} onClick={() => setDimension(d)} className={`px-3 py-1.5 text-xs rounded-full border ${dimension === d ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}>
                  {d === "sample" ? "按样本" : "按日"}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ID</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注总量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">有效量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">参与人数</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">预标注修改</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">工时</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">效率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">初检合格率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">总体质检</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收通过</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收合格率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">无效量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">投票一致率</th>
                </tr>
              </thead>
              <tbody>
                {taskStats.filter(t => !searchText || t.name.includes(searchText) || t.id.includes(searchText)).map((t, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{t.name}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{t.id}</td>
                    <td className="py-3 px-4 text-right">{t.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{t.valid.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{t.persons}</td>
                    <td className="py-3 px-4 text-right">{t.preModified}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{t.hours}</td>
                    <td className="py-3 px-4 text-right">{t.efficiency}</td>
                    <td className="py-3 px-4 text-right">{t.firstQA}</td>
                    <td className="py-3 px-4 text-right">{t.totalQA}</td>
                    <td className="py-3 px-4 text-right">{t.accepted.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right"><span className={`font-medium ${t.acceptRate !== "-" && parseFloat(t.acceptRate) >= 95 ? "text-emerald-600" : "text-muted-foreground"}`}>{t.acceptRate}</span></td>
                    <td className="py-3 px-4 text-right">{t.invalid}</td>
                    <td className="py-3 px-4 text-right">{t.voteRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "person" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索姓名..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">标注总量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">有效量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">参与任务</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">预标注修改</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">工时</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">效率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">质检总量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">初检合格率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">总体质检</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收量</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">验收合格率</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">无效量</th>
                </tr>
              </thead>
              <tbody>
                {personStats.filter(p => !searchText || p.name.includes(searchText)).map((p, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-right">{p.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{p.valid.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{p.tasks}</td>
                    <td className="py-3 px-4 text-right">{p.preModified}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{p.hours}</td>
                    <td className="py-3 px-4 text-right">{p.efficiency}</td>
                    <td className="py-3 px-4 text-right">{p.qaTotal}</td>
                    <td className="py-3 px-4 text-right">{p.firstQA}</td>
                    <td className="py-3 px-4 text-right">{p.totalQA}</td>
                    <td className="py-3 px-4 text-right">{p.acceptPassed}</td>
                    <td className="py-3 px-4 text-right"><span className="text-emerald-600 font-medium">{p.acceptRate}</span></td>
                    <td className="py-3 px-4 text-right">{p.invalid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationStatistics;

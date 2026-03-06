import { useState, useMemo } from "react";
import { BarChart3, Users, Database, Building2, HardDrive, ListChecks, TrendingUp, TrendingDown, ArrowUpRight, Clock } from "lucide-react";

const statCards = [
  { title: "数据集总量", value: "12,847", change: "+12.3%", up: true, icon: Database },
  { title: "空间总数", value: "256", change: "+5.8%", up: true, icon: BarChart3 },
  { title: "注册用户", value: "3,421", change: "+8.2%", up: true, icon: Users },
  { title: "入驻机构", value: "87", change: "+3.1%", up: true, icon: Building2 },
  { title: "存储用量", value: "45.2 TB", change: "78%", up: false, icon: HardDrive },
  { title: "进行中任务", value: "342", change: "-2.4%", up: false, icon: ListChecks },
];

const trendData = ["数据集新增", "用户注册", "空间创建", "任务提交"];

type SpaceFilter = "all" | "org" | "team" | "personal";

const spaceDistribution = {
  all: [
    { type: "组织空间", count: 45, datasets: 5234, size: "18.5TB", color: "hsl(var(--chart-1))", percent: 17.6 },
    { type: "团队空间", count: 128, datasets: 4892, size: "15.2TB", color: "hsl(var(--chart-2))", percent: 50 },
    { type: "个人空间", count: 83, datasets: 2721, size: "11.5TB", color: "hsl(var(--chart-3))", percent: 32.4 },
  ],
  org: [
    { type: "AI大模型研究院", count: 18, datasets: 2100, size: "7.2TB", color: "hsl(var(--chart-1))", percent: 40 },
    { type: "NLP研究所", count: 12, datasets: 1534, size: "5.1TB", color: "hsl(var(--chart-2))", percent: 26.7 },
    { type: "计算机视觉中心", count: 9, datasets: 980, size: "4.0TB", color: "hsl(var(--chart-3))", percent: 20 },
    { type: "其他机构", count: 6, datasets: 620, size: "2.2TB", color: "hsl(var(--chart-4))", percent: 13.3 },
  ],
  team: [
    { type: "大模型训练组", count: 32, datasets: 1560, size: "4.8TB", color: "hsl(var(--chart-1))", percent: 25 },
    { type: "数据标注中心", count: 28, datasets: 1230, size: "3.5TB", color: "hsl(var(--chart-2))", percent: 21.9 },
    { type: "语音算法组", count: 24, datasets: 890, size: "2.9TB", color: "hsl(var(--chart-3))", percent: 18.8 },
    { type: "其他团队", count: 44, datasets: 1212, size: "4.0TB", color: "hsl(var(--chart-4))", percent: 34.3 },
  ],
  personal: [
    { type: "活跃用户", count: 52, datasets: 1680, size: "6.2TB", color: "hsl(var(--chart-1))", percent: 62.7 },
    { type: "低活跃用户", count: 31, datasets: 1041, size: "5.3TB", color: "hsl(var(--chart-3))", percent: 37.3 },
  ],
};

const rankingsAll = [
  { rank: 1, name: "AI大模型研发组", datasets: 1245, tasks: 89, storage: "5.2TB" },
  { rank: 2, name: "NLP基础研究团队", datasets: 987, tasks: 67, storage: "3.8TB" },
  { rank: 3, name: "计算机视觉实验室", datasets: 856, tasks: 45, storage: "8.1TB" },
  { rank: 4, name: "语音识别团队", datasets: 654, tasks: 34, storage: "2.3TB" },
  { rank: 5, name: "数据标注中心", datasets: 543, tasks: 123, storage: "1.5TB" },
];

const rankingsFiltered: Record<string, typeof rankingsAll> = {
  org: [
    { rank: 1, name: "AI大模型研究院", datasets: 2100, tasks: 156, storage: "7.2TB" },
    { rank: 2, name: "NLP研究所", datasets: 1534, tasks: 98, storage: "5.1TB" },
    { rank: 3, name: "计算机视觉中心", datasets: 980, tasks: 67, storage: "4.0TB" },
  ],
  team: [
    { rank: 1, name: "大模型训练组", datasets: 1560, tasks: 112, storage: "4.8TB" },
    { rank: 2, name: "数据标注中心", datasets: 1230, tasks: 89, storage: "3.5TB" },
    { rank: 3, name: "语音算法组", datasets: 890, tasks: 56, storage: "2.9TB" },
  ],
  personal: [
    { rank: 1, name: "张明", datasets: 234, tasks: 45, storage: "1.2TB" },
    { rank: 2, name: "李华", datasets: 189, tasks: 34, storage: "0.8TB" },
    { rank: 3, name: "王芳", datasets: 156, tasks: 28, storage: "0.6TB" },
  ],
};

const timeLabels: Record<string, string> = {
  "7": "近7天",
  "30": "近30天",
  "year": "本年",
};

const spaceLabels: Record<SpaceFilter, string> = {
  all: "全部空间",
  org: "组织空间",
  team: "团队空间",
  personal: "个人空间",
};

// Simple SVG pie chart
function PieChart({ data }: { data: { type: string; percent: number; color: string }[] }) {
  let cumulativePercent = 0;
  const slices = data.map((d) => {
    const startAngle = cumulativePercent * 3.6;
    cumulativePercent += d.percent;
    const endAngle = cumulativePercent * 3.6;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    return (
      <path
        key={d.type}
        d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={d.color}
        stroke="hsl(var(--card))"
        strokeWidth="1"
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100" className="w-36 h-36 mx-auto">
      {slices}
    </svg>
  );
}

const ConsoleDashboard = () => {
  const [timeRange, setTimeRange] = useState("7");
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>("all");
  const [activeTrend, setActiveTrend] = useState(0);

  const currentDistribution = spaceDistribution[spaceFilter] || spaceDistribution.all;
  const currentRankings = spaceFilter === "all" ? rankingsAll : (rankingsFiltered[spaceFilter] || rankingsAll);

  const distributionTitle = spaceFilter === "all" ? "空间分布" : `${spaceLabels[spaceFilter]}分布`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 更新时间提示 */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>数据更新时间：2026-03-06 14:30:00</span>
        <span className="text-border mx-1">|</span>
        <span>自动刷新间隔：5分钟</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">控制台概览</h1>
          <p className="page-description">平台运行状态和核心指标一览</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md bg-card"
          >
            <option value="7">近7天</option>
            <option value="30">近30天</option>
            <option value="year">本年</option>
          </select>
          <select
            value={spaceFilter}
            onChange={(e) => setSpaceFilter(e.target.value as SpaceFilter)}
            className="px-3 py-1.5 text-sm border rounded-md bg-card"
          >
            <option value="all">全部空间</option>
            <option value="org">组织空间</option>
            <option value="team">团队空间</option>
            <option value="personal">个人空间</option>
          </select>
        </div>
      </div>

      {/* 核心指标卡片 - 全局数据，不受筛选影响 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{card.title}</span>
              <card.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
            <div className={`flex items-center gap-1 text-xs ${card.up ? "text-green-600" : "text-orange-600"}`}>
              {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {card.change} 同比
            </div>
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {Array.from({ length: 7 }, (_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-t bg-primary/20"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 分隔提示 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>以下数据受时间和空间筛选影响（当前：{timeLabels[timeRange]} · {spaceLabels[spaceFilter]}）</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 趋势图 */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">数据趋势</h3>
            <div className="flex gap-1">
              {trendData.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTrend(i)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    i === activeTrend ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end gap-1 px-4">
            {Array.from({ length: 30 }, (_, i) => {
              const h = 30 + Math.sin(i * 0.5 + activeTrend) * 20 + Math.random() * 30;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 px-4">
            <span className="text-[10px] text-muted-foreground">3月1日</span>
            <span className="text-[10px] text-muted-foreground">3月15日</span>
            <span className="text-[10px] text-muted-foreground">3月30日</span>
          </div>
        </div>

        {/* 空间分布 - 筛选时显示饼图 */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">{distributionTitle}</h3>

          {spaceFilter !== "all" ? (
            /* 筛选时展示饼图 */
            <div className="space-y-4">
              <PieChart data={currentDistribution} />
              <div className="space-y-2 mt-4">
                {currentDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.count}个</span>
                      <span>{item.percent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 默认展示条形分布 */
            <div className="space-y-4">
              {currentDistribution.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.type}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count}个</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>数据集: {item.datasets}</span>
                    <span>{item.size}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 排行榜 */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">
            {spaceFilter === "all" ? "活跃空间排行" : `${spaceLabels[spaceFilter]}活跃排行`}
          </h3>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            查看全部 <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">排名</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                  {spaceFilter === "personal" ? "用户名" : "空间名称"}
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">数据集数</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">任务数</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">存储用量</th>
              </tr>
            </thead>
            <tbody>
              {currentRankings.map(row => (
                <tr key={row.rank} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 px-3">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center ${
                      row.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{row.name}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{row.datasets.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{row.tasks}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{row.storage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsoleDashboard;

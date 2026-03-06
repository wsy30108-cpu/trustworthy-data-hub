import { BarChart3, Users, Database, Building2, HardDrive, ListChecks, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

const statCards = [
  { title: "数据集总量", value: "12,847", change: "+12.3%", up: true, icon: Database },
  { title: "空间总数", value: "256", change: "+5.8%", up: true, icon: BarChart3 },
  { title: "注册用户", value: "3,421", change: "+8.2%", up: true, icon: Users },
  { title: "入驻机构", value: "87", change: "+3.1%", up: true, icon: Building2 },
  { title: "存储用量", value: "45.2 TB", change: "78%", up: false, icon: HardDrive },
  { title: "进行中任务", value: "342", change: "-2.4%", up: false, icon: ListChecks },
];

const trendData = ["数据集新增", "用户注册", "空间创建", "任务提交"];

const rankings = {
  spaces: [
    { rank: 1, name: "AI大模型研发组", datasets: 1245, tasks: 89, storage: "5.2TB" },
    { rank: 2, name: "NLP基础研究团队", datasets: 987, tasks: 67, storage: "3.8TB" },
    { rank: 3, name: "计算机视觉实验室", datasets: 856, tasks: 45, storage: "8.1TB" },
    { rank: 4, name: "语音识别团队", datasets: 654, tasks: 34, storage: "2.3TB" },
    { rank: 5, name: "数据标注中心", datasets: 543, tasks: 123, storage: "1.5TB" },
  ],
};

const ConsoleDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">控制台概览</h1>
          <p className="page-description">平台运行状态和核心指标一览</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 text-sm border rounded-md bg-card">
            <option>近7天</option>
            <option>近30天</option>
            <option>本年</option>
          </select>
          <select className="px-3 py-1.5 text-sm border rounded-md bg-card">
            <option>全部空间</option>
            <option>组织空间</option>
            <option>团队空间</option>
            <option>个人空间</option>
          </select>
        </div>
      </div>

      {/* 核心指标卡片 */}
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
            {/* 微型图表 */}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 趋势图 */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">数据趋势</h3>
            <div className="flex gap-1">
              {trendData.map((t, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {/* 模拟折线图 */}
          <div className="h-64 flex items-end gap-1 px-4">
            {Array.from({ length: 30 }, (_, i) => {
              const h = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 30;
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

        {/* 空间分布 */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">空间分布</h3>
          <div className="space-y-4">
            {[
              { type: "组织空间", count: 45, datasets: 5234, size: "18.5TB", color: "bg-orange-500" },
              { type: "团队空间", count: 128, datasets: 4892, size: "15.2TB", color: "bg-green-500" },
              { type: "个人空间", count: 83, datasets: 2721, size: "11.5TB", color: "bg-blue-500" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.type}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}个</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>数据集: {item.datasets}</span>
                  <span>{item.size}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / 256) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 排行榜 */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">活跃空间排行</h3>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            查看全部 <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">排名</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">空间名称</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">数据集数</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">任务数</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">存储用量</th>
              </tr>
            </thead>
            <tbody>
              {rankings.spaces.map(row => (
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

import { useState } from "react";
import { Search, ClipboardList, Users, Clock, ChevronRight, Eye, FileText } from "lucide-react";

const mockBatches = [
  { id: "BT-001", taskName: "金融文本情感标注", taskId: "AT-001", type: "文本类", batchSize: 200, remaining: 85, deadline: "2026-03-15", spec: "金融情感三分类标注规范", difficulty: "中", reward: "0.5元/条" },
  { id: "BT-002", taskName: "医疗图像分类标注", taskId: "AT-002", type: "图像类", batchSize: 100, remaining: 30, deadline: "2026-03-20", spec: "医疗影像分类标注指南", difficulty: "高", reward: "2元/张" },
  { id: "BT-003", taskName: "客服对话意图标注", taskId: "AT-003", type: "文本类", batchSize: 500, remaining: 200, deadline: "2026-03-12", spec: "意图分类标注手册", difficulty: "低", reward: "0.3元/条" },
  { id: "BT-004", taskName: "语音转写质检", taskId: "AT-004", type: "音频类", batchSize: 50, remaining: 50, deadline: "2026-03-25", spec: "语音转写标注规范", difficulty: "高", reward: "3元/条" },
  { id: "BT-005", taskName: "视频内容审核标注", taskId: "AT-005", type: "视频类", batchSize: 30, remaining: 28, deadline: "2026-03-30", spec: "视频审核标注指引", difficulty: "中", reward: "5元/条" },
  { id: "BT-006", taskName: "金融文本情感标注", taskId: "AT-001", type: "文本类", batchSize: 200, remaining: 120, deadline: "2026-03-15", spec: "金融情感三分类标注规范", difficulty: "中", reward: "0.5元/条" },
];

const typeColors: Record<string, string> = {
  "文本类": "status-tag-info", "图像类": "status-tag-success", "音频类": "status-tag-warning", "视频类": "bg-purple-50 text-purple-700",
};

const DataAnnotationTaskHall = () => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");

  const filtered = mockBatches.filter(b => {
    if (typeFilter !== "全部" && b.type !== typeFilter) return false;
    if (searchText && !b.taskName.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">任务大厅</h1>
          <p className="page-description">浏览可认领的标注批次，选择任务开始标注</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "可领取批次", value: "48", icon: ClipboardList },
          { label: "涉及任务", value: "12", icon: FileText },
          { label: "待标注数据", value: "15,230", icon: Users },
          { label: "平均截止时间", value: "12天", icon: Clock },
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
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>文本类</option>
          <option>图像类</option>
          <option>音频类</option>
          <option>视频类</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(b => (
          <div key={b.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-foreground mb-1">{b.taskName}</h4>
                <p className="text-xs text-muted-foreground">{b.id} · 任务 {b.taskId}</p>
              </div>
              <span className={`status-tag ${typeColors[b.type]}`}>{b.type}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><span className="text-muted-foreground">批次大小：</span><span className="text-foreground">{b.batchSize} 条</span></div>
              <div><span className="text-muted-foreground">剩余可领：</span><span className="text-foreground font-medium">{b.remaining} 条</span></div>
              <div><span className="text-muted-foreground">难度：</span><span className={`font-medium ${b.difficulty === "高" ? "text-destructive" : b.difficulty === "中" ? "text-warning" : "text-success"}`}>{b.difficulty}</span></div>
              <div><span className="text-muted-foreground">单价：</span><span className="text-foreground">{b.reward}</span></div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Clock className="w-3 h-3" />
              <span>截止 {b.deadline}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                <Eye className="w-3 h-3" /> 查看规范
              </button>
              <button className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">认领批次</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataAnnotationTaskHall;

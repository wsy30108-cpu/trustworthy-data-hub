import { useState } from "react";
import { Plus, Search, Eye, MoreHorizontal, ClipboardList, Users, BarChart3, CheckCircle } from "lucide-react";

const mockTasks = [
  { id: "AT-001", name: "金融文本情感标注", type: "文本类", annotationProgress: 78, qaProgress: 65, acceptProgress: 45, creator: "张明", createdAt: "2026-02-20", status: "进行中" },
  { id: "AT-002", name: "医疗图像分类标注", type: "图像类", annotationProgress: 100, qaProgress: 90, acceptProgress: 80, creator: "李芳", createdAt: "2026-02-15", status: "进行中" },
  { id: "AT-003", name: "客服对话意图标注", type: "文本类", annotationProgress: 100, qaProgress: 100, acceptProgress: 100, creator: "王强", createdAt: "2026-01-28", status: "已完成" },
  { id: "AT-004", name: "语音转写质检", type: "音频类", annotationProgress: 35, qaProgress: 0, acceptProgress: 0, creator: "赵丽", createdAt: "2026-03-01", status: "进行中" },
  { id: "AT-005", name: "视频内容审核标注", type: "视频类", annotationProgress: 0, qaProgress: 0, acceptProgress: 0, creator: "孙伟", createdAt: "2026-03-05", status: "已发布" },
];

const typeColors: Record<string, string> = {
  "文本类": "status-tag-info",
  "图像类": "status-tag-success",
  "音频类": "status-tag-warning",
  "视频类": "bg-purple-50 text-purple-700",
};

const DataAnnotationTasks = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">标注任务</h1>
          <p className="page-description">创建和管理数据标注任务</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建任务
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "进行中任务", value: "12", icon: ClipboardList, color: "text-blue-600" },
          { title: "标注人员", value: "48", icon: Users, color: "text-green-600" },
          { title: "标注总量", value: "125,430", icon: BarChart3, color: "text-orange-600" },
          { title: "已完成任务", value: "34", icon: CheckCircle, color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={`${s.color}`}>
              <s.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.title}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索任务名称或ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部类型</option>
          <option>文本类</option>
          <option>图像类</option>
          <option>音频类</option>
          <option>视频类</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部状态</option>
          <option>已发布</option>
          <option>进行中</option>
          <option>已完成</option>
        </select>
      </div>

      {/* 任务表格 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标注进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">质检进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">验收进度</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map(task => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                <td className="py-3 px-4">
                  <div className="font-medium text-foreground">{task.name}</div>
                  <div className="text-xs text-muted-foreground">{task.id}</div>
                </td>
                <td className="py-3 px-4"><span className={`status-tag ${typeColors[task.type]}`}>{task.type}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${task.annotationProgress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{task.annotationProgress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${task.qaProgress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{task.qaProgress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${task.acceptProgress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{task.acceptProgress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`status-tag ${task.status === "已完成" ? "status-tag-success" :
                      task.status === "进行中" ? "status-tag-info" : "status-tag-warning"
                    }`}>{task.status}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{task.creator}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{task.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1 rounded hover:bg-muted/50"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                    <button className="p-1 rounded hover:bg-muted/50"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {mockTasks.length} 条数据</span>
          <div className="flex items-center gap-2">
            <select className="px-2 py-1 text-xs border rounded bg-card">
              <option>10条/页</option>
            </select>
            <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnnotationTasks;

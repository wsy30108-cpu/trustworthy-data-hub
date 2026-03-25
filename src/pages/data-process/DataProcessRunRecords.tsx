import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, RotateCcw, StopCircle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

const mockRecords = [
  { id: "RUN-20260305-001", workflow: "中文文本清洗标准流程", status: "成功", duration: "12分32秒", inputCount: 50000, outputCount: 48230, creator: "张明", startTime: "2026-03-05 14:30:00", endTime: "2026-03-05 14:42:32" },
  { id: "RUN-20260305-002", workflow: "图像质量筛选管线", status: "运行中", duration: "5分12秒", inputCount: 10000, outputCount: 3200, creator: "李芳", startTime: "2026-03-05 15:00:00", endTime: "-" },
  { id: "RUN-20260304-001", workflow: "多语种翻译数据预处理", status: "失败", duration: "8分45秒", inputCount: 200000, outputCount: 0, creator: "王强", startTime: "2026-03-04 09:15:00", endTime: "2026-03-04 09:23:45", failReason: "节点「编码转换」内存溢出：输入数据超出单节点处理上限(10GB)" },
  { id: "RUN-20260304-002", workflow: "对话数据脱敏流水线", status: "成功", duration: "3分18秒", inputCount: 80000, outputCount: 79800, creator: "赵丽", startTime: "2026-03-04 11:00:00", endTime: "2026-03-04 11:03:18" },
  { id: "RUN-20260303-001", workflow: "中文文本清洗标准流程", status: "成功", duration: "15分07秒", inputCount: 65000, outputCount: 62100, creator: "张明", startTime: "2026-03-03 16:20:00", endTime: "2026-03-03 16:35:07" },
  { id: "RUN-20260303-002", workflow: "图像质量筛选管线", status: "等待中", duration: "-", inputCount: 25000, outputCount: 0, creator: "孙伟", startTime: "2026-03-05 15:10:00", endTime: "-" },
];

const statusConfig: Record<string, { icon: any; color: string; tagClass: string }> = {
  "成功": { icon: CheckCircle, color: "text-success", tagClass: "status-tag-success" },
  "运行中": { icon: Loader2, color: "text-primary", tagClass: "status-tag-info" },
  "失败": { icon: XCircle, color: "text-destructive", tagClass: "status-tag-error" },
  "等待中": { icon: Clock, color: "text-warning", tagClass: "status-tag-warning" },
};

const DataProcessRunRecords = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = mockRecords.filter(r => {
    if (statusFilter !== "全部" && r.status !== statusFilter) return false;
    if (searchText && !r.workflow.includes(searchText) && !r.id.includes(searchText)) return false;
    return true;
  });

  const handlePreview = (record: typeof mockRecords[0]) => {
    navigate(`/data-process/workflow-canvas?mode=view&instanceId=${encodeURIComponent(record.id)}&name=${encodeURIComponent(record.workflow)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">运行记录</h1>
          <p className="page-description">查看和管理工作流运行实例</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "总运行次数", value: "156", color: "text-primary" },
          { label: "成功", value: "132", color: "text-success" },
          { label: "失败", value: "18", color: "text-destructive" },
          { label: "运行中", value: "6", color: "text-warning" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索工作流名称或实例ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>成功</option>
          <option>运行中</option>
          <option>失败</option>
          <option>等待中</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">实例ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">来源工作流</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">耗时</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">输入/输出</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">开始时间</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const sc = statusConfig[r.status];
              const Icon = sc.icon;
              return (
                <>
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>
                    <td className="py-3 px-4 font-mono text-xs">{r.id}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{r.workflow}</td>
                    <td className="py-3 px-4">
                      <span className={`status-tag ${sc.tagClass} flex items-center gap-1 w-fit`}>
                        <Icon className={`w-3 h-3 ${r.status === "运行中" ? "animate-spin" : ""}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{r.duration}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs">{r.inputCount.toLocaleString()} / {r.outputCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.creator}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{r.startTime}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 rounded hover:bg-primary/10 text-primary" title="查看执行详情" onClick={(e) => { e.stopPropagation(); handlePreview(r); }}><Eye className="w-4 h-4" /></button>
                        {r.status === "运行中" && <button className="p-1 rounded hover:bg-muted/50" title="停止"><StopCircle className="w-4 h-4 text-destructive" /></button>}
                        {r.status === "失败" && <button className="p-1 rounded hover:bg-muted/50" title="重试"><RotateCcw className="w-4 h-4 text-muted-foreground" /></button>}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === r.id && r.status === "失败" && (
                    <tr key={`${r.id}-detail`} className="bg-destructive/5">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive mb-1">失败原因</p>
                            <p className="text-xs text-muted-foreground">{(r as any).failReason}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录</span>
          <div className="flex gap-1">
            <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataProcessRunRecords;

import { useState } from "react";
import { Search, Eye, RotateCcw, XCircle, CheckCircle, Clock, Undo2 } from "lucide-react";

const mockApplications = [
  { id: "APP-001", dataset: "中文通用NER标注数据集", permission: "查看+下载", reason: "NLP实体识别模型训练", status: "已通过", applyTime: "2026-02-20 10:00", reviewer: "张明", reviewTime: "2026-02-20 14:30", opinion: "已核实，通过" },
  { id: "APP-002", dataset: "ImageNet-21K精选子集", permission: "下载", reason: "图像分类模型预训练", status: "待审批", applyTime: "2026-03-05 09:15", reviewer: null, reviewTime: null, opinion: null },
  { id: "APP-003", dataset: "金融行业研报摘要数据", permission: "查看", reason: "金融NLP数据调研", status: "已拒绝", applyTime: "2026-03-01 11:00", reviewer: "李芳", reviewTime: "2026-03-01 16:00", opinion: "申请理由不充分，请补充具体的模型训练计划和数据使用范围说明" },
  { id: "APP-004", dataset: "中英文平行语料v3", permission: "查看+下载", reason: "机器翻译模型训练", status: "已通过", applyTime: "2026-02-15 15:30", reviewer: "张明", reviewTime: "2026-02-15 17:00", opinion: "数据用途合理" },
  { id: "APP-005", dataset: "中文语音转写ASR数据集", permission: "下载", reason: "语音识别模型微调", status: "已撤回", applyTime: "2026-02-28 09:00", reviewer: null, reviewTime: null, opinion: null },
];

const statusConfig: Record<string, { icon: any; tagClass: string }> = {
  "待审批": { icon: Clock, tagClass: "status-tag-warning" },
  "已通过": { icon: CheckCircle, tagClass: "status-tag-success" },
  "已拒绝": { icon: XCircle, tagClass: "status-tag-error" },
  "已撤回": { icon: Undo2, tagClass: "status-tag-default" },
};

const DataServiceMyApplications = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");

  const filtered = mockApplications.filter(a => {
    if (statusFilter !== "全部" && a.status !== statusFilter) return false;
    if (searchText && !a.dataset.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">我的申请</h1>
          <p className="page-description">查看和管理我提交的数据集订购申请</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "全部申请", value: mockApplications.length.toString(), color: "text-foreground" },
          { label: "待审批", value: mockApplications.filter(a => a.status === "待审批").length.toString(), color: "text-warning" },
          { label: "已通过", value: mockApplications.filter(a => a.status === "已通过").length.toString(), color: "text-success" },
          { label: "已拒绝", value: mockApplications.filter(a => a.status === "已拒绝").length.toString(), color: "text-destructive" },
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
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索数据集名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>待审批</option>
          <option>已通过</option>
          <option>已拒绝</option>
          <option>已撤回</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请权限</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请理由</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请时间</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">审批人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">审批意见</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const sc = statusConfig[a.status];
              const Icon = sc.icon;
              return (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{a.dataset}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{a.permission}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs max-w-[180px] truncate" title={a.reason}>{a.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${sc.tagClass} flex items-center gap-1 w-fit`}>
                      <Icon className="w-3 h-3" /> {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{a.applyTime}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{a.reviewer || "-"}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs max-w-[200px] truncate" title={a.opinion || ""}>{a.opinion || "-"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      {a.status === "待审批" && (
                        <button className="p-1 rounded hover:bg-muted/50" title="撤回"><Undo2 className="w-4 h-4 text-warning" /></button>
                      )}
                      {a.status === "已拒绝" && (
                        <button className="p-1 rounded hover:bg-muted/50" title="重新申请"><RotateCcw className="w-4 h-4 text-primary" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录</span>
          <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
        </div>
      </div>
    </div>
  );
};

export default DataServiceMyApplications;

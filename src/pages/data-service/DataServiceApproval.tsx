import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Eye, ThumbsUp, ThumbsDown } from "lucide-react";

const mockApprovals = [
  { id: "AP-001", type: "订购申请", dataset: "中文通用NER标注数据集", applicant: "王强", permission: "查看+下载", reason: "用于NLP模型训练，需要高质量NER标注数据", status: "待审批", applyTime: "2026-03-05 09:30", reviewer: null, reviewTime: null, opinion: null },
  { id: "AP-002", type: "上架审批", dataset: "多轮对话训练数据", applicant: "赵丽", permission: "-", reason: "发布自建的多轮对话数据集至数据集市", status: "待审批", applyTime: "2026-03-04 16:20", reviewer: null, reviewTime: null, opinion: null },
  { id: "AP-003", type: "订购申请", dataset: "ImageNet-21K精选子集", applicant: "孙伟", permission: "下载", reason: "工业缺陷检测模型预训练需要大规模图像数据", status: "已通过", applyTime: "2026-03-03 10:15", reviewer: "张明", reviewTime: "2026-03-03 14:00", opinion: "申请合理，已核实用户所属团队" },
  { id: "AP-004", type: "订购申请", dataset: "金融行业研报摘要数据", applicant: "周婷", permission: "查看", reason: "调研金融NLP数据质量", status: "已拒绝", applyTime: "2026-03-02 11:00", reviewer: "李芳", reviewTime: "2026-03-02 15:30", opinion: "申请理由不够充分，建议补充具体使用场景" },
  { id: "AP-005", type: "上架审批", dataset: "电商商品评论数据集v2", applicant: "赵丽", permission: "-", reason: "更新电商评论数据集到最新版本", status: "已通过", applyTime: "2026-03-01 09:00", reviewer: "张明", reviewTime: "2026-03-01 10:30", opinion: "数据质量符合上架标准" },
  { id: "AP-006", type: "订购申请", dataset: "中文语音转写ASR数据集", applicant: "陈刚", permission: "查看+下载", reason: "语音识别模型训练", status: "待审批", applyTime: "2026-03-05 14:00", reviewer: null, reviewTime: null, opinion: null },
];

const statusConfig: Record<string, { icon: any; tagClass: string }> = {
  "待审批": { icon: Clock, tagClass: "status-tag-warning" },
  "已通过": { icon: CheckCircle, tagClass: "status-tag-success" },
  "已拒绝": { icon: XCircle, tagClass: "status-tag-error" },
};

const DataServiceApproval = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [typeFilter, setTypeFilter] = useState("全部");

  const filtered = mockApprovals.filter(a => {
    if (statusFilter !== "全部" && a.status !== statusFilter) return false;
    if (typeFilter !== "全部" && a.type !== typeFilter) return false;
    if (searchText && !a.dataset.includes(searchText) && !a.applicant.includes(searchText)) return false;
    return true;
  });

  const pendingCount = mockApprovals.filter(a => a.status === "待审批").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">审批管理</h1>
          <p className="page-description">处理数据集订购申请和上架审批</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 bg-warning/10 text-warning rounded-lg text-sm font-medium">
            {pendingCount} 条待审批
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索数据集或申请人..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>订购申请</option>
          <option>上架审批</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>待审批</option>
          <option>已通过</option>
          <option>已拒绝</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">审批类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请权限</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请理由</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">申请时间</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const sc = statusConfig[a.status];
              const Icon = sc.icon;
              return (
                <tr key={a.id} className={`border-b last:border-0 hover:bg-muted/20 ${a.status === "待审批" ? "bg-warning/5" : ""}`}>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${a.type === "订购申请" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>{a.type}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{a.dataset}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.applicant}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{a.permission}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs max-w-[200px] truncate" title={a.reason}>{a.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${sc.tagClass} flex items-center gap-1 w-fit`}>
                      <Icon className="w-3 h-3" /> {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{a.applyTime}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      {a.status === "待审批" && (
                        <>
                          <button className="p-1 rounded hover:bg-success/20" title="通过"><ThumbsUp className="w-4 h-4 text-success" /></button>
                          <button className="p-1 rounded hover:bg-destructive/20" title="拒绝"><ThumbsDown className="w-4 h-4 text-destructive" /></button>
                        </>
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

export default DataServiceApproval;

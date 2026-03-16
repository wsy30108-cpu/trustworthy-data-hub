import React, { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Eye, Check, X, Phone, Building2, User, FileText, Shield, AlertCircle, Mail } from "lucide-react";
import { useApplicationStore, Application } from "@/stores/useApplicationStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: any; tagClass: string; color: string }> = {
  "待审批": { icon: Clock, tagClass: "status-tag-warning", color: "text-warning" },
  "已通过": { icon: CheckCircle, tagClass: "status-tag-success", color: "text-success" },
  "已拒绝": { icon: XCircle, tagClass: "status-tag-error", color: "text-destructive" },
  "已撤回": { icon: AlertCircle, tagClass: "status-tag-default", color: "text-muted-foreground" },
};

const DataServiceApproval = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);

  const applications = useApplicationStore(state => state.applications);
  const approveApplication = useApplicationStore(state => state.approveApplication);
  const rejectApplication = useApplicationStore(state => state.rejectApplication);
  const batchApprove = useApplicationStore(state => state.batchApprove);
  const batchReject = useApplicationStore(state => state.batchReject);

  const filtered = applications.filter(a => {
    if (statusFilter !== "全部" && a.status !== statusFilter) return false;
    const name = a.applicantName || "";
    const datasetName = a.dataset || "";
    if (searchText && !datasetName.toLowerCase().includes(searchText.toLowerCase()) && !name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const pendingCount = applications.filter(a => a.status === "待审批").length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.filter(a => a.status === "待审批").map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    batchApprove(selectedIds);
    setSelectedIds([]);
    toast.success(`已批量通过 ${selectedIds.length} 项申请`);
  };

  const handleBatchReject = () => {
    batchReject(selectedIds);
    setSelectedIds([]);
    toast.success(`已批量拒绝 ${selectedIds.length} 项申请`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="page-header">
        <div>
          <h1 className="page-title">审批管理</h1>
          <p className="page-description">处理数据集订购和访问申请</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 bg-warning/10 text-warning rounded-lg text-sm font-medium border border-warning/20">
            {pendingCount} 条待审批
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索数据集或申请人..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>待审批</option>
          <option>已通过</option>
          <option>已拒绝</option>
          <option>已撤回</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.filter(a => a.status === "待审批").length}
                    className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">数据集</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请人</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请权限</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">理由摘要</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请时间</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(a => {
                const sc = statusConfig[a.status];
                const StatusIcon = sc.icon;
                const isSelected = selectedIds.includes(a.id);
                return (
                  <tr key={a.id} className={cn(
                    "group hover:bg-slate-50/80 transition-colors",
                    a.status === "待审批" ? "bg-warning/5" : "",
                    isSelected ? "bg-primary/5" : ""
                  )}>
                    <td className="py-3 px-4">
                      {a.status === "待审批" && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(a.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 group-hover:text-primary transition-colors cursor-pointer" onClick={() => setViewingApp(a)}>
                        {a.dataset}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {(a.applicantName || "U")[0]}
                        </div>
                        <span className="text-slate-600 font-medium">{a.applicantName || "未知用户"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200 whitespace-nowrap">
                        {a.permission}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-[180px] truncate" title={a.reason}>{a.reason}</td>
                    <td className="py-3 px-4">
                      <span className={cn("status-tag", sc.tagClass, "flex items-center gap-1.5 w-fit font-medium text-[11px]")}>
                        <StatusIcon className="w-3 h-3" /> {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{a.applyTime}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingApp(a)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {a.status === "待审批" && (
                          <>
                            <button
                              onClick={() => {
                                approveApplication(a.id);
                                toast.success("已通过申请");
                              }}
                              className="p-1.5 rounded-lg hover:bg-success/10 text-slate-300 hover:text-success transition-all border border-transparent hover:border-success/20"
                              title="通过"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                rejectApplication(a.id);
                                toast.error("已拒绝申请");
                              }}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-slate-300 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/30">
          <span className="text-xs text-slate-500 font-medium">展示 {filtered.length} 条订购申请</span>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center text-xs rounded-lg border border-primary bg-primary text-white font-bold shadow-sm shadow-primary/20 transition-all hover:scale-105 active:scale-95">1</button>
          </div>
        </div>
      </div>

      {/* 批量操作浮动手柄 */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-8 border border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold">已选择 {selectedIds.length} 项</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBatchApprove}
                className="flex items-center gap-2 px-4 py-1.5 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                <Check className="w-4 h-4" /> 一键通过
              </button>
              <button
                onClick={handleBatchReject}
                className="flex items-center gap-2 px-4 py-1.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                <X className="w-4 h-4" /> 一键拒绝
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-white text-xs transition-colors px-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setViewingApp(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl relative z-10 animate-in slide-in-from-right-full duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">申请详情</h2>
              <button onClick={() => setViewingApp(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* 状态看板 */}
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-4 shadow-sm",
                viewingApp.status === "待审批" ? "bg-warning/5 border-warning/20" :
                  viewingApp.status === "已通过" ? "bg-success/5 border-success/20" :
                    viewingApp.status === "已拒绝" ? "bg-destructive/5 border-destructive/20" : "bg-slate-50 border-slate-200"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                  statusConfig[viewingApp.status].tagClass.replace('status-tag-', 'bg-')
                )}>
                  {(() => {
                    const Icon = statusConfig[viewingApp.status].icon;
                    return <Icon className="w-5 h-5 text-white" />
                  })()}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">当前状态</p>
                  <p className={cn("text-sm font-bold", statusConfig[viewingApp.status].color)}>{viewingApp.status}</p>
                </div>
              </div>

              {/* 数据集信息 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 数据资产背景
                </h3>
                <div className="grid gap-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">数据集名称</p>
                    <p className="text-sm font-bold text-slate-800">{viewingApp.dataset}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">数据集 ID</p>
                      <p className="text-sm font-mono text-primary bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">{viewingApp.datasetId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">数据模态</p>
                      <p className="text-sm font-bold text-slate-700">{viewingApp.modality || "文本"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">领域标签</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingApp.industryDomain?.map((dom: string) => (
                        <span key={dom} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100">{dom}</span>
                      ))}
                      {viewingApp.technicalDomain?.map((dom: string) => (
                        <span key={dom} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100">{dom}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">数据集简介</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 italic">
                      {viewingApp.description || "暂无描述"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 申请人信息 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 申请主体
                </h3>
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400">申请人姓名</p>
                      <p className="text-sm font-bold text-slate-800">{viewingApp.applicantName || "未知"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400">联系电话</p>
                      <p className="text-sm font-bold text-slate-800">{viewingApp.phone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400">所属组织</p>
                      <p className="text-sm font-bold text-slate-800">{viewingApp.creatorOrg}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 申请详情 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 申请项
                </h3>
                <div className="space-y-6 px-2">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-slate-300 mt-1" />
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">申请权限</p>
                      <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded border border-primary/10 uppercase tracking-wider">{viewingApp.permission}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-xs text-slate-400">申请理由</p>
                      <p className="text-sm text-slate-600 leading-relaxed italic break-words">"{viewingApp.reason}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 自定义字段 */}
              {(viewingApp.company || viewingApp.email) && (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 其他信息
                  </h3>
                  <div className="space-y-3">
                    {viewingApp.company && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 uppercase mb-0.5">单位名称</p>
                          <p className="text-xs font-bold text-slate-700 break-words">{viewingApp.company}</p>
                        </div>
                      </div>
                    )}
                    {viewingApp.email && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Mail className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 uppercase mb-0.5">联系邮箱</p>
                          <p className="text-xs font-bold text-slate-700 break-all">{viewingApp.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 审批意见（已处理状态） */}
              {viewingApp.status !== "待审批" && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 审批意见
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    <div className="flex justify-between items-center mb-2 gap-4 overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 shrink-0">{viewingApp.reviewer}</p>
                      <p className="text-[10px] text-slate-400 shrink-0">{viewingApp.reviewTime}</p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium break-words">结论：{viewingApp.opinion}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 抽屉操作栏 */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
              {viewingApp.status === "待审批" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      approveApplication(viewingApp.id);
                      setViewingApp({ ...viewingApp, status: '已通过' });
                      toast.success("已通过申请");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-success text-white font-bold rounded-xl shadow-lg shadow-success/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Check className="w-5 h-5" /> 通过申请
                  </button>
                  <button
                    onClick={() => {
                      rejectApplication(viewingApp.id);
                      setViewingApp({ ...viewingApp, status: '已拒绝' });
                      toast.error("已拒绝申请");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-destructive text-white font-bold rounded-xl shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <X className="w-5 h-5" /> 拒绝申请
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setViewingApp(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors hover:bg-slate-200"
                >
                  关闭
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataServiceApproval;

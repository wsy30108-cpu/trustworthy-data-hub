import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Edit, ArrowUpCircle, ArrowDownCircle, Database, Download, X, Check, ShieldCheck, User, Clock, FileText, Building2, Mail, History, Trash2, AlertCircle, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useListingStore, type Listing, type ListingApproval, type KVTag } from "@/stores/useListingStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FLAT_INDUSTRIES } from "@/lib/industry-domains";
import { renderMarkdown } from "@/lib/markdown";

const TECHNICAL_DOMAINS = ["自然语言处理", "计算机视觉", "音频处理", "机器人学", "自动驾驶", "生成式AI", "强化学习", "知识图谱"];

/* ─── Multi-select dropdown ─── */
function MultiSelectDropdown({ options, selected, onChange, placeholder, className }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  return (
    <div className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left flex items-center justify-between min-h-[42px] hover:border-primary/50 transition-colors">
        {selected.length ? (
          <div className="flex flex-wrap gap-1">
            {selected.map(s => (
              <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">{s}</span>
            ))}
          </div>
        ) : <span className="text-sm text-slate-400 font-medium">{placeholder}</span>}
        <span className="text-slate-400 text-xs ml-2">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setOpen(false)} />
          <div className="absolute z-[120] mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 custom-scrollbar animate-scale-in origin-top">
            {options.map(o => (
              <label key={o} className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5 cursor-pointer text-sm font-medium text-slate-600 rounded-lg transition-colors">
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded accent-primary w-4 h-4 border-slate-200" />
                {o}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Tag Editor Dialog ─── */
function TagEditorDialog({
  open, onClose, tags, onSave, title, max = 20,
}: { open: boolean; onClose: () => void; tags: KVTag[]; onSave: (t: KVTag[]) => void; title: string; max?: number }) {
  const [draft, setDraft] = useState<KVTag[]>([]);

  useEffect(() => {
    if (open) setDraft(tags.map(t => ({ ...t })));
  }, [open, tags]);

  const add = () => {
    if (draft.length >= max) { toast.error(`最多支持 ${max} 个标签`); return; }
    setDraft([...draft, { key: "", value: "" }]);
  };
  const remove = (i: number) => setDraft(draft.filter((_, idx) => idx !== i));
  const update = (i: number, field: "key" | "value", v: string) => {
    const next = [...draft]; next[i] = { ...next[i], [field]: v }; setDraft(next);
  };
  const save = () => {
    const valid = draft.filter(t => t.key.trim() && t.value.trim());
    onSave(valid); onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
          {draft.map((t, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input placeholder="键 (Key)" value={t.key} onChange={e => update(i, "key", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium" />
                <input placeholder="值 (Value)" value={t.value} onChange={e => update(i, "value", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium" />
              </div>
              <button onClick={() => remove(i)} className="p-2 rounded-xl text-slate-300 hover:text-destructive hover:bg-destructive/5 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {draft.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
                <Database className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-sm text-slate-400 font-medium">暂无标签，点击下方按钮添加</p>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50/50 flex flex-col gap-3 rounded-b-3xl">
          <button onClick={add} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> 添加新标签
          </button>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button onClick={onClose} className="py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-white transition-all">取消</button>
            <button onClick={save} className="py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary/20">保存标签</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const statusTag = (s: string) => {
  if (s === "已上架" || s === "已通过") return "status-tag-success";
  if (s === "已下架" || s === "已撤回" || s === "已拒绝") return "status-tag-default";
  if (s === "异常") return "status-tag-error";
  if (s === "上架审批中" || s === "待审批") return "status-tag-warning";
  return "status-tag-warning";
};

const DataServiceListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listings, listingApprovals, withdrawListing, approveListing, rejectListing, deleteListing, updateListing } = useListingStore();

  const [activeTab, setActiveTab] = useState<"mine" | "approval">("mine");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [viewingApproval, setViewingApproval] = useState<any | null>(null);
  const [rejectingApproval, setRejectingApproval] = useState<ListingApproval | null>(null);
  const [reason, setReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tagEditorConfig, setTagEditorConfig] = useState<{ open: boolean; title: string; field: "tags" | "versionTags"; tags: KVTag[] }>({
    open: false, title: "", field: "tags", tags: []
  });

  const isAdmin = ["超级管理员", "运营管理员", "平台管理员", "平台超级管理员"].includes(user?.role || "");

  const filteredMine = useMemo(() => {
    return listings.filter(l => {
      if (statusFilter !== "全部" && l.status !== statusFilter) return false;
      if (searchText && !l.datasetName.includes(searchText)) return false;
      return true;
    });
  }, [listings, searchText, statusFilter]);

  const filteredApprovals = useMemo(() => {
    return listingApprovals.filter(a => {
      if (statusFilter !== "全部" && a.status !== statusFilter) return false;
      if (searchText && !a.datasetName.includes(searchText) && !a.applicant.includes(searchText)) return false;
      return true;
    });
  }, [listingApprovals, searchText, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredApprovals.filter(a => a.status === '待审批').map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchApprove = () => {
    selectedIds.forEach(id => approveListing(id, "通过", user?.name || "管理员"));
    setSelectedIds([]);
    toast.success(`已批量通过 ${selectedIds.length} 项申请`);
  };

  const handleBatchReject = () => {
    const firstId = selectedIds[0];
    const approval = listingApprovals.find(a => a.id === firstId);
    if (approval) {
      setRejectingApproval({ ...approval }); // Use the modal for the first one but logic will handle all
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="page-header">
        <div>
          <h1 className="page-title">上架管理</h1>
          <p className="page-description text-slate-500">管理数据集市中的上架数据集</p>
        </div>
        <button
          onClick={() => navigate("/data-service/listing/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" /> 新建上架
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-8">
          <button onClick={() => { setActiveTab("mine"); setStatusFilter("全部"); }}
            className={cn("pb-3 text-sm font-medium transition-all relative", activeTab === "mine" ? "text-primary" : "text-slate-500 hover:text-slate-700")}>
            我的发布 {activeTab === "mine" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          {isAdmin && (
            <button onClick={() => { setActiveTab("approval"); setStatusFilter("全部"); }}
              className={cn("pb-3 text-sm font-medium transition-all relative flex items-center gap-2", activeTab === "approval" ? "text-primary" : "text-slate-500 hover:text-slate-700")}>
              我的审批
              {listingApprovals.filter(a => a.status === '待审批').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
                  {listingApprovals.filter(a => a.status === '待审批').length}
                </span>
              )}
              {activeTab === "approval" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={activeTab === "mine" ? "搜索数据集名称..." : "搜索名称或申请人..."}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-xl bg-white outline-none focus:border-primary transition-all">
          <option>全部</option>
          {activeTab === "mine" ? (
            <>
              <option>已上架</option>
              <option>已下架</option>
              <option>上架审批中</option>
            </>
          ) : (
            <>
              <option>待审批</option>
              <option>已通过</option>
              <option>已拒绝</option>
            </>
          )}
        </select>
      </div>

      <div className="rounded-2xl border bg-white overflow-x-auto shadow-sm shadow-slate-200">
        {activeTab === "mine" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">数据集名称</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">数据集ID</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">版本号</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">模态</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">来源</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">申请次数</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">已授权</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">上架时间</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMine.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-slate-700">{l.datasetName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-primary/70">{l.id}</td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-600">{l.version}</td>
                  <td className="py-4 px-4 text-slate-500 font-medium">{l.modality}</td>
                  <td className="py-4 px-4 text-slate-400">{l.source}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 group relative">
                      <span className={cn("status-tag", statusTag(l.status))}>{l.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-600 font-medium">{l.applyCount}</td>
                  <td className="py-4 px-4 text-right text-slate-600 font-medium">{l.authorizedUsers}</td>
                  <td className="py-4 px-4 text-slate-400 text-xs">{l.publishedAt || "-"}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewingApproval(l)} className="p-2 text-slate-400 hover:text-primary transition-colors" title="查看详情"><Eye className="w-4 h-4" /></button>
                      {l.status === '已上架' && (
                        <button onClick={() => { withdrawListing(l.id); toast.success("数据集已下架"); }} className="p-2 text-slate-400 hover:text-warning transition-colors" title="下架"><ArrowDownCircle className="w-4 h-4" /></button>
                      )}
                      {(l.status === '已下架' || l.status === '已拒绝') && (
                        <>
                          <button onClick={() => navigate(`/data-service/listing/create?editId=${l.id}`)} className="p-2 text-primary hover:text-primary-600" title="编辑并重新发布"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { deleteListing(l.id); toast.success("上架记录已删除"); }} className="p-2 text-slate-400 hover:text-destructive transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMine.length === 0 && (
                <tr><td colSpan={10} className="py-20 text-center text-slate-400 italic">暂无发布记录</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="w-12 py-4 px-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredApprovals.filter(a => a.status === '待审批').length}
                    className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">数据集名称</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">数据集ID</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">模态</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">申请人</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">申请人组织</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">技术领域</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">行业领域</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">申请时间</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map(a => {
                const isSelected = selectedIds.includes(a.id);
                return (
                  <tr key={a.id} className={cn(
                    "border-b last:border-0 hover:bg-slate-50/50 transition-colors",
                    isSelected ? "bg-primary/5" : ""
                  )}>
                    <td className="py-4 px-4">
                      {a.status === '待审批' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(a.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">{a.datasetName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-primary/70">{a.listingId}</td>
                    <td className="py-4 px-4 text-slate-500 font-medium">{a.modality}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {a.applicant[0]}
                        </div>
                        <span className="text-slate-600 font-medium">{a.applicant}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500">{a.applicantOrg}</td>
                    <td className="py-4 px-4 text-slate-500">
                      <div className="truncate max-w-[120px]" title={a.technicalDomain.join(" / ")}>
                        {a.technicalDomain.join(" / ")}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <div className="truncate max-w-[120px]" title={a.industryDomain.join(" / ")}>
                        {a.industryDomain.join(" / ")}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs">{a.applyTime}</td>
                    <td className="py-4 px-4">
                      <span className={cn("status-tag", statusTag(a.status))}>{a.status}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingApproval(a)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> 详情
                        </button>
                        {a.status === '待审批' && (
                          <>
                            <button
                              onClick={() => { approveListing(a.id, "通过", user?.name || "管理员"); toast.success("已通过审批"); }}
                              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> 通过
                            </button>
                            <button
                              onClick={() => setRejectingApproval(a)}
                              className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive hover:text-white transition-all flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> 拒绝
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApprovals.length === 0 && (
                <tr><td colSpan={10} className="py-20 text-center text-slate-400 italic">暂无审批任务</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Drawer */}
      {viewingApproval && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setViewingApproval(null)} />
          <div className="relative w-[500px] bg-white h-full shadow-2xl animate-slide-in-right flex flex-col p-8 space-y-8 custom-scrollbar overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 font-display">数据集上架详情</h2>
              <button onClick={() => setViewingApproval(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-6 pb-20">
              {/* 基本状态 */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest">当前状态</p>
                  <span className={cn("status-tag mt-1 block w-fit font-bold", statusTag(viewingApproval.status))}>{viewingApproval.status}</span>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">数据集名称</p>
                    <p className="text-sm font-bold text-slate-700">{viewingApproval.datasetName}</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">数据集 ID</p>
                    <p className="text-xs font-mono text-primary font-bold">{viewingApproval.datasetId || viewingApproval.id}</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">版本号</p>
                    <p className="text-sm font-bold text-slate-700">{viewingApproval.version}</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">数据模态</p>
                    <p className="text-sm font-bold text-slate-700">{viewingApproval.modality}</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">数据集版本描述</p>
                    <p className="text-sm font-bold text-slate-700">{viewingApproval.versionDesc || "暂无说明"}</p>
                  </div>
                </div>
              </div>

              {/* 领域标签 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 领域标签
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase">技术领域</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingApproval.technicalDomain?.map((dom: string) => (
                        <span key={dom} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100">{dom}</span>
                      )) || <span className="text-xs text-slate-300 italic">未指定</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase">行业领域</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingApproval.industryDomain?.map((dom: string) => (
                        <span key={dom} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100">{dom}</span>
                      )) || <span className="text-xs text-slate-300 italic">未指定</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 介绍描述 */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 自定义数据集介绍
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">数据集内容简介</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                      <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                        {viewingApproval.description || "暂无描述"}
                      </p>
                      <FileText className="absolute right-3 top-3 w-4 h-4 text-slate-200" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">上架用途说明</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium pl-4 border-l-2 border-primary/20">
                      {viewingApproval.purpose || "暂无用途说明"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 数据集标签 */}
              {viewingApproval.tags && viewingApproval.tags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 数据集标签
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingApproval.tags.map((t: KVTag, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px]">
                        <span className="font-bold text-primary/60">{t.key}:</span>
                        <span className="text-slate-600 font-bold truncate">{t.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 数据集版本标签 */}
              {viewingApproval.versionTags && viewingApproval.versionTags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 数据集版本标签
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingApproval.versionTags.map((t: KVTag, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl text-[11px]">
                        <span className="font-bold text-primary">{t.key}:</span>
                        <span className="text-primary/70 font-bold truncate">{t.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* 自定义数据集介绍 (Markdown) */}
              {viewingApproval.customMetadata && (
                <section className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 自定义数据集介绍
                  </h3>
                  <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div
                      className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 first:prose-h2:mt-0"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(viewingApproval.customMetadata) }}
                    />
                  </div>
                </section>
              )}

              {/* 审批流程 (Timeline) */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 审批流程
                </h3>

                <div className="relative pl-4 space-y-6">
                  {/* 时间轴连线 */}
                  <div className="absolute top-4 bottom-4 left-6 w-[2px] bg-slate-100 rounded-full" />

                  {/* 第 1 步：提交申请 */}
                  <div className="relative z-10 flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-700">提交申请</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <User className="w-3 h-3" /> {viewingApproval.applicant || viewingApproval.publisher} (@{viewingApproval.applicantOrg || viewingApproval.source || "平台"})
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {viewingApproval.applyTime || viewingApproval.publishedAt || "无时间"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 第 2 步：审批处理 */}
                  <div className="relative z-10 flex gap-4">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm border-2 border-white",
                      viewingApproval.status === '已上架' || viewingApproval.status === '已通过' ? "bg-success/10 text-success" :
                        viewingApproval.status === '已拒绝' ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                    )}>
                      {viewingApproval.status === '已上架' || viewingApproval.status === '已通过' ? <Check className="w-3 h-3" /> :
                        viewingApproval.status === '已拒绝' ? <X className="w-3 h-3" /> :
                          <Clock className="w-3 h-3 animate-pulse" />}
                    </div>
                    <div className={cn(
                      "flex-1 border rounded-xl p-4 shadow-sm transition-colors",
                      viewingApproval.status === '已上架' || viewingApproval.status === '已通过' ? "bg-success/5 border-success/10" :
                        viewingApproval.status === '已拒绝' ? "bg-destructive/5 border-destructive/10" :
                          "bg-white border-warning/30 shadow-warning/5"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={cn(
                            "text-xs font-bold",
                            viewingApproval.status === '已上架' || viewingApproval.status === '已通过' ? "text-success" :
                              viewingApproval.status === '已拒绝' ? "text-destructive" :
                                "text-warning-foreground" // Use foreground to ensure contrast for warning
                          )}>
                            {viewingApproval.status === '已上架' || viewingApproval.status === '已通过' ? "审批通过" :
                              viewingApproval.status === '已拒绝' ? "已拒绝" :
                                "上架审批中"}
                          </p>
                          {(viewingApproval.status === '已上架' || viewingApproval.status === '已通过' || viewingApproval.status === '已拒绝') && viewingApproval.reviewer && (
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" /> {viewingApproval.reviewer}
                            </p>
                          )}
                          {viewingApproval.status === '上架审批中' && (
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              等待平台管理员处理
                            </p>
                          )}
                        </div>
                        {(viewingApproval.status === '已上架' || viewingApproval.status === '已通过' || viewingApproval.status === '已拒绝') && viewingApproval.reviewTime && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {viewingApproval.reviewTime}
                          </span>
                        )}
                      </div>
                      {(viewingApproval.status === '已上架' || viewingApproval.status === '已通过' || viewingApproval.status === '已拒绝') && viewingApproval.opinion && (
                        <div className="mt-3 p-3 bg-white/60 rounded-lg border border-white/40">
                          <p className="text-xs text-slate-600 font-medium italic">“{viewingApproval.opinion}”</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <TagEditorDialog
        open={tagEditorConfig.open}
        onClose={() => setTagEditorConfig({ ...tagEditorConfig, open: false })}
        tags={tagEditorConfig.tags}
        onSave={(tags) => {
          // This TagEditorDialog is currently not being used for saving in this page 
          // but we keep the prop for component compatibility if needed.
        }}
        title={tagEditorConfig.title}
      />

      {/* 批量操作浮动手柄 */}
      {activeTab === 'approval' && selectedIds.length > 0 && (
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

      {rejectingApproval && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectingApproval(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold">拒绝审批申请</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="请输入拒绝原因..."
              className="w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none focus:border-destructive transition-all text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setRejectingApproval(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">取消</button>
              <button onClick={() => {
                if (rejectingApproval && reason.trim()) {
                  if (selectedIds.length > 1 && selectedIds.includes(rejectingApproval.id)) {
                    selectedIds.forEach(id => rejectListing(id, reason, user?.name || "管理员"));
                    toast.success(`已批量拒绝 ${selectedIds.length} 项申请`);
                  } else {
                    rejectListing(rejectingApproval.id, reason, user?.name || "管理员");
                    toast.success("已拒绝该申请");
                  }
                  setRejectingApproval(null);
                  setSelectedIds([]);
                  setReason("");
                } else {
                  toast.error("请输入拒绝原因");
                }
              }} className="flex-1 py-3 text-sm font-bold text-white bg-destructive rounded-xl">确认拒绝</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataServiceListing;

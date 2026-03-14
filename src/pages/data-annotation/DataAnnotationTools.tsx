import { useState } from "react";
import {
  Search, Plus, Eye, Edit, Copy, Trash2, MoreHorizontal, Lock,
  Share2, X, AlertTriangle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Tool {
  id: string;
  name: string;
  type: string;
  desc: string;
  objects: string[];
  methods: string[];
  isPreset: boolean;
  usageCount: number;
  creator: string;
  updatedAt: string;
  icon: string;
  sharedTo: string;
  activeTasks: string[];
}

const mockTools: Tool[] = [
  { id: "TL-001", name: "文本分类标注", type: "文本类", desc: "单选/多选文本分类标注工具", objects: ["文本"], methods: ["单选", "多选"], isPreset: true, usageCount: 156, creator: "系统", updatedAt: "2026-02-01", icon: "📝", sharedTo: "", activeTasks: [] },
  { id: "TL-002", name: "实体关系标注", type: "文本类", desc: "支持NER实体标注和关系连线", objects: ["文本"], methods: ["实体标注", "关系标注"], isPreset: true, usageCount: 89, creator: "系统", updatedAt: "2026-02-01", icon: "🔗", sharedTo: "", activeTasks: [] },
  { id: "TL-003", name: "图像分类标注", type: "图像类", desc: "图像全图分类标注工具", objects: ["图像"], methods: ["单选"], isPreset: true, usageCount: 234, creator: "系统", updatedAt: "2026-02-01", icon: "🖼️", sharedTo: "", activeTasks: [] },
  { id: "TL-004", name: "矩形框标注", type: "图像类", desc: "图像目标检测矩形框标注", objects: ["图像"], methods: ["矩形框"], isPreset: true, usageCount: 312, creator: "系统", updatedAt: "2026-02-01", icon: "⬜", sharedTo: "", activeTasks: [] },
  { id: "TL-005", name: "语义分割标注", type: "图像类", desc: "像素级语义分割标注工具", objects: ["图像"], methods: ["画笔", "多边形"], isPreset: true, usageCount: 67, creator: "系统", updatedAt: "2026-02-01", icon: "🎨", sharedTo: "", activeTasks: [] },
  { id: "TL-006", name: "金融情感三分类", type: "文本类", desc: "自定义金融文本情感标注工具（正面/负面/中性）", objects: ["文本"], methods: ["单选"], isPreset: false, usageCount: 23, creator: "张明", updatedAt: "2026-02-20", icon: "💰", sharedTo: "", activeTasks: [] },
  { id: "TL-007", name: "医疗影像多标签", type: "图像类", desc: "CT/MRI多标签分类+病灶区域标注", objects: ["图像"], methods: ["多选", "矩形框"], isPreset: false, usageCount: 12, creator: "李芳", updatedAt: "2026-03-01", icon: "🏥", sharedTo: "", activeTasks: ["TASK-042"] },
  { id: "TL-008", name: "音频转写标注", type: "音频类", desc: "音频播放+文本转写标注工具", objects: ["音频", "文本"], methods: ["文本输入"], isPreset: true, usageCount: 45, creator: "系统", updatedAt: "2026-02-01", icon: "🎵", sharedTo: "", activeTasks: [] },
  { id: "TL-009", name: "视频追踪标注", type: "视频类", desc: "视频目标追踪与检测标注", objects: ["视频"], methods: ["矩形框", "追踪"], isPreset: true, usageCount: 18, creator: "系统", updatedAt: "2026-02-01", icon: "🎬", sharedTo: "", activeTasks: [] },
  { id: "TL-010", name: "表格数据标注", type: "表格类", desc: "结构化表格数据标注工具", objects: ["表格"], methods: ["单选", "输入框"], isPreset: true, usageCount: 8, creator: "系统", updatedAt: "2026-02-01", icon: "📊", sharedTo: "", activeTasks: [] },
  { id: "TL-011", name: "图文跨模态标注", type: "跨模态类", desc: "图像+文本联合标注工具", objects: ["图像", "文本"], methods: ["单选", "输入框"], isPreset: true, usageCount: 15, creator: "系统", updatedAt: "2026-02-01", icon: "🔀", sharedTo: "shared-team", activeTasks: [] },
];

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "表格类": "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "跨模态类": "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

const DataAnnotationTools = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState<"mine" | "shared" | "market">("mine");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [tools, setTools] = useState(mockTools);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Tool | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [shareModal, setShareModal] = useState<Tool | null>(null);
  const [shareScope, setShareScope] = useState("team");
  const [detailTool, setDetailTool] = useState<Tool | null>(null);

  const filtered = tools.filter(t => {
    if (tab === "mine" && t.creator !== "张明" && !t.isPreset) return false;
    if (tab === "shared" && !t.sharedTo) return false;
    if (typeFilter !== "全部" && t.type !== typeFilter) return false;
    if (searchText && !t.name.includes(searchText) && !t.desc.includes(searchText)) return false;
    return true;
  });

  const handleCopy = (tool: Tool) => {
    const copied: Tool = { ...tool, id: `TL-${String(tools.length + 1).padStart(3, "0")}`, name: `${tool.name} (副本)`, isPreset: false, creator: "张明", usageCount: 0, updatedAt: new Date().toISOString().split("T")[0], sharedTo: "", activeTasks: [] };
    setTools(prev => [copied, ...prev]);
    toast.success(`已复制工具「${tool.name}」，可在「我的标注工具」中查看与编辑`);
    setActionMenu(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm || deleteInput !== deleteConfirm.name) { toast.error("请输入正确的工具名称"); return; }
    if (deleteConfirm.activeTasks.length > 0) {
      toast.error(`工具正在被以下任务使用: ${deleteConfirm.activeTasks.join(", ")}，无法删除`);
      return;
    }
    setTools(prev => prev.filter(t => t.id !== deleteConfirm.id));
    toast.success(`工具「${deleteConfirm.name}」已删除`);
    setDeleteConfirm(null); setDeleteInput(""); setActionMenu(null);
  };

  const handleShare = () => {
    if (!shareModal) return;
    setTools(prev => prev.map(t => t.id === shareModal.id ? { ...t, sharedTo: shareScope } : t));
    toast.success(`工具已分享至${shareScope === "team" ? "团队工作空间" : shareScope === "org" ? "机构工作空间" : "标注工具市场"}`);
    setShareModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">标注工具</h1>
          <p className="page-description">管理预置标注工具和自定义标注工具，支持工具市场分享</p>
        </div>
        <button onClick={() => navigate("/data-annotation/tool-editor")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建标注工具
        </button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "mine", label: "我的标注工具" }, { key: "shared", label: "分享给我的工具" }, { key: "market", label: "标注工具市场" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索工具名称或描述..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          {["文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">{t.icon}</div>
                {t.isPreset && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              {!t.isPreset && tab === "mine" && (
                <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === t.id ? null : t.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/50 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {actionMenu === t.id && (
                <div className="absolute right-4 top-14 z-50 bg-card border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button onClick={() => { setActionMenu(null); navigate(`/data-annotation/tool-editor?id=${t.id}`); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"><Edit className="w-4 h-4" /> 编辑</button>
                  <button onClick={() => handleCopy(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"><Copy className="w-4 h-4" /> 复制</button>
                  <button onClick={() => { setShareModal(t); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"><Share2 className="w-4 h-4" /> 分享</button>
                  <button onClick={() => { setDeleteConfirm(t); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-destructive"><Trash2 className="w-4 h-4" /> 删除</button>
                </div>
              )}
            </div>
            <h4 className="font-medium text-foreground mb-1 text-sm" onClick={() => setDetailTool(t)}>{t.name}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.desc}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[t.type] || "bg-muted text-muted-foreground"}`}>{t.type}</span>
              {t.methods.map((m, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{m}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
              <span>{t.creator} · 使用{t.usageCount}次</span>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setDetailTool(t); }} className="p-1 rounded hover:bg-muted/50"><Eye className="w-3.5 h-3.5" /></button>
                {!t.isPreset && tab === "mine" && <button onClick={(e) => { e.stopPropagation(); navigate(`/data-annotation/tool-editor?id=${t.id}`); }} className="p-1 rounded hover:bg-muted/50"><Edit className="w-3.5 h-3.5" /></button>}
                <button onClick={(e) => { e.stopPropagation(); handleCopy(t); }} className="p-1 rounded hover:bg-muted/50"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">未找到匹配的标注工具</p>
          </div>
        )}
      </div>

      {actionMenu && <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />}

      {/* Detail modal */}
      {detailTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">{detailTool.icon}</div>
                <div>
                  <h3 className="font-semibold">{detailTool.name}</h3>
                  <p className="text-xs text-muted-foreground">{detailTool.id} · {detailTool.type}</p>
                </div>
              </div>
              <button onClick={() => setDetailTool(null)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><p className="text-xs text-muted-foreground mb-1">描述</p><p className="text-sm">{detailTool.desc}</p></div>
              <div><p className="text-xs text-muted-foreground mb-1">标注对象</p><div className="flex gap-1">{detailTool.objects.map(o => <span key={o} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{o}</span>)}</div></div>
              <div><p className="text-xs text-muted-foreground mb-1">标注方法</p><div className="flex gap-1">{detailTool.methods.map(m => <span key={m} className="px-2 py-0.5 bg-muted rounded text-xs">{m}</span>)}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">创建人</p><p className="text-sm">{detailTool.creator}</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">更新时间</p><p className="text-sm">{detailTool.updatedAt}</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">使用次数</p><p className="text-sm">{detailTool.usageCount}</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">类型</p><p className="text-sm">{detailTool.isPreset ? "预置" : "自定义"}</p></div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">标签配置预览</p>
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex gap-2 mb-3">
                    {detailTool.objects.map(o => <span key={o} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{o}</span>)}
                  </div>
                  <div className="p-3 rounded border bg-background text-sm text-muted-foreground mb-3">
                    {detailTool.objects.includes("文本") && "央行今日公布最新货币政策，维持基准利率不变..."}
                    {detailTool.objects.includes("图像") && "[图像预览区域]"}
                    {detailTool.objects.includes("音频") && "[音频播放器]"}
                    {detailTool.objects.includes("视频") && "[视频播放器]"}
                    {detailTool.objects.includes("表格") && "[表格预览]"}
                  </div>
                  <div className="space-y-1">
                    {detailTool.methods.map(m => (
                      <div key={m} className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-accent rounded">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-6 h-6 text-destructive" /><h3 className="text-lg font-semibold">确认删除工具</h3></div>
            <p className="text-sm text-muted-foreground mb-2">删除后工具不可恢复。</p>
            {deleteConfirm.activeTasks.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
                <p className="text-sm text-destructive font-medium">⚠ 以下任务正在使用该工具，无法删除：</p>
                <p className="text-sm text-destructive mt-1">{deleteConfirm.activeTasks.join(", ")}</p>
              </div>
            )}
            <p className="text-sm text-foreground mb-4">请输入工具名称 <span className="font-bold text-destructive">{deleteConfirm.name}</span> 确认：</p>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="输入工具名称" className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-destructive/20" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setDeleteConfirm(null); setDeleteInput(""); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleDelete} disabled={deleteInput !== deleteConfirm.name} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg disabled:opacity-50">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-3">分享工具「{shareModal.name}」</h3>
            <div className="space-y-2 mb-4">
              {[{ key: "team", label: "分享到团队工作空间" }, { key: "org", label: "分享到机构工作空间" }, { key: "market", label: "分享到标注工具市场" }].map(opt => (
                <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${shareScope === opt.key ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                  <input type="radio" checked={shareScope === opt.key} onChange={() => setShareScope(opt.key)} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShareModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handleShare} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认分享</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationTools;

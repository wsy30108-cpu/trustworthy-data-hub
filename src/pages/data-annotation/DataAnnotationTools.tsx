import { useState } from "react";
import { Search, Plus, Eye, Edit, Copy, Trash2, Hammer, MoreHorizontal, Lock } from "lucide-react";

const mockTools = [
  { id: "TL-001", name: "文本分类标注", type: "文本类", desc: "单选/多选文本分类标注工具", objects: ["文本"], methods: ["单选", "多选"], isPreset: true, usageCount: 156, creator: "系统", updatedAt: "2026-02-01", icon: "📝" },
  { id: "TL-002", name: "实体关系标注", type: "文本类", desc: "支持NER实体标注和关系连线", objects: ["文本"], methods: ["实体标注", "关系标注"], isPreset: true, usageCount: 89, creator: "系统", updatedAt: "2026-02-01", icon: "🔗" },
  { id: "TL-003", name: "图像分类标注", type: "图像类", desc: "图像全图分类标注工具", objects: ["图像"], methods: ["单选"], isPreset: true, usageCount: 234, creator: "系统", updatedAt: "2026-02-01", icon: "🖼️" },
  { id: "TL-004", name: "矩形框标注", type: "图像类", desc: "图像目标检测矩形框标注", objects: ["图像"], methods: ["矩形框"], isPreset: true, usageCount: 312, creator: "系统", updatedAt: "2026-02-01", icon: "⬜" },
  { id: "TL-005", name: "语义分割标注", type: "图像类", desc: "像素级语义分割标注工具", objects: ["图像"], methods: ["画笔", "多边形"], isPreset: true, usageCount: 67, creator: "系统", updatedAt: "2026-02-01", icon: "🎨" },
  { id: "TL-006", name: "金融情感三分类", type: "文本类", desc: "自定义金融文本情感标注工具（正面/负面/中性）", objects: ["文本"], methods: ["单选"], isPreset: false, usageCount: 23, creator: "张明", updatedAt: "2026-02-20", icon: "💰" },
  { id: "TL-007", name: "医疗影像多标签", type: "图像类", desc: "CT/MRI多标签分类+病灶区域标注", objects: ["图像"], methods: ["多选", "矩形框"], isPreset: false, usageCount: 12, creator: "李芳", updatedAt: "2026-03-01", icon: "🏥" },
  { id: "TL-008", name: "音频转写标注", type: "音频类", desc: "音频播放+文本转写标注工具", objects: ["音频", "文本"], methods: ["文本输入"], isPreset: true, usageCount: 45, creator: "系统", updatedAt: "2026-02-01", icon: "🎵" },
];

const typeColors: Record<string, string> = {
  "文本类": "status-tag-info", "图像类": "status-tag-success", "音频类": "status-tag-warning", "视频类": "bg-purple-50 text-purple-700",
};

const DataAnnotationTools = () => {
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState<"all" | "preset" | "custom">("all");

  const filtered = mockTools.filter(t => {
    if (tab === "preset" && !t.isPreset) return false;
    if (tab === "custom" && t.isPreset) return false;
    if (searchText && !t.name.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">标注工具</h1>
          <p className="page-description">管理预置标注工具和自定义标注工具编排</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建标注工具
        </button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "all", label: "全部工具" }, { key: "preset", label: "预置工具" }, { key: "custom", label: "自定义工具" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索工具名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">{t.icon}</div>
                {t.isPreset && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              {!t.isPreset && (
                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/50 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <h4 className="font-medium text-foreground mb-1 text-sm">{t.name}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.desc}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`status-tag ${typeColors[t.type]}`}>{t.type}</span>
              {t.methods.map((m, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{m}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
              <span>{t.creator} · 使用{t.usageCount}次</span>
              <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-muted/50"><Eye className="w-3.5 h-3.5" /></button>
                {!t.isPreset && <button className="p-1 rounded hover:bg-muted/50"><Edit className="w-3.5 h-3.5" /></button>}
                <button className="p-1 rounded hover:bg-muted/50"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataAnnotationTools;

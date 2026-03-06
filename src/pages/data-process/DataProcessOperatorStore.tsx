import { useState } from "react";
import { Search, Star, Download, Boxes } from "lucide-react";

const storeOperators = [
  { id: "SOP-001", name: "SimHash去重", desc: "基于SimHash的大规模文本相似度去重算子", modality: "文本", category: "去重", downloads: 2345, rating: 4.9, author: "官方" },
  { id: "SOP-002", name: "BM25过滤", desc: "基于BM25的相关性过滤算子", modality: "文本", category: "过滤", downloads: 1890, rating: 4.7, author: "官方" },
  { id: "SOP-003", name: "YOLO目标检测", desc: "基于YOLOv8的图像目标检测与裁剪", modality: "图像", category: "检测", downloads: 1567, rating: 4.8, author: "官方" },
  { id: "SOP-004", name: "Whisper转写", desc: "OpenAI Whisper模型语音转文本", modality: "语音", category: "转写", downloads: 2100, rating: 4.9, author: "官方" },
  { id: "SOP-005", name: "正则表达式替换", desc: "可配置的多规则正则替换算子", modality: "文本", category: "格式化", downloads: 3456, rating: 4.6, author: "官方" },
  { id: "SOP-006", name: "图像美学评分", desc: "基于CLIP的图像美学质量评估", modality: "图像", category: "评估", downloads: 890, rating: 4.5, author: "社区" },
  { id: "SOP-007", name: "数据采样", desc: "支持随机/分层/系统采样策略", modality: "通用", category: "采样", downloads: 1234, rating: 4.4, author: "官方" },
  { id: "SOP-008", name: "JSON Schema校验", desc: "按Schema验证JSON数据格式", modality: "文本", category: "校验", downloads: 678, rating: 4.3, author: "社区" },
];

const categories = ["全部", "去重", "过滤", "格式化", "检测", "转写", "评估", "采样", "校验"];

const DataProcessOperatorStore = () => {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = storeOperators.filter(o => {
    if (activeCategory !== "全部" && o.category !== activeCategory) return false;
    if (searchText && !o.name.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">算子商店</h1>
          <p className="page-description">浏览和获取社区共享的数据处理算子</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索算子..." className="w-full pl-12 pr-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(o => (
          <div key={o.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Boxes className="w-5 h-5 text-primary" />
              </div>
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${o.author === "官方" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{o.author}</span>
            </div>
            <h4 className="font-medium text-foreground mb-1 text-sm">{o.name}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{o.desc}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="status-tag status-tag-info">{o.modality}</span>
              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{o.category}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-warning" />{o.rating}</span>
                <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{o.downloads}</span>
              </div>
              <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">安装</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProcessOperatorStore;

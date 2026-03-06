import { useState } from "react";
import { Search, Database, Star, ArrowUpRight, Tag, Eye } from "lucide-react";

const mockMarketplace = [
  { id: "M-001", name: "中文通用NER标注数据集", desc: "覆盖人名、地名、机构名等实体类型的高质量标注数据", type: "文本", category: "通识数据集", task: "命名实体识别", size: "500万条", tags: ["中文", "NER", "已标注"], isOfficial: true, applyCount: 234, updatedAt: "2026-03-01" },
  { id: "M-002", name: "金融行业研报摘要数据", desc: "券商研报结构化摘要，适用于金融文本理解与生成", type: "文本", category: "行业专识数据集", task: "文本摘要", size: "50万篇", tags: ["金融", "研报", "中文"], isOfficial: false, applyCount: 189, updatedAt: "2026-02-28" },
  { id: "M-003", name: "ImageNet-21K精选子集", desc: "ImageNet大规模图像数据集精选版本，覆盖1000+类别", type: "图像", category: "通识数据集", task: "图像分类", size: "100万张", tags: ["图像分类", "预训练"], isOfficial: true, applyCount: 567, updatedAt: "2026-02-25" },
  { id: "M-004", name: "中英文平行语料v3", desc: "高质量中英文翻译平行语料，源于多领域专业翻译", type: "文本", category: "通识数据集", task: "机器翻译", size: "800万对", tags: ["翻译", "中英", "多领域"], isOfficial: true, applyCount: 892, updatedAt: "2026-03-03" },
  { id: "M-005", name: "智能制造缺陷检测数据集", desc: "涵盖电子元器件、金属表面等缺陷类型的标注图像", type: "图像", category: "行业专识数据集", task: "缺陷检测", size: "15万张", tags: ["工业", "缺陷检测", "已标注"], isOfficial: false, applyCount: 78, updatedAt: "2026-02-20" },
  { id: "M-006", name: "中文语音转写ASR数据集", desc: "普通话语音-文本对齐语料，适用于ASR模型训练", type: "语音", category: "通识数据集", task: "语音识别", size: "2000小时", tags: ["语音", "ASR", "普通话"], isOfficial: true, applyCount: 345, updatedAt: "2026-03-02" },
];

const categories = ["全部", "通识数据集", "行业通识数据集", "行业专识数据集"];
const modalities = ["全部", "文本", "图像", "语音", "视频", "表格"];

const DataServiceMarketplace = () => {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据集市</h1>
          <p className="page-description">发现和申请高质量数据集</p>
        </div>
      </div>

      {/* 搜索区 */}
      <div className="rounded-xl border bg-card p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索数据集名称、描述、标签..."
            className="w-full pl-12 pr-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeCategory === c
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1">
            {modalities.map(m => (
              <button key={m} className="px-3 py-1 text-xs rounded-md text-muted-foreground hover:bg-muted/50">{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 推荐区 */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" /> 推荐数据集
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMarketplace.filter(d => d.isOfficial).slice(0, 3).map(ds => (
            <div key={ds.id} className="rounded-xl border bg-card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  {ds.isOfficial && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">官方</span>
                  )}
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h4 className="font-medium text-foreground mb-1">{ds.name}</h4>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ds.desc}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="status-tag status-tag-info">{ds.type}</span>
                <span className="text-xs text-muted-foreground">{ds.size}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{ds.applyCount}次申请</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {ds.tags.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 全部数据集 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">全部数据集</h3>
          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 text-xs border rounded-md bg-card">
              <option>按相关度</option>
              <option>按上架时间</option>
              <option>按数据量</option>
              <option>按申请次数</option>
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMarketplace.map(ds => (
            <div key={ds.id} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-foreground truncate">{ds.name}</h4>
                    {ds.isOfficial && <span className="px-1 py-0.5 bg-primary/10 text-primary text-[8px] font-medium rounded shrink-0">官方</span>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ds.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="status-tag status-tag-info">{ds.type}</span>
                  <span className="text-xs text-muted-foreground">{ds.size}</span>
                </div>
                <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  申请使用
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataServiceMarketplace;

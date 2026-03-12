import { useState } from "react";
import { Search, Database, Star, ArrowUpRight, Tag, Eye } from "lucide-react";
import { DatasetApplyModal } from "./DatasetApplyModal";

const mockMarketplace = [
  { id: "M-001", name: "中文通用NER标注数据集", desc: "覆盖人名、地名、机构名等实体类型的高质量标注数据", type: "文本", category: "通识数据集", task: "命名实体识别", size: "500万条", tags: ["中文", "NER", "已标注"], isOfficial: true, applyCount: 234, updatedAt: "2026-03-01", version: "v2.1.0" },
  { id: "M-002", name: "金融行业研报摘要数据", desc: "券商研报结构化摘要，适用于金融文本理解与生成", type: "文本", category: "行业专识数据集", task: "文本摘要", size: "50万篇", tags: ["金融", "研报", "中文"], isOfficial: false, applyCount: 189, updatedAt: "2026-02-28", version: "v1.0.5" },
  { id: "M-003", name: "ImageNet-21K精选子集", desc: "ImageNet大规模图像数据集精选版本，覆盖1000+类别", type: "图像", category: "通识数据集", task: "图像分类", size: "100万张", tags: ["图像分类", "预训练"], isOfficial: true, applyCount: 567, updatedAt: "2026-02-25", version: "v1.0.0" },
  { id: "M-004", name: "中英文平行语料v3", desc: "高质量中英文翻译平行语料，源于多领域专业翻译", type: "文本", category: "通识数据集", task: "机器翻译", size: "800万对", tags: ["翻译", "中英", "多领域"], isOfficial: true, applyCount: 892, updatedAt: "2026-03-03", version: "v3.0.0" },
  { id: "M-005", name: "智能制造缺陷检测数据集", desc: "涵盖电子元器件、金属表面等缺陷类型的标注图像", type: "图像", category: "行业专识数据集", task: "缺陷检测", size: "15万张", tags: ["工业", "缺陷检测", "已标注"], isOfficial: false, applyCount: 78, updatedAt: "2026-02-20", version: "v1.2.0" },
  { id: "M-006", name: "中文语音转写ASR数据集", desc: "普通话语音-文本对齐语料，适用于ASR模型训练", type: "语音", category: "通识数据集", task: "语音识别", size: "2000小时", tags: ["语音", "ASR", "普通话"], isOfficial: true, applyCount: 345, updatedAt: "2026-03-02", version: "v2.0.0" },
];

const mockExistingApps = [
  { id: "APP-002", dataset: "ImageNet-21K精选子集", status: "待审批" },
];

const mockUserPermissions: Record<string, string> = {
  "M-004": "ReadWrite",
  "M-001": "Read",
};

const categories = ["全部", "通识数据集", "行业通识数据集", "行业专识数据集"];
const modalities = ["全部", "文本", "图像", "语音", "视频", "表格"];

const DataServiceMarketplace = () => {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeModality, setActiveModality] = useState("全部");

  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);

  const handleApply = (dataset: any) => {
    setSelectedDataset(dataset);
    setIsApplyModalOpen(true);
  };

  const filteredDatasets = mockMarketplace.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchText.toLowerCase()) ||
      ds.desc.toLowerCase().includes(searchText.toLowerCase()) ||
      ds.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = activeCategory === "全部" || ds.category === activeCategory;
    const matchesModality = activeModality === "全部" || ds.type === activeModality;
    return matchesSearch && matchesCategory && matchesModality;
  });

  const recommendedDatasets = filteredDatasets.filter(d => d.isOfficial).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据集市</h1>
          <p className="page-description">发现和申请高质量数据集</p>
        </div>
      </div>

      {/* 搜索区 */}
      <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索数据集名称、描述、标签..."
            className="w-full pl-12 pr-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-lg">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-4 py-1.5 text-xs rounded-md transition-all duration-200 shadow-sm ${activeCategory === c
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
          <span className="hidden md:block text-border">|</span>
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-lg">
            {modalities.map(m => (
              <button
                key={m}
                onClick={() => setActiveModality(m)}
                className={`px-4 py-1.5 text-xs rounded-md transition-all duration-200 shadow-sm ${activeModality === m
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 推荐区 */}
      {recommendedDatasets.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning fill-warning" /> 推荐数据集
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedDatasets.map(ds => (
              <div key={ds.id} className="rounded-xl border bg-card p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    {ds.isOfficial && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded animate-pulse">官方</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleApply(ds)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50 bg-background/50 backdrop-blur-sm"
                  >
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h4 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">{ds.name}</h4>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{ds.desc}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="status-tag status-tag-info font-medium">{ds.type}</span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{ds.size}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {ds.applyCount}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {ds.tags.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-muted/50 rounded text-[10px] text-muted-foreground border border-transparent hover:border-muted hover:bg-muted transition-colors">{t}</span>
                  ))}
                </div>
                <div className="pt-4 border-t border-primary/10 mt-2">
                  <button
                    onClick={() => handleApply(ds)}
                    className="w-full py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] font-medium flex items-center justify-center gap-2 group/btn"
                  >
                    申请使用
                    <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 全部数据集 */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-4 mt-8 px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">全部数据集</h3>
            <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-normal">
              找到 {filteredDatasets.length} 个结果
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 text-xs border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option>按相关度</option>
              <option>按上架时间</option>
              <option>按数据量</option>
              <option>按申请次数</option>
            </select>
          </div>
        </div>

        {filteredDatasets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map(ds => (
              <div key={ds.id} className="rounded-lg border bg-card p-4 hover:shadow-md transition-all duration-300 cursor-pointer border-transparent hover:border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <Database className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-medium text-foreground truncate">{ds.name}</h4>
                      {ds.isOfficial && <span className="px-1 py-0.5 bg-primary/10 text-primary text-[8px] font-medium rounded shrink-0">官方</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-[10px] text-muted-foreground truncate">{ds.task}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 h-8 leading-relaxed px-1">{ds.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="status-tag status-tag-info text-[10px]">{ds.type}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{ds.size}</span>
                  </div>
                  <button
                    onClick={() => handleApply(ds)}
                    className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
                  >
                    申请使用
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">未找到符合条件的数据集</p>
            <button
              onClick={() => {
                setSearchText("");
                setActiveCategory("全部");
                setActiveModality("全部");
              }}
              className="mt-4 text-xs text-primary hover:underline"
            >
              移除所有筛选
            </button>
          </div>
        )}
      </div>

      <DatasetApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        dataset={selectedDataset}
        existingApplications={mockExistingApps}
        userPermissions={mockUserPermissions}
      />
    </div>

  );
};

export default DataServiceMarketplace;

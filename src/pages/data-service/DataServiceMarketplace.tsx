import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Database, Star, Tag, Eye, ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { mockMarketplace } from "./mockData";
import { INDUSTRY_CATEGORIES } from "@/lib/industry-domains";
import { cn } from "@/lib/utils";

const sidebarTabs = [
  { id: "tech", name: "技术领域" },
  { id: "app", name: "行业领域" },
  { id: "org", name: "组织来源" },
];

const staticCategoryData = {
  tech: [
    { name: "大模型", tags: ["预测训练", "微调", "知识蒸馏", "能力评估", "多模态", "提示词工程", "对齐人类偏好", "强化学习"] },
    { name: "模型能力评估", tags: ["语言理解", "检索增强", "逻辑推理", "编程代码", "智能体", "知识问答", "综合测试", "理科计算"], hasMore: true },
    { name: "计算机视觉", tags: ["目标检测", "语义分割", "实例分割", "图像分类", "关键点检测", "OCR识别", "人体姿态估计", "图像超分辨率"], hasMore: true },
  ],
  org: [
    { name: "官方机构", tags: ["国家数据局", "信通院", "超级大只老咪"] },
    { name: "开源组织", tags: ["清华大学", "北京大学", "复旦大学"] },
    { name: "企业", tags: ["科大讯飞", "阿里巴巴", "腾讯"] },
  ],
};

const DataServiceMarketplace = () => {
  const [activeTab, setActiveTab] = useState("tech");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    tech: [],
    app: [],
    org: []
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const categoryData = useMemo(() => {
    return {
      ...staticCategoryData,
      app: INDUSTRY_CATEGORIES.map(cat => {
        const isExpanded = expandedCategories.includes(cat.name);
        return {
          name: cat.name,
          tags: isExpanded ? cat.subIndustries : cat.subIndustries.slice(0, 8),
          hasMore: cat.subIndustries.length > 8 && !isExpanded
        };
      })
    };
  }, [expandedCategories]);

  const toggleFilter = (tab: string, tag: string) => {
    setSelectedFilters(prev => {
      const current = prev[tab] || [];
      const next = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [tab]: next };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({ tech: [], app: [], org: [] });
    setSearchQuery("");
  };

  // 解析数据集大小字符串以进行排序 (e.g., "16 GB" -> 16, "1.2 TB" -> 1228.8)
  const parseSize = (sizeStr: string) => {
    const num = parseFloat(sizeStr);
    if (sizeStr.includes("TB")) return num * 1024;
    if (sizeStr.includes("GB")) return num;
    if (sizeStr.includes("MB")) return num / 1024;
    return num;
  };

  const sortOptions = [
    { id: "default", label: "综合排序" },
    { id: "time", label: "按最近更新" },
    { id: "subscriptions", label: "按订购量" },
    { id: "size", label: "按数据集大小" },
  ];

  const filteredDatasets = mockMarketplace
    .filter(ds => {
      // Search Text Filter
      const matchesSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.desc.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Sidebar Filters
      const { tech, app, org } = selectedFilters;

      // Category filter (OR within category, AND across categories)
      if (tech.length > 0) {
        const dsTech = (ds as any).technicalDomain || [];
        if (!tech.some(t => dsTech.includes(t))) return false;
      }

      if (app.length > 0) {
        const dsApp = (ds as any).industryDomain || [];
        if (!app.some(t => dsApp.includes(t))) return false;
      }

      if (org.length > 0) {
        if (!org.includes(ds.creator)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortKey === "time") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortKey === "subscriptions") return b.applyCount - a.applyCount;
      if (sortKey === "size") return parseSize(b.size) - parseSize(a.size);
      return 0; // default
    });

  const recommendedDatasets = filteredDatasets.filter(ds => ds.isOfficial).slice(0, 3);

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50/30">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">数据集市</h1>
          <p className="page-description">发现和申请高质量数据集，加速AI模型训练与评估</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* 左侧侧边栏 */}
        <div className="w-[300px] shrink-0">
          <div className="flex items-center gap-6 mb-6 border-b border-slate-200">
            {sidebarTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.id ? "text-primary" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-8 max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
            {categoryData[activeTab as keyof typeof categoryData].map((cat, idx) => (
              <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-1 h-3 bg-primary rounded-full" />
                    {cat.name}
                  </h4>
                  {cat.hasMore && (
                    <button
                      onClick={() => setExpandedCategories(prev => [...prev, cat.name])}
                      className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors font-bold"
                    >
                      MORE <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {cat.tags.map((tag, tIdx) => {
                    const isActive = selectedFilters[activeTab]?.includes(tag);
                    return (
                      <button
                        key={tIdx}
                        onClick={() => toggleFilter(activeTab, tag)}
                        title={tag}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all group text-left shadow-sm shadow-slate-200/50 relative ${isActive
                          ? "border-primary bg-primary/10 translate-x-1"
                          : "border-slate-100 bg-white hover:border-primary/20 hover:bg-primary/5 hover:translate-x-1"
                          }`}
                      >
                        <LayoutGrid className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-slate-300 group-hover:text-primary"}`} />
                        <span className={`text-[11px] truncate font-medium transition-colors ${isActive ? "text-primary font-bold" : "text-slate-500 group-hover:text-slate-900"}`}>{tag}</span>
                        {/* Hover Full Text Overlay - Optimized for sidebar width */}
                        <div className={cn(
                          "invisible group-hover:visible absolute top-0 min-w-full w-max max-w-[260px] bg-white border border-primary/20 rounded-xl px-3 py-1.5 shadow-xl z-50 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200",
                          tIdx % 2 === 0 ? "left-0 origin-left" : "right-0 origin-right"
                        )}>
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[11px] font-bold text-slate-800 break-words leading-tight">{tag}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧核心内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索数据集关键字、标签"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
              {(searchQuery || Object.values(selectedFilters).some(f => f.length > 0)) && (
                <button
                  onClick={clearFilters}
                  className="px-4 h-12 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-colors shrink-0"
                >
                  清除所有筛选
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`h-12 px-4 rounded-xl border transition-all flex items-center gap-2 text-sm shrink-0 font-medium ${isSortOpen ? "border-primary bg-primary/5 text-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className="text-slate-400">⇅</span> {sortOptions.find(o => o.id === sortKey)?.label}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                    {sortOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortKey(option.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortKey === option.id ? "text-primary bg-primary/5 font-semibold" : "text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 推荐数据集 */}
          {recommendedDatasets.length > 0 && searchQuery === "" && (
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-800">
                <Star className="w-4 h-4 text-warning fill-warning" /> 推荐数据集
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedDatasets.map(ds => (
                  <DatasetCard key={ds.id} ds={ds} />
                ))}
              </div>
            </div>
          )}

          {/* 全部数据集 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                全部数据集 <span className="text-xs font-normal text-slate-400">找到 {filteredDatasets.length} 个结果</span>
              </h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDatasets.map(ds => (
                <DatasetCard key={ds.id} ds={ds} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 抽取卡片组件以统一样式
const DatasetCard = ({ ds }: { ds: any }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/data-service/marketplace/${ds.id}`)}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex gap-4 items-start mb-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
          <Database className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 min-w-0">
            <h4 className="font-bold text-base text-slate-800 truncate group-hover:text-primary transition-colors">{ds.name}</h4>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 h-4" title={ds.desc}>
            {ds.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-hidden max-w-full" title={ds.tasks.join(", ")}>
        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 overflow-hidden">
          {ds.tasks.slice(0, 3).map((task: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-md whitespace-nowrap border border-slate-100 hover:bg-slate-100 transition-colors">
              {task}
            </span>
          ))}
          {ds.tasks.length > 3 && (
            <span className="px-1.5 py-1 bg-slate-50 text-slate-400 text-[10px] rounded-md border border-slate-100">...</span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0 overflow-hidden">
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-[10px] text-primary">{ds.creator[0]}</span>
            </div>
          </div>
          <span className="text-xs text-slate-600 font-medium truncate" title={ds.creator}>{ds.creator}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400/80">
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{ds.size}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{ds.applyCount}</span>
          </div>
          <span className="text-[10px]">{ds.updatedAt}</span>
        </div>
      </div>
    </div>
  );
};

export default DataServiceMarketplace;

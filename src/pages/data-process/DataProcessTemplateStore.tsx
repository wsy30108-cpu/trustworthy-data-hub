import { useState } from "react";
import { Search, Star, Download, BookOpen, ArrowUpRight } from "lucide-react";

const storeTemplates = [
  { id: "ST-001", name: "通用文本清洗管线", desc: "适用于中英文文本数据的标准清洗流程，包含去重、脱敏、格式化等", modality: "文本", operators: 6, downloads: 1250, rating: 4.8, author: "官方", category: "数据清洗" },
  { id: "ST-002", name: "图像增强与预处理", desc: "图像数据的标准化预处理模板，支持裁剪、旋转、色彩归一化", modality: "图像", operators: 5, downloads: 890, rating: 4.6, author: "官方", category: "数据增强" },
  { id: "ST-003", name: "多轮对话数据格式化", desc: "将多轮对话原始数据转换为标准SFT训练格式", modality: "文本", operators: 4, downloads: 567, rating: 4.5, author: "官方", category: "格式转换" },
  { id: "ST-004", name: "音频数据标准化套件", desc: "采样率统一、降噪、VAD切分、格式转换一站式处理", modality: "语音", operators: 5, downloads: 345, rating: 4.3, author: "官方", category: "数据清洗" },
  { id: "ST-005", name: "表格数据ETL管线", desc: "缺失值处理→异常值检测→特征编码→格式输出", modality: "表格", operators: 4, downloads: 234, rating: 4.2, author: "社区", category: "数据清洗" },
  { id: "ST-006", name: "视频帧提取与标注", desc: "关键帧提取→分辨率调整→场景切分→元数据注入", modality: "视频", operators: 4, downloads: 189, rating: 4.1, author: "社区", category: "特征提取" },
  { id: "ST-007", name: "敏感信息脱敏专用", desc: "手机号、邮箱、身份证、银行卡、地址等PII信息检测与脱敏", modality: "文本", operators: 3, downloads: 678, rating: 4.7, author: "官方", category: "数据安全" },
  { id: "ST-008", name: "跨语言数据对齐", desc: "多语种平行语料句对齐→质量过滤→格式标准化", modality: "文本", operators: 4, downloads: 412, rating: 4.4, author: "社区", category: "数据对齐" },
];

const categories = ["全部", "数据清洗", "数据增强", "格式转换", "特征提取", "数据安全", "数据对齐"];

const DataProcessTemplateStore = () => {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = storeTemplates.filter(t => {
    if (activeCategory !== "全部" && t.category !== activeCategory) return false;
    if (searchText && !t.name.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模板商店</h1>
          <p className="page-description">浏览和获取社区共享的高质量工作流模板</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索模板..." className="w-full pl-12 pr-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${t.author === "官方" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{t.author}</span>
            </div>
            <h4 className="font-medium text-foreground mb-1 text-sm">{t.name}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.desc}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="status-tag status-tag-info">{t.modality}</span>
              <span className="text-xs text-muted-foreground">{t.operators} 个算子</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-warning" />{t.rating}</span>
                <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{t.downloads}</span>
              </div>
              <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">获取</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProcessTemplateStore;

import { useState } from "react";
import { Search, Plus, Eye, Copy, Trash2, BookOpen, Lock, MoreHorizontal } from "lucide-react";

const mockTemplates = [
  { id: "TPL-001", name: "中英文社交媒体数据预处理", desc: "语言检测→字符过滤→正则替换→异常值统计", modality: "文本", operators: 4, creator: "张明", scope: "机构可见", isOfficial: false, usageCount: 23, createdAt: "2026-02-10", updatedAt: "2026-03-01" },
  { id: "TPL-002", name: "图像质量标准清洗管线", desc: "分辨率检测→模糊度过滤→格式统一→EXIF清理", modality: "图像", operators: 4, creator: "系统", scope: "全平台", isOfficial: true, usageCount: 156, createdAt: "2026-01-01", updatedAt: "2026-02-28" },
  { id: "TPL-003", name: "NLP数据去重与脱敏", desc: "MinHash去重→正则脱敏→敏感词过滤→质量评分", modality: "文本", operators: 4, creator: "系统", scope: "全平台", isOfficial: true, usageCount: 245, createdAt: "2026-01-01", updatedAt: "2026-03-02" },
  { id: "TPL-004", name: "多语种翻译语料清洗", desc: "语言检测→编码转换→低质过滤→去重→对齐", modality: "文本", operators: 5, creator: "王强", scope: "空间可见", isOfficial: false, usageCount: 12, createdAt: "2026-02-20", updatedAt: "2026-02-25" },
  { id: "TPL-005", name: "语音数据标准化流水线", desc: "采样率统一→降噪→静音裁剪→格式转换", modality: "语音", operators: 4, creator: "系统", scope: "全平台", isOfficial: true, usageCount: 89, createdAt: "2026-01-01", updatedAt: "2026-03-03" },
  { id: "TPL-006", name: "表格数据清洗基础模板", desc: "缺失值处理→异常值检测→类型规范→去重", modality: "表格", operators: 4, creator: "赵丽", scope: "空间可见", isOfficial: false, usageCount: 8, createdAt: "2026-03-01", updatedAt: "2026-03-04" },
];

const DataProcessTemplates = () => {
  const [searchText, setSearchText] = useState("");
  const [modalityFilter, setModalityFilter] = useState("全部");

  const filteredTemplates = mockTemplates.filter(t => {
    if (modalityFilter !== "全部" && t.modality !== modalityFilter) return false;
    if (searchText && !t.name.includes(searchText) && !t.desc.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模板列表</h1>
          <p className="page-description">管理和复用数据处理工作流模板</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建模板
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索模板名称或描述..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>文本</option>
          <option>图像</option>
          <option>语音</option>
          <option>视频</option>
          <option>表格</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(t => (
          <div key={t.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                {t.isOfficial && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">官方</span>}
              </div>
              {!t.isOfficial && (
                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/50 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <h4 className="font-medium text-foreground mb-1">{t.name}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.desc}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="status-tag status-tag-info">{t.modality}</span>
              <span className="text-xs text-muted-foreground">{t.operators} 个算子</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">使用 {t.usageCount} 次</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
              <span>{t.creator} · {t.scope}</span>
              <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-muted/50" title="使用模板"><Copy className="w-3.5 h-3.5" /></button>
                <button className="p-1 rounded hover:bg-muted/50" title="查看"><Eye className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProcessTemplates;

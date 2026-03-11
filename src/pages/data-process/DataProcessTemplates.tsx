import { useState } from "react";
import { Search, Plus, Eye, Copy, MoreHorizontal, BookOpen, Users, Globe, Boxes, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  operators: number;
  usageCount: number;
  creator: string;
  thumbnail?: string;
  shareScope?: "cross-space" | "local-space";
  updatedAt: string;
}

const officialTemplates: Template[] = [
  { id: "TPL-001", name: "图像质量标准清洗管线", desc: "分辨率检测→模糊度过滤→格式统一→EXIF清理，适用于大规模图像数据集预处理", tags: ["图像处理"], operators: 4, usageCount: 156, creator: "系统", updatedAt: "2026-02-28" },
  { id: "TPL-002", name: "NLP数据去重与脱敏", desc: "MinHash去重→正则脱敏→敏感词过滤→质量评分，适用于文本语料清洗", tags: ["文本处理"], operators: 4, usageCount: 245, creator: "系统", updatedAt: "2026-03-02" },
  { id: "TPL-003", name: "语音数据标准化流水线", desc: "采样率统一→降噪→静音裁剪→格式转换，适用于ASR训练数据准备", tags: ["语音处理"], operators: 4, usageCount: 89, creator: "系统", updatedAt: "2026-03-03" },
  { id: "TPL-004", name: "多模态数据对齐模板", desc: "图文配对校验→时间戳对齐→缺失补全→格式归一化", tags: ["多模态处理", "图像处理", "文本处理"], operators: 5, usageCount: 67, creator: "系统", updatedAt: "2026-03-05" },
  { id: "TPL-005", name: "视频帧提取与标注管线", desc: "关键帧提取→场景分割→目标检测→标注格式导出", tags: ["视频处理", "图像处理"], operators: 4, usageCount: 34, creator: "系统", updatedAt: "2026-03-06" },
  { id: "TPL-006", name: "表格数据ETL标准模板", desc: "Schema校验→缺失值处理→异常值检测→类型规范→去重", tags: ["表格处理"], operators: 5, usageCount: 112, creator: "系统", updatedAt: "2026-03-07" },
];

const myTemplates: Template[] = [
  { id: "TPL-101", name: "中英文社交媒体数据预处理", desc: "语言检测→字符过滤→正则替换→异常值统计，适用于社交平台抓取数据", tags: ["文本处理"], operators: 4, usageCount: 23, creator: "张明", updatedAt: "2026-03-01" },
  { id: "TPL-102", name: "多语种翻译语料清洗", desc: "语言检测→编码转换→低质过滤→去重→对齐", tags: ["文本处理"], operators: 5, usageCount: 12, creator: "张明", updatedAt: "2026-02-25" },
  { id: "TPL-103", name: "表格数据清洗基础模板", desc: "缺失值处理→异常值检测→类型规范→去重", tags: ["表格处理"], operators: 4, usageCount: 8, creator: "张明", updatedAt: "2026-03-04" },
];

const sharedTemplates: Template[] = [
  { id: "TPL-201", name: "医学影像预处理流水线", desc: "DICOM解析→窗宽窗位调整→尺寸归一化→增强", tags: ["图像处理"], operators: 4, usageCount: 45, creator: "李华", shareScope: "cross-space", updatedAt: "2026-03-02" },
  { id: "TPL-202", name: "客服对话数据清洗", desc: "去重→脱敏→情感标注→意图分类预处理", tags: ["文本处理"], operators: 4, usageCount: 34, creator: "王强", shareScope: "local-space", updatedAt: "2026-03-03" },
  { id: "TPL-203", name: "遥感图像处理管线", desc: "波段合成→辐射校正→几何校正→裁剪", tags: ["图像处理"], operators: 4, usageCount: 28, creator: "赵丽", shareScope: "cross-space", updatedAt: "2026-02-28" },
  { id: "TPL-204", name: "语音情感分析预处理", desc: "降噪→VAD切分→特征提取→标签映射", tags: ["语音处理"], operators: 4, usageCount: 19, creator: "陈明", shareScope: "local-space", updatedAt: "2026-03-05" },
];

const allTags = ["文本处理", "图像处理", "语音处理", "视频处理", "表格处理", "多模态处理"];

const tagColorMap: Record<string, string> = {
  "文本处理": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "图像处理": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "语音处理": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "视频处理": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "表格处理": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "多模态处理": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

const TemplateThumbnail = ({ operators, name }: { operators: number; name: string }) => {
  // Generate a simple workflow topology thumbnail
  const nodes = Array.from({ length: Math.min(operators, 5) }, (_, i) => i);
  return (
    <div className="w-full h-24 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden relative">
      <div className="flex items-center gap-1.5">
        {nodes.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-primary/15 border border-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
            {i < nodes.length - 1 && <div className="w-3 h-px bg-primary/30" />}
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground/50">{name.slice(0, 8)}</div>
    </div>
  );
};

const TemplateCard = ({ t, showActions = false, showShareScope = false }: { t: Template; showActions?: boolean; showShareScope?: boolean }) => (
  <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer group">
    <TemplateThumbnail operators={t.operators} name={t.name} />
    <div className="mt-3">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-foreground text-sm leading-tight line-clamp-1 flex-1">{t.name}</h4>
        {showActions && (
          <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/50 transition-opacity ml-1 shrink-0">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{t.desc}</p>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {t.tags.map(tag => (
          <span key={tag} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${tagColorMap[tag] || "bg-muted text-muted-foreground"}`}>{tag}</span>
        ))}
        {showShareScope && t.shareScope && (
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded inline-flex items-center gap-0.5 ${t.shareScope === "cross-space" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {t.shareScope === "cross-space" ? <><Globe className="w-2.5 h-2.5" />跨空间</> : <><Share2 className="w-2.5 h-2.5" />本空间</>}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2.5 border-t">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Boxes className="w-3 h-3" />{t.operators} 算子</span>
          <span>使用 {t.usageCount} 次</span>
        </div>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-muted/50" title="使用模板"><Copy className="w-3.5 h-3.5" /></button>
          <button className="p-1 rounded hover:bg-muted/50" title="查看"><Eye className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  </div>
);

const TemplateGrid = ({ templates, searchText, tagFilter, showActions, showShareScope, shareScopeFilter }: {
  templates: Template[];
  searchText: string;
  tagFilter: string;
  showActions?: boolean;
  showShareScope?: boolean;
  shareScopeFilter?: string;
}) => {
  const filtered = templates.filter(t => {
    if (tagFilter !== "全部" && !t.tags.includes(tagFilter)) return false;
    if (searchText && !t.name.includes(searchText) && !t.desc.includes(searchText)) return false;
    if (shareScopeFilter && shareScopeFilter !== "全部") {
      if (shareScopeFilter === "跨空间共享" && t.shareScope !== "cross-space") return false;
      if (shareScopeFilter === "本空间共享" && t.shareScope !== "local-space") return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">暂无模板</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map(t => <TemplateCard key={t.id} t={t} showActions={showActions} showShareScope={showShareScope} />)}
    </div>
  );
};

const DataProcessTemplates = () => {
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("全部");
  const [shareScopeFilter, setShareScopeFilter] = useState("全部");

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
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          {allTags.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <Tabs defaultValue="official" className="w-full">
        <TabsList>
          <TabsTrigger value="official" className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            官方模板
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            我的模板
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            共享模板
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official">
          <TemplateGrid templates={officialTemplates} searchText={searchText} tagFilter={tagFilter} />
        </TabsContent>

        <TabsContent value="mine">
          <TemplateGrid templates={myTemplates} searchText={searchText} tagFilter={tagFilter} showActions />
        </TabsContent>

        <TabsContent value="shared">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {["全部", "跨空间共享", "本空间共享"].map(s => (
                <button key={s} onClick={() => setShareScopeFilter(s)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${shareScopeFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>{s}</button>
              ))}
            </div>
          </div>
          <TemplateGrid templates={sharedTemplates} searchText={searchText} tagFilter={tagFilter} showShareScope shareScopeFilter={shareScopeFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataProcessTemplates;

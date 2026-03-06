import { useState } from "react";
import { Search, FileText, Image, Music, Video, Table2, Filter, Download, Eye, ChevronRight, X, LayoutGrid, List } from "lucide-react";

const mockFiles = [
  { id: "F-001", name: "train_finance_sentiment.jsonl", format: "jsonl", size: "45.2MB", modality: "文本", dataset: "中文情感分析训练集", version: "V1.0", uploader: "张明", uploadTime: "2026-02-15", tags: [{ k: "domain", v: "finance" }, { k: "lang", v: "zh" }] },
  { id: "F-002", name: "chest_xray_001.jpg", format: "jpg", size: "2.1MB", modality: "图像", dataset: "医疗影像CT扫描数据集", version: "V3.0", uploader: "李芳", uploadTime: "2026-02-20", tags: [{ k: "body_part", v: "chest" }] },
  { id: "F-003", name: "parallel_corpus_en_zh.txt", format: "txt", size: "128.5MB", modality: "文本", dataset: "多语种平行翻译语料", version: "V2.0", uploader: "王强", uploadTime: "2026-03-01", tags: [{ k: "lang", v: "en-zh" }] },
  { id: "F-004", name: "dialog_customer_service.json", format: "json", size: "67.3MB", modality: "文本", dataset: "智能客服对话语料", version: "V1.0", uploader: "赵丽", uploadTime: "2026-02-25", tags: [{ k: "domain", v: "customer_service" }] },
  { id: "F-005", name: "defect_metal_surface_batch3.zip", format: "zip", size: "1.8GB", modality: "图像", dataset: "工业缺陷检测图像集", version: "V4.0", uploader: "孙伟", uploadTime: "2026-01-15", tags: [{ k: "type", v: "metal_surface" }] },
  { id: "F-006", name: "asr_mandarin_train_005.wav", format: "wav", size: "350MB", modality: "语音", dataset: "中文语音转写ASR数据集", version: "V1.0", uploader: "周婷", uploadTime: "2026-03-02", tags: [{ k: "lang", v: "mandarin" }] },
  { id: "F-007", name: "video_action_recognition.mp4", format: "mp4", size: "2.5GB", modality: "视频", dataset: "视频动作识别数据集", version: "V1.0", uploader: "陈刚", uploadTime: "2026-02-18", tags: [{ k: "task", v: "action_recognition" }] },
  { id: "F-008", name: "stock_prediction_features.csv", format: "csv", size: "15.6MB", modality: "表格", dataset: "金融时序分析数据", version: "V2.0", uploader: "张明", uploadTime: "2026-03-04", tags: [{ k: "domain", v: "finance" }] },
];

const modalityIcons: Record<string, any> = {
  "文本": FileText, "图像": Image, "语音": Music, "视频": Video, "表格": Table2,
};

const DataManagementFileSearch = () => {
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [selectedModality, setSelectedModality] = useState("全部");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [advancedConditions, setAdvancedConditions] = useState([
    { field: "标签", operator: "包含", value: "", logic: "且" },
  ]);

  const modalities = ["全部", "文本", "图像", "语音", "视频", "表格"];

  const filteredFiles = mockFiles.filter(f => {
    if (selectedModality !== "全部" && f.modality !== selectedModality) return false;
    if (searchText && !f.name.toLowerCase().includes(searchText.toLowerCase()) && !f.dataset.includes(searchText)) return false;
    return true;
  });

  const toggleFileSelect = (id: string) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">文件检索</h1>
          <p className="page-description">跨数据集多维度组合检索，快速定位目标文件</p>
        </div>
        {selectedFiles.length > 0 && (
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
            <Download className="w-4 h-4" /> 批量下载 ({selectedFiles.length})
          </button>
        )}
      </div>

      {/* 搜索区 */}
      <div className="rounded-xl border bg-card p-6">
        <div className="relative max-w-3xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="输入关键词搜索文件名、内容摘要、标注信息..."
            className="w-full pl-12 pr-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* 模态筛选 */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {modalities.map(m => (
            <button
              key={m}
              onClick={() => setSelectedModality(m)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                selectedModality === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {m}
            </button>
          ))}
          <span className="mx-2 text-border">|</span>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${showAdvanced ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <Filter className="w-3 h-3" /> 高级检索
          </button>
        </div>

        {/* 高级检索 */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {advancedConditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <select
                    value={cond.logic}
                    onChange={e => {
                      const next = [...advancedConditions];
                      next[i].logic = e.target.value;
                      setAdvancedConditions(next);
                    }}
                    className="px-2 py-1.5 text-xs border rounded bg-card w-16"
                  >
                    <option>且</option>
                    <option>或</option>
                  </select>
                )}
                {i === 0 && <div className="w-16" />}
                <select
                  value={cond.field}
                  onChange={e => {
                    const next = [...advancedConditions];
                    next[i].field = e.target.value;
                    setAdvancedConditions(next);
                  }}
                  className="px-2 py-1.5 text-xs border rounded bg-card w-28"
                >
                  <option>标签</option>
                  <option>文件名</option>
                  <option>文件大小</option>
                  <option>上传人</option>
                  <option>上传时间</option>
                  <option>格式</option>
                </select>
                <select
                  value={cond.operator}
                  onChange={e => {
                    const next = [...advancedConditions];
                    next[i].operator = e.target.value;
                    setAdvancedConditions(next);
                  }}
                  className="px-2 py-1.5 text-xs border rounded bg-card w-24"
                >
                  <option>包含</option>
                  <option>等于</option>
                  <option>大于</option>
                  <option>小于</option>
                  <option>区间</option>
                </select>
                <input
                  value={cond.value}
                  onChange={e => {
                    const next = [...advancedConditions];
                    next[i].value = e.target.value;
                    setAdvancedConditions(next);
                  }}
                  placeholder="输入条件值..."
                  className="flex-1 px-3 py-1.5 text-xs border rounded bg-card"
                />
                <button onClick={() => setAdvancedConditions(prev => prev.filter((_, idx) => idx !== i))} className="p-1 rounded hover:bg-muted/50">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setAdvancedConditions(prev => [...prev, { field: "标签", operator: "包含", value: "", logic: "且" }])}
              className="text-xs text-primary hover:underline"
            >
              + 添加条件
            </button>
          </div>
        )}
      </div>

      {/* 结果工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">共找到 <strong className="text-foreground">{filteredFiles.length}</strong> 个文件</span>
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 text-xs border rounded-lg bg-card">
            <option>按匹配度排序</option>
            <option>按上传时间</option>
            <option>按文件大小</option>
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`p-1.5 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("card")} className={`p-1.5 ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 结果列表 */}
      {viewMode === "list" ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="w-8 py-3 px-4"><input type="checkbox" className="rounded" /></th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">文件名</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">格式</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">大小</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">所属数据集/版本</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标签</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">上传人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">上传时间</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(f => {
                const Icon = modalityIcons[f.modality] || FileText;
                return (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedFiles.includes(f.id)} onChange={() => toggleFileSelect(f.id)} className="rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className="status-tag status-tag-info">{f.modality}</span></td>
                    <td className="py-3 px-4 text-muted-foreground uppercase text-xs">{f.format}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{f.size}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-primary cursor-pointer hover:underline">{f.dataset}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{f.version}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {f.tags.map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{t.k}:{t.v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{f.uploader}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{f.uploadTime}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 rounded hover:bg-muted/50" title="预览"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-muted/50" title="下载"><Download className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">共 {filteredFiles.length} 个文件</span>
            <div className="flex items-center gap-2">
              <select className="px-2 py-1 text-xs border rounded bg-card">
                <option>20条/页</option>
                <option>50条/页</option>
                <option>100条/页</option>
              </select>
              <div className="flex gap-1">
                <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map(f => {
            const Icon = modalityIcons[f.modality] || FileText;
            return (
              <div key={f.id} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.format.toUpperCase()} · {f.size}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="text-primary cursor-pointer hover:underline">{f.dataset}</span> / {f.version}
                </div>
                <div className="flex gap-1 flex-wrap mb-3">
                  {f.tags.map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{t.k}:{t.v}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{f.uploader} · {f.uploadTime}</span>
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-muted/50"><Eye className="w-3 h-3" /></button>
                    <button className="p-1 rounded hover:bg-muted/50"><Download className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataManagementFileSearch;

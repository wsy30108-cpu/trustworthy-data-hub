import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Share2, Upload, Tag } from "lucide-react";

const tabs = ["我的数据集", "我订购的数据集", "分享给我的数据集"];

const mockDatasets = [
  { id: "DS-001", name: "中文情感分析训练集", modality: "文本", purpose: "模型微调", type: "文本分类", scope: "空间全体", versions: 3, size: "2.4GB", files: 12350, tags: [{ k: "语言", v: "中文" }, { k: "领域", v: "金融" }], status: "活跃", creator: "张明", createdAt: "2026-02-15", updatedAt: "2026-03-01" },
  { id: "DS-002", name: "医疗影像CT扫描数据集", modality: "图像", purpose: "预训练", type: "-", scope: "指定用户", versions: 5, size: "45.8GB", files: 50000, tags: [{ k: "领域", v: "医疗" }], status: "活跃", creator: "李芳", createdAt: "2026-01-20", updatedAt: "2026-02-28" },
  { id: "DS-003", name: "多语种平行翻译语料", modality: "文本", purpose: "预训练", type: "机器翻译", scope: "所有者", versions: 2, size: "8.1GB", files: 2000000, tags: [{ k: "语言", v: "多语种" }], status: "活跃", creator: "王强", createdAt: "2026-02-01", updatedAt: "2026-03-03" },
  { id: "DS-004", name: "智能客服对话语料", modality: "文本", purpose: "模型微调", type: "对话生成", scope: "空间全体", versions: 1, size: "1.2GB", files: 800000, tags: [{ k: "领域", v: "客服" }], status: "活跃", creator: "赵丽", createdAt: "2026-02-20", updatedAt: "2026-02-25" },
  { id: "DS-005", name: "工业缺陷检测图像集", modality: "图像", purpose: "模型微调", type: "-", scope: "指定角色", versions: 4, size: "23.5GB", files: 35000, tags: [{ k: "领域", v: "工业" }, { k: "标注", v: "已标注" }], status: "归档", creator: "孙伟", createdAt: "2025-12-10", updatedAt: "2026-01-15" },
];

const DataManagementDatasets = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据集管理</h1>
          <p className="page-description">管理您的数据集、订购的数据集和分享给您的数据集</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新增数据集
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === i
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索数据集名称..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部模态</option>
          <option>文本</option>
          <option>图像</option>
          <option>语音</option>
          <option>视频</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部状态</option>
          <option>活跃</option>
          <option>归档</option>
        </select>
        <button className="px-3 py-2 text-sm border rounded-lg bg-card text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Filter className="w-4 h-4" /> 更多筛选
        </button>
      </div>

      {/* 数据表格 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集名称</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据用途</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">版本数</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">文件数</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">大小</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标签</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">更新时间</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockDatasets.map(ds => (
                <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{ds.name}</div>
                    <div className="text-xs text-muted-foreground">{ds.id}</div>
                  </td>
                  <td className="py-3 px-4"><span className="status-tag status-tag-info">{ds.modality}</span></td>
                  <td className="py-3 px-4 text-muted-foreground">{ds.purpose}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{ds.versions}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{ds.files.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{ds.size}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {ds.tags.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                          {t.k}: {t.v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${ds.status === "活跃" ? "status-tag-success" : "status-tag-default"}`}>
                      {ds.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{ds.creator}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{ds.updatedAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted/50" title="分享"><Share2 className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted/50" title="更多"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 分页 */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {mockDatasets.length} 条数据</span>
          <div className="flex items-center gap-2">
            <select className="px-2 py-1 text-xs border rounded bg-card">
              <option>10条/页</option>
              <option>20条/页</option>
              <option>50条/页</option>
            </select>
            <div className="flex gap-1">
              <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
              <button className="w-7 h-7 text-xs rounded border hover:bg-muted/50 text-muted-foreground">2</button>
              <button className="w-7 h-7 text-xs rounded border hover:bg-muted/50 text-muted-foreground">3</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementDatasets;

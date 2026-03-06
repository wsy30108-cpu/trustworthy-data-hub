import { useState } from "react";
import { Search, Plus, Eye, Edit, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Database } from "lucide-react";

const mockListings = [
  { id: "LS-001", name: "中文通用NER标注数据集", type: "文本", category: "通识数据集", status: "已上架", applyCount: 234, authorizedUsers: 56, source: "自主发布", publisher: "张明", publishedAt: "2026-02-15", isOfficial: false },
  { id: "LS-002", name: "ImageNet-21K精选子集", type: "图像", category: "通识数据集", status: "已上架", applyCount: 567, authorizedUsers: 120, source: "预置数据集", publisher: "系统", publishedAt: "2026-01-01", isOfficial: true },
  { id: "LS-003", name: "金融行业研报摘要数据", type: "文本", category: "行业专识数据集", status: "已上架", applyCount: 189, authorizedUsers: 45, source: "自主发布", publisher: "李芳", publishedAt: "2026-02-20", isOfficial: false },
  { id: "LS-004", name: "中英文平行语料v3", type: "文本", category: "通识数据集", status: "已上架", applyCount: 892, authorizedUsers: 200, source: "预置数据集", publisher: "系统", publishedAt: "2026-01-15", isOfficial: true },
  { id: "LS-005", name: "智能制造缺陷检测数据集", type: "图像", category: "行业专识数据集", status: "已下架", applyCount: 78, authorizedUsers: 20, source: "自主发布", publisher: "孙伟", publishedAt: "2026-02-10", isOfficial: false },
  { id: "LS-006", name: "中文语音转写ASR数据集", type: "语音", category: "通识数据集", status: "已上架", applyCount: 345, authorizedUsers: 80, source: "预置数据集", publisher: "系统", publishedAt: "2026-01-20", isOfficial: true },
  { id: "LS-007", name: "电商商品评论数据集", type: "文本", category: "行业通识数据集", status: "异常", applyCount: 45, authorizedUsers: 12, source: "自主发布", publisher: "赵丽", publishedAt: "2026-03-01", isOfficial: false },
];

const statusTag = (s: string) => {
  if (s === "已上架") return "status-tag-success";
  if (s === "已下架") return "status-tag-default";
  if (s === "异常") return "status-tag-error";
  return "status-tag-warning";
};

const DataServiceListing = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");

  const filtered = mockListings.filter(l => {
    if (statusFilter !== "全部" && l.status !== statusFilter) return false;
    if (searchText && !l.name.includes(searchText)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">上架管理</h1>
          <p className="page-description">管理数据集市中的上架数据集，包括自主发布和预置数据集</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新增预置数据集
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索数据集名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部</option>
          <option>已上架</option>
          <option>已下架</option>
          <option>异常</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部分类</option>
          <option>通识数据集</option>
          <option>行业通识数据集</option>
          <option>行业专识数据集</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据集名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">分类</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">来源</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">申请次数</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">已授权用户</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">上架时间</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{l.name}</span>
                        {l.isOfficial && <span className="px-1 py-0.5 bg-primary/10 text-primary text-[8px] font-medium rounded">官方</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{l.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4"><span className="status-tag status-tag-info">{l.type}</span></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{l.category}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{l.source}</td>
                <td className="py-3 px-4"><span className={`status-tag ${statusTag(l.status)}`}>{l.status}</span></td>
                <td className="py-3 px-4 text-right text-muted-foreground">{l.applyCount}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{l.authorizedUsers}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{l.publishedAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1 rounded hover:bg-muted/50" title="查看"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                    <button className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                    {l.status === "已上架" && <button className="p-1 rounded hover:bg-muted/50" title="下架"><ArrowDownCircle className="w-4 h-4 text-warning" /></button>}
                    {l.status === "已下架" && <button className="p-1 rounded hover:bg-muted/50" title="重新上架"><ArrowUpCircle className="w-4 h-4 text-success" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 条数据</span>
          <button className="w-7 h-7 text-xs rounded border bg-primary text-primary-foreground">1</button>
        </div>
      </div>
    </div>
  );
};

export default DataServiceListing;

import { useState } from "react";
import { Plus, Search, Play, Copy, Trash2, Eye, MoreHorizontal, Filter } from "lucide-react";

const mockWorkflows = [
  { id: "WF-001", name: "中文文本清洗标准流程", desc: "包含去重、脱敏、格式化等8个算子", instances: 23, lastStatus: "成功", input: "中文情感数据集", output: "清洗后数据集V2", creator: "张明", createdAt: "2026-02-15", updatedAt: "2026-03-04" },
  { id: "WF-002", name: "图像质量筛选管线", desc: "分辨率过滤→模糊检测→美学评分", instances: 15, lastStatus: "运行中", input: "医疗影像数据集", output: "高质量图像集", creator: "李芳", createdAt: "2026-02-20", updatedAt: "2026-03-05" },
  { id: "WF-003", name: "多语种翻译数据预处理", desc: "语言检测→编码转换→低质过滤→去重", instances: 8, lastStatus: "失败", input: "翻译平行语料", output: "清洗后语料V3", creator: "王强", createdAt: "2026-03-01", updatedAt: "2026-03-03" },
  { id: "WF-004", name: "对话数据脱敏流水线", desc: "手机号脱敏→邮箱脱敏→地址脱敏", instances: 42, lastStatus: "成功", input: "客服对话数据", output: "脱敏对话数据", creator: "赵丽", createdAt: "2026-01-10", updatedAt: "2026-03-02" },
];

const statusColors: Record<string, string> = {
  "成功": "status-tag-success",
  "运行中": "status-tag-info",
  "失败": "status-tag-error",
  "等待中": "status-tag-warning",
};

const DataProcessWorkflows = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">工作流</h1>
          <p className="page-description">创建和管理数据处理工作流</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50">
            基于模板新建
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
            <Plus className="w-4 h-4" /> 新建自定义工作流
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索工作流名称..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部状态</option>
          <option>成功</option>
          <option>运行中</option>
          <option>失败</option>
        </select>
      </div>

      {/* 工作流列表 */}
      <div className="grid gap-4">
        {mockWorkflows.map(wf => (
          <div key={wf.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-foreground">{wf.name}</h3>
                  <span className={`status-tag ${statusColors[wf.lastStatus]}`}>{wf.lastStatus}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{wf.desc}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>输入: {wf.input}</span>
                  <span>→</span>
                  <span>输出: {wf.output}</span>
                  <span>·</span>
                  <span>运行 {wf.instances} 次</span>
                  <span>·</span>
                  <span>创建人: {wf.creator}</span>
                  <span>·</span>
                  <span>更新: {wf.updatedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="运行">
                  <Play className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="编辑画布">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="复制">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="更多">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProcessWorkflows;

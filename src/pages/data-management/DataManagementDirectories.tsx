import { useState } from "react";
import { FolderTree, ChevronRight, ChevronDown, Plus, Edit, Trash2, Database, Lock, Globe, Users } from "lucide-react";

interface CatalogNode {
  id: string;
  name: string;
  type: "system" | "custom";
  desc: string;
  optionType: string;
  status: "启用" | "停用";
  scope: string;
  children?: CatalogNode[];
  datasets?: { id: string; name: string; modality: string; versions: number; scope: string }[];
}

const mockCatalogTree: CatalogNode[] = [
  {
    id: "sys-1", name: "数据模态", type: "system", desc: "按数据模态分类", optionType: "单选", status: "启用", scope: "全局",
    children: [
      { id: "sys-1-1", name: "文本数据", type: "system", desc: "文本类数据集", optionType: "单选", status: "启用", scope: "全局",
        datasets: [
          { id: "DS-001", name: "中文情感分析训练集", modality: "文本", versions: 3, scope: "空间全体" },
          { id: "DS-003", name: "多语种平行翻译语料", modality: "文本", versions: 2, scope: "所有者" },
          { id: "DS-004", name: "智能客服对话语料", modality: "文本", versions: 1, scope: "空间全体" },
        ]
      },
      { id: "sys-1-2", name: "图像数据", type: "system", desc: "图像类数据集", optionType: "单选", status: "启用", scope: "全局",
        datasets: [
          { id: "DS-002", name: "医疗影像CT扫描数据集", modality: "图像", versions: 5, scope: "指定用户" },
          { id: "DS-005", name: "工业缺陷检测图像集", modality: "图像", versions: 4, scope: "指定角色" },
        ]
      },
      { id: "sys-1-3", name: "语音数据", type: "system", desc: "语音类数据集", optionType: "单选", status: "启用", scope: "全局", datasets: [] },
      { id: "sys-1-4", name: "视频数据", type: "system", desc: "视频类数据集", optionType: "单选", status: "启用", scope: "全局", datasets: [] },
    ],
  },
  {
    id: "sys-2", name: "数据用途", type: "system", desc: "按数据用途分类", optionType: "单选", status: "启用", scope: "全局",
    children: [
      { id: "sys-2-1", name: "模型微调", type: "system", desc: "用于微调场景", optionType: "单选", status: "启用", scope: "全局", datasets: [] },
      { id: "sys-2-2", name: "预训练", type: "system", desc: "用于预训练", optionType: "单选", status: "启用", scope: "全局", datasets: [] },
    ],
  },
  {
    id: "cus-1", name: "行业领域", type: "custom", desc: "自定义行业分类", optionType: "多选", status: "启用", scope: "空间内",
    children: [
      { id: "cus-1-1", name: "金融", type: "custom", desc: "金融行业数据", optionType: "多选", status: "启用", scope: "空间内",
        datasets: [{ id: "DS-001", name: "中文情感分析训练集", modality: "文本", versions: 3, scope: "空间全体" }]
      },
      { id: "cus-1-2", name: "医疗", type: "custom", desc: "医疗行业数据", optionType: "多选", status: "启用", scope: "空间内",
        datasets: [{ id: "DS-002", name: "医疗影像CT扫描数据集", modality: "图像", versions: 5, scope: "指定用户" }]
      },
      { id: "cus-1-3", name: "工业制造", type: "custom", desc: "工业制造数据", optionType: "多选", status: "启用", scope: "空间内", datasets: [] },
    ],
  },
];

const DataManagementDirectories = () => {
  const [expandedNodes, setExpandedNodes] = useState<string[]>(["sys-1", "cus-1"]);
  const [selectedNode, setSelectedNode] = useState<CatalogNode | null>(mockCatalogTree[0].children?.[0] || null);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const renderTree = (nodes: CatalogNode[], depth = 0) => (
    <div>
      {nodes.map(node => (
        <div key={node.id}>
          <div
            onClick={() => { setSelectedNode(node); if (node.children) toggleExpand(node.id); }}
            className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer text-sm transition-colors ${
              selectedNode?.id === node.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {node.children ? (
              expandedNodes.includes(node.id) ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
            ) : <div className="w-3" />}
            <FolderTree className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
            {node.type === "system" && <Lock className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />}
          </div>
          {node.children && expandedNodes.includes(node.id) && renderTree(node.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  const scopeIcon = (scope: string) => {
    if (scope === "全局") return <Globe className="w-3 h-3" />;
    if (scope === "空间内") return <Users className="w-3 h-3" />;
    return <Lock className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据目录</h1>
          <p className="page-description">以目录树形态浏览和管理数据集的逻辑分类归属</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建自定义目录
        </button>
      </div>

      <div className="flex gap-6">
        {/* 左侧目录树 */}
        <div className="w-64 shrink-0 rounded-lg border bg-card p-3">
          <div className="text-xs font-medium text-muted-foreground mb-3 px-3">目录树</div>
          {renderTree(mockCatalogTree)}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 space-y-6">
          {selectedNode ? (
            <>
              {/* 目录信息 */}
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-foreground">{selectedNode.name}</h3>
                      <span className={`status-tag ${selectedNode.type === "system" ? "status-tag-info" : "status-tag-success"}`}>
                        {selectedNode.type === "system" ? "系统目录" : "自定义目录"}
                      </span>
                      <span className={`status-tag ${selectedNode.status === "启用" ? "status-tag-success" : "status-tag-default"}`}>
                        {selectedNode.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedNode.desc}</p>
                  </div>
                  {selectedNode.type === "custom" && (
                    <div className="flex gap-1">
                      <button className="p-2 rounded-md hover:bg-muted/50"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-2 rounded-md hover:bg-muted/50"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">选项类型：</span>
                    <span className="text-foreground">{selectedNode.optionType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">权限范围：</span>
                    {scopeIcon(selectedNode.scope)}
                    <span className="text-foreground">{selectedNode.scope}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">数据集数量：</span>
                    <span className="text-foreground">{selectedNode.datasets?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* 关联数据集列表 */}
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b flex items-center justify-between">
                  <h4 className="text-sm font-medium">关联数据集</h4>
                </div>
                {selectedNode.datasets && selectedNode.datasets.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b">
                        <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground">数据集名称</th>
                        <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground">模态</th>
                        <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground">版本数</th>
                        <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground">可见范围</th>
                        <th className="text-center py-3 px-5 text-xs font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedNode.datasets.map(ds => (
                        <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">{ds.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5"><span className="status-tag status-tag-info">{ds.modality}</span></td>
                          <td className="py-3 px-5 text-right text-muted-foreground">{ds.versions}</td>
                          <td className="py-3 px-5 text-muted-foreground">{ds.scope}</td>
                          <td className="py-3 px-5 text-center">
                            <button className="text-xs text-primary hover:underline">查看版本</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">该目录下暂无关联数据集</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">请在左侧选择一个目录节点</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagementDirectories;

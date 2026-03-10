import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Power, FolderTree, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CatalogType = "system" | "custom";
type SelectionMode = "single" | "multi";

interface CatalogNode {
  id: number;
  name: string;
  type: CatalogType;
  desc: string;
  datasets: number;
  status: "启用" | "停用";
  selectionMode: SelectionMode;
  optionValues: string[];
  children: CatalogNode[];
}

const mockCatalogs: CatalogNode[] = [
  {
    id: 1, name: "文本数据", type: "system", desc: "文本类数据集目录", datasets: 3421, status: "启用",
    selectionMode: "single", optionValues: ["文本内容", "结构化文本"],
    children: [
      {
        id: 11, name: "自然语言理解", type: "system", desc: "", datasets: 1200, status: "启用",
        selectionMode: "single", optionValues: ["语义分析", "意图识别"],
        children: [
          {
            id: 111, name: "情感分析", type: "system", desc: "情感极性分类", datasets: 450, status: "启用",
            selectionMode: "single", optionValues: ["正面", "负面", "中性"],
            children: [
              { id: 1111, name: "商品评价情感", type: "system", desc: "电商评价", datasets: 200, status: "启用", selectionMode: "multi", optionValues: ["好评", "差评", "中评"], children: [] },
              { id: 1112, name: "社交媒体情感", type: "system", desc: "社交平台", datasets: 250, status: "启用", selectionMode: "single", optionValues: ["积极", "消极"], children: [] },
            ],
          },
          { id: 112, name: "意图识别", type: "system", desc: "", datasets: 380, status: "启用", selectionMode: "single", optionValues: ["查询", "指令"], children: [] },
          { id: 113, name: "文本蕴含", type: "system", desc: "", datasets: 370, status: "启用", selectionMode: "single", optionValues: [], children: [] },
        ],
      },
      { id: 12, name: "机器翻译", type: "system", desc: "", datasets: 890, status: "启用", selectionMode: "single", optionValues: ["中译英", "英译中"], children: [] },
      { id: 13, name: "文本生成", type: "system", desc: "", datasets: 1331, status: "启用", selectionMode: "single", optionValues: [], children: [] },
    ],
  },
  {
    id: 2, name: "图片数据", type: "system", desc: "图像类数据集目录", datasets: 2156, status: "启用",
    selectionMode: "single", optionValues: ["RGB图像", "灰度图像"],
    children: [
      { id: 21, name: "目标检测", type: "system", desc: "", datasets: 856, status: "启用", selectionMode: "multi", optionValues: ["行人检测", "车辆检测", "物体检测"], children: [] },
      { id: 22, name: "图像分类", type: "system", desc: "", datasets: 1300, status: "启用", selectionMode: "single", optionValues: [], children: [] },
    ],
  },
  { id: 3, name: "音频数据", type: "system", desc: "音频类数据集目录", datasets: 987, status: "启用", selectionMode: "single", optionValues: ["语音", "音乐", "环境音"], children: [] },
  { id: 4, name: "视频数据", type: "system", desc: "视频类数据集目录", datasets: 432, status: "停用", selectionMode: "single", optionValues: ["短视频", "长视频"], children: [] },
  { id: 5, name: "多模态数据", type: "system", desc: "多模态混合数据集目录", datasets: 1245, status: "启用", selectionMode: "multi", optionValues: ["图文对", "视频文本", "音频文本"], children: [] },
  {
    id: 6, name: "NLP团队自定义目录", type: "custom", desc: "NLP研究团队专属数据分类", datasets: 567, status: "启用",
    selectionMode: "single", optionValues: ["训练集", "验证集", "测试集"],
    children: [
      { id: 61, name: "情感分析", type: "custom", desc: "", datasets: 234, status: "启用", selectionMode: "single", optionValues: [], children: [] },
      { id: 62, name: "命名实体识别", type: "custom", desc: "", datasets: 333, status: "启用", selectionMode: "single", optionValues: [], children: [] },
    ],
  },
];

const EXPAND_STORAGE_KEY = "console-catalog-expanded";

// Flatten tree to get all possible parent nodes for select
function flattenForParentSelect(nodes: CatalogNode[], level = 0, maxLevel = 3): { id: number; name: string; level: number }[] {
  const result: { id: number; name: string; level: number }[] = [];
  for (const node of nodes) {
    if (level < maxLevel) {
      result.push({ id: node.id, name: node.name, level });
      if (node.children.length > 0) {
        result.push(...flattenForParentSelect(node.children, level + 1, maxLevel));
      }
    }
  }
  return result;
}

// Validation helpers
const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

const ConsoleCatalog = () => {
  const [tab, setTab] = useState<CatalogType>("system");
  const [search, setSearch] = useState("");
  const [catalogs, setCatalogs] = useState<CatalogNode[]>(mockCatalogs);
  const [expanded, setExpanded] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(EXPAND_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showCreate, setShowCreate] = useState(false);
  const [editingNode, setEditingNode] = useState<CatalogNode | null>(null);

  // Form state
  const [formType, setFormType] = useState<CatalogType>("system");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSelectionMode, setFormSelectionMode] = useState<SelectionMode>("single");
  const [formOptionValues, setFormOptionValues] = useState("");
  const [formParentId, setFormParentId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem(EXPAND_STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const toggleExpand = useCallback((id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const filtered = catalogs.filter(c => {
    if (c.type !== tab) return false;
    if (search && !c.name.includes(search)) return false;
    return true;
  });

  const parentOptions = flattenForParentSelect(catalogs.filter(c => c.type === formType));

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormSelectionMode("single");
    setFormOptionValues("");
    setFormParentId(null);
    setFormErrors({});
    setEditingNode(null);
  };

  const openCreate = () => {
    resetForm();
    setFormType(tab);
    setShowCreate(true);
  };

  const openEdit = (node: CatalogNode) => {
    setEditingNode(node);
    setFormType(node.type);
    setFormName(node.name);
    setFormDesc(node.desc);
    setFormSelectionMode(node.selectionMode);
    setFormOptionValues(node.optionValues.join("\n"));
    setFormParentId(null);
    setFormErrors({});
    setShowCreate(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = "请输入目录名称";
    } else if (!NAME_REGEX.test(formName.trim())) {
      errors.name = "目录名称仅支持中英文、数字和下划线";
    } else if (formName.trim().length < 2 || formName.trim().length > 50) {
      errors.name = "目录名称长度需在2-50个字符之间";
    }

    const lines = formOptionValues.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      errors.optionValues = "请输入选项值，每行填写一个选项";
    } else {
      const tooLong = lines.find(l => l.length > 30);
      if (tooLong) {
        errors.optionValues = "单个选项值长度不可超过30个字符";
      }
    }

    if (formDesc.length > 300) {
      errors.desc = "描述内容不可超过300个字符";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    toast({ title: editingNode ? "目录已更新" : "目录已创建", description: `${formName.trim()} 操作成功` });
    setShowCreate(false);
    resetForm();
  };

  const handleDescChange = (val: string) => {
    if (val.length <= 300) {
      setFormDesc(val);
      setFormErrors(prev => ({ ...prev, desc: "" }));
    } else {
      setFormDesc(val.slice(0, 300));
      setFormErrors(prev => ({ ...prev, desc: "描述内容不可超过300个字符" }));
    }
  };

  // Render tree rows recursively
  const renderRows = (nodes: CatalogNode[], level = 0): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];
    for (const node of nodes) {
      const hasChildren = node.children.length > 0;
      const isExpanded = expanded.includes(node.id);
      const indent = 16 + level * 28;

      rows.push(
        <tr key={node.id} className={`border-b hover:bg-muted/20 ${level > 0 ? "bg-muted/5" : ""}`}>
          <td className="py-3 px-4 font-medium" style={{ paddingLeft: indent }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => toggleExpand(node.id)} className="p-0.5 rounded hover:bg-muted/50 shrink-0">
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
              ) : (
                <span className="w-4.5" />
              )}
              <FolderTree className={`w-4 h-4 shrink-0 ${level === 0 ? "text-primary" : "text-muted-foreground"}`} />
              <span className={level === 0 ? "" : "text-muted-foreground"}>{node.name}</span>
            </div>
          </td>
          <td className="py-3 px-4">
            <span className="text-xs text-muted-foreground">{node.selectionMode === "single" ? "单选" : "多选"}</span>
          </td>
          <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{node.desc || "—"}</td>
          <td className="py-3 px-4">{node.datasets.toLocaleString()}</td>
          <td className="py-3 px-4">
            <span className={`status-tag ${node.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{node.status}</span>
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(node)} className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="p-1 rounded hover:bg-muted/50" title="启用/停用"><Power className="w-3.5 h-3.5" /></button>
            </div>
          </td>
        </tr>
      );

      if (isExpanded && hasChildren && level < 3) {
        rows.push(...renderRows(node.children, level + 1));
      }
    }
    return rows;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据目录管理</h1>
          <p className="page-description">管理系统目录和自定义目录的配置与权限，支持最多四级目录层级</p>
        </div>
        <Button onClick={openCreate} size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增目录
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          <button onClick={() => setTab("system")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "system" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            系统目录
          </button>
          <button onClick={() => setTab("custom")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "custom" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            自定义目录
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索目录名称..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["目录名称", "选项类型", "描述", "数据集数", "状态", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderRows(filtered)}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNode ? "编辑数据目录" : "新增数据目录"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type */}
            <div>
              <Label className="mb-1.5 block">目录类型</Label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as CatalogType)}
                disabled={!!editingNode}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="system">系统目录</option>
                <option value="custom">自定义目录</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <Label className="mb-1.5 block">目录名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formName}
                onChange={e => {
                  setFormName(e.target.value);
                  setFormErrors(prev => ({ ...prev, name: "" }));
                }}
                placeholder="输入目录名称（2-50个字符）"
                maxLength={50}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
            </div>

            {/* Selection Mode */}
            <div>
              <Label className="mb-1.5 block">关联选项配置</Label>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-3">
                <button
                  onClick={() => setFormSelectionMode("single")}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${formSelectionMode === "single" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  单选
                </button>
                <button
                  onClick={() => setFormSelectionMode("multi")}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${formSelectionMode === "multi" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  多选
                </button>
              </div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">选项值 <span className="text-destructive">*</span>（每行一个选项，单个≤30字符）</Label>
              <Textarea
                value={formOptionValues}
                onChange={e => {
                  setFormOptionValues(e.target.value);
                  setFormErrors(prev => ({ ...prev, optionValues: "" }));
                }}
                placeholder={"文本内容\n图像内容\n音频内容"}
                rows={4}
                className={formErrors.optionValues ? "border-destructive" : ""}
              />
              {formErrors.optionValues && <p className="text-xs text-destructive mt-1">{formErrors.optionValues}</p>}
            </div>

            {/* Description */}
            <div>
              <Label className="mb-1.5 block">描述</Label>
              <Textarea
                value={formDesc}
                onChange={e => handleDescChange(e.target.value)}
                rows={2}
                placeholder="输入目录描述（选填）"
                className={formErrors.desc ? "border-destructive" : ""}
              />
              <div className="flex justify-between mt-1">
                {formErrors.desc ? <p className="text-xs text-destructive">{formErrors.desc}</p> : <span />}
                <span className="text-xs text-muted-foreground">{formDesc.length}/300</span>
              </div>
            </div>

            {/* Parent */}
            {!editingNode && (
              <div>
                <Label className="mb-1.5 block">父级目录（可选）</Label>
                <select
                  value={formParentId ?? ""}
                  onChange={e => setFormParentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="">无（顶级目录）</option>
                  {parentOptions.map(p => (
                    <option key={p.id} value={p.id}>{"　".repeat(p.level)}{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>取消</Button>
            <Button onClick={handleSubmit}>{editingNode ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsoleCatalog;

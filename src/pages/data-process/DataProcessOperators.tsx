import { useState } from "react";
import { Search, Plus, Boxes, Eye, Edit, Trash2, MoreHorizontal, CheckCircle, Clock, XCircle } from "lucide-react";

const categoryTree = [
  {
    modality: "文本", functions: [
      { name: "去重", operators: [{ id: "OP-001", name: "MinHash去重", desc: "基于MinHash算法的文本近似去重", status: "在线", version: "V2.1", type: "内置" }, { id: "OP-002", name: "精确去重", desc: "基于MD5/SHA256的精确重复检测", status: "在线", version: "V1.0", type: "内置" }] },
      { name: "过滤", operators: [{ id: "OP-003", name: "长度过滤", desc: "按字符/词/句数过滤文本", status: "在线", version: "V1.2", type: "内置" }, { id: "OP-004", name: "语言过滤", desc: "检测并过滤指定语言", status: "在线", version: "V1.0", type: "内置" }, { id: "OP-005", name: "质量过滤", desc: "基于困惑度的低质量文本过滤", status: "在线", version: "V1.1", type: "内置" }] },
      { name: "格式化", operators: [{ id: "OP-006", name: "Unicode规范化", desc: "NFKC/NFC编码规范化", status: "在线", version: "V1.0", type: "内置" }] },
      { name: "脱敏", operators: [{ id: "OP-007", name: "PII脱敏", desc: "手机号/邮箱/身份证等敏感信息脱敏", status: "在线", version: "V2.0", type: "内置" }] },
    ]
  },
  {
    modality: "图像", functions: [
      { name: "过滤", operators: [{ id: "OP-008", name: "分辨率过滤", desc: "按宽高像素阈值过滤图像", status: "在线", version: "V1.0", type: "内置" }, { id: "OP-009", name: "模糊检测", desc: "拉普拉斯方差检测模糊图像", status: "在线", version: "V1.0", type: "内置" }] },
      { name: "格式化", operators: [{ id: "OP-010", name: "格式转换", desc: "支持JPG/PNG/WebP互转", status: "在线", version: "V1.0", type: "内置" }] },
    ]
  },
];

const customOperators = [
  { id: "COP-001", name: "金融术语提取", desc: "基于规则+模型的金融专业术语抽取", status: "在线", version: "V1.0", type: "自定义", creator: "张明", createdAt: "2026-02-15" },
  { id: "COP-002", name: "医疗图像增强", desc: "CLAHE直方图均衡化+去噪", status: "测试中", version: "V0.3", type: "自定义", creator: "李芳", createdAt: "2026-03-01" },
  { id: "COP-003", name: "多标签分类器", desc: "基于BERT的多标签文本分类", status: "已下线", version: "V1.2", type: "自定义", creator: "王强", createdAt: "2026-01-20" },
];

const statusIcon = (s: string) => {
  if (s === "在线") return <CheckCircle className="w-3 h-3 text-success" />;
  if (s === "测试中") return <Clock className="w-3 h-3 text-warning" />;
  return <XCircle className="w-3 h-3 text-muted-foreground" />;
};

const DataProcessOperators = () => {
  const [tab, setTab] = useState<"builtin" | "custom">("builtin");
  const [searchText, setSearchText] = useState("");
  const [expandedModality, setExpandedModality] = useState("文本");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">算子管理</h1>
          <p className="page-description">浏览内置算子库和管理自定义算子</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> 新建自定义算子
        </button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {[{ key: "builtin", label: "内置算子库" }, { key: "custom", label: "自定义算子" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索算子名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      {tab === "builtin" ? (
        <div className="space-y-4">
          {categoryTree.map(cat => (
            <div key={cat.modality} className="rounded-lg border bg-card overflow-hidden">
              <button onClick={() => setExpandedModality(expandedModality === cat.modality ? "" : cat.modality)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/20">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{cat.modality}</span>
                  <span className="text-xs text-muted-foreground">({cat.functions.reduce((acc, f) => acc + f.operators.length, 0)} 个算子)</span>
                </div>
              </button>
              {expandedModality === cat.modality && (
                <div className="border-t">
                  {cat.functions.map(fn => (
                    <div key={fn.name} className="px-5 py-3 border-b last:border-0">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{fn.name}</p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fn.operators.map(op => (
                          <div key={op.id} className="rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer group">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><Boxes className="w-4 h-4 text-primary" /></div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{op.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{op.version}</p>
                                </div>
                              </div>
                              {statusIcon(op.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{op.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">算子名称</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">版本</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {customOperators.map(op => (
                <tr key={op.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{op.name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{op.desc}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag flex items-center gap-1 w-fit ${op.status === "在线" ? "status-tag-success" : op.status === "测试中" ? "status-tag-warning" : "status-tag-default"}`}>
                      {statusIcon(op.status)} {op.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{op.version}</td>
                  <td className="py-3 px-4 text-muted-foreground">{op.creator}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{op.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted/50"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted/50"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataProcessOperators;

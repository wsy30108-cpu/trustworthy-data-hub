import { useState } from "react";
import { Plus, Search, Edit2, Power, FolderTree, ChevronRight } from "lucide-react";

type CatalogType = "system" | "custom";

const mockCatalogs = [
  { id: 1, name: "文本数据", type: "system" as CatalogType, modalities: ["文本"], desc: "文本类数据集目录", datasets: 3421, status: "启用", children: [
    { id: 11, name: "自然语言理解", datasets: 1200 },
    { id: 12, name: "机器翻译", datasets: 890 },
    { id: 13, name: "文本生成", datasets: 1331 },
  ]},
  { id: 2, name: "图片数据", type: "system" as CatalogType, modalities: ["图片"], desc: "图像类数据集目录", datasets: 2156, status: "启用", children: [
    { id: 21, name: "目标检测", datasets: 856 },
    { id: 22, name: "图像分类", datasets: 1300 },
  ]},
  { id: 3, name: "音频数据", type: "system" as CatalogType, modalities: ["音频"], desc: "音频类数据集目录", datasets: 987, status: "启用", children: [] },
  { id: 4, name: "视频数据", type: "system" as CatalogType, modalities: ["视频"], desc: "视频类数据集目录", datasets: 432, status: "停用", children: [] },
  { id: 5, name: "多模态数据", type: "system" as CatalogType, modalities: ["文本", "图片", "音频"], desc: "多模态混合数据集目录", datasets: 1245, status: "启用", children: [] },
  { id: 6, name: "NLP团队自定义目录", type: "custom" as CatalogType, modalities: ["文本"], desc: "NLP研究团队专属数据分类", datasets: 567, status: "启用", children: [
    { id: 61, name: "情感分析", datasets: 234 },
    { id: 62, name: "命名实体识别", datasets: 333 },
  ]},
];

const ConsoleCatalog = () => {
  const [tab, setTab] = useState<"system" | "custom">("system");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = mockCatalogs.filter(c => {
    if (c.type !== tab) return false;
    if (search && !c.name.includes(search)) return false;
    return true;
  });

  const toggleExpand = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据目录管理</h1>
          <p className="page-description">管理系统目录和自定义目录的配置与权限</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增目录
        </button>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索目录名称..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["目录名称", "模态", "描述", "数据集数", "状态", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <>
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {c.children.length > 0 && (
                        <button onClick={() => toggleExpand(c.id)} className="p-0.5 rounded hover:bg-muted/50">
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded.includes(c.id) ? "rotate-90" : ""}`} />
                        </button>
                      )}
                      <FolderTree className="w-4 h-4 text-primary" />
                      {c.name}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">{c.modalities.map(m => <span key={m} className="status-tag status-tag-info">{m}</span>)}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{c.desc}</td>
                  <td className="py-3 px-4">{c.datasets.toLocaleString()}</td>
                  <td className="py-3 px-4"><span className={`status-tag ${c.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{c.status}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-muted/50"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded hover:bg-muted/50"><Power className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
                {expanded.includes(c.id) && c.children.map(ch => (
                  <tr key={ch.id} className="border-b bg-muted/10 hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-14 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-3.5 h-3.5" />
                        {ch.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-4" />
                    <td className="py-2.5 px-4" />
                    <td className="py-2.5 px-4 text-muted-foreground">{ch.datasets}</td>
                    <td className="py-2.5 px-4"><span className="status-tag status-tag-success">启用</span></td>
                    <td className="py-2.5 px-4">
                      <button className="p-1 rounded hover:bg-muted/50"><Edit2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增数据目录</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">目录类型</label><select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>系统目录</option><option>自定义目录</option></select></div>
              <div><label className="text-sm font-medium mb-1 block">目录名称</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="输入目录名称" /></div>
              <div><label className="text-sm font-medium mb-1 block">描述</label><textarea className="w-full px-3 py-2 text-sm border rounded-md bg-background" rows={2} /></div>
              <div><label className="text-sm font-medium mb-1 block">关联模态</label>
                <div className="flex flex-wrap gap-2">{["文本", "图片", "音频", "视频", "3D"].map(m => (
                  <label key={m} className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="rounded" />{m}</label>
                ))}</div>
              </div>
              <div><label className="text-sm font-medium mb-1 block">父级目录（可选）</label><select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>无（顶级目录）</option><option>文本数据</option><option>图片数据</option></select></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleCatalog;

import { useState } from "react";
import { Plus, Search, Power, Edit2, Trash2, TestTube, Database } from "lucide-react";

const mockSources = [
  { id: 1, name: "MinIO-数据湖", type: "MinIO", ip: "10.0.1.100", port: "9000", desc: "主数据湖存储", status: "启用", connStatus: "正常", lastSync: "2026-03-06 14:00" },
  { id: 2, name: "FTP-外部数据", type: "FTP", ip: "192.168.1.50", port: "21", desc: "外部合作方数据源", status: "启用", connStatus: "正常", lastSync: "2026-03-06 12:30" },
  { id: 3, name: "API-天气数据", type: "API", ip: "api.weather.cn", port: "443", desc: "天气数据接口", status: "启用", connStatus: "正常", lastSync: "2026-03-06 14:25" },
  { id: 4, name: "MinIO-历史归档", type: "MinIO", ip: "10.0.2.200", port: "9000", desc: "历史数据归档", status: "停用", connStatus: "未知", lastSync: "2026-02-15 09:00" },
  { id: 5, name: "FTP-标注数据回传", type: "FTP", ip: "10.0.3.100", port: "22", desc: "标注完成数据回传通道", status: "启用", connStatus: "异常", lastSync: "2026-03-05 18:00" },
];

const ConsoleDatasource = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);

  const filtered = mockSources.filter(s => !search || s.name.includes(search) || s.type.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据源配置</h1>
          <p className="page-description">统一管理外部数据源连接配置</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增数据源
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索数据源名称或类型..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["数据源名称", "类型", "IP/地址", "端口", "描述", "状态", "连通状态", "最后同步", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium flex items-center gap-2"><Database className="w-3.5 h-3.5 text-primary" />{s.name}</td>
                <td className="py-3 px-4"><span className="status-tag status-tag-info">{s.type}</span></td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.ip}</td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.port}</td>
                <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate">{s.desc}</td>
                <td className="py-3 px-4"><span className={`status-tag ${s.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{s.status}</span></td>
                <td className="py-3 px-4"><span className={`status-tag ${s.connStatus === "正常" ? "status-tag-success" : s.connStatus === "异常" ? "status-tag-error" : "status-tag-warning"}`}>{s.connStatus}</span></td>
                <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{s.lastSync}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setTesting(s.id); setTimeout(() => setTesting(null), 2000); }} className="p-1 rounded hover:bg-muted/50" title="连通测试">
                      <TestTube className={`w-3.5 h-3.5 ${testing === s.id ? "text-green-500 animate-pulse" : ""}`} />
                    </button>
                    <button className="p-1 rounded hover:bg-muted/50" title={s.status === "启用" ? "停用" : "启用"}><Power className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted/50 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增数据源</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">数据源类型</label><select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>MinIO</option><option>FTP</option><option>API</option><option>SFTP</option></select></div>
              <div><label className="text-sm font-medium mb-1 block">数据源名称</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="输入名称" /></div>
              <div><label className="text-sm font-medium mb-1 block">描述</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="数据源用途描述" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1 block">IP/地址</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="10.0.1.100" /></div>
                <div><label className="text-sm font-medium mb-1 block">端口</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="9000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1 block">用户名</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
                <div><label className="text-sm font-medium mb-1 block">密码</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" type="password" /></div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50 flex items-center gap-1.5"><TestTube className="w-3.5 h-3.5" />连通性测试</button>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleDatasource;

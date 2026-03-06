import { useState } from "react";
import { Plus, HardDrive, Wifi, WifiOff, Star, Edit2, Trash2, TestTube } from "lucide-react";

const mockStorages = [
  { id: 1, name: "MinIO-主存储", type: "MinIO", endpoint: "minio.internal:9000", bucket: "trusted-data", status: "在线", isDefault: true, used: "28.5TB", total: "50TB", percent: 57 },
  { id: 2, name: "OSS-备份存储", type: "阿里云 OSS", endpoint: "oss-cn-beijing.aliyuncs.com", bucket: "backup-data", status: "在线", isDefault: false, used: "12.3TB", total: "100TB", percent: 12.3 },
  { id: 3, name: "FTP-归档存储", type: "FTP", endpoint: "ftp.archive.local:21", bucket: "/archive", status: "不可达", isDefault: false, used: "4.4TB", total: "10TB", percent: 44 },
];

const ConsoleStorage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);

  const handleTest = (id: number) => {
    setTesting(id);
    setTimeout(() => setTesting(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">存储管理</h1>
          <p className="page-description">管理平台级存储资源配置</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增存储
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockStorages.map(s => (
          <div key={s.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-sm">{s.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                {s.isDefault && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                {s.status === "在线"
                  ? <Wifi className="w-3.5 h-3.5 text-green-500" />
                  : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>类型</span><span>{s.type}</span></div>
              <div className="flex justify-between"><span>端点</span><span className="font-mono">{s.endpoint}</span></div>
              <div className="flex justify-between"><span>存储桶</span><span className="font-mono">{s.bucket}</span></div>
              <div className="flex justify-between"><span>使用量</span><span>{s.used} / {s.total}</span></div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.percent > 80 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${s.percent}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 text-right">{s.percent}%</div>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <span className={`status-tag ${s.status === "在线" ? "status-tag-success" : "status-tag-error"}`}>{s.status}</span>
              <div className="flex gap-1">
                <button onClick={() => handleTest(s.id)} className="p-1 rounded hover:bg-muted/50" title="连通性测试">
                  <TestTube className={`w-3.5 h-3.5 ${testing === s.id ? "text-green-500 animate-pulse" : ""}`} />
                </button>
                <button className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
                {!s.isDefault && <button className="p-1 rounded hover:bg-muted/50 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增存储</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">存储类型</label><select className="w-full px-3 py-2 text-sm border rounded-md bg-background"><option>MinIO</option><option>阿里云 OSS</option><option>FTP</option><option>AWS S3</option></select></div>
              <div><label className="text-sm font-medium mb-1 block">存储名称</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="输入存储名称" /></div>
              <div><label className="text-sm font-medium mb-1 block">端点地址</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="IP:端口" /></div>
              <div><label className="text-sm font-medium mb-1 block">存储桶/路径</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="bucket名称" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1 block">Access Key</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" type="password" /></div>
                <div><label className="text-sm font-medium mb-1 block">Secret Key</label><input className="w-full px-3 py-2 text-sm border rounded-md bg-background" type="password" /></div>
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

export default ConsoleStorage;

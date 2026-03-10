import { useState } from "react";
import { Save } from "lucide-react";

const ConsoleSystem = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">系统设置</h1>
          <p className="page-description">配置平台基础信息、展示信息和版权信息</p>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Save className="w-4 h-4" /> {saved ? "已保存 ✓" : "保存设置"}
        </button>
      </div>

      {/* 平台基础信息 */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">平台基础信息</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm text-muted-foreground mb-1 block">平台名称</label><input defaultValue="可信数据平台" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">版本号</label><input defaultValue="v2.1.0" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">平台 Icon</label>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">可</div><button className="text-xs text-primary hover:underline">更换</button></div>
          </div>
          <div><label className="text-sm text-muted-foreground mb-1 block">平台 Logo</label>
            <div className="flex items-center gap-3"><div className="h-10 px-4 rounded-lg bg-muted flex items-center text-sm text-muted-foreground">可信数据平台 Logo</div><button className="text-xs text-primary hover:underline">更换</button></div>
          </div>
        </div>
      </section>

      {/* 首页展示信息 */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">首页展示信息（同步到前台首页底部）</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm text-muted-foreground mb-1 block">企业名称</label><input defaultValue="北京可信数据科技有限公司" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">企业地址</label><input defaultValue="北京市海淀区中关村软件园" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">联系方式</label><input defaultValue="010-8888-9999" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">联系邮箱</label><input defaultValue="contact@trusted-data.cn" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
        </div>
      </section>

      {/* 辅助链接 */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">首页辅助链接</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[["关于我们", "about"], ["隐私政策", "privacy"], ["服务条款", "terms"], ["常见问题", "faq"]].map(([label, key]) => (
            <div key={key} className="flex items-center justify-between px-3 py-2.5 border rounded-md bg-background">
              <span className="text-sm">{label}</span>
              <button onClick={() => navigate(`/console/system/page/${key}`)} className="text-xs text-primary hover:underline">编辑内容</button>
            </div>
          ))}
        </div>
      </section>

      {/* 版权信息 */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">版权信息</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm text-muted-foreground mb-1 block">版权所有</label><input defaultValue="© 2026 可信数据科技 保留所有权利" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">ICP 备案号</label><input defaultValue="京ICP备2025000000号" className="w-full px-3 py-2 text-sm border rounded-md bg-background" /></div>
        </div>
      </section>
    </div>
  );
};

export default ConsoleSystem;

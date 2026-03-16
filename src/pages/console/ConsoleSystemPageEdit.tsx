import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, Edit3 } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

const PAGE_CONFIGS: Record<string, { title: string; defaultContent: string }> = {
  about: {
    title: "关于我们",
    defaultContent: `# 关于我们

## 公司简介

北京可信数据科技有限公司成立于 2020 年，是一家专注于**数据治理与数据安全**领域的高新技术企业。

## 我们的使命

致力于为企业提供安全、可信、高效的数据管理解决方案，推动数据要素价值释放。

## 核心优势

- 🔒 **数据安全**：全链路数据加密与访问控制
- 📊 **数据治理**：自动化数据质量检测与治理
- 🚀 **高效协作**：多角色协同的数据标注与处理平台
- 🌐 **开放生态**：丰富的数据服务市场与 API 集成

## 联系我们

- 地址：北京市海淀区中关村软件园
- 电话：010-8888-9999
- 邮箱：contact@trusted-data.cn`,
  },
  privacy: {
    title: "隐私政策",
    defaultContent: `# 隐私政策

**最后更新日期：2026 年 3 月 1 日**

## 1. 信息收集

我们可能收集以下类型的信息：

- **个人身份信息**：姓名、邮箱、电话号码等
- **使用数据**：访问时间、浏览页面、操作日志等
- **设备信息**：浏览器类型、操作系统、IP 地址等

## 2. 信息使用

收集的信息将用于：

1. 提供和维护平台服务
2. 改善用户体验
3. 发送服务通知和更新
4. 确保平台安全

## 3. 信息保护

我们采取以下措施保护您的信息：

- 数据传输采用 SSL/TLS 加密
- 敏感数据存储采用 AES-256 加密
- 严格的访问控制与权限管理
- 定期安全审计与漏洞扫描

## 4. 用户权利

您有权：

- 访问和查看个人数据
- 更正不准确的数据
- 删除个人数据
- 撤回数据处理同意`,
  },
  terms: {
    title: "服务条款",
    defaultContent: `# 服务条款

**生效日期：2026 年 1 月 1 日**

## 1. 服务概述

可信数据平台（以下简称"平台"）为用户提供数据管理、数据处理、数据标注及数据服务等功能。

## 2. 用户责任

使用本平台，您同意：

- 遵守所有适用的法律法规
- 不上传违法或侵权内容
- 妥善保管账户信息
- 不进行任何可能损害平台的操作

## 3. 知识产权

- 平台的所有内容和技术受知识产权法保护
- 用户上传的数据，其知识产权归用户所有
- 未经授权不得复制、修改或分发平台内容

## 4. 免责声明

- 平台按"现状"提供，不作任何明示或暗示的保证
- 对于因不可抗力导致的服务中断，平台不承担责任`,
  },
  faq: {
    title: "常见问题",
    defaultContent: `# 常见问题

## 账户相关

### Q: 如何注册账户？
点击首页右上角的「注册」按钮，填写邮箱和密码即可完成注册。

### Q: 忘记密码怎么办？
在登录页面点击「忘记密码」，通过注册邮箱验证后即可重置密码。

## 数据管理

### Q: 支持哪些数据格式？
平台支持 CSV、JSON、Parquet、图片（JPG/PNG）、文本（TXT/MD）等多种格式。

### Q: 数据上传有大小限制吗？
单个文件最大支持 **500MB**，批量上传最多 **100 个文件**。

## 数据标注

### Q: 如何创建标注任务？
进入「数据标注 > 任务管理」，点击「新建任务」，选择数据集和标注模板即可。

### Q: 支持哪些标注类型？
支持图像分类、目标检测、语义分割、文本分类、NER、关系抽取等多种标注类型。

## 费用相关

### Q: 平台如何收费？
平台提供免费版和企业版，详情请联系销售团队。`,
  },
};



const ConsoleSystemPageEdit = () => {
  const navigate = useNavigate();
  const { pageKey } = useParams<{ pageKey: string }>();
  const config = PAGE_CONFIGS[pageKey || ""] || { title: "未知页面", defaultContent: "" };

  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    const stored = localStorage.getItem(`system_page_${pageKey}`);
    setContent(stored || config.defaultContent);
  }, [pageKey, config.defaultContent]);

  const handleSave = () => {
    localStorage.setItem(`system_page_${pageKey}`, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/console/system")}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">编辑「{config.title}」</h1>
            <p className="page-description">使用 Markdown 语法编辑页面内容，右侧可实时预览效果</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" /> {saved ? "已保存 ✓" : "保存"}
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg md:hidden">
        <button
          onClick={() => setActiveTab("edit")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === "edit" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
        >
          <Edit3 className="w-3.5 h-3.5" /> 编辑
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === "preview" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
        >
          <Eye className="w-3.5 h-3.5" /> 预览
        </button>
      </div>

      {/* Editor + Preview */}
      <div className="grid md:grid-cols-2 gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* Editor */}
        <div className={`flex flex-col rounded-lg border bg-card overflow-hidden ${activeTab === "preview" ? "hidden md:flex" : ""}`}>
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
            <Edit3 className="w-3.5 h-3.5" /> Markdown 编辑
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-4 text-sm font-mono leading-relaxed bg-background resize-none focus:outline-none"
            placeholder="在此输入 Markdown 内容..."
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className={`flex flex-col rounded-lg border bg-card overflow-hidden ${activeTab === "edit" ? "hidden md:flex" : ""}`}>
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
            <Eye className="w-3.5 h-3.5" /> 实时预览
          </div>
          <div
            className="flex-1 p-6 overflow-y-auto prose-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConsoleSystemPageEdit;

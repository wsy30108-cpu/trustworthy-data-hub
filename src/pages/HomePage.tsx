import { useNavigate } from "react-router-dom";
import { ArrowRight, Database, Workflow, ShoppingBag, ShieldCheck, Zap, Globe, ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleProtectedNav = (route: string) => {
    if (isAuthenticated) {
      navigate(route);
    } else {
      openAuthModal("login");
    }
  };

  return (
    <div className="min-h-screen bg-card">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">可</span>
            </div>
            <span className="font-semibold text-foreground">可信数据平台</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#capabilities" className="text-sm text-muted-foreground hover:text-foreground">核心能力</a>
            <a href="#advantages" className="text-sm text-muted-foreground hover:text-foreground">平台优势</a>
            <a href="#cases" className="text-sm text-muted-foreground hover:text-foreground">案例展示</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">帮助文档</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/console/dashboard")}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                进入平台
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal("login")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  登录
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  注册体验
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 pt-14">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/80 to-card" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Zap className="w-3 h-3" /> 新一代企业级数据基础设施
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            可信数据平台
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            解决数据治理难、模型迭代慢、共享不可信三大痛点
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            面向大模型时代的一站式高质量数据集管理、生产与供给平台，让数据驱动创新更高效、更可信
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleProtectedNav("/data-management/datasets")}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
            >
              立即体验 <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-3 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
              查看文档
            </button>
          </div>
        </div>
      </section>

      {/* 三大价值主张 */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">平台核心价值</h2>
            <p className="text-muted-foreground">为企业提供全方位的数据能力支撑</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "高效生产", desc: "一站式工作流编排，将数据清洗、标注、质检全流程提效80%，让数据工程师专注价值创造", color: "bg-blue-50 text-blue-600" },
              { icon: ShieldCheck, title: "可信可控", desc: "全链路数据溯源与权限管控，确保数据从采集到使用每一步都可审计、可追溯、可信赖", color: "bg-green-50 text-green-600" },
              { icon: Globe, title: "赋能迭代", desc: "高质量数据集市与跨团队共享机制，加速大模型训练迭代，降低重复建设成本", color: "bg-orange-50 text-orange-600" },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-6`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心能力 */}
      <section id="capabilities" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">三大核心服务场景</h2>
            <p className="text-muted-foreground">覆盖数据集全生命周期的管理、生产与供给</p>
          </div>
          <div className="space-y-16">
            {[
              {
                icon: Database, title: "数据集管理", subtitle: "高质量数据资产的统一管理中心",
                desc: "提供数据集多版本管理、跨模态文件检索、细粒度权限管控与目录分类体系，让海量数据井然有序",
                features: ["多版本数据集管理", "跨模态智能检索", "目录树形分类", "精细权限控制", "数据集分享与订购"],
                route: "/data-management/datasets",
              },
              {
                icon: Workflow, title: "数据集生产", subtitle: "AI驱动的数据处理与标注流水线",
                desc: "可视化工作流编排引擎 + 专业标注工作台，内置60+数据处理算子，支持文本/图像/语音/视频全模态数据清洗、增强与标注",
                features: ["可视化工作流画布", "60+内置处理算子", "多模态标注工具", "质检验收闭环", "数据质量评估"],
                route: "/data-process/workflows",
              },
              {
                icon: ShoppingBag, title: "数据集供给", subtitle: "安全可控的数据集市与共享平台",
                desc: "数据集市提供发布、检索、申请、审批全流程闭环，支持官方预置与用户自主发布两大数据来源，确保数据流通安全可控",
                features: ["数据集市搜索发现", "订购申请审批", "权限分级管控", "官方预置数据集", "使用行为审计"],
                route: "/data-service/marketplace",
              },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-12 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{item.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {item.features.map((f, fi) => (
                      <span key={fi} className="px-3 py-1 rounded-full bg-card border text-xs text-muted-foreground">{f}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleProtectedNav(item.route)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    了解更多 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 hidden lg:block">
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border flex items-center justify-center">
                    <item.icon className="w-16 h-16 text-primary/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 差异化优势 */}
      <section id="advantages" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">为什么选择可信数据平台</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "全流程可信", desc: "数据溯源、操作审计、权限管控三位一体，满足合规要求", num: "01" },
              { title: "高质量导向", desc: "内置质量评估体系，8大质量维度量化评估，确保数据可用", num: "02" },
              { title: "一体化高效", desc: "管理、处理、标注、服务四大平台无缝衔接，告别系统孤岛", num: "03" },
              { title: "生态化布局", desc: "模板商店、算子市场、数据集市构建开放生态，降低协作门槛", num: "04" },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <span className="text-3xl font-bold text-primary/20 block mb-4">{item.num}</span>
                <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案例展示 */}
      <section id="cases" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">行业数据集案例</h2>
            <p className="text-muted-foreground">高质量脱敏数据集样例，覆盖多个行业领域</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "金融舆情文本数据集", type: "文本", scale: "120万条", scene: "情感分析 · 风控预警" },
              { name: "医疗影像标注数据集", type: "图像", scale: "50万张", scene: "病灶检测 · 辅助诊断" },
              { name: "智能客服对话数据集", type: "文本", scale: "80万轮", scene: "对话生成 · 意图识别" },
              { name: "工业质检图像数据集", type: "图像", scale: "30万张", scene: "缺陷检测 · 质量分类" },
              { name: "多语种翻译平行语料", type: "文本", scale: "200万对", scene: "机器翻译 · 跨语言理解" },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer group">
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-primary/30 group-hover:text-primary/50 transition-colors" />
                </div>
                <h5 className="text-sm font-medium text-foreground mb-2 line-clamp-2">{item.name}</h5>
                <div className="flex items-center gap-2 mb-2">
                  <span className="status-tag status-tag-info">{item.type}</span>
                  <span className="text-xs text-muted-foreground">{item.scale}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.scene}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">开始构建您的可信数据资产</h2>
          <p className="text-muted-foreground mb-8">立即注册，体验一站式数据管理与服务能力</p>
          <button
            onClick={() => navigate("/data-management/datasets")}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            立即体验
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-[10px]">可</span>
                </div>
                <span className="font-semibold text-foreground text-sm">可信数据平台</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                面向大模型时代的一站式高质量数据集管理、生产与供给平台
              </p>
            </div>
            <div>
              <h6 className="text-sm font-medium text-foreground mb-3">产品服务</h6>
              <ul className="space-y-2">
                {["数据管理", "数据处理", "数据标注", "数据服务"].map(s => (
                  <li key={s}><a href="#" className="text-xs text-muted-foreground hover:text-foreground">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-medium text-foreground mb-3">支持</h6>
              <ul className="space-y-2">
                {["帮助文档", "常见问题", "关于我们", "联系我们"].map(s => (
                  <li key={s}><a href="#" className="text-xs text-muted-foreground hover:text-foreground">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-medium text-foreground mb-3">法律合规</h6>
              <ul className="space-y-2">
                {["隐私政策", "服务条款", "数据安全"].map(s => (
                  <li key={s}><a href="#" className="text-xs text-muted-foreground hover:text-foreground">{s}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 可信数据平台 版权所有</p>
            <p className="text-xs text-muted-foreground">京ICP备XXXXXXXX号-1</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

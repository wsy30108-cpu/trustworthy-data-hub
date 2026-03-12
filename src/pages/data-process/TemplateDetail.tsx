import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Boxes, Info, User, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import WorkflowCanvas from "./WorkflowCanvas";

const INITIAL_OFFICIAL_TEMPLATES = [
    { id: "TPL-001", name: "图像质量标准清洗管线", desc: "分辨率检测→模糊度过滤→格式统一→EXIF清理，适用于大规模图像数据集预处理", tags: ["图像处理"], operators: 4, usageCount: 156, creator: "系统", updatedAt: "2026-02-28", status: "online" },
    { id: "TPL-002", name: "NLP数据去重与脱敏", desc: "MinHash去重→正则脱敏→敏感词过滤→质量评分，适用于文本语料清洗", tags: ["文本处理"], operators: 4, usageCount: 245, creator: "系统", updatedAt: "2026-03-02", status: "online" },
    { id: "TPL-003", name: "语音数据标准化流水线", desc: "采样率统一→降噪→静音裁剪→格式转换，适用于ASR训练数据准备", tags: ["语音处理"], operators: 4, usageCount: 89, creator: "系统", updatedAt: "2026-03-03", status: "online" },
];

const mockMyTemplates = [
    { id: "TPL-101", name: "中英文社交媒体数据预处理", desc: "语言检测→字符过滤→正则替换→异常值统计，适用于社交平台抓取数据", tags: ["文本处理"], operators: 4, usageCount: 23, creator: "张明", updatedAt: "2026-03-01" },
];

const mockSharedTemplates = [
    { id: "TPL-201", name: "医学影像预处理流水线", desc: "DICOM解析→窗宽窗位调整→尺寸归一化→增强", tags: ["图像处理"], operators: 4, usageCount: 45, creator: "李华", shareScope: "cross-space", updatedAt: "2026-03-02" },
];

const allTemplates = [...INITIAL_OFFICIAL_TEMPLATES, ...mockMyTemplates, ...mockSharedTemplates];

const TemplateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const template = allTemplates.find(t => t.id === id) || INITIAL_OFFICIAL_TEMPLATES[0];

    const handleUseTemplate = () => {
        navigate(`/data-process/workflow-canvas?template=${template.id}&name=${template.name}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-background">
            {/* Header */}
            <div className="h-14 border-b px-6 flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            {template.name}
                            <Badge variant="secondary" className="text-[10px] py-0">{template.id.startsWith('TPL-0') ? '官方' : '社区'}</Badge>
                        </h2>
                        <p className="text-xs text-muted-foreground">最后更新：{template.updatedAt}</p>
                    </div>
                </div>
                <Button onClick={handleUseTemplate} className="gap-2">
                    <Play className="w-4 h-4 fill-current" /> 使用该模板
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Detail Info */}
                <div className="w-80 border-r bg-card p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                    <section className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                            <Info className="w-4 h-4 text-primary" /> 模板描述
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {template.desc}
                        </p>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider text-[10px]">核心指标</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Boxes className="w-3.5 h-3.5" /> 算子数
                                </div>
                                <div className="text-xl font-bold text-foreground">{template.operators}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5" /> 使用量
                                </div>
                                <div className="text-xl font-bold text-foreground">{template.usageCount}</div>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider text-[10px]">基础信息</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-2"><User className="w-3.5 h-3.5" /> 创建人</span>
                                <span className="text-foreground font-medium">{template.creator}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> 更新时间</span>
                                <span className="text-foreground font-medium">{template.updatedAt}</span>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider text-[10px]">模板标签</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {template.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] font-normal border-primary/20 bg-primary/5 text-primary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Canvas Preview */}
                <div className="flex-1 bg-muted/10 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-background/80 backdrop-blur border text-foreground font-normal">
                            画布预览 (只读)
                        </Badge>
                    </div>
                    <div className="h-full w-full">
                        <WorkflowCanvas isReadOnly={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDetail;

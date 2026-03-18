import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Share2, Copy, Trash2, Eye, Edit,
    Layers, MousePointer, Crosshair, PenTool,
    Info, Play, ListChecks, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ShareToolDialog from "./ShareToolDialog";

interface Tool {
    id: string;
    name: string;
    type: string;
    desc: string;
    objects: string[];
    methods: string[];
    isPreset: boolean;
    usageCount: number;
    creator: string;
    updatedAt: string;
    icon: string;
    image?: string;
    labels?: { name: string; color: string; shortcut?: string }[];
}

const mockTools: Tool[] = [
    {
        id: "TL-001",
        name: "文本分类标注",
        type: "文本类",
        desc: "对整篇文章进行标签分类，支持多级标签组",
        objects: ["篇章", "段落"],
        methods: ["单选", "多选"],
        isPreset: true,
        usageCount: 156,
        creator: "系统提供",
        updatedAt: "2024-03-10",
        icon: "📝",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=800&auto=format&fit=crop&q=60",
        labels: [
            { name: "正面", color: "#10b981", shortcut: "1" },
            { name: "中性", color: "#f59e0b", shortcut: "2" },
            { name: "负面", color: "#ef4444", shortcut: "3" }
        ]
    },
    {
        id: "TL-002",
        name: "实体关系标注",
        type: "文本类",
        desc: "支持NER实体识别和关系连接",
        objects: ["文本"],
        methods: ["连线", "关系定义"],
        isPreset: true,
        usageCount: 89,
        creator: "系统提供",
        updatedAt: "2024-03-12",
        icon: "🔗"
    }
];

const DataAnnotationToolDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tool, setTool] = useState<Tool | null>(null);
    const [activeSection, setActiveSection] = useState("basic");
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    useEffect(() => {
        const found = mockTools.find(t => t.id === id) || mockTools[0];
        setTool(found);
    }, [id]);

    if (!tool) return null;

    const sections = [
        { id: "basic", label: "基本信息介绍" },
        { id: "preview", label: "交互式模板预览" },
        { id: "labels", label: "标签配置" }
    ];

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(sectionId);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{tool.name} ({tool.type})</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareDialogOpen(true)}>
                            <Share2 className="h-4 w-4" /> 分享
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("正在创建副本...")}>
                            <Copy className="h-4 w-4" /> 复制
                        </Button>
                        {!tool.isPreset && (
                            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => toast.error("确认删除该工具？")}>
                                <Trash2 className="h-4 w-4" /> 删除
                            </Button>
                        )}
                        <Button size="sm" className="gap-1.5" onClick={() => navigate(`/data-annotation/tool-editor?id=${tool.id}`)}>
                            <Edit className="h-4 w-4" /> 编辑
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container max-w-7xl px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 space-y-12 pb-24">
                        {/* Basic Info */}
                        <section id="basic" className="scroll-mt-24 space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" /> 基本信息介绍
                            </h2>
                            <div className="space-y-4">
                                <div className="relative aspect-video max-w-2xl rounded-xl overflow-hidden border bg-muted/30">
                                    <img
                                        src={tool.image || "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=800&auto=format&fit=crop&q=60"}
                                        alt={tool.name}
                                        className="object-cover w-full h-full transition-transform hover:scale-105 duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="max-w-2xl text-muted-foreground leading-relaxed">
                                    {tool.desc}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 pt-4 border-t max-w-2xl text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">标注对象</span>
                                        <div className="flex gap-2">
                                            {tool.objects.map((obj, i) => (
                                                <Badge key={i} variant="secondary" className="font-normal">{obj}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">标注方法</span>
                                        <div className="flex gap-2">
                                            {tool.methods.map((method, i) => (
                                                <Badge key={i} variant="secondary" className="font-normal">{method}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">创建人</span>
                                        <span className="font-medium">{tool.creator}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">最后更新</span>
                                        <span className="font-medium">{tool.updatedAt}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Interactive Preview */}
                        <section id="preview" className="scroll-mt-24 space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Play className="h-5 w-5 text-primary" /> 交互式模板预览
                            </h2>
                            <div className="relative border rounded-xl overflow-hidden bg-card shadow-sm h-[500px] flex flex-col">
                                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MousePointer className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-primary/10"><Crosshair className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><PenTool className="h-4 w-4" /></Button>
                                        <div className="w-px h-4 bg-border mx-1" />
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Layers className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-normal">Select label and click the image to start</Badge>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden relative group">
                                    <img
                                        src="https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&auto=format&fit=crop&q=80"
                                        className="w-full h-full object-cover opacity-80"
                                        alt="Mock Workspace"
                                    />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-background/90 backdrop-blur rounded px-4 py-2 text-sm shadow-lg border">
                                            请选择左侧工具开始标注
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-[20%] left-[30%] w-[10%] h-[15%] border-2 border-red-500 bg-red-500/10 rounded flex items-start justify-end p-1">
                                            <span className="bg-red-500 text-[10px] text-white px-1 rounded">Airplane</span>
                                        </div>
                                        <div className="absolute top-[40%] left-[50%] w-[12%] h-[12%] border-2 border-blue-500 bg-blue-500/10 rounded flex items-start justify-end p-1">
                                            <span className="bg-blue-500 text-[10px] text-white px-1 rounded">Car</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-3 border-t bg-muted/5 flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <span className="text-xs">Airplane 1</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                                        <span className="text-xs">Car 2</span>
                                    </div>
                                    <div className="flex-1" />
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Regions</span>
                                        <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">History</span>
                                        <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Relations</span>
                                        <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Info</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Label Config */}
                        <section id="labels" className="scroll-mt-24 space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <ListChecks className="h-5 w-5 text-primary" /> 标签配置
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(tool.labels || [
                                    { name: "默认标签 1", color: "#3b82f6", shortcut: "1" },
                                    { name: "默认标签 2", color: "#10b981", shortcut: "2" }
                                ]).map((label, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: label.color }} />
                                            <span className="font-medium">{label.name}</span>
                                        </div>
                                        {label.shortcut && (
                                            <Badge variant="outline" className="text-[10px] uppercase font-mono hidden group-hover:inline-flex">
                                                快捷键 {label.shortcut}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full lg:w-[280px]">
                        <div className="sticky top-24 space-y-6">
                            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">快速导航</h3>
                                <nav className="space-y-1">
                                    {sections.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${activeSection === section.id
                                                ? "bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {section.label}
                                            <ChevronRight className={`h-4 w-4 transition-transform ${activeSection === section.id ? "translate-x-1" : "opacity-0"}`} />
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">使用统计</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground text-xs italic">累计使用次数</span>
                                        <span className="font-bold text-lg">{tool.usageCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t pt-4">
                                        <span className="text-muted-foreground text-xs italic">最后更新</span>
                                        <span className="text-foreground">{tool.updatedAt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ShareToolDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                toolName={tool.name}
            />
        </div>
    );
};

export default DataAnnotationToolDetail;

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Check, Database, Boxes, ShieldCheck, Tag, Info, AlertCircle, Trash2, Plus, Edit, Search, Filter, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdown";
import {
    useListingStore,
    type Listing,
    type KVTag,
    MOCK_SPACES,
    MOCK_SOURCE_DATASETS
} from "@/stores/useListingStore";
import { FLAT_INDUSTRIES } from "@/lib/industry-domains";

/* --- Helper Components --- */

const TECHNICAL_DOMAINS = ["自然语言处理", "计算机视觉", "音频处理", "视频分析", "多模态学习", "知识图谱", "推荐系统"];

function MultiSelectDropdown({ options, selected, onChange, placeholder }: {
    options: string[];
    selected: string[];
    onChange: (v: string[]) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);

    return (
        <div className="relative">
            <div
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap gap-2 items-center cursor-pointer min-h-[44px] hover:border-primary/30 transition-all shadow-sm shadow-slate-200/50"
            >
                {selected.length > 0 ? (
                    selected.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded flex items-center gap-1 border border-primary/20">
                            {s}
                            <Plus className="w-3 h-3 rotate-45" onClick={(e) => { e.stopPropagation(); toggle(s); }} />
                        </span>
                    ))
                ) : (
                    <span className="text-sm text-slate-400 font-medium">{placeholder}</span>
                )}
            </div>
            {open && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setOpen(false)} />
                    <div className="absolute z-[120] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map(o => (
                            <div
                                key={o}
                                onClick={() => toggle(o)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors flex items-center justify-between",
                                    selected.includes(o) ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {o}
                                {selected.includes(o) && <Check className="w-4 h-4" />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function TagEditorDialog({ open, title, tags, onSave, onClose }: {
    open: boolean;
    title: string;
    tags: KVTag[];
    onSave: (tags: KVTag[]) => void;
    onClose: () => void;
}) {
    const [localTags, setLocalTags] = useState<KVTag[]>(tags);

    useMemo(() => {
        if (open) setLocalTags(tags);
    }, [open, tags]);

    const add = () => setLocalTags([...localTags, { key: "", value: "" }]);
    const remove = (index: number) => setLocalTags(localTags.filter((_, i) => i !== index));
    const update = (index: number, field: "key" | "value", val: string) => {
        const next = [...localTags];
        next[index][field] = val;
        setLocalTags(next);
    };

    const save = () => {
        onSave(localTags.filter(t => t.key.trim() && t.value.trim()));
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Tag className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <Plus className="w-5 h-5 text-slate-400 rotate-45" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                    {localTags.length === 0 && (
                        <div className="py-10 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Tag className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium whitespace-pre-wrap">暂无标签对\n点击下方按钮开始添加</p>
                        </div>
                    )}
                    {localTags.map((t, i) => (
                        <div key={i} className="flex gap-2 items-center group animate-slide-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                            <input
                                placeholder="键(Key)"
                                value={t.key}
                                onChange={(e) => update(i, "key", e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all"
                            />
                            <span className="text-slate-300 font-bold">:</span>
                            <input
                                placeholder="值(Value)"
                                value={t.value}
                                onChange={(e) => update(i, "value", e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-primary outline-none transition-all"
                            />
                            <button
                                onClick={() => remove(i)}
                                className="p-2.5 text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={add}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 添加新标签
                    </button>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button onClick={onClose} className="py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-white transition-all">取消</button>
                        <button onClick={save} className="py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary/20">保存标签</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const INTRODUCTION_TEMPLATE = `<!-- 该数据集当前使用的是默认介绍模版，请参考以下模板，及时完善数据集介绍相关内容 -->
## 数据集构成
### 数据结构
清晰地列出数据集的组成部分，例如：

\`\`\`
dataset_name/
├── train/
├── val/
└── test/
\`\`\`
### 字段说明
建议用表格描述字段说明，例如：

|字段名|类型|描述|
||-|--|
|id|string|唯一标识符|
|text|string|文本内容|
|...|...|...|

### 数据规模
介绍样本总数、类别数量、每类样本数量等

## 数据预处理
简要说明是否对数据进行了清洗、标准化、缺失值处理、去重、编码等操作

## 数据标注
简要说明是否对数据进行了标注、标注人等信息`;

/* --- Main Component --- */

export default function DataServiceListingCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("editId");

    const { addListing, updateListing, listings } = useListingStore();

    const [step, setStep] = useState(1);

    // Selection State (Step 1)
    const [selectedSpaceId, setSelectedSpaceId] = useState("");
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");
    const [spaceSearch, setSpaceSearch] = useState("");
    const [datasetSearch, setDatasetSearch] = useState("");
    const [modalityFilter, setModalityFilter] = useState("全部");

    // Configuration State (Step 2)
    const [form, setForm] = useState<Partial<Listing>>({
        description: "",
        purpose: "",
        versionDesc: "",
        technicalDomain: [],
        industryDomain: [],
        tags: [],
        versionTags: [],
        customMetadata: INTRODUCTION_TEMPLATE
    });

    // Handle Edit Mode Initialization
    useEffect(() => {
        if (editId) {
            const existingListing = listings.find(l => l.id === editId);
            if (existingListing) {
                // Find and set spaceId based on existing source
                const space = MOCK_SPACES.find(s => s.name === existingListing.source);
                if (space) setSelectedSpaceId(space.id);

                setSelectedDatasetId(existingListing.datasetId);
                setSelectedVersion(existingListing.version);

                setForm({
                    ...existingListing
                });
                setStep(2); // Directly jump to step 2 for editing
            } else {
                toast.error("未找到上架记录");
                navigate("/data-service/listing");
            }
        }
    }, [editId, listings, navigate]);

    const [introTab, setIntroTab] = useState<"edit" | "preview">("edit");

    const [tagEditorConfig, setTagEditorConfig] = useState<{ open: boolean; title: string; field: "tags" | "versionTags"; tags: KVTag[] }>({
        open: false, title: "", field: "tags", tags: []
    });

    const filteredSpaces = useMemo(() => {
        return MOCK_SPACES.filter(s =>
            s.name.toLowerCase().includes(spaceSearch.toLowerCase()) ||
            s.id.toLowerCase().includes(spaceSearch.toLowerCase())
        );
    }, [spaceSearch]);

    const availableDatasets = useMemo(() => {
        if (!selectedSpaceId) return [];
        const datasets = MOCK_SOURCE_DATASETS[selectedSpaceId] || [];
        return datasets.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(datasetSearch.toLowerCase()) || d.id.toLowerCase().includes(datasetSearch.toLowerCase());
            const matchesModality = modalityFilter === "全部" || d.modality === modalityFilter;
            return matchesSearch && matchesModality;
        });
    }, [selectedSpaceId, datasetSearch, modalityFilter]);

    const selectedDataset = useMemo(() => {
        return (MOCK_SOURCE_DATASETS[selectedSpaceId] || []).find(d => d.id === selectedDatasetId);
    }, [selectedDatasetId, selectedSpaceId]);

    // Handle proceed to step 2
    const handleNext = () => {
        if (!selectedSpaceId || !selectedDatasetId || !selectedVersion) {
            toast.error("请完善来源选择");
            return;
        }

        // Pre-populate step 2 form with dataset defaults
        if (selectedDataset) {
            setForm(prev => ({
                ...prev,
                datasetName: selectedDataset.name,
                datasetId: selectedDataset.id,
                modality: selectedDataset.modality,
                description: selectedDataset.description,
                version: selectedVersion
            }));
        }
        setStep(2);
    };

    const handleSubmit = () => {
        if (!form.datasetName) return;

        if (editId) {
            updateListing(editId, {
                datasetName: form.datasetName || "",
                datasetId: form.datasetId || "",
                version: form.version || "",
                modality: form.modality || "",
                source: MOCK_SPACES.find(s => s.id === selectedSpaceId)?.name || form.source || "未知空间",
                description: form.description,
                purpose: form.purpose,
                tags: form.tags,
                versionDesc: form.versionDesc,
                versionTags: form.versionTags,
                technicalDomain: form.technicalDomain,
                industryDomain: form.industryDomain,
                customMetadata: form.customMetadata,
            });
            toast.success("上架信息已更新，请等待重新审批");
        } else {
            addListing({
                id: `L-${Date.now()}`,
                datasetName: form.datasetName || "",
                datasetId: form.datasetId || "",
                version: form.version || "",
                modality: form.modality || "",
                source: MOCK_SPACES.find(s => s.id === selectedSpaceId)?.name || "未知空间",
                description: form.description,
                purpose: form.purpose,
                tags: form.tags,
                versionDesc: form.versionDesc,
                versionTags: form.versionTags,
                technicalDomain: form.technicalDomain,
                industryDomain: form.industryDomain,
                customMetadata: form.customMetadata,
                applyCount: 0,
                authorizedUsers: 0
            });
            toast.success("上架申请已提交");
        }

        navigate("/data-service/listing");
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 hover:text-primary"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{editId ? "编辑上架申请" : "新建上架申请"}</h1>
                            <p className="text-xs text-slate-400 font-medium">
                                {editId ? "更新上架元数据，确保资产信息的准确性" : "遵循二阶段配置引导，快速发布数据资源"}
                            </p>
                        </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center gap-2 font-bold transition-all",
                            step === 1 ? "text-primary" : "text-slate-300"
                        )}>
                            <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs",
                                step === 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                            )}>1</div>
                            <span className="text-sm">资源选择</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                        <div className={cn(
                            "flex items-center gap-2 font-bold transition-all",
                            step === 2 ? "text-primary" : "text-slate-300"
                        )}>
                            <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs",
                                step === 2 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                            )}>2</div>
                            <span className="text-sm">参数配置</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-10">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px] flex flex-col">

                    {/* Step 1: Resource Selection */}
                    {step === 1 && (
                        <div className="flex-1 p-12 space-y-12 animate-fade-in">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">选择数据来源</h2>
                                <p className="text-sm text-slate-400 font-medium">请从您有权限的空间中选择要上架的数据集及其版本</p>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                {/* Space Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Boxes className="w-4 h-4 text-primary" /> 选择所属空间
                                        </label>
                                        <div className="relative w-64 group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="搜索空间名称或ID..."
                                                value={spaceSearch}
                                                onChange={(e) => setSpaceSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:bg-white focus:border-primary outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredSpaces.length > 0 ? filteredSpaces.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => { setSelectedSpaceId(s.id); setSelectedDatasetId(""); setSelectedVersion(""); }}
                                                className={cn(
                                                    "p-5 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                                                    selectedSpaceId === s.id
                                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                        : "border-slate-100 hover:border-primary/30 bg-slate-50/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                        selectedSpaceId === s.id ? "bg-primary text-white" : "bg-white text-slate-400 group-hover:text-primaryShadow shadow-sm"
                                                    )}>
                                                        <Boxes className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">{s.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{s.id}</div>
                                                    </div>
                                                </div>
                                                {selectedSpaceId === s.id && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white scale-110 shadow-lg">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="col-span-2 p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 animate-fade-in">
                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                    <Boxes className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium">未找到匹配的空间</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dataset Selection */}
                                {selectedSpaceId && (
                                    <div className="space-y-4 animate-slide-in-up">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Database className="w-4 h-4 text-primary" /> 选择数据集
                                            </label>
                                            <div className="flex items-center gap-3">
                                                {/* Modality Filter */}
                                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                                    {["全部", "文本", "图像", "语音"].map(m => (
                                                        <button
                                                            key={m}
                                                            onClick={() => setModalityFilter(m)}
                                                            className={cn(
                                                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                                modalityFilter === m ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                            )}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Search */}
                                                <div className="relative w-48 group">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="搜索数据集..."
                                                        value={datasetSearch}
                                                        onChange={(e) => setDatasetSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:bg-white focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                            {availableDatasets.length > 0 ? availableDatasets.map(d => (
                                                <div
                                                    key={d.id}
                                                    onClick={() => { setSelectedDatasetId(d.id); setSelectedVersion(""); }}
                                                    className={cn(
                                                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                                                        selectedDatasetId === d.id
                                                            ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                                            : "border-slate-100 hover:border-primary/20 bg-slate-50/30"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                                            selectedDatasetId === d.id ? "bg-white text-primary shadow-sm" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            <Database className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800">{d.name}</div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded font-bold">{d.modality}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{d.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedDatasetId === d.id && <Check className="w-4 h-4 text-primary font-bold" />}
                                                </div>
                                            )) : (
                                                <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                        <Database className="w-6 h-6 text-slate-200" />
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-medium">暂无可选择的数据集</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Version Selection */}
                                {selectedDatasetId && (
                                    <div className="space-y-4 animate-slide-in-up">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" /> 选择数据集版本
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedDataset?.versions.map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setSelectedVersion(v)}
                                                    className={cn(
                                                        "px-6 py-2.5 rounded-xl font-bold text-sm transition-all border-2",
                                                        selectedVersion === v
                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                            : "bg-white text-slate-500 border-slate-100 hover:border-primary/30"
                                                    )}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    disabled={!selectedVersion}
                                    className="px-10 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    下一步：配置参数 <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Parameter Configuration */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col animate-fade-in">
                            <div className="p-12 space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">完善上架参数</h2>
                                    <p className="text-sm text-slate-400 font-medium">设置数据集在市场展示的元数据，吸引更多用户订阅</p>
                                </div>

                                {/* Inherited Info Badge */}
                                <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-3xl border border-primary/10">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-primary/60 font-medium">已选择资源</div>
                                        <div className="text-sm font-bold text-slate-800">
                                            {selectedDataset?.name} <span className="text-primary mx-1">·</span> {selectedVersion}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* Basic Metadata */}
                                    <section className="space-y-6">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 数据集元数据
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500">数据集描述</label>
                                                <textarea
                                                    rows={3}
                                                    value={form.description}
                                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium resize-none shadow-sm shadow-slate-200/50"
                                                    placeholder="描述数据集的技术细节、应用价值等..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500">数据集用途</label>
                                                <textarea
                                                    rows={2}
                                                    value={form.purpose}
                                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium resize-none shadow-sm shadow-slate-200/50"
                                                    placeholder="说明数据集的最佳使用场景..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500">本次上架版本说明</label>
                                                <textarea
                                                    rows={2}
                                                    value={form.versionDesc}
                                                    onChange={(e) => setForm({ ...form, versionDesc: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium resize-none shadow-sm shadow-slate-200/50"
                                                    placeholder="描述该版本的变更内容、更新要点或特定注意事项..."
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Domains & Tags */}
                                    <section className="space-y-6">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 领域与标签
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-primary" /> 技术领域
                                                </label>
                                                <MultiSelectDropdown
                                                    options={TECHNICAL_DOMAINS}
                                                    selected={form.technicalDomain || []}
                                                    onChange={(v) => setForm(prev => ({ ...prev, technicalDomain: v }))}
                                                    placeholder="请选择适用的技术领域"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-primary" /> 行业领域
                                                </label>
                                                <MultiSelectDropdown
                                                    options={FLAT_INDUSTRIES}
                                                    selected={form.industryDomain || []}
                                                    onChange={(v) => setForm(prev => ({ ...prev, industryDomain: v }))}
                                                    placeholder="请选择适用的行业领域"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500">数据集标签</label>
                                                <div
                                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl group/tag-box hover:border-primary/30 transition-all cursor-pointer relative min-h-[56px]"
                                                    onClick={() => setTagEditorConfig({ open: true, title: "数据集标签编辑", field: "tags", tags: form.tags || [] })}
                                                >
                                                    <div className="flex flex-wrap gap-2 pr-8">
                                                        {form.tags?.map((t: KVTag, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                {t.key}: {t.value}
                                                            </span>
                                                        ))}
                                                        {(!form.tags || form.tags.length === 0) && <span className="text-xs text-slate-400 font-medium">点击设置标签...</span>}
                                                    </div>
                                                    <div className="absolute right-3 top-3 p-1.5 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/tag-box:opacity-100 transition-all">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500">版本标签</label>
                                                <div
                                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl group/vtag-box hover:border-primary/30 transition-all cursor-pointer relative min-h-[56px]"
                                                    onClick={() => setTagEditorConfig({ open: true, title: "版本标签编辑", field: "versionTags", tags: form.versionTags || [] })}
                                                >
                                                    <div className="flex flex-wrap gap-2 pr-8">
                                                        {form.versionTags?.map((t: KVTag, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider">
                                                                {t.key}: {t.value}
                                                            </span>
                                                        ))}
                                                        {(!form.versionTags || form.versionTags.length === 0) && <span className="text-xs text-slate-400 font-medium">点击设置标签...</span>}
                                                    </div>
                                                    <div className="absolute right-3 top-3 p-1.5 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/vtag-box:opacity-100 transition-all">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Dataset Introduction Section (formerly Custom Metadata) */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" /> 补充自定义数据集介绍
                                            </label>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                <button
                                                    onClick={() => setIntroTab("edit")}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all",
                                                        introTab === "edit" ? "bg-white text-primary shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                >
                                                    <Edit className="w-3.5 h-3.5" /> 编辑
                                                </button>
                                                <button
                                                    onClick={() => setIntroTab("preview")}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all",
                                                        introTab === "preview" ? "bg-white text-primary shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> 预览
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 rounded-[2rem] overflow-hidden focus-within:border-primary transition-all bg-white overflow-hidden shadow-sm">
                                            {introTab === "edit" ? (
                                                <textarea
                                                    rows={12}
                                                    value={form.customMetadata}
                                                    onChange={(e) => setForm({ ...form, customMetadata: e.target.value })}
                                                    className="w-full p-8 text-sm font-mono leading-relaxed bg-slate-50/30 focus:bg-white outline-none resize-none custom-scrollbar min-h-[400px]"
                                                    placeholder="请输入 Markdown 格式的数据集介绍..."
                                                    spellCheck={false}
                                                />
                                            ) : (
                                                <div className="w-full min-h-[400px] p-10 overflow-y-auto custom-scrollbar">
                                                    <div
                                                        className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 first:prose-h2:mt-0"
                                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(form.customMetadata || "") }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 px-1">
                                            <Info className="w-3 h-3 text-primary/50" /> 支持 Markdown 语法，完善的介绍能显著提升数据集的可见度与专业性
                                        </p>
                                    </section>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-auto p-12 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-8 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-white hover:border-slate-300 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> 返回上一步
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">确认即代表同意</div>
                                        <div className="text-xs text-slate-500 font-medium underline cursor-help hover:text-primary transition-colors">平台内容发布协议</div>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-12 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-600 transition-all shadow-xl shadow-primary/20"
                                    >
                                        提交上架申请 <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Support Info */}
                <div className="mt-8 flex items-center justify-center gap-12">
                    <div className="flex items-center gap-3 text-slate-400">
                        <ShieldCheck className="w-5 h-5 opacity-50" />
                        <span className="text-xs font-medium">数据安全保障</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                        <AlertCircle className="w-5 h-5 opacity-50" />
                        <span className="text-xs font-medium">合规发布准则</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                        <Info className="w-5 h-5 opacity-50" />
                        <span className="text-xs font-medium">技术支持：运维中心</span>
                    </div>
                </div>
            </div>

            {/* Tag Editor Dialog */}
            <TagEditorDialog
                open={tagEditorConfig.open}
                title={tagEditorConfig.title}
                tags={tagEditorConfig.tags}
                onClose={() => setTagEditorConfig({ ...tagEditorConfig, open: false })}
                onSave={(newTags) => {
                    setForm({ ...form, [tagEditorConfig.field]: newTags });
                }}
            />
        </div>
    );
}

// Icon helper
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

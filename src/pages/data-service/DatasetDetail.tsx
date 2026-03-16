import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronRight, Database, Copy, Clock, Users,
    FileText, FolderOpen, Table, CheckCircle2, Shield, Tag,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMarketplace } from "./mockData";
import { useApplicationStore } from "@/stores/useApplicationStore";
import { toast } from "sonner";
import { X, Building2, Mail } from "lucide-react";

const DatasetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("intro");
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const addApplication = useApplicationStore(state => state.addApplication);

    // 根据 ID 查找数据集
    const dataset = mockMarketplace.find(d => d.id === id) || mockMarketplace[0];

    // 聚合数据以匹配旧的 ds 结构并包含新字段
    const ds = {
        ...dataset,
        repoId: dataset.id, // 用户要求显示数据集 ID
        description: dataset.desc,
        // 使用 tasks 作为主要标签展示，以保持与集市卡片一致
        displayTags: dataset.tasks,
        license: "Apache 2.0" // 维持原有的协议展示或从 tags 中提取
    };

    const tabs = [
        { id: "intro", label: "数据集介绍", icon: FileText },
        { id: "files", label: "数据集文件", icon: FolderOpen },
        { id: "preview", label: "数据预览", icon: Table },
    ];

    return (
        <div className="animate-fade-in pb-12">
            {/* 面包屑 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <button onClick={() => navigate("/data-service/marketplace")} className="hover:text-primary transition-colors">数据集集市</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">数据集详情</span>
            </div>

            {/* 页头区域 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-sm">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                            <Database className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-slate-900">{ds.name}</h1>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                    <span>dataset_id: {ds.repoId}</span>
                                    <button className="p-1 hover:bg-slate-100 rounded transition-colors"><Copy className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {ds.displayTags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] items-center gap-1.5 rounded-md border border-slate-100 flex">
                                        <CheckCircle2 className="w-3 h-3 text-primary/60" /> {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                        <span className="text-[10px] text-primary">{ds.creator[0]}</span>
                                    </div>
                                    <span>{ds.creator}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>更新于 {ds.updatedAt}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>使用量 {ds.applyCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsApplyModalOpen(true)}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            申请使用
                        </button>
                    </div>
                </div>
            </div>

            {/* 内容页签区 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex border-b border-slate-200 px-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "py-5 px-6 text-sm font-medium transition-all relative border-b-2",
                                activeTab === tab.id ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8 min-h-[400px]">
                    {activeTab === "intro" && (
                        <div className="prose prose-slate max-w-none">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="bg-black text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold">github</span>
                                <span className="bg-slate-200 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">data</span>
                                <span className="bg-orange-500 text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold">huggingface</span>
                                <span className="bg-red-700 text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold">paper</span>
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 mb-8">{ds.name}</h2>

                            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                I. 基准介绍
                            </h3>
                            <p className="text-slate-600 leading-relaxed mb-8">
                                {ds.description}
                            </p>

                            <p className="text-slate-600 font-bold mb-2">数据集介绍：</p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-8">
                                <li>ReasoningMath.jsonl 为数据文件，总计开源100道题，包括了序号 (id), 难度 (difficulty), 学科分类 (subject), 题目 (question), 最终解答 (final_answer)。</li>
                                <li>Selected Problem Appendix.xlsx 为部分题目详解附录，总计开源30道题，包括了序号，思维链分析标准，解题分析标准。</li>
                                <li>SKYLENAGE Technical Report.pdf 为技术报告。</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                II. 基准特性
                            </h3>
                            {/* ... 更多内容 ... */}
                        </div>
                    )}

                    {activeTab === "files" && (
                        <div className="animate-in fade-in duration-500">
                            {/* 文件操作栏 */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 gap-2 text-xs">
                                        <span className="text-slate-500">版本 /</span>
                                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                                            V1.0 <ChevronDown className="w-3 h-3" />
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <span>{ds.name}</span>
                                        <span className="text-slate-300">/</span>
                                    </div>
                                </div>
                            </div>

                            {/* 文件列表 */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm">
                                <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="font-medium text-slate-700">aistudio18332623</span>
                                        <span>Update README.md</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="font-semibold text-slate-600">6 commits</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 bg-white">
                                    {[
                                        { name: "README.md", size: "3.40KB", msg: "Update README.md", time: "11 天前", canView: true },
                                        { name: "ReasoningMath.jsonl", size: "38.15KB", msg: "数据集上传", time: "17 天前", canView: false, isRed: true },
                                        { name: "SKYLENAGE Technical Report.pdf", size: "3.17MB", msg: "数据集上传", time: "17 天前", canView: false, isRed: true },
                                        { name: "Selected Problem Appendix.xlsx", size: "14.67KB", msg: "数据集上传", time: "17 天前", canView: false, isRed: true },
                                        { name: "dataset_infos.json", size: "0.26KB", msg: "数据集上传", time: "17 天前", canView: true },
                                    ].map((file, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-sm text-slate-700 font-medium truncate flex items-center gap-1.5">
                                                    {file.name}
                                                    {file.isRed && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                                                </span>
                                            </div>
                                            <div className="w-24 text-right text-xs text-slate-400 font-medium">{file.size}</div>
                                            <div className="flex-1 px-8 text-xs text-slate-500 truncate">{file.msg}</div>
                                            <div className="w-24 text-right text-xs text-slate-400">{file.time}</div>
                                            <div className="w-32 flex items-center justify-end gap-4 text-xs">
                                                {file.canView ? (
                                                    <button className="text-primary font-medium hover:underline">查看</button>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === "preview" && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Table className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">数据预览内容仅在该板块下显示</p>
                        </div>
                    )}
                </div>
            </div>
            {/* 申请使用弹窗 */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsApplyModalOpen(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* 弹窗头部 */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">申请使用数据集</h2>
                                <p className="text-xs text-slate-500 mt-1">提交申请以获取数据集访问及使用权限</p>
                            </div>
                            <button onClick={() => setIsApplyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* 弹窗内容 */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="apply-form" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                addApplication({
                                    dataset: ds.name,
                                    datasetId: ds.repoId,
                                    creator: ds.creator,
                                    creatorOrg: "官方数据中心", // 假设组织，实际可从数据源获取
                                    permission: formData.get('permission') as string,
                                    reason: formData.get('reason') as string,
                                    company: formData.get('company') as string,
                                    email: formData.get('email') as string,
                                });
                                setIsApplyModalOpen(false);
                                toast.success("申请提交成功！可在“我的申请”中查看进度。");
                            }} className="space-y-6">
                                {/* 固定信息展示 */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">数据集名称</p>
                                        <p className="text-sm font-medium text-slate-700 truncate">{ds.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">数据集 ID</p>
                                        <p className="text-sm font-medium text-slate-700 font-mono">{ds.repoId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">创建人</p>
                                        <p className="text-sm font-medium text-slate-700">{ds.creator}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">创建人组织</p>
                                        <p className="text-sm font-medium text-slate-700">官方数据中心</p>
                                    </div>
                                </div>

                                {/* 自定义字段 */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" /> 申请公司/机构
                                            </label>
                                            <input
                                                name="company"
                                                required
                                                placeholder="请输入您的公司名称"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> 联系邮箱
                                            </label>
                                            <input
                                                name="email"
                                                required
                                                type="email"
                                                placeholder="example@company.com"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {/* 申请权限 */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-slate-400" /> 申请权限
                                        </label>
                                        <div className="flex gap-4">
                                            {['只读', '读写'].map((p) => (
                                                <label key={p} className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:bg-primary/5 has-[:checked]:border-primary has-[:checked]:text-primary group">
                                                    <input type="radio" name="permission" value={p} defaultChecked={p === '只读'} className="hidden" />
                                                    <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center group-has-[:checked]:border-primary transition-all">
                                                        <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-has-[:checked]:opacity-100 transition-all" />
                                                    </div>
                                                    <span className="text-sm font-medium">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 申请理由 */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> 申请理由
                                            </div>
                                            <span className="font-normal text-[10px] text-slate-400">最多 300 字</span>
                                        </label>
                                        <textarea
                                            name="reason"
                                            required
                                            maxLength={300}
                                            rows={4}
                                            placeholder="请详细说明您的使用场景及目的..."
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* 弹窗底部 */}
                        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white sticky bottom-0 z-20">
                            <button
                                onClick={() => setIsApplyModalOpen(false)}
                                className="px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                form="apply-form"
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                提交申请
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatasetDetail;

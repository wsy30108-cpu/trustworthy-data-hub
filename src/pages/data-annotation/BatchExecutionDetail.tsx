import { useState } from "react";
import {
    ArrowLeft, Search, Filter, Info,
    CheckCircle2, Clock, AlertCircle, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";

interface ResourceItem {
    id: number;
    name: string;
    status: "未开始" | "进行中" | "已完成";
    isAnnotated: boolean;
    isSkipped?: boolean;
    isQA?: boolean;
    isAccepted?: boolean;
    rejectCount?: number;
    rejectType?: string;
    rejectReason?: string;
    annotator: string;
    qaer?: string;
    accepter?: string;
    updatedAt?: string;
}

interface BatchExecutionDetailProps {
    task: {
        id: string;
        taskName: string;
        source: string;
        currentStatus: string;
        total: number;
        done: number;
    };
    onBack: () => void;
    onResourceClick: (id: number) => void;
}

const BatchExecutionDetail = ({ task, onBack, onResourceClick }: BatchExecutionDetailProps) => {
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Mock statistics based on task
    const stats = [
        { label: "数据总量", value: "1,000", unit: "条", color: "text-slate-900" },
        { label: "待标注量", value: "300", unit: "条", color: "text-blue-600" },
        { label: "待质检量", value: "200", unit: "条", color: "text-emerald-500" },
        { label: "待验收量", value: "100", unit: "条", color: "text-amber-500" },
        { label: "质检不合格量", value: "12", unit: "条", color: "text-rose-600" },
        { label: "验收不合格量", value: "8", unit: "条", color: "text-rose-600" },
    ];

    // Mock resources
    const mockResources: ResourceItem[] = Array.from({ length: 25 }).map((_, i) => ({
        id: i + 1,
        name: `0071270${46 + i}`,
        status: i % 3 === 0 ? "未开始" : i % 3 === 1 ? "进行中" : "已完成",
        isAnnotated: i % 3 !== 0,
        isSkipped: i === 4,
        isQA: i % 4 === 0,
        isAccepted: i % 5 === 0,
        rejectCount: i === 2 ? 1 : 0,
        rejectType: i === 2 ? "类别错误" : "-",
        rejectReason: i === 2 ? "边界识别不清晰" : "-",
        annotator: "张三",
        qaer: i % 4 === 0 ? "李四" : "-",
        accepter: i % 5 === 0 ? "王五" : "-",
        updatedAt: "2026-01-24 10:00:00"
    }));

    const filtered = mockResources.filter(r =>
        r.name.includes(searchText) || r.id.toString().includes(searchText)
    );

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Determine view mode
    const isRejected = task.source === "质检驳回" || task.source === "验收驳回";
    const isQI = task.currentStatus === "质检中";
    const isAcceptance = task.currentStatus === "验收中";

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            任务详情
                        </h1>
                        <p className="text-xs text-muted-foreground">查看该任务的详细信息</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-[#4f46e5] text-white rounded-md text-sm font-medium hover:bg-[#4338ca] transition-colors shadow-sm">
                    启动 / 继续任务
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
                {/* Task Info */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-bold text-slate-900">
                        标注批次ID: {task.id} <span className="text-slate-500 font-normal">({task.taskName})</span>
                    </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-slate-500 mb-2">{s.label}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
                                <span className="text-[10px] text-slate-400">{s.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                    {/* Table Toolbar */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="查找资源名称 / 序号"
                                value={searchText}
                                onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b text-slate-500 font-medium">
                                    <th className="py-3 px-4 text-center w-20">标注资源 ID</th>
                                    <th className="py-3 px-4 text-left">资源名称</th>
                                    <th className="py-3 px-4 text-center">状态</th>
                                    {isRejected && <th className="py-3 px-4 text-center">是否标注</th>}
                                    {isRejected && <th className="py-3 px-4 text-center">是否跳过</th>}
                                    {isQI && <th className="py-3 px-4 text-center">是否质检</th>}
                                    {isAcceptance && <th className="py-3 px-4 text-center">是否验收</th>}

                                    {isRejected && (
                                        <>
                                            <th className="py-3 px-4 text-center">驳回次数</th>
                                            <th className="py-3 px-4 text-center">驳回类型</th>
                                            <th className="py-3 px-4 text-left">驳回理由</th>
                                        </>
                                    )}

                                    <th className="py-3 px-4 text-left">标注人员</th>

                                    {isQI && <th className="py-3 px-4 text-left">质检人员</th>}
                                    {isAcceptance && <th className="py-3 px-4 text-left">验收人员</th>}

                                    <th className="py-3 px-4 text-left">更新时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(r => (
                                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-slate-700">
                                        <td className="py-4 px-4 text-center text-slate-500">{r.id}</td>
                                        <td
                                            className="py-4 px-4 text-indigo-600 font-medium hover:underline cursor-pointer"
                                            onClick={() => onResourceClick(r.id)}
                                        >
                                            {r.name}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-medium border ${r.status === "未开始" ? "text-blue-600 bg-blue-50 border-blue-200" :
                                                r.status === "进行中" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                                                    "text-slate-400 bg-slate-50 border-slate-200"
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        {isRejected && (
                                            <>
                                                <td className="py-4 px-4 text-center font-medium text-slate-900">{r.isAnnotated ? "1" : "0"}</td>
                                                <td className="py-4 px-4 text-center text-slate-400">{r.isSkipped ? "1" : "-"}</td>
                                            </>
                                        )}
                                        {isQI && (
                                            <td className="py-4 px-4 text-center font-medium text-slate-900">{r.isQA ? "2" : "0"}</td>
                                        )}
                                        {isAcceptance && (
                                            <td className="py-4 px-4 text-center font-medium text-slate-900">{r.isAccepted ? "1" : "0"}</td>
                                        )}

                                        {isRejected && (
                                            <>
                                                <td className="py-4 px-4 text-center text-slate-900">{r.rejectCount || 0}</td>
                                                <td className="py-4 px-4 text-center text-slate-600">{r.rejectType || "-"}</td>
                                                <td className="py-4 px-4 text-left text-slate-500 max-w-[120px] truncate" title={r.rejectReason}>{r.rejectReason || "-"}</td>
                                            </>
                                        )}

                                        <td className="py-4 px-4 text-slate-700">{r.annotator}</td>

                                        {isQI && <td className="py-4 px-4 text-slate-600">{r.qaer}</td>}
                                        {isAcceptance && <td className="py-4 px-4 text-slate-600">{r.accepter}</td>}

                                        <td className="py-4 px-4 text-slate-400 text-[10px]">{r.updatedAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                        <div className="flex items-center gap-1">
                            共 <span className="font-medium text-slate-900">{filtered.length}</span> 条标注资源
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-200 text-slate-500"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">跳至</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    defaultValue={currentPage}
                                    onBlur={e => {
                                        const val = parseInt(e.target.value);
                                        if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                    }}
                                    className="w-10 h-7 border border-slate-200 rounded bg-white text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-slate-400">页</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchExecutionDetail;

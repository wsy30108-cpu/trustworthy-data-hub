import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface LocationState {
  memberName: string;
  memberAccount: string;
  teamName: string;
}

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 border border-blue-200",
  "图像类": "bg-green-50 text-green-700 border border-green-200",
  "音频类": "bg-amber-50 text-amber-700 border border-amber-200",
  "视频类": "bg-purple-50 text-purple-700 border border-purple-200",
  "表格类": "bg-cyan-50 text-cyan-700 border border-cyan-200",
  "跨模态类": "bg-rose-50 text-rose-700 border border-rose-200",
};

const MOCK_SPACES = [
  { id: "ws-1", name: "AI数据团队空间" },
  { id: "ws-2", name: "NLP研发组" },
  { id: "ws-4", name: "北京AI研究院" },
  { id: "ws-6", name: "数据标注中心" },
];

interface SpacePerformance {
  spaceId: string;
  spaceName: string;
  taskCount: number;
  completed: number;
  inProgress: number;
  progress: string;
  effectiveHours: number;
  totalQaRate: string;
  acceptanceRate: string;
}

interface TeamTaskDetail {
  id: string;
  spaceName: string;
  memberName: string;
  taskName: string;
  projectType: string;
  total: number;
  submitted: number;
  valid: number;
  progress: string;
  hours: number;
  efficiency: number;
  firstPass: string;
  totalPass: string;
  acceptPassed: number;
  acceptRate: string;
  invalid: number;
}

function generateSpacePerformances(): SpacePerformance[] {
  return MOCK_SPACES.map((sp, i) => {
    const taskCount = Math.floor(Math.random() * 50) + 20;
    const completed = Math.floor(taskCount * (Math.random() * 0.4 + 0.3));
    const inProgress = taskCount - completed;
    return {
      spaceId: sp.id,
      spaceName: sp.name,
      taskCount,
      completed,
      inProgress,
      progress: `${Math.round((completed / taskCount) * 100)}%`,
      effectiveHours: parseFloat((Math.random() * 80 + 20).toFixed(1)),
      totalQaRate: `${Math.round(Math.random() * 20 + 70)}%`,
      acceptanceRate: `${Math.round(Math.random() * 15 + 75)}%`,
    };
  });
}

function generateTaskDetails(memberName: string): TeamTaskDetail[] {
  const taskNames = ["xxx图像框", "xxx文本分类", "xxxx分割", "语音转写", "视频打标", "表格信息抽取", "跨模态匹配", "实体识别"];
  const projectTypes = ["图像类", "文本类", "音频类", "视频类", "表格类", "跨模态类"];
  const details: TeamTaskDetail[] = [];
  const numTasks = Math.floor(Math.random() * 5) + 3;
  for (let t = 0; t < numTasks; t++) {
    const total = Math.floor(Math.random() * 200) + 50;
    const submitted = Math.floor(total * (Math.random() * 0.5 + 0.5));
    const valid = Math.floor(submitted * (Math.random() * 0.2 + 0.7));
    const progress = submitted >= total ? "已完成" : "进行中";
    const sp = MOCK_SPACES[t % MOCK_SPACES.length];
    details.push({
      id: `td_${t}`,
      spaceName: sp.name,
      memberName,
      taskName: taskNames[t % taskNames.length],
      projectType: projectTypes[t % projectTypes.length],
      total,
      submitted,
      valid,
      progress,
      hours: parseFloat((Math.random() * 20 + 1).toFixed(2)),
      efficiency: parseFloat((Math.random() * 20 + 5).toFixed(2)),
      firstPass: `${Math.round(Math.random() * 15 + 80)}%`,
      totalPass: `${Math.round(Math.random() * 10 + 85)}%`,
      acceptPassed: valid,
      acceptRate: `${Math.round(Math.random() * 10 + 80)}%`,
      invalid: Math.floor(Math.random() * 15) + 1,
    });
  }
  return details;
}

const MemberPerformanceDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const memberName = state?.memberName || "未知成员";
  const memberAccount = state?.memberAccount || "";
  const teamName = state?.teamName || "";

  const [projectType, setProjectType] = useState("全部类型");
  const [filterSpace, setFilterSpace] = useState("全部空间");
  const [taskSearch, setTaskSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock data
  const spacePerformances = useMemo(() => generateSpacePerformances(), []);
  const taskDetails = useMemo(() => generateTaskDetails(memberName), [memberName]);

  // Filtered & paginated task details
  const filteredDetails = useMemo(() => {
    return taskDetails.filter(d => {
      if (filterSpace !== "全部空间" && d.spaceName !== filterSpace) return false;
      if (projectType !== "全部类型" && d.projectType !== projectType) return false;
      if (taskSearch && !d.taskName.includes(taskSearch)) return false;
      return true;
    });
  }, [taskDetails, filterSpace, projectType, taskSearch]);

  const paginatedDetails = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDetails.slice(start, start + pageSize);
  }, [filteredDetails, page, pageSize]);

  const totalPages = Math.ceil(filteredDetails.length / pageSize);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalAnnotation = spacePerformances.reduce((a, s) => a + s.taskCount, 0);
    const totalCompleted = spacePerformances.reduce((a, s) => a + s.completed, 0);
    const totalInProgress = spacePerformances.reduce((a, s) => a + s.inProgress, 0);
    const totalHours = spacePerformances.reduce((a, s) => a + s.effectiveHours, 0);
    const avgQaRate = spacePerformances.length > 0
      ? Math.round(spacePerformances.reduce((a, s) => a + parseFloat(s.totalQaRate), 0) / spacePerformances.length)
      : 0;
    const avgAcceptRate = spacePerformances.length > 0
      ? Math.round(spacePerformances.reduce((a, s) => a + parseFloat(s.acceptanceRate), 0) / spacePerformances.length)
      : 0;
    return {
      totalAnnotation,
      totalCompleted,
      totalInProgress,
      totalHours: totalHours.toFixed(1),
      avgQaRate: `${avgQaRate}%`,
      avgAcceptRate: `${avgAcceptRate}%`,
    };
  }, [spacePerformances]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-muted/50 border bg-background shadow-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{memberName} - 绩效详情</h1>
          {teamName && <p className="text-xs text-slate-500 mt-0.5">所属团队: {teamName}</p>}
        </div>
      </div>

      {/* User Info Header */}
      <div className="bg-white px-8 py-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center">
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">姓名</span>
            <span className="text-sm font-bold text-slate-900">{memberName}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">用户名</span>
            <span className="text-sm font-bold text-slate-900">{memberAccount}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">所属团队</span>
            <span className="text-sm font-bold text-slate-900">{teamName || "-"}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">参与空间数量</span>
            <span className="text-sm font-bold text-slate-900">{MOCK_SPACES.length}</span>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">任务汇总情况</h3>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-4">
            {/* Left: Task count card */}
            <div className="w-[160px] bg-[#f8fafc] p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs text-slate-500 mb-4">参与任务数量</span>
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{summaryStats.totalAnnotation}</span>
                </div>
                <div className="mt-6 flex justify-between w-full text-[10px] text-slate-500">
                  <div className="flex flex-col items-center">
                    <span className="mb-1">进行中</span>
                    <span className="font-bold text-slate-900 text-sm">{summaryStats.totalInProgress}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="mb-1">已完成</span>
                    <span className="font-bold text-slate-900 text-sm">{summaryStats.totalCompleted}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: Two rows of stats */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-4 rounded-xl border border-slate-100">
                {[
                  { label: "标注总量", value: `${summaryStats.totalAnnotation}`, unit: "条" },
                  { label: "有效标注量", value: `${Math.round(summaryStats.totalAnnotation * 0.8)}`, unit: "条" },
                  { label: "预标签修改量", value: `${Math.round(summaryStats.totalAnnotation * 0.1)}`, unit: "条" },
                  { label: "有效标注时长", value: summaryStats.totalHours, unit: "小时" },
                  { label: "标注效率", value: (summaryStats.totalAnnotation / parseFloat(summaryStats.totalHours)).toFixed(2), unit: "条/小时" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center justify-center text-center border-r last:border-0 border-slate-200/50">
                    <span className="text-[11px] text-slate-500 mb-2">{s.label}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-900">{s.value}</span>
                      <span className="text-[10px] text-slate-400">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-4 rounded-xl border border-slate-100">
                {[
                  { label: "初检合格率", value: `${Math.round(Math.random() * 10 + 75)}`, unit: "%" },
                  { label: "总体质检合格率", value: summaryStats.avgQaRate, unit: "" },
                  { label: "验收通过量", value: `${Math.round(summaryStats.totalAnnotation * 0.7)}`, unit: "条" },
                  { label: "验收合格率", value: summaryStats.avgAcceptRate, unit: "" },
                  { label: "无效数据数量", value: `${Math.round(summaryStats.totalAnnotation * 0.05)}`, unit: "条" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center justify-center text-center border-r last:border-0 border-slate-200/50">
                    <span className="text-[11px] text-slate-500 mb-2">{s.label}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-900">{s.value}</span>
                      <span className="text-[10px] text-slate-400">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Space Performance */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">各空间绩效</h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-900">
                <th className="py-4 px-4 text-left font-bold">空间名称</th>
                <th className="py-4 px-4 text-center font-bold">任务数量</th>
                <th className="py-4 px-4 text-center font-bold">已完成数量</th>
                <th className="py-4 px-4 text-center font-bold">进行中数量</th>
                <th className="py-4 px-4 text-center font-bold">完成进度</th>
                <th className="py-4 px-4 text-center font-bold">有效标注时长(小时)</th>
                <th className="py-4 px-4 text-center font-bold">总体质检合格率</th>
                <th className="py-4 px-4 text-center font-bold">验收合格率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {spacePerformances.map((sp, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-4 text-slate-700 font-medium">{sp.spaceName}</td>
                  <td className="py-5 px-4 text-center">{sp.taskCount}</td>
                  <td className="py-5 px-4 text-center text-emerald-600">{sp.completed}</td>
                  <td className="py-5 px-4 text-center text-blue-600">{sp.inProgress}</td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${parseInt(sp.progress) >= 80 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: sp.progress }}></div>
                      </div>
                      <span className="text-[10px] text-slate-500">{sp.progress}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center font-mono">{sp.effectiveHours}</td>
                  <td className="py-5 px-4 text-center font-mono">{sp.totalQaRate}</td>
                  <td className="py-5 px-4 text-center font-mono">{sp.acceptanceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 mr-auto">任务明细</h3>
          <div className="relative group">
            <select
              value={filterSpace}
              onChange={(e) => { setFilterSpace(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-600 outline-none cursor-pointer min-w-[130px] appearance-none"
            >
              <option value="全部空间">全部空间</option>
              {MOCK_SPACES.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <select
              value={projectType}
              onChange={(e) => { setProjectType(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-600 outline-none cursor-pointer min-w-[130px] appearance-none"
            >
              <option value="全部类型">全部类型</option>
              <option value="图像类">图像类</option>
              <option value="文本类">文本类</option>
              <option value="音频类">音频类</option>
              <option value="视频类">视频类</option>
              <option value="表格类">表格类</option>
              <option value="跨模态类">跨模态类</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => { setTaskSearch(e.target.value); setPage(1); }}
              placeholder="搜索任务名称"
              className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-xs w-48 focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-900">
                  <th className="py-4 px-4 text-left font-bold">空间</th>
                  <th className="py-4 px-4 text-left font-bold">任务名称</th>
                  <th className="py-4 px-4 text-center font-bold">任务类型</th>
                  <th className="py-4 px-4 text-center font-bold">领取标注总量</th>
                  <th className="py-4 px-4 text-center font-bold">已提交数量</th>
                  <th className="py-4 px-4 text-center font-bold">有效标注量</th>
                  <th className="py-4 px-4 text-center font-bold w-[120px]">进度</th>
                  <th className="py-4 px-4 text-center font-bold">有效定时长(小时)</th>
                  <th className="py-4 px-4 text-center font-bold">效率(条/小时)</th>
                  <th className="py-4 px-4 text-center font-bold">初检合格率</th>
                  <th className="py-4 px-4 text-center font-bold">总体质检合格率</th>
                  <th className="py-4 px-4 text-center font-bold">验收通过量</th>
                  <th className="py-4 px-4 text-center font-bold">验收合格率</th>
                  <th className="py-4 px-4 text-center font-bold">无效数据量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDetails.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap">{d.spaceName}</td>
                    <td className="py-4 px-4 text-slate-700">{d.taskName}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[d.projectType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {d.projectType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">{d.total}</td>
                    <td className="py-4 px-4 text-center">{d.submitted}</td>
                    <td className="py-4 px-4 text-center">{d.valid}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${d.progress === "已完成"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                        {d.progress}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono">{d.hours}</td>
                    <td className="py-4 px-4 text-center font-mono">{d.efficiency}</td>
                    <td className="py-4 px-4 text-center">{d.firstPass}</td>
                    <td className="py-4 px-4 text-center">{d.totalPass}</td>
                    <td className="py-4 px-4 text-center">{d.acceptPassed}</td>
                    <td className="py-4 px-4 text-center">{d.acceptRate}</td>
                    <td className="py-4 px-4 text-center">{d.invalid}</td>
                  </tr>
                ))}
                {paginatedDetails.length === 0 && (
                  <tr><td colSpan={14} className="py-12 text-center text-sm text-muted-foreground">暂无匹配的任务明细</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>共 {filteredDetails.length} 条任务</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const num = i + 1;
                    return (
                      <span
                        key={num}
                        className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${page === num ? "bg-[#4f46e5] text-white font-bold" : "hover:bg-slate-200"}`}
                        onClick={() => setPage(num)}
                      >
                        {num}
                      </span>
                    );
                  })}
                </div>
                <button
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 border border-slate-200 rounded bg-white text-[11px] outline-none cursor-pointer"
                >
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={50}>50条/页</option>
                </select>
                <span>跳至</span>
                <input
                  type="text"
                  className="w-10 h-6 border border-slate-200 rounded bg-white text-center outline-none"
                  value={page}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
                  }}
                />
                <span>页</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPerformanceDetail;

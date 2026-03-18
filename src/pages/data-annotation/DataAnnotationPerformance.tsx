import { useState } from "react";
import {
  Users, User, Briefcase, Building2,
  Search, Calendar, ChevronDown, Download,
  ArrowUpRight, Info, ChevronLeft, ChevronRight
} from "lucide-react";

interface PerformanceDetail {
  name: string;
  projectType: string;
  total: number;
  submitted: number;
  valid: number;
  progress: string;
  hours: number;
  efficiency: number;
  firstPass?: string;
  totalPass?: string;
  acceptPassed?: number;
  acceptRate?: string;
  voteConsistency?: string;
  invalid: number;
}

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 border border-blue-200",
  "图像类": "bg-green-50 text-green-700 border border-green-200",
  "音频类": "bg-amber-50 text-amber-700 border border-amber-200",
  "视频类": "bg-purple-50 text-purple-700 border border-purple-200",
  "表格类": "bg-cyan-50 text-cyan-700 border border-cyan-200",
  "跨模态类": "bg-rose-50 text-rose-700 border border-rose-200",
};

const DataAnnotationPerformance = () => {
  const [tab, setTab] = useState<"annotation" | "qa" | "accept">("annotation");
  const [projectType, setProjectType] = useState("全部类型");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock User Info
  const userInfo = {
    name: tab === "annotation" ? "张三" : tab === "qa" ? "李四" : "王五",
    username: tab === "annotation" ? "zhangsan-3" : tab === "qa" ? "lisi-4" : "wangwu-5",
    team: tab === "qa" ? "xx" : "-",
    org: "数据标注机构12"
  };

  // Mock Summary Stats (Dynamic based on Tab)
  const renderSummary = () => {
    if (tab === "annotation") {
      return (
        <div className="flex gap-4">
          <div className="w-[160px] bg-[#f8fafc] p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs text-slate-500 mb-4">参与任务数量</span>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">15</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-6 flex justify-between w-full text-[10px] text-slate-500">
                <div className="flex flex-col items-center">
                  <span className="mb-1">进行中</span>
                  <span className="font-bold text-slate-900 text-sm">9</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mb-1">已完成</span>
                  <span className="font-bold text-slate-900 text-sm">6</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-4 rounded-xl border border-slate-100">
              {[
                { label: "标注总量", value: "48", unit: "条" },
                { label: "有效标注量", value: "40", unit: "条" },
                { label: "预标签修改量", value: "5", unit: "条" },
                { label: "有效标注时长", value: "14.6", unit: "小时" },
                { label: "标注效率", value: "0.78", unit: "条/小时" },
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
                { label: "初检合格率", value: "67", unit: "%" },
                { label: "总体质检合格率", value: "74", unit: "%" },
                { label: "验收通过量", value: "50", unit: "条" },
                { label: "验收合格率", value: "83", unit: "%" },
                { label: "无效数据数量", value: "3", unit: "条" },
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
      );
    }

    if (tab === "qa") {
      return (
        <div className="flex gap-4">
          <div className="w-[160px] bg-[#f8fafc] p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs text-slate-500 mb-4">参与任务数量</span>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">25</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-6 flex justify-between w-full text-[10px] text-slate-500">
                <div className="flex flex-col items-center">
                  <span className="mb-1">进行中</span>
                  <span className="font-bold text-slate-900 text-sm">19</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mb-1">已完成</span>
                  <span className="font-bold text-slate-900 text-sm">6</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-6 rounded-xl border border-slate-100 h-[100px]">
              {[
                { label: "质检总量", value: "48", unit: "条" },
                { label: "有效质检量", value: "40", unit: "条" },
                { label: "有效质检时长", value: "14.6", unit: "小时" },
                { label: "质检效率", value: "0.78", unit: "条/小时" },
                { label: "无效数据数量", value: "3", unit: "条" },
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
            <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-6 rounded-xl border border-slate-100 h-[100px]">
              {[
                { label: "初检合格率", value: "67", unit: "%" },
                { label: "总体质检合格率", value: "74", unit: "%" },
                { label: "投票一致率", value: "83", unit: "%" },
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
      );
    }

    // Acceptance Tab
    return (
      <div className="flex gap-4">
        <div className="w-[160px] bg-[#f8fafc] p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs text-slate-500 mb-4">参与任务数量</span>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">10</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-6 flex justify-between w-full text-[10px] text-slate-500">
              <div className="flex flex-col items-center">
                <span className="mb-1">进行中</span>
                <span className="font-bold text-slate-900 text-sm">7</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-1">已完成</span>
                <span className="font-bold text-slate-900 text-sm">3</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-6 rounded-xl border border-slate-100 h-[100px]">
            {[
              { label: "验收总量", value: "48", unit: "条" },
              { label: "有效验收量", value: "40", unit: "条" },
              { label: "有效验收时长", value: "14.6", unit: "小时" },
              { label: "验收效率", value: "0.78", unit: "条/小时" },
              { label: "无效数据数量", value: "3", unit: "条" },
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
          <div className="grid grid-cols-5 gap-4 bg-[#f1f5f9]/50 p-6 rounded-xl border border-slate-100 h-[100px]">
            {[
              { label: "验收合格率", value: "83", unit: "%" },
              { label: "投票一致率", value: "83", unit: "%" },
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
    );
  };

  // Mock detailed data
  const details: PerformanceDetail[] = [
    { name: "xxx图像框", projectType: "图像类", total: 230, submitted: 230, valid: 120, progress: "已完成", hours: 9.08, efficiency: 23.56, firstPass: "96%", totalPass: "98%", acceptPassed: 120, acceptRate: "97%", voteConsistency: "83%", invalid: 30 },
    { name: "xxx文本分类", projectType: "文本类", total: 320, submitted: 201, valid: 190, progress: "进行中", hours: 11.4, efficiency: 23.56, invalid: 8 },
    { name: "xxxx分割", projectType: "图像类", total: 100, submitted: 78, valid: 70, progress: "进行中", hours: 3.9, efficiency: 23.56, invalid: 12 },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#f8fafc] animate-fade-in min-h-screen">
      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 mb-2">
        {[
          { id: "annotation", label: "标注任务" },
          { id: "qa", label: "质检任务" },
          { id: "accept", label: "验收任务" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`pb-3 text-sm font-medium transition-all relative ${tab === t.id ? "text-[#4f46e5]" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4f46e5]" />
            )}
          </button>
        ))}
      </div>

      {/* User Info Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex flex-col gap-3 flex-1">
          <span className="text-xs text-slate-400">姓名</span>
          <span className="text-sm font-bold text-slate-900">{userInfo.name}</span>
        </div>
        <div className="flex flex-col gap-3 flex-1 px-8 border-x border-slate-100">
          <span className="text-xs text-slate-400">用户名</span>
          <span className="text-sm font-bold text-slate-900">{userInfo.username}</span>
        </div>
        <div className="flex flex-col gap-3 flex-1 px-8">
          <span className="text-xs text-slate-400">所属团队</span>
          <span className="text-sm font-bold text-slate-900">{userInfo.team}</span>
        </div>
        <div className="flex flex-col gap-3 flex-1 px-8 border-l border-slate-100">
          <span className="text-xs text-slate-400">所属机构</span>
          <span className="text-sm font-bold text-slate-900">{userInfo.org}</span>
        </div>
      </div>

      {/* Summary Header */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          任务汇总情况
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-600 outline-none cursor-pointer min-w-[150px] appearance-none"
            >
              <option value="全部类型">全部类型</option>
              <option value="图像类">图像类</option>
              <option value="文本类">文本类</option>
              <option value="音频类">音频类</option>
              <option value="视频类">视频类</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {/* Unified Date Range Picker */}
          <div className="relative">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-white cursor-pointer transition-colors ${showDatePicker ? 'border-[#4f46e5] ring-1 ring-[#4f46e5]/20' : 'border-slate-200 hover:border-[#4f46e5]/50'}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <div className="flex items-center min-w-[200px]">
                <span className={`text-xs flex-1 ${dateRange.start ? 'text-slate-900' : 'text-slate-400'}`}>
                  {dateRange.start || '开始日期'}
                </span>
                <span className="text-slate-300 px-2 text-xs">→</span>
                <span className={`text-xs flex-1 ${dateRange.end ? 'text-slate-900' : 'text-slate-400'}`}>
                  {dateRange.end || '结束日期'}
                </span>
              </div>
              <Calendar className={`w-3.5 h-3.5 ml-2 ${showDatePicker ? 'text-[#4f46e5]' : 'text-slate-400'}`} />
            </div>

            {/* Date Picker Dropdown (Mockup) */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 w-[560px] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex gap-4">
                  {/* Left Calendar (March 2026) */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2 text-slate-400">
                        <button className="hover:text-slate-900 leading-none">«</button>
                        <button className="hover:text-slate-900 leading-none">‹</button>
                      </div>
                      <span className="font-bold text-sm text-slate-900">2026年 3月</span>
                      <div className="flex gap-2 text-slate-400 opacity-0 pointer-events-none">
                        <button>›</button>
                        <button>»</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 text-center text-xs mb-2">
                      {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                        <div key={d} className="font-medium text-slate-900 pb-1">{d}</div>
                      ))}

                      {/* Previous month days */}
                      {[23, 24, 25, 26, 27, 28].map(d => (
                        <div key={`prev-${d}`} className="text-slate-300 py-1.5">{d}</div>
                      ))}

                      {/* Current month days */}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <div
                          key={d}
                          className={`py-1.5 rounded cursor-pointer transition-colors ${d === 18 ? 'bg-blue-50 border border-blue-400 text-blue-600 font-medium' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          onClick={() => {
                            setDateRange(prev => ({ ...prev, start: `2026-03-${d.toString().padStart(2, '0')}` }));
                            if (dateRange.end) setShowDatePicker(false);
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-[1px] bg-slate-100 mx-2"></div>

                  {/* Right Calendar (April 2026) */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2 text-slate-400 opacity-0 pointer-events-none">
                        <button>«</button>
                        <button>‹</button>
                      </div>
                      <span className="font-bold text-sm text-slate-900">2026年 4月</span>
                      <div className="flex gap-2 text-slate-400">
                        <button className="hover:text-slate-900 leading-none">›</button>
                        <button className="hover:text-slate-900 leading-none">»</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 text-center text-xs mb-2">
                      {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                        <div key={d} className="font-medium text-slate-900 pb-1">{d}</div>
                      ))}

                      {/* Previous month days */}
                      {[30, 31].map(d => (
                        <div key={`prev-${d}`} className="text-slate-300 py-1.5">{d}</div>
                      ))}

                      {/* Current month days */}
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                        <div
                          key={d}
                          className="py-1.5 rounded cursor-pointer hover:bg-slate-100 text-slate-600 transition-colors"
                          onClick={() => {
                            setDateRange(prev => ({ ...prev, end: `2026-04-${d.toString().padStart(2, '0')}` }));
                            setShowDatePicker(false);
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {renderSummary()}
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">任务明细</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索任务名称"
              className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-xs w-64 focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-900">
                  <th className="py-4 px-4 text-left font-bold">任务名称</th>
                  <th className="py-4 px-4 text-center font-bold">任务类型</th>
                  <th className="py-4 px-4 text-center font-bold">领取{tab === "annotation" ? "标注" : tab === "qa" ? "质检" : "验收"}总量</th>
                  <th className="py-4 px-4 text-center font-bold">已提交数量</th>
                  <th className="py-4 px-4 text-center font-bold">
                    {tab === "annotation" ? "有效标注量" : tab === "qa" ? "有效质检量" : "验收通过量"}
                  </th>
                  <th className="py-4 px-4 text-center font-bold">进度</th>
                  <th className="py-4 px-4 text-center font-bold">有效定时长(小时)</th>
                  <th className="py-4 px-4 text-center font-bold">效率(条/小时)</th>

                  {tab === "annotation" && (
                    <>
                      <th className="py-4 px-4 text-center font-bold">初检合格率</th>
                      <th className="py-4 px-4 text-center font-bold">总体质检合格率</th>
                      <th className="py-4 px-4 text-center font-bold">验收通过量</th>
                      <th className="py-4 px-4 text-center font-bold">验收合格率</th>
                    </>
                  )}

                  {tab === "qa" && (
                    <>
                      <th className="py-4 px-4 text-center font-bold">初检合格率</th>
                      <th className="py-4 px-4 text-center font-bold">总体质检合格率</th>
                      <th className="py-4 px-4 text-center font-bold">投票一致率</th>
                    </>
                  )}

                  {tab === "accept" && (
                    <>
                      <th className="py-4 px-4 text-center font-bold">验收合格率</th>
                      <th className="py-4 px-4 text-center font-bold">投票一致率</th>
                    </>
                  )}

                  <th className="py-4 px-4 text-center font-bold">无效数据量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {details.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4 text-slate-700">{d.name}</td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[d.projectType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {d.projectType}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">{d.total}</td>
                    <td className="py-5 px-4 text-center">{d.submitted}</td>
                    <td className="py-5 px-4 text-center">{d.valid}</td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${d.progress === "已完成"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                        {d.progress}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center font-mono">{d.hours}</td>
                    <td className="py-5 px-4 text-center font-mono">{d.efficiency}</td>

                    {tab === "annotation" && (
                      <>
                        <td className="py-5 px-4 text-center">{d.firstPass || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.totalPass || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.acceptPassed || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.acceptRate || "-"}</td>
                      </>
                    )}

                    {tab === "qa" && (
                      <>
                        <td className="py-5 px-4 text-center">{d.firstPass || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.totalPass || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.voteConsistency || "-"}</td>
                      </>
                    )}

                    {tab === "accept" && (
                      <>
                        <td className="py-5 px-4 text-center">{d.acceptRate || "-"}</td>
                        <td className="py-5 px-4 text-center">{d.voteConsistency || "-"}</td>
                      </>
                    )}

                    <td className="py-5 px-4 text-center">{d.invalid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>共 {details.length} 条任务</span>
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
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${page === 1 ? "bg-[#4f46e5] text-white font-bold" : "hover:bg-slate-200"}`}
                    onClick={() => setPage(1)}
                  >
                    1
                  </span>
                  <span className="px-1">...</span>
                  {[10, 11, 12, 13, 14].map(num => (
                    <span
                      key={num}
                      className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${page === num ? "bg-[#4f46e5] text-white font-bold" : "hover:bg-slate-200"}`}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </span>
                  ))}
                  <span className="px-1">...</span>
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${page === 20 ? "bg-[#4f46e5] text-white font-bold" : "hover:bg-slate-200"}`}
                    onClick={() => setPage(20)}
                  >
                    20
                  </span>
                </div>
                <button
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                  disabled={page === 20}
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
                    if (!isNaN(val) && val >= 1 && val <= 20) setPage(val);
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

export default DataAnnotationPerformance;

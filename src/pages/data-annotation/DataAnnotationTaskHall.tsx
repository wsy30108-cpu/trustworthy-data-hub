import { useState } from "react";
import {
  Search, ClipboardList, Users, Clock, Eye, FileText, Filter,
  CheckCircle, AlertTriangle, BookOpen, ChevronDown, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { toast } from "sonner";

interface HallBatch {
  id: string;
  taskName: string;
  taskId: string;
  projectType: string; // 任务类型: 文本类, 图像类, 等
  taskType: string;    // 任务流程: 标注, 标注-质检, 等
  currentStage: string; // 当前阶段: 标注, 质检, 等
  dataCount: number;
  creator: string;
  createdAt: string;
  authorizedTo: string;
  status: "可领取" | "已领取";
  description: string;
  labels: string[];
  spec: string;
}

const mockBatches: HallBatch[] = [
  { id: "BT-001", taskName: "金融文本情感标注", taskId: "AT-001", projectType: "文本类", taskType: "标注-质检-验收", currentStage: "标注", dataCount: 200, creator: "张明", createdAt: "2026-02-20", authorizedTo: "任务池", status: "可领取", description: "对金融新闻和研报进行正面/负面/中性情感极性标注", labels: ["正面", "负面", "中性"], spec: "请根据文本整体情感倾向进行标注..." },
  { id: "BT-002", taskName: "医疗图像分类标注", taskId: "AT-002", projectType: "图像类", taskType: "标注-质检", currentStage: "质检", dataCount: 100, creator: "李芳", createdAt: "2026-02-15", authorizedTo: "AI数据团队", status: "可领取", description: "CT/MRI影像分类标注", labels: ["正常", "异常-良性", "异常-恶性"], spec: "请根据影像特征进行分类..." },
  { id: "BT-003", taskName: "客服对话意图标注", taskId: "AT-003", projectType: "文本类", taskType: "标注-质检-验收", currentStage: "标注", dataCount: 500, creator: "王强", createdAt: "2026-01-28", authorizedTo: "任务池", status: "可领取", description: "客服对话文本意图分类", labels: ["咨询", "投诉", "建议", "其他"], spec: "根据对话内容判断用户意图..." },
  { id: "BT-004", taskName: "语音转写质检", taskId: "AT-004", projectType: "音频类", taskType: "标注-质检", currentStage: "标注", dataCount: 50, creator: "赵丽", createdAt: "2026-03-01", authorizedTo: "NLP研发组", status: "可领取", description: "语音转写结果校正", labels: [], spec: "请校正转写文本中的错误..." },
  { id: "BT-005", taskName: "视频内容审核标注", taskId: "AT-005", projectType: "视频类", taskType: "标注-验收", currentStage: "验收", dataCount: 30, creator: "孙伟", createdAt: "2026-03-05", authorizedTo: "任务池", status: "可领取", description: "短视频内容审核与分类", labels: ["合规", "违规-暴力", "违规-色情", "违规-其他"], spec: "请审核视频内容合规性..." },
  { id: "BT-007", taskName: "多轮对话意图抽取", taskId: "AT-006", projectType: "文本类", taskType: "标注-质检", currentStage: "标注", dataCount: 150, creator: "陈静", createdAt: "2026-03-10", authorizedTo: "任务池", status: "可领取", description: "从多轮对话逻辑中提取核心意图", labels: ["购买", "退款", "查询"], spec: "注意上下文关联性..." },
  { id: "BT-008", taskName: "人脸关键点标注", taskId: "AT-007", projectType: "图像类", taskType: "标注", currentStage: "标注", dataCount: 400, creator: "高博", createdAt: "2026-03-11", authorizedTo: "任务池", status: "可领取", description: "标注人脸 68 个核心关键点", labels: [], spec: "精度要求单像素级别..." },
  { id: "BT-009", taskName: "自动驾驶障碍物识别", taskId: "AT-008", projectType: "图像类", taskType: "标注-质检-验收", currentStage: "标注", dataCount: 1000, creator: "李雷", createdAt: "2026-03-12", authorizedTo: "任务池", status: "可领取", description: "标注行、车、交通标线等障碍物", labels: ["行人", "车辆", "障碍物"], spec: "遵循道路安全标注规范..." },
  { id: "BT-010", taskName: "古籍文字识别 OCR", taskId: "AT-009", projectType: "文本类", taskType: "标注", currentStage: "标注", dataCount: 50, creator: "韩梅梅", createdAt: "2026-03-13", authorizedTo: "NLP研发组", status: "可领取", description: "复杂排版古籍文字校对", labels: [], spec: "注意繁简字转换规则..." },
  { id: "BT-011", taskName: "泰语翻译评价", taskId: "AT-010", projectType: "文本类", taskType: "标注-验收", currentStage: "验收", dataCount: 300, creator: "周泰", createdAt: "2026-03-14", authorizedTo: "任务池", status: "可领取", description: "对机器翻译质量进行 5 分制打分", labels: ["信", "达", "雅"], spec: "参考专业翻译评估标准..." },
  { id: "BT-012", taskName: "卫星遥感地物分类", taskId: "AT-011", projectType: "图像类", taskType: "标注-质检-验收", currentStage: "质检", dataCount: 80, creator: "吴卫", createdAt: "2026-03-15", authorizedTo: "任务池", status: "可领取", description: "对遥感图像中的建筑、植被进行分割", labels: ["建筑", "植被", "水体"], spec: "注意边缘平滑度..." },
  { id: "BT-013", taskName: "电商评价关键词提取", taskId: "AT-012", projectType: "文本类", taskType: "标注-质检", currentStage: "标注", dataCount: 600, creator: "林悦", createdAt: "2026-03-16", authorizedTo: "任务池", status: "可领取", description: "提取商品评价中的核心关键词", labels: ["好评", "差评", "物流", "价格"], spec: "提取具有区分性的词汇..." },
  { id: "BT-014", taskName: "道路场景车道线标注", taskId: "AT-013", projectType: "图像类", taskType: "标注-质检-验收", currentStage: "质检", dataCount: 220, creator: "王伟", createdAt: "2026-03-16", authorizedTo: "任务池", status: "可领取", description: "对车载摄像头拍摄的车道线进行像素级标注", labels: ["实线", "虚线", "黄色实线"], spec: "注意连续性..." },
  { id: "BT-015", taskName: "动物行为分类标注", taskId: "AT-014", projectType: "视频类", taskType: "标注-验收", currentStage: "标注", dataCount: 15, creator: "刘敏", createdAt: "2026-03-17", authorizedTo: "任务池", status: "可领取", description: "标注视频中动物的各类行为行为", labels: ["奔跑", "进食", "休息"], spec: "细粒度记录开始结束帧..." },
];

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "表格类": "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "跨模态类": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const stageColors: Record<string, string> = {
  "标注": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "质检": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "验收": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "判定": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "已完成": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const PAGE_SIZES = [10, 20, 50];

const DataAnnotationTaskHall = () => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [workflowFilter, setWorkflowFilter] = useState("全部流程");
  const [authFilter, setAuthFilter] = useState("全部授权");
  const [batches, setBatches] = useState(mockBatches);
  const [detailBatch, setDetailBatch] = useState<HallBatch | null>(null);
  const [claimConfirm, setClaimConfirm] = useState<HallBatch | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = batches.filter(b => {
    if (b.status !== "可领取") return false;
    if (typeFilter !== "全部类型" && b.projectType !== typeFilter) return false;
    if (workflowFilter !== "全部流程" && b.taskType !== workflowFilter) return false;
    if (authFilter !== "全部授权" && b.authorizedTo !== authFilter) return false;
    if (searchText && !b.taskName.includes(searchText) && !b.id.includes(searchText)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleClaim = (batch: HallBatch) => {
    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: "已领取" as const } : b));
    toast.success(`已认领批次 ${batch.id}，请在「我的任务」中查看`);
    setClaimConfirm(null);
  };

  const statCards = [
    { label: "可领取批次", value: filtered.length, icon: ClipboardList },
    { label: "涉及任务", value: new Set(filtered.map(b => b.taskId)).size, icon: FileText },
    { label: "待标注数据", value: filtered.reduce((s, b) => s + b.dataCount, 0).toLocaleString(), icon: Users },
    { label: "平均数据量", value: filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.dataCount, 0) / filtered.length) : 0, icon: Clock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">任务大厅</h1>
          <p className="page-description">浏览公共池内所有可认领的标注批次，选择任务开始标注</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <s.icon className="w-8 h-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} placeholder="搜索任务名称或批次ID..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={authFilter} onChange={e => { setAuthFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部授权</option>
          <option>任务池</option>
          <option>AI数据团队</option>
          <option>NLP研发组</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部类型</option>
          {["文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类"].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={workflowFilter} onChange={e => { setWorkflowFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-lg bg-card">
          <option>全部流程</option>
          {["标注", "标注-质检", "标注-质检-验收", "标注-验收"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Batch list as table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">批次ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务类型</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">当前任务流程</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">数据条数</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建人</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">授权对象</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(b => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-medium text-foreground">{b.taskName}</td>
                <td className="py-3 px-4 text-muted-foreground">{b.id}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[b.projectType] || "bg-muted text-muted-foreground"}`}>{b.projectType}</span></td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageColors[b.currentStage] || "bg-muted text-muted-foreground"}`}>
                    {b.currentStage}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{b.dataCount}</td>
                <td className="py-3 px-4 text-muted-foreground">{b.creator}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{b.createdAt}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 bg-muted rounded text-xs">{b.authorizedTo}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setDetailBatch(b)} className="p-1 rounded hover:bg-muted/50" title="查看详情"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => setClaimConfirm(b)} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">认领</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">共 {filtered.length} 个可领取批次</span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 text-xs border rounded bg-card"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}条/页</option>)}
            </select>
            <div className="flex gap-0.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"
                title="第一页"
              >
                <ChevronsLeft className="w-3 h-3" />
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"
                title="上一页"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <div className="flex items-center px-2 text-xs text-foreground font-medium">
                第 {page} / {totalPages} 页
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"
                title="下一页"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="w-7 h-7 text-xs rounded border hover:bg-muted/50 disabled:opacity-30 inline-flex items-center justify-center transition-colors"
                title="最后一页"
              >
                <ChevronsRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{detailBatch.taskName}</h3>
              <button onClick={() => setDetailBatch(null)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">批次ID</p><p className="text-sm font-medium">{detailBatch.id}</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">数据条数</p><p className="text-sm font-medium">{detailBatch.dataCount} 条</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">任务类型</p><p className="text-sm font-medium">{detailBatch.projectType}</p></div>
                <div className="p-2 rounded bg-muted/30"><p className="text-[10px] text-muted-foreground">当前任务流程</p><p className="text-sm font-medium">{detailBatch.currentStage}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">任务描述</p>
                <p className="text-sm">{detailBatch.description}</p>
              </div>
              {detailBatch.labels.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">标签配置</p>
                  <div className="flex flex-wrap gap-1">
                    {detailBatch.labels.map((l, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> 标注规范</p>
                <p className="text-sm text-muted-foreground">{detailBatch.spec}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button onClick={() => setDetailBatch(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">关闭</button>
              <button onClick={() => { handleClaim(detailBatch); setDetailBatch(null); }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">认领批次</button>
            </div>
          </div>
        </div>
      )}

      {/* Claim confirm */}
      {claimConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-2">确认认领</h3>
            <p className="text-sm text-muted-foreground mb-4">确认认领批次 {claimConfirm.id}（{claimConfirm.taskName}，{claimConfirm.dataCount} 条数据）？</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setClaimConfirm(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={() => handleClaim(claimConfirm)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认认领</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnnotationTaskHall;

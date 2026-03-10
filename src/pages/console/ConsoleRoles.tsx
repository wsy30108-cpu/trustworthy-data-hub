import { useState } from "react";
import { Plus, Edit2, Eye, ShieldCheck, X, Save, Ban, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

// ======= 权限域定义 =======
const PLATFORM_PERMISSION_DOMAINS = [
  { domain: "租户管理", items: ["创建/编辑/启停/删除租户", "分配租户配额", "指定空间管理员"] },
  { domain: "平台配置", items: ["名称/Logo/版权信息", "系统参数", "存储类型与默认存储"] },
  { domain: "角色管理", items: ["角色增删改查", "权限可视化配置", "角色分配与撤销"] },
  { domain: "资源管控", items: ["计算/存储资源管理", "配额分配与调整审批"] },
  { domain: "数据源配置", items: ["外部存储平台级接入", "连通性测试"] },
  { domain: "商店管理", items: ["模板/算子发布", "上下架", "推荐标记"] },
  { domain: "运营管控", items: ["平台公告发布", "使用数据统计", "报表导出", "存储/资源预警"] },
  { domain: "成员管理", items: ["成员新增与启停", "分配平台级角色", "密码重置"] },
  { domain: "模板管理", items: ["标注/处理模板创建", "编辑发布", "上下架"] },
  { domain: "审计查询", items: ["查看全平台操作日志"] },
  { domain: "工单处理", items: ["查看/处理技术故障工单", "更新工单状态"] },
  { domain: "系统日志", items: ["查看系统日志", "查看错误日志", "提取故障信息"] },
  { domain: "操作日志", items: ["查看指定用户操作审计日志"] },
  { domain: "远程协助", items: ["用户授权后远程查看故障场景"] },
];

const SPACE_PERMISSION_DOMAINS = [
  { domain: "空间配置", items: ["编辑空间信息", "启用/停用空间", "数据批量转移与归档"] },
  { domain: "人员管理", items: ["邀请/移除成员", "分配空间级角色", "设置对象级权限"] },
  { domain: "任务管理", items: ["创建/分配/编辑/终止任务", "监控任务进度", "查看操作日志"] },
  { domain: "资源管理", items: ["查看资源使用情况", "申请配额调整", "清理闲置数据"] },
  { domain: "数据全权", items: ["数据集查看/读取/写入/管理"] },
  { domain: "导出审批", items: ["审批数据导出申请"] },
  { domain: "数据集操作", items: ["查看/读取数据集", "创建新数据集/版本", "上传/导入数据"] },
  { domain: "工作流", items: ["创建/编辑/运行工作流", "查看运行日志", "使用算子库/模板库"] },
  { domain: "数据处理", items: ["执行数据预处理", "提交数据导出申请"] },
  { domain: "质量评估", items: ["发起质量评估任务", "查看评估报告", "提交质量改进"] },
  { domain: "特征管理", items: ["特征抽取任务管理", "特征库维护与版本管理"] },
  { domain: "数据标注", items: ["标注任务创建/编辑/查看/删除"] },
  { domain: "任务认领", items: ["认领开放批次", "查看分配的标注任务"] },
  { domain: "标注执行", items: ["查看待标注数据", "执行标注", "使用标注工具", "提交标注成果"] },
  { domain: "反馈处理", items: ["接收质检驳回反馈", "修改后重新提交"] },
  { domain: "个人绩效", items: ["查看作业量/准确率/效率"] },
  { domain: "质检执行", items: ["接收质检任务", "查看待质检成果", "标记质检结果", "填写质检意见"] },
  { domain: "质检报告", items: ["查看质检进度", "统计通过率/驳回率", "生成质检报告"] },
  { domain: "验收执行", items: ["接收验收任务", "抽样检查", "作出验收结论"] },
  { domain: "归档操作", items: ["触发数据归档回流"] },
  { domain: "验收报告", items: ["生成验收报告", "记录验收意见"] },
  { domain: "争议查看", items: ["查看争议标注条目及各方意见"] },
  { domain: "判定操作", items: ["作出最终判定", "填写判定理由"] },
  { domain: "规则反馈", items: ["提交标注规则修订建议"] },
  { domain: "信息查看", items: ["查看空间基本信息", "任务列表与进度", "成员列表"] },
  { domain: "数据查看", items: ["查看数据处理成果", "查看标注成果"] },
  { domain: "统计查看", items: ["查看资源使用统计", "任务完成情况", "质量统计报表"] },
];

// ======= 角色类型定义 =======
interface RoleData {
  id: number;
  name: string;
  code: string;
  desc: string;
  type: "预设" | "自定义";
  members: number;
  permissions: string[]; // domain names
  prohibitions: string[];
}

// ======= 预设平台角色 =======
const defaultPlatformRoles: RoleData[] = [
  {
    id: 1, name: "平台超级管理员", code: "PLATFORM_SUPER_ADMIN",
    desc: "平台的最高权限账号，通常由系统管理团队掌握，不建议用于日常操作",
    type: "预设", members: 2,
    permissions: ["租户管理", "平台配置", "角色管理", "资源管控", "数据源配置", "商店管理", "审计查询"],
    prohibitions: [],
  },
  {
    id: 2, name: "平台运营管理员", code: "PLATFORM_OPS_ADMIN",
    desc: "平台日常运营负责人，协助超级管理员完成平台运维工作",
    type: "预设", members: 3,
    permissions: ["运营管控", "成员管理", "模板管理"],
    prohibitions: ["不可删除租户", "不可修改系统底层配置", "不可变更超级管理员账号"],
  },
  {
    id: 3, name: "平台技术支持", code: "PLATFORM_TECH_SUPPORT",
    desc: "负责平台使用问题的排查与解决，是用户侧的技术保障",
    type: "预设", members: 2,
    permissions: ["工单处理", "系统日志", "操作日志", "远程协助"],
    prohibitions: ["未经授权不可查看用户业务数据", "不可修改业务数据或配置", "不可变更用户权限或角色", "不可进行资源配置或租户管理"],
  },
];

// ======= 预设空间角色 =======
const defaultSpaceRoles: RoleData[] = [
  {
    id: 4, name: "空间管理员", code: "WS_ADMIN",
    desc: "工作空间的完全负责人，对空间内一切事务负责",
    type: "预设", members: 8,
    permissions: ["空间配置", "人员管理", "任务管理", "资源管理", "数据全权", "导出审批"],
    prohibitions: [],
  },
  {
    id: 5, name: "数据工程师", code: "WS_DATA_ENGINEER",
    desc: "负责数据从接入到可用的全链路工程工作，包括数据接入、处理、质量评估等",
    type: "预设", members: 15,
    permissions: ["数据集操作", "工作流", "数据处理", "质量评估", "特征管理", "数据标注"],
    prohibitions: ["不可导出未审批数据", "不可查看/修改他人任务数据", "不可管理成员权限"],
  },
  {
    id: 6, name: "数据标注员", code: "WS_ANNOTATOR",
    desc: "执行数据标注工作的操作者，只对分配给自己的批次负责",
    type: "预设", members: 45,
    permissions: ["任务认领", "标注执行", "反馈处理", "个人绩效"],
    prohibitions: ["不可查看/修改他人标注成果", "不可查看未分配数据", "不可导出任何数据", "不可进行质检和验收"],
  },
  {
    id: 7, name: "标注质检员", code: "WS_QC_INSPECTOR",
    desc: "对标注员提交的成果进行质量抽检，发现问题并驳回要求整改",
    type: "预设", members: 12,
    permissions: ["质检执行", "数据查看", "质检报告"],
    prohibitions: ["不可直接修改标注结果", "不可作出最终验收决策", "不可管理成员", "不可分配任务"],
  },
  {
    id: 8, name: "标注验收员", code: "WS_ACCEPTOR",
    desc: "对完成质检的标注批次进行最终验收，决定批次是否归档入库",
    type: "预设", members: 5,
    permissions: ["验收执行", "归档操作", "数据查看", "验收报告"],
    prohibitions: ["不可进行日常质检操作", "不可修改标注结果", "不可操作未进入验收阶段的批次", "不可管理成员"],
  },
  {
    id: 9, name: "判定专家", code: "WS_ARBITER",
    desc: "对标注员与质检员之间的争议标注条目给出最终效力的判定结论",
    type: "预设", members: 3,
    permissions: ["争议查看", "判定操作", "规则反馈"],
    prohibitions: ["只能处理已进入争议流程的条目", "不可干预正常质检流程", "不可进行普通标注或质检", "不可管理成员"],
  },
  {
    id: 10, name: "空间观察员", code: "WS_OBSERVER",
    desc: "只读查看空间内信息，适用于甲方监督、外部审计等场景",
    type: "预设", members: 6,
    permissions: ["信息查看", "数据查看", "统计查看"],
    prohibitions: ["无任何编辑/提交/删除/分配权限", "不可下载数据", "不可参与任何任务执行"],
  },
];

// ======= 新增/编辑表单 =======
interface RoleFormData {
  name: string;
  code: string;
  desc: string;
  permissions: string[];
}

const emptyForm: RoleFormData = { name: "", code: "", desc: "", permissions: [] };

const ConsoleRoles = () => {
  const [tab, setTab] = useState<"platform" | "space">("platform");
  const [showDetail, setShowDetail] = useState<RoleData | null>(null);
  const [platformRoles, setPlatformRoles] = useState<RoleData[]>(defaultPlatformRoles);
  const [spaceRoles, setSpaceRoles] = useState<RoleData[]>(defaultSpaceRoles);

  // 新增/编辑弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [form, setForm] = useState<RoleFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const roles = tab === "platform" ? platformRoles : spaceRoles;
  const permissionDomains = tab === "platform" ? PLATFORM_PERMISSION_DOMAINS : SPACE_PERMISSION_DOMAINS;

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (role: RoleData) => {
    setEditingRole(role);
    setForm({ name: role.name, code: role.code, desc: role.desc, permissions: [...role.permissions] });
    setFormErrors({});
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "角色名称不能为空";
    else if (form.name.length < 2 || form.name.length > 30) errors.name = "角色名称长度为 2-30 个字符";
    if (!editingRole && !form.code.trim()) errors.code = "角色标识不能为空";
    else if (!editingRole && !/^[A-Z_]+$/.test(form.code)) errors.code = "角色标识仅支持大写英文和下划线";
    if (form.permissions.length === 0) errors.permissions = "至少选择一个权限域";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (editingRole) {
      const updated = { ...editingRole, name: form.name, desc: form.desc, permissions: form.permissions };
      if (tab === "platform") {
        setPlatformRoles(prev => prev.map(r => r.id === editingRole.id ? updated : r));
      } else {
        setSpaceRoles(prev => prev.map(r => r.id === editingRole.id ? updated : r));
      }
      toast.success("角色已更新");
    } else {
      const newId = Math.max(...[...platformRoles, ...spaceRoles].map(r => r.id)) + 1;
      const newRole: RoleData = {
        id: newId, name: form.name, code: form.code, desc: form.desc,
        type: "自定义", members: 0, permissions: form.permissions, prohibitions: [],
      };
      if (tab === "platform") {
        setPlatformRoles(prev => [...prev, newRole]);
      } else {
        setSpaceRoles(prev => [...prev, newRole]);
      }
      toast.success("角色已创建");
    }
    setFormOpen(false);
  };

  const togglePermission = (domain: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(domain)
        ? prev.permissions.filter(p => p !== domain)
        : [...prev.permissions, domain],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">角色管理</h1>
          <p className="page-description">基于最小权限与职责分离原则，配置平台级和空间级角色的权限体系</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增角色
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab("platform")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "platform" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
          平台级角色 ({platformRoles.length})
        </button>
        <button onClick={() => setTab("space")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "space" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
          空间级角色 ({spaceRoles.length})
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(r => (
          <div key={r.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-sm">{r.name}</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.type === "预设" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{r.type}</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mb-2 font-mono">{r.code}</p>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{r.desc}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {r.permissions.slice(0, 4).map(p => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
              ))}
              {r.permissions.length > 4 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{r.permissions.length - 4}</span>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-muted-foreground">{r.members} 个成员</span>
              <div className="flex gap-1">
                <button onClick={() => setShowDetail(r)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground" title="查看详情"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground" title="编辑角色"><Edit2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 查看详情弹窗 */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {showDetail?.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ml-2 ${showDetail?.type === "预设" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{showDetail?.type}</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground/70">{showDetail?.code}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{showDetail?.desc}</p>

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> 权限域</h4>
            <div className="flex flex-wrap gap-2">
              {showDetail?.permissions.map(p => (
                <span key={p} className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">{p}</span>
              ))}
            </div>
          </div>

          {showDetail?.prohibitions && showDetail.prohibitions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1.5"><Ban className="w-4 h-4 text-destructive" /> 禁止操作</h4>
              <ul className="space-y-1">
                {showDetail.prohibitions.map((p, i) => (
                  <li key={i} className="text-xs text-destructive/80 flex items-start gap-1.5">
                    <span className="mt-0.5">❌</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            当前 {showDetail?.members} 个成员拥有此角色
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增/编辑弹窗 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "新增角色"}</DialogTitle>
            <DialogDescription>{editingRole ? `正在编辑「${editingRole.name}」的配置` : `在${tab === "platform" ? "平台级" : "空间级"}角色中新增自定义角色`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 角色名称 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">角色名称 <span className="text-destructive">*</span></label>
              <input
                className={`w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.name ? "border-destructive" : ""}`}
                placeholder="请输入角色名称，2-30 个字符"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
              {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
            </div>

            {/* 角色标识 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">角色标识 <span className="text-destructive">*</span></label>
              <input
                className={`w-full px-3 py-2 text-sm border rounded-md bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.code ? "border-destructive" : ""} ${editingRole ? "cursor-not-allowed opacity-60" : ""}`}
                placeholder="如 WS_CUSTOM_ROLE，仅支持大写英文和下划线"
                value={form.code}
                onChange={e => !editingRole && setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                disabled={!!editingRole}
              />
              {editingRole && <p className="text-xs text-muted-foreground mt-1">角色标识不可修改</p>}
              {formErrors.code && <p className="text-xs text-destructive mt-1">{formErrors.code}</p>}
            </div>

            {/* 描述 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">角色描述</label>
              <textarea
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="请输入角色描述（选填，最多 200 字）"
                maxLength={200}
                value={form.desc}
                onChange={e => setForm(prev => ({ ...prev, desc: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground text-right">{form.desc.length}/200</p>
            </div>

            {/* 权限域选择 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                权限域配置 <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-2">已选 {form.permissions.length} 个</span>
              </label>
              {formErrors.permissions && <p className="text-xs text-destructive mb-2">{formErrors.permissions}</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {permissionDomains.map(pd => {
                  const selected = form.permissions.includes(pd.domain);
                  return (
                    <button
                      key={pd.domain}
                      type="button"
                      onClick={() => togglePermission(pd.domain)}
                      className={`text-left px-3 py-2 rounded-md border text-xs transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                      title={pd.items.join("、")}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        {pd.domain}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 pl-5">{pd.items.slice(0, 2).join("、")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> {editingRole ? "保存修改" : "创建角色"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsoleRoles;

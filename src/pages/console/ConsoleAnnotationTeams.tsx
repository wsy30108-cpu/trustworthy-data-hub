import { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ClipboardList, Plus, Search, Eye, Edit2, Trash2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ConsoleAnnotationTeamDetail from "./ConsoleAnnotationTeamDetail";

export interface AnnotationTeam {
  id: string;
  name: string;
  identifier: string;
  org: string;
  admin: string;
  members: number;
  status: string;
  createdAt: string;
  desc: string;
  taskTotal: number; // 任务总量
}

export const MOCK_ORGS = ["北京AI研究院", "清华大学计算机系", "数据服务公司"];

export const MOCK_ORG_ANNOTATORS = [
  { id: "om1", name: "张明", account: "zhangming", dept: "数据平台部", roles: ["平台超级管理员"] },
  { id: "om2", name: "李华", account: "lihua", dept: "数据平台部", roles: ["空间管理员"] },
  { id: "om3", name: "王芳", account: "wangfang", dept: "AI标注组", roles: ["平台运营"] },
  { id: "om4", name: "赵强", account: "zhaoqiang", dept: "质量管理部", roles: ["数据开发", "标注员"] },
  { id: "om5", name: "孙丽", account: "sunli", dept: "AI标注组", roles: ["标注员"] },
  { id: "om6", name: "周杰", account: "zhoujie", dept: "数据平台部", roles: ["质检员"] },
  { id: "om7", name: "陈伟", account: "chenwei", dept: "项目验收组", roles: ["数据开发"] },
  { id: "om8", name: "黄燕", account: "huangyan", dept: "标注部", roles: ["标注员", "质检员"] },
  { id: "om9", name: "刘洋", account: "liuyang", dept: "AI标注组", roles: ["标注员"] },
  { id: "om10", name: "许涛", account: "xutao", dept: "运维支持组", roles: ["标注员"] },
];

export const mockAnnotationTeams: AnnotationTeam[] = [
  { id: "AT-001", name: "AI视觉标注一组", identifier: "ai-vis-01", org: "北京AI研究院", admin: "张明", members: 3, status: "启用", createdAt: "2025-08-12", desc: "主要负责图像分类与目标检测任务标注", taskTotal: 125 },
  { id: "AT-002", name: "NLP基础数据组", identifier: "nlp-data", org: "清华大学计算机系", admin: "李华", members: 2, status: "启用", createdAt: "2025-09-05", desc: "负责自然语言文本语料的清洗和实体标注", taskTotal: 88 },
  { id: "AT-003", name: "音频听写团队", identifier: "audio-trans", org: "数据服务公司", admin: "王芳", members: 2, status: "启用", createdAt: "2025-10-20", desc: "主攻长音频听写和情感标注", taskTotal: 42 },
];

// Map team -> member accounts
export const TEAM_MEMBERS: Record<string, string[]> = {
  "AT-001": ["zhaoqiang", "sunli", "huangyan"],
  "AT-002": ["liuyang", "xutao"],
  "AT-003": ["sunli", "huangyan"],
};

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

const ConsoleAnnotationTeams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<AnnotationTeam | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof AnnotationTeam | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" });

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrg, setFormOrg] = useState(MOCK_ORGS[0]);
  const [formAdmin, setFormAdmin] = useState(MOCK_ORG_ANNOTATORS[0]?.name || "");
  const [formNameTouched, setFormNameTouched] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const nameError = useMemo(() => {
    const val = formName;
    if (!val) return formNameTouched || formSubmitted ? "团队名称为必填项" : "";
    if (!NAME_REGEX.test(val)) return "团队名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    if (val.length < 2 || val.length > 30) return "团队名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    return "";
  }, [formName, formNameTouched, formSubmitted]);

  const descCount = formDesc.length;
  const isFormValid = formName.trim().length >= 2 && formName.trim().length <= 30 && NAME_REGEX.test(formName) && descCount <= 300;

  const handleNameChange = useCallback((val: string) => {
    const filtered = val.split("").filter(ch => /[\u4e00-\u9fa5a-zA-Z0-9_]/.test(ch)).join("");
    setFormName(filtered.slice(0, 30));
    if (!formNameTouched) setFormNameTouched(true);
  }, [formNameTouched]);

  const resetForm = useCallback(() => {
    setFormName(""); setFormDesc(""); setFormOrg(MOCK_ORGS[0]); setFormAdmin(MOCK_ORG_ANNOTATORS[0]?.name || ""); setFormNameTouched(false); setFormSubmitted(false);
  }, []);

  const handleCreate = useCallback(() => {
    setFormSubmitted(true);
    if (!isFormValid) return;
    toast({ title: "标注团队创建成功" });
    resetForm(); setShowCreate(false);
  }, [isFormValid, resetForm, toast]);

  const handleDelete = (t: AnnotationTeam) => {
    setConfirmDialog({
      title: "删除标注团队",
      desc: `确认删除标注团队「${t.name}」吗？删除后该团队所有数据将被清除，此操作不可恢复。`,
      onConfirm: () => toast({ title: `标注团队「${t.name}」已删除` }),
    });
  };

  const handleSort = (key: keyof AnnotationTeam) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const filteredAndSorted = useMemo(() => {
    let items = mockAnnotationTeams.filter(t => {
      if (search && !t.name.includes(search) && !t.identifier.includes(search)) return false;
      return true;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    return items;
  }, [search, sortConfig]);

  if (showDetail) {
    return <ConsoleAnnotationTeamDetail team={showDetail} onBack={() => setShowDetail(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">标注团队</h1>
          <p className="page-description">管理和维护标注团队及其下属的成员信息</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }} className="h-9 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> 新增标注团队
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "团队总数", value: mockAnnotationTeams.length, color: "bg-primary/10 text-primary", icon: Users },
          { label: "总标注成员", value: Object.values(TEAM_MEMBERS).reduce((acc, m) => acc + m.length, 0), color: "bg-blue-50 text-blue-600", icon: Users },
          { label: "任务总量", value: mockAnnotationTeams.reduce((acc, t) => acc + t.taskTotal, 0), color: "bg-orange-50 text-orange-600", icon: ClipboardList },

        ].map((c, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索团队名称或标识..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">团队名称</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">团队标识</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">所属组织</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">负责人</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">成员数</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("taskTotal")}>
                   <div className="flex items-center gap-1">任务总量 <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">描述</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">创建时间</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 font-medium">
                    <button onClick={() => setShowDetail(t)} className="text-primary hover:underline">{t.name}</button>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{t.identifier}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{t.org}</td>
                  <td className="py-3 px-3">{t.admin}</td>
                  <td className="py-3 px-3 text-muted-foreground">{TEAM_MEMBERS[t.id]?.length || 0}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{t.taskTotal}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs max-w-[200px] truncate" title={t.desc}>{t.desc}</td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-xs">{t.createdAt}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-0.5">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看详情" onClick={() => setShowDetail(t)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="编辑">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="删除" onClick={() => handleDelete(t)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSorted.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">暂无匹配的标注团队</div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={v => { if (!v) { resetForm(); setShowCreate(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新增标注团队</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                团队名称 <span className="text-destructive">*</span>
              </label>
              <input
                value={formName}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={() => setFormNameTouched(true)}
                className={cn("w-full px-3 py-2 text-sm border rounded-md bg-background", nameError && "border-destructive")}
                placeholder="请输入团队名称"
              />
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">关联组织 <span className="text-destructive">*</span></label>
              <select value={formOrg} onChange={e => setFormOrg(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                {MOCK_ORGS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">负责人 <span className="text-destructive">*</span></label>
              <select value={formAdmin} onChange={e => setFormAdmin(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                {MOCK_ORG_ANNOTATORS.map(m => <option key={m.id} value={m.name}>{m.name} ({m.account})</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">描述</label>
              <textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value.slice(0, 300))}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none"
                rows={3}
                placeholder="团队用途描述（选填）"
                maxLength={300}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${descCount > 280 ? "text-destructive" : "text-muted-foreground"}`}>{descCount}/300</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowCreate(false); }}>取消</Button>
            <Button onClick={handleCreate} disabled={formSubmitted && !isFormValid}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <Dialog open={!!confirmDialog} onOpenChange={v => !v && setConfirmDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{confirmDialog.title}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{confirmDialog.desc}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>取消</Button>
              <Button variant="destructive" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>确认</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ConsoleAnnotationTeams;

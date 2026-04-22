import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, Check, UserPlus, X, UserSearch, BarChart3, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MOCK_ORG_ANNOTATORS, TEAM_MEMBERS, type AnnotationTeam } from "./ConsoleAnnotationTeams";

interface TeamMember {
  id: string;
  name: string;
  account: string;
  joinedAt: string;
  status: "启用" | "停用";
  taskCount: number; // 标注总量
  taskTotal: number; // 任务总量
  effectiveDuration: number; // 有效标注时长 (number for sorting)
}

// --- Performance types ---
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

function buildInitialMembers(team: AnnotationTeam): TeamMember[] {
  const accounts = TEAM_MEMBERS[team.id] || [];
  return accounts.map((acc, i) => {
    const om = MOCK_ORG_ANNOTATORS.find(x => x.account === acc);
    return {
      id: `tm_${team.id}_${i}`,
      name: om?.name || acc,
      account: acc,
      joinedAt: team.createdAt,
      status: "启用" as const,
      taskTotal: Math.floor(Math.random() * 50) + 10,
      taskCount: Math.floor(Math.random() * 200) + 50,
      effectiveDuration: parseFloat((Math.random() * 100 + 10).toFixed(1)),
    };
  });
}

const ConsoleAnnotationTeamDetail = ({ team, onBack }: { team: AnnotationTeam; onBack: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>(() => buildInitialMembers(team));
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof TeamMember | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" });

  const [addSearch, setAddSearch] = useState("");
  const [addAccountSearch, setAddAccountSearch] = useState("");
  const [candidates, setCandidates] = useState<{ id: string; name: string; account: string; source: "org" | "search" }[]>([]);
  const [foundExtUser, setFoundExtUser] = useState<{ name: string; account: string } | null>(null);

  const handleSort = (key: keyof TeamMember) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const sortedMembers = useMemo(() => {
    let items = members.filter(m => {
      if (search && !m.name.includes(search) && !m.account.includes(search)) return false;
      return true;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [members, search, sortConfig]);

  // Only show annotators (roles include "标注员") that are not already in the team
  const availableAnnotators = MOCK_ORG_ANNOTATORS.filter(
    om => om.roles.includes("标注员") && !members.some(m => m.account === om.account)
  );
  const filteredAnnotators = availableAnnotators.filter(
    om => !addSearch || om.name.includes(addSearch) || om.account.includes(addSearch) || (om.dept && om.dept.includes(addSearch))
  );

  const toggleCandidate = (om: typeof MOCK_ORG_ANNOTATORS[0]) => {
    setCandidates(prev => {
      const exists = prev.find(c => c.account === om.account);
      if (exists) return prev.filter(c => c.account !== om.account);
      return [...prev, { id: om.id, name: om.name, account: om.account, source: "org" }];
    });
  };

  const handleSearchExtUser = () => {
    if (!addAccountSearch.trim()) return;
    if (members.some(m => m.account === addAccountSearch.trim())) {
      toast({ title: "该用户已在团队中", variant: "destructive" }); return;
    }
    if (candidates.some(c => c.account === addAccountSearch.trim())) {
      toast({ title: "该用户已在待添加列表中", variant: "destructive" }); return;
    }
    const mockFound = { name: `用户_${addAccountSearch.trim()}`, account: addAccountSearch.trim() };
    setFoundExtUser(mockFound);
  };

  const addExtUser = () => {
    if (!foundExtUser) return;
    setCandidates(prev => [...prev, {
      id: `ext_${Date.now()}`, name: foundExtUser.name, account: foundExtUser.account,
      source: "search",
    }]);
    setFoundExtUser(null);
    setAddAccountSearch("");
  };

  const handleAddConfirm = () => {
    if (candidates.length === 0) return;
    const added: TeamMember[] = candidates.map(c => {
      return {
        id: `tm_${team.id}_${Date.now()}_${c.account}`,
        name: c.name,
        account: c.account,
        joinedAt: new Date().toISOString().slice(0, 10),
        status: "启用" as const,
        taskTotal: 0,
        taskCount: 0,
        effectiveDuration: 0,
      };
    });
    setMembers(prev => [...prev, ...added]);
    toast({ title: `已添加 ${added.length} 名成员` });
    setShowAdd(false); setCandidates([]); setAddSearch(""); setAddAccountSearch(""); setFoundExtUser(null);
  };

  const handleRemove = (m: TeamMember) => {
    setConfirmDialog({
      title: "移除团队成员",
      desc: `确认将「${m.name}」从标注团队中移除吗？`,
      onConfirm: () => { setMembers(prev => prev.filter(x => x.id !== m.id)); toast({ title: `成员「${m.name}」已移除` }); },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted/50 border bg-background shadow-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{team.name}</h1>
              <span className="px-2 py-0.5 text-[10px] rounded font-medium bg-green-100 text-green-700">{team.status}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{team.identifier}</span>
              <span>所属组织: {team.org}</span>
              <span>负责人: {team.admin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {["成员管理", "团队绩效"].map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={cn("px-4 py-2 text-sm border-b-2 transition-colors",
              activeTab === i ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab}</button>
        ))}
      </div>

      {activeTab === 0 ? (
        <>
          <h2 className="text-base font-semibold">成员管理</h2>

          {/* Filter + Add */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索成员..."
                  className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex-1" />
              <Button size="sm" onClick={() => { setShowAdd(true); setCandidates([]); setAddSearch(""); }} className="h-9 gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" />添加成员
              </Button>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">账号</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("taskTotal")}>
                    <div className="flex items-center gap-1">任务总量 <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("taskCount")}>
                    <div className="flex items-center gap-1">标注总量 <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("effectiveDuration")}>
                    <div className="flex items-center gap-1">有效标注时长 <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">加入时间</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{m.account}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.taskTotal}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.taskCount}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.effectiveDuration.toFixed(1)}h</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.joinedAt}</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                        m.status === "启用" ? "bg-green-100 text-green-700 font-medium" : "bg-red-100 text-red-700 font-medium"
                      )}>{m.status}</span>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-muted/50" title="查看绩效" onClick={() => navigate(`/console/annotation-teams/${team.id}/member-performance`, { state: { memberName: m.name, memberAccount: m.account, teamName: team.name } })}>
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted/50" title="移除" onClick={() => handleRemove(m)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedMembers.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">暂无成员数据</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </>
      ) : (
        <TeamPerformanceView team={team} members={members} />
      )}

      {/* Add Member Dialog — only annotators */}
      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); setCandidates([]); setAddSearch(""); setAddAccountSearch(""); setFoundExtUser(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>添加标注团队成员</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
            {/* Section 1: Select from org */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">从组织成员中选择</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="搜索姓名、账号或部门..."
                  className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                {filteredAnnotators.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">无可选的标注员</p>}
                {filteredAnnotators.map(om => {
                  const isSelected = candidates.some(c => c.account === om.account);
                  return (
                    <button key={om.id} onClick={() => toggleCandidate(om)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/5")}>
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{om.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">{om.account}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{om.dept}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Search by account (cross-org) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">按账号精确查找（跨组织）</h4>
              <div className="flex gap-2">
                <Input value={addAccountSearch} onChange={e => { setAddAccountSearch(e.target.value); setFoundExtUser(null); }}
                  placeholder="输入用户账号精确查找..." className="h-9 text-sm flex-1" />
                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs" onClick={handleSearchExtUser}>
                  <UserSearch className="w-3.5 h-3.5" />查找
                </Button>
              </div>
              {foundExtUser && (
                <div className="flex items-center gap-3 px-3 py-2 border rounded-md bg-muted/20">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{foundExtUser.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{foundExtUser.account}</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">跨组织</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addExtUser}>
                    <Plus className="w-3 h-3 mr-1" />添加
                  </Button>
                </div>
              )}
            </div>

            {/* Section 3: Selected candidates */}
            {candidates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">已选成员 ({candidates.length})</h4>
                <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                  {candidates.map(c => (
                    <div key={c.account} className="px-3 py-2.5 flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.account}</span>
                      {c.source === "search" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">跨组织</span>}
                      <div className="flex-1" />
                      <button onClick={() => setCandidates(prev => prev.filter(x => x.account !== c.account))}
                        className="p-1 rounded hover:bg-muted/50">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">角色将默认为「标注员」，不可修改</p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setCandidates([]); }}>取消</Button>
            <Button onClick={handleAddConfirm} disabled={candidates.length === 0}>确认添加 ({candidates.length})</Button>
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

// Generate mock space performance data
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

// Generate mock task details
function generateTaskDetails(members: TeamMember[]): TeamTaskDetail[] {
  const taskNames = ["xxx图像框", "xxx文本分类", "xxxx分割", "语音转写", "视频打标", "表格信息抽取", "跨模态匹配", "实体识别"];
  const projectTypes = ["图像类", "文本类", "音频类", "视频类", "表格类", "跨模态类"];
  const details: TeamTaskDetail[] = [];
  members.forEach((m, mi) => {
    const numTasks = Math.floor(Math.random() * 3) + 1;
    for (let t = 0; t < numTasks; t++) {
      const total = Math.floor(Math.random() * 200) + 50;
      const submitted = Math.floor(total * (Math.random() * 0.5 + 0.5));
      const valid = Math.floor(submitted * (Math.random() * 0.2 + 0.7));
      const progress = submitted >= total ? "已完成" : "进行中";
      const sp = MOCK_SPACES[mi % MOCK_SPACES.length];
      details.push({
        id: `td_${m.id}_${t}`,
        spaceName: sp.name,
        memberName: m.name,
        taskName: taskNames[(mi * 3 + t) % taskNames.length],
        projectType: projectTypes[(mi + t) % projectTypes.length],
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
  });
  return details;
}

const TeamPerformanceView = ({ team, members }: { team: AnnotationTeam; members: TeamMember[] }) => {
  const [projectType, setProjectType] = useState("全部类型");
  const [filterSpace, setFilterSpace] = useState("全部空间");
  const [filterMember, setFilterMember] = useState("全部成员");
  const [taskSearch, setTaskSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock data
  const spacePerformances = useMemo(() => generateSpacePerformances(), []);
  const taskDetails = useMemo(() => generateTaskDetails(members), [members]);

  // Filtered & paginated task details
  const filteredDetails = useMemo(() => {
    return taskDetails.filter(d => {
      if (filterSpace !== "全部空间" && d.spaceName !== filterSpace) return false;
      if (filterMember !== "全部成员" && d.memberName !== filterMember) return false;
      if (projectType !== "全部类型" && d.projectType !== projectType) return false;
      if (taskSearch && !d.taskName.includes(taskSearch)) return false;
      return true;
    });
  }, [taskDetails, filterSpace, filterMember, projectType, taskSearch]);

  const paginatedDetails = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDetails.slice(start, start + pageSize);
  }, [filteredDetails, page, pageSize]);

  const totalPages = Math.ceil(filteredDetails.length / pageSize);

  // Summary stats (aggregate across all spaces)
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
    <div className="space-y-6">
      {/* Team Info Card — matches "我的绩效" user card style */}
      <div className="bg-white px-8 py-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center">
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">团队名称</span>
            <span className="text-sm font-bold text-slate-900">{team.name}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">团队标识</span>
            <span className="text-sm font-bold text-slate-900">{team.identifier}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">所属组织</span>
            <span className="text-sm font-bold text-slate-900">{team.org}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">负责人</span>
            <span className="text-sm font-bold text-slate-900">{team.admin}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-xs text-slate-400">参与空间数量</span>
            <span className="text-sm font-bold text-slate-900">{MOCK_SPACES.length}</span>
          </div>
        </div>
      </div>

      {/* Overall Performance Summary — matches "我的绩效" summary style */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">总体绩效</h3>
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

      {/* Aggregated Task Details */}
      <div className="space-y-4">
        {/* Filters row */}
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
              value={filterMember}
              onChange={(e) => { setFilterMember(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-600 outline-none cursor-pointer min-w-[130px] appearance-none"
            >
              <option value="全部成员">全部成员</option>
              {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
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
                  <th className="py-4 px-4 text-left font-bold">成员</th>
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
                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap">{d.memberName}</td>
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
                  <tr><td colSpan={15} className="py-12 text-center text-sm text-muted-foreground">暂无匹配的任务明细</td></tr>
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

export default ConsoleAnnotationTeamDetail;

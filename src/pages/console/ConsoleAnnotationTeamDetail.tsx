import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, Check, UserPlus, ExternalLink, X, UserSearch, BarChart3, ArrowUpDown } from "lucide-react";
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
                      <button className="p-1 rounded hover:bg-muted/50" title="查看绩效" onClick={() => navigate("/data-annotation/performance")}>
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
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-6 h-6 text-muted-foreground opacity-50" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">团队绩效功能正在完善中</p>
            <p className="text-xs text-muted-foreground">该模块的功能待后续完善，敬请期待。</p>
          </div>
        </div>
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

export default ConsoleAnnotationTeamDetail;

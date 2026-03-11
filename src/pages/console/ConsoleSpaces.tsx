import { useState, useMemo, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit2, Power, Trash2, Boxes } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConsoleSpaceDetail from "./ConsoleSpaceDetail";

type SpaceType = "all" | "org" | "team" | "personal";
type SpaceStatus = "all" | "active" | "disabled";

const mockSpaces = [
  { id: "WS-001", name: "AI大模型研发组", identifier: "ai-llm-rd", type: "团队空间", org: "北京AI研究院", admin: "张明", members: 24, storage: "5.2TB", status: "启用", createdAt: "2025-08-12" },
  { id: "WS-002", name: "NLP基础研究团队", identifier: "nlp-base", type: "团队空间", org: "北京AI研究院", admin: "李华", members: 18, storage: "3.8TB", status: "启用", createdAt: "2025-09-05" },
  { id: "WS-003", name: "北京AI研究院", identifier: "bj-ai-org", type: "组织空间", org: "北京AI研究院", admin: "王芳", members: 56, storage: "12.3TB", status: "启用", createdAt: "2025-06-01" },
  { id: "WS-004", name: "计算机视觉实验室", identifier: "cv-lab", type: "团队空间", org: "清华大学", admin: "赵强", members: 15, storage: "8.1TB", status: "启用", createdAt: "2025-10-20" },
  { id: "WS-005", name: "张明的个人空间", identifier: "zhangming-personal", type: "个人空间", org: "-", admin: "张明", members: 1, storage: "256GB", status: "启用", createdAt: "2025-08-12" },
  { id: "WS-006", name: "语音识别团队", identifier: "asr-team", type: "团队空间", org: "北京AI研究院", admin: "孙丽", members: 12, storage: "2.3TB", status: "停用", createdAt: "2025-11-15" },
  { id: "WS-007", name: "数据标注中心", identifier: "annotation-center", type: "团队空间", org: "数据服务公司", admin: "周杰", members: 45, storage: "1.5TB", status: "启用", createdAt: "2025-07-08" },
  { id: "WS-008", name: "李华的个人空间", identifier: "lihua-personal", type: "个人空间", org: "-", admin: "李华", members: 1, storage: "128GB", status: "启用", createdAt: "2025-09-05" },
];

const typeMap: Record<string, SpaceType> = { "组织空间": "org", "团队空间": "team", "个人空间": "personal" };

// Pinyin initial mapping for common Chinese characters (simplified)
const pinyinMap: Record<string, string> = {
  "大": "d", "模": "m", "型": "x", "研": "y", "发": "f", "组": "z",
  "基": "j", "础": "c", "究": "j", "团": "t", "队": "d", "北": "b",
  "京": "j", "院": "y", "计": "j", "算": "s", "机": "j", "视": "s",
  "觉": "j", "实": "s", "验": "y", "室": "s", "张": "z", "明": "m",
  "的": "d", "个": "g", "人": "r", "空": "k", "间": "j", "语": "y",
  "音": "y", "识": "s", "别": "b", "数": "s", "据": "j", "标": "b",
  "注": "z", "中": "z", "心": "x", "李": "l", "华": "h", "王": "w",
  "芳": "f", "赵": "z", "强": "q", "孙": "s", "丽": "l", "周": "z",
  "杰": "j", "服": "f", "务": "w", "公": "g", "司": "s", "清": "q",
  "学": "x", "智": "z", "能": "n", "处": "c", "理": "l", "分": "f",
  "析": "x", "工": "g", "程": "c", "平": "p", "台": "t", "测": "c",
  "试": "s", "安": "a", "全": "q", "管": "g", "科": "k", "技": "j",
  "信": "x", "息": "x", "通": "t", "讯": "x", "网": "w", "络": "l",
  "系": "x", "统": "t", "设": "s", "备": "b", "运": "y", "维": "w",
  "产": "c", "品": "p", "项": "x", "目": "m", "质": "z", "量": "l",
  "保": "b", "障": "z", "内": "n", "容": "r", "编": "b", "辑": "j",
  "审": "s", "核": "h", "存": "c", "储": "c", "文": "w", "件": "j",
  "集": "j", "训": "x", "练": "l", "推": "t", "断": "d", "评": "p",
  "估": "g", "优": "y", "化": "h", "部": "b", "署": "s", "监": "j",
  "控": "k", "日": "r", "志": "z", "报": "b", "告": "g", "配": "p",
  "置": "z", "规": "g", "则": "z", "策": "c", "略": "l", "权": "q",
  "限": "x", "角": "j", "色": "s", "用": "y", "户": "h", "登": "d",
  "录": "l", "创": "c", "建": "j", "新": "x", "增": "z", "删": "s",
  "改": "g", "查": "c",
};

function toPinyinInitials(str: string): string {
  let result = "";
  for (const ch of str) {
    if (/[a-zA-Z0-9_]/.test(ch)) {
      result += ch.toLowerCase();
    } else if (ch === " " || ch === " ") {
      result += "-";
    } else if (pinyinMap[ch]) {
      result += pinyinMap[ch];
    }
    // skip other special chars
  }
  return result || "space";
}

function generateUniqueIdentifier(name: string, existingIds: string[]): string {
  const base = toPinyinInitials(name);
  if (!existingIds.includes(base)) return base;
  let i = 1;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

const ConsoleSpaces = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SpaceType>("all");
  const [statusFilter, setStatusFilter] = useState<SpaceStatus>("all");
  const [showDetail, setShowDetail] = useState<typeof mockSpaces[0] | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("团队空间");
  const [formStorage, setFormStorage] = useState("MinIO-主存储");
  const [formNameTouched, setFormNameTouched] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const existingIdentifiers = useMemo(() => mockSpaces.map(s => s.identifier), []);
  const generatedIdentifier = useMemo(() => {
    if (!formName.trim()) return "";
    return generateUniqueIdentifier(formName.trim(), existingIdentifiers);
  }, [formName, existingIdentifiers]);

  const nameError = useMemo(() => {
    const val = formName;
    if (!val) return formNameTouched || formSubmitted ? "空间名称为必填项" : "";
    if (!NAME_REGEX.test(val)) return "空间名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    if (val.length < 2 || val.length > 30) return "空间名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    return "";
  }, [formName, formNameTouched, formSubmitted]);

  const descCount = formDesc.length;
  const descError = descCount > 300 ? "描述内容不能超过 300 个字符" : "";

  const isFormValid = formName.trim().length >= 2 && formName.trim().length <= 30 && NAME_REGEX.test(formName) && descCount <= 300;

  const handleNameChange = useCallback((val: string) => {
    // Only allow valid characters, truncate at 30
    const filtered = val.split("").filter(ch => /[\u4e00-\u9fa5a-zA-Z0-9_]/.test(ch)).join("");
    setFormName(filtered.slice(0, 30));
    if (!formNameTouched) setFormNameTouched(true);
  }, [formNameTouched]);

  const handleDescChange = useCallback((val: string) => {
    setFormDesc(val.slice(0, 300));
  }, []);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormDesc("");
    setFormType("团队空间");
    setFormStorage("MinIO-主存储");
    setFormNameTouched(false);
    setFormSubmitted(false);
  }, []);

  const handleCreate = useCallback(() => {
    setFormSubmitted(true);
    if (!isFormValid) return;
    // Mock create success
    resetForm();
    setShowCreate(false);
  }, [isFormValid, resetForm]);

  const openCreate = useCallback(() => {
    resetForm();
    setShowCreate(true);
  }, [resetForm]);

  const filtered = mockSpaces.filter(s => {
    if (search && !s.name.includes(search) && !s.identifier.includes(search)) return false;
    if (typeFilter !== "all" && typeMap[s.type] !== typeFilter) return false;
    if (statusFilter === "active" && s.status !== "启用") return false;
    if (statusFilter === "disabled" && s.status !== "停用") return false;
    return true;
  });

  const detail = mockSpaces.find(s => s.id === showDetail);
  const currentAdmin = user?.name || "超级管理员";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">空间管理</h1>
          <p className="page-description">管理组织、团队和个人空间的全生命周期</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增空间
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "空间总数", value: mockSpaces.length, color: "bg-primary/10 text-primary" },
          { label: "组织空间", value: mockSpaces.filter(s => s.type === "组织空间").length, color: "bg-orange-50 text-orange-600" },
          { label: "团队空间", value: mockSpaces.filter(s => s.type === "团队空间").length, color: "bg-green-50 text-green-600" },
          { label: "个人空间", value: mockSpaces.filter(s => s.type === "个人空间").length, color: "bg-blue-50 text-blue-600" },
        ].map((c, i) => (
          <div key={i} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索空间名称或标识..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as SpaceType)} className="px-3 py-2 text-sm border rounded-md bg-card">
          <option value="all">全部类型</option>
          <option value="org">组织空间</option>
          <option value="team">团队空间</option>
          <option value="personal">个人空间</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SpaceStatus)} className="px-3 py-2 text-sm border rounded-md bg-card">
          <option value="all">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">停用</option>
        </select>
      </div>

      {/* 列表 */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["空间名称", "空间标识", "空间类型", "所属机构", "管理员", "成员数", "存储用量", "状态", "创建时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <button onClick={() => setShowDetail(s.id)} className="text-primary hover:underline">{s.name}</button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{s.identifier}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${s.type === "组织空间" ? "status-tag-warning" : s.type === "团队空间" ? "status-tag-success" : "status-tag-info"}`}>{s.type}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{s.org}</td>
                  <td className="py-3 px-4">{s.admin}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.members}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.storage}</td>
                  <td className="py-3 px-4">
                    <span className={`status-tag ${s.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{s.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <button onClick={() => setActionMenu(actionMenu === s.id ? null : s.id)} className="p-1 rounded hover:bg-muted/50">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenu === s.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-32 bg-card border rounded-lg shadow-lg z-50 p-1">
                            <button onClick={() => { setShowDetail(s.id); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Eye className="w-3 h-3" />查看详情</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Edit2 className="w-3 h-3" />编辑</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50"><Power className="w-3 h-3" />{s.status === "启用" ? "停用" : "启用"}</button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted/50 text-destructive"><Trash2 className="w-3 h-3" />删除</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">暂无匹配的空间数据</div>
        )}
      </div>

      {/* 创建空间弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { resetForm(); setShowCreate(false); }}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新增空间</h2>
            <div className="space-y-4">
              {/* 空间类型 */}
              <div>
                <label className="text-sm font-medium mb-1 block">空间类型</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                  <option>团队空间</option>
                  <option>组织空间</option>
                  <option>个人空间</option>
                </select>
              </div>

              {/* 空间名称 */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  空间名称 <span className="text-destructive">*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  onBlur={() => setFormNameTouched(true)}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${nameError ? "border-destructive" : ""}`}
                  placeholder="请输入空间名称，支持中英文、数字、下划线，长度为 2-30 个字符"
                />
                {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
              </div>

              {/* 空间标识 */}
              <div>
                <label className="text-sm font-medium mb-1 block">空间标识</label>
                <input
                  value={generatedIdentifier}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  placeholder="系统自动生成，不可修改"
                />
                <p className="text-xs text-muted-foreground mt-1">基于空间名称自动生成，不可修改</p>
              </div>

              {/* 描述 */}
              <div>
                <label className="text-sm font-medium mb-1 block">描述</label>
                <textarea
                  value={formDesc}
                  onChange={e => handleDescChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background resize-none ${descError ? "border-destructive" : ""}`}
                  rows={3}
                  placeholder="空间用途描述（选填）"
                  maxLength={300}
                />
                <div className="flex items-center justify-between mt-1">
                  {descError ? <p className="text-xs text-destructive">{descError}</p> : <span />}
                  <span className={`text-xs ${descCount > 280 ? "text-destructive" : "text-muted-foreground"}`}>{descCount}/300</span>
                </div>
              </div>

              {/* 空间管理员 */}
              <div>
                <label className="text-sm font-medium mb-1 block">空间管理员</label>
                <input
                  value={currentAdmin}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  placeholder="默认为创建人，不可修改"
                />
                <p className="text-xs text-muted-foreground mt-1">默认为创建人，不可修改</p>
              </div>

              {/* 默认存储 */}
              <div>
                <label className="text-sm font-medium mb-1 block">默认存储</label>
                <select value={formStorage} onChange={e => setFormStorage(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                  <option>MinIO-主存储</option>
                  <option>OSS-备份存储</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { resetForm(); setShowCreate(false); }} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
              <button
                onClick={handleCreate}
                disabled={formSubmitted && !isFormValid}
                className={`px-4 py-2 text-sm rounded-md ${isFormValid ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空间详情弹窗 */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{detail.name}</h2>
              <span className={`status-tag ${detail.status === "启用" ? "status-tag-success" : "status-tag-error"}`}>{detail.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{detail.storage}</div>
                <div className="text-xs text-muted-foreground mt-1">存储使用率</div>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{Math.floor(Math.random() * 20)}</div>
                <div className="text-xs text-muted-foreground mt-1">运行中任务</div>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-xl font-bold">{detail.members}</div>
                <div className="text-xs text-muted-foreground mt-1">空间成员</div>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <h3 className="font-medium text-foreground">基本信息</h3>
              {[
                ["空间标识", detail.identifier],
                ["空间类型", detail.type],
                ["所属机构", detail.org],
                ["管理员", detail.admin],
                ["创建时间", detail.createdAt],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center py-2 border-b border-dashed">
                  <span className="w-24 text-muted-foreground shrink-0">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleSpaces;

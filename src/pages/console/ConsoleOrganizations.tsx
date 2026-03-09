import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Users } from "lucide-react";

const mockOrgs = [
  { id: "ORG-001", name: "北京AI研究院", identifier: "bj-ai", contact: "王芳", phone: "138****1234", email: "wf@ai.cn", desc: "人工智能基础研究与应用", members: 56, spaces: 3, createdAt: "2025-06-01" },
  { id: "ORG-002", name: "清华大学计算机系", identifier: "thu-cs", contact: "赵强", phone: "139****5678", email: "zq@thu.edu.cn", desc: "高校科研组织", members: 32, spaces: 2, createdAt: "2025-07-15" },
  { id: "ORG-003", name: "数据服务公司", identifier: "data-svc", contact: "周杰", phone: "137****9012", email: "", desc: "专业数据标注与处理服务", members: 45, spaces: 1, createdAt: "2025-08-20" },
  { id: "ORG-004", name: "中科院自动化所", identifier: "casia", contact: "刘洋", phone: "136****3456", email: "ly@casia.cn", desc: "自动化与智能科学研究", members: 28, spaces: 2, createdAt: "2025-09-10" },
];

const pinyinMap: Record<string, string> = {
  "大":"d","模":"m","型":"x","研":"y","发":"f","组":"z","基":"j","础":"c","究":"j","团":"t","队":"d","北":"b","京":"j","院":"y","计":"j","算":"s","机":"j","视":"s","觉":"j","实":"s","验":"y","室":"s","张":"z","明":"m","的":"d","个":"g","人":"r","空":"k","间":"j","语":"y","音":"y","识":"s","别":"b","数":"s","据":"j","标":"b","注":"z","中":"z","心":"x","李":"l","华":"h","王":"w","芳":"f","赵":"z","强":"q","孙":"s","丽":"l","周":"z","杰":"j","服":"f","务":"w","公":"g","司":"s","清":"q","学":"x","智":"z","能":"n","处":"c","理":"l","分":"f","析":"x","工":"g","程":"c","平":"p","台":"t","测":"c","试":"s","安":"a","全":"q","管":"g","科":"k","技":"j","信":"x","息":"x","通":"t","讯":"x","网":"w","络":"l","系":"x","统":"t","设":"s","备":"b","运":"y","维":"w","产":"c","品":"p","项":"x","目":"m","质":"z","量":"l","保":"b","障":"z","内":"n","容":"r","编":"b","辑":"j","审":"s","核":"h","存":"c","储":"c","文":"w","件":"j","集":"j","训":"x","练":"l","推":"t","断":"d","评":"p","估":"g","优":"y","化":"h","部":"b","署":"s","监":"j","控":"k","日":"r","志":"z","报":"b","告":"g","配":"p","置":"z","规":"g","则":"z","策":"c","略":"l","权":"q","限":"x","角":"j","色":"s","用":"y","户":"h","登":"d","录":"l","创":"c","建":"j","新":"x","增":"z","删":"s","改":"g","查":"c","动":"d","所":"s","联":"l",
};

function toPinyinInitials(str: string): string {
  let result = "";
  for (const ch of str) {
    if (/[a-zA-Z0-9_]/.test(ch)) result += ch.toLowerCase();
    else if (ch === " " || ch === " ") result += "-";
    else if (pinyinMap[ch]) result += pinyinMap[ch];
  }
  return result || "org";
}

function generateUniqueIdentifier(name: string, existingIds: string[]): string {
  const base = toPinyinInitials(name);
  if (!existingIds.includes(base)) return base;
  let i = 1;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
const CONTACT_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9.,，。、()（）\s]+$/;
const PHONE_REGEX = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OrgFormData {
  name: string;
  contact: string;
  phone: string;
  email: string;
  desc: string;
}

const emptyForm: OrgFormData = { name: "", contact: "", phone: "", email: "", desc: "" };

const ConsoleOrganizations = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrg, setEditingOrg] = useState<typeof mockOrgs[0] | null>(null);
  const [showMembers, setShowMembers] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<OrgFormData>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const isEditing = !!editingOrg;
  const existingIdentifiers = useMemo(() => mockOrgs.map(o => o.identifier), []);

  const generatedIdentifier = useMemo(() => {
    if (isEditing) return editingOrg?.identifier || "";
    if (!form.name.trim()) return "";
    return generateUniqueIdentifier(form.name.trim(), existingIdentifiers);
  }, [form.name, existingIdentifiers, isEditing, editingOrg]);

  // Validation
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    // Name
    if (!form.name) { if (touched.name || submitted) e.name = "组织名称为必填项"; }
    else if (!NAME_REGEX.test(form.name)) e.name = "组织名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    else if (form.name.length < 2 || form.name.length > 30) e.name = "组织名称仅支持中英文、数字、下划线，长度为 2-30 个字符";
    // Contact
    if (!form.contact) { if (touched.contact || submitted) e.contact = "联系人姓名不能为空"; }
    else if (!CONTACT_REGEX.test(form.contact)) e.contact = "联系人姓名不能为空，长度为 2-50 个字符";
    else if (form.contact.length < 2 || form.contact.length > 50) e.contact = "联系人姓名不能为空，长度为 2-50 个字符";
    // Phone
    if (!form.phone) { if (touched.phone || submitted) e.phone = "联系电话为必填项"; }
    else if (!PHONE_REGEX.test(form.phone)) e.phone = "请输入有效的联系电话（手机号或固定电话）";
    // Email (optional)
    if (form.email && !EMAIL_REGEX.test(form.email)) e.email = "请输入有效的邮箱地址";
    // Desc
    if (form.desc.length > 300) e.desc = "描述内容不能超过 300 个字符";
    return e;
  }, [form, touched, submitted]);

  const isFormValid = useMemo(() => {
    if (!form.name || !NAME_REGEX.test(form.name) || form.name.length < 2 || form.name.length > 30) return false;
    if (!form.contact || !CONTACT_REGEX.test(form.contact) || form.contact.length < 2 || form.contact.length > 50) return false;
    if (!form.phone || !PHONE_REGEX.test(form.phone)) return false;
    if (form.email && !EMAIL_REGEX.test(form.email)) return false;
    if (form.desc.length > 300) return false;
    return true;
  }, [form]);

  const setField = useCallback((field: keyof OrgFormData, value: string) => {
    if (field === "name") {
      const filtered = value.split("").filter(ch => /[\u4e00-\u9fa5a-zA-Z0-9_]/.test(ch)).join("");
      setForm(f => ({ ...f, name: filtered.slice(0, 30) }));
    } else if (field === "desc") {
      setForm(f => ({ ...f, desc: value.slice(0, 300) }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
    setTouched(t => ({ ...t, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setTouched({});
    setSubmitted(false);
    setEditingOrg(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setShowCreate(true);
  }, [resetForm]);

  const openEdit = useCallback((org: typeof mockOrgs[0]) => {
    setForm({ name: org.name, contact: org.contact, phone: org.phone, email: org.email || "", desc: org.desc });
    setTouched({});
    setSubmitted(false);
    setEditingOrg(org);
    setShowCreate(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (!isFormValid) return;
    resetForm();
    setShowCreate(false);
  }, [isFormValid, resetForm]);

  const closeDialog = useCallback(() => {
    resetForm();
    setShowCreate(false);
  }, [resetForm]);

  const filtered = mockOrgs.filter(o => !search || o.name.includes(search) || o.identifier.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">组织管理</h1>
          <p className="page-description">管理平台入驻的组织机构信息</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增组织
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索组织名称或标识..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-card" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["组织标识", "组织名称", "联系人", "联系电话", "描述", "成员数", "空间数", "创建时间", "操作"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{o.identifier}</td>
                <td className="py-3 px-4 font-medium">{o.name}</td>
                <td className="py-3 px-4">{o.contact}</td>
                <td className="py-3 px-4 text-muted-foreground">{o.phone}</td>
                <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{o.desc}</td>
                <td className="py-3 px-4">{o.members}</td>
                <td className="py-3 px-4">{o.spaces}</td>
                <td className="py-3 px-4 text-muted-foreground">{o.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowMembers(o.id)} className="p-1 rounded hover:bg-muted/50" title="查看成员"><Users className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(o)} className="p-1 rounded hover:bg-muted/50" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted/50 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑组织弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDialog}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{isEditing ? "编辑组织" : "新增组织"}</h2>
            <div className="space-y-4">
              {/* 组织名称 */}
              <div>
                <label className="text-sm font-medium mb-1 block">组织名称 <span className="text-destructive">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, name: true }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${errors.name ? "border-destructive" : ""}`}
                  placeholder="请输入组织名称，支持中英文、数字、下划线，长度为 2-30 个字符"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              {/* 组织标识 */}
              <div>
                <label className="text-sm font-medium mb-1 block">组织标识</label>
                <input
                  value={generatedIdentifier}
                  readOnly disabled
                  className="w-full px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  placeholder="系统自动生成，不可修改"
                />
                <p className="text-xs text-muted-foreground mt-1">基于组织名称自动生成，不可修改</p>
              </div>

              {/* 联系人 */}
              <div>
                <label className="text-sm font-medium mb-1 block">联系人 <span className="text-destructive">*</span></label>
                <input
                  value={form.contact}
                  onChange={e => setField("contact", e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, contact: true }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${errors.contact ? "border-destructive" : ""}`}
                  placeholder="请输入联系人姓名"
                />
                {errors.contact && <p className="text-xs text-destructive mt-1">{errors.contact}</p>}
              </div>

              {/* 联系电话 */}
              <div>
                <label className="text-sm font-medium mb-1 block">联系电话 <span className="text-destructive">*</span></label>
                <input
                  value={form.phone}
                  onChange={e => setField("phone", e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${errors.phone ? "border-destructive" : ""}`}
                  placeholder="请输入有效的联系电话"
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              {/* 邮箱 */}
              <div>
                <label className="text-sm font-medium mb-1 block">邮箱</label>
                <input
                  value={form.email}
                  onChange={e => setField("email", e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${errors.email ? "border-destructive" : ""}`}
                  placeholder="请输入联系邮箱（选填）"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              {/* 描述 */}
              <div>
                <label className="text-sm font-medium mb-1 block">描述</label>
                <textarea
                  value={form.desc}
                  onChange={e => setField("desc", e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-background resize-none ${errors.desc ? "border-destructive" : ""}`}
                  rows={3}
                  placeholder="请输入组织描述（选填，最多 300 字）"
                  maxLength={300}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.desc ? <p className="text-xs text-destructive">{errors.desc}</p> : <span />}
                  <span className={`text-xs ${form.desc.length > 280 ? "text-destructive" : "text-muted-foreground"}`}>{form.desc.length}/300</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeDialog} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">取消</button>
              <button
                onClick={handleSubmit}
                disabled={submitted && !isFormValid}
                className={`px-4 py-2 text-sm rounded-md ${isFormValid ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {isEditing ? "保存" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowMembers(null)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-xl p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{mockOrgs.find(o => o.id === showMembers)?.name} - 成员列表</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 px-3 text-xs text-muted-foreground">账号</th><th className="text-left py-2 px-3 text-xs text-muted-foreground">姓名</th><th className="text-left py-2 px-3 text-xs text-muted-foreground">角色</th></tr></thead>
              <tbody>
                {[{ acc: "zhangming", name: "张明", role: "空间管理员" }, { acc: "lihua", name: "李华", role: "数据开发" }, { acc: "wangfang", name: "王芳", role: "标注员" }].map((m, i) => (
                  <tr key={i} className="border-b last:border-0"><td className="py-2 px-3 font-mono text-xs">{m.acc}</td><td className="py-2 px-3">{m.name}</td><td className="py-2 px-3"><span className="status-tag status-tag-info">{m.role}</span></td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4"><button onClick={() => setShowMembers(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50">关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleOrganizations;

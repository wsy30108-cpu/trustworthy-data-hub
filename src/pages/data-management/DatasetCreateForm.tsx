import { useState, useCallback } from "react";
import { ArrowLeft, Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* ─── constants ─── */
const MODALITIES = ["文本", "图像", "语音", "视频", "表格", "跨模态"] as const;
const TEXT_TYPES = ["通用文本", "文本 SFT", "文本 RLHF", "文本 DPO", "文本 KTO"] as const;
const PURPOSES = ["模型微调", "预训练", "其他"] as const;
const STORAGE_FORMATS = ["Lance", "Parquet", "CSV", "JSON"] as const;
const STORAGE_LOCATIONS = ["系统默认存储", "高性能存储A", "冷存储B"] as const;
const AUTH_SCOPES = ["数据集所有者", "空间内全体成员", "指定用户", "指定空间角色"] as const;
const AUTH_PERMS = ["读数据集", "写数据集", "创建数据集版本"] as const;

const MOCK_USERS = ["张明", "李芳", "王强", "赵丽", "孙伟", "周涛", "吴磊"];
const MOCK_ROLES = ["空间管理员", "数据工程师", "标注员", "质检员", "验收员", "仲裁员", "观察员"];

/* catalog mock (mirrors ConsoleCatalog) */
const SYSTEM_CATALOGS = [
  { id: 1, name: "文本数据" }, { id: 2, name: "图片数据" }, { id: 3, name: "音频数据" },
  { id: 4, name: "视频数据" }, { id: 5, name: "多模态数据" },
];
const CUSTOM_CATALOGS = [
  { id: 6, name: "NLP团队自定义目录" }, { id: 7, name: "CV实验数据" },
];

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

interface KVTag { key: string; value: string }

/* ─── Tag Editor Dialog ─── */
function TagEditorDialog({
  open, onClose, tags, onSave, title, max = 20,
}: { open: boolean; onClose: () => void; tags: KVTag[]; onSave: (t: KVTag[]) => void; title: string; max?: number }) {
  const [draft, setDraft] = useState<KVTag[]>([]);
  const { toast } = useToast();

  const handleOpen = () => setDraft(tags.map(t => ({ ...t })));
  const add = () => {
    if (draft.length >= max) { toast({ title: `最多支持 ${max} 个标签`, variant: "destructive" }); return; }
    setDraft([...draft, { key: "", value: "" }]);
  };
  const remove = (i: number) => setDraft(draft.filter((_, idx) => idx !== i));
  const update = (i: number, field: "key" | "value", v: string) => {
    const next = [...draft]; next[i] = { ...next[i], [field]: v }; setDraft(next);
  };
  const save = () => {
    const valid = draft.filter(t => t.key.trim() && t.value.trim());
    onSave(valid); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {draft.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="Key" value={t.key} onChange={e => update(i, "key", e.target.value)} className="flex-1 h-8 text-sm" />
              <Input placeholder="Value" value={t.value} onChange={e => update(i, "value", e.target.value)} className="flex-1 h-8 text-sm" />
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          ))}
          {draft.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无标签，点击下方按钮添加</p>}
        </div>
        <Button variant="outline" size="sm" onClick={add} className="w-full gap-1"><Plus className="w-3 h-3" />添加标签</Button>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={save}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Multi-select dropdown (simple) ─── */
function MultiSelectDropdown({ options, selected, onChange, placeholder }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-card text-left flex items-center justify-between min-h-[36px]">
        {selected.length ? (
          <div className="flex flex-wrap gap-1">
            {selected.map(s => (
              <span key={s} className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs">{s}</span>
            ))}
          </div>
        ) : <span className="text-muted-foreground">{placeholder}</span>}
        <span className="text-muted-foreground text-xs ml-2">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map(o => (
              <label key={o} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm">
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded" />
                {o}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {required && <span className="text-destructive mr-0.5">*</span>}{label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ─── Main Form ─── */
export interface DatasetEditData {
  id: string; name: string; desc: string; purpose: string; modality: string; textType: string;
  dsTags: KVTag[]; scope: string; selectedUsers: string[]; selectedRoles: string[]; authPerms: string[];
  sysCatalogs: string[]; customCatalogs: string[];
  // read-only version fields
  version?: string; storageLocation?: string; storageFormat?: string; versionDesc?: string;
}

export default function DatasetCreateForm({ onBack, onCreated, editData }: {
  onBack: () => void; onCreated: (ds: any) => void; editData?: DatasetEditData;
}) {
  const { toast } = useToast();
  const isEdit = !!editData;

  // Section 1 – basic info
  const [name, setName] = useState(editData?.name || "");
  const [desc, setDesc] = useState(editData?.desc || "");
  const [purpose, setPurpose] = useState<string>(editData?.purpose || "模型微调");
  const [modality, setModality] = useState(editData?.modality || "");
  const [textType, setTextType] = useState(editData?.textType || "");
  const [dsTags, setDsTags] = useState<KVTag[]>(editData?.dsTags || []);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  // Section 2 – version info (read-only in edit mode)
  const [versionDesc, setVersionDesc] = useState(editData?.versionDesc || "");
  const [storageLocation, setStorageLocation] = useState(editData?.storageLocation || "系统默认存储");
  const [storageFormat, setStorageFormat] = useState(editData?.storageFormat || "Lance");
  const [verTags, setVerTags] = useState<KVTag[]>([]);
  const [verTagDialogOpen, setVerTagDialogOpen] = useState(false);

  // Section 3 – permissions
  const [authScope, setAuthScope] = useState(editData?.scope || "数据集所有者");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(editData?.selectedUsers || []);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(editData?.selectedRoles || []);
  const [authPerms, setAuthPerms] = useState<string[]>(editData?.authPerms || ["读数据集"]);

  // Section 4 – catalog
  const [sysCatalogs, setSysCatalogs] = useState<string[]>(editData?.sysCatalogs || []);
  const [customCatalogs, setCustomCatalogs] = useState<string[]>(editData?.customCatalogs || []);

  // errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "请输入数据集名称";
    else if (!NAME_REGEX.test(name)) e.name = "仅支持中英文、数字、下划线";
    else if (name.length < 2 || name.length > 50) e.name = "名称长度需在2-50个字符之间";
    if (!modality) e.modality = "请选择数据集模态";
    if (modality === "文本" && !textType) e.textType = "请选择大模型数据集类型";
    if (sysCatalogs.length === 0) e.sysCatalogs = "请选择系统目录";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, modality, textType, sysCatalogs]);

  const handleSubmit = () => {
    if (!validate()) { toast({ title: "请检查表单填写", variant: "destructive" }); return; }
    const ds = {
      id: isEdit ? editData!.id : `DS-${String(Date.now()).slice(-3)}`,
      name, modality, purpose, desc,
      type: modality === "文本" ? textType : "-",
      scope: authScope,
      versions: 1, latestVersion: isEdit ? (editData!.version || "V1.0") : "V1.0",
      size: "0B", files: 0,
      tags: dsTags, status: "活跃",
      creator: "当前用户",
      createdAt: isEdit ? undefined : new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onCreated(ds);
    toast({ title: isEdit ? "数据集更新成功" : "数据集创建成功" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{isEdit ? "编辑数据集" : "新增数据集"}</h1>
          <p className="text-xs text-muted-foreground">{isEdit ? "修改数据集基本信息、权限和目录配置" : "填写数据集基本信息、版本、权限和目录配置"}</p>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <Section title="一、数据集基本信息">
        <div className="grid grid-cols-2 gap-4">
          <Field label="数据集中文名称" required error={errors.name}>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="支持中英文、数字、下划线，2-50字符" maxLength={50} />
          </Field>
          <Field label="数据用途" required>
            <div className="flex gap-3">
              {PURPOSES.map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="purpose" checked={purpose === p} onChange={() => setPurpose(p)} className="accent-primary" />{p}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="数据集模态" required error={errors.modality}>
            <select value={modality} onChange={e => { setModality(e.target.value); if (e.target.value !== "文本") setTextType(""); }}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-card">
              <option value="">请选择</option>
              {MODALITIES.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          {modality === "文本" && (
            <Field label="大模型数据集类型" required error={errors.textType}>
              <select value={textType} onChange={e => setTextType(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-card">
                <option value="">请选择</option>
                {TEXT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
        <Field label="数据集描述">
          <div className="relative">
            <Textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 1024))} placeholder="选填，0-1024字" rows={3} />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{desc.length}/1024</span>
          </div>
        </Field>
        <Field label="数据集标签">
          <div className="flex items-center gap-2 flex-wrap">
            {dsTags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">{t.key}: {t.value}</span>
            ))}
            <Button variant="outline" size="sm" onClick={() => setTagDialogOpen(true)} className="gap-1 h-7 text-xs">
              <Tag className="w-3 h-3" />管理标签{dsTags.length > 0 && ` (${dsTags.length})`}
            </Button>
          </div>
        </Field>
      </Section>

      {/* Section 2: Version Info */}
      <Section title="二、数据集版本信息">
        {isEdit && (
          <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">版本信息在编辑模式下不可修改</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="数据集版本">
            <Input value={isEdit ? (editData!.version || "V1.0") : "V1.0"} disabled className="bg-muted/50" />
          </Field>
          <Field label="存储位置">
            <select value={storageLocation} onChange={e => !isEdit && setStorageLocation(e.target.value)}
              disabled={isEdit}
              className={cn("w-full px-3 py-2 text-sm border rounded-lg bg-card", isEdit && "opacity-60 cursor-not-allowed bg-muted/50")}>
              {STORAGE_LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="存储格式">
            <div className="flex gap-3">
              {STORAGE_FORMATS.map(f => (
                <label key={f} className={cn("flex items-center gap-1.5 text-sm", isEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}>
                  <input type="radio" name="storageFormat" checked={storageFormat === f} onChange={() => !isEdit && setStorageFormat(f)} disabled={isEdit} className="accent-primary" />{f}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <Field label="版本描述">
          <div className="relative">
            <Textarea value={versionDesc} onChange={e => !isEdit && setVersionDesc(e.target.value.slice(0, 1024))} placeholder="选填，0-1024字" rows={3}
              disabled={isEdit} className={cn(isEdit && "opacity-60 cursor-not-allowed bg-muted/50")} />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{versionDesc.length}/1024</span>
          </div>
        </Field>
        {!isEdit && (
          <Field label="数据集版本标签">
            <div className="flex items-center gap-2 flex-wrap">
              {verTags.map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">{t.key}: {t.value}</span>
              ))}
              <Button variant="outline" size="sm" onClick={() => setVerTagDialogOpen(true)} className="gap-1 h-7 text-xs">
                <Tag className="w-3 h-3" />管理标签{verTags.length > 0 && ` (${verTags.length})`}
              </Button>
            </div>
          </Field>
        )}
      </Section>

      {/* Section 3: Permissions */}
      <Section title="三、数据集权限配置">
        <Field label="授权范围" required>
          <div className="flex gap-3 flex-wrap">
            {AUTH_SCOPES.map(s => (
              <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="authScope" checked={authScope === s}
                  onChange={() => { setAuthScope(s); setSelectedUsers([]); setSelectedRoles([]); }} className="accent-primary" />{s}
              </label>
            ))}
          </div>
        </Field>
        {authScope === "指定用户" && (
          <Field label="选择用户" required>
            <MultiSelectDropdown options={MOCK_USERS} selected={selectedUsers} onChange={setSelectedUsers} placeholder="请选择用户" />
          </Field>
        )}
        {authScope === "指定空间角色" && (
          <Field label="选择角色" required>
            <MultiSelectDropdown options={MOCK_ROLES} selected={selectedRoles} onChange={setSelectedRoles} placeholder="请选择角色" />
          </Field>
        )}
        {authScope !== "数据集所有者" && (
          <Field label="授权权限" required>
            <div className="flex gap-4">
              {AUTH_PERMS.map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={authPerms.includes(p)}
                    onChange={() => setAuthPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className="rounded accent-primary" />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <p>· 读数据集：读取数据集内数据</p>
              <p>· 写数据集：向数据集已有版本写入数据</p>
              <p>· 创建数据集版本：在数据集内创建新版本</p>
            </div>
          </Field>
        )}
      </Section>

      {/* Section 4: Catalog */}
      <Section title="四、数据目录配置">
        <div className="grid grid-cols-2 gap-4">
          <Field label="系统目录" required error={errors.sysCatalogs}>
            <MultiSelectDropdown
              options={SYSTEM_CATALOGS.map(c => c.name)}
              selected={sysCatalogs} onChange={setSysCatalogs}
              placeholder="请选择系统目录" />
          </Field>
          <Field label="自定义目录">
            <MultiSelectDropdown
              options={CUSTOM_CATALOGS.map(c => c.name)}
              selected={customCatalogs} onChange={setCustomCatalogs}
              placeholder="请选择自定义目录（选填）" />
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" onClick={onBack}>取消</Button>
        <Button onClick={handleSubmit}>{isEdit ? "保存修改" : "创建数据集"}</Button>
      </div>

      {/* Tag Dialogs */}
      <TagEditorDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} tags={dsTags} onSave={setDsTags} title="数据集标签编辑" />
      {!isEdit && <TagEditorDialog open={verTagDialogOpen} onClose={() => setVerTagDialogOpen(false)} tags={verTags} onSave={setVerTags} title="版本标签编辑" />}
    </div>
  );
}

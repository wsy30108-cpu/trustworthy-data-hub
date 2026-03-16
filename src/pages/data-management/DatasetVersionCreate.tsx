import { useState, useCallback } from "react";
import { ArrowLeft, Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface KVTag { key: string; value: string }
interface DatasetInfo { id: string; name: string; modality: string; purpose: string; storageLocation: string; tags: KVTag[]; scope: string; }

const STORAGE_FORMATS = ["Lance", "Parquet", "CSV", "JSON"] as const;
const STORAGE_LOCATIONS = ["系统默认存储", "高性能存储A", "冷存储B"] as const;
const AUTH_SCOPES = ["数据集所有者", "空间内全体成员", "指定用户", "指定空间角色"] as const;
const AUTH_PERMS = ["读数据集", "写数据集", "创建数据集版本"] as const;
const MOCK_USERS = ["张明", "李芳", "王强", "赵丽", "孙伟"];
const MOCK_ROLES = ["空间管理员", "数据工程师", "标注员", "质检员"];

/* ─── Tag Editor ─── */
function TagEditorDialog({ open, onClose, tags, onSave, title }: {
  open: boolean; onClose: () => void; tags: KVTag[]; onSave: (t: KVTag[]) => void; title: string;
}) {
  const [draft, setDraft] = useState<KVTag[]>([]);
  const { toast } = useToast();
  const handleOpen = () => setDraft(tags.map(t => ({ ...t })));
  const add = () => {
    if (draft.length >= 20) { toast({ title: "最多支持20个标签", variant: "destructive" }); return; }
    setDraft([...draft, { key: "", value: "" }]);
  };
  const remove = (i: number) => setDraft(draft.filter((_, idx) => idx !== i));
  const update = (i: number, f: "key" | "value", v: string) => { const n = [...draft]; n[i] = { ...n[i], [f]: v }; setDraft(n); };
  const save = () => { onSave(draft.filter(t => t.key.trim() && t.value.trim())); onClose(); };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {draft.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="Key" value={t.key} onChange={e => update(i, "key", e.target.value)} className="flex-1 h-8 text-sm" />
              <Input placeholder="Value" value={t.value} onChange={e => update(i, "value", e.target.value)} className="flex-1 h-8 text-sm" />
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          ))}
          {draft.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无标签</p>}
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

/* ─── Multi-select ─── */
function MultiSelect({ options, selected, onChange, placeholder }: {
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
            {selected.map(s => <span key={s} className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs">{s}</span>)}
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
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded" />{o}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section + Field ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-3.5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{required && <span className="text-destructive mr-0.5">*</span>}{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export default function DatasetVersionCreate({ dataset, existingVersions, onBack, onCreated }: {
  dataset: DatasetInfo;
  existingVersions: string[];
  onBack: () => void;
  onCreated: (version: any) => void;
}) {
  const { toast } = useToast();

  // Auto-generate next version number
  const getNextVersion = () => {
    const nums = existingVersions.map(v => {
      const m = v.match(/V(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `V${max + 1}.0`;
  };

  const nextVersion = getNextVersion();

  // Form state
  const [versionDesc, setVersionDesc] = useState("");
  const [verTags, setVerTags] = useState<KVTag[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [storageLocation, setStorageLocation] = useState(dataset.storageLocation || "系统默认存储");
  const [storageFormat, setStorageFormat] = useState("Lance");

  // Permission
  const [permMode, setPermMode] = useState<"inherit" | "custom">("inherit");
  const [authScope, setAuthScope] = useState("数据集所有者");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [authPerms, setAuthPerms] = useState<string[]>(["读数据集"]);

  // Import mode
  const [importMode, setImportMode] = useState<"empty" | "copy" | "external">("empty");
  const [copySource, setCopySource] = useState(existingVersions[0] || "");
  const [copyRange, setCopyRange] = useState("全量复制");

  const storagePath = `/${dataset.id}/${nextVersion}/`;

  const handleSubmit = () => {
    const newVer = {
      id: `VER-${Date.now().toString().slice(-4)}`,
      version: nextVersion,
      fileCount: 0,
      size: "0B",
      tags: verTags,
      annotationStatus: "未标注" as const,
      cleanStatus: "未清洗" as const,
      publishStatus: "未发布" as const,
      creator: "当前用户",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      status: importMode === "empty" ? "可用" as const : "创建中" as const,
    };
    onCreated(newVer);
    toast({ title: `版本 ${nextVersion} 创建成功` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">新增数据集版本</h1>
          <p className="text-xs text-muted-foreground">{dataset.name}</p>
        </div>
      </div>

      {/* Section 1: Version Info */}
      <Section title="版本基本信息">
        <div className="grid grid-cols-2 gap-4">
          <Field label="版本号" required>
            <Input value={nextVersion} disabled className="bg-muted/50" />
            <p className="text-[11px] text-muted-foreground">系统自动生成，不可修改</p>
          </Field>
          <Field label="存储路径">
            <Input value={storagePath} disabled className="bg-muted/50 font-mono text-xs" />
          </Field>
        </div>
        <Field label="版本描述">
          <div className="relative">
            <Textarea value={versionDesc} onChange={e => setVersionDesc(e.target.value.slice(0, 1024))} placeholder="选填，0-1024字" rows={3} />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{versionDesc.length}/1024</span>
          </div>
        </Field>
        <Field label="版本标签">
          <div className="flex items-center gap-2 flex-wrap">
            {verTags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">{t.key}: {t.value}</span>
            ))}
            <Button variant="outline" size="sm" onClick={() => setTagDialogOpen(true)} className="gap-1 h-7 text-xs">
              <Tag className="w-3 h-3" />管理标签{verTags.length > 0 && ` (${verTags.length})`}
            </Button>
          </div>
        </Field>
      </Section>

      {/* Section 2: Storage */}
      <Section title="存储与格式配置">
        <div className="grid grid-cols-2 gap-4">
          <Field label="存储位置" required>
            <select value={storageLocation} onChange={e => setStorageLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-card">
              {STORAGE_LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="存储格式" required>
            <div className="flex gap-3 pt-1">
              {STORAGE_FORMATS.map(f => (
                <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="storageFormat" checked={storageFormat === f} onChange={() => setStorageFormat(f)} className="accent-primary" />{f}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Section 3: Permissions */}
      <Section title="权限配置">
        <Field label="权限模式" required>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-colors"
              style={{ borderColor: permMode === "inherit" ? "hsl(var(--primary))" : undefined, background: permMode === "inherit" ? "hsl(var(--primary) / 0.05)" : undefined }}>
              <input type="radio" checked={permMode === "inherit"} onChange={() => setPermMode("inherit")} className="accent-primary" />
              <div>
                <span className="font-medium">继承父数据集权限</span>
                <p className="text-[11px] text-muted-foreground">自动复用数据集的授权范围与权限</p>
              </div>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-colors"
              style={{ borderColor: permMode === "custom" ? "hsl(var(--primary))" : undefined, background: permMode === "custom" ? "hsl(var(--primary) / 0.05)" : undefined }}>
              <input type="radio" checked={permMode === "custom"} onChange={() => setPermMode("custom")} className="accent-primary" />
              <div>
                <span className="font-medium">自定义权限</span>
                <p className="text-[11px] text-muted-foreground">为本版本单独配置权限</p>
              </div>
            </label>
          </div>
        </Field>
        {permMode === "custom" && (
          <>
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
                <MultiSelect options={MOCK_USERS} selected={selectedUsers} onChange={setSelectedUsers} placeholder="请选择用户" />
              </Field>
            )}
            {authScope === "指定空间角色" && (
              <Field label="选择角色" required>
                <MultiSelect options={MOCK_ROLES} selected={selectedRoles} onChange={setSelectedRoles} placeholder="请选择角色" />
              </Field>
            )}
            {authScope !== "数据集所有者" && (
              <Field label="授权权限" required>
                <div className="flex gap-4">
                  {AUTH_PERMS.map(p => (
                    <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={authPerms.includes(p)}
                        onChange={() => setAuthPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className="rounded accent-primary" />
                      {p}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          </>
        )}
      </Section>

      {/* Section 4: Import */}
      <Section title="初始数据导入方式">
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: "empty", title: "空版本", desc: "仅创建版本结构，后续手动上传" },
            { key: "copy", title: "从已有版本复制", desc: "选择历史版本进行全量或过滤复制" },
            { key: "external", title: "从外部导入", desc: "本地上传、平台数据集或FTP导入" },
          ] as const).map(opt => (
            <button key={opt.key} onClick={() => setImportMode(opt.key)}
              className={cn("text-left p-4 rounded-lg border transition-all",
                importMode === opt.key ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/30")}>
              <p className="text-sm font-medium text-foreground">{opt.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {importMode === "copy" && existingVersions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 rounded-lg bg-muted/30">
            <Field label="选择源版本" required>
              <select value={copySource} onChange={e => setCopySource(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-card">
                {existingVersions.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="复制范围">
              <div className="flex gap-3 pt-1">
                {["全量复制", "按标签过滤", "按样本量过滤"].map(r => (
                  <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={copyRange === r} onChange={() => setCopyRange(r)} className="accent-primary" />{r}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {importMode === "external" && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">版本创建后，将跳转至版本详情页，您可以在那里通过「上传数据」进行数据导入。</p>
          </div>
        )}
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" onClick={onBack}>取消</Button>
        <Button onClick={handleSubmit}>确定创建</Button>
      </div>

      {/* Tag Dialog */}
      <TagEditorDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} tags={verTags} onSave={setVerTags} title="版本标签编辑" />
    </div>
  );
}

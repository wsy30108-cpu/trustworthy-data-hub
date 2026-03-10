import { useState } from "react";
import { ArrowLeft, Upload, X, FileText, FileSpreadsheet, FileType, Code, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface DatasetInfo { id: string; name: string; modality: string; }
interface VersionInfo { version: string; }

type UploadMethod = "本地导入" | "平台已有数据集" | "在线 FTP 导入";
type AnnotationStatus = "无标注信息" | "有标注信息";
type FileFormat = "文本文档" | "Excel 表格" | "Word 文档" | "标记语言文件" | "JSON 文件" | "压缩包";

const FORMAT_EXTENSIONS: Record<FileFormat, string> = {
  "文本文档": ".txt",
  "Excel 表格": ".xls .xlsx",
  "Word 文档": ".doc .docx",
  "标记语言文件": ".xml .html",
  "JSON 文件": ".json .jsonl",
  "压缩包": ".zip .rar .7z",
};

const FORMAT_ICONS: Record<FileFormat, React.ReactNode> = {
  "文本文档": <FileText className="w-5 h-5" />,
  "Excel 表格": <FileSpreadsheet className="w-5 h-5" />,
  "Word 文档": <FileType className="w-5 h-5" />,
  "标记语言文件": <Code className="w-5 h-5" />,
  "JSON 文件": <Code className="w-5 h-5" />,
  "压缩包": <Archive className="w-5 h-5" />,
};

const MODALITY_FILE_FILTER: Record<string, string[]> = {
  "文本": ["仅文本"],
  "图像": ["仅图片"],
  "语音": ["仅音频"],
  "视频": ["仅视频"],
  "跨模态": ["全部格式", "仅文本", "仅图片", "仅音频", "仅视频"],
  "表格": ["全部格式", "仅文本"],
};

/* ─── Section + Field ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card p-5 space-y-4"><h3 className="text-sm font-semibold text-foreground">{title}</h3>{children}</div>;
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
export default function DatasetImportConfig({ dataset, version, onBack, onComplete }: {
  dataset: DatasetInfo;
  version: VersionInfo;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { toast } = useToast();

  // Common fields
  const [annotationStatus, setAnnotationStatus] = useState<AnnotationStatus>("无标注信息");
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("本地导入");

  // Local import
  const [fileFormat, setFileFormat] = useState<FileFormat>("文本文档");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);

  // Text format config
  const [delimiter, setDelimiter] = useState("换行符");
  const [encoding, setEncoding] = useState("UTF-8");

  // Excel config
  const [sheetName, setSheetName] = useState("Sheet1");
  const [headerRow, setHeaderRow] = useState("1");
  const [dataStartRow, setDataStartRow] = useState("2");

  // Word config
  const [extractRange, setExtractRange] = useState("全文提取");

  // XML config
  const [tagRule, setTagRule] = useState("无");
  const [tagNames, setTagNames] = useState("");

  // Zip config
  const [zipFormatFilter, setZipFormatFilter] = useState<string[]>(["全部格式"]);
  const [keepDirStructure, setKeepDirStructure] = useState(true);
  const [overwriteSameName, setOverwriteSameName] = useState(true);
  const [zipPassword, setZipPassword] = useState("");

  // Platform import
  const [sourceType, setSourceType] = useState("我的数据集");
  const [sourceDataset, setSourceDataset] = useState("");
  const [sourceVersion, setSourceVersion] = useState("");
  const [importDataRange, setImportDataRange] = useState("全部数据");

  // FTP import
  const [ftpProtocol, setFtpProtocol] = useState("FTP");
  const [ftpHost, setFtpHost] = useState("");
  const [ftpPort, setFtpPort] = useState("21");
  const [ftpUser, setFtpUser] = useState("");
  const [ftpPass, setFtpPass] = useState("");
  const [ftpPath, setFtpPath] = useState("");
  const [ftpFileType, setFtpFileType] = useState("文本文档");
  const [syncStrategy, setSyncStrategy] = useState("单次导入");
  const [cronExpr, setCronExpr] = useState("");
  const [ftpTested, setFtpTested] = useState(false);

  // Simulate file pick
  const addFiles = () => {
    const mockFile = { name: `data_${Date.now().toString().slice(-4)}.${fileFormat === "压缩包" ? "zip" : fileFormat === "JSON 文件" ? "json" : "txt"}`, size: `${(Math.random() * 100).toFixed(1)}MB` };
    setUploadedFiles(prev => [...prev, mockFile]);
  };
  const removeFile = (i: number) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));

  const canSubmit = () => {
    if (uploadMethod === "本地导入") return uploadedFiles.length > 0;
    if (uploadMethod === "平台已有数据集") return sourceDataset && sourceVersion;
    if (uploadMethod === "在线 FTP 导入") return ftpHost && ftpUser && ftpPass && ftpPath && ftpTested;
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit()) { toast({ title: "请完善必填配置项", variant: "destructive" }); return; }
    toast({ title: "上传任务已创建，正在处理中..." });
    onComplete();
  };

  const availableZipFilters = MODALITY_FILE_FILTER[dataset.modality] || ["全部格式"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">导入数据</h1>
          <p className="text-xs text-muted-foreground">{dataset.name} / {version.version}</p>
        </div>
      </div>

      {/* Fixed config */}
      <Section title="一、基础配置">
        <div className="grid grid-cols-3 gap-4">
          <Field label="数据集模态">
            <Input value={dataset.modality} disabled className="bg-muted/50" />
          </Field>
          <Field label="数据标注状态" required>
            <div className="flex gap-3 pt-1">
              {(["无标注信息", "有标注信息"] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={annotationStatus === s} onChange={() => setAnnotationStatus(s)} className="accent-primary" />{s}
                </label>
              ))}
            </div>
          </Field>
          <Field label="上传方式" required>
            <select value={uploadMethod} onChange={e => setUploadMethod(e.target.value as UploadMethod)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-card">
              {(["本地导入", "平台已有数据集", "在线 FTP 导入"] as const).map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* LOCAL IMPORT */}
      {uploadMethod === "本地导入" && (
        <>
          <Section title="二、格式选择">
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORMAT_EXTENSIONS) as FileFormat[]).map(fmt => (
                <button key={fmt} onClick={() => { setFileFormat(fmt); setUploadedFiles([]); }}
                  className={cn("flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    fileFormat === fmt ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/30")}>
                  <div className={cn("p-2 rounded-md", fileFormat === fmt ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {FORMAT_ICONS[fmt]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{fmt}</p>
                    <p className="text-[11px] text-muted-foreground">{FORMAT_EXTENSIONS[fmt]}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Format-specific config */}
          <Section title="三、格式适配配置">
            {fileFormat === "文本文档" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="分隔符" required>
                  <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                    {["换行符", "半角逗号", "制表符", "空格", "无", "自定义"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="编码格式">
                  <select value={encoding} onChange={e => setEncoding(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                    {["UTF-8", "GBK", "GB2312", "ISO-8859-1"].map(e => <option key={e}>{e}</option>)}
                  </select>
                </Field>
              </div>
            )}
            {fileFormat === "Excel 表格" && (
              <div className="grid grid-cols-3 gap-4">
                <Field label="工作表"><Input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Sheet1" /></Field>
                <Field label="表头行号"><Input value={headerRow} onChange={e => setHeaderRow(e.target.value)} placeholder="1" /></Field>
                <Field label="数据起始行号"><Input value={dataStartRow} onChange={e => setDataStartRow(e.target.value)} placeholder="2" /></Field>
              </div>
            )}
            {fileFormat === "Word 文档" && (
              <Field label="文本提取范围">
                <div className="flex gap-3">
                  {["全文提取", "正文提取", "页眉页脚排除"].map(r => (
                    <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" checked={extractRange === r} onChange={() => setExtractRange(r)} className="accent-primary" />{r}
                    </label>
                  ))}
                </div>
              </Field>
            )}
            {fileFormat === "标记语言文件" && (
              <div className="space-y-3">
                <Field label="标签提取规则">
                  <div className="flex gap-3">
                    {["无", "指定标签", "排除指定标签"].map(r => (
                      <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" checked={tagRule === r} onChange={() => setTagRule(r)} className="accent-primary" />{r}
                      </label>
                    ))}
                  </div>
                </Field>
                {tagRule !== "无" && (
                  <Field label={tagRule === "指定标签" ? "提取标签名" : "排除标签名"}>
                    <Input value={tagNames} onChange={e => setTagNames(e.target.value)} placeholder="如 <content>，多个用逗号分隔" />
                  </Field>
                )}
              </div>
            )}
            {fileFormat === "JSON 文件" && (
              <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                JSON 格式文件将自动按照单个 JSON 对象（{"{}"}）或 JSON 数组（[{"{}"},]）进行拆分处理
              </p>
            )}
            {fileFormat === "压缩包" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="解压后文件格式过滤" required>
                    <select value={zipFormatFilter[0]} onChange={e => setZipFormatFilter([e.target.value])}
                      className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                      {availableZipFilters.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="解压密码（可选）">
                    <Input type="password" value={zipPassword} onChange={e => setZipPassword(e.target.value)} placeholder="未加密则留空" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="保留原目录结构">
                    <div className="flex gap-3">
                      {[true, false].map(v => (
                        <label key={String(v)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" checked={keepDirStructure === v} onChange={() => setKeepDirStructure(v)} className="accent-primary" />{v ? "是" : "否"}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="覆盖同名文件">
                    <div className="flex gap-3">
                      {[true, false].map(v => (
                        <label key={String(v)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" checked={overwriteSameName === v} onChange={() => setOverwriteSameName(v)} className="accent-primary" />{v ? "是" : "否"}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            )}
          </Section>

          {/* File upload area */}
          <Section title="四、文件上传">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">点击或拖拽文件到此区域上传</p>
              <p className="text-[11px] text-muted-foreground mb-3">
                {fileFormat === "压缩包" ? "单批次最多10个压缩包，单包≤10GB" : `单批次最多100个文件，支持 ${FORMAT_EXTENSIONS[fileFormat]} 格式`}
              </p>
              <Button variant="outline" size="sm" onClick={addFiles} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />选择文件
              </Button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1 mt-3">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{f.name}</span>
                      <span className="text-xs text-muted-foreground">{f.size}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {/* PLATFORM IMPORT */}
      {uploadMethod === "平台已有数据集" && (
        <Section title="二、平台数据集导入配置">
          <div className="grid grid-cols-3 gap-4">
            <Field label="数据集来源" required>
              <select value={sourceType} onChange={e => setSourceType(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {["我的数据集", "我订阅的数据集", "分享给我的数据集"].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="选择数据集" required>
              <Input value={sourceDataset} onChange={e => setSourceDataset(e.target.value)} placeholder="输入或选择数据集名称" />
            </Field>
            <Field label="选择版本" required>
              <Input value={sourceVersion} onChange={e => setSourceVersion(e.target.value)} placeholder="如 V2.0" />
            </Field>
          </div>
          <Field label="导入范围">
            <div className="flex gap-3">
              {["全部数据", "不含标注数据"].map(r => (
                <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={importDataRange === r} onChange={() => setImportDataRange(r)} className="accent-primary" />{r}
                </label>
              ))}
            </div>
          </Field>
        </Section>
      )}

      {/* FTP IMPORT */}
      {uploadMethod === "在线 FTP 导入" && (
        <Section title="二、FTP 导入配置">
          <div className="grid grid-cols-3 gap-4">
            <Field label="协议" required>
              <select value={ftpProtocol} onChange={e => setFtpProtocol(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {["FTP", "SFTP", "FTPS"].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="地址" required>
              <Input value={ftpHost} onChange={e => { setFtpHost(e.target.value); setFtpTested(false); }} placeholder="如 192.168.1.100" />
            </Field>
            <Field label="端口" required>
              <Input value={ftpPort} onChange={e => { setFtpPort(e.target.value); setFtpTested(false); }} placeholder="21" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="用户名" required>
              <Input value={ftpUser} onChange={e => { setFtpUser(e.target.value); setFtpTested(false); }} placeholder="FTP 用户名" />
            </Field>
            <Field label="密码" required>
              <Input type="password" value={ftpPass} onChange={e => { setFtpPass(e.target.value); setFtpTested(false); }} placeholder="FTP 密码" />
            </Field>
            <Field label="远程路径" required>
              <Input value={ftpPath} onChange={e => { setFtpPath(e.target.value); setFtpTested(false); }} placeholder="/data/export/" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="文件类型" required>
              <select value={ftpFileType} onChange={e => setFtpFileType(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {["文本文档", "Excel 表格", "Word 文档", "标记语言文件", "JSON 文件", "压缩包"].map(f => <option key={f}>{f}</option>)}
              </select>
              {ftpFileType === "压缩包" && <p className="text-[11px] text-muted-foreground mt-1">压缩包自动解压已开启（不可关闭）</p>}
            </Field>
            <Field label="同步策略">
              <div className="flex gap-3">
                {["单次导入", "定时同步"].map(s => (
                  <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={syncStrategy === s} onChange={() => setSyncStrategy(s)} className="accent-primary" />{s}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          {syncStrategy === "定时同步" && (
            <Field label="Cron 表达式" required>
              <Input value={cronExpr} onChange={e => setCronExpr(e.target.value)} placeholder="如 0 0 * * * （每天0点）" />
            </Field>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (!ftpHost || !ftpUser || !ftpPass || !ftpPath) {
                toast({ title: "请先填写完整连接信息", variant: "destructive" });
                return;
              }
              toast({ title: "连通性测试通过" });
              setFtpTested(true);
            }} className="gap-1.5 text-xs">
              测试连接
            </Button>
            {ftpTested && <span className="text-xs text-green-600">✓ 连接成功</span>}
            {!ftpTested && ftpHost && <span className="text-xs text-muted-foreground">请先测试连接</span>}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" onClick={onBack}>取消</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit()}
          className={cn(!canSubmit() && "opacity-50 cursor-not-allowed")}>
          开始上传
        </Button>
      </div>
    </div>
  );
}

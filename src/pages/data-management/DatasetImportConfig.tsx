import { useState } from "react";
import { ArrowLeft, Upload, X, FileText, FileSpreadsheet, FileType, Code, Archive, Plus, ChevronDown, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface DatasetInfo { id: string; name: string; modality: string; type?: string; }
interface VersionInfo { version: string; }

type UploadMethod = "本地导入" | "平台已有数据集" | "在线 FTP 导入";
type AnnotationStatus = "无标注信息" | "有标注信息";
type FileFormat = "文本文档" | "Excel 表格" | "Word 文档" | "标记语言文件" | "JSON 文件" | "压缩包";
type ZipSubFormat = "文本文档" | "Excel 表格" | "Word 文档" | "标记语言文件" | "JSON 文件";

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

const ZIP_SUB_FORMATS: ZipSubFormat[] = ["文本文档", "Excel 表格", "Word 文档", "标记语言文件", "JSON 文件"];

/* ─── JSONL Sample Data Generators ─── */
const LARGE_MODEL_TEXT_TYPES = ["通用文本", "文本 SFT", "文本 RLHF", "文本 DPO", "文本 KTO"] as const;

function getJsonlSampleContent(textType?: string): string {
  const samples: Record<string, any[]> = {
    "通用文本": [
      { text: "这是一条示例文本数据" },
      { text: "这是另一条示例文本数据" },
      { text: "大模型训练需要大量高质量的文本数据" }
    ],
    "文本 SFT": [
      { messages: [{ role: "system", content: "你是一个有用的AI助手。" }, { role: "user", content: "请介绍一下人工智能。" }, { role: "assistant", content: "人工智能是一门研究如何让计算机模拟人类智能的学科。" }] },
      { messages: [{ role: "user", content: "什么是机器学习?" }, { role: "assistant", content: "机器学习是人工智能的一个分支,它使计算机能够从数据中学习并做出预测。" }] }
    ],
    "文本 RLHF": [
      { prompt: "请解释量子计算的基本原理。", chosen: "量子计算利用量子力学现象如叠加和纠缠来进行计算,具有超越经典计算机的潜力。", rejected: "量子计算是一种使用量子比特进行运算的计算方式。" },
      { prompt: "如何学习编程?", chosen: "学习编程建议从基础开始,选择一门适合初学者的语言如Python,通过实践项目来巩固知识。", rejected: "你可以随便找本书看看。" }
    ],
    "文本 DPO": [
      { prompt: "写一首关于春天的诗。", chosen: "春风拂面花自开,柳绿桃红映楼台。燕归巢中呢喃语,万物复苏展新颜。", rejected: "春天来了,花开了,树绿了。" },
      { prompt: "推荐一本好书。", chosen: "我推荐《百年孤独》,这是加西亚·马尔克斯的代表作,以魔幻现实主义手法讲述了布恩迪亚家族七代人的故事。", rejected: "看《百年孤独》吧。" }
    ],
    "文本 KTO": [
      { input: "翻译: Hello, how are you?", output: "你好,你怎么样?", label: true },
      { input: "翻译: Good morning!", output: "早上好!", label: true },
      { input: "总结这篇文章。", output: "这篇文章讲了天气。", label: false }
    ]
  };

  const data = samples[textType || "通用文本"] || samples["通用文本"];
  return data.map(item => JSON.stringify(item)).join("\n");
}

function downloadJsonlSample(textType?: string) {
  const content = getJsonlSampleContent(textType);
  const blob = new Blob([content], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sample_${textType?.replace(/\s+/g, "_").toLowerCase() || "general"}_data.jsonl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Section + Field ─── */
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-primary rounded-full" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
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

/* ─── Format Adapter Config (reusable for both direct and zip sub-format) ─── */
function FormatAdapterConfig({ format, dataset,
  delimiter, setDelimiter, customDelimiter, setCustomDelimiter, encoding, setEncoding,
  splitMode, setSplitMode, sheetName, setSheetName, headerRow, setHeaderRow, dataStartRow, setDataStartRow,
  headerCol, setHeaderCol, dataStartCol, setDataStartCol,
  extractRange, setExtractRange, tagRule, setTagRule, tagNames, setTagNames }: {
    format: string;
    dataset?: DatasetInfo;
    delimiter: string; setDelimiter: (v: string) => void;
    customDelimiter: string; setCustomDelimiter: (v: string) => void;
    encoding: string; setEncoding: (v: string) => void;
    splitMode?: "按行拆分" | "按列拆分" | "不拆分"; setSplitMode?: (v: "按行拆分" | "按列拆分" | "不拆分") => void;
    sheetName: string; setSheetName: (v: string) => void;
    headerRow: string; setHeaderRow: (v: string) => void;
    dataStartRow: string; setDataStartRow: (v: string) => void;
    headerCol?: string; setHeaderCol?: (v: string) => void;
    dataStartCol?: string; setDataStartCol?: (v: string) => void;
    extractRange: string; setExtractRange: (v: string) => void;
    tagRule: string; setTagRule: (v: string) => void;
    tagNames: string; setTagNames: (v: string) => void;
  }) {
  if (format === "文本文档") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="分隔符" required>
          <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
            {["换行符", "半角逗号", "制表符", "空格", "无", "自定义"].map(d => <option key={d}>{d}</option>)}
          </select>
          {delimiter === "自定义" && (
            <Input value={customDelimiter} onChange={e => setCustomDelimiter(e.target.value)}
              placeholder="请输入自定义分隔符" className="mt-2" />
          )}
        </Field>
        <Field label="编码格式">
          <select value={encoding} onChange={e => setEncoding(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md bg-card">
            {["UTF-8", "GBK", "GB2312", "ISO-8859-1"].map(e => <option key={e}>{e}</option>)}
          </select>
        </Field>
      </div>
    );
  }
  if (format === "Excel 表格") {
    return (
      <div className="space-y-4">
        <Field label="数据拆分方式" required>
          <div className="flex gap-4 pt-1">
            {(["按行拆分", "按列拆分", "不拆分"] as const).map(m => (
              <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-primary transition-colors">
                <input type="radio" checked={splitMode === m} onChange={() => setSplitMode?.(m)} className="accent-primary" />{m}
              </label>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="工作表"><Input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Sheet1" /></Field>
          {splitMode === "按列拆分" ? (
            <>
              <Field label="表头列号"><Input value={headerCol} onChange={e => setHeaderCol?.(e.target.value)} placeholder="1" /></Field>
              <Field label="数据起始列号"><Input value={dataStartCol} onChange={e => setDataStartCol?.(e.target.value)} placeholder="2" /></Field>
            </>
          ) : (
            <>
              <Field label="表头行号"><Input value={headerRow} onChange={e => setHeaderRow(e.target.value)} placeholder="1" /></Field>
              {splitMode === "按行拆分" && (
                <Field label="数据起始行号"><Input value={dataStartRow} onChange={e => setDataStartRow(e.target.value)} placeholder="2" /></Field>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  if (format === "Word 文档") {
    return (
      <Field label="文本提取范围">
        <div className="flex gap-3">
          {["全文提取", "正文提取", "页眉页脚排除"].map(r => (
            <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" checked={extractRange === r} onChange={() => setExtractRange(r)} className="accent-primary" />{r}
            </label>
          ))}
        </div>
      </Field>
    );
  }
  if (format === "标记语言文件") {
    return (
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
    );
  }
  if (format === "JSON 文件") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          JSON 格式文件将自动按照单个 JSON 对象（{"{}"}）或 JSON 数组（[{"{}"},]）进行拆分处理
        </p>
        {(dataset?.type && ["通用文本", "文本 SFT", "文本 RLHF", "文本 DPO", "文本 KTO"].includes(dataset.type)) && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-foreground">{dataset.type} 格式说明</p>
              <p className="text-xs text-muted-foreground">
                {dataset.type === "文本 SFT" && "每条数据包含 messages 数组,包含 system/user/assistant 角色的对话内容"}
                {dataset.type === "文本 RLHF" && "每条数据包含 prompt、chosen(优选回答)、rejected(拒绝回答) 三个字段"}
                {dataset.type === "文本 DPO" && "每条数据包含 prompt、chosen(优选回答)、rejected(拒绝回答) 三个字段,用于直接偏好优化"}
                {dataset.type === "文本 KTO" && "每条数据包含 input、output、label(布尔值,表示是否可接受) 三个字段"}
                {dataset.type === "通用文本" && "每条数据为简单的 JSON 对象,至少包含 text 字段存储文本内容"}
              </p>
              <Button size="sm" variant="outline" onClick={() => downloadJsonlSample(dataset.type)}
                className="h-7 gap-1.5 text-xs mt-1">
                <Download className="w-3.5 h-3.5" />下载示例 JSONL 文件
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

/* ─── Mock datasets for platform import ─── */
const MOCK_PLATFORM_DATASETS = [
  { id: "DS-001", name: "中文情感分析训练集", versions: ["V1.0", "V2.0", "V3.0"], source: "我的数据集" },
  { id: "DS-002", name: "医疗影像CT扫描数据集", versions: ["V1.0", "V2.0", "V3.0", "V4.0", "V5.0"], source: "我的数据集" },
  { id: "DS-003", name: "多语种平行翻译语料", versions: ["V1.0", "V2.0"], source: "我的数据集" },
  { id: "DS-S001", name: "金融新闻语料库", versions: ["V1.0", "V2.0", "V3.0", "V4.0", "V5.0", "V6.0"], source: "我订阅的数据集" },
  { id: "DS-S002", name: "开源医学影像数据集", versions: ["V1.0", "V2.0", "V3.0"], source: "我订阅的数据集" },
  { id: "DS-H001", name: "内部标注训练集", versions: ["V1.0", "V2.0"], source: "分享给我的数据集" },
  { id: "DS-H002", name: "产品图像分类数据集", versions: ["V1.0", "V2.0", "V3.0", "V4.0"], source: "分享给我的数据集" },
];

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

  // Large Model Text types that only support JSON
  const isLargeModelText = dataset.modality === "文本" &&
    ["文本 SFT", "文本 RLHF", "文本 DPO", "文本 KTO"].includes(dataset.type || "");

  // Local import
  const [fileFormat, setFileFormat] = useState<FileFormat>(isLargeModelText ? "JSON 文件" : "文本文档");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);

  // Text format config
  const [delimiter, setDelimiter] = useState("换行符");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [encoding, setEncoding] = useState("UTF-8");

  // Excel config
  const [excelSplitMode, setExcelSplitMode] = useState<"按行拆分" | "按列拆分" | "不拆分">("按行拆分");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [headerRow, setHeaderRow] = useState("1");
  const [dataStartRow, setDataStartRow] = useState("2");
  const [headerCol, setHeaderCol] = useState("1");
  const [dataStartCol, setDataStartCol] = useState("1");

  // Word config
  const [extractRange, setExtractRange] = useState("全文提取");

  // XML config
  const [tagRule, setTagRule] = useState("无");
  const [tagNames, setTagNames] = useState("");

  // Zip config
  const [zipSubFormat, setZipSubFormat] = useState<ZipSubFormat>("文本文档");
  const [keepDirStructure, setKeepDirStructure] = useState(true);
  const [overwriteSameName, setOverwriteSameName] = useState(true);
  const [zipPassword, setZipPassword] = useState("");

  // Zip sub-format adapter states
  const [zipExcelSplitMode, setZipExcelSplitMode] = useState<"按行拆分" | "按列拆分" | "不拆分">("按行拆分");
  const [zipDelimiter, setZipDelimiter] = useState("换行符");
  const [zipCustomDelimiter, setZipCustomDelimiter] = useState("");
  const [zipEncoding, setZipEncoding] = useState("UTF-8");
  const [zipSheetName, setZipSheetName] = useState("Sheet1");
  const [zipHeaderRow, setZipHeaderRow] = useState("1");
  const [zipDataStartRow, setZipDataStartRow] = useState("2");
  const [zipHeaderCol, setZipHeaderCol] = useState("1");
  const [zipDataStartCol, setZipDataStartCol] = useState("1");
  const [zipExtractRange, setZipExtractRange] = useState("全文提取");
  const [zipTagRule, setZipTagRule] = useState("无");
  const [zipTagNames, setZipTagNames] = useState("");

  // Platform import
  const [sourceType, setSourceType] = useState("我的数据集");
  const [sourceDatasetId, setSourceDatasetId] = useState("");
  const [sourceVersion, setSourceVersion] = useState("");
  const [importDataRange, setImportDataRange] = useState("全部数据");
  const [dsDropdownOpen, setDsDropdownOpen] = useState(false);
  const [dsSearch, setDsSearch] = useState("");

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
    if (uploadMethod === "平台已有数据集") return sourceDatasetId && sourceVersion;
    if (uploadMethod === "在线 FTP 导入") return ftpHost && ftpUser && ftpPass && ftpPath && ftpTested;
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit()) { toast({ title: "请完善必填配置项", variant: "destructive" }); return; }
    toast({ title: "上传任务已创建，正在处理中..." });
    onComplete();
  };

  // Platform import helpers
  const filteredPlatformDs = MOCK_PLATFORM_DATASETS.filter(d => {
    if (d.source !== sourceType) return false;
    if (dsSearch && !d.name.toLowerCase().includes(dsSearch.toLowerCase())) return false;
    return true;
  });
  const selectedPlatformDs = MOCK_PLATFORM_DATASETS.find(d => d.id === sourceDatasetId);

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
      <Section title="基础配置">
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
            <select value={uploadMethod} onChange={e => { setUploadMethod(e.target.value as UploadMethod); setUploadedFiles([]); }}
              className="w-full h-9 px-3 text-sm border rounded-md bg-card">
              {(["本地导入", "平台已有数据集", "在线 FTP 导入"] as const).map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* LOCAL IMPORT */}
      {uploadMethod === "本地导入" && (
        <>
          <Section title="格式选择">
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORMAT_EXTENSIONS) as FileFormat[])
                .filter(fmt => !isLargeModelText || fmt === "JSON 文件")
                .map(fmt => (
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
                ))
              }
            </div>
          </Section>

          {/* Format-specific config */}
          <Section title="格式适配配置">
            {fileFormat !== "压缩包" ? (
              <FormatAdapterConfig
                format={fileFormat}
                dataset={dataset}
                delimiter={delimiter} setDelimiter={setDelimiter}
                customDelimiter={customDelimiter} setCustomDelimiter={setCustomDelimiter}
                encoding={encoding} setEncoding={setEncoding}
                splitMode={excelSplitMode} setSplitMode={setExcelSplitMode}
                sheetName={sheetName} setSheetName={setSheetName}
                headerRow={headerRow} setHeaderRow={setHeaderRow}
                dataStartRow={dataStartRow} setDataStartRow={setDataStartRow}
                headerCol={headerCol} setHeaderCol={setHeaderCol}
                dataStartCol={dataStartCol} setDataStartCol={setDataStartCol}
                extractRange={extractRange} setExtractRange={setExtractRange}
                tagRule={tagRule} setTagRule={setTagRule}
                tagNames={tagNames} setTagNames={setTagNames}
              />
            ) : (
              /* ─── Archive config ─── */
              <div className="space-y-4">
                <Field label="解压后文件格式过滤" required>
                  <p className="text-xs text-muted-foreground mb-2">选择解压后需要保留的文件格式类型，选中后将展示对应的格式适配配置</p>
                  <div className="flex flex-wrap gap-2">
                    {ZIP_SUB_FORMATS.map(fmt => (
                      <label key={fmt} className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all",
                        zipSubFormat === fmt ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-primary font-medium" : "hover:border-primary/30 text-foreground"
                      )}>
                        <input type="radio" checked={zipSubFormat === fmt} onChange={() => setZipSubFormat(fmt)} className="accent-primary" />
                        {fmt}
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Sub-format adapter config */}
                <div className="border-l-2 border-primary/20 pl-4">
                  <p className="text-xs text-muted-foreground mb-3">「{zipSubFormat}」格式适配配置</p>
                  <FormatAdapterConfig
                    format={zipSubFormat}
                    dataset={dataset}
                    delimiter={zipDelimiter} setDelimiter={setZipDelimiter}
                    customDelimiter={zipCustomDelimiter} setCustomDelimiter={setZipCustomDelimiter}
                    encoding={zipEncoding} setEncoding={setZipEncoding}
                    splitMode={zipExcelSplitMode} setSplitMode={setZipExcelSplitMode}
                    sheetName={zipSheetName} setSheetName={setZipSheetName}
                    headerRow={zipHeaderRow} setHeaderRow={setZipHeaderRow}
                    dataStartRow={zipDataStartRow} setDataStartRow={setZipDataStartRow}
                    headerCol={zipHeaderCol} setHeaderCol={setZipHeaderCol}
                    dataStartCol={zipDataStartCol} setDataStartCol={setZipDataStartCol}
                    extractRange={zipExtractRange} setExtractRange={setZipExtractRange}
                    tagRule={zipTagRule} setTagRule={setZipTagRule}
                    tagNames={zipTagNames} setTagNames={setZipTagNames}
                  />
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
                    {!keepDirStructure && (
                      <div className="flex items-start gap-2 mt-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">选择「否」将会把压缩包内所有文件夹中的数据扁平化放到数据集版本根目录中，文件夹层级结构将不会保留。</p>
                      </div>
                    )}
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
                <Field label="解压密码（可选）">
                  <Input type="password" value={zipPassword} onChange={e => setZipPassword(e.target.value)} placeholder="未加密则留空" className="max-w-xs" />
                </Field>
              </div>
            )}
          </Section>

          {/* File upload area */}
          <Section
            title="文件上传"
            action={
              isLargeModelText && dataset.type ? (
                <button
                  type="button"
                  onClick={() => downloadJsonlSample(dataset.type)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  title={`下载 ${dataset.type} 类型的 JSONL 示例文件`}
                >
                  <Download className="w-3.5 h-3.5" />
                  下载 {dataset.type} JSONL 示例文件
                </button>
              ) : undefined
            }
          >
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
        <Section title="平台数据集导入配置">
          <div className="grid grid-cols-3 gap-4">
            <Field label="数据集来源" required>
              <select value={sourceType} onChange={e => { setSourceType(e.target.value); setSourceDatasetId(""); setSourceVersion(""); }}
                className="w-full h-9 px-3 text-sm border rounded-md bg-card">
                {["我的数据集", "我订阅的数据集", "分享给我的数据集"].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="选择数据集" required>
              <div className="relative">
                <button type="button" onClick={() => setDsDropdownOpen(!dsDropdownOpen)}
                  className="w-full h-9 px-3 text-sm border rounded-md bg-card text-left flex items-center justify-between gap-1 hover:border-primary/50 transition-colors">
                  <span className={selectedPlatformDs ? "text-foreground" : "text-muted-foreground"}>
                    {selectedPlatformDs ? selectedPlatformDs.name : "选择数据集"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
                {dsDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-popover border rounded-lg shadow-lg">
                    <div className="p-2 border-b">
                      <Input value={dsSearch} onChange={e => setDsSearch(e.target.value)} placeholder="搜索数据集..."
                        className="h-8 text-sm" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredPlatformDs.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">无匹配数据集</p>}
                      {filteredPlatformDs.map(d => (
                        <button key={d.id} onClick={() => { setSourceDatasetId(d.id); setSourceVersion(""); setDsDropdownOpen(false); setDsSearch(""); }}
                          className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between",
                            sourceDatasetId === d.id && "bg-primary/5 text-primary")}>
                          <div>
                            <p className="font-medium">{d.name}</p>
                            <p className="text-[11px] text-muted-foreground">{d.id} · {d.versions.length}个版本</p>
                          </div>
                          {sourceDatasetId === d.id && <span className="text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Field>
            <Field label="选择版本" required>
              <select value={sourceVersion} onChange={e => setSourceVersion(e.target.value)}
                className="w-full h-9 px-3 text-sm border rounded-md bg-card" disabled={!selectedPlatformDs}>
                <option value="">选择版本</option>
                {selectedPlatformDs?.versions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {!selectedPlatformDs && <p className="text-xs text-muted-foreground mt-1">请先选择数据集</p>}
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
        <Section title="FTP 导入配置">
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

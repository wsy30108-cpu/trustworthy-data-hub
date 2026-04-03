import { useState, useCallback } from "react";
import {
  ArrowLeft, Trash2, ChevronUp, ChevronDown, Settings2, Eye, Save,
  FileText, X, Upload, AlertTriangle, Plus, MoreHorizontal,
  Type, ImageIcon, Music, Film, MessageSquare, Globe, List, AlignLeft,
  Table2, Clock, CheckCircle2, Hash, Star, ArrowUpDown,
  GitCompare, TreePine, PenTool, Calendar, Crosshair,
  Brush, Layers, MousePointer, Layout, Settings
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
type ObjectType = "标注对象容器" | "文本" | "图像" | "音频" | "视频" | "对话" | "超文本" | "列表" | "段落" | "PDF" | "表格" | "时间序列";
type MethodType = "单选" | "多选" | "输入框" | "画笔" | "排序" | "比较" | "评分" | "视频追踪" | "时间序列" | "超文本" | "树形选择" | "钢笔锚点" | "时间选择" | "数字选择";

interface ObjectCard {
  id: string; type: ObjectType; title: string; hint: string; config: Record<string, any>;
}
interface MethodOption { value: string; alias: string; shortcut: string; }
interface MethodCard {
  id: string; type: MethodType; title: string; required: boolean; hint: string; linkedObject: string; config: Record<string, any>; options: MethodOption[];
}
type PanelTarget = { kind: "object"; id: string } | { kind: "method"; id: string } | { kind: "layout" } | null;

const objectTypes: { type: ObjectType; icon: any }[] = [
  { type: "标注对象容器", icon: Layers },
  { type: "文本", icon: Type },
  { type: "图像", icon: ImageIcon },
  { type: "音频", icon: Music },
  { type: "视频", icon: Film },
  { type: "对话", icon: MessageSquare },
  { type: "超文本", icon: Globe },
  { type: "列表", icon: List },
  { type: "段落", icon: AlignLeft },
  { type: "PDF", icon: FileText },
  { type: "表格", icon: Table2 },
  { type: "时间序列", icon: Clock },
];

const methodTypes: { type: MethodType; icon: any }[] = [
  { type: "单选", icon: CheckCircle2 },
  { type: "多选", icon: List },
  { type: "输入框", icon: Type },
  { type: "画笔", icon: Brush },
  { type: "排序", icon: ArrowUpDown },
  { type: "比较", icon: GitCompare },
  { type: "评分", icon: Star },
  { type: "视频追踪", icon: Crosshair },
  { type: "时间序列", icon: Clock },
  { type: "超文本", icon: Globe },
  { type: "树形选择", icon: TreePine },
  { type: "钢笔锚点", icon: PenTool },
  { type: "时间选择", icon: Calendar },
  { type: "数字选择", icon: Hash },
];

const defaultObjectConfig = (type: ObjectType): Record<string, any> => {
  switch (type) {
    case "文本": case "超文本": return { allowTextSelect: true, selectGranularity: "word" };
    case "图像": return { allowZoom: true, showZoomControl: true, showRotateControl: true, showContrastControl: true };
    case "音频": return { showMultiChannel: false, disableWaveform: false };
    case "视频": return { frameRate: 24, mutePlayback: false };
    case "列表": return { idField: "id", titleField: "title", bodyField: "body" };
    case "段落": case "对话": return { nameKey: "nameKey", textKey: "textKey", showAudioPlayer: false, useDialogLayout: false };
    case "表格": case "时间序列": return { timeColumn: "", timeFormat: "%Y-%m-%d %H:%M:%S", multiChannel: false, channelCount: 1 };
    default: return {};
  }
};

const defaultMethodConfig = (type: MethodType): Record<string, any> => {
  switch (type) {
    case "单选": return { shortcutMode: "auto", enableAlias: false, defaultValue: "", enableSearch: false, allowRelation: true };
    case "多选": return { shortcutMode: "auto", enableAlias: false, defaultValue: "", enableSearch: false, optionLayout: "horizontal", allowRelation: true };
    case "输入框": return { defaultValue: "", placeholder: "" };
    case "画笔": return { brushTypes: ["矩形框"], noLabelAnnotation: false, labelType: "single", shortcutMode: "auto", allowRelation: true };
    case "排序": return { sortType: "list", defaultBucket: "" };
    case "比较": return { compareFields: ["字段A", "字段B"] };
    case "评分": return { maxScore: 5, defaultScore: 0, shortcutMode: "auto" };
    case "树形选择": return { shortcutMode: "auto", enableAlias: false, defaultValue: "", expandAll: false, flatten: false, leafOnly: false, enableSearch: false, optionType: "single", allowRelation: true };
    case "钢笔锚点": return { pointSize: "medium", pointStyle: "circle", enableSnap: false, enableBezier: false, enableSkeleton: false, minPoints: -1, maxPoints: -1 };
    case "时间选择": return { dateType: "date", dateFormat: "%Y-%m-%d", minTime: "", maxTime: "" };
    case "数字选择": return { min: 0, max: 100, step: 1, shortcutMode: "auto" };
    case "视频追踪": return {};
    default: return {};
  }
};

const mockTestDataPresets: Record<string, string> = {
  "文本": JSON.stringify({ text: "央行今日公布最新货币政策，维持基准利率不变。专家预测未来季度经济增长将保持平稳。" }, null, 2),
  "图像": JSON.stringify({ image: "https://picsum.photos/400/300" }, null, 2),
  "音频": JSON.stringify({ audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, null, 2),
  "视频": JSON.stringify({ video: "https://media.w3.org/2010/05/sintel/trailer.mp4" }, null, 2),
  "对话": JSON.stringify({ messages: [{ role: "user", content: "你好，请问今天天气怎么样？" }, { role: "assistant", content: "今天北京天气晴朗，气温 15-25 摄氏度。" }] }, null, 2),
  "超文本": JSON.stringify({ html: "<div><h1 style='color:blue'>欢迎使用</h1><p>这是一个<b>超文本</b>预览示例。</p></div>" }, null, 2),
  "列表": JSON.stringify({ items: ["选项 A: 基础配置", "选项 B: 高级选项", "选项 C: 实验性功能"] }, null, 2),
  "表格": JSON.stringify({ columns: ["姓名", "年龄", "城市"], rows: [["张三", 28, "北京"], ["李四", 32, "上海"]] }, null, 2),
};

// ─── Toggle Switch helper ────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

const AnnotationToolEditor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get("id");

  const [objects, setObjects] = useState<ObjectCard[]>([]);
  const [methods, setMethods] = useState<MethodCard[]>([]);
  const [panelTarget, setPanelTarget] = useState<PanelTarget>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedObjTypes, setSelectedObjTypes] = useState<ObjectType[]>([]);
  const [selectedMethodTypes, setSelectedMethodTypes] = useState<MethodType[]>([]);

  // Layout settings
  const [layoutSettings, setLayoutSettings] = useState({
    type: "flex" as "flex" | "grid",
    flexDir: "column" as "row" | "column",
    flexPreset: "vbox" as "average" | "hbox" | "vbox",
    gap: 16,
    gridCols: 2,
  });

  // Modals
  const [showTestData, setShowTestData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTemplateImport, setShowTemplateImport] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [testData, setTestData] = useState("{}");
  const [testDataPreset, setTestDataPreset] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolType, setToolType] = useState("文本类");
  const [toolDesc, setToolDesc] = useState("");

  const handleInitialize = useCallback(() => {
    if (selectedObjTypes.length === 0 && selectedMethodTypes.length === 0) {
      toast.error("请至少选择一个标注对象或标注方法");
      return;
    }
    const newObjs = selectedObjTypes.map(type => ({
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, title: type, hint: "", config: defaultObjectConfig(type),
    }));
    const newMtds = selectedMethodTypes.map(type => ({
      id: `mtd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, title: type, required: false, hint: "", linkedObject: "", config: defaultMethodConfig(type), options: [],
    }));
    setObjects(newObjs);
    setMethods(newMtds);
    setIsConfirmed(true);
    toast.success("初始化完成");
  }, [selectedObjTypes, selectedMethodTypes]);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    if (panelTarget?.kind === "object" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  const removeMethod = useCallback((id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    if (panelTarget?.kind === "method" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  const updateObject = useCallback((id: string, patch: Partial<ObjectCard>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);
  const updateMethod = useCallback((id: string, patch: Partial<MethodCard>) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);
  const updateObjectConfig = useCallback((id: string, key: string, value: any) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, config: { ...o.config, [key]: value } } : o));
  }, []);
  const updateMethodConfig = useCallback((id: string, key: string, value: any) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, config: { ...m.config, [key]: value } } : m));
  }, []);

  const handleSave = () => {
    if (!toolName.trim()) { toast.error("请填写工具名称"); return; }
    toast.success(`标注工具「${toolName}」已保存`);
    setShowSaveModal(false);
    navigate("/data-annotation/tools");
  };

  const selectedObject = panelTarget?.kind === "object" ? objects.find(o => o.id === panelTarget.id) : null;
  const selectedMethod = panelTarget?.kind === "method" ? methods.find(m => m.id === panelTarget.id) : null;

  // ─── Render functions ──────────────────────────────────────
  const renderMethodCardContent = (mtd: MethodCard) => {
    switch (mtd.type) {
      case "单选": return <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-full border" />)}</div>;
      case "多选": return <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="w-4 h-4 border" />)}</div>;
      case "输入框": return <div className="h-4 border-b w-full opacity-50" />;
      case "评分": return <div className="flex gap-1 text-primary/40"><Star className="w-3 h-3" /><Star className="w-3 h-3" /><Star className="w-3 h-3" /></div>;
      default: return <div className="h-1 bg-muted w-1/2 rounded" />;
    }
  };

  const renderLayoutConfigPanel = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b">
        <Layout className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">布局管理</h4>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">布局模式</label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {["flex", "grid"].map(t => (
            <button key={t} onClick={() => setLayoutSettings(s => ({ ...s, type: t as any }))}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${layoutSettings.type === t ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>
              {t === "flex" ? "弹性布局" : "栅格布局"}
            </button>
          ))}
        </div>
      </div>
      {layoutSettings.type === "flex" ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-muted-foreground">布局展示</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { id: "average", label: "平均分布", icon: (
                  <div className={`relative w-12 h-12 border-2 rounded-xl p-2 flex flex-wrap gap-1 bg-white shadow-sm transition-all overflow-hidden ${layoutSettings.flexPreset === "average" ? "border-blue-500" : "border-slate-200"}`}>
                    <div className={`w-[calc(50%-2px)] h-[calc(50%-2px)] rounded-[2px] transition-colors ${layoutSettings.flexPreset === "average" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`w-[calc(50%-2px)] h-[calc(50%-2px)] rounded-[2px] transition-colors ${layoutSettings.flexPreset === "average" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`w-[calc(50%-2px)] h-[calc(50%-2px)] rounded-[2px] transition-colors ${layoutSettings.flexPreset === "average" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`w-[calc(50%-2px)] h-[calc(50%-2px)] rounded-[2px] transition-colors ${layoutSettings.flexPreset === "average" ? "bg-blue-400" : "bg-slate-200"}`} />
                    {layoutSettings.flexPreset === "average" && (
                      <div className="absolute top-0 right-0 bg-blue-500 rounded-bl-lg p-0.5 shadow-md">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </div>
                )},
                { id: "hbox", label: "横向平铺", icon: (
                  <div className={`relative w-12 h-12 border-2 rounded-xl p-2 flex gap-1.5 bg-white shadow-sm transition-all overflow-hidden ${layoutSettings.flexPreset === "hbox" ? "border-blue-500" : "border-slate-200"}`}>
                    <div className={`w-2 h-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "hbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`w-2 h-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "hbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`w-2 h-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "hbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    {layoutSettings.flexPreset === "hbox" && (
                      <div className="absolute top-0 right-0 bg-blue-500 rounded-bl-lg p-0.5 shadow-md">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </div>
                )},
                { id: "vbox", label: "纵向平铺", icon: (
                  <div className={`relative w-12 h-12 border-2 rounded-xl p-2 flex flex-col gap-1.5 bg-white shadow-sm transition-all overflow-hidden ${layoutSettings.flexPreset === "vbox" ? "border-blue-500" : "border-slate-200"}`}>
                    <div className={`h-2 w-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "vbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`h-2 w-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "vbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    <div className={`h-2 w-full rounded-[2px] flex-1 transition-colors ${layoutSettings.flexPreset === "vbox" ? "bg-blue-400" : "bg-slate-200"}`} />
                    {layoutSettings.flexPreset === "vbox" && (
                      <div className="absolute top-0 right-0 bg-blue-500 rounded-bl-lg p-0.5 shadow-md">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </div>
                )}
              ].map(p => (
                <button key={p.id} onClick={() => setLayoutSettings(s => ({ ...s, flexPreset: p.id as any, flexDir: p.id === "vbox" ? "column" : "row" }))}
                  className={`flex flex-col items-center gap-2 transition-all group/btn`}>
                  <div className={`transition-all duration-300 rounded-2xl ${layoutSettings.flexPreset === p.id ? "scale-105" : "group-hover/btn:scale-105 opacity-70 group-hover/btn:opacity-100"}`}>
                    {p.icon}
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${layoutSettings.flexPreset === p.id ? "text-blue-600" : "text-muted-foreground"}`}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">栅格列数</label>
            <input type="range" min="1" max="4" step="1" value={layoutSettings.gridCols} onChange={e => setLayoutSettings(s => ({ ...s, gridCols: parseInt(e.target.value) }))} className="w-full mt-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>1列</span><span>2列</span><span>3列</span><span>4列</span></div>
          </div>
        </div>
      )}
      <div>
        <label className="text-xs text-muted-foreground">元素间距 (Gap: {layoutSettings.gap}px)</label>
        <input type="number" value={layoutSettings.gap} onChange={e => setLayoutSettings(s => ({ ...s, gap: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1" />
      </div>
    </div>
  );

  const renderObjectPanel = (obj: ObjectCard) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-primary" /> 标注对象属性 - {obj.type}
      </h4>
      <div>
        <label className="text-xs text-muted-foreground">标题 *</label>
        <input value={obj.title} onChange={e => updateObject(obj.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 focus:ring-1 focus:ring-primary outline-none" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">内容提示</label>
        <textarea value={obj.hint} onChange={e => updateObject(obj.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="填写标注提示信息..." />
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-bold mb-3 flex items-center gap-1.5 text-slate-700">扩展参数</p>
        {(obj.type === "文本" || obj.type === "超文本") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">允许文字选择</span>
              <Toggle value={obj.config.allowTextSelect} onChange={v => updateObjectConfig(obj.id, "allowTextSelect", v)} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">文本选择粒度</span>
              <select value={obj.config.selectGranularity} onChange={e => updateObjectConfig(obj.id, "selectGranularity", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option value="word">按词选择文本</option>
                <option value="char">按字符选择文本</option>
                <option value="paragraph">按段落选择文本</option>
              </select>
            </div>
          </div>
        )}
        {obj.type === "图像" && (
          <div className="space-y-3">
            {[
              { key: "allowZoom", label: "允许图像缩放" },
              { key: "showZoomControl", label: "显示缩放控制" },
              { key: "showRotateControl", label: "显示旋转控制" },
              { key: "showContrastControl", label: "显示对比度控制" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <Toggle value={obj.config[item.key]} onChange={v => updateObjectConfig(obj.id, item.key, v)} />
              </div>
            ))}
          </div>
        )}
        {obj.type === "音频" && (
          <div className="space-y-3">
            {[
              { key: "showMultiChannel", label: "显示多个音频通道" },
              { key: "disableWaveform", label: "禁用波形可视化" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <Toggle value={obj.config[item.key]} onChange={v => updateObjectConfig(obj.id, item.key, v)} />
              </div>
            ))}
          </div>
        )}
        {obj.type === "视频" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">视频帧率</span>
              <input type="number" value={obj.config.frameRate} onChange={e => updateObjectConfig(obj.id, "frameRate", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">静音播放</span>
              <Toggle value={obj.config.mutePlayback} onChange={v => updateObjectConfig(obj.id, "mutePlayback", v)} />
            </div>
          </div>
        )}
        {obj.type === "列表" && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground mb-1">字段映射 (ID/Title/Body)</p>
            {["idField", "titleField", "bodyField"].map(key => (
              <div key={key}>
                <span className="text-[10px] text-muted-foreground">{key}</span>
                <input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5 outline-none" />
              </div>
            ))}
          </div>
        )}
        {(obj.type === "段落" || obj.type === "对话") && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">字段映射 (Name/Text)</p>
            {["nameKey", "textKey"].map(key => (
              <div key={key}>
                <span className="text-[10px] text-muted-foreground">{key}</span>
                <input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5 outline-none" />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-xs">显示音频播放器</span>
              <Toggle value={obj.config.showAudioPlayer} onChange={v => updateObjectConfig(obj.id, "showAudioPlayer", v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">使用对话式布局</span>
              <Toggle value={obj.config.useDialogLayout} onChange={v => updateObjectConfig(obj.id, "useDialogLayout", v)} />
            </div>
          </div>
        )}
        {obj.type === "时间序列" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">时间列字段名</span>
              <input value={obj.config.timeColumn || ""} onChange={e => updateObjectConfig(obj.id, "timeColumn", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">时间解析格式</span>
              <select value={obj.config.timeFormat} onChange={e => updateObjectConfig(obj.id, "timeFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option>%m/%d/%Y %H:%M:%S</option>
                <option>%Y-%m-%d %H:%M:%S.%f</option>
                <option>%Y%m%d%H%M%S</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">多通道</span>
              <Toggle value={obj.config.multiChannel} onChange={v => updateObjectConfig(obj.id, "multiChannel", v)} />
            </div>
            {obj.config.multiChannel && (
              <div>
                <span className="text-xs text-muted-foreground">通道数量</span>
                <input type="number" value={obj.config.channelCount || 1} onChange={e => updateObjectConfig(obj.id, "channelCount", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderMethodPanel = (mtd: MethodCard) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <h4 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 标注方法属性 - {mtd.type}</h4>

      <div>
        <label className="text-xs text-muted-foreground">标题 *</label>
        <input value={mtd.title} onChange={e => updateMethod(mtd.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 focus:ring-1 focus:ring-primary outline-none" />
      </div>
      <div className="flex items-center justify-between"><span className="text-xs">是否必填</span><Toggle value={mtd.required} onChange={v => updateMethod(mtd.id, { required: v })} /></div>
      <div>
        <label className="text-xs text-muted-foreground">内容提示</label>
        <textarea value={mtd.hint} onChange={e => updateMethod(mtd.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 resize-none focus:ring-1 focus:ring-primary outline-none" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">关联标注对象 *</label>
        <select value={mtd.linkedObject} onChange={e => updateMethod(mtd.id, { linkedObject: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
          <option value="">不关联/全局</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-bold mb-3 flex items-center gap-1.5 text-slate-700">配置参数</p>

        {(mtd.type === "单选" || mtd.type === "多选") && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">选项列表</span>
                <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `选项${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加选项</button>
              </div>
              <div className="space-y-2">
                {mtd.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5 group/opt">
                    <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background outline-none focus:border-primary" placeholder="值" />
                    {mtd.config.enableAlias && <input value={opt.alias} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], alias: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="w-16 px-2 py-1 text-xs border rounded bg-background outline-none" placeholder="别名" />}
                    <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">快捷键模式</span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option value="off">关闭快捷键</option>
                <option value="auto">系统自动分配</option>
                <option value="custom">用户自定义</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">开启选项别名</span>
              <Toggle value={mtd.config.enableAlias} onChange={v => updateMethodConfig(mtd.id, "enableAlias", v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">允许关联关系</span>
              <Toggle value={mtd.config.allowRelation} onChange={v => updateMethodConfig(mtd.id, "allowRelation", v)} />
            </div>
            {mtd.type === "多选" && (
              <div>
                <span className="text-xs text-muted-foreground">选项布局</span>
                <select value={mtd.config.optionLayout} onChange={e => updateMethodConfig(mtd.id, "optionLayout", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                  <option value="horizontal">横向平铺</option>
                  <option value="vertical">纵向叠放</option>
                  <option value="grid">网格布局</option>
                </select>
              </div>
            )}
          </div>
        )}

        {mtd.type === "输入框" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">默认值</span>
              <input value={mtd.config.defaultValue || ""} onChange={e => updateMethodConfig(mtd.id, "defaultValue", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">输入提示</span>
              <input value={mtd.config.placeholder || ""} onChange={e => updateMethodConfig(mtd.id, "placeholder", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" placeholder="请输入..." />
            </div>
          </div>
        )}

        {mtd.type === "画笔" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">工具集合</label>
              <div className="flex flex-wrap gap-2">
                {["笔刷", "椭圆", "多边形", "矩形框", "魔棒", "关键点"].map(tool => {
                  const active = (mtd.config.brushTypes || []).includes(tool);
                  return (
                    <button key={tool} onClick={() => {
                      const cur = mtd.config.brushTypes || [];
                      updateMethodConfig(mtd.id, "brushTypes", active ? cur.filter((x: string) => x !== tool) : [...cur, tool]);
                    }} className={`px-2 py-1 text-[10px] rounded border transition-colors ${active ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{tool}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">允许无标签标注</span>
              <Toggle value={mtd.config.noLabelAnnotation} onChange={v => updateMethodConfig(mtd.id, "noLabelAnnotation", v)} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">标签模式</span>
              <select value={mtd.config.labelType} onChange={e => updateMethodConfig(mtd.id, "labelType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option value="single">单标签</option>
                <option value="multi">多标签</option>
              </select>
            </div>
          </div>
        )}

        {mtd.type === "评分" && (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground">最大分值</span>
              <input type="number" value={mtd.config.maxScore} onChange={e => updateMethodConfig(mtd.id, "maxScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">默认评分</span>
              <input type="number" value={mtd.config.defaultScore} onChange={e => updateMethodConfig(mtd.id, "defaultScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
          </div>
        )}

        {mtd.type === "比较" && (
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-xs font-medium">比较项配置</span>
                <button onClick={() => updateMethodConfig(mtd.id, "compareFields", [...(mtd.config.compareFields || []), `字段${(mtd.config.compareFields || []).length + 1}`])} className="text-[10px] text-primary hover:underline">+ 添加字段</button>
             </div>
             <div className="space-y-2">
                {(mtd.config.compareFields || []).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input value={f} onChange={e => { const fields = [...mtd.config.compareFields]; fields[i] = e.target.value; updateMethodConfig(mtd.id, "compareFields", fields); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background outline-none focus:border-primary" />
                    <button onClick={() => updateMethodConfig(mtd.id, "compareFields", mtd.config.compareFields.filter((_:any, j:number) => j !== i))} className="p-1 text-slate-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {mtd.type === "树形选择" && (
          <div className="space-y-3">
            {[
              { key: "expandAll", label: "默认展开全部" },
              { key: "flatten", label: "是否平铺显示" },
              { key: "leafOnly", label: "仅允许选中叶子节点" },
              { key: "enableSearch", label: "开启标签搜索" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <Toggle value={mtd.config[item.key]} onChange={v => updateMethodConfig(mtd.id, item.key, v)} />
              </div>
            ))}
          </div>
        )}

        {mtd.type === "钢笔锚点" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">锚点大小</span>
              <select value={mtd.config.pointSize} onChange={e => updateMethodConfig(mtd.id, "pointSize", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">启用吸附功能</span>
              <Toggle value={mtd.config.enableSnap} onChange={v => updateMethodConfig(mtd.id, "enableSnap", v)} />
            </div>
          </div>
        )}

        {mtd.type === "时间选择" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">日期类型</span>
              <select value={mtd.config.dateType} onChange={e => updateMethodConfig(mtd.id, "dateType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none">
                <option value="date">日期 (Y/M/D)</option>
                <option value="datetime">日期时间</option>
                <option value="year">年份</option>
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">格式化 (strftime)</span>
              <input value={mtd.config.dateFormat} onChange={e => updateMethodConfig(mtd.id, "dateFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" placeholder="%Y-%m-%d" />
            </div>
          </div>
        )}

        {mtd.type === "数字选择" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">最小值</span>
              <input type="number" value={mtd.config.min} onChange={e => updateMethodConfig(mtd.id, "min", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">最大值</span>
              <input type="number" value={mtd.config.max} onChange={e => updateMethodConfig(mtd.id, "max", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1 outline-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMethodSidebar = () => (
    <div className="w-72 border-l bg-card shrink-0 flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 标注方法</h3>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{methods.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {methods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs text-muted-foreground/60">暂无标注方法</p>
          </div>
        ) : (
          methods.map((mtd, idx) => (
            <div key={mtd.id} 
              onClick={() => setPanelTarget({ kind: "method", id: mtd.id })}
              className={`group relative border-2 rounded-xl p-3 cursor-pointer transition-all ${panelTarget?.kind === "method" && panelTarget.id === mtd.id ? "border-blue-600 bg-white shadow-md" : "border-slate-100 bg-white hover:border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  {(() => {
                    const mt = methodTypes.find(t => t.type === mtd.type);
                    const Icon = mt?.icon || CheckCircle2;
                    return <Icon className="w-5 h-5 text-slate-600" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{mtd.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{mtd.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeMethod(mtd.id); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors pl-2 border-l ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    {mtd.options.length > 0 ? (
                      <div className="space-y-1.5 pointer-events-none opacity-80">
                        {mtd.options.slice(0, 3).map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <div className="w-3.5 h-3.5 rounded border border-slate-300" />
                            <span className="truncate">{opt.alias || opt.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold py-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>未配置选项</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t bg-muted/10">
        <div className="relative group/addm">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-dashed border-primary/40 text-primary rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> 添加标注方法
          </button>
          <div className="hidden group-hover/addm:block absolute bottom-full left-0 right-0 mb-1 z-50 bg-card border rounded-lg shadow-xl p-1.5 max-h-64 overflow-y-auto">
             {methodTypes.map(mt => (
               <button key={mt.type} onClick={() => {
                 const newM = { id: `mtd-${Date.now()}`, type: mt.type, title: mt.type, required: false, hint: "", linkedObject: "", config: defaultMethodConfig(mt.type), options: [] };
                 setMethods(prev => [...prev, newM]);
                 toast.success(`已添加：${mt.type}`);
               }} className="w-full flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-primary/5 rounded group/item">
                 <mt.icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-primary" />
                 <span>{mt.type}</span>
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isConfirmed) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8 py-12">
          <div className="text-center">
            <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
              <Layout className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">配置您的标注工具</h1>
            <p className="text-muted-foreground">请在下列选项中选择初始的标注对象与方法</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> 初始标注对象</h3>
              <div className="grid grid-cols-3 gap-3">
                {objectTypes.map(ot => {
                  const selected = selectedObjTypes.includes(ot.type);
                  return (
                    <button key={ot.type} onClick={() => setSelectedObjTypes(p => selected ? p.filter(t => t !== ot.type) : [...p, ot.type])}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50"}`}>
                      <ot.icon className={`w-6 h-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-bold">{ot.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 初始标注方法</h3>
              <div className="grid grid-cols-3 gap-3">
                {methodTypes.map(mt => {
                  const selected = selectedMethodTypes.includes(mt.type);
                  return (
                    <button key={mt.type} onClick={() => setSelectedMethodTypes(p => selected ? p.filter(t => t !== mt.type) : [...p, mt.type])}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50"}`}>
                      <mt.icon className={`w-6 h-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-bold">{mt.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-10">
            <button onClick={handleInitialize} className="w-full max-w-sm py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg">
              开启设计
            </button>
            <button onClick={() => navigate("/data-annotation/tools")} className="text-sm text-muted-foreground hover:text-foreground">放弃并退出</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <header className="h-16 shrink-0 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/data-annotation/tools")} className="p-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-base font-bold">{toolId ? toolName || "编辑标注工具" : "设计新工具"}</h1><p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Editor Workspace</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplateImport(true)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">引用模板</button>
          <button onClick={() => toast.info("存为模板功能开发中")} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">存为模板</button>
          <button onClick={() => setShowTestData(true)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">管理测试集</button>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">效果预览</button>
          <button onClick={() => setShowSaveModal(true)} className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">保存并返回</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Middle (Layout Container) */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> 布局容器</h3>
            <button onClick={() => setPanelTarget({ kind: "layout" })} className={`p-2 rounded-lg border transition-all ${panelTarget?.kind === "layout" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 relative group/canvas">
            <div className="bg-background rounded-3xl shadow-2xl min-h-full p-8 transition-all duration-500">
              {objects.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 py-32">
                  <Plus className="w-16 h-16 mb-4" />
                  <p>点击右下角添加对象开始布局</p>
                </div>
              ) : (
                <div className={layoutSettings.type === "grid" ? "grid" : `flex ${layoutSettings.flexPreset === "average" ? "flex-wrap" : ""}`} 
                     style={layoutSettings.type === "grid" ? { gridTemplateColumns: `repeat(${layoutSettings.gridCols}, minmax(0, 1fr))`, gap: `${layoutSettings.gap}px` } : { flexDirection: layoutSettings.flexDir, gap: `${layoutSettings.gap}px` }}>
                  {objects.map(obj => {
                    let previewVal: any = null;
                    try {
                      const customData = JSON.parse(testData);
                      const hasCustom = Object.keys(customData).length > 0;
                      const preset = JSON.parse(mockTestDataPresets[obj.type] || "{}");
                      const data = hasCustom ? customData : preset;
                      if (obj.type === "图像") previewVal = data.image || data.url || Object.values(data).find(v => typeof v === 'string' && v.startsWith('http'));
                      else if (obj.type === "音频") previewVal = data.audio || data.url;
                      else if (obj.type === "视频") previewVal = data.video || data.url;
                      else if (obj.type === "对话") previewVal = data.messages || data.chat;
                      else if (obj.type === "表格") previewVal = data.rows || data;
                      else previewVal = data.text || data.content || Object.values(data).find(v => typeof v === 'string');
                    } catch { /* skip */ }

                    return (
                      <div key={obj.id} 
                        onClick={() => setPanelTarget({ kind: "object", id: obj.id })}
                        className={`border-2 rounded-2xl p-4 bg-card transition-all group/card relative cursor-pointer ${panelTarget?.kind === "object" && panelTarget.id === obj.id ? "border-primary shadow-lg" : "hover:border-primary/50"}`}
                        style={layoutSettings.type === "flex" && layoutSettings.flexPreset === "average" ? { flex: `0 0 calc(50% - ${layoutSettings.gap / 2}px)` } : (layoutSettings.flexPreset === "hbox" ? { flex: "0 0 300px" } : {})}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{obj.type}</span>
                             <span className="text-xs font-bold truncate max-w-[120px]">{obj.title}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/card:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="min-h-[100px] border border-dashed rounded-xl flex items-center justify-center p-4 bg-muted/5 overflow-hidden">
                           {previewVal ? (
                             <div className="w-full">
                               {obj.type === "图像" && <img src={previewVal} className="max-h-48 rounded mx-auto" />}
                               {obj.type === "文本" && <p className="text-sm leading-relaxed">{String(previewVal)}</p>}
                               {obj.type === "对话" && Array.isArray(previewVal) && (
                                 <div className="space-y-2">{previewVal.slice(0,2).map((m:any, i:number) => <div key={i} className="text-xs p-2 rounded bg-muted/30"><b>{m.role}:</b> {m.content}</div>)}</div>
                               )}
                               {!["图像", "文本", "对话"].includes(obj.type) && <pre className="text-[10px] opacity-60 overflow-hidden">{JSON.stringify(previewVal, null, 2)}</pre>}
                             </div>
                           ) : <span className="text-xs text-muted-foreground">暂无预览数据</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Floating Add Object Button */}
          <div className="absolute right-10 bottom-10 z-30 group/addobj min-w-[120px]">
            <div className="hidden group-hover/addobj:block absolute bottom-full left-0 right-0 mb-1 z-50 bg-card border rounded-lg shadow-xl p-1.5 max-h-64 overflow-y-auto whitespace-nowrap">
               {objectTypes.map(ot => (
                 <button key={ot.type} onClick={() => {
                   const newO = { id: `obj-${Date.now()}`, type: ot.type, title: ot.type, hint: "", config: defaultObjectConfig(ot.type) };
                   setObjects(p => [...p, newO]);
                   toast.success(`已添加：${ot.type}`);
                 }} className="w-full flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-primary/5 rounded group/item">
                   <ot.icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-primary" />
                   <span>{ot.type}</span>
                 </button>
               ))}
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-dashed border-primary/40 text-primary bg-background rounded-lg hover:bg-primary/5 transition-colors shadow-lg">
              <Plus className="w-3.5 h-3.5" /> 添加标注对象
            </button>
          </div>
        </div>

        {/* Column 2: Right 2 (Method Sidebar) - Swap to Right 2 position (middle-right) */}
        {renderMethodSidebar()}

        {/* Column 3: Right 1 (Config Panel) - Swap to Right 1 position (far-right) */}
        <div className="w-72 shrink-0 border-l bg-card overflow-y-auto p-4">
          {!panelTarget && (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 text-center">
               <Settings2 className="w-10 h-10 mb-2" />
               <p className="text-xs">选择对象、方法或<br/>点击设置图标进行配置</p>
             </div>
          )}
          {panelTarget?.kind === "layout" && renderLayoutConfigPanel()}
          {selectedObject && renderObjectPanel(selectedObject)}
          {selectedMethod && renderMethodPanel(selectedMethod)}
        </div>
      </div>

      {showTestData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">测试集管理</h3>
              <button onClick={() => setShowTestData(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">加载预置样例:</span>
              {Object.keys(mockTestDataPresets).map(key => (
                <button key={key} onClick={() => { setTestData(mockTestDataPresets[key]); setTestDataPreset(key); }}
                  className={`px-2 py-1 text-[10px] rounded border ${testDataPreset === key ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{key}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-2">输入 JSON 格式的 mock 数据，或导入已有数据集的第一条数据</p>
            <textarea value={testData} onChange={e => setTestData(e.target.value)} rows={12} className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-background resize-none" placeholder='{"text": "示例文本内容..."}' />
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast.info("从数据集导入第一条数据")} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> 从数据集导入</button>
              <button onClick={() => { try { JSON.parse(testData); toast.success("JSON 格式校验通过"); } catch { toast.error("JSON 格式错误"); } }} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">校验 JSON</button>
              <div className="flex-1" />
              <button onClick={() => setShowTestData(false)} className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确定</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-6">
          <div className="bg-card border rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-2xl font-bold mb-6">保存工具设计</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold mb-1.5 block">工具名称 *</label><input value={toolName} onChange={e => setToolName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 ring-primary/10 outline-none" placeholder="输入工具名称..." /></div>
              <div><label className="text-xs font-bold mb-1.5 block">工具描述</label><textarea value={toolDesc} onChange={e => setToolDesc(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 ring-primary/10 outline-none resize-none" placeholder="简要描述工具用途..." /></div>
            </div>
            <div className="flex gap-4 mt-10">
               <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 rounded-xl border font-bold hover:bg-muted">取消</button>
               <button onClick={handleSave} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl">保存设计</button>
            </div>
          </div>
        </div>
      )}
      
      {showPreview && (
        <div className="fixed inset-0 z-[130] bg-background flex flex-col animation-in fade-in zoom-in-95 duration-300">
           <div className="h-16 border-b flex items-center justify-between px-6 bg-card">
              <h3 className="font-bold flex items-center gap-2 text-lg"><Eye className="w-5 h-5 text-primary" /> 全屏效果预览</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-6 h-6" /></button>
           </div>
           <div className="flex-1 bg-[#f0f2f5] p-10 overflow-y-auto">
              <div className="max-w-5xl mx-auto bg-background rounded-[40px] shadow-2xl p-12 min-h-full">
                 <p className="text-center text-muted-foreground mb-12">此处显示的布局直接反映您在编辑器中的配置（Flex/Grid）</p>
                 <div className={layoutSettings.type === "grid" ? "grid" : `flex ${layoutSettings.flexPreset === "average" ? "flex-wrap" : ""}`} 
                     style={layoutSettings.type === "grid" ? { gridTemplateColumns: `repeat(${layoutSettings.gridCols}, minmax(0, 1fr))`, gap: `${layoutSettings.gap}px` } : { flexDirection: layoutSettings.flexDir, gap: `${layoutSettings.gap}px` }}>
                   {objects.map(obj => (
                     <div key={obj.id} 
                        className="border-2 rounded-3xl p-8 bg-card shadow-sm"
                        style={layoutSettings.type === "flex" && layoutSettings.flexPreset === "average" ? { flex: `0 0 calc(50% - ${layoutSettings.gap / 2}px)` } : (layoutSettings.flexPreset === "hbox" ? { flex: "0 0 400px" } : {})}>
                        <h4 className="font-bold mb-4">{obj.title}</h4>
                        <div className="min-h-[200px] border border-dashed rounded-2xl bg-muted/5 p-6 flex items-center justify-center">
                           <span className="text-muted-foreground text-sm">实体预览占位</span>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Template Import Modal */}
      {showTemplateImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">引用已有模板</h3>
              <button onClick={() => setShowTemplateImport(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">引用后将清空当前画布配置，使用模板的标注对象和方法配置。</p>
            <div className="space-y-2 mb-4">
              {["文本分类标注模板", "图像检测标注模板", "NER实体标注模板"].map(tpl => (
                <button key={tpl} onClick={() => {
                  setObjects([{ id: "obj-tpl-1", type: "文本", title: "文本内容", hint: "请阅读以下文本", config: defaultObjectConfig("文本") }]);
                  setMethods([{ id: "mtd-tpl-1", type: "单选", title: "情感分类", required: true, hint: "请选择情感倾向", linkedObject: "obj-tpl-1", config: defaultMethodConfig("单选"), options: [{ value: "正面", alias: "", shortcut: "1" }, { value: "负面", alias: "", shortcut: "2" }, { value: "中立", alias: "", shortcut: "3" }] }]);
                  setShowTemplateImport(false);
                  toast.success("已引用模板配置");
                }} className="w-full text-left px-3 py-2 text-sm rounded-lg border hover:bg-muted/30">{tpl}</button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowTemplateImport(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolEditor;

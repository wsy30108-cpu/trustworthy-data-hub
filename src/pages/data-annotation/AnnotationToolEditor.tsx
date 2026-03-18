import { useState, useCallback } from "react";
import {
  ArrowLeft, Trash2, ChevronUp, ChevronDown, Settings2, Eye, Save,
  FileText, X, Upload, AlertTriangle,
  Type, ImageIcon, Music, Film, MessageSquare, Globe, List, AlignLeft,
  Table2, Clock, CheckCircle2, Hash, Star, ArrowUpDown,
  GitCompare, TreePine, PenTool, Calendar, Crosshair,
  Brush, Layers, MousePointer
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
type ObjectType = "标注对象容器" | "文本" | "图像" | "音频" | "视频" | "对话" | "超文本" | "列表" | "段落" | "PDF" | "表格" | "时间序列";
type MethodType = "单选" | "多选" | "输入框" | "画笔" | "排序" | "比较" | "评分" | "视频追踪" | "时间序列" | "超文本" | "树形选择" | "钢笔锚点" | "时间选择" | "数字选择";

interface ObjectCard {
  id: string; type: ObjectType; title: string; testField: string; hint: string; config: Record<string, any>;
}
interface MethodOption { value: string; alias: string; shortcut: string; }
interface MethodCard {
  id: string; type: MethodType; title: string; required: boolean; hint: string; linkedObject: string; config: Record<string, any>; options: MethodOption[];
}
type PanelTarget = { kind: "object"; id: string } | { kind: "method"; id: string } | null;

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
    case "表格": return {};
    case "时间序列": return { timeColumn: "", timeFormat: "%Y-%m-%d %H:%M:%S", multiChannel: false, channelCount: 1 };
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
    default: return {};
  }
};

const mockTestDataPresets: Record<string, string> = {
  "文本": JSON.stringify({ text: "央行今日公布最新货币政策，维持基准利率不变。" }, null, 2),
  "图像": JSON.stringify({ image: "https://picsum.photos/400/300" }, null, 2),
  "音频": JSON.stringify({ audio: "https://example.com/sample.mp3", duration: 120 }, null, 2),
  "视频": JSON.stringify({ video: "https://example.com/sample.mp4", fps: 24 }, null, 2),
  "表格": JSON.stringify({ data: [{ col1: "A1", col2: "B1" }] }, null, 2),
  "跨模态": JSON.stringify({ text: "描述图中内容", image: "https://picsum.photos/400/300" }, null, 2),
};

// ─── Toggle Switch helper ────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

// ─── Component ───────────────────────────────────────────────
const AnnotationToolEditor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get("id");

  const [objects, setObjects] = useState<ObjectCard[]>([]);
  const [methods, setMethods] = useState<MethodCard[]>([]);
  const [panelTarget, setPanelTarget] = useState<PanelTarget>(null);
  const [selectedObjTypes, setSelectedObjTypes] = useState<ObjectType[]>([]);
  const [selectedMethodTypes, setSelectedMethodTypes] = useState<MethodType[]>([]);

  // Modals
  const [showTestData, setShowTestData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTemplateImport, setShowTemplateImport] = useState(false);
  const [testData, setTestData] = useState("{}");
  const [testDataPreset, setTestDataPreset] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolType, setToolType] = useState("文本类");
  const [toolDesc, setToolDesc] = useState("");
  const [methodLayout, setMethodLayout] = useState<"bottom" | "right" | "top" | "left">("right");

  // ─── Object ops ────────────────────────────────────────────
  const addObjects = useCallback(() => {
    if (selectedObjTypes.length === 0) { toast.error("请先选择标注对象"); return; }
    const newCards = selectedObjTypes.map(type => ({
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, title: type, testField: "", hint: "", config: defaultObjectConfig(type),
    }));
    setObjects(prev => [...prev, ...newCards]);
    setSelectedObjTypes([]);
    toast.success(`已生成 ${newCards.length} 个标注对象卡片`);
  }, [selectedObjTypes]);

  const addMethods = useCallback(() => {
    if (selectedMethodTypes.length === 0) { toast.error("请先选择标注方法"); return; }
    const newCards = selectedMethodTypes.map(type => ({
      id: `mtd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, title: type, required: false, hint: "", linkedObject: "", config: defaultMethodConfig(type), options: [],
    }));
    setMethods(prev => [...prev, ...newCards]);
    setSelectedMethodTypes([]);
    toast.success(`已生成 ${newCards.length} 个标注方法卡片`);
  }, [selectedMethodTypes]);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    if (panelTarget?.kind === "object" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  const removeMethod = useCallback((id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    if (panelTarget?.kind === "method" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  const moveObject = useCallback((id: string, dir: -1 | 1) => {
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx < 0 || (dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  }, []);

  const moveMethod = useCallback((id: string, dir: -1 | 1) => {
    setMethods(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx < 0 || (dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  }, []);

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

  const handleTemplateImport = () => {
    if (objects.length > 0 || methods.length > 0) {
      if (!confirm("引用模板将清空当前配置，确认继续？")) return;
    }
    setObjects([{ id: "obj-tpl-1", type: "文本", title: "文本内容", testField: "text", hint: "请阅读以下文本", config: defaultObjectConfig("文本") }]);
    setMethods([{ id: "mtd-tpl-1", type: "单选", title: "情感分类", required: true, hint: "请选择情感倾向", linkedObject: "obj-tpl-1", config: defaultMethodConfig("单选"), options: [{ value: "正面", alias: "", shortcut: "1" }, { value: "负面", alias: "", shortcut: "2" }, { value: "中性", alias: "", shortcut: "3" }] }]);
    setShowTemplateImport(false);
    toast.success("已引用模板配置");
  };

  const selectedObject = panelTarget?.kind === "object" ? objects.find(o => o.id === panelTarget.id) : null;
  const selectedMethod = panelTarget?.kind === "method" ? methods.find(m => m.id === panelTarget.id) : null;

  // ─── Render object config panel ────────────────────────────
  const renderObjectPanel = (obj: ObjectCard) => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">标注对象属性 - {obj.type}</h4>
      <div>
        <label className="text-xs text-muted-foreground">标题 *</label>
        <input value={obj.title} onChange={e => updateObject(obj.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">测试集字段 *</label>
        <input value={obj.testField} onChange={e => updateObject(obj.id, { testField: e.target.value })} placeholder="输入字段名称" className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">标注内容提示</label>
        <textarea value={obj.hint} onChange={e => updateObject(obj.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1 resize-none" placeholder="填写标注提示信息..." />
      </div>
      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2">动态扩展参数</p>
        {(obj.type === "文本" || obj.type === "超文本") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs">允许文字选择</span><Toggle value={obj.config.allowTextSelect} onChange={v => updateObjectConfig(obj.id, "allowTextSelect", v)} /></div>
            <div>
              <span className="text-xs text-muted-foreground">文本选择粒度</span>
              <select value={obj.config.selectGranularity} onChange={e => updateObjectConfig(obj.id, "selectGranularity", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="word">按词选择文本</option><option value="char">按字符选择文本</option><option value="paragraph">按段落选择文本</option>
              </select>
            </div>
          </div>
        )}
        {obj.type === "图像" && (
          <div className="space-y-3">
            {[{ key: "allowZoom", label: "允许图像缩放" }, { key: "showZoomControl", label: "工具栏显示缩放控制" }, { key: "showRotateControl", label: "工具栏显示旋转控制" }, { key: "showContrastControl", label: "工具栏显示对比度控制" }].map(item => (
              <div key={item.key} className="flex items-center justify-between"><span className="text-xs">{item.label}</span><Toggle value={obj.config[item.key]} onChange={v => updateObjectConfig(obj.id, item.key, v)} /></div>
            ))}
          </div>
        )}
        {obj.type === "音频" && (
          <div className="space-y-3">
            {[{ key: "showMultiChannel", label: "显示多个音频通道" }, { key: "disableWaveform", label: "禁用波形可视化" }].map(item => (
              <div key={item.key} className="flex items-center justify-between"><span className="text-xs">{item.label}</span><Toggle value={obj.config[item.key]} onChange={v => updateObjectConfig(obj.id, item.key, v)} /></div>
            ))}
          </div>
        )}
        {obj.type === "视频" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">视频帧率</span><input type="number" value={obj.config.frameRate} onChange={e => updateObjectConfig(obj.id, "frameRate", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div className="flex items-center justify-between"><span className="text-xs">静音播放</span><Toggle value={obj.config.mutePlayback} onChange={v => updateObjectConfig(obj.id, "mutePlayback", v)} /></div>
          </div>
        )}
        {obj.type === "列表" && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">字段映射（id/title/body）</p>
            {["idField", "titleField", "bodyField"].map(key => (
              <div key={key}><span className="text-[10px] text-muted-foreground">{key}</span><input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
            ))}
          </div>
        )}
        {(obj.type === "段落" || obj.type === "对话") && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">字段映射（nameKey/textKey）</p>
            {["nameKey", "textKey"].map(key => (
              <div key={key}><span className="text-[10px] text-muted-foreground">{key}</span><input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
            ))}
            <div className="flex items-center justify-between"><span className="text-xs">显示音频播放器</span><Toggle value={obj.config.showAudioPlayer} onChange={v => updateObjectConfig(obj.id, "showAudioPlayer", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">对话式布局</span><Toggle value={obj.config.useDialogLayout} onChange={v => updateObjectConfig(obj.id, "useDialogLayout", v)} /></div>
          </div>
        )}
        {obj.type === "时间序列" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">时间列字段名</span><input value={obj.config.timeColumn || ""} onChange={e => updateObjectConfig(obj.id, "timeColumn", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">时间解析格式</span>
              <select value={obj.config.timeFormat} onChange={e => updateObjectConfig(obj.id, "timeFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option>%m/%d/%Y %H:%M:%S</option><option>%Y-%m-%d %H:%M:%S.%f</option><option>%Y%m%d%H%M%S</option>
              </select>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">多通道</span><Toggle value={obj.config.multiChannel} onChange={v => updateObjectConfig(obj.id, "multiChannel", v)} /></div>
            {obj.config.multiChannel && <div><span className="text-xs text-muted-foreground">通道数量</span><input type="number" value={obj.config.channelCount || 1} onChange={e => updateObjectConfig(obj.id, "channelCount", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>}
          </div>
        )}
        {obj.type === "PDF" && <p className="text-xs text-muted-foreground italic">PDF 参数配置待定</p>}
      </div>
    </div>
  );

  // ─── Render method config panel ────────────────────────────
  const renderMethodPanel = (mtd: MethodCard) => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">标注方法属性 - {mtd.type}</h4>
      <div>
        <label className="text-xs text-muted-foreground">标题 *</label>
        <input value={mtd.title} onChange={e => updateMethod(mtd.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1" />
      </div>
      <div className="flex items-center justify-between"><span className="text-xs">是否必填</span><Toggle value={mtd.required} onChange={v => updateMethod(mtd.id, { required: v })} /></div>
      <div>
        <label className="text-xs text-muted-foreground">标注内容提示</label>
        <textarea value={mtd.hint} onChange={e => updateMethod(mtd.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded bg-background mt-1 resize-none" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">关联标注对象 *</label>
        <select value={mtd.linkedObject} onChange={e => updateMethod(mtd.id, { linkedObject: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
          <option value="">请选择</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.title} ({o.type})</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">布局位置</label>
        <div className="flex gap-1 mt-1">
          {(["top", "bottom", "left", "right"] as const).map(pos => (
            <button key={pos} onClick={() => setMethodLayout(pos)} className={`px-2 py-1 text-[10px] rounded border ${methodLayout === pos ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>
              {{ top: "上", bottom: "下", left: "左", right: "右" }[pos]}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2">扩展参数</p>

        {/* 单选 / 多选 */}
        {(mtd.type === "单选" || mtd.type === "多选") && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">选项</span>
                <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `选项${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加选项</button>
              </div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" placeholder="选项值" />
                  {mtd.config.enableAlias && <input value={opt.alias} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], alias: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="w-16 px-2 py-1 text-xs border rounded bg-background" placeholder="别名" />}
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">关闭快捷键</option><option value="auto">系统自动分配</option><option value="custom">用户自定义</option>
              </select>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">开启选项别名</span><Toggle value={mtd.config.enableAlias} onChange={v => updateMethodConfig(mtd.id, "enableAlias", v)} /></div>
            <div><span className="text-xs text-muted-foreground">默认值</span>
              <select value={mtd.config.defaultValue || ""} onChange={e => updateMethodConfig(mtd.id, "defaultValue", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="">无</option>{mtd.options.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">标签快捷搜索</span><Toggle value={mtd.config.enableSearch} onChange={v => updateMethodConfig(mtd.id, "enableSearch", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">允许选项间关系</span><Toggle value={mtd.config.allowRelation} onChange={v => updateMethodConfig(mtd.id, "allowRelation", v)} /></div>
            {mtd.type === "多选" && <div><span className="text-xs text-muted-foreground">选项布局</span>
              <select value={mtd.config.optionLayout} onChange={e => updateMethodConfig(mtd.id, "optionLayout", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="horizontal">水平单行显示</option><option value="vertical">垂直显示</option>
              </select>
            </div>}
          </div>
        )}

        {/* 输入框 */}
        {mtd.type === "输入框" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">默认值</span><input value={mtd.config.defaultValue || ""} onChange={e => updateMethodConfig(mtd.id, "defaultValue", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">输入提示</span><input value={mtd.config.placeholder || ""} onChange={e => updateMethodConfig(mtd.id, "placeholder", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" placeholder="请输入..." /></div>
          </div>
        )}

        {/* 画笔 */}
        {mtd.type === "画笔" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground mb-1 block">画笔类型</span>
              <div className="flex flex-wrap gap-1">
                {["笔刷", "椭圆框", "魔棒", "多边形", "矩形框", "向量", "关键点"].map(bt => {
                  const active = (mtd.config.brushTypes || []).includes(bt);
                  return <button key={bt} onClick={() => { const cur = mtd.config.brushTypes || []; updateMethodConfig(mtd.id, "brushTypes", active ? cur.filter((x: string) => x !== bt) : [...cur, bt]); }} className={`px-2 py-1 text-[10px] rounded border ${active ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{bt}</button>;
                })}
              </div>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">无标签标注</span><Toggle value={mtd.config.noLabelAnnotation} onChange={v => updateMethodConfig(mtd.id, "noLabelAnnotation", v)} /></div>
            <div>
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">标签</span><button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `标签${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加标签</button></div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div><span className="text-xs text-muted-foreground">标签类型</span><select value={mtd.config.labelType} onChange={e => updateMethodConfig(mtd.id, "labelType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="single">单选</option><option value="multi">多选</option></select></div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span><select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="off">关闭</option><option value="auto">自动分配</option><option value="custom">自定义</option></select></div>
            <div className="flex items-center justify-between"><span className="text-xs">允许选项间关系</span><Toggle value={mtd.config.allowRelation} onChange={v => updateMethodConfig(mtd.id, "allowRelation", v)} /></div>
          </div>
        )}

        {/* 评分 */}
        {mtd.type === "评分" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">最大分值</span><input type="number" value={mtd.config.maxScore} onChange={e => updateMethodConfig(mtd.id, "maxScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">默认分值</span><input type="number" value={mtd.config.defaultScore} onChange={e => updateMethodConfig(mtd.id, "defaultScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span><select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="off">关闭</option><option value="auto">自动分配</option><option value="custom">自定义</option></select></div>
          </div>
        )}

        {/* 排序 */}
        {mtd.type === "排序" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">排序类型</span><select value={mtd.config.sortType} onChange={e => updateMethodConfig(mtd.id, "sortType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="list">列表模式</option><option value="bucket">桶模式</option></select></div>
            {mtd.config.sortType === "bucket" && (
              <div>
                <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">配置桶</span><button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `桶${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加桶</button></div>
                {mtd.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                    <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 比较 */}
        {mtd.type === "比较" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">比对项</span><button onClick={() => updateMethodConfig(mtd.id, "compareFields", [...(mtd.config.compareFields || []), `字段${(mtd.config.compareFields?.length || 0) + 1}`])} className="text-[10px] text-primary hover:underline">+ 添加</button></div>
            {(mtd.config.compareFields || []).map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input value={f} onChange={e => { const fields = [...(mtd.config.compareFields || [])]; fields[i] = e.target.value; updateMethodConfig(mtd.id, "compareFields", fields); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                {(mtd.config.compareFields || []).length > 2 && <button onClick={() => updateMethodConfig(mtd.id, "compareFields", (mtd.config.compareFields || []).filter((_: any, j: number) => j !== i))} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>}
              </div>
            ))}
          </div>
        )}

        {/* 树形选择 */}
        {mtd.type === "树形选择" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">选项</span><button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `选项${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加</button></div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span><select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="off">关闭</option><option value="auto">自动分配</option><option value="custom">自定义</option></select></div>
            <div className="flex items-center justify-between"><span className="text-xs">选项别名</span><Toggle value={mtd.config.enableAlias} onChange={v => updateMethodConfig(mtd.id, "enableAlias", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">默认展开全部</span><Toggle value={mtd.config.expandAll} onChange={v => updateMethodConfig(mtd.id, "expandAll", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">平铺显示</span><Toggle value={mtd.config.flatten} onChange={v => updateMethodConfig(mtd.id, "flatten", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">仅选叶子节点</span><Toggle value={mtd.config.leafOnly} onChange={v => updateMethodConfig(mtd.id, "leafOnly", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">标签快捷搜索</span><Toggle value={mtd.config.enableSearch} onChange={v => updateMethodConfig(mtd.id, "enableSearch", v)} /></div>
            <div><span className="text-xs text-muted-foreground">选项类型</span><select value={mtd.config.optionType} onChange={e => updateMethodConfig(mtd.id, "optionType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="single">单选</option><option value="multi">多选</option></select></div>
            <div className="flex items-center justify-between"><span className="text-xs">允许选项间关系</span><Toggle value={mtd.config.allowRelation} onChange={v => updateMethodConfig(mtd.id, "allowRelation", v)} /></div>
          </div>
        )}

        {/* 钢笔锚点 */}
        {mtd.type === "钢笔锚点" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">锚点大小</span><select value={mtd.config.pointSize} onChange={e => updateMethodConfig(mtd.id, "pointSize", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="small">小</option><option value="medium">中</option><option value="large">大</option></select></div>
            <div><span className="text-xs text-muted-foreground">锚点样式</span><select value={mtd.config.pointStyle} onChange={e => updateMethodConfig(mtd.id, "pointStyle", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="circle">圆形</option><option value="rect">长方形</option></select></div>
            <div className="flex items-center justify-between"><span className="text-xs">开启吸附</span><Toggle value={mtd.config.enableSnap} onChange={v => updateMethodConfig(mtd.id, "enableSnap", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">贝塞尔曲线</span><Toggle value={mtd.config.enableBezier} onChange={v => updateMethodConfig(mtd.id, "enableBezier", v)} /></div>
            <div className="flex items-center justify-between"><span className="text-xs">骨架模式</span><Toggle value={mtd.config.enableSkeleton} onChange={v => updateMethodConfig(mtd.id, "enableSkeleton", v)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-[10px] text-muted-foreground">最小锚点数</span><input type="number" value={mtd.config.minPoints} onChange={e => updateMethodConfig(mtd.id, "minPoints", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
              <div><span className="text-[10px] text-muted-foreground">最大锚点数</span><input type="number" value={mtd.config.maxPoints} onChange={e => updateMethodConfig(mtd.id, "maxPoints", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
            </div>
          </div>
        )}

        {/* 时间选择 */}
        {mtd.type === "时间选择" && (
          <div className="space-y-3">
            <div><span className="text-xs text-muted-foreground">日期类型</span><select value={mtd.config.dateType} onChange={e => updateMethodConfig(mtd.id, "dateType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="date">日期</option><option value="datetime">日期时间</option><option value="year">年份</option></select></div>
            <div><span className="text-xs text-muted-foreground">日期格式化</span><input value={mtd.config.dateFormat} onChange={e => updateMethodConfig(mtd.id, "dateFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">最小时间 (ISO)</span><input value={mtd.config.minTime} onChange={e => updateMethodConfig(mtd.id, "minTime", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
            <div><span className="text-xs text-muted-foreground">最大时间 (ISO)</span><input value={mtd.config.maxTime} onChange={e => updateMethodConfig(mtd.id, "maxTime", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" /></div>
          </div>
        )}

        {/* 数字选择 */}
        {mtd.type === "数字选择" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-[10px] text-muted-foreground">最小值</span><input type="number" value={mtd.config.min} onChange={e => updateMethodConfig(mtd.id, "min", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
              <div><span className="text-[10px] text-muted-foreground">最大值</span><input type="number" value={mtd.config.max} onChange={e => updateMethodConfig(mtd.id, "max", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
              <div><span className="text-[10px] text-muted-foreground">步长</span><input type="number" value={mtd.config.step} onChange={e => updateMethodConfig(mtd.id, "step", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" /></div>
            </div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span><select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="off">关闭</option><option value="auto">自动分配</option><option value="custom">自定义</option></select></div>
          </div>
        )}

        {/* 超文本 / 时间序列 labels */}
        {(mtd.type === "超文本" || mtd.type === "时间序列") && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">标签</span><button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `标签${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 添加标签</button></div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div><span className="text-xs text-muted-foreground">标签类型</span><select className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="single">单选</option><option value="multi">多选</option></select></div>
            <div><span className="text-xs text-muted-foreground">快捷键模式</span><select value={mtd.config.shortcutMode || "auto"} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1"><option value="off">关闭</option><option value="auto">自动分配</option><option value="custom">自定义</option></select></div>
          </div>
        )}

        {mtd.type === "视频追踪" && <p className="text-xs text-muted-foreground italic">视频追踪参数配置（帧率、追踪目标等）</p>}
      </div>
    </div>
  );

  // ─── Method card content preview ───────────────────────────
  const renderMethodCardContent = (mtd: MethodCard) => {
    if (mtd.options.length === 0 && !["输入框", "评分", "数字选择", "时间选择", "比较", "排序"].includes(mtd.type)) {
      return <p className="text-[10px] text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 未配置选项</p>;
    }
    switch (mtd.type) {
      case "单选": return <div className="space-y-1">{mtd.options.map(o => <label key={o.value} className="flex items-center gap-2 text-xs"><input type="radio" name={mtd.id} disabled />{o.value}</label>)}</div>;
      case "多选": return <div className="space-y-1">{mtd.options.map(o => <label key={o.value} className="flex items-center gap-2 text-xs"><input type="checkbox" disabled />{o.value}</label>)}</div>;
      case "输入框": return <textarea disabled rows={2} placeholder={mtd.config.placeholder || "请输入..."} className="w-full px-2 py-1 text-xs border rounded bg-muted/20 resize-none" />;
      case "评分": return <div className="flex gap-0.5">{Array.from({ length: mtd.config.maxScore || 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (mtd.config.defaultScore || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}</div>;
      case "数字选择": return <input type="number" disabled value={mtd.config.min} className="w-20 px-2 py-1 text-xs border rounded bg-muted/20" />;
      case "时间选择": return <input type="date" disabled className="px-2 py-1 text-xs border rounded bg-muted/20" />;
      case "画笔": return <div className="flex gap-1 flex-wrap">{(mtd.config.brushTypes || []).map((bt: string) => <span key={bt} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]">{bt}</span>)}</div>;
      case "排序": return <p className="text-xs text-muted-foreground">{mtd.config.sortType === "list" ? "列表排序" : `桶模式`}</p>;
      case "比较": return <div className="flex gap-1">{(mtd.config.compareFields || []).map((f: string, i: number) => <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{f}</span>)}</div>;
      default: return <p className="text-xs text-muted-foreground">{mtd.type}</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-16 flex items-center justify-between px-6 mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/data-annotation/tools")} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight">{toolId ? toolName || "编辑标注工具" : "新建标注工具"}</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>TrustData Hub</span>
                <span>/</span>
                <span>工具编辑</span>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-row items-center gap-2 md:gap-3">
            <button onClick={() => setShowTemplateImport(true)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted/50 transition-colors">引用模板</button>
            <button onClick={() => setShowTestData(true)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted/50 transition-colors">管理测试集</button>
            <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted/50 transition-colors">效果预览</button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1 hidden md:block" />
            <button onClick={() => navigate("/data-annotation/tools")} className="px-2 text-xs font-medium text-muted-foreground hover:text-foreground hidden md:block transition-colors">取消</button>
            <button onClick={() => setShowSaveModal(true)} className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm ml-1">保存并返回</button>
          </div>
        </div>
      </header>

      {/* ─── Main 3-column layout ───────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left + Middle: Objects & Methods */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* ─── 标注对象 column ─────────────────────────────── */}
          <div className="flex-1 border-r p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">标注对象</h3>
            {/* Type selector */}
            <div className="border rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-2">* 请选择您要添加的标注对象卡片，支持多选：</p>
              <div className="flex flex-wrap gap-2">
                {objectTypes.map(ot => {
                  const selected = selectedObjTypes.includes(ot.type);
                  return (
                    <button key={ot.type} onClick={() => setSelectedObjTypes(prev => selected ? prev.filter(t => t !== ot.type) : [...prev, ot.type])}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${selected ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/30"}`}>
                      <ot.icon className="w-3.5 h-3.5" />{ot.type}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-center">
                <button onClick={addObjects} className="px-6 py-1.5 text-xs border-2 border-dashed border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors">
                  生成标注对象卡片
                </button>
              </div>
            </div>

            {/* Generated object cards */}
            <div className="space-y-3">
              {objects.map((obj, idx) => {
                const Icon = objectTypes.find(o => o.type === obj.type)?.icon || FileText;
                const isSelected = panelTarget?.kind === "object" && panelTarget.id === obj.id;
                return (
                  <div key={obj.id} onClick={() => setPanelTarget({ kind: "object", id: obj.id })}
                    className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-primary" /></div>
                        <div>
                          <p className="text-sm font-medium">{obj.title}</p>
                          <p className="text-[10px] text-muted-foreground">{obj.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={e => { e.stopPropagation(); moveObject(obj.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); moveObject(obj.id, 1); }} disabled={idx === objects.length - 1} className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); removeObject(obj.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {!obj.testField ? (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 配置缺失：请先配测试集 → 右侧配置区设测试集字段 → 展示效果</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">字段: {obj.testField}</p>
                    )}
                    {obj.hint && <p className="text-[10px] text-muted-foreground mt-1 truncate">{obj.hint}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── 标注方法 column ─────────────────────────────── */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">标注方法</h3>
            <div className="border rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-2">* 请选择您要添加的标注方法卡片，支持多选：</p>
              <div className="flex flex-wrap gap-2">
                {methodTypes.map(mt => {
                  const selected = selectedMethodTypes.includes(mt.type);
                  return (
                    <button key={mt.type} onClick={() => setSelectedMethodTypes(prev => selected ? prev.filter(t => t !== mt.type) : [...prev, mt.type])}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${selected ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/30"}`}>
                      <mt.icon className="w-3.5 h-3.5" />{mt.type}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-center">
                <button onClick={addMethods} className="px-6 py-1.5 text-xs border-2 border-dashed border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors">
                  生成标注方法卡片
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {methods.map((mtd, idx) => {
                const Icon = methodTypes.find(m => m.type === mtd.type)?.icon || CheckCircle2;
                const isSelected = panelTarget?.kind === "method" && panelTarget.id === mtd.id;
                return (
                  <div key={mtd.id} onClick={() => setPanelTarget({ kind: "method", id: mtd.id })}
                    className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-accent/50 flex items-center justify-center"><Icon className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-sm font-medium">{mtd.title}{mtd.required && <span className="text-destructive ml-1">*</span>}</p>
                          <p className="text-[10px] text-muted-foreground">{mtd.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={e => { e.stopPropagation(); moveMethod(mtd.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); moveMethod(mtd.id, 1); }} disabled={idx === methods.length - 1} className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); removeMethod(mtd.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {renderMethodCardContent(mtd)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Right: Config panel ──────────────────────────── */}
        <div className="w-72 border-l bg-card shrink-0 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">配置</h3>
            {!selectedObject && !selectedMethod && (
              <div className="text-center py-12 text-muted-foreground">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">点击左侧卡片查看属性配置</p>
              </div>
            )}
            {selectedObject && renderObjectPanel(selectedObject)}
            {selectedMethod && renderMethodPanel(selectedMethod)}
          </div>
        </div>
      </div>

      {/* ─── Test data modal ────────────────────────────────── */}
      {showTestData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">管理测试集</h3>
              <button onClick={() => setShowTestData(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">预置样例:</span>
              {Object.keys(mockTestDataPresets).map(key => (
                <button key={key} onClick={() => { setTestData(mockTestDataPresets[key]); setTestDataPreset(key); }} className={`px-2 py-1 text-[10px] rounded border ${testDataPreset === key ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{key}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-2">输入 JSON 格式 mock 数据，或导入已有数据集第一条数据</p>
            <textarea value={testData} onChange={e => setTestData(e.target.value)} rows={12} className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-background resize-none" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast.info("从数据集导入第一条数据")} className="px-3 py-1.5 text-xs border rounded hover:bg-muted/50 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> 从数据集导入</button>
              <button onClick={() => { try { JSON.parse(testData); toast.success("JSON 格式校验通过"); } catch { toast.error("JSON 格式错误"); } }} className="px-3 py-1.5 text-xs border rounded hover:bg-muted/50">校验 JSON</button>
              <div className="flex-1" />
              <button onClick={() => setShowTestData(false)} className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">确定</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preview modal ──────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">效果预览</h3>
              <button onClick={() => setShowPreview(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {objects.length === 0 && methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Eye className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">请先添加标注对象和标注方法</p>
                </div>
              ) : (
                <div className={`border rounded-lg p-4 bg-background ${methodLayout === "right" || methodLayout === "left" ? "flex gap-4" : "space-y-4"}`}>
                  {(methodLayout === "left" || methodLayout === "top") && methods.length > 0 && (
                    <div className={methodLayout === "left" ? "w-64 shrink-0 space-y-3" : "space-y-3"}>
                      <p className="text-xs font-medium text-muted-foreground">标注方法</p>
                      {methods.map(mtd => (<div key={mtd.id} className="border rounded p-3"><p className="text-xs font-medium mb-1">{mtd.title}</p>{renderMethodCardContent(mtd)}</div>))}
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">标注对象</p>
                    {objects.map(obj => {
                      let previewContent: string | null = null;
                      try { const data = JSON.parse(testData); previewContent = obj.testField && data[obj.testField] ? String(data[obj.testField]) : null; } catch { /* ignore */ }
                      return (
                        <div key={obj.id} className="border rounded p-4">
                          <p className="text-xs font-medium mb-2">{obj.title}</p>
                          {obj.hint && <p className="text-[10px] text-muted-foreground mb-2">{obj.hint}</p>}
                          {previewContent ? <div className="p-3 rounded bg-muted/20 text-sm">{previewContent}</div> : <div className="p-3 rounded bg-muted/20 text-xs text-muted-foreground text-center">先配测试集 → 配置字段 → 展示效果</div>}
                        </div>
                      );
                    })}
                  </div>
                  {(methodLayout === "right" || methodLayout === "bottom") && methods.length > 0 && (
                    <div className={methodLayout === "right" ? "w-64 shrink-0 space-y-3" : "space-y-3"}>
                      <p className="text-xs font-medium text-muted-foreground">标注方法</p>
                      {methods.map(mtd => (<div key={mtd.id} className="border rounded p-3"><p className="text-xs font-medium mb-1">{mtd.title}</p>{renderMethodCardContent(mtd)}</div>))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Save modal ─────────────────────────────────────── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">保存标注工具</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground">工具名称 *</label><input value={toolName} onChange={e => setToolName(e.target.value)} className="w-full px-3 py-2 text-sm border rounded bg-background mt-1" placeholder="输入工具名称" /></div>
              <div><label className="text-xs text-muted-foreground">工具类型</label>
                <select value={toolType} onChange={e => setToolType(e.target.value)} className="w-full px-3 py-2 text-sm border rounded bg-background mt-1">
                  {["文本类", "图像类", "音频类", "视频类", "表格类", "跨模态类"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">工具描述</label><textarea value={toolDesc} onChange={e => setToolDesc(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border rounded bg-background mt-1 resize-none" placeholder="描述工具的功能和用途" /></div>
              <div><label className="text-xs text-muted-foreground">工具封面图标</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground"><Upload className="w-6 h-6" /></div>
                  <div><button className="text-xs text-primary hover:underline">上传图片</button><span className="text-xs text-muted-foreground mx-2">或</span><button className="text-xs text-primary hover:underline">AI 生成</button></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-muted/50">取消</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Template import modal ──────────────────────────── */}
      {showTemplateImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">引用已有模板</h3>
              <button onClick={() => setShowTemplateImport(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">引用后将清空当前画布配置，使用模板的标注对象和方法。</p>
            <div className="space-y-2 mb-4">
              {["文本分类标注模板", "图像检测标注模板", "NER实体标注模板"].map(tpl => (
                <button key={tpl} onClick={handleTemplateImport} className="w-full text-left px-3 py-2 text-sm rounded border hover:bg-muted/30">{tpl}</button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowTemplateImport(false)} className="px-4 py-2 text-sm border rounded hover:bg-muted/50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolEditor;

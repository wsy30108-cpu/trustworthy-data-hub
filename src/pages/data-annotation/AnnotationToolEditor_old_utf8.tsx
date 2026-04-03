import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Settings2, Eye, Save,
  FileText, Image, Mic, Video, MessageSquare, Globe, ListOrdered, AlignLeft,
  FileSpreadsheet, Clock, Table2, X, GripVertical, Search, Upload,
  CheckCircle2, AlertTriangle, Palette, Layout, Code, Layers,
  Type, ImageIcon, Music, Film, List, Hash, Star, ArrowUpDown,
  GitCompare, TreePine, PenTool, Calendar, Crosshair, MousePointer,
  Brush, Circle, Pentagon, Square, Wand2, Anchor
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

// 鈹€鈹€鈹€ Types 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
type ObjectType = "鏂囨湰" | "鍥惧儚" | "闊抽" | "瑙嗛" | "瀵硅瘽" | "瓒呮枃鏈? | "鍒楄〃" | "娈佃惤" | "PDF" | "琛ㄦ牸" | "鏃堕棿搴忓垪";
type MethodType = "鍗曢€? | "澶氶€? | "杈撳叆妗? | "鐢荤瑪" | "璇勫垎" | "鎺掑簭" | "姣旇緝" | "鏍戝舰閫夋嫨" | "閽㈢瑪閿氱偣" | "鏃堕棿閫夋嫨" | "鏁板瓧閫夋嫨" | "瑙嗛杩借釜";

interface ObjectCard {
  id: string;
  type: ObjectType;
  title: string;
  testField: string;
  hint: string;
  config: Record<string, any>;
}

interface MethodOption { value: string; alias: string; shortcut: string; }

interface MethodCard {
  id: string;
  type: MethodType;
  title: string;
  required: boolean;
  hint: string;
  linkedObject: string;
  config: Record<string, any>;
  options: MethodOption[];
}

type PanelTarget = { kind: "object"; id: string } | { kind: "method"; id: string } | null;

const objectTypes: { type: ObjectType; icon: any; desc: string }[] = [
  { type: "鏂囨湰", icon: Type, desc: "绾枃鏈唴瀹? },
  { type: "鍥惧儚", icon: ImageIcon, desc: "鍥剧墖鏂囦欢" },
  { type: "闊抽", icon: Music, desc: "闊抽鏂囦欢" },
  { type: "瑙嗛", icon: Film, desc: "瑙嗛鏂囦欢" },
  { type: "瀵硅瘽", icon: MessageSquare, desc: "瀵硅瘽璁板綍" },
  { type: "瓒呮枃鏈?, icon: Globe, desc: "HTML瀵屾枃鏈? },
  { type: "鍒楄〃", icon: List, desc: "鍒楄〃鏁版嵁" },
  { type: "娈佃惤", icon: AlignLeft, desc: "娈佃惤鏂囨湰" },
  { type: "PDF", icon: FileText, desc: "PDF鏂囨。" },
  { type: "琛ㄦ牸", icon: Table2, desc: "琛ㄦ牸鏁版嵁" },
  { type: "鏃堕棿搴忓垪", icon: Clock, desc: "鏃跺簭鏁版嵁" },
];

const methodTypes: { type: MethodType; icon: any; desc: string }[] = [
  { type: "鍗曢€?, icon: CheckCircle2, desc: "鍗曢」閫夋嫨" },
  { type: "澶氶€?, icon: List, desc: "澶氶」閫夋嫨" },
  { type: "杈撳叆妗?, icon: Type, desc: "鏂囨湰杈撳叆" },
  { type: "鐢荤瑪", icon: Brush, desc: "缁樺埗鏍囨敞" },
  { type: "璇勫垎", icon: Star, desc: "鏄熺骇璇勫垎" },
  { type: "鎺掑簭", icon: ArrowUpDown, desc: "鎷栨嫿鎺掑簭" },
  { type: "姣旇緝", icon: GitCompare, desc: "鍐呭姣旇緝" },
  { type: "鏍戝舰閫夋嫨", icon: TreePine, desc: "灞傜骇閫夋嫨" },
  { type: "閽㈢瑪閿氱偣", icon: PenTool, desc: "閿氱偣鏍囨敞" },
  { type: "鏃堕棿閫夋嫨", icon: Calendar, desc: "鏃ユ湡閫夋嫨" },
  { type: "鏁板瓧閫夋嫨", icon: Hash, desc: "鏁板瓧杈撳叆" },
  { type: "瑙嗛杩借釜", icon: Crosshair, desc: "鐩爣杩借釜" },
];

const defaultObjectConfig = (type: ObjectType): Record<string, any> => {
  switch (type) {
    case "鏂囨湰": case "瓒呮枃鏈?: return { allowTextSelect: true, selectGranularity: "word" };
    case "鍥惧儚": return { allowZoom: true, showZoomControl: true, showRotateControl: true, showContrastControl: true };
    case "闊抽": return { showMultiChannel: false, disableWaveform: false };
    case "瑙嗛": return { frameRate: 24, mutePlayback: false };
    case "鍒楄〃": return { idField: "id", titleField: "title", bodyField: "body" };
    case "娈佃惤": case "瀵硅瘽": return { nameKey: "nameKey", textKey: "textKey", showAudioPlayer: false, useDialogLayout: false };
    case "琛ㄦ牸": case "鏃堕棿搴忓垪": return { timeColumn: "", timeFormat: "%Y-%m-%d %H:%M:%S", multiChannel: false, channelCount: 1 };
    default: return {};
  }
};

const defaultMethodConfig = (type: MethodType): Record<string, any> => {
  switch (type) {
    case "鍗曢€?: return { shortcutMode: "auto", enableAlias: false, defaultValue: "", enableSearch: false, allowRelation: true };
    case "澶氶€?: return { shortcutMode: "auto", enableAlias: false, defaultValue: "", enableSearch: false, optionLayout: "horizontal", allowRelation: true };
    case "杈撳叆妗?: return { defaultValue: "", placeholder: "" };
    case "鐢荤瑪": return { brushTypes: ["鐭╁舰妗?], noLabelAnnotation: false, labelType: "single", shortcutMode: "auto", allowRelation: true };
    case "鎺掑簭": return { sortType: "list", defaultBucket: "" };
    case "姣旇緝": return { compareFields: ["瀛楁A", "瀛楁B"] };
    case "璇勫垎": return { maxScore: 5, defaultScore: 0, shortcutMode: "auto" };
    case "鏍戝舰閫夋嫨": return { shortcutMode: "auto", enableAlias: false, defaultValue: "", expandAll: false, flatten: false, leafOnly: false, enableSearch: false, optionType: "single", allowRelation: true };
    case "閽㈢瑪閿氱偣": return { pointSize: "medium", pointStyle: "circle", enableSnap: false, enableBezier: false, enableSkeleton: false, minPoints: -1, maxPoints: -1 };
    case "鏃堕棿閫夋嫨": return { dateType: "date", dateFormat: "%Y-%m-%d", minTime: "", maxTime: "" };
    case "鏁板瓧閫夋嫨": return { min: 0, max: 100, step: 1, shortcutMode: "auto" };
    case "瑙嗛杩借釜": return {};
    default: return {};
  }
};

// 鈹€鈹€鈹€ Mock test data presets 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const mockTestDataPresets: Record<string, string> = {
  "鏂囨湰": JSON.stringify({ text: "澶浠婃棩鍏竷鏈€鏂拌揣甯佹斂绛栵紝缁存寔鍩哄噯鍒╃巼涓嶅彉銆傚競鍦哄垎鏋愪汉澹涓鸿繖涓€鍐冲畾绗﹀悎棰勬湡銆? }, null, 2),
  "鍥惧儚": JSON.stringify({ image: "https://picsum.photos/400/300" }, null, 2),
  "闊抽": JSON.stringify({ audio: "https://example.com/sample.mp3", duration: 120 }, null, 2),
  "瑙嗛": JSON.stringify({ video: "https://example.com/sample.mp4", fps: 24, duration: 60 }, null, 2),
  "琛ㄦ牸": JSON.stringify({ data: [{ col1: "A1", col2: "B1" }, { col1: "A2", col2: "B2" }] }, null, 2),
  "璺ㄦā鎬?: JSON.stringify({ text: "鎻忚堪鍥句腑鍐呭", image: "https://picsum.photos/400/300" }, null, 2),
};

// 鈹€鈹€鈹€ Component 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const AnnotationToolEditor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get("id");

  // Canvas state
  const [objects, setObjects] = useState<ObjectCard[]>([]);
  const [methods, setMethods] = useState<MethodCard[]>([]);
  const [panelTarget, setPanelTarget] = useState<PanelTarget>(null);
  const [methodLayout, setMethodLayout] = useState<"bottom" | "right" | "top" | "left">("right");

  // Modals
  const [showObjectPicker, setShowObjectPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showTestData, setShowTestData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showTemplateImport, setShowTemplateImport] = useState(false);
  const [activeTab, setActiveTab] = useState<"objects" | "methods" | "test" | "preview" | "layout">("objects");

  // Test data
  const [testData, setTestData] = useState("{}");
  const [testDataPreset, setTestDataPreset] = useState("");

  // Save info
  const [toolName, setToolName] = useState("");
  const [toolType, setToolType] = useState("鏂囨湰绫?);
  const [toolDesc, setToolDesc] = useState("");

  // Object picker selection
  const [selectedObjTypes, setSelectedObjTypes] = useState<ObjectType[]>([]);
  const [selectedMethodTypes, setSelectedMethodTypes] = useState<MethodType[]>([]);

  // 鈹€鈹€鈹€ Object operations 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const addObjects = useCallback(() => {
    const newCards = selectedObjTypes.map(type => ({
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: type,
      testField: "",
      hint: "",
      config: defaultObjectConfig(type),
    }));
    setObjects(prev => [...prev, ...newCards]);
    setShowObjectPicker(false);
    setSelectedObjTypes([]);
    toast.success(`宸叉坊鍔?${newCards.length} 涓爣娉ㄥ璞);
  }, [selectedObjTypes]);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    if (panelTarget?.kind === "object" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  // 鈹€鈹€鈹€ Method operations 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const addMethods = useCallback(() => {
    const newCards = selectedMethodTypes.map(type => ({
      id: `mtd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: type,
      required: false,
      hint: "",
      linkedObject: "",
      config: defaultMethodConfig(type),
      options: [],
    }));
    setMethods(prev => [...prev, ...newCards]);
    setShowMethodPicker(false);
    setSelectedMethodTypes([]);
    toast.success(`宸叉坊鍔?${newCards.length} 涓爣娉ㄦ柟娉昤);
  }, [selectedMethodTypes]);

  const removeMethod = useCallback((id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    if (panelTarget?.kind === "method" && panelTarget.id === id) setPanelTarget(null);
  }, [panelTarget]);

  // 鈹€鈹€鈹€ Update helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const updateObject = useCallback((id: string, patch: Partial<ObjectCard>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const updateMethod = useCallback((id: string, patch: Partial<MethodCard>) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const updateMethodConfig = useCallback((id: string, key: string, value: any) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, config: { ...m.config, [key]: value } } : m));
  }, []);

  const updateObjectConfig = useCallback((id: string, key: string, value: any) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, config: { ...o.config, [key]: value } } : o));
  }, []);

  // 鈹€鈹€鈹€ Save 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const handleSave = () => {
    if (!toolName.trim()) { toast.error("璇峰～鍐欏伐鍏峰悕绉?); return; }
    toast.success(`鏍囨敞宸ュ叿銆?{toolName}銆嶅凡淇濆瓨`);
    setShowSaveModal(false);
  };

  // Template import
  const handleTemplateImport = () => {
    if (objects.length > 0 || methods.length > 0) {
      if (!confirm("寮曠敤妯℃澘灏嗘竻绌哄綋鍓嶉厤缃紝纭缁х画锛?)) return;
    }
    setObjects([{ id: "obj-tpl-1", type: "鏂囨湰", title: "鏂囨湰鍐呭", testField: "text", hint: "璇烽槄璇讳互涓嬫枃鏈?, config: defaultObjectConfig("鏂囨湰") }]);
    setMethods([{ id: "mtd-tpl-1", type: "鍗曢€?, title: "鎯呮劅鍒嗙被", required: true, hint: "璇烽€夋嫨鎯呮劅鍊惧悜", linkedObject: "obj-tpl-1", config: defaultMethodConfig("鍗曢€?), options: [{ value: "姝ｉ潰", alias: "", shortcut: "1" }, { value: "璐熼潰", alias: "", shortcut: "2" }, { value: "涓€?, alias: "", shortcut: "3" }] }]);
    setShowTemplateImport(false);
    toast.success("宸插紩鐢ㄦā鏉块厤缃?);
  };

  // 鈹€鈹€鈹€ Selected panel items 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const selectedObject = panelTarget?.kind === "object" ? objects.find(o => o.id === panelTarget.id) : null;
  const selectedMethod = panelTarget?.kind === "method" ? methods.find(m => m.id === panelTarget.id) : null;

  // 鈹€鈹€鈹€ Render object property panel 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const renderObjectPanel = (obj: ObjectCard) => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Settings2 className="w-4 h-4" /> 鏍囨敞瀵硅薄灞炴€?- {obj.type}
      </h4>
      <div>
        <label className="text-xs text-muted-foreground">鏍囬 *</label>
        <input value={obj.title} onChange={e => updateObject(obj.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">娴嬭瘯闆嗗瓧娈?*</label>
        <input value={obj.testField} onChange={e => updateObject(obj.id, { testField: e.target.value })} placeholder="杈撳叆瀛楁鍚嶇О" className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1" />
        <p className="text-[10px] text-muted-foreground mt-1">
          {obj.type === "琛ㄦ牸" || obj.type === "鏃堕棿搴忓垪" ? "瀛楁鍊奸渶涓?JSON 绫诲瀷" : `瀵瑰簲${obj.type}绫诲瀷鐨勫瓧娈礰}
        </p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">鏍囨敞鍐呭鎻愮ず</label>
        <textarea value={obj.hint} onChange={e => updateObject(obj.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 resize-none" placeholder="濉啓鏍囨敞鎻愮ず淇℃伅..." />
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2">鍔ㄦ€佹墿灞曞弬鏁?/p>
        {(obj.type === "鏂囨湰" || obj.type === "瓒呮枃鏈?) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">鍏佽鏂囧瓧閫夋嫨</span>
              <button onClick={() => updateObjectConfig(obj.id, "allowTextSelect", !obj.config.allowTextSelect)} className={`w-9 h-5 rounded-full transition-colors ${obj.config.allowTextSelect ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config.allowTextSelect ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏂囨湰閫夋嫨绮掑害</span>
              <select value={obj.config.selectGranularity} onChange={e => updateObjectConfig(obj.id, "selectGranularity", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="word">鎸夎瘝閫夋嫨鏂囨湰</option>
                <option value="char">鎸夊瓧绗﹂€夋嫨鏂囨湰</option>
                <option value="paragraph">鎸夋钀介€夋嫨鏂囨湰</option>
              </select>
            </div>
          </div>
        )}
        {obj.type === "鍥惧儚" && (
          <div className="space-y-3">
            {[
              { key: "allowZoom", label: "鍏佽鍥惧儚缂╂斁锛圕trl+Wheel锛? },
              { key: "showZoomControl", label: "宸ュ叿鏍忔樉绀虹缉鏀炬帶鍒? },
              { key: "showRotateControl", label: "宸ュ叿鏍忔樉绀烘棆杞帶鍒? },
              { key: "showContrastControl", label: "宸ュ叿鏍忔樉绀哄姣斿害鎺у埗" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <button onClick={() => updateObjectConfig(obj.id, item.key, !obj.config[item.key])} className={`w-9 h-5 rounded-full transition-colors ${obj.config[item.key] ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config[item.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
        {obj.type === "闊抽" && (
          <div className="space-y-3">
            {[
              { key: "showMultiChannel", label: "鏄剧ず澶氫釜闊抽閫氶亾" },
              { key: "disableWaveform", label: "绂佺敤娉㈠舰鍙鍖栵紙鍔犲揩鍔犺浇锛? },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <button onClick={() => updateObjectConfig(obj.id, item.key, !obj.config[item.key])} className={`w-9 h-5 rounded-full transition-colors ${obj.config[item.key] ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config[item.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
        {obj.type === "瑙嗛" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">瑙嗛甯х巼</span>
              <input type="number" value={obj.config.frameRate} onChange={e => updateObjectConfig(obj.id, "frameRate", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">闈欓煶鎾斁</span>
              <button onClick={() => updateObjectConfig(obj.id, "mutePlayback", !obj.config.mutePlayback)} className={`w-9 h-5 rounded-full transition-colors ${obj.config.mutePlayback ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config.mutePlayback ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        )}
        {obj.type === "鍒楄〃" && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">瀛楁鏄犲皠锛圠ist&lt;Object&gt;锛屽惈 id/title/body锛?/p>
            {["idField", "titleField", "bodyField"].map(key => (
              <div key={key}>
                <span className="text-[10px] text-muted-foreground">{key === "idField" ? "ID鏄犲皠" : key === "titleField" ? "Title鏄犲皠" : "Body鏄犲皠"}</span>
                <input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
            ))}
          </div>
        )}
        {(obj.type === "娈佃惤" || obj.type === "瀵硅瘽") && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">瀛楁鏄犲皠锛圠ist&lt;Object&gt;锛屽惈 nameKey/textKey锛?/p>
            {["nameKey", "textKey"].map(key => (
              <div key={key}>
                <span className="text-[10px] text-muted-foreground">{key} 鏄犲皠瀛楁</span>
                <input value={obj.config[key] || ""} onChange={e => updateObjectConfig(obj.id, key, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-xs">娈佃惤涓婃柟鏄剧ず闊抽鎾斁鍣?/span>
              <button onClick={() => updateObjectConfig(obj.id, "showAudioPlayer", !obj.config.showAudioPlayer)} className={`w-9 h-5 rounded-full transition-colors ${obj.config.showAudioPlayer ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config.showAudioPlayer ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">浣跨敤瀵硅瘽寮忓竷灞€</span>
              <button onClick={() => updateObjectConfig(obj.id, "useDialogLayout", !obj.config.useDialogLayout)} className={`w-9 h-5 rounded-full transition-colors ${obj.config.useDialogLayout ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config.useDialogLayout ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        )}
        {obj.type === "鏃堕棿搴忓垪" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">鏃堕棿鍒楀瓧娈靛悕</span>
              <input value={obj.config.timeColumn || ""} onChange={e => updateObjectConfig(obj.id, "timeColumn", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏃堕棿瑙ｆ瀽鏍煎紡</span>
              <select value={obj.config.timeFormat} onChange={e => updateObjectConfig(obj.id, "timeFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option>%m/%d/%Y %H:%M:%S</option>
                <option>%Y-%m-%d %H:%M:%S.%f</option>
                <option>%Y%m%d%H%M%S</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">澶氶€氶亾</span>
              <button onClick={() => updateObjectConfig(obj.id, "multiChannel", !obj.config.multiChannel)} className={`w-9 h-5 rounded-full transition-colors ${obj.config.multiChannel ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${obj.config.multiChannel ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            {obj.config.multiChannel && (
              <div>
                <span className="text-xs text-muted-foreground">閫氶亾鏁伴噺</span>
                <input type="number" value={obj.config.channelCount || 1} onChange={e => updateObjectConfig(obj.id, "channelCount", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
              </div>
            )}
          </div>
        )}
        {obj.type === "PDF" && <p className="text-xs text-muted-foreground italic">PDF 鍙傛暟閰嶇疆寰呭畾</p>}
        {obj.type === "琛ㄦ牸" && <p className="text-[10px] text-muted-foreground">瀛楁鍊奸渶涓?JSON 绫诲瀷</p>}
      </div>
    </div>
  );

  // 鈹€鈹€鈹€ Render method property panel 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const renderMethodPanel = (mtd: MethodCard) => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4" /> 鏍囨敞鏂规硶灞炴€?- {mtd.type}</h4>

      {/* Basic info */}
      <div>
        <label className="text-xs text-muted-foreground">鏍囬 *</label>
        <input value={mtd.title} onChange={e => updateMethod(mtd.id, { title: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs">鏄惁蹇呭～</span>
        <button onClick={() => updateMethod(mtd.id, { required: !mtd.required })} className={`w-9 h-5 rounded-full transition-colors ${mtd.required ? "bg-primary" : "bg-muted"}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.required ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">鏍囨敞鍐呭鎻愮ず</label>
        <textarea value={mtd.hint} onChange={e => updateMethod(mtd.id, { hint: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1 resize-none" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">鍏宠仈鏍囨敞瀵硅薄 *</label>
        <select value={mtd.linkedObject} onChange={e => updateMethod(mtd.id, { linkedObject: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
          <option value="">璇烽€夋嫨</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.title} ({o.type})</option>)}
        </select>
      </div>

      {/* Dynamic params by method type */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2">鎵╁睍鍙傛暟</p>

        {/* 鍗曢€?/ 澶氶€?*/}
        {(mtd.type === "鍗曢€? || mtd.type === "澶氶€?) && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">閫夐」</span>
                <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `閫夐」${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 娣诲姞閫夐」</button>
              </div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" placeholder="閫夐」鍊? />
                  {mtd.config.enableAlias && <input value={opt.alias} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], alias: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="w-20 px-2 py-1 text-xs border rounded bg-background" placeholder="鍒悕" />}
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div>
              <span className="text-xs text-muted-foreground">蹇嵎閿ā寮?/span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">鍏抽棴蹇嵎閿?/option>
                <option value="auto">绯荤粺鑷姩鍒嗛厤</option>
                <option value="custom">鐢ㄦ埛鑷畾涔?/option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">寮€鍚€夐」鍒悕</span>
              <button onClick={() => updateMethodConfig(mtd.id, "enableAlias", !mtd.config.enableAlias)} className={`w-9 h-5 rounded-full transition-colors ${mtd.config.enableAlias ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config.enableAlias ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">榛樿鍊?/span>
              <select value={mtd.config.defaultValue || ""} onChange={e => updateMethodConfig(mtd.id, "defaultValue", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="">鏃?/option>
                {mtd.options.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">寮€鍚爣绛惧揩鎹锋悳绱?/span>
              <button onClick={() => updateMethodConfig(mtd.id, "enableSearch", !mtd.config.enableSearch)} className={`w-9 h-5 rounded-full transition-colors ${mtd.config.enableSearch ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config.enableSearch ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">鍏佽鏍囨敞閫夐」闂村叧绯?/span>
              <button onClick={() => updateMethodConfig(mtd.id, "allowRelation", !mtd.config.allowRelation)} className={`w-9 h-5 rounded-full transition-colors ${mtd.config.allowRelation ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config.allowRelation ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            {mtd.type === "澶氶€? && (
              <div>
                <span className="text-xs text-muted-foreground">閫夐」甯冨眬</span>
                <select value={mtd.config.optionLayout} onChange={e => updateMethodConfig(mtd.id, "optionLayout", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                  <option value="horizontal">姘村钩鍗曡鏄剧ず</option>
                  <option value="vertical">鍨傜洿鏄剧ず</option>
                  <option value="grid">缃戞牸鏄剧ず</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 杈撳叆妗?*/}
        {mtd.type === "杈撳叆妗? && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">榛樿鍊?/span>
              <input value={mtd.config.defaultValue || ""} onChange={e => updateMethodConfig(mtd.id, "defaultValue", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">杈撳叆鎻愮ず</span>
              <input value={mtd.config.placeholder || ""} onChange={e => updateMethodConfig(mtd.id, "placeholder", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" placeholder="璇疯緭鍏?.." />
            </div>
          </div>
        )}

        {/* 鐢荤瑪 */}
        {mtd.type === "鐢荤瑪" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">鐢荤瑪绫诲瀷</span>
              <div className="flex flex-wrap gap-1">
                {["绗斿埛", "妞渾妗?, "榄旀", "澶氳竟褰?, "鐭╁舰妗?, "鍚戦噺", "鍏抽敭鐐?].map(bt => {
                  const active = (mtd.config.brushTypes || []).includes(bt);
                  return (
                    <button key={bt} onClick={() => {
                      const cur = mtd.config.brushTypes || [];
                      updateMethodConfig(mtd.id, "brushTypes", active ? cur.filter((x: string) => x !== bt) : [...cur, bt]);
                    }} className={`px-2 py-1 text-[10px] rounded border ${active ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{bt}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">鏃犳爣绛炬爣娉?/span>
              <button onClick={() => updateMethodConfig(mtd.id, "noLabelAnnotation", !mtd.config.noLabelAnnotation)} className={`w-9 h-5 rounded-full transition-colors ${mtd.config.noLabelAnnotation ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config.noLabelAnnotation ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">鏍囩</span>
                <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `鏍囩${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 娣诲姞鏍囩</button>
              </div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" placeholder="鏍囩鍊? />
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏍囩绫诲瀷</span>
              <select value={mtd.config.labelType} onChange={e => updateMethodConfig(mtd.id, "labelType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="single">鍗曢€?/option>
                <option value="multi">澶氶€?/option>
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">蹇嵎閿ā寮?/span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">鍏抽棴蹇嵎閿?/option>
                <option value="auto">绯荤粺鑷姩鍒嗛厤</option>
                <option value="custom">鐢ㄦ埛鑷畾涔?/option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">鍏佽鏍囨敞閫夐」闂村叧绯?/span>
              <button onClick={() => updateMethodConfig(mtd.id, "allowRelation", !mtd.config.allowRelation)} className={`w-9 h-5 rounded-full transition-colors ${mtd.config.allowRelation ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config.allowRelation ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        )}

        {/* 璇勫垎 */}
        {mtd.type === "璇勫垎" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">鏈€澶у垎鍊?/span>
              <input type="number" value={mtd.config.maxScore} onChange={e => updateMethodConfig(mtd.id, "maxScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">榛樿鍒嗗€?/span>
              <input type="number" value={mtd.config.defaultScore} onChange={e => updateMethodConfig(mtd.id, "defaultScore", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">蹇嵎閿ā寮?/span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">鍏抽棴蹇嵎閿?/option>
                <option value="auto">绯荤粺鑷姩鍒嗛厤</option>
                <option value="custom">鐢ㄦ埛鑷畾涔?/option>
              </select>
            </div>
          </div>
        )}

        {/* 鎺掑簭 */}
        {mtd.type === "鎺掑簭" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">鎺掑簭绫诲瀷</span>
              <select value={mtd.config.sortType} onChange={e => updateMethodConfig(mtd.id, "sortType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="list">鍒楄〃妯″紡</option>
                <option value="bucket">妗舵ā寮?/option>
              </select>
            </div>
            {mtd.config.sortType === "bucket" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">閰嶇疆妗?/span>
                    <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `妗?{mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 娣诲姞妗?/button>
                  </div>
                  {mtd.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                      <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" placeholder="妗跺悕绉? />
                      <input value={opt.alias} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], alias: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="w-20 px-2 py-1 text-xs border rounded bg-background" placeholder="鍒悕" />
                      <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">榛樿妗?/span>
                  <select value={mtd.config.defaultBucket || ""} onChange={e => updateMethodConfig(mtd.id, "defaultBucket", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                    <option value="">鏃?/option>
                    {mtd.options.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* 姣旇緝 */}
        {mtd.type === "姣旇緝" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">姣斿椤癸紙鑷冲皯2涓瓧娈碉級</span>
                <button onClick={() => updateMethodConfig(mtd.id, "compareFields", [...(mtd.config.compareFields || []), `瀛楁${(mtd.config.compareFields || []).length + 1}`])} className="text-[10px] text-primary hover:underline">+ 娣诲姞</button>
              </div>
              {(mtd.config.compareFields || []).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={f} onChange={e => { const fields = [...mtd.config.compareFields]; fields[i] = e.target.value; updateMethodConfig(mtd.id, "compareFields", fields); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                  {(mtd.config.compareFields || []).length > 2 && <button onClick={() => updateMethodConfig(mtd.id, "compareFields", mtd.config.compareFields.filter((_: any, j: number) => j !== i))} className="p-0.5 text-destructive"><X className="w-3 h-3" /></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 鏍戝舰閫夋嫨 */}
        {mtd.type === "鏍戝舰閫夋嫨" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">閫夐」</span>
                <button onClick={() => updateMethod(mtd.id, { options: [...mtd.options, { value: `閫夐」${mtd.options.length + 1}`, alias: "", shortcut: "" }] })} className="text-[10px] text-primary hover:underline">+ 娣诲姞閫夐」</button>
              </div>
              {mtd.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input value={opt.value} onChange={e => { const opts = [...mtd.options]; opts[i] = { ...opts[i], value: e.target.value }; updateMethod(mtd.id, { options: opts }); }} className="flex-1 px-2 py-1 text-xs border rounded bg-background" />
                  <button onClick={() => updateMethod(mtd.id, { options: mtd.options.filter((_, j) => j !== i) })} className="p-0.5 text-destructive"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            {[
              { key: "expandAll", label: "榛樿灞曞紑鍏ㄩ儴" },
              { key: "flatten", label: "鏄惁骞抽摵" },
              { key: "leafOnly", label: "浠呭厑璁搁€変腑鍙跺瓙鑺傜偣" },
              { key: "enableSearch", label: "寮€鍚爣绛惧揩鎹锋悳绱? },
              { key: "enableAlias", label: "寮€鍚€夐」鍒悕" },
              { key: "allowRelation", label: "鍏佽鏍囨敞閫夐」闂村叧绯? },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <button onClick={() => updateMethodConfig(mtd.id, item.key, !mtd.config[item.key])} className={`w-9 h-5 rounded-full transition-colors ${mtd.config[item.key] ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config[item.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
            <div>
              <span className="text-xs text-muted-foreground">閫夐」绫诲瀷</span>
              <select value={mtd.config.optionType} onChange={e => updateMethodConfig(mtd.id, "optionType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="single">鍗曢€?/option>
                <option value="multi">澶氶€?/option>
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">蹇嵎閿ā寮?/span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">鍏抽棴蹇嵎閿?/option>
                <option value="auto">绯荤粺鑷姩鍒嗛厤</option>
                <option value="custom">鐢ㄦ埛鑷畾涔?/option>
              </select>
            </div>
          </div>
        )}

        {/* 閽㈢瑪閿氱偣 */}
        {mtd.type === "閽㈢瑪閿氱偣" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">閿氱偣澶у皬</span>
              <select value={mtd.config.pointSize} onChange={e => updateMethodConfig(mtd.id, "pointSize", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="small">灏?/option>
                <option value="medium">涓?/option>
                <option value="large">澶?/option>
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">閿氱偣鏍峰紡</span>
              <select value={mtd.config.pointStyle} onChange={e => updateMethodConfig(mtd.id, "pointStyle", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="circle">鍦嗗舰</option>
                <option value="rectangle">闀挎柟褰?/option>
              </select>
            </div>
            {[
              { key: "enableSnap", label: "寮€鍚惛闄? },
              { key: "enableBezier", label: "鍏佽璐濆灏旀洸绾? },
              { key: "enableSkeleton", label: "鍚敤楠ㄦ灦妯″紡" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs">{item.label}</span>
                <button onClick={() => updateMethodConfig(mtd.id, item.key, !mtd.config[item.key])} className={`w-9 h-5 rounded-full transition-colors ${mtd.config[item.key] ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${mtd.config[item.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">鏈€灏忛敋鐐规暟 (-1=涓嶉檺)</span>
                <input type="number" value={mtd.config.minPoints} onChange={e => updateMethodConfig(mtd.id, "minPoints", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">鏈€澶ч敋鐐规暟 (-1=涓嶉檺)</span>
                <input type="number" value={mtd.config.maxPoints} onChange={e => updateMethodConfig(mtd.id, "maxPoints", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* 鏃堕棿閫夋嫨 */}
        {mtd.type === "鏃堕棿閫夋嫨" && (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">鏃ユ湡绫诲瀷</span>
              <select value={mtd.config.dateType} onChange={e => updateMethodConfig(mtd.id, "dateType", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="date">鏃ユ湡 (yyyy/mm/dd)</option>
                <option value="datetime">鏃ユ湡鏃堕棿</option>
                <option value="year">骞翠唤</option>
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏃ユ湡鏍煎紡鍖?(strftime)</span>
              <input value={mtd.config.dateFormat} onChange={e => updateMethodConfig(mtd.id, "dateFormat", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" placeholder="%Y-%m-%d %H-%M" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏈€灏忔椂闂?(ISO)</span>
              <input value={mtd.config.minTime} onChange={e => updateMethodConfig(mtd.id, "minTime", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" placeholder="2026-01-28T15:30:45" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">鏈€澶ф椂闂?(ISO)</span>
              <input value={mtd.config.maxTime} onChange={e => updateMethodConfig(mtd.id, "maxTime", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1" placeholder="2026-12-31T23:59:59" />
            </div>
          </div>
        )}

        {/* 鏁板瓧閫夋嫨 */}
        {mtd.type === "鏁板瓧閫夋嫨" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">鏈€灏忓€?/span>
                <input type="number" value={mtd.config.min} onChange={e => updateMethodConfig(mtd.id, "min", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">鏈€澶у€?/span>
                <input type="number" value={mtd.config.max} onChange={e => updateMethodConfig(mtd.id, "max", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">姝ラ暱</span>
                <input type="number" value={mtd.config.step} onChange={e => updateMethodConfig(mtd.id, "step", Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-background mt-0.5" />
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">蹇嵎閿ā寮?/span>
              <select value={mtd.config.shortcutMode} onChange={e => updateMethodConfig(mtd.id, "shortcutMode", e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-background mt-1">
                <option value="off">鍏抽棴蹇嵎閿?/option>
                <option value="auto">绯荤粺鑷姩鍒嗛厤</option>
                <option value="custom">鐢ㄦ埛鑷畾涔?/option>
              </select>
            </div>
          </div>
        )}

        {/* 瓒呮枃鏈?/ 鏃堕棿搴忓垪 labels */}
        {(mtd.type === "閽㈢瑪閿氱偣" || mtd.type === "瑙嗛杩借釜") ? null : null}
        {/* 瑙嗛杩借釜 */}
        {mtd.type === "瑙嗛杩借釜" && <p className="text-xs text-muted-foreground italic">瑙嗛杩借釜鍙傛暟閰嶇疆锛堝抚鐜囥€佽拷韪洰鏍囩瓑锛?/p>}
      </div>
    </div>
  );

  // 鈹€鈹€鈹€ Render method card preview 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const renderMethodCardContent = (mtd: MethodCard) => {
    const Icon = methodTypes.find(m => m.type === mtd.type)?.icon || CheckCircle2;
    if (mtd.options.length === 0 && !["杈撳叆妗?, "璇勫垎", "鏁板瓧閫夋嫨", "鏃堕棿閫夋嫨", "姣旇緝", "鎺掑簭"].includes(mtd.type)) {
      return <p className="text-[10px] text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 鏈厤缃€夐」</p>;
    }
    switch (mtd.type) {
      case "鍗曢€?:
        return <div className="space-y-1">{mtd.options.map(o => <label key={o.value} className="flex items-center gap-2 text-xs"><input type="radio" name={mtd.id} disabled />{mtd.config.enableAlias && o.alias ? o.alias : o.value}</label>)}</div>;
      case "澶氶€?:
        return <div className="space-y-1">{mtd.options.map(o => <label key={o.value} className="flex items-center gap-2 text-xs"><input type="checkbox" disabled />{mtd.config.enableAlias && o.alias ? o.alias : o.value}</label>)}</div>;
      case "杈撳叆妗?:
        return <textarea disabled rows={2} placeholder={mtd.config.placeholder || "璇疯緭鍏?.."} className="w-full px-2 py-1 text-xs border rounded bg-muted/20 resize-none" />;
      case "璇勫垎":
        return <div className="flex gap-0.5">{Array.from({ length: mtd.config.maxScore || 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (mtd.config.defaultScore || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}</div>;
      case "鏁板瓧閫夋嫨":
        return <div className="flex items-center gap-2"><input type="number" disabled value={mtd.config.min} className="w-20 px-2 py-1 text-xs border rounded bg-muted/20" /><span className="text-[10px] text-muted-foreground">鑼冨洿: {mtd.config.min} ~ {mtd.config.max}</span></div>;
      case "鏃堕棿閫夋嫨":
        return <input type="date" disabled className="px-2 py-1 text-xs border rounded bg-muted/20" />;
      case "鐢荤瑪":
        return <div className="flex gap-1 flex-wrap">{(mtd.config.brushTypes || []).map((bt: string) => <span key={bt} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]">{bt}</span>)}{mtd.options.length === 0 && !mtd.config.noLabelAnnotation && <span className="text-[10px] text-muted-foreground">鏃犳爣绛?/span>}</div>;
      case "鎺掑簭":
        return <p className="text-xs text-muted-foreground">{mtd.config.sortType === "list" ? "鎷栨嫿鍒楄〃鎺掑簭" : `妗舵ā寮?路 ${mtd.options.length}涓《`}</p>;
      case "姣旇緝":
        return <div className="flex gap-1">{(mtd.config.compareFields || []).map((f: string, i: number) => <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{f}</span>)}</div>;
      case "鏍戝舰閫夋嫨":
        return <p className="text-xs text-muted-foreground">{mtd.options.length} 涓€夐」 路 {mtd.config.optionType === "multi" ? "澶氶€? : "鍗曢€?}</p>;
      default:
        return <p className="text-xs text-muted-foreground">{mtd.type}閰嶇疆</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* 鈹€鈹€鈹€ Top bar 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      <div className="h-12 border-b bg-card flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate("/data-annotation/tools")} className="p-1.5 rounded hover:bg-muted/50"><ArrowLeft className="w-4 h-4" /></button>
        <span className="text-sm font-medium">{toolId ? "缂栬緫鏍囨敞宸ュ叿" : "鏂板缓鏍囨敞宸ュ叿"}</span>
        <div className="flex-1" />

        {/* Top tabs */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          {[
            { key: "objects", label: "鏍囨敞瀵硅薄", icon: Layers },
            { key: "methods", label: "鏍囨敞鏂规硶", icon: MousePointer },
            { key: "test", label: "娴嬭瘯闆?, icon: FileText },
            { key: "layout", label: "甯冨眬", icon: Layout },
            { key: "preview", label: "棰勮", icon: Eye },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 ${activeTab === t.key ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />
        <button onClick={() => setShowTemplateImport(true)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">寮曠敤妯℃澘</button>
        <button onClick={() => setShowCodeEditor(true)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center gap-1"><Code className="w-3.5 h-3.5" /> 浠ｇ爜</button>
        <button onClick={() => setShowSaveModal(true)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1"><Save className="w-3.5 h-3.5" /> 淇濆瓨</button>
      </div>

      {/* 鈹€鈹€鈹€ Main content 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === "objects" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">鏍囨敞瀵硅薄鍗＄墖</h3>
                <button onClick={() => setShowObjectPicker(true)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> 娣诲姞瀵硅薄</button>
              </div>
              {objects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Layers className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">鏆傛棤鏍囨敞瀵硅薄</p>
                  <p className="text-xs mt-1">璇峰厛閰嶇疆娴嬭瘯闆?鈫?鍐嶆坊鍔犳爣娉ㄥ璞?鈫?鍦ㄥ彸渚ч厤缃睘鎬?/p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {objects.map(obj => {
                    const Icon = objectTypes.find(o => o.type === obj.type)?.icon || FileText;
                    const isSelected = panelTarget?.kind === "object" && panelTarget.id === obj.id;
                    return (
                      <div key={obj.id} onClick={() => setPanelTarget({ kind: "object", id: obj.id })}
                        className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                            <div>
                              <p className="text-sm font-medium">{obj.title}</p>
                              <p className="text-[10px] text-muted-foreground">{obj.type}</p>
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeObject(obj.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {!obj.testField ? (
                          <p className="text-[10px] text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 璇烽厤缃祴璇曢泦瀛楁</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">瀛楁: {obj.testField}</p>
                        )}
                        {obj.hint && <p className="text-[10px] text-muted-foreground mt-1 truncate">{obj.hint}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "methods" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">鏍囨敞鏂规硶鍗＄墖</h3>
                <button onClick={() => setShowMethodPicker(true)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> 娣诲姞鏂规硶</button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground">甯冨眬浣嶇疆:</span>
                {(["top", "bottom", "left", "right"] as const).map(pos => (
                  <button key={pos} onClick={() => setMethodLayout(pos)} className={`px-2 py-1 text-[10px] rounded border ${methodLayout === pos ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>
                    {pos === "top" ? "涓婃柟" : pos === "bottom" ? "涓嬫柟" : pos === "left" ? "宸︿晶" : "鍙充晶"}
                  </button>
                ))}
              </div>
              {methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <MousePointer className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">鏆傛棤鏍囨敞鏂规硶</p>
                  <p className="text-xs mt-1">娣诲姞鏍囨敞鏂规硶鏉ュ畾涔夋爣娉ㄤ氦浜掓柟寮?/p>
                </div>
              ) : (
                <div className="space-y-3">
                  {methods.map(mtd => {
                    const Icon = methodTypes.find(m => m.type === mtd.type)?.icon || CheckCircle2;
                    const isSelected = panelTarget?.kind === "method" && panelTarget.id === mtd.id;
                    return (
                      <div key={mtd.id} onClick={() => setPanelTarget({ kind: "method", id: mtd.id })}
                        className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-accent/50 flex items-center justify-center"><Icon className="w-4 h-4 text-foreground" /></div>
                            <div>
                              <p className="text-sm font-medium">{mtd.title}{mtd.required && <span className="text-destructive ml-1">*</span>}</p>
                              <p className="text-[10px] text-muted-foreground">{mtd.type}</p>
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeMethod(mtd.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {renderMethodCardContent(mtd)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "test" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-3">娴嬭瘯闆嗙鐞?/h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">鍔犺浇棰勭疆鏍蜂緥:</span>
                {Object.keys(mockTestDataPresets).map(key => (
                  <button key={key} onClick={() => { setTestData(mockTestDataPresets[key]); setTestDataPreset(key); }} className={`px-2 py-1 text-[10px] rounded border ${testDataPreset === key ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/50"}`}>{key}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-2">杈撳叆 JSON 鏍煎紡鐨?mock 鏁版嵁锛屾垨瀵煎叆宸叉湁鏁版嵁闆嗙殑绗竴鏉℃暟鎹?/p>
              <textarea value={testData} onChange={e => setTestData(e.target.value)} rows={16} className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-background resize-none" placeholder='{"text": "绀轰緥鏂囨湰鍐呭..."}' />
              <div className="flex gap-2 mt-3">
                <button onClick={() => toast.info("浠庢暟鎹泦瀵煎叆绗竴鏉℃暟鎹?)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> 浠庢暟鎹泦瀵煎叆</button>
                <button onClick={() => { try { JSON.parse(testData); toast.success("JSON 鏍煎紡鏍￠獙閫氳繃"); } catch { toast.error("JSON 鏍煎紡閿欒"); } }} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted/50">鏍￠獙 JSON</button>
              </div>
            </div>
          )}

          {activeTab === "layout" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-4">鍙鍖栭厤缃?/h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs text-muted-foreground">甯冨眬妯″紡</label>
                  <select className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1">
                    <option>寮规€у竷灞€ (Flex)</option>
                    <option>鏍呮牸甯冨眬 (Grid)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">鏍囨敞鏂规硶浣嶇疆</label>
                  <select value={methodLayout} onChange={e => setMethodLayout(e.target.value as any)} className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1">
                    <option value="right">鏍囨敞瀵硅薄鍙充晶</option>
                    <option value="bottom">鏍囨敞瀵硅薄涓嬫柟</option>
                    <option value="left">鏍囨敞瀵硅薄宸︿晶</option>
                    <option value="top">鏍囨敞瀵硅薄涓婃柟</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">鍗＄墖鏍峰紡</label>
                  <select className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background mt-1">
                    <option>榛樿鍗＄墖</option>
                    <option>绱у噾鍗＄墖</option>
                    <option>瀹芥澗鍗＄墖</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-4">浜や簰寮忛瑙?/h3>
              {objects.length === 0 && methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Eye className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">璇峰厛娣诲姞鏍囨敞瀵硅薄鍜屾爣娉ㄦ柟娉?/p>
                </div>
              ) : (
                <div className={`border rounded-lg p-4 bg-card ${methodLayout === "right" || methodLayout === "left" ? "flex gap-4" : "space-y-4"}`}>
                  {(methodLayout === "left" || methodLayout === "top") && methods.length > 0 && (
                    <div className={methodLayout === "left" ? "w-64 shrink-0 space-y-3" : "space-y-3"}>
                      <p className="text-xs font-medium text-muted-foreground">鏍囨敞鏂规硶</p>
                      {methods.map(mtd => (
                        <div key={mtd.id} className="border rounded p-3">
                          <p className="text-xs font-medium mb-1">{mtd.title}{mtd.required && <span className="text-destructive">*</span>}</p>
                          {renderMethodCardContent(mtd)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">鏍囨敞瀵硅薄</p>
                    {objects.map(obj => {
                      let previewContent;
                      try {
                        const data = JSON.parse(testData);
                        previewContent = obj.testField && data[obj.testField] ? String(data[obj.testField]) : null;
                      } catch { previewContent = null; }
                      return (
                        <div key={obj.id} className="border rounded p-4">
                          <p className="text-xs font-medium mb-2">{obj.title}</p>
                          {obj.hint && <p className="text-[10px] text-muted-foreground mb-2">{obj.hint}</p>}
                          {previewContent ? (
                            <div className="p-3 rounded bg-muted/20 text-sm">{previewContent}</div>
                          ) : (
                            <div className="p-3 rounded bg-muted/20 text-xs text-muted-foreground text-center">鍏堥厤缃祴璇曢泦 鈫?鍙充晶閰嶇疆娴嬭瘯闆嗗瓧娈?鈫?灞曠ず鏁堟灉</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(methodLayout === "right" || methodLayout === "bottom") && methods.length > 0 && (
                    <div className={methodLayout === "right" ? "w-64 shrink-0 space-y-3" : "space-y-3"}>
                      <p className="text-xs font-medium text-muted-foreground">鏍囨敞鏂规硶</p>
                      {methods.map(mtd => (
                        <div key={mtd.id} className="border rounded p-3">
                          <p className="text-xs font-medium mb-1">{mtd.title}{mtd.required && <span className="text-destructive">*</span>}</p>
                          {renderMethodCardContent(mtd)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Property panel */}
        <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4">
            {!selectedObject && !selectedMethod && (
              <div className="text-center py-12 text-muted-foreground">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">閫夋嫨鍗＄墖鏌ョ湅灞炴€ч厤缃?/p>
              </div>
            )}
            {selectedObject && renderObjectPanel(selectedObject)}
            {selectedMethod && renderMethodPanel(selectedMethod)}
          </div>
        </div>
      </div>

      {/* 鈹€鈹€鈹€ Object picker modal 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      {showObjectPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">閫夋嫨鏍囨敞瀵硅薄</h3>
              <button onClick={() => { setShowObjectPicker(false); setSelectedObjTypes([]); }} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">鏀寔澶氶€夛紝鐐瑰嚮鐢熸垚鏍囨敞瀵硅薄鍗＄墖</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {objectTypes.map(ot => {
                const selected = selectedObjTypes.includes(ot.type);
                return (
                  <button key={ot.type} onClick={() => setSelectedObjTypes(prev => selected ? prev.filter(t => t !== ot.type) : [...prev, ot.type])}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${selected ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/30"}`}>
                    <ot.icon className="w-5 h-5" />
                    <span>{ot.type}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowObjectPicker(false); setSelectedObjTypes([]); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">鍙栨秷</button>
              <button onClick={addObjects} disabled={selectedObjTypes.length === 0} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">鐢熸垚鍗＄墖 ({selectedObjTypes.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* 鈹€鈹€鈹€ Method picker modal 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      {showMethodPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">閫夋嫨鏍囨敞鏂规硶</h3>
              <button onClick={() => { setShowMethodPicker(false); setSelectedMethodTypes([]); }} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">鏀寔澶氶€夛紝鐐瑰嚮鐢熸垚鏍囨敞鏂规硶鍗＄墖</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {methodTypes.map(mt => {
                const selected = selectedMethodTypes.includes(mt.type);
                return (
                  <button key={mt.type} onClick={() => setSelectedMethodTypes(prev => selected ? prev.filter(t => t !== mt.type) : [...prev, mt.type])}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${selected ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted/30"}`}>
                    <mt.icon className="w-5 h-5" />
                    <span>{mt.type}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowMethodPicker(false); setSelectedMethodTypes([]); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">鍙栨秷</button>
              <button onClick={addMethods} disabled={selectedMethodTypes.length === 0} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">鐢熸垚鍗＄墖 ({selectedMethodTypes.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* 鈹€鈹€鈹€ Save modal 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">淇濆瓨鏍囨敞宸ュ叿</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">宸ュ叿鍚嶇О *</label>
                <input value={toolName} onChange={e => setToolName(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background mt-1" placeholder="杈撳叆宸ュ叿鍚嶇О" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">宸ュ叿绫诲瀷</label>
                <select value={toolType} onChange={e => setToolType(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background mt-1">
                  {["鏂囨湰绫?, "鍥惧儚绫?, "闊抽绫?, "瑙嗛绫?, "琛ㄦ牸绫?, "璺ㄦā鎬佺被"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">宸ュ叿鎻忚堪</label>
                <textarea value={toolDesc} onChange={e => setToolDesc(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border rounded-lg bg-background mt-1 resize-none" placeholder="鎻忚堪宸ュ叿鐨勫姛鑳藉拰鐢ㄩ€? />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">宸ュ叿灏侀潰鍥炬爣</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <button className="text-xs text-primary hover:underline">涓婁紶鍥剧墖</button>
                    <span className="text-xs text-muted-foreground mx-2">鎴?/span>
                    <button className="text-xs text-primary hover:underline">AI 鐢熸垚</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">鍙栨秷</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">淇濆瓨</button>
            </div>
          </div>
        </div>
      )}

      {/* 鈹€鈹€鈹€ Template import modal 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      {showTemplateImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">寮曠敤宸叉湁妯℃澘</h3>
              <button onClick={() => setShowTemplateImport(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">寮曠敤鍚庡皢娓呯┖褰撳墠鐢诲竷閰嶇疆锛屼娇鐢ㄦā鏉跨殑鏍囨敞瀵硅薄鍜屾柟娉曢厤缃€?/p>
            <div className="space-y-2 mb-4">
              {["鏂囨湰鍒嗙被鏍囨敞妯℃澘", "鍥惧儚妫€娴嬫爣娉ㄦā鏉?, "NER瀹炰綋鏍囨敞妯℃澘"].map(tpl => (
                <button key={tpl} onClick={handleTemplateImport} className="w-full text-left px-3 py-2 text-sm rounded-lg border hover:bg-muted/30">{tpl}</button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowTemplateImport(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">鍙栨秷</button>
            </div>
          </div>
        </div>
      )}

      {/* 鈹€鈹€鈹€ Code editor modal 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      {showCodeEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">浠ｇ爜閰嶇疆</h3>
              <button onClick={() => setShowCodeEditor(false)} className="p-1 rounded hover:bg-muted/50"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">閫氳繃浠ｇ爜鑷畾涔夋爣娉ㄧ粍浠朵笌浜や簰閫昏緫</p>
            <textarea value={JSON.stringify({ objects: objects.map(o => ({ type: o.type, title: o.title, testField: o.testField, config: o.config })), methods: methods.map(m => ({ type: m.type, title: m.title, required: m.required, config: m.config, options: m.options })), layout: methodLayout }, null, 2)} readOnly rows={20} className="flex-1 w-full px-3 py-2 text-xs font-mono border rounded-lg bg-background resize-none" />
            <div className="flex justify-end mt-3">
              <button onClick={() => setShowCodeEditor(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">鍏抽棴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolEditor;

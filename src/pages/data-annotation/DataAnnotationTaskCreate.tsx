import { useState, useCallback, useEffect, useMemo } from "react";
import { marked } from "marked";
import {
  ArrowLeft, Check, ChevronRight, Plus, X, Trash2, Upload, Eye, Info, Search,
  AlertTriangle, FileText, Settings, Users, Shield, BookOpen, Zap, ChevronDown, ChevronUp,
  Database, Type, Image, Mic, Video, Table2, Layers, Loader2, Save,
  Brain, MousePointer2, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  useMLModelStore,
  type MLModel,
  type ModelModality,
} from "@/stores/useMLModelStore";
import { useTaskPreannotationStore } from "@/stores/useTaskPreannotationStore";
import { ANNOTATION_TASK_TYPES } from "@/constants/annotationTaskTypes";

/* ─── Project types ─── */
const projectTypes = [
  { category: "文本类", icon: Type, color: "bg-blue-100 text-blue-700", sub: ["文本", "对话", "超文本", "列表", "段落", "时间序列"] },
  { category: "图像类", icon: Image, color: "bg-green-100 text-green-700", sub: ["图像", "PDF"] },
  { category: "音频类", icon: Mic, color: "bg-amber-100 text-amber-700", sub: ["音频"] },
  { category: "视频类", icon: Video, color: "bg-purple-100 text-purple-700", sub: ["视频"] },
  { category: "表格类", icon: Table2, color: "bg-cyan-100 text-cyan-700", sub: ["表格", "时间序列"] },
  { category: "跨模态类", icon: Layers, color: "bg-rose-100 text-rose-700", sub: ["文本", "图像", "音频", "视频"] },
];

const myMockDatasets = [
  { id: "DS-001", name: "金融新闻语料库", type: "文本类", files: 12500, size: "2.3GB", creator: "张明", versions: ["v1.0", "v1.1", "v2.0"], fields: [{ name: "content", example: "近日，某金融大模型正式发布..." }, { name: "title", example: "金融科技新突破" }, { name: "author", example: "财联社" }] },
  { id: "DS-002", name: "医疗CT影像集", type: "图像类", files: 5000, size: "45GB", creator: "李芳", versions: ["v1.0"], fields: [{ name: "image_url", example: "oss://bucket/ct_001.png" }, { name: "patient_id", example: "P_1025" }] },
  { id: "DS-003", name: "客服对话数据", type: "文本类", files: 20000, size: "850MB", creator: "王强", versions: ["v1.0", "v2.0"], fields: [{ name: "dialogue", example: "用户: 你好，卡注销了... 客服: 您好..." }, { name: "session_id", example: "S_9912" }] },
  { id: "DS-004", name: "语音采集样本", type: "音频类", files: 3000, size: "12GB", creator: "赵丽", versions: ["v1.0"], fields: [{ name: "audio_path", example: "/data/audio/rec_001.wav" }, { name: "duration", example: "12.5s" }] },
  { id: "DS-005", name: "短视频素材集", type: "视频类", files: 1500, size: "120GB", creator: "孙伟", versions: ["v1.0"], fields: [{ name: "video_url", example: "https://cdn.com/v_123.mp4" }, { name: "frame_count", example: "1500" }] },
];

const subscribedMockDatasets = [
  { id: "DS-S001", name: "金融新闻语料库 (订购)", type: "文本类", files: 12500, size: "15.2GB", creator: "数据市场官方", versions: ["V3.0", "V2.0"], fields: [{ name: "article_text", example: "市场情绪持续回升..." }, { name: "stock_code", example: "SH600519" }] },
  { id: "DS-S002", name: "开源医学影像数据集", type: "图像类", files: 5000, size: "89.5GB", creator: "医疗AI实验室", versions: ["V3.0", "V1.0"], fields: [{ name: "dicom_path", example: "oss://med/dicom/001.dcm" }, { name: "diagnosis", example: "Pneumonia" }] },
];

const sharedMockDatasets = [
  { id: "DS-H001", name: "内部标注训练集 (共享)", type: "文本类", files: 12500, size: "3.5GB", creator: "王强", versions: ["V2.0"], fields: [{ name: "raw_text", example: "这是需要标注的原始文本..." }] },
  { id: "DS-H002", name: "产品图像分类数据集", type: "图像类", files: 5000, size: "18.7GB", creator: "赵丽", versions: ["V3.0", "V2.0", "V1.0"], fields: [{ name: "source_img", example: "path/to/prod_001.jpg" }, { name: "category", example: "电子产" }] },
];

const mockToolsMap: Record<string, string> = {
  "文本类": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=225&fit=crop",
  "图像类": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=225&fit=crop",
  "音频类": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=225&fit=crop",
  "视频类": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
  "表格类": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop",
  "跨模态类": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop"
};

const [tt0, tt1, tt2, tt3, tt4, tt5, tt6] = ANNOTATION_TASK_TYPES;

const mockTools = [
  { id: "TL-001", name: "通用文本分类器", type: "文本类", isPreset: true, desc: "支持对纯文本、超文本内容进行多标签分类标注，适用于舆情分析与内容审核。", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&h=225&fit=crop", objects: [{ name: tt0, methods: ["标签"] }] },
  { id: "TL-002", name: "复杂文档与实体挖掘工具", type: "文本类", isPreset: true, desc: "针对段落、对话等复杂文本结构进行实体挖掘与关系标注。支持多级标签组联动。", image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=225&fit=crop", objects: [{ name: tt1, methods: ["标签"] }, { name: tt2, methods: ["标签"] }] },
  { id: "TL-003", name: "图像目标检测插件", type: "图像类", isPreset: true, desc: "支持矩形框、多边形标注。内置智能回归算法，提升目标定位精准度。", image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=225&fit=crop", objects: [{ name: tt3, methods: ["矩形框", "标签"] }] },
  { id: "TL-004", name: "PDF版面分析高级版", type: "图像类", isPreset: true, desc: "提供PDF像素级的超高精度标注能力，支持对PDF内的文本块、图片块独立进行属性定义。", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop", objects: [{ name: tt4, methods: ["多边形", "标签"] }] },
  { id: "TL-005", name: "ASR语音转写工具", type: "音频类", isPreset: true, desc: "专为长语音和大规模私有化部署设计，支持中英文混说，解析音频文件的内容、角色及情感。", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=225&fit=crop", objects: [{ name: tt5, methods: ["转写", "标签"] }] },
  { id: "TL-006", name: "视频对象追踪系统", type: "视频类", isPreset: true, desc: "在连续视频帧流中实现目标位置追踪与关键帧属性插值，支持复杂运动轨迹修正。", image: "https://images.unsplash.com/photo-1492691523567-6170c3af93db?w=400&h=225&fit=crop", objects: [{ name: tt6, methods: ["矩形框", "标签"] }] },
  { id: "TL-007", name: "金融指标提取助理", type: "表格类", isPreset: true, desc: "专注于对结构化表格及动态时间序列数据进行精细化属性标注，确保事实正确性。", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=225&fit=crop", objects: [{ name: tt0, methods: ["标签"] }, { name: tt1, methods: ["标签"] }] },
];

const mockUsers = [
  { name: "张明", account: "zhangming@hub.com" },
  { name: "李芳", account: "lifang@hub.com" },
  { name: "王强", account: "wangqiang@hub.com" },
  { name: "赵丽", account: "zhaoli@hub.com" },
  { name: "孙伟", account: "sunwei@hub.com" },
  { name: "周杰", account: "zhoujie@hub.com" },
  { name: "刘洋", account: "liuyang@hub.com" },
  { name: "陈思", account: "chensi@hub.com" },
  { name: "黄磊", account: "huanglei@hub.com" },
  { name: "吴敏", account: "wumin@hub.com" },
];

interface User { name: string; account: string; }
interface PersonGroup { id: string; name: string; persons: User[]; batchLimit: number; }
interface TaskTypeModelBinding {
  taskType: string;
  modelId: string;
  versionId: string;
}

const mockVocabularyByTaskType: Record<string, string[]> = {
  [tt0]: ["positive", "negative", "neutral", "question"],
  [tt1]: ["summary", "risk", "fact", "opinion"],
  [tt2]: ["PER", "LOC", "ORG", "MISC"],
  [tt3]: ["car", "person", "traffic-light", "lane"],
  [tt4]: ["title", "table", "figure", "paragraph"],
  [tt5]: ["speech", "music", "noise", "silence"],
  [tt6]: ["vehicle", "pedestrian", "event", "background"],
};

/** 无任务标签时词汇映射表里用于演示展示的默认行 */
const VOCABULARY_MODAL_FALLBACK_TASK_LABELS = ["正面", "负面", "中性"];

/** 词汇映射弹窗中回填的演示数据（与模型输出标签对齐） */
const VOCABULARY_MAPPING_DEMOS: Record<string, string> = {
  正面: "positive",
  负面: "negative",
  中性: "neutral",
  人名: "PER",
  地名: "LOC",
  动物: "ANIMAL_ORG",
};

interface Props { onBack: () => void; }

const DataAnnotationTaskCreate = ({ onBack }: Props) => {
  const [step, setStep] = useState(0);
  const steps = ["基础信息", "数据集配置", "标注工具", "任务配置", "标注规范", "发布确认"];

  // Step 0: Basic info
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState("标注");

  // Step 1: Dataset
  const [selectedDatasets, setSelectedDatasets] = useState<{ id: string; version: string }[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetTab, setDatasetTab] = useState(0); // 0: 我的, 1: 订购, 2: 分享

  // Step 2: Tool
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolTab, setToolTab] = useState(0); // 0: 我的, 1: 市场
  const [toolCategory, setToolCategory] = useState("all");
  const [toolSearch, setToolSearch] = useState("");
  const [annotationFields, setAnnotationFields] = useState<Record<string, string>>({});
  const [objectLabels, setObjectLabels] = useState<Record<string, { value: string; color: string }[]>>({});
  const [labelMode, setLabelMode] = useState<"single" | "multi">("single");

  // Step 3: Task config
  const [batchMode, setBatchMode] = useState<"dataset" | "count" | "single">("dataset");
  const [batchSize, setBatchSize] = useState(100);
  const [samplingOrder, setSamplingOrder] = useState<"original" | "random">("original");
  const [assignMode, setAssignMode] = useState<"person" | "team" | "pool">("person");
  const [personGroups, setPersonGroups] = useState<PersonGroup[]>([
    { id: "g-" + Date.now(), name: "分组 1", persons: [{ name: "张明", account: "zhangming@hub.com" }], batchLimit: 5 }
  ]);
  const [qaEnabled, setQaEnabled] = useState(false);
  const [qaNodes, setQaNodes] = useState<{
    persons: string[];
    method: string;
    batchRatio: number;
    dataRatio: number;
  }[]>([{ persons: ["王强"], method: "batch", batchRatio: 100, dataRatio: 30 }]);
  const [acceptEnabled, setAcceptEnabled] = useState(false);
  const [acceptNodes, setAcceptNodes] = useState<{
    persons: string[];
    method: string;
    batchRatio: number;
    dataRatio: number;
  }[]>([{ persons: ["李芳"], method: "batch", batchRatio: 100, dataRatio: 20 }]);
  const [managers, setManagers] = useState<string[]>([]);
  const [maxSkip, setMaxSkip] = useState(20);

  const allModels = useMLModelStore((s) => s.models);
  const dispatchPreannotation = useTaskPreannotationStore((s) => s.dispatch);

  const categoryModality: ModelModality | undefined = selectedCategory as ModelModality | undefined;
  const availableModels = useMemo<MLModel[]>(() => {
    if (!categoryModality) return [];
    return allModels.filter(
      (m) => m.modality === categoryModality || m.modality === "跨模态类"
    );
  }, [allModels, categoryModality]);

  const defaultModelForCategory = useMemo<MLModel | undefined>(() => {
    return availableModels[0];
  }, [availableModels]);

  const [preannotationEnabled, setPreannotationEnabled] = useState(true);
  const [interactiveEnabled, setInteractiveEnabled] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [autoAccept, setAutoAccept] = useState(false);
  const [taskTypeBindings, setTaskTypeBindings] = useState<TaskTypeModelBinding[]>([]);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [sourceLabelSearch, setSourceLabelSearch] = useState("");
  const [taskLabelMappings, setTaskLabelMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedCategory) return;
    if (!availableModels.length) {
      setSelectedModelId("");
      setPreannotationEnabled(false);
      setInteractiveEnabled(false);
      return;
    }
    const current = availableModels.find((m) => m.id === selectedModelId);
    if (!current && defaultModelForCategory) {
      setSelectedModelId(defaultModelForCategory.id);
      setConfidenceThreshold(0.6);
      if (!defaultModelForCategory.supportsBatch) setPreannotationEnabled(false);
      if (!defaultModelForCategory.supportsInteractive) setInteractiveEnabled(false);
    }
  }, [selectedCategory, availableModels, defaultModelForCategory, selectedModelId]);

  const selectedToolData = useMemo(() => mockTools.find((t) => t.id === selectedTool), [selectedTool]);
  const selectedToolTaskTypes = useMemo(
    () => Array.from(new Set((selectedToolData?.objects || []).map((obj) => obj.name))),
    [selectedToolData]
  );

  const taskLabels = useMemo(() => {
    return Object.values(objectLabels)
      .flat()
      .map((x) => x.value)
      .filter(Boolean);
  }, [objectLabels]);

  const bindingCandidates = useMemo(() => {
    return availableModels.flatMap((m) =>
      m.versions.map((v) => ({
        key: `${m.id}:${v.id}`,
        modelId: m.id,
        modelName: m.name,
        versionId: v.id,
        version: v.version,
        taskTypes: m.taskTypes,
        modality: m.modality,
        labelScope: m.labelScope,
        vocabularyMappings: v.vocabularyMappings,
      }))
    );
  }, [availableModels]);

  const sourceLabels = useMemo(() => {
    const labels = new Set<string>();
    taskTypeBindings.forEach((binding) => {
      const candidate = bindingCandidates.find(
        (x) => x.modelId === binding.modelId && x.versionId === binding.versionId
      );
      candidate?.vocabularyMappings.forEach((item) => labels.add(item.sourceLabel));
      if (candidate && candidate.vocabularyMappings.length === 0) {
        (mockVocabularyByTaskType[binding.taskType] || []).forEach((x) => labels.add(x));
      }
    });
    if (labels.size === 0 && taskTypeBindings.length > 0) {
      taskTypeBindings.forEach((binding) => {
        (mockVocabularyByTaskType[binding.taskType] || []).forEach((x) => labels.add(x));
      });
    }
    if (labels.size === 0) {
      ["positive", "negative", "neutral"].forEach((x) => labels.add(x));
    }
    return Array.from(labels);
  }, [taskTypeBindings, bindingCandidates]);

  /** 新建任务未完成标签配置时词汇映射仍可展示演示行 */
  const vocabularyModalTaskLabels =
    taskLabels.length > 0 ? taskLabels : VOCABULARY_MODAL_FALLBACK_TASK_LABELS;

  useEffect(() => {
    if (!showVocabularyModal || sourceLabels.length === 0) return;
    setTaskLabelMappings((prev) => {
      const next = { ...prev };
      vocabularyModalTaskLabels.forEach((label, idx) => {
        if (!next[label]?.trim()) {
          next[label] =
            VOCABULARY_MAPPING_DEMOS[label] ||
            sourceLabels[idx % sourceLabels.length] ||
            "";
        }
      });
      return next;
    });
  }, [showVocabularyModal, sourceLabels, vocabularyModalTaskLabels]);

  useEffect(() => {
    if (!preannotationEnabled) {
      setTaskTypeBindings([]);
      return;
    }
    const allTaskTypes = selectedToolTaskTypes;
    setTaskTypeBindings((prev) => {
      const next = allTaskTypes.map((taskType) => {
        const existed = prev.find((x) => x.taskType === taskType);
        if (existed) return existed;
        const candidate = bindingCandidates.find((x) => x.taskTypes.includes(taskType));
        return {
          taskType,
          modelId: candidate?.modelId || "",
          versionId: candidate?.versionId || "",
        };
      });
      return next;
    });
  }, [preannotationEnabled, selectedToolTaskTypes, bindingCandidates]);

  const preAnnotationTotal = useMemo(() => {
    const allMockDatasets = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets];
    return selectedDatasets.reduce((s, d) => {
      const ds = allMockDatasets.find((dd) => dd.id === d.id);
      return s + (ds?.files || 0);
    }, 0);
  }, [selectedDatasets]);

  const estimatedMinutes = useMemo(() => {
    const firstBinding = taskTypeBindings.find((x) => x.modelId);
    const selected = firstBinding ? availableModels.find((x) => x.id === firstBinding.modelId) : undefined;
    if (!selected || preAnnotationTotal === 0) return 0;
    return Math.max(1, Math.round((preAnnotationTotal * selected.avgInferenceMs) / 1000 / 60));
  }, [taskTypeBindings, availableModels, preAnnotationTotal]);

  const [timeoutEnabled, setTimeoutEnabled] = useState(false);
  const [timeoutHours, setTimeoutHours] = useState(48);
  const [allowRelease, setAllowRelease] = useState(true);
  const [allowAppend, setAllowAppend] = useState(true);
  const [crossAnnotation, setCrossAnnotation] = useState(false);
  const [crossMax, setCrossMax] = useState(2);
  const [judgeExperts, setJudgeExperts] = useState<string[]>(["张明"]);
  const [activeSearchJudge, setActiveSearchJudge] = useState(false);

  // Step 4: Spec
  const [specMode, setSpecMode] = useState<"text" | "file" | "none">("none");
  const [specText, setSpecText] = useState("");
  const [specTab, setSpecTab] = useState<"edit" | "preview">("edit");
  const [specForceRead, setSpecForceRead] = useState(false);
  const parsedSpec = useMemo(() => {
    try {
      return marked.parse(specText) as string;
    } catch (e) {
      return specText;
    }
  }, [specText]);

  // Step 5: generated batches preview
  const [generatedBatches, setGeneratedBatches] = useState<{ id: string; size: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showBatchList, setShowBatchList] = useState(false);
  const [activeSearchGroupId, setActiveSearchGroupId] = useState<string | null>(null);
  const [activeSearchQaNodeIdx, setActiveSearchQaNodeIdx] = useState<number | null>(null);
  const [activeSearchAcceptNodeIdx, setActiveSearchAcceptNodeIdx] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
    if (!taskName) {
      toast.error("请先填写任务名称再保存草稿");
      return;
    }
    setIsSavingDraft(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSavingDraft(false);
    toast.success("任务草稿已成功保存至云端");
  };
  const [searchText, setSearchText] = useState("");

  // Handle outside click for personnel search
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".search-adder-container")) {
        setActiveSearchGroupId(null);
        setActiveSearchQaNodeIdx(null);
        setActiveSearchAcceptNodeIdx(null);
        setActiveSearchJudge(false);
        setSearchText("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return taskName.trim().length > 0 && selectedCategory !== "";
      case 1: return selectedDatasets.length > 0;
      case 2: {
        const tool = mockTools.find(t => t.id === selectedTool);
        if (!tool) return false;
        // Verify all objects have a mapping field
        return tool.objects.every(obj => annotationFields[obj.name]?.trim().length > 0);
      }
      case 3: {
        if (assignMode === "person") {
          return personGroups.length > 0 && personGroups.every(g => g.persons.length > 0);
        }
        return true;
      }
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  }, [step, taskName, selectedCategory, selectedDatasets, selectedTool, annotationFields]);

  const handleGenerateBatches = () => {
    setIsGenerating(true);
    setIsGenerated(false);
    setShowBatchList(false);

    // Simulate background computation
    setTimeout(() => {
      const allMockDatasets = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets];
      const total = selectedDatasets.reduce((s, d) => {
        const ds = allMockDatasets.find(dd => dd.id === d.id);
        return s + (ds?.files || 0);
      }, 0);
      let batches: { id: string; size: number }[] = [];
      if (batchMode === "dataset") {
        selectedDatasets.forEach((d, i) => {
          const ds = allMockDatasets.find(dd => dd.id === d.id);
          batches.push({ id: `BT-${String(i + 1).padStart(3, "0")}`, size: ds?.files || 0 });
        });
      } else if (batchMode === "count") {
        let rem = total;
        let idx = 1;
        while (rem > 0) {
          const sz = Math.min(batchSize, rem);
          batches.push({ id: `BT-${String(idx).padStart(3, "0")}`, size: sz });
          rem -= sz;
          idx++;
        }
      } else {
        for (let i = 0; i < Math.min(total, 20); i++) {
          batches.push({ id: `BT-${String(i + 1).padStart(3, "0")}`, size: 1 });
        }
      }
      setGeneratedBatches(batches);
      setIsGenerating(false);
      setIsGenerated(true);
      toast.success(`已成功生成 ${batches.length} 个标注批次`);
    }, 1500);
  };

  const moveQaNode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= qaNodes.length) return;
    const newNodes = [...qaNodes];
    [newNodes[index], newNodes[newIndex]] = [newNodes[newIndex], newNodes[index]];
    setQaNodes(newNodes);
  };

  const handlePublish = () => {
    const firstBinding = taskTypeBindings.find((x) => x.modelId && x.versionId);
    const bindingCandidate = firstBinding
      ? bindingCandidates.find(
          (x) => x.modelId === firstBinding.modelId && x.versionId === firstBinding.versionId
        )
      : undefined;
    if ((preannotationEnabled || interactiveEnabled) && bindingCandidate && generatedBatches.length > 0) {
      generatedBatches.forEach((batch) => {
        dispatchPreannotation({
          taskId: batch.id,
          batchEnabled: preannotationEnabled,
          interactiveEnabled,
          modelId: bindingCandidate.modelId,
          modelName: bindingCandidate.modelName,
          modelVersionId: bindingCandidate.versionId,
          modelVersion: bindingCandidate.version,
          taskType: firstBinding?.taskType,
          modality: bindingCandidate.modality,
          confidenceThreshold,
          autoAccept,
          total: batch.size,
        });
      });
      toast.success(
        `任务发布成功！${generatedBatches.length} 个批次已进入${preannotationEnabled ? "批量预标注" : "交互式预标注"}队列`
      );
    } else {
      toast.success("任务发布成功！系统已自动拆分标注批次并放置在任务池中");
    }
    onBack();
  };

  const filteredDatasets = (() => {
    const source = datasetTab === 0 ? myMockDatasets : datasetTab === 1 ? subscribedMockDatasets : sharedMockDatasets;
    return source.filter(d => {
      if (selectedCategory && d.type !== selectedCategory) return false;
      if (datasetSearch && !d.name.includes(datasetSearch)) return false;
      return true;
    });
  })();

  const filteredTools = mockTools.filter(t => {
    // Basic compatibility check with step 0 category
    if (selectedCategory && t.type !== selectedCategory) return false;

    // Tab filtering (preset tools are considered Market for this mock)
    if (toolTab === 0 && t.isPreset) return false;
    if (toolTab === 1 && !t.isPreset) return false;

    // Category filtering
    if (toolCategory !== "all" && t.type !== toolCategory) return false;

    // Search filtering
    if (toolSearch && !t.name.includes(toolSearch)) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-[1440px] h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight">新建标注任务</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>TrustData Hub</span>
                <span>/</span>
                <span>标注引擎</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${i === step ? "bg-background text-primary shadow-sm" :
                    i < step ? "text-primary/60 hover:text-primary" : "text-muted-foreground/60"
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i === step ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" :
                    i < step ? "bg-primary/10" : "bg-muted"
                    }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden lg:inline">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-4 h-[1px] bg-muted-foreground/10 mx-1" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-xs font-medium text-muted-foreground hover:text-foreground">取消</button>
            <div className="w-[1px] h-4 bg-muted mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {taskName ? taskName.charAt(0).toUpperCase() : "?"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="container max-w-[1440px] h-full flex px-6 py-8 gap-8 overflow-hidden">
          {/* Left: Step Content */}
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col">
            <div className={`max-w-[1000px] flex flex-col ${step === 1 || step === 4 ? "flex-1" : "pb-32"}`}>

              {/* Step content */}
              <div className={`max-w-6xl flex flex-col ${step === 1 || step === 4 ? "flex-1" : ""}`}>
                {/* Step 0: Basic Info */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> 基础信息</h3>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">任务名称 <span className="text-destructive">*</span></label>
                        <input value={taskName} onChange={e => setTaskName(e.target.value.slice(0, 50))} placeholder="请输入任务名称" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <p className="text-xs text-muted-foreground mt-1">{taskName.length}/50 字符</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">任务描述</label>
                        <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value.slice(0, 300))} placeholder="请输入任务描述" rows={3} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                        <p className="text-xs text-muted-foreground mt-1">{taskDesc.length}/300 字符</p>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> 任务类型 <span className="text-destructive text-sm">*</span></h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 创建后不可修改，指代数据领域（如文本、图像等）</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {projectTypes.map(pt => {
                          const Icon = pt.icon;
                          return (
                            <button key={pt.category} onClick={() => { setSelectedCategory(pt.category); }}
                              className={`p-4 rounded-lg border text-left transition-all ${selectedCategory === pt.category ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/30"}`}>
                              <div className={`w-8 h-8 rounded-lg ${pt.color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
                              <p className="text-sm font-medium">{pt.category}</p>
                              <p className="text-xs text-muted-foreground mt-1">{pt.sub.join('、')}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> 任务流程 <span className="text-destructive text-sm">*</span></h3>
                      <p className="text-xs text-muted-foreground">定义任务的处理阶段，如是否需要质检或验收环节</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "标注", name: "标注", desc: "仅包含原始标注环节" },
                          { id: "标注-质检", name: "标注-质检", desc: "包含标注和人工质检环节" },
                          { id: "标注-质检-验收", name: "标注-质检-验收", desc: "最完整的标注、质检、验收三阶段流程" },
                          { id: "标注-验收", name: "标注-验收", desc: "跳过质检，标注完成后直接进入验收" }
                        ].map(wf => (
                          <button key={wf.id} onClick={() => {
                            setSelectedWorkflow(wf.id);
                            // Sync Step 3 flags
                            setQaEnabled(wf.id.includes("质检"));
                            setAcceptEnabled(wf.id.includes("验收"));
                          }}
                            className={`p-4 rounded-lg border text-left transition-all ${selectedWorkflow === wf.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/30"}`}>
                            <p className="text-sm font-medium">{wf.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{wf.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Dataset */}
                {step === 1 && (
                  <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex-1 rounded-lg border bg-card p-6 space-y-4 flex flex-col min-h-0 pb-10">
                      <h3 className="font-medium flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> 数据集配置</h3>
                      <p className="text-xs text-muted-foreground">选择与项目类型匹配的数据集，支持选择数据集的一个版本进行标注</p>

                      <div className="flex border-b relative">
                        {["我的数据集", "我订购的", "分享给我的"].map((label, i) => (
                          <button
                            key={i}
                            onClick={() => setDatasetTab(i)}
                            className={`px-4 py-2 text-sm font-medium transition-colors relative ${datasetTab === i ? "text-primary" : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {label}
                            {datasetTab === i && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="relative flex-1">
                          <input value={datasetSearch} onChange={e => setDatasetSearch(e.target.value)} placeholder="搜索数据集..." className="w-full h-9 pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0">
                        {filteredDatasets.map(ds => {
                          const selected = selectedDatasets.find(s => s.id === ds.id);
                          return (
                            <div key={ds.id} className={`p-3 rounded-lg border flex items-center justify-between ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{ds.name}</span>
                                  <span className="text-xs text-muted-foreground">{ds.id}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${typeColors[ds.type] || "bg-muted text-muted-foreground"}`}>{ds.type}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {ds.files.toLocaleString()} 文件 · {ds.size} · {datasetTab === 0 ? "创建人" : datasetTab === 1 ? "发布方" : "分享人"}: {ds.creator}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected ? (
                                  <>
                                    <select value={selected.version} onChange={e => setSelectedDatasets([{ id: ds.id, version: e.target.value }])}
                                      className="px-2 py-1 text-xs border rounded bg-background">
                                      {ds.versions.map(v => <option key={v}>{v}</option>)}
                                    </select>
                                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20 flex items-center gap-1 font-medium">
                                      <Check className="w-3 h-3" /> 已选
                                    </span>
                                  </>
                                ) : (
                                  <button onClick={() => setSelectedDatasets([{ id: ds.id, version: ds.versions[ds.versions.length - 1] }])}
                                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">选择</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {selectedDatasets.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-2">当前已选</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedDatasets.map(s => {
                              const ds = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets].find(d => d.id === s.id);
                              return (
                                <span key={s.id} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs flex items-center gap-2 border border-primary/20 font-medium">
                                  <Database className="w-3.5 h-3.5" />
                                  {ds?.name} ({s.version})
                                  <button onClick={() => setSelectedDatasets([])} className="hover:bg-primary/20 rounded p-0.5"><X className="w-3.5 h-3.5" /></button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Tool */}
                {step === 2 && (
                  <div className="bg-card border rounded-2xl shadow-sm p-6 flex gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0 flex flex-col gap-4 border-r pr-6">
                      <div className="relative">
                        <input
                          value={toolSearch}
                          onChange={e => setToolSearch(e.target.value)}
                          placeholder="按名称搜索"
                          className="w-full h-9 pl-9 pr-3 py-2 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>

                      <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]">
                        <Plus className="w-4 h-4" /> 新建标注工具
                      </button>

                      <div className="space-y-1 mt-2">
                        <button
                          onClick={() => { setToolTab(0); setToolCategory("all"); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${toolTab === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                          <Users className="w-4 h-4" /> 我的标注工具
                        </button>

                        <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">标注工具市场</div>
                        {[
                          { label: "文本类标注工具", cat: "文本类", icon: Type },
                          { label: "图像类标注工具", cat: "图像类", icon: Image },
                          { label: "音频类标注工具", cat: "音频类", icon: Mic },
                          { label: "视频类标注工具", cat: "视频类", icon: Video },
                          { label: "表格类标注工具", cat: "表格类", icon: Table2 },
                          { label: "跨模态标注工具", cat: "跨模态类", icon: Layers },
                        ].map((item) => (
                          <button
                            key={item.cat}
                            onClick={() => { setToolTab(1); setToolCategory(item.cat); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${toolTab === 1 && toolCategory === item.cat ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-50" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {!selectedTool ? (
                        <>
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {toolTab === 0 ? "我的标注工具" : `市场工具: ${toolCategory === "all" ? "全部" : toolCategory}`}
                            </h3>
                            <span className="text-xs text-muted-foreground">共 {filteredTools.length} 个结果</span>
                          </div>

                          <div className="flex-1 overflow-y-auto pr-2 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredTools.map((tool) => (
                                <div
                                  key={tool.id}
                                  onClick={() => setSelectedTool(tool.id)}
                                  className={`group group/tool cursor-pointer rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg ${selectedTool === tool.id ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"}`}
                                >
                                  {/* Banner Image */}
                                  <div className="aspect-video relative overflow-hidden bg-muted">
                                    <img
                                      src={(tool as any).image}
                                      alt={tool.name}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                    {selectedTool === tool.id && (
                                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-lg">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-bold text-sm line-clamp-1">{tool.name}</h4>
                                      <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${tool.type === "文本类" ? "bg-blue-100 text-blue-700" :
                                        tool.type === "图像类" ? "bg-green-100 text-green-700" :
                                          "bg-muted text-muted-foreground"
                                        }`}>
                                        {tool.type}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem] leading-relaxed">
                                        {(tool as any).desc}
                                      </p>
                                      {/* Hover show all tooltip */}
                                      <div className="absolute inset-0 bg-card/95 hidden group-hover/tool:block z-20 overflow-y-auto custom-scrollbar">
                                        <p className="text-xs text-foreground leading-relaxed p-1">
                                          {(tool as any).desc}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {filteredTools.length === 0 && (
                              <div className="h-60 flex flex-col items-center justify-center text-muted-foreground">
                                <Settings className="w-12 h-12 opacity-20 mb-2" />
                                <p className="text-sm italic">暂无符合条件的标注工具</p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="mb-4 flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-4">
                              <button onClick={() => setSelectedTool(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                              </button>
                              <div>
                                <h3 className="font-bold text-xl">{mockTools.find(t => t.id === selectedTool)?.name}</h3>
                                <p className="text-xs text-muted-foreground">工具 ID: {selectedTool} · 分类: {mockTools.find(t => t.id === selectedTool)?.type}</p>
                                {selectedToolTaskTypes.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {selectedToolTaskTypes.map((taskType) => (
                                      <span key={taskType} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                        任务类型：{taskType}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto px-1 pt-2 space-y-12 pb-10 custom-scrollbar">
                            {(() => {
                              const tool = mockTools.find(t => t.id === selectedTool);
                              if (!tool || !tool.objects) return null;

                              return tool.objects.map((obj, objIdx) => (
                                <div key={obj.name} className="space-y-8 p-6 pt-10 bg-white/50 rounded-2xl border border-slate-200/60 relative shadow-sm">
                                  {/* Object Badge */}
                                  <div className="absolute -top-3 left-6 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 uppercase tracking-widest z-10 hover:scale-105 transition-transform">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    待标注对象: {obj.name}
                                  </div>

                                  {/* Field Mapping */}
                                  <section className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-4 bg-primary rounded-full" />
                                      <h4 className="font-bold text-sm">【{obj.name}】内容字段映射</h4>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm relative">
                                      <label className="text-xs font-semibold text-muted-foreground mb-2 block tracking-tight">选择映射字段 (从数据集读取) <span className="text-destructive">*</span></label>

                                      <div className="relative group/select">
                                        <select
                                          value={annotationFields[obj.name] || ""}
                                          onChange={e => setAnnotationFields(prev => ({ ...prev, [obj.name]: e.target.value }))}
                                          className="w-full pl-4 pr-10 py-3 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans appearance-none cursor-pointer"
                                        >
                                          <option value="" disabled>请选择要标注的字段</option>
                                          {(() => {
                                            const allMockDs = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets];
                                            const selectedDsIds = selectedDatasets.map(sd => sd.id);
                                            // In multi-dataset scenario, we'd intersection or union, but here we take the first one's fields as simple mock logic
                                            const ds = allMockDs.find(d => selectedDsIds.includes(d.id));
                                            return ds?.fields?.map(f => (
                                              <option key={f.name} value={f.name}>
                                                {f.name} (示例: {f.example.slice(0, 20)}...)
                                              </option>
                                            ));
                                          })()}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/select:text-primary transition-colors pointer-events-none" />
                                      </div>

                                      {/* Example Box */}
                                      {annotationFields[obj.name] && (
                                        <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-slate-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                          <div className="mt-0.5 p-1 bg-primary/10 rounded">
                                            <Eye className="w-3 h-3 text-primary" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">字段示例内容</p>
                                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                              "{((): string => {
                                                const allMockDs = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets];
                                                const selectedDsIds = selectedDatasets.map(sd => sd.id);
                                                const ds = allMockDs.find(d => selectedDsIds.includes(d.id));
                                                return ds?.fields?.find(f => f.name === annotationFields[obj.name])?.example || "暂无示例";
                                              })()}"
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> 系统将从数据集中提取该字段，不包含该字段的数据将自动跳过标注
                                      </p>
                                    </div>
                                  </section>

                                  {/* Label Config (Conditional) */}
                                  {obj.methods.includes("标签") && (
                                    <section className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1 h-4 bg-primary rounded-full" />
                                          <h4 className="font-bold text-sm">【{obj.name}】标签配置</h4>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(objectLabels[obj.name] || [
                                          { value: "正面", color: "#22c55e" },
                                          { value: "负面", color: "#ef4444" },
                                          { value: "中性", color: "#6b7280" },
                                        ]).map((l, i) => (
                                          <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-xl group/label hover:ring-2 hover:ring-primary/10 transition-all border-slate-200/60">
                                            <div className="relative">
                                              <input
                                                type="color"
                                                value={l.color}
                                                onChange={e => {
                                                  const newLabels = [...(objectLabels[obj.name] || [])];
                                                  if (newLabels[i]) newLabels[i].color = e.target.value;
                                                  setObjectLabels(prev => ({ ...prev, [obj.name]: newLabels }));
                                                }}
                                                className="w-10 h-10 rounded-lg border-none p-0 cursor-pointer overflow-hidden shadow-sm"
                                              />
                                              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none rounded-lg" />
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                              <label className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">标签名称</label>
                                              <input
                                                value={l.value}
                                                onChange={e => {
                                                  const newLabels = [...(objectLabels[obj.name] || [])];
                                                  if (newLabels[i]) newLabels[i].value = e.target.value;
                                                  setObjectLabels(prev => ({ ...prev, [obj.name]: newLabels }));
                                                }}
                                                className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 placeholder:text-slate-300"
                                                placeholder="未命名标签"
                                              />
                                            </div>
                                            <button
                                              onClick={() => {
                                                const newLabels = (objectLabels[obj.name] || []).filter((_, j) => j !== i);
                                                setObjectLabels(prev => ({ ...prev, [obj.name]: newLabels }));
                                              }}
                                              className="opacity-0 group-hover/label:opacity-100 p-2 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                              <Trash2 className="w-4 h-4 text-rose-500" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          onClick={() => {
                                            const current = objectLabels[obj.name] || [
                                              { value: "正面", color: "#22c55e" },
                                              { value: "负面", color: "#ef4444" },
                                              { value: "中性", color: "#6b7280" },
                                            ];
                                            setObjectLabels(prev => ({ ...prev, [obj.name]: [...current, { value: "", color: "#3b82f6" }] }));
                                          }}
                                          className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4 text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group/btn"
                                        >
                                          <Plus className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                                          <span className="text-sm font-bold">添加{obj.name}标签</span>
                                        </button>
                                      </div>
                                    </section>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Task config */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Batch config */}
                    <div className="rounded-lg border bg-card p-6 space-y-4 relative">
                      {/* Execution Overlay */}
                      {isGenerating && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                          <p className="text-sm font-bold text-slate-700 tracking-widest animate-pulse">正在执行中...</p>
                          <p className="text-[10px] text-muted-foreground mt-2">系统正在根据数据集规模计算最佳批次拆分方案</p>
                        </div>
                      )}

                      <h3 className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> 标注批次配置</h3>
                      <div className="space-y-2">
                        {([
                          { key: "dataset", label: "以数据集维度打包成一个标注批次" },
                          { key: "count", label: "每N条数据打包成一个标注批次" },
                          { key: "single", label: "单条数据打包成一个标注批次" },
                        ] as const).map(opt => (
                          <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${batchMode === opt.key ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                            <input type="radio" checked={batchMode === opt.key} onChange={() => { setBatchMode(opt.key); setIsGenerated(false); }} disabled={isGenerating} />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {batchMode === "count" && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">每</label>
                          <input type="number" value={batchSize} onChange={e => { setBatchSize(Number(e.target.value)); setIsGenerated(false); }} disabled={isGenerating} className="w-24 px-2 py-1.5 text-sm border rounded bg-background" min={1} />
                          <label className="text-sm text-muted-foreground">条为一个批次</label>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-muted-foreground">数据抽样：</label>
                        <select value={samplingOrder} onChange={e => { setSamplingOrder(e.target.value as any); setIsGenerated(false); }} disabled={isGenerating} className="px-2 py-1.5 text-sm border rounded bg-background">
                          <option value="original">按数据原始顺序抽样</option>
                          <option value="random">随机排序抽样</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleGenerateBatches}
                          disabled={isGenerating}
                          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm ${isGenerating ? "bg-muted text-muted-foreground cursor-not-allowed" :
                            isGenerated ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-primary text-primary-foreground hover:shadow-md active:scale-95"
                            }`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              执行中...
                            </>
                          ) : isGenerated ? "重新生成标注批次" : "立即生成标注批次"}
                        </button>

                        {isGenerated && (
                          <button
                            onClick={() => setShowBatchList(!showBatchList)}
                            className="px-6 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2 border border-primary/20"
                          >
                            <Eye className="w-4 h-4" />
                            {showBatchList ? "隐藏生成结果" : "查看生成结果"}
                          </button>
                        )}
                      </div>

                      {isGenerated && showBatchList && generatedBatches.length > 0 && (
                        <div className="mt-4 p-5 bg-slate-50 border rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-bold text-slate-700">已成功生成 {generatedBatches.length} 个标注批次</p>
                            <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">Computation Complete</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {generatedBatches.map(b => (
                              <div key={b.id} className="px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-xs flex flex-col gap-1 min-w-[80px] hover:border-primary/40 transition-colors">
                                <span className="font-bold text-primary">{b.id}</span>
                                <span className="text-[10px] text-muted-foreground">{b.size} 条数据</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Smart preannotation config */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" /> 智能预标注
                        </h3>
                        <Switch checked={preannotationEnabled} onCheckedChange={setPreannotationEnabled} />
                      </div>
                      {!preannotationEnabled ? (
                        <p className="text-xs text-muted-foreground">未开启</p>
                      ) : (
                        <>
                          {taskTypeBindings.length === 0 ? (
                            <div className="p-4 rounded-lg border border-dashed bg-amber-50/30 text-xs text-amber-800">
                              当前模态未找到可用于预标注的模型版本
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {taskTypeBindings.map((binding, idx) => {
                                const options = bindingCandidates.filter((x) => x.taskTypes.includes(binding.taskType));
                                const selected = options.find(
                                  (x) => x.modelId === binding.modelId && x.versionId === binding.versionId
                                );
                                const mappedCount = taskLabels.filter((label) => !!taskLabelMappings[label]).length;
                                const unmappedCount = Math.max(0, taskLabels.length - mappedCount);
                                return (
                                  <div key={binding.taskType} className="rounded-lg border p-3 space-y-2">
                                    <div className="text-xs text-muted-foreground">任务类型：{binding.taskType}</div>
                                    <select
                                      value={selected ? `${selected.modelId}:${selected.versionId}` : ""}
                                      onChange={(e) => {
                                        const [modelId, versionId] = e.target.value.split(":");
                                        setTaskTypeBindings((prev) =>
                                          prev.map((item, i) => (i === idx ? { ...item, modelId, versionId } : item))
                                        );
                                      }}
                                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                                    >
                                      <option value="">请选择预处理模型版本</option>
                                      {options.map((x) => (
                                        <option key={x.key} value={`${x.modelId}:${x.versionId}`}>
                                          {x.modelName} / {x.version}
                                        </option>
                                      ))}
                                    </select>
                                    {selected?.labelScope === "固定标签集" && (
                                      <button
                                        type="button"
                                        onClick={() => setShowVocabularyModal(true)}
                                        className="text-xs text-primary hover:underline"
                                      >
                                        词汇映射表（已映射 {mappedCount}、未映射 {unmappedCount}）
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Personnel config */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 标注人员配置</h3>
                      <div className="flex gap-2">
                        {(["person", "team", "pool"] as const).map(m => (
                          <button key={m} onClick={() => setAssignMode(m)}
                            className={`px-3 py-1.5 text-xs rounded-full border ${assignMode === m ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"}`}>
                            {m === "person" ? "分配至个人" : m === "team" ? "分配至团队" : "分配至任务池"}
                          </button>
                        ))}
                      </div>
                      {assignMode === "person" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">标注人员分组配置</p>
                            <button
                              onClick={() => setPersonGroups(prev => [...prev, { id: "g-" + Date.now(), name: `分组 ${prev.length + 1}`, persons: [], batchLimit: 5 }])}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/5 px-2 py-1 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" /> 添加配置小组
                            </button>
                          </div>

                          <div className="space-y-4">
                            {personGroups.map((group, gIdx) => (
                              <div key={group.id} className="p-5 bg-white border border-slate-100 rounded-2xl relative group/card shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-left-2 duration-300">
                                <button
                                  onClick={() => setPersonGroups(prev => prev.filter(g => g.id !== group.id))}
                                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/card:opacity-100 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <input
                                          value={group.name}
                                          onChange={e => {
                                            const next = [...personGroups];
                                            next[gIdx].name = e.target.value;
                                            setPersonGroups(next);
                                          }}
                                          className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 w-32 text-slate-800 placeholder:text-slate-300"
                                          placeholder="分组名称..."
                                        />
                                      </div>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-50 px-2 py-0.5 rounded-full">成员 {group.persons.length}</span>
                                    </div>

                                    {/* Selected Persons Tags */}
                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                      {group.persons.map((p, pIdx) => (
                                        <div key={p.account} className="group/tag inline-flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all duration-200 animate-in zoom-in-95">
                                          <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 shadow-inner">
                                            {p.name.slice(0, 1)}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 leading-none">{p.name}</span>
                                            <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{p.account.split('@')[0]}</span>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const next = [...personGroups];
                                              next[gIdx].persons = next[gIdx].persons.filter((_, idx) => idx !== pIdx);
                                              setPersonGroups(next);
                                            }}
                                            className="ml-1 w-4 h-4 rounded-lg flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-rose-500 hover:text-white text-slate-400 transition-all duration-200"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      {group.persons.length === 0 && (
                                        <div className="flex items-center gap-2 text-slate-300 text-[11px] italic py-2">
                                          <Users className="w-3.5 h-3.5" />
                                          尚未添加任何完成人员...
                                        </div>
                                      )}
                                    </div>

                                    {/* Searchable Adder with Dropdown */}
                                    <div className="relative w-full max-w-sm search-adder-container">
                                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                          placeholder="搜索姓名或账号添加成员..."
                                          className="flex-1 text-xs bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                                          value={activeSearchGroupId === group.id ? searchText : ""}
                                          onChange={e => {
                                            setActiveSearchGroupId(group.id);
                                            setSearchText(e.target.value);
                                          }}
                                          onFocus={() => setActiveSearchGroupId(group.id)}
                                        />
                                        {activeSearchGroupId === group.id && searchText && (
                                          <button onClick={() => setSearchText("")} className="hover:text-rose-500"><X className="w-3 h-3 text-muted-foreground" /></button>
                                        )}
                                      </div>

                                      {/* Dropdown Results */}
                                      {activeSearchGroupId === group.id && (
                                        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                          {(() => {
                                            const filtered = mockUsers.filter(u =>
                                              (u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                                                u.account.toLowerCase().includes(searchText.toLowerCase())) &&
                                              !group.persons.some(p => p.account === u.account) // Not in current group
                                            ).sort((a, b) => {
                                              const aInOther = personGroups.some(g => g.id !== group.id && g.persons.some(p => p.account === a.account));
                                              const bInOther = personGroups.some(g => g.id !== group.id && g.persons.some(p => p.account === b.account));
                                              if (aInOther === bInOther) return 0;
                                              return aInOther ? 1 : -1;
                                            });

                                            if (filtered.length === 0) {
                                              return (
                                                <div className="p-8 text-center">
                                                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Search className="w-6 h-6 text-slate-300" />
                                                  </div>
                                                  <p className="text-[11px] text-muted-foreground">未找到匹配人员</p>
                                                </div>
                                              );
                                            }

                                            return (
                                              <div className="py-1">
                                                {searchText.length === 0 && (
                                                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 mb-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">建议添加人员</p>
                                                  </div>
                                                )}
                                                {filtered.map(user => {
                                                  const isExistedInOther = personGroups.some(g => g.id !== group.id && g.persons.some(p => p.account === user.account));

                                                  return (
                                                    <button
                                                      key={user.account}
                                                      disabled={isExistedInOther}
                                                      onClick={() => {
                                                        const next = [...personGroups];
                                                        next[gIdx].persons.push(user);
                                                        setPersonGroups(next);
                                                        setSearchText("");
                                                        setActiveSearchGroupId(null);
                                                      }}
                                                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-0 group/item ${isExistedInOther ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"}`}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                                          {user.name.slice(0, 1)}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                          <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                                          <span className="text-[10px] text-muted-foreground font-mono">{user.account}</span>
                                                        </div>
                                                      </div>
                                                      {isExistedInOther && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-full font-bold">已在其他组</span>
                                                      )}
                                                      {!isExistedInOther && (
                                                        <Plus className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                      )}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                      <p className="text-[9px] text-muted-foreground mt-1 ml-1 scale-90 origin-left italic">输入关键字即时过滤，同一人员组间不重叠</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col justify-center border-l border-slate-100 pl-8">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                      <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase tracking-tighter">批次分配上限</label>
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="number"
                                          min={1}
                                          value={group.batchLimit}
                                          onChange={e => {
                                            const next = [...personGroups];
                                            next[gIdx].batchLimit = Number(e.target.value);
                                            setPersonGroups(next);
                                          }}
                                          className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-center"
                                        />
                                        <span className="text-xs text-slate-500 font-bold shrink-0">批次</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {assignMode === "team" && (
                        <div className="p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50/30">
                          <Users className="w-10 h-10 opacity-20 mb-3" />
                          <p className="text-sm font-medium">团队分配模式暂未开启外部资源池</p>
                          <p className="text-xs opacity-60 mt-1">请先在空间设置中挂载标注团队</p>
                        </div>
                      )}

                      {assignMode === "pool" && (
                        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-blue-900">分配至任务池 (抢单模式)</p>
                            <p className="text-xs text-blue-700/80 leading-relaxed mt-1">
                              选定空间内的所有成员均可查阅并领取该任务下的标注批次。人员可根据自身进度自主申领，单人申领上限受空间全局策略控制。
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QA config */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> 质检节点配置</h3>
                        <Switch checked={qaEnabled} onCheckedChange={setQaEnabled} />
                      </div>
                      {qaEnabled && (
                        <div className="space-y-4">
                          {qaNodes.map((node, ni) => (
                            <div key={ni} className="p-5 bg-white border border-slate-100 rounded-2xl relative group/node shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-2 duration-300">
                              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-all">
                                <button
                                  disabled={ni === 0}
                                  onClick={() => moveQaNode(ni, 'up')}
                                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="上移"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={ni === qaNodes.length - 1}
                                  onClick={() => moveQaNode(ni, 'down')}
                                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="下移"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setQaNodes(prev => prev.filter((_, i) => i !== ni))}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                                  title="删除节点"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-amber-400 rounded-full" />
                                  <span className="text-sm font-bold text-slate-800">质检节点 {ni + 1}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase tracking-tighter">质检人员（{node.persons.length}）</label>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] mb-3">
                                      {node.persons.map((p, pi) => (
                                        <div key={pi} className="group/tag inline-flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-amber-400/20 hover:shadow-sm transition-all duration-200">
                                          <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-amber-600 shrink-0 shadow-inner">
                                            {p.slice(0, 1)}
                                          </div>
                                          <span className="text-xs font-bold text-slate-700 leading-none">{p}</span>
                                          <button
                                            onClick={() => { const nn = [...qaNodes]; nn[ni].persons = nn[ni].persons.filter((_, i) => i !== pi); setQaNodes(nn); }}
                                            className="ml-1 w-4 h-4 rounded-lg flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-rose-500 hover:text-white text-slate-400 transition-all duration-200"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      {node.persons.length === 0 && (
                                        <div className="flex items-center gap-2 text-slate-300 text-[11px] italic py-2">
                                          尚未添加任何质检人员...
                                        </div>
                                      )}
                                    </div>
                                    <div className="relative w-full max-w-sm search-adder-container">
                                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                          type="text"
                                          value={activeSearchQaNodeIdx === ni ? searchText : ""}
                                          onChange={e => setSearchText(e.target.value)}
                                          onFocus={() => {
                                            setActiveSearchQaNodeIdx(ni);
                                            setActiveSearchGroupId(null);
                                            setSearchText("");
                                          }}
                                          className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-xs placeholder:text-slate-300"
                                          placeholder="搜索姓名或账号添加质检员..."
                                        />
                                        {activeSearchQaNodeIdx === ni && searchText && (
                                          <button onClick={() => setSearchText("")} className="hover:text-rose-500"><X className="w-3 h-3 text-muted-foreground" /></button>
                                        )}
                                      </div>

                                      {/* QA Search Dropdown */}
                                      {activeSearchQaNodeIdx === ni && (
                                        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                          {(() => {
                                            const filtered = mockUsers.filter(u =>
                                              (u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                                                u.account.toLowerCase().includes(searchText.toLowerCase())) &&
                                              !node.persons.includes(u.name) // Not already in current node
                                            ).sort((a, b) => {
                                              const aInOther = qaNodes.some((gn, gni) => gni !== ni && gn.persons.includes(a.name));
                                              const bInOther = qaNodes.some((gn, gni) => gni !== ni && gn.persons.includes(b.name));
                                              if (aInOther === bInOther) return 0;
                                              return aInOther ? 1 : -1;
                                            });

                                            if (filtered.length === 0) {
                                              return (
                                                <div className="p-8 text-center">
                                                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Search className="w-6 h-6 text-slate-300" />
                                                  </div>
                                                  <p className="text-[11px] text-muted-foreground">未找到匹配质检员</p>
                                                </div>
                                              );
                                            }

                                            return (
                                              <div className="py-1">
                                                {searchText.length === 0 && (
                                                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 mb-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">建议添加质检员</p>
                                                  </div>
                                                )}
                                                {filtered.map(user => {
                                                  const isExistedInOther = qaNodes.some((gn, gni) => gni !== ni && gn.persons.includes(user.name));

                                                  return (
                                                    <button
                                                      key={user.account}
                                                      disabled={isExistedInOther}
                                                      onClick={() => {
                                                        const next = [...qaNodes];
                                                        next[ni].persons.push(user.name);
                                                        setQaNodes(next);
                                                        setSearchText("");
                                                        setActiveSearchQaNodeIdx(null);
                                                      }}
                                                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-amber-400/5 transition-colors border-b border-slate-50 last:border-0 group/item ${isExistedInOther ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"}`}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0 group-hover/item:bg-amber-400/10 group-hover/item:text-amber-600 transition-colors">
                                                          {user.name.slice(0, 1)}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                          <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                                          <span className="text-[10px] text-muted-foreground font-mono">{user.account}</span>
                                                        </div>
                                                      </div>
                                                      {isExistedInOther && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-full font-bold">已在其他节点</span>
                                                      )}
                                                      {!isExistedInOther && (
                                                        <Plus className="w-4 h-4 text-amber-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                      )}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col justify-center border-l border-slate-100 pl-8 space-y-4">
                                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">质检方式</label>
                                      <select value={node.method} onChange={e => { const nn = [...qaNodes]; nn[ni].method = e.target.value; setQaNodes(nn); }}
                                        className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all outline-none">
                                        <option value="batch">按批次抽检</option>
                                        <option value="task_batch">按任务抽检随机批次全部数据</option>
                                        <option value="task_random">按任务抽检随机批次随机数据</option>
                                      </select>
                                    </div>

                                    {(node.method === "batch" || node.method === "task_random") && (
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">批次内数据抽检比例</label>
                                        <div className="flex items-center gap-2">
                                          <input type="number" value={node.dataRatio} onChange={e => { const nn = [...qaNodes]; nn[ni].dataRatio = Number(e.target.value); setQaNodes(nn); }}
                                            className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all text-center font-bold" min={0} max={100} />
                                          <span className="text-xs text-slate-500 font-bold">%</span>
                                        </div>
                                      </div>
                                    )}

                                    {(node.method === "task_batch" || node.method === "task_random") && (
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">批次抽检比例</label>
                                        <div className="flex items-center gap-2">
                                          <input type="number" value={node.batchRatio} onChange={e => { const nn = [...qaNodes]; nn[ni].batchRatio = Number(e.target.value); setQaNodes(nn); }}
                                            className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all text-center font-bold" min={0} max={100} />
                                          <span className="text-xs text-slate-500 font-bold">%</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setQaNodes(prev => [...prev, { persons: [], method: "batch", batchRatio: 100, dataRatio: 30 }])}
                            className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all group/add">
                            <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                            添加质检节点
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Accept config */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> 验收环节配置</h3>
                        <Switch checked={acceptEnabled} onCheckedChange={setAcceptEnabled} />
                      </div>

                      {acceptEnabled && (
                        <div className="space-y-4">
                          {acceptNodes.map((node, ni) => (
                            <div key={ni} className="p-5 bg-white border border-slate-100 rounded-2xl relative group/node shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-2 duration-300">
                              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-all">
                                <button
                                  disabled={ni === 0}
                                  onClick={() => {
                                    const next = [...acceptNodes];
                                    [next[ni], next[ni - 1]] = [next[ni - 1], next[ni]];
                                    setAcceptNodes(next);
                                  }}
                                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-green-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="上移"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={ni === acceptNodes.length - 1}
                                  onClick={() => {
                                    const next = [...acceptNodes];
                                    [next[ni], next[ni + 1]] = [next[ni + 1], next[ni]];
                                    setAcceptNodes(next);
                                  }}
                                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-green-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="下移"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAcceptNodes(prev => prev.filter((_, i) => i !== ni))}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                                  title="删除节点"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-green-500 rounded-full" />
                                  <span className="text-sm font-bold text-slate-800">{ni === acceptNodes.length - 1 && acceptNodes.length > 1 ? "最终验收环节" : `验收节点 ${ni + 1}`}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase tracking-tighter">验收人员（{node.persons.length}）</label>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] mb-3">
                                      {node.persons.map((p, pi) => (
                                        <div key={pi} className="group/tag inline-flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-green-400/20 hover:shadow-sm transition-all duration-200">
                                          <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-green-600 shrink-0 shadow-inner">
                                            {p.slice(0, 1)}
                                          </div>
                                          <span className="text-xs font-bold text-slate-700 leading-none">{p}</span>
                                          <button
                                            onClick={() => { const nn = [...acceptNodes]; nn[ni].persons = nn[ni].persons.filter((_, i) => i !== pi); setAcceptNodes(nn); }}
                                            className="ml-1 w-4 h-4 rounded-lg flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-rose-500 hover:text-white text-slate-400 transition-all duration-200"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      {node.persons.length === 0 && (
                                        <div className="flex items-center gap-2 text-slate-300 text-[11px] italic py-2">
                                          尚未添加任何验收人员...
                                        </div>
                                      )}
                                    </div>
                                    <div className="relative w-full max-w-sm search-adder-container">
                                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                          type="text"
                                          value={activeSearchAcceptNodeIdx === ni ? searchText : ""}
                                          onChange={e => setSearchText(e.target.value)}
                                          onFocus={() => {
                                            setActiveSearchAcceptNodeIdx(ni);
                                            setActiveSearchQaNodeIdx(null);
                                            setActiveSearchGroupId(null);
                                            setSearchText("");
                                          }}
                                          className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-xs placeholder:text-slate-300"
                                          placeholder="搜索姓名或账号添加验收员..."
                                        />
                                        {activeSearchAcceptNodeIdx === ni && searchText && (
                                          <button onClick={() => setSearchText("")} className="hover:text-rose-500"><X className="w-3 h-3 text-muted-foreground" /></button>
                                        )}
                                      </div>

                                      {/* Accept Search Dropdown */}
                                      {activeSearchAcceptNodeIdx === ni && (
                                        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                          {(() => {
                                            const filtered = mockUsers.filter(u =>
                                              (u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                                                u.account.toLowerCase().includes(searchText.toLowerCase())) &&
                                              !node.persons.includes(u.name) // Not already in current node
                                            ).sort((a, b) => {
                                              const aInOther = acceptNodes.some((an, ani) => ani !== ni && an.persons.includes(a.name));
                                              const bInOther = acceptNodes.some((an, ani) => ani !== ni && an.persons.includes(b.name));
                                              if (aInOther === bInOther) return 0;
                                              return aInOther ? 1 : -1;
                                            });

                                            if (filtered.length === 0) {
                                              return (
                                                <div className="p-8 text-center">
                                                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Search className="w-6 h-6 text-slate-300" />
                                                  </div>
                                                  <p className="text-[11px] text-muted-foreground">未找到匹配验收员</p>
                                                </div>
                                              );
                                            }

                                            return (
                                              <div className="py-1">
                                                {searchText.length === 0 && (
                                                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 mb-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">建议添加验收员</p>
                                                  </div>
                                                )}
                                                {filtered.map(user => {
                                                  const isExistedInOther = acceptNodes.some((an, ani) => ani !== ni && an.persons.includes(user.name));

                                                  return (
                                                    <button
                                                      key={user.account}
                                                      disabled={isExistedInOther}
                                                      onClick={() => {
                                                        const next = [...acceptNodes];
                                                        next[ni].persons.push(user.name);
                                                        setAcceptNodes(next);
                                                        setSearchText("");
                                                        setActiveSearchAcceptNodeIdx(null);
                                                      }}
                                                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-green-500/5 transition-colors border-b border-slate-50 last:border-0 group/item ${isExistedInOther ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"}`}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0 group-hover/item:bg-green-500/10 group-hover/item:text-green-600 transition-colors">
                                                          {user.name.slice(0, 1)}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                          <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                                          <span className="text-[10px] text-muted-foreground font-mono">{user.account}</span>
                                                        </div>
                                                      </div>
                                                      {isExistedInOther && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-full font-bold">已在其他节点</span>
                                                      )}
                                                      {!isExistedInOther && (
                                                        <Plus className="w-4 h-4 text-green-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                      )}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col justify-center border-l border-slate-100 pl-8 space-y-4">
                                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">验收方式</label>
                                      <select value={node.method} onChange={e => { const nn = [...acceptNodes]; nn[ni].method = e.target.value; setAcceptNodes(nn); }}
                                        className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all outline-none">
                                        <option value="batch">按批次抽检</option>
                                        <option value="task_batch">按任务抽检随机批次全部数据</option>
                                        <option value="task_random">按任务抽检随机批次随机数据</option>
                                      </select>
                                    </div>

                                    {(node.method === "batch" || node.method === "task_random") && (
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">批次内数据抽检比例</label>
                                        <div className="flex items-center gap-2">
                                          <input type="number" value={node.dataRatio} onChange={e => { const nn = [...acceptNodes]; nn[ni].dataRatio = Number(e.target.value); setAcceptNodes(nn); }}
                                            className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-center font-bold" min={0} max={100} />
                                          <span className="text-xs text-slate-500 font-bold">%</span>
                                        </div>
                                      </div>
                                    )}

                                    {(node.method === "task_batch" || node.method === "task_random") && (
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-tighter">批次抽检比例</label>
                                        <div className="flex items-center gap-2">
                                          <input type="number" value={node.batchRatio} onChange={e => { const nn = [...acceptNodes]; nn[ni].batchRatio = Number(e.target.value); setAcceptNodes(nn); }}
                                            className="w-full h-9 px-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-center font-bold" min={0} max={100} />
                                          <span className="text-xs text-slate-500 font-bold">%</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setAcceptNodes(prev => [...prev, { persons: [], method: "batch", batchRatio: 100, dataRatio: 20 }])}
                            className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-green-500 hover:border-green-500/20 hover:bg-green-500/5 transition-all group/add">
                            <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                            添加验收节点
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Manager & advanced */}
                    {/* Advanced config */}
                    <div className="rounded-lg border bg-card p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
                        <h3 className="font-bold flex items-center gap-2 text-slate-800">
                          <Settings className="w-5 h-5 text-primary" /> 高级配置
                        </h3>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-100 px-2 py-0.5 rounded-full">全局任务策略</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          {/* Group: Flow */}
                          <div className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Database className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-bold text-slate-700">任务流转建议</span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <span className="text-xs font-medium text-slate-600">标注最大领取条数</span>
                                <div className="flex items-center gap-2">
                                  <input type="number" value={maxSkip} onChange={e => setMaxSkip(Number(e.target.value))}
                                    className="w-16 h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none" min={1} />
                                  <span className="text-[10px] text-slate-400 font-bold">条</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <span className="text-xs font-medium text-slate-600">允许标注员释放批次</span>
                                <Switch checked={allowRelease} onCheckedChange={setAllowRelease} />
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <span className="text-xs font-medium text-slate-600">允许追加标注数据集</span>
                                <Switch checked={allowAppend} onCheckedChange={setAllowAppend} />
                              </div>
                            </div>
                          </div>

                          {/* Group: Quality */}
                          <div className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-bold text-slate-700">质量与回收机制</span>
                            </div>
                            <div className="space-y-3">
                              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-slate-600">超时自动回收</span>
                                  <Switch checked={timeoutEnabled} onCheckedChange={setTimeoutEnabled} />
                                </div>
                                {timeoutEnabled && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">自动回收时限</span>
                                    <div className="flex items-center gap-2">
                                      <input type="number" value={timeoutHours} onChange={e => setTimeoutHours(Number(e.target.value))}
                                        className="w-16 h-8 px-2 text-xs border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none" min={1} />
                                      <span className="text-[10px] text-slate-400 font-bold">Hours</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-slate-600">多人交叉标注</span>
                                  <Switch checked={crossAnnotation} onCheckedChange={setCrossAnnotation} />
                                </div>
                                {crossAnnotation && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">每条数据标注人数</span>
                                    <div className="flex items-center gap-2">
                                      <input type="number" value={crossMax} onChange={e => setCrossMax(Number(e.target.value))}
                                        className="w-16 h-8 px-2 text-xs border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none" min={2} />
                                      <span className="text-[10px] text-slate-400 font-bold">人</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Experts */}
                        <div className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-slate-700">判定专家配置</span>
                          </div>
                          <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">判定专家团队（{judgeExperts.length}）</label>
                              <div className="flex flex-wrap gap-2 min-h-[40px] mb-2">
                                {judgeExperts.map((p, pi) => (
                                  <div key={pi} className="group/tag inline-flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                                    <div className="w-5 h-5 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 shadow-inner">
                                      {p.slice(0, 1)}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 leading-none">{p}</span>
                                    <button
                                      onClick={() => setJudgeExperts(prev => prev.filter((_, i) => i !== pi))}
                                      className="ml-1 w-4 h-4 rounded-lg flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-rose-500 hover:text-white text-slate-400 transition-all duration-200"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="relative w-full search-adder-container">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                  <input
                                    type="text"
                                    value={activeSearchJudge ? searchText : ""}
                                    onChange={e => setSearchText(e.target.value)}
                                    onFocus={() => {
                                      setActiveSearchJudge(true);
                                      setActiveSearchGroupId(null);
                                      setActiveSearchQaNodeIdx(null);
                                      setActiveSearchAcceptNodeIdx(null);
                                      setSearchText("");
                                    }}
                                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-xs placeholder:text-slate-300"
                                    placeholder="搜索姓名或账号添加判定专家..."
                                  />
                                </div>

                                {activeSearchJudge && (
                                  <div className="absolute top-full left-0 right-0 z-[110] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(() => {
                                      const filtered = mockUsers.filter(u =>
                                        (u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                                          u.account.toLowerCase().includes(searchText.toLowerCase())) &&
                                        !judgeExperts.includes(u.name)
                                      );

                                      if (filtered.length === 0) {
                                        return (
                                          <div className="p-4 text-center">
                                            <p className="text-[10px] text-muted-foreground">未找到匹配专家</p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="py-1">
                                          {filtered.map(user => (
                                            <button
                                              key={user.account}
                                              onClick={() => {
                                                setJudgeExperts(prev => [...prev, user.name]);
                                                setSearchText("");
                                                setActiveSearchJudge(false);
                                              }}
                                              className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-0 group/item"
                                            >
                                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {user.name.slice(0, 1)}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700">{user.name}</span>
                                                <span className="text-[9px] text-muted-foreground font-mono">{user.account}</span>
                                              </div>
                                              <Plus className="w-4 h-4 text-primary ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                            </button>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex-1 rounded-lg border bg-card p-6 space-y-4 flex flex-col min-h-0 pb-10">
                      <h3 className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> 标注规范配置</h3>
                      <p className="text-xs text-muted-foreground">单任务仅允许选择一种规范方式</p>
                      <div className="flex gap-2">
                        {(["none", "text", "file"] as const).map(m => (
                          <button key={m} onClick={() => setSpecMode(m)}
                            className={`px-3 py-1.5 text-xs rounded-full border ${specMode === m ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"}`}>
                            {m === "none" ? "不配置" : m === "text" ? "填写说明文本" : "上传附件"}
                          </button>
                        ))}
                      </div>
                      {specMode === "text" && (
                        <div className="flex-1 flex flex-col min-h-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">标注规范（支持 Markdown / HTML）</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                              <button
                                onClick={() => setSpecTab("edit")}
                                className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${specTab === "edit" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => setSpecTab("preview")}
                                className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${specTab === "preview" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                预览
                              </button>
                            </div>
                          </div>

                          {specTab === "edit" ? (
                            <textarea
                              value={specText}
                              onChange={e => setSpecText(e.target.value)}
                              placeholder="请输入通过 Markdown 或 HTML 编写的标注规范说明..."
                              className="flex-1 w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none font-mono leading-relaxed"
                            />
                          ) : (
                            <div className="flex-1 w-full px-6 py-6 border border-slate-200 rounded-2xl bg-white overflow-y-auto custom-scrollbar shadow-inner">
                              {specText ? (
                                <div
                                  className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-800 prose-headings:font-bold prose-p:text-slate-600 prose-strong:text-slate-700 prose-ul:list-disc prose-li:text-slate-600"
                                  dangerouslySetInnerHTML={{ __html: parsedSpec }}
                                />
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                  <Eye className="w-10 h-10 opacity-20" />
                                  <p className="text-xs font-medium">暂无预览内容，请先在编辑视图输入</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {specMode === "file" && (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">点击或拖拽上传文件</p>
                          <p className="text-xs text-muted-foreground mt-1">支持 PDF(1个) 或图片(≤5张)，单文件≤10MB，总计≤20MB</p>
                        </div>
                      )}
                      {specMode !== "none" && (
                        <div className="flex items-center gap-2">
                          <Switch checked={specForceRead} onCheckedChange={setSpecForceRead} />
                          <span className="text-sm">标注前强制阅读规范</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Publish */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 发布确认</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">任务名称</p>
                            <p className="text-sm font-medium">{taskName}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">项目类型</p>
                            <p className="text-sm font-medium">{selectedCategory}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">数据集</p>
                            <p className="text-sm font-medium">
                              {(() => {
                                const ds = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets].find(d => d.id === selectedDatasets[0]?.id);
                                return ds ? `${ds.name} (${selectedDatasets[0].version})` : "未选择";
                              })()}
                            </p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">标注工具</p>
                            <p className="text-sm font-medium">{mockTools.find(t => t.id === selectedTool)?.name || "未选择"}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">批次模式</p>
                            <p className="text-sm font-medium">{batchMode === "dataset" ? "数据集维度" : batchMode === "count" ? `每${batchSize}条` : "单条"}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">分配模式</p>
                            <p className="text-sm font-medium">{assignMode === "person" ? "分配至个人" : assignMode === "team" ? "分配至团队" : "分配至任务池"}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">质检</p>
                            <p className="text-sm font-medium">{qaEnabled ? `${qaNodes.length} 个质检节点` : "未开启"}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground">验收</p>
                            <p className="text-sm font-medium">{acceptEnabled ? `${acceptNodes.length} 个验收节点` : "未开启"}</p>
                          </div>
                          <div className="p-3 rounded bg-muted/30 col-span-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="w-3 h-3" /> 智能预标注
                            </p>
                            {preannotationEnabled && taskTypeBindings.length > 0 ? (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">已配置 {taskTypeBindings.length} 条任务类型映射</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                                  批量
                                </span>
                                {interactiveEnabled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                                    交互
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  · 阈值 {confidenceThreshold.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  · {autoAccept ? "自动接受" : "人工确认"}
                                </span>
                                {preannotationEnabled && estimatedMinutes > 0 && (
                                  <span className="text-[10px] text-amber-700 font-bold">
                                    预计 ≈ {estimatedMinutes} 分钟完成预标注
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-muted-foreground">未开启</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">项目类型、标注工具等核心配置发布后无法修改。发布后系统将自动拆分标注批次并放入任务池。</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary Sidebar */}
          <aside className="w-80 flex-shrink-0 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="h-full flex flex-col gap-6">
              {/* Task Progress Preview Card */}
              <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-primary px-6 py-8 text-primary-foreground relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-4 shadow-xl border border-white/30">
                      {selectedCategory ? (
                        (() => {
                          const Icon = projectTypes.find(t => t.category === selectedCategory)?.icon || Settings;
                          return <Icon className="w-8 h-8" />;
                        })()
                      ) : <Zap className="w-8 h-8" />}
                    </div>
                    <h2 className="font-bold text-lg line-clamp-1 h-7">
                      {taskName || "未命名任务"}
                    </h2>
                    <p className="text-[10px] font-medium opacity-70 uppercase tracking-widest mt-1">
                      {selectedCategory || "请选择项目类型"}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>已选资源汇总</span>
                      <Settings className="w-3 h-3" />
                    </div>

                    {/* Dataset Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground">数据集</p>
                        <p className="text-xs font-medium truncate">
                          {selectedDatasets.length > 0 ? (
                            (() => {
                              const ds = [...myMockDatasets, ...subscribedMockDatasets, ...sharedMockDatasets].find(d => d.id === selectedDatasets[0].id);
                              return ds ? `${ds.name} (${selectedDatasets[0].version})` : "未知数据集";
                            })()
                          ) : "尚未选择"}
                        </p>
                      </div>
                    </div>

                    {/* Tool Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground">标注工具</p>
                        <p className="text-xs font-medium truncate">
                          {selectedTool ? (
                            mockTools.find(t => t.id === selectedTool)?.name || "未知工具"
                          ) : "尚未选择"}
                        </p>
                      </div>
                    </div>

                    {/* Personnel Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground">标注人员</p>
                        <p className="text-xs font-medium">
                          {assignMode === "person"
                            ? `${personGroups.reduce((acc, g) => acc + g.persons.length, 0)} 位标注员`
                            : assignMode === "pool" ? "全空间成员" : "尚未选择"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">当前步骤进度</span>
                      <span className="text-xs font-bold text-primary">{Math.round((step / (steps.length - 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                        style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border-t">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <Info className="w-3 h-3" />
                    <span>系统已自动保存您的配置草稿</span>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-white rounded-2xl p-6 text-slate-600 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                <BookOpen className="w-6 h-6 text-primary mb-4" />
                <h4 className="text-sm font-bold text-slate-900 mb-2">配置小贴士</h4>
                <p className="text-xs leading-relaxed">
                  {step === 0 ? "项目类型选择后不可更改，请根据数据特点（如文本、图像）准确选择。" :
                    step === 1 ? "选择数据结构清晰、标注对象明确且适配标注工具的数据集版本。" :
                      step === 2 ? "复杂的标注任务可以配置多级标签组，支持专家模式下的动态字段联动。" :
                        "发布任务后，系统会自动将数据拆分为批次并在标注大厅中分发。"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t h-20">
        <div className="container max-w-[1440px] h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onBack()}
              className="px-6 py-2 content-center text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            >
              {step === 0 ? "取消创建" : "返回上一步"}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground italic">
              {step > 1 && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/10 transition-all disabled:opacity-50"
                >
                  {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSavingDraft ? "正在保存..." : "保存草稿"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {step < steps.length - 1 ? (
              <button
                onClick={() => canProceed() && setStep(step + 1)}
                disabled={!canProceed()}
                className="group relative px-10 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all"
              >
                <span>下一步: {steps[step + 1]}</span>
                <ChevronRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => setPublishConfirmOpen(true)}
                className="group relative px-10 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all"
              >
                <Zap className="w-4 h-4 inline-block mr-2 text-yellow-400" />
                发布并拉起标注任务
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Publish confirmation dialog */}
      {showVocabularyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">词汇映射表</h3>
              <button onClick={() => setShowVocabularyModal(false)} className="px-2 py-1 text-xs border rounded">关闭</button>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              本模型能预标注的标签范围有限，无对应源标签的数据模型无法预测。
            </p>
            <div className="mb-2">
              <input
                value={sourceLabelSearch}
                onChange={(e) => setSourceLabelSearch(e.target.value)}
                placeholder="搜索源标签"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">当前任务标签</th>
                    <th className="py-2 text-left">源标签</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabularyModalTaskLabels.map((label) => (
                    <tr key={label} className="border-b">
                      <td className="py-2 pr-2">{label}</td>
                      <td className="py-2">
                        <select
                          value={taskLabelMappings[label] || ""}
                          onChange={(e) =>
                            setTaskLabelMappings((prev) => ({ ...prev, [label]: e.target.value }))
                          }
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="">请选择源标签</option>
                          {sourceLabels
                            .filter((x) => x.toLowerCase().includes(sourceLabelSearch.toLowerCase()))
                            .map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {publishConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">确认发布任务</h3>
            <p className="text-sm text-muted-foreground mb-4">项目类型、标注工具等核心配置发布后无法修改，确认发布？</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPublishConfirmOpen(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted/50">取消</button>
              <button onClick={handlePublish} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">确认发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const typeColors: Record<string, string> = {
  "文本类": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "图像类": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "音频类": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "视频类": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "表格类": "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "跨模态类": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default DataAnnotationTaskCreate;

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModelModality = "文本类" | "图像类" | "音频类" | "视频类" | "表格类" | "跨模态类";

export type ModelSource = "内置" | "自建" | "市场";

export type ModelHealth = "健康" | "异常" | "未检测";
export type LowConfidencePolicy = "人工复核" | "自动驳回" | "进入质检池";
export type LabelScope = "固定标签集" | "开放标签集" | "候选集约束";
export type ActiveLearningStrategy = "不启用" | "不确定性采样" | "多样性采样" | "不确定性+多样性";
export type ModelVersionHealth = "健康" | "异常" | "未检测";

export interface TaskPromptBinding {
  taskType: string;
  prompt: string;
}

export interface VocabularyMappingItem {
  sourceLabel: string;
  targetLabel: string;
  notes?: string;
}

export interface MLModelVersion {
  id: string;
  version: string;
  endpointUrl: string;
  authType: "none" | "basic" | "token";
  authValue?: string;
  health: ModelVersionHealth;
  isDefault: boolean;
  creator: string;
  createdAt: string;
  /** 仅用于开放词汇模型：任务类型与 prompt 绑定 */
  prompts: TaskPromptBinding[];
  /** 仅用于非开放词汇模型：词汇表映射 */
  vocabularyMappings: VocabularyMappingItem[];
}

export interface MLModel {
  id: string;
  name: string;
  description: string;
  modality: ModelModality;
  /** 模型支持的任务类型标签，例如 "目标检测"、"情感分析"、"NER" */
  taskTypes: string[];
  /** 模型服务地址，遵循 Label Studio ML Backend 协议 */
  backendUrl: string;
  authType: "none" | "basic" | "token";
  authValue?: string;
  supportsBatch: boolean;
  supportsInteractive: boolean;
  supportsTraining: boolean;
  source: ModelSource;
  /** 平均推理耗时（毫秒/条），用于预估预标注完成时间 */
  avgInferenceMs: number;
  /** 默认置信度阈值；低于此值会标红提示 */
  defaultConfidence: number;
  /** 低置信度样本处理策略 */
  lowConfidencePolicy: LowConfidencePolicy;
  /** 模型标签范围能力 */
  labelScope: LabelScope;
  /** 模型能力边界说明 */
  capabilityBoundary: string;
  /** 是否开放词汇模型（true=开放词汇，false=非开放词汇） */
  isOpenVocabulary: boolean;
  /** 是否支持主动学习 */
  supportsActiveLearning: boolean;
  /** 主动学习策略 */
  activeLearningStrategy: ActiveLearningStrategy;
  /** 任务类型能力说明（key: taskType） */
  taskTypeDescriptions: Record<string, string>;
  /** 版本集合 */
  versions: MLModelVersion[];
  health: ModelHealth;
  isDefault: boolean;
  creator: string;
  createdAt: string;
  version: string;
}

interface MLModelState {
  models: MLModel[];
  addModel: (m: Omit<MLModel, "id" | "createdAt" | "health" | "isDefault">) => string;
  updateModel: (id: string, updates: Partial<MLModel>) => void;
  removeModel: (id: string) => void;
  testConnection: (id: string) => { ok: boolean; latency: number; message: string };
  setDefault: (modality: ModelModality, id: string) => void;
  getModelsByModality: (modality: ModelModality) => MLModel[];
  getDefaultModel: (modality: ModelModality) => MLModel | undefined;
  addVersion: (
    modelId: string,
    version: Omit<MLModelVersion, "id" | "health" | "isDefault" | "creator" | "createdAt">
  ) => string;
  updateVersion: (modelId: string, versionId: string, updates: Partial<MLModelVersion>) => void;
  removeVersion: (modelId: string, versionId: string) => void;
  setDefaultVersion: (modelId: string, versionId: string) => void;
}

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const mkVersionId = () => `VER-${String(Date.now()).slice(-7)}`;

const initialModels: MLModel[] = [
  {
    id: "MDL-001",
    name: "通用文本情感分类 v2",
    description: "基于 BERT-base 微调，支持正面/负面/中性三分类，面向金融、电商场景。",
    modality: "文本类",
    taskTypes: ["文本分类", "情感分析"],
    backendUrl: "http://ml-backend.internal:9090/text-sentiment",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: false,
    supportsTraining: true,
    source: "内置",
    avgInferenceMs: 120,
    defaultConfidence: 0.6,
    lowConfidencePolicy: "人工复核",
    labelScope: "固定标签集",
    capabilityBoundary: "仅支持训练时定义的三分类标签，不支持开放标签。",
    isOpenVocabulary: false,
    supportsActiveLearning: true,
    activeLearningStrategy: "不确定性采样",
    taskTypeDescriptions: {
      文本分类: "三分类（正/负/中）",
      情感分析: "金融、电商场景优化",
    },
    versions: [
      {
        id: "VER-001-1",
        version: "v2.1.0",
        endpointUrl: "http://ml-backend.internal:9090/text-sentiment",
        authType: "none",
        health: "健康",
        isDefault: true,
        creator: "系统",
        createdAt: "2026-01-10 10:00",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "positive", targetLabel: "正面" },
          { sourceLabel: "negative", targetLabel: "负面" },
          { sourceLabel: "neutral", targetLabel: "中性" },
        ],
      },
    ],
    health: "健康",
    isDefault: true,
    creator: "系统",
    createdAt: "2026-01-10 10:00",
    version: "v2.1.0",
  },
  {
    id: "MDL-002",
    name: "中文 NER 抽取器",
    description: "识别人名、地名、机构名等 8 类实体，基于 RoBERTa-wwm。",
    modality: "文本类",
    taskTypes: ["命名实体识别", "信息抽取"],
    backendUrl: "http://ml-backend.internal:9091/ner",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: true,
    supportsTraining: true,
    source: "内置",
    avgInferenceMs: 180,
    defaultConfidence: 0.7,
    lowConfidencePolicy: "进入质检池",
    labelScope: "固定标签集",
    capabilityBoundary: "实体类别需在 schema 中预定义，开放标签效果不稳定。",
    isOpenVocabulary: false,
    supportsActiveLearning: true,
    activeLearningStrategy: "不确定性+多样性",
    taskTypeDescriptions: {
      命名实体识别: "支持人名、地名、机构等",
      信息抽取: "可抽取结构化字段",
    },
    versions: [
      {
        id: "VER-002-1",
        version: "v1.3.0",
        endpointUrl: "http://ml-backend.internal:9091/ner",
        authType: "none",
        health: "健康",
        isDefault: true,
        creator: "系统",
        createdAt: "2026-01-10 10:00",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "PER", targetLabel: "人名" },
          { sourceLabel: "ORG", targetLabel: "机构" },
          { sourceLabel: "LOC", targetLabel: "地点" },
        ],
      },
    ],
    health: "健康",
    isDefault: false,
    creator: "系统",
    createdAt: "2026-01-10 10:00",
    version: "v1.3.0",
  },
  {
    id: "MDL-003",
    name: "通用目标检测 YOLOv8",
    description: "80 类 COCO 物体检测，支持汽车、行人、动物、日用品等常见目标。",
    modality: "图像类",
    taskTypes: ["目标检测", "图像分类"],
    backendUrl: "http://ml-backend.internal:9092/yolo",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: true,
    supportsTraining: false,
    source: "内置",
    avgInferenceMs: 250,
    defaultConfidence: 0.5,
    lowConfidencePolicy: "人工复核",
    labelScope: "候选集约束",
    capabilityBoundary: "建议传入候选标签词表；超出词表的类别召回有限。",
    isOpenVocabulary: true,
    supportsActiveLearning: true,
    activeLearningStrategy: "多样性采样",
    taskTypeDescriptions: {
      目标检测: "支持矩形框目标检测",
      图像分类: "支持多类别评分",
    },
    versions: [
      {
        id: "VER-003-1",
        version: "v8.0.1",
        endpointUrl: "http://ml-backend.internal:9092/yolo",
        authType: "none",
        health: "健康",
        isDefault: true,
        creator: "系统",
        createdAt: "2026-01-15 09:00",
        prompts: [{ taskType: "目标检测", prompt: "检测图中目标并输出 bbox+label+score。" }],
        vocabularyMappings: [],
      },
    ],
    health: "健康",
    isDefault: true,
    creator: "系统",
    createdAt: "2026-01-15 09:00",
    version: "v8.0.1",
  },
  {
    id: "MDL-004",
    name: "Segment Anything (SAM)",
    description: "Meta 开源的交互式图像分割模型，点击或框选即可生成精准掩膜。",
    modality: "图像类",
    taskTypes: ["图像分割", "交互式标注"],
    backendUrl: "http://ml-backend.internal:9093/sam",
    authType: "token",
    supportsBatch: false,
    supportsInteractive: true,
    supportsTraining: false,
    source: "市场",
    avgInferenceMs: 350,
    defaultConfidence: 0.7,
    lowConfidencePolicy: "人工复核",
    labelScope: "开放标签集",
    capabilityBoundary: "擅长交互分割，不适合作为纯批量分类模型使用。",
    isOpenVocabulary: true,
    supportsActiveLearning: false,
    activeLearningStrategy: "不启用",
    taskTypeDescriptions: {
      图像分割: "支持点击/框选触发掩膜生成",
      交互式标注: "支持 context 交互输入",
    },
    versions: [
      {
        id: "VER-004-1",
        version: "v1.0.0",
        endpointUrl: "http://ml-backend.internal:9093/sam",
        authType: "token",
        health: "健康",
        isDefault: true,
        creator: "市场",
        createdAt: "2026-02-01 14:20",
        prompts: [{ taskType: "图像分割", prompt: "根据用户点击点输出 mask 多边形。" }],
        vocabularyMappings: [],
      },
    ],
    health: "健康",
    isDefault: false,
    creator: "市场",
    createdAt: "2026-02-01 14:20",
    version: "v1.0.0",
  },
  {
    id: "MDL-005",
    name: "通用 ASR 语音转写",
    description: "支持中英文混合语音转写，15 种方言识别，WER ≈ 4.2%。",
    modality: "音频类",
    taskTypes: ["语音识别", "语音转写"],
    backendUrl: "http://ml-backend.internal:9094/asr",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: false,
    supportsTraining: false,
    source: "内置",
    avgInferenceMs: 400,
    defaultConfidence: 0.75,
    lowConfidencePolicy: "进入质检池",
    labelScope: "固定标签集",
    capabilityBoundary: "口音重或强噪声场景下准确率下降，需要人工抽检。",
    isOpenVocabulary: false,
    supportsActiveLearning: true,
    activeLearningStrategy: "不确定性采样",
    taskTypeDescriptions: {
      语音识别: "中英文混合识别",
      语音转写: "长音频自动切分",
    },
    versions: [
      {
        id: "VER-005-1",
        version: "v3.2.1",
        endpointUrl: "http://ml-backend.internal:9094/asr",
        authType: "none",
        health: "健康",
        isDefault: true,
        creator: "系统",
        createdAt: "2026-01-20 11:00",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "speaker_1", targetLabel: "客服" },
          { sourceLabel: "speaker_2", targetLabel: "用户" },
        ],
      },
    ],
    health: "健康",
    isDefault: true,
    creator: "系统",
    createdAt: "2026-01-20 11:00",
    version: "v3.2.1",
  },
  {
    id: "MDL-006",
    name: "视频目标追踪 ByteTrack",
    description: "多目标追踪，支持逐帧 ID 保持，适用于视频行为标注初稿。",
    modality: "视频类",
    taskTypes: ["目标追踪", "视频分析"],
    backendUrl: "http://ml-backend.internal:9095/bytetrack",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: false,
    supportsTraining: false,
    source: "内置",
    avgInferenceMs: 800,
    defaultConfidence: 0.65,
    lowConfidencePolicy: "人工复核",
    labelScope: "固定标签集",
    capabilityBoundary: "主要输出轨迹与 ID，语义标签需结合下游分类器。",
    isOpenVocabulary: false,
    supportsActiveLearning: false,
    activeLearningStrategy: "不启用",
    taskTypeDescriptions: {
      目标追踪: "跨帧 ID 追踪",
      视频分析: "关键帧目标定位",
    },
    versions: [
      {
        id: "VER-006-1",
        version: "v1.0.2",
        endpointUrl: "http://ml-backend.internal:9095/bytetrack",
        authType: "none",
        health: "健康",
        isDefault: true,
        creator: "系统",
        createdAt: "2026-02-05 16:00",
        prompts: [],
        vocabularyMappings: [{ sourceLabel: "track_id", targetLabel: "追踪目标ID" }],
      },
    ],
    health: "健康",
    isDefault: true,
    creator: "系统",
    createdAt: "2026-02-05 16:00",
    version: "v1.0.2",
  },
  {
    id: "MDL-007",
    name: "金融表格异常检测",
    description: "针对金融时序/结构化表格数据，给出异常点置信度。",
    modality: "表格类",
    taskTypes: ["异常检测", "时序分析"],
    backendUrl: "http://ml-backend.internal:9096/tabular",
    authType: "none",
    supportsBatch: true,
    supportsInteractive: false,
    supportsTraining: true,
    source: "自建",
    avgInferenceMs: 150,
    defaultConfidence: 0.6,
    lowConfidencePolicy: "自动驳回",
    labelScope: "固定标签集",
    capabilityBoundary: "适用于结构化指标异常，不适用于非结构化文本与图像。",
    isOpenVocabulary: false,
    supportsActiveLearning: true,
    activeLearningStrategy: "不确定性采样",
    taskTypeDescriptions: {
      异常检测: "表格异常分值输出",
      时序分析: "趋势/突变识别",
    },
    versions: [
      {
        id: "VER-007-1",
        version: "v0.9.0",
        endpointUrl: "http://ml-backend.internal:9096/tabular",
        authType: "none",
        health: "未检测",
        isDefault: true,
        creator: "李芳",
        createdAt: "2026-03-01 09:00",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "anomaly", targetLabel: "异常" },
          { sourceLabel: "normal", targetLabel: "正常" },
        ],
      },
    ],
    health: "未检测",
    isDefault: true,
    creator: "李芳",
    createdAt: "2026-03-01 09:00",
    version: "v0.9.0",
  },
  {
    id: "MDL-008",
    name: "图文匹配 CLIP-zh",
    description: "中文图文对齐模型，支持图像与描述相关性打分。",
    modality: "跨模态类",
    taskTypes: ["图文匹配", "多模态检索"],
    backendUrl: "http://ml-backend.internal:9097/clip",
    authType: "token",
    supportsBatch: true,
    supportsInteractive: true,
    supportsTraining: false,
    source: "市场",
    avgInferenceMs: 300,
    defaultConfidence: 0.55,
    lowConfidencePolicy: "人工复核",
    labelScope: "开放标签集",
    capabilityBoundary: "偏检索打分能力，需配合业务规则映射到最终标签。",
    isOpenVocabulary: true,
    supportsActiveLearning: true,
    activeLearningStrategy: "多样性采样",
    taskTypeDescriptions: {
      图文匹配: "图文相关性评分",
      多模态检索: "文本检图/图检文",
    },
    versions: [
      {
        id: "VER-008-1",
        version: "v1.1.0",
        endpointUrl: "http://ml-backend.internal:9097/clip",
        authType: "token",
        health: "健康",
        isDefault: true,
        creator: "市场",
        createdAt: "2026-02-20 10:00",
        prompts: [{ taskType: "图文匹配", prompt: "根据输入文本检索最相关图片并返回 score。" }],
        vocabularyMappings: [],
      },
    ],
    health: "健康",
    isDefault: true,
    creator: "市场",
    createdAt: "2026-02-20 10:00",
    version: "v1.1.0",
  },
];

export const useMLModelStore = create<MLModelState>()(
  persist(
    (set, get) => ({
      models: initialModels,

      addModel: (m) => {
        const id = `MDL-${String(Date.now()).slice(-6)}`;
        const initialVersion: MLModelVersion = {
          id: mkVersionId(),
          version: m.version || "v1.0.0",
          endpointUrl: m.backendUrl,
          authType: m.authType,
          authValue: m.authValue,
          health: "未检测",
          isDefault: true,
          creator: m.creator || "当前用户",
          createdAt: now(),
          prompts: m.isOpenVocabulary
            ? [{ taskType: m.taskTypes[0] || "通用任务", prompt: "请按任务输出结构化标注结果。" }]
            : [],
          vocabularyMappings: m.isOpenVocabulary
            ? []
            : [{ sourceLabel: "label_a", targetLabel: "标签A" }],
        };
        const newModel: MLModel = {
          ...m,
          id,
          versions: [initialVersion],
          createdAt: now(),
          health: "未检测",
          isDefault: false,
        };
        set((state) => {
          const sameModalityDefault = state.models.some(
            (x) => x.modality === m.modality && x.isDefault
          );
          if (!sameModalityDefault) newModel.isDefault = true;
          return { models: [newModel, ...state.models] };
        });
        return id;
      },

      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      removeModel: (id) =>
        set((state) => ({
          models: state.models.filter((m) => m.id !== id),
        })),

      testConnection: (id) => {
        const model = get().models.find((m) => m.id === id);
        if (!model) return { ok: false, latency: 0, message: "模型不存在" };
        const ok = Math.random() > 0.1;
        const latency = Math.floor(80 + Math.random() * 320);
        set((state) => ({
          models: state.models.map((m) =>
            m.id === id ? { ...m, health: ok ? "健康" : "异常" } : m
          ),
        }));
        return {
          ok,
          latency,
          message: ok
            ? `连接成功，模型响应延迟 ${latency}ms`
            : "连接失败：模型服务未响应，请检查 Backend URL",
        };
      },

      setDefault: (modality, id) =>
        set((state) => ({
          models: state.models.map((m) =>
            m.modality === modality ? { ...m, isDefault: m.id === id } : m
          ),
        })),

      getModelsByModality: (modality) =>
        get().models.filter((m) => m.modality === modality || m.modality === "跨模态类"),

      getDefaultModel: (modality) => {
        const models = get().models;
        return (
          models.find((m) => m.modality === modality && m.isDefault) ||
          models.find((m) => m.modality === modality)
        );
      },
      addVersion: (modelId, version) => {
        const id = mkVersionId();
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const hasDefault = m.versions.some((v) => v.isDefault);
            const created: MLModelVersion = {
              ...version,
              id,
              health: "未检测",
              isDefault: hasDefault ? false : true,
              creator: "当前用户",
              createdAt: now(),
            };
            const versions = [...m.versions, created];
            const defaultVersion = versions.find((v) => v.isDefault) || versions[0];
            return {
              ...m,
              versions,
              version: defaultVersion.version,
              backendUrl: defaultVersion.endpointUrl,
              authType: defaultVersion.authType,
              authValue: defaultVersion.authValue,
            };
          }),
        }));
        return id;
      },
      updateVersion: (modelId, versionId, updates) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.map((v) => (v.id === versionId ? { ...v, ...updates } : v));
            const defaultVersion = versions.find((v) => v.isDefault) || versions[0];
            return {
              ...m,
              versions,
              version: defaultVersion?.version || m.version,
              backendUrl: defaultVersion?.endpointUrl || m.backendUrl,
              authType: defaultVersion?.authType || m.authType,
              authValue: defaultVersion?.authValue,
            };
          }),
        })),
      removeVersion: (modelId, versionId) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const left = m.versions.filter((v) => v.id !== versionId);
            if (left.length === 0) return m;
            const hasDefault = left.some((v) => v.isDefault);
            const versions = hasDefault
              ? left
              : left.map((v, i) => (i === 0 ? { ...v, isDefault: true } : v));
            const defaultVersion = versions.find((v) => v.isDefault) || versions[0];
            return {
              ...m,
              versions,
              version: defaultVersion.version,
              backendUrl: defaultVersion.endpointUrl,
              authType: defaultVersion.authType,
              authValue: defaultVersion.authValue,
            };
          }),
        })),
      setDefaultVersion: (modelId, versionId) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.map((v) => ({ ...v, isDefault: v.id === versionId }));
            const defaultVersion = versions.find((v) => v.isDefault) || versions[0];
            return {
              ...m,
              versions,
              version: defaultVersion.version,
              backendUrl: defaultVersion.endpointUrl,
              authType: defaultVersion.authType,
              authValue: defaultVersion.authValue,
            };
          }),
        })),
    }),
    {
      name: "ml-model-storage",
    }
  )
);

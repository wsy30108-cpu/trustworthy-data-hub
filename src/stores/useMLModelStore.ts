import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModelModality = "文本类" | "图像类" | "音频类" | "视频类" | "表格类" | "跨模态类";

export type ModelSource = "内置" | "自建" | "市场";

export type ModelHealth = "健康" | "异常" | "未检测";

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
}

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

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
        const newModel: MLModel = {
          ...m,
          id,
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
    }),
    {
      name: "ml-model-storage",
    }
  )
);

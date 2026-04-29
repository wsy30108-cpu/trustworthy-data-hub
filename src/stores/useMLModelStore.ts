import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModelModality = "文本类" | "图像类" | "音频类" | "视频类" | "表格类" | "跨模态类";
export type ModelHealth = "健康" | "异常" | "未检测";
export type ModelVersionHealth = "健康" | "异常" | "未检测";
export type LabelScope = "固定标签集" | "开放标签集";

/** 开放标签集：一条 Prompt 可绑定多个任务类型 */
export interface TaskPromptBinding {
  taskTypes: string[];
  prompt: string;
}

/** 兼容持久化旧数据中仅有 taskType 的版本 */
export function normalizeTaskPromptBinding(p: TaskPromptBinding & { taskType?: string }): TaskPromptBinding {
  if (Array.isArray(p.taskTypes)) {
    return { taskTypes: [...p.taskTypes], prompt: p.prompt };
  }
  const legacy = (p as { taskType?: string }).taskType;
  return { taskTypes: legacy ? [legacy] : [], prompt: p.prompt };
}

export interface VocabularyMappingItem {
  sourceLabel: string;
  commonMappedLabel: string;
}

export interface MLModelVersion {
  id: string;
  version: string;
  endpointUrl: string;
  authType: "none" | "api_key";
  authUsername?: string;
  authPassword?: string;
  health: ModelVersionHealth;
  creator: string;
  createdAt: string;
  prompts: TaskPromptBinding[];
  vocabularyMappings: VocabularyMappingItem[];
}

export interface MLModel {
  id: string;
  name: string;
  description: string;
  modality: ModelModality;
  taskTypes: string[];
  labelScope: LabelScope;
  supportsBatch: boolean;
  supportsInteractive: boolean;
  supportsTraining: boolean;
  supportsActiveLearning: boolean;
  activeLearningTriggerCondition?: string;
  versions: MLModelVersion[];
  health: ModelHealth;
  creator: string;
  createdAt: string;
  version: string;
  backendUrl: string;
  authType: "none" | "api_key";
  authUsername?: string;
  authPassword?: string;
  avgInferenceMs: number;
  /** 处理任务累计条数（展示用模拟） */
  processingTasks?: number;
  /** 标注员累计接受批次数据条数（展示用模拟） */
  annotatorAccepted?: number;
}

interface MLModelState {
  models: MLModel[];
  addModel: (
    m: Omit<
      MLModel,
      | "id"
      | "createdAt"
      | "health"
      | "versions"
      | "version"
      | "backendUrl"
      | "authType"
      | "authUsername"
      | "authPassword"
    >
  ) => string;
  updateModel: (id: string, updates: Partial<MLModel>) => void;
  removeModel: (id: string) => void;
  testConnection: (id: string) => { ok: boolean; latency: number; message: string };
  getModelsByModality: (modality: ModelModality) => MLModel[];
  getDefaultModel: (modality: ModelModality) => MLModel | undefined;
  addVersion: (
    modelId: string,
    version: Omit<MLModelVersion, "id" | "health" | "creator" | "createdAt">
  ) => string;
  updateVersion: (modelId: string, versionId: string, updates: Partial<MLModelVersion>) => void;
  removeVersion: (modelId: string, versionId: string) => void;
}

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const mkModelId = () => `MDL-${String(Date.now()).slice(-6)}`;
const mkVersionId = () => `VER-${String(Date.now()).slice(-7)}`;

const withVersion = (
  modelBase: Omit<
    MLModel,
    "versions" | "version" | "backendUrl" | "authType" | "authUsername" | "authPassword"
  >,
  version: MLModelVersion
): MLModel => ({
  ...modelBase,
  versions: [version],
  version: version.version,
  backendUrl: version.endpointUrl,
  authType: version.authType,
  authUsername: version.authUsername,
  authPassword: version.authPassword,
});

const initialModels: MLModel[] = [
  withVersion(
    {
      id: "MDL-001",
      name: "通用文本情感分类",
      description: "文本情感分类基础模型",
      modality: "文本类",
      taskTypes: ["文本分类", "情感分析"],
      labelScope: "固定标签集",
      supportsBatch: true,
      supportsInteractive: false,
      supportsTraining: true,
      supportsActiveLearning: true,
      activeLearningTriggerCondition: "100条",
      health: "健康",
      creator: "系统",
      createdAt: "2026-01-10 10:00",
      avgInferenceMs: 120,
      processingTasks: 12800,
      annotatorAccepted: 9620,
    },
    {
      id: "VER-001-1",
      version: "v2.1.0",
      endpointUrl: "http://ml-backend.internal:9090/text-sentiment",
      authType: "none",
      health: "健康",
      creator: "系统",
      createdAt: "2026-01-10 10:00",
      prompts: [],
      vocabularyMappings: [
        { sourceLabel: "positive", commonMappedLabel: "正面" },
        { sourceLabel: "negative", commonMappedLabel: "负面" },
      ],
    }
  ),
  withVersion(
    {
      id: "MDL-003",
      name: "通用目标检测 YOLO",
      description: "图像目标检测模型",
      modality: "图像类",
      taskTypes: ["目标检测", "图像分类"],
      labelScope: "固定标签集",
      supportsBatch: true,
      supportsInteractive: true,
      supportsTraining: false,
      supportsActiveLearning: true,
      activeLearningTriggerCondition: "200条",
      health: "健康",
      creator: "系统",
      createdAt: "2026-01-15 09:00",
      avgInferenceMs: 250,
      processingTasks: 6420,
      annotatorAccepted: 5100,
    },
    {
      id: "VER-003-1",
      version: "v8.0.1",
      endpointUrl: "http://ml-backend.internal:9092/yolo",
      authType: "none",
      health: "健康",
      creator: "系统",
      createdAt: "2026-01-15 09:00",
      prompts: [],
      vocabularyMappings: [
        { sourceLabel: "car", commonMappedLabel: "car" },
        { sourceLabel: "person", commonMappedLabel: "person" },
      ],
    }
  ),
];

const syncModelRuntimeFromLatestVersion = (m: MLModel): MLModel => {
  const latest = [...m.versions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  if (!latest) return m;
  return {
    ...m,
    version: latest.version,
    backendUrl: latest.endpointUrl,
    authType: latest.authType,
    authUsername: latest.authUsername,
    authPassword: latest.authPassword,
  };
};

export const useMLModelStore = create<MLModelState>()(
  persist(
    (set, get) => ({
      models: initialModels,
      addModel: (m) => {
        const id = mkModelId();
        const initialVersion: MLModelVersion = {
          id: mkVersionId(),
          version: "v1.0.0",
          endpointUrl: "",
          authType: "none",
          health: "未检测",
          creator: "当前用户",
          createdAt: now(),
          prompts:
            m.labelScope === "开放标签集"
              ? [{ taskTypes: m.taskTypes[0] ? [m.taskTypes[0]] : [], prompt: "" }]
              : [],
          vocabularyMappings:
            m.labelScope === "固定标签集" ? [{ sourceLabel: "", commonMappedLabel: "" }] : [],
        };
        const model = withVersion(
          {
            ...m,
            id,
            health: "未检测",
            creator: "当前用户",
            createdAt: now(),
          },
          initialVersion
        );
        set((state) => ({ models: [model, ...state.models] }));
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
          message: ok ? `模型连接正常，响应 ${latency}ms` : "模型连接异常，请检查版本配置",
        };
      },
      getModelsByModality: (modality) =>
        get().models.filter((m) => m.modality === modality || m.modality === "跨模态类"),
      getDefaultModel: (modality) => get().models.find((m) => m.modality === modality),
      addVersion: (modelId, version) => {
        const id = mkVersionId();
        const newVersion: MLModelVersion = {
          ...version,
          id,
          health: "未检测",
          creator: "当前用户",
          createdAt: now(),
        };
        set((state) => ({
          models: state.models.map((m) =>
            m.id === modelId ? syncModelRuntimeFromLatestVersion({ ...m, versions: [...m.versions, newVersion] }) : m
          ),
        }));
        return id;
      },
      updateVersion: (modelId, versionId, updates) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.map((v) => (v.id === versionId ? { ...v, ...updates } : v));
            return syncModelRuntimeFromLatestVersion({ ...m, versions });
          }),
        })),
      removeVersion: (modelId, versionId) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.filter((v) => v.id !== versionId);
            if (versions.length === 0) return m;
            return syncModelRuntimeFromLatestVersion({ ...m, versions });
          }),
        })),
    }),
    { name: "ml-model-storage" }
  )
);

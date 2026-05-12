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

export type MLModelVersionSource = "manual" | "active_learning";

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
  /** 手动添加｜主动学习 */
  source: MLModelVersionSource;
  /** 来源为主动学习时：是否达到主动学习触发条件 */
  activeLearningTriggerReached?: boolean;
  /** 来源为主动学习时：训练状态 */
  trainingStatus?: "未训练" | "训练中" | "已完成";
  /** 该副本维度：累计处理任务条数（展示） */
  processingTasks?: number;
  /** 该副本维度：标注员累计接受条数（展示） */
  annotatorAccepted?: number;
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

/** 模型卡片/配置用的推理入口：优先取非「主动学习」来源的最新版本，避免主动学习行覆盖主 endpoint */
const syncModelRuntimeFromLatestVersion = (m: MLModel): MLModel => {
  const pool = m.versions.filter((v) => (v.source ?? "manual") !== "active_learning");
  const list = [...(pool.length ? pool : m.versions)].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const latest = list[0];
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

/** 卡片上主动学习「已开启」的模型须在版本管理中保留一条来源为主动学习的版本（缺则补齐） */
function ensureActiveLearningVersionRow(m: MLModel): MLModel {
  if (!m.supportsActiveLearning) return m;
  const versions = [...m.versions];
  const hasAl = versions.some((v) => (v.source ?? "manual") === "active_learning");
  if (hasAl) return m;
  const base =
    [...versions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ??
    [...versions].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))[0];
  if (!base) return m;
  const baseUrl = (base.endpointUrl || "").trim();
  const alEndpoint =
    baseUrl === ""
      ? ""
      : /\/active\/?$/i.test(baseUrl)
        ? baseUrl
        : `${baseUrl.replace(/\/?$/, "")}/active`;
  const vocab = base.vocabularyMappings.map((row) => ({ ...row }));
  const normalizedPrompts = base.prompts.map((row) =>
    normalizeTaskPromptBinding(row as TaskPromptBinding & { taskType?: string })
  );
  const verStem = /^v\d/i.test(base.version) ? `${base.version}-al` : `${base.version}-active-learning`;
  const basePt = base.processingTasks ?? 0;
  const baseAa = base.annotatorAccepted ?? 0;
  const al: MLModelVersion = {
    id: mkVersionId(),
    version: verStem.slice(0, 64),
    endpointUrl: alEndpoint,
    authType: base.authType,
    authUsername: base.authUsername,
    authPassword: base.authPassword,
    health: "未检测",
    creator: "主动学习任务",
    createdAt: base.createdAt,
    processingTasks: basePt > 0 ? Math.max(1, Math.floor(basePt * 0.35)) : 0,
    annotatorAccepted: baseAa > 0 ? Math.max(0, Math.floor(baseAa * 0.32)) : 0,
    prompts:
      normalizedPrompts.length > 0
        ? normalizedPrompts
        : m.labelScope === "开放标签集"
          ? [{ taskTypes: m.taskTypes[0] ? [m.taskTypes[0]] : [], prompt: "" }]
          : [],
    vocabularyMappings: vocab.length > 0 ? vocab : [{ sourceLabel: "", commonMappedLabel: "" }],
    source: "active_learning",
    activeLearningTriggerReached: false,
    trainingStatus: "未训练",
  };
  versions.push(al);
  return syncModelRuntimeFromLatestVersion({ ...m, versions });
}

function mapModelsEnsuringActiveLearning(rows: MLModel[]): MLModel[] {
  return rows.map((model) => ensureActiveLearningVersionRow(model));
}
const initialModels: MLModel[] = mapModelsEnsuringActiveLearning([
  syncModelRuntimeFromLatestVersion({
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
    health: "健康",
    creator: "系统",
    createdAt: "2026-01-10 10:00",
    avgInferenceMs: 120,
    versions: [
      {
        id: "VER-001-1",
        version: "生产主副本",
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
        source: "manual",
        processingTasks: 8200,
        annotatorAccepted: 6150,
      },
      {
        id: "VER-001-AL",
        version: "主动学习训练副本",
        endpointUrl: "http://ml-backend.internal:9090/text-sentiment/active",
        authType: "none",
        health: "健康",
        creator: "主动学习任务",
        createdAt: "2026-01-12 11:05",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "positive", commonMappedLabel: "正面" },
          { sourceLabel: "negative", commonMappedLabel: "负面" },
        ],
        source: "active_learning",
        activeLearningTriggerReached: true,
        trainingStatus: "已完成",
        processingTasks: 4600,
        annotatorAccepted: 3470,
      },
    ],
  } as MLModel),
  syncModelRuntimeFromLatestVersion({
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
    health: "健康",
    creator: "系统",
    createdAt: "2026-01-15 09:00",
    avgInferenceMs: 250,
    versions: [
      {
        id: "VER-003-1",
        version: "推理主副本",
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
        source: "manual",
        processingTasks: 4100,
        annotatorAccepted: 3288,
      },
      {
        id: "VER-003-AL",
        version: "主动学习微调副本",
        endpointUrl: "http://ml-backend.internal:9092/yolo/active",
        authType: "none",
        health: "健康",
        creator: "主动学习任务",
        createdAt: "2026-01-18 16:20",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "car", commonMappedLabel: "car" },
          { sourceLabel: "person", commonMappedLabel: "person" },
        ],
        source: "active_learning",
        activeLearningTriggerReached: false,
        trainingStatus: "训练中",
        processingTasks: 2320,
        annotatorAccepted: 1812,
      },
    ],
  } as MLModel),
  syncModelRuntimeFromLatestVersion({
    id: "MDL-004",
    name: "多任务指令理解（开放标签集）",
    description: "基于 Prompt 的开放词汇文本理解，可多任务绑定",
    modality: "文本类",
    taskTypes: ["文本分类", "信息抽取"],
    labelScope: "开放标签集",
    supportsBatch: true,
    supportsInteractive: true,
    supportsTraining: true,
    supportsActiveLearning: false,
    health: "健康",
    creator: "系统",
    createdAt: "2026-01-20 11:00",
    avgInferenceMs: 180,
    versions: [
      {
        id: "VER-004-1",
        version: "联调演示副本-A",
        endpointUrl: "http://ml-backend.internal:9095/open-llm",
        authType: "none",
        health: "健康",
        creator: "系统",
        createdAt: "2026-01-20 11:00",
        prompts: [
          { taskTypes: ["文本分类"], prompt: "对下列文本输出情感类别（正面/负面/中性）。" },
          { taskTypes: ["信息抽取"], prompt: "抽取文本中的人名与机构名实体。" },
        ],
        vocabularyMappings: [],
        source: "manual",
        processingTasks: 5600,
        annotatorAccepted: 4230,
      },
    ],
  } as MLModel),
  syncModelRuntimeFromLatestVersion({
    id: "MDL-005",
    name: "表格单元格语义分类（封闭标签集）",
    description: "针对表格类数据的固定标签集分类模型",
    modality: "表格类",
    taskTypes: ["文本分类"],
    labelScope: "固定标签集",
    supportsBatch: true,
    supportsInteractive: false,
    supportsTraining: false,
    supportsActiveLearning: true,
    health: "未检测",
    creator: "系统",
    createdAt: "2026-02-01 09:30",
    avgInferenceMs: 95,
    versions: [
      {
        id: "VER-005-1",
        version: "内测冻结副本",
        endpointUrl: "http://ml-backend.internal:9096/table-slot",
        authType: "none",
        health: "未检测",
        creator: "系统",
        createdAt: "2026-02-01 09:30",
        prompts: [],
        vocabularyMappings: [
          { sourceLabel: "HEADER", commonMappedLabel: "表头" },
          { sourceLabel: "DATA", commonMappedLabel: "数据单元格" },
        ],
        source: "manual",
        processingTasks: 1280,
        annotatorAccepted: 990,
      },
    ],
  } as MLModel),
  syncModelRuntimeFromLatestVersion({
    id: "MDL-006",
    name: "轻量多模态占位模型",
    description: "跨模态占位与路由演示",
    modality: "跨模态类",
    taskTypes: ["文本分类", "目标检测"],
    labelScope: "开放标签集",
    supportsBatch: false,
    supportsInteractive: true,
    supportsTraining: false,
    supportsActiveLearning: false,
    health: "健康",
    creator: "系统",
    createdAt: "2026-02-05 14:00",
    avgInferenceMs: 300,
    versions: [
      {
        id: "VER-006-1",
        version: "仅交互副本",
        endpointUrl: "http://ml-backend.internal:9097/mm-router",
        authType: "none",
        health: "健康",
        creator: "系统",
        createdAt: "2026-02-05 14:00",
        prompts: [{ taskTypes: ["文本分类", "目标检测"], prompt: "根据输入模态选择合适的工具链。" }],
        vocabularyMappings: [],
        source: "manual",
        processingTasks: 900,
        annotatorAccepted: 720,
      },
    ],
  } as MLModel),
]);
export const useMLModelStore = create<MLModelState>()(
  persist(
    (set, get) => ({
      models: initialModels,
      addModel: (m) => {
        const id = mkModelId();
        const initialVersion: MLModelVersion = {
          id: mkVersionId(),
          version: "初始副本",
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
          source: "manual",
          processingTasks: 0,
          annotatorAccepted: 0,
        };
        const model = ensureActiveLearningVersionRow(
          withVersion(
            {
              ...m,
              id,
              health: "未检测",
              creator: "当前用户",
              createdAt: now(),
            },
            initialVersion
          )
        );
        set((state) => ({ models: [model, ...state.models] }));
        return id;
      },
      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((m) =>
            m.id !== id ? m : ensureActiveLearningVersionRow({ ...m, ...updates })
          ),
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
          message: ok ? `模型连接正常，响应 ${latency}ms` : "模型连接异常，请检查副本配置",
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
          source: version.source ?? "manual",
        };
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const next = syncModelRuntimeFromLatestVersion({ ...m, versions: [...m.versions, newVersion] });
            return ensureActiveLearningVersionRow(next);
          }),
        }));
        return id;
      },
      updateVersion: (modelId, versionId, updates) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.map((v) => (v.id === versionId ? { ...v, ...updates } : v));
            const next = syncModelRuntimeFromLatestVersion({ ...m, versions });
            return ensureActiveLearningVersionRow(next);
          }),
        })),
      removeVersion: (modelId, versionId) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m;
            const versions = m.versions.filter((v) => v.id !== versionId);
            if (versions.length === 0) return m;
            const next = syncModelRuntimeFromLatestVersion({ ...m, versions });
            return ensureActiveLearningVersionRow(next);
          }),
        })),
    }),
    {
      name: "ml-model-storage",
      merge: (persistedState, currentState) => {
        const cur = currentState as MLModelState;
        const persisted = persistedState as Partial<MLModelState> | undefined;
        const merged: MLModelState = { ...cur, ...persisted };
        return {
          ...merged,
          models: mapModelsEnsuringActiveLearning(merged.models ?? cur.models),
        };
      },
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PreannotationStatus = "未开启" | "排队中" | "执行中" | "已完成" | "部分失败";

export interface TaskPreannotationConfig {
  /** 任务/批次 ID */
  taskId: string;
  /** 是否开启批量预标注（任务创建时决定，任务下发后立即执行） */
  batchEnabled: boolean;
  /** 是否开启交互式预标注（标注员操作时实时触发模型推理） */
  interactiveEnabled: boolean;
  /** 关联的模型 ID */
  modelId: string;
  /** 模型名称快照，方便展示 */
  modelName: string;
  /** 模型版本 ID */
  modelVersionId?: string;
  /** 模型版本号快照 */
  modelVersion?: string;
  /** 当前任务类型 */
  taskType?: string;
  /** 模态快照 */
  modality: string;
  /** 低于该置信度视为"低质预测"需要人工审校 */
  confidenceThreshold: number;
  /** 是否自动接受（auto-accept），为 false 时标注员需要手动点接受 */
  autoAccept: boolean;
  /** 该任务/批次总样本数 */
  total: number;
  /** 已完成预标注的样本数 */
  preannotated: number;
  /** 预标注失败的样本数 */
  failed: number;
  /** 预标注状态 */
  status: PreannotationStatus;
  /** 任务下发时间（预标注触发起点） */
  dispatchedAt?: string;
  /** 预估完成时间 */
  estimatedFinishAt?: string;
  /** 真实完成时间 */
  finishedAt?: string;
}

interface TaskPreannotationState {
  configs: Record<string, TaskPreannotationConfig>;
  /** 任务创建时写入配置并立即开始模拟执行 */
  dispatch: (config: Omit<TaskPreannotationConfig, "preannotated" | "failed" | "status" | "dispatchedAt" | "estimatedFinishAt">) => void;
  /** 手动触发进度推进（供 setInterval 使用） */
  tick: () => void;
  /** 清空某任务配置 */
  clear: (taskId: string) => void;
  /** 按 taskId 查询 */
  get: (taskId: string) => TaskPreannotationConfig | undefined;
}

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const addMs = (ms: number) =>
  new Date(Date.now() + ms).toISOString().slice(0, 16).replace("T", " ");

/** 模拟历史数据：几个批次已在预标注中，用于 UI 展示 */
const initialConfigs: Record<string, TaskPreannotationConfig> = {
  "BT-001": {
    taskId: "BT-001",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-001",
    modelName: "通用文本情感分类 v2",
    modality: "文本类",
    confidenceThreshold: 0.6,
    autoAccept: false,
    total: 200,
    preannotated: 200,
    failed: 0,
    status: "已完成",
    dispatchedAt: "2026-02-20 09:00",
    estimatedFinishAt: "2026-02-20 09:30",
    finishedAt: "2026-02-20 09:28",
  },
  "BT-NER-001": {
    taskId: "BT-NER-001",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-001",
    modelName: "中文 NER 多类型",
    modality: "文本类",
    taskType: "实体识别",
    confidenceThreshold: 0.72,
    autoAccept: false,
    total: 180,
    preannotated: 120,
    failed: 0,
    status: "执行中",
    dispatchedAt: "2026-04-29 09:05",
    estimatedFinishAt: "2026-04-29 12:30",
  },
  "BT-005": {
    taskId: "BT-005",
    batchEnabled: true,
    interactiveEnabled: true,
    modelId: "MDL-004",
    modelName: "Segment Anything (SAM)",
    modality: "图像类",
    confidenceThreshold: 0.7,
    autoAccept: false,
    total: 1000,
    preannotated: 640,
    failed: 2,
    status: "执行中",
    dispatchedAt: "2026-03-05 10:00",
    estimatedFinishAt: "2026-03-05 13:45",
  },
  "BT-009": {
    taskId: "BT-009",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-005",
    modelName: "通用 ASR 语音转写",
    modality: "音频类",
    confidenceThreshold: 0.75,
    autoAccept: true,
    total: 300,
    preannotated: 300,
    failed: 0,
    status: "已完成",
    dispatchedAt: "2026-03-02 08:00",
    estimatedFinishAt: "2026-03-02 10:00",
    finishedAt: "2026-03-02 09:45",
  },
  "BT-018": {
    taskId: "BT-018",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-002",
    modelName: "中文 NER 抽取器",
    modality: "文本类",
    confidenceThreshold: 0.7,
    autoAccept: false,
    total: 200,
    preannotated: 45,
    failed: 0,
    status: "执行中",
    dispatchedAt: "2026-03-18 10:20",
    estimatedFinishAt: "2026-03-18 11:00",
  },
  "BT-011": {
    taskId: "BT-011",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-006",
    modelName: "视频目标追踪 ByteTrack",
    modality: "视频类",
    confidenceThreshold: 0.65,
    autoAccept: false,
    total: 600,
    preannotated: 600,
    failed: 0,
    status: "已完成",
    dispatchedAt: "2026-03-10 10:00",
    estimatedFinishAt: "2026-03-10 18:00",
    finishedAt: "2026-03-10 17:35",
  },
  "BT-014": {
    taskId: "BT-014",
    batchEnabled: true,
    interactiveEnabled: false,
    modelId: "MDL-001",
    modelName: "通用文本情感分类 v2",
    modality: "文本类",
    confidenceThreshold: 0.6,
    autoAccept: false,
    total: 100,
    preannotated: 100,
    failed: 0,
    status: "已完成",
    dispatchedAt: "2026-03-15 09:00",
    estimatedFinishAt: "2026-03-15 09:20",
    finishedAt: "2026-03-15 09:18",
  },
};

export const useTaskPreannotationStore = create<TaskPreannotationState>()(
  persist(
    (set, get) => ({
      configs: initialConfigs,

      dispatch: (config) => {
        const total = config.total;
        const estMs = total * 150;
        set((state) => ({
          configs: {
            ...state.configs,
            [config.taskId]: {
              ...config,
              preannotated: 0,
              failed: 0,
              status: config.batchEnabled ? "排队中" : "未开启",
              dispatchedAt: now(),
              estimatedFinishAt: config.batchEnabled ? addMs(estMs) : undefined,
            },
          },
        }));
      },

      tick: () => {
        set((state) => {
          const next: Record<string, TaskPreannotationConfig> = { ...state.configs };
          let changed = false;
          Object.values(next).forEach((cfg) => {
            if (!cfg.batchEnabled) return;
            if (cfg.status === "已完成" || cfg.status === "部分失败") return;
            if (cfg.preannotated >= cfg.total) {
              next[cfg.taskId] = {
                ...cfg,
                status: cfg.failed > 0 ? "部分失败" : "已完成",
                finishedAt: now(),
              };
              changed = true;
              return;
            }
            const batchSize = Math.max(1, Math.ceil(cfg.total / 30));
            const inc = Math.min(batchSize, cfg.total - cfg.preannotated);
            next[cfg.taskId] = {
              ...cfg,
              preannotated: cfg.preannotated + inc,
              status: "执行中",
            };
            changed = true;
          });
          return changed ? { configs: next } : state;
        });
      },

      clear: (taskId) =>
        set((state) => {
          const next = { ...state.configs };
          delete next[taskId];
          return { configs: next };
        }),

      get: (taskId) => get().configs[taskId],
    }),
    { name: "task-preannotation-storage" }
  )
);

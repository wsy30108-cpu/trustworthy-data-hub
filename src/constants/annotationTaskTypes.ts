/**
 * 标注任务类型（模型管理与新建任务等处共用）
 */
export const ANNOTATION_TASK_TYPES = [
  "文本分类",
  "情感分析",
  "实体识别",
  "目标检测",
  "图像分类",
  "语音转写",
  "视频追踪",
] as const;

export type AnnotationTaskType = (typeof ANNOTATION_TASK_TYPES)[number];

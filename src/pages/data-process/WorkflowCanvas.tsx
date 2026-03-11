import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Trash2, Boxes, Settings2, ChevronDown, ChevronRight,
  X, PanelLeftClose, PanelLeftOpen, Search, Plus, Minus,
  Type, Image, Mic, Video, Layers, Database, FileOutput, Wrench,
  AlertTriangle, CheckCircle2, HelpCircle, Eye, Upload, Map,
  PanelRightClose, PanelRightOpen, Code2, LayoutGrid, AlignHorizontalDistributeCenter, Info,
  Bug, Square, Clock, Activity, Terminal, Loader2
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ─── Types ─── */
interface Position { x: number; y: number }

type ParamType = "string" | "integer" | "float" | "boolean" | "enum" | "enum_multi" | "range" | "file" | "regex" | "keyvalue";

interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  required?: boolean;
  description?: string;
}

interface CanvasNode {
  id: string;
  type: string;
  label: string;
  category: string;
  operatorType: string;
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  config: Record<string, any>;
  description?: string;
  dataType?: string; // data type for port compatibility
}

interface Connection {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
  compatible?: boolean;
}

interface ValidationError {
  id: string;
  type: "error" | "warning";
  message: string;
  nodeIds?: string[];
  connectionIds?: string[];
}

interface Operator {
  type: string;
  label: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dataType?: string;
}

interface OperatorTypeGroup {
  name: string;
  hint: string;
  operators: Operator[];
}

interface OperatorCategory {
  name: string;
  icon: typeof Type;
  types: OperatorTypeGroup[];
}

/* ─── Port data types for compatibility checking ─── */
const portDataTypes: Record<string, string> = {
  data: "text",
  images: "image",
  audio: "audio",
  video: "video",
  rejected: "text",
};

const typeCompatibility: Record<string, string[]> = {
  text: ["text"],
  image: ["image"],
  audio: ["audio"],
  video: ["video", "image"], // video can produce images (frame extraction)
};

const isTypeCompatible = (outputPort: string, inputPort: string): boolean => {
  const outType = portDataTypes[outputPort] || "text";
  const inType = portDataTypes[inputPort] || "text";
  return (typeCompatibility[outType] || [outType]).includes(inType) || outType === inType;
};

/* ─── Operator parameter definitions (mock) ─── */
const operatorParams: Record<string, ParamDef[]> = {
  // Groupers
  key_value_grouper: [
    { key: "group_key", label: "分组键", type: "string", required: true, description: "指定用于分组的键名" },
    { key: "batch_size", label: "批大小", type: "integer", default: 1000, min: 1, max: 100000 },
  ],
  naive_grouper: [
    { key: "batch_size", label: "批大小", type: "integer", default: 1000, min: 1, max: 100000 },
  ],
  // Dedup
  doc_dedup: [
    { key: "doc_key", label: "文档键", type: "string", default: "text" },
    { key: "lowercase", label: "忽略大小写", type: "boolean", default: true },
  ],
  doc_minhash_dedup: [
    { key: "threshold", label: "相似度阈值", type: "float", default: 0.7, min: 0, max: 1, step: 0.05 },
    { key: "num_perm", label: "排列数", type: "integer", default: 256, min: 64, max: 1024 },
    { key: "ngram_size", label: "N-gram大小", type: "integer", default: 5, min: 1, max: 20 },
  ],
  doc_simhash_dedup: [
    { key: "threshold", label: "海明距离阈值", type: "integer", default: 3, min: 0, max: 64 },
    { key: "num_blocks", label: "分块数", type: "integer", default: 6, min: 1, max: 16 },
  ],
  // Mappers
  chinese_convert_mapper: [
    { key: "mode", label: "转换模式", type: "enum", options: ["s2t", "t2s", "s2tw", "tw2s", "s2jp", "jp2s"], default: "s2t" },
  ],
  content_replace_mapper: [
    { key: "pattern", label: "正则表达式", type: "regex", required: true, description: "匹配模式" },
    { key: "replacement", label: "替换内容", type: "string", default: "" },
  ],
  text_chunk_mapper: [
    { key: "max_len", label: "最大长度", type: "integer", default: 512, min: 1, max: 10000 },
    { key: "overlap", label: "重叠长度", type: "integer", default: 50, min: 0, max: 1000 },
    { key: "split_by", label: "切分方式", type: "enum", options: ["sentence", "paragraph", "token"], default: "sentence" },
  ],
  sentence_split_mapper: [
    { key: "lang", label: "语言", type: "enum", options: ["zh", "en", "auto"], default: "auto" },
  ],
  // Filters
  text_length_filter: [
    { key: "min_len", label: "最小长度", type: "integer", default: 10, min: 0 },
    { key: "max_len", label: "最大长度", type: "integer", default: 10000, min: 0 },
  ],
  word_num_filter: [
    { key: "min_num", label: "最小词数", type: "integer", default: 5, min: 0 },
    { key: "max_num", label: "最大词数", type: "integer", default: 5000, min: 0 },
  ],
  token_num_filter: [
    { key: "min_num", label: "最小Token数", type: "integer", default: 10, min: 0 },
    { key: "max_num", label: "最大Token数", type: "integer", default: 4096, min: 0 },
    { key: "model", label: "分词模型", type: "enum", options: ["gpt2", "bert-base", "llama"], default: "gpt2" },
  ],
  alphanumeric_filter: [
    { key: "min_ratio", label: "最小比率", type: "float", default: 0.0, min: 0, max: 1, step: 0.01 },
    { key: "max_ratio", label: "最大比率", type: "float", default: 1.0, min: 0, max: 1, step: 0.01 },
  ],
  special_char_filter: [
    { key: "min_ratio", label: "最小比率", type: "float", default: 0.0, min: 0, max: 1, step: 0.01 },
    { key: "max_ratio", label: "最大比率", type: "float", default: 0.25, min: 0, max: 1, step: 0.01 },
  ],
  lang_id_score_filter: [
    { key: "lang", label: "目标语言", type: "enum", options: ["zh", "en", "ja", "ko", "fr", "de"], default: "zh" },
    { key: "min_score", label: "最低置信度", type: "float", default: 0.5, min: 0, max: 1, step: 0.05 },
  ],
  // Selectors
  random_selector: [
    { key: "ratio", label: "采样比例", type: "float", default: 0.1, min: 0, max: 1, step: 0.01 },
  ],
  topk_selector: [
    { key: "field", label: "排序字段", type: "string", required: true },
    { key: "k", label: "Top K", type: "integer", default: 100, min: 1 },
    { key: "reverse", label: "降序排列", type: "boolean", default: true },
  ],
  // Image
  image_blur_mapper: [
    { key: "blur_type", label: "模糊类型", type: "enum", options: ["gaussian", "box", "median"], default: "gaussian" },
    { key: "radius", label: "模糊半径", type: "integer", default: 5, min: 1, max: 50 },
    { key: "prob", label: "执行概率", type: "float", default: 1.0, min: 0, max: 1, step: 0.1 },
  ],
  image_aspect_ratio_filter: [
    { key: "min_ratio", label: "最小宽高比", type: "float", default: 0.5, min: 0, max: 10, step: 0.1 },
    { key: "max_ratio", label: "最大宽高比", type: "float", default: 2.0, min: 0, max: 10, step: 0.1 },
  ],
  // Video
  video_duration_filter: [
    { key: "min_duration", label: "最短时长(秒)", type: "float", default: 1, min: 0, step: 0.5 },
    { key: "max_duration", label: "最长时长(秒)", type: "float", default: 300, min: 0, step: 0.5 },
  ],
  // Audio
  audio_duration_filter: [
    { key: "min_duration", label: "最短时长(秒)", type: "float", default: 0.5, min: 0, step: 0.1 },
    { key: "max_duration", label: "最长时长(秒)", type: "float", default: 600, min: 0, step: 0.5 },
  ],
};

// Default params for operators not explicitly listed
const defaultOperatorParams: ParamDef[] = [
  { key: "batch_size", label: "批大小", type: "integer", default: 1000, min: 1, max: 100000 },
  { key: "num_proc", label: "并行度", type: "integer", default: 4, min: 1, max: 64 },
];

/* ─── Complete Operator Catalog ─── */
const operatorCatalog: OperatorCategory[] = [
  {
    name: "文本", icon: Type, types: [
      {
        name: "分组", hint: "将样本分组，每一组组成一个批量样本", operators: [
          { type: "key_value_grouper", label: "键值分组器", description: "根据指定键中的值将样本分组为批处理。", inputs: ["data"], outputs: ["data"] },
          { type: "naive_grouper", label: "朴素分组器", description: "将数据集中的所有样本分组为单个批处理样本。", inputs: ["data"], outputs: ["data"] },
          { type: "naive_reverse_grouper", label: "朴素反向分组器", description: "将批处理的样品分成单个样品。", inputs: ["data"], outputs: ["data"] },
        ]
      },
      {
        name: "去重", hint: "识别、删除重复样本。", operators: [
          { type: "doc_dedup", label: "文档去重器", description: "使用完全匹配在文档级别删除重复的样本。", inputs: ["data"], outputs: ["data"] },
          { type: "doc_minhash_dedup", label: "文档MinHash去重器", description: "使用MinHashLSH在文档级别删除重复样本。", inputs: ["data"], outputs: ["data"] },
          { type: "doc_simhash_dedup", label: "文档SimHash去重器", description: "使用SimHash在文档级别删除重复的样本。", inputs: ["data"], outputs: ["data"] },
        ]
      },
      {
        name: "映射", hint: "对数据样本进行编辑和转换", operators: [
          { type: "qa_calibration_mapper", label: "问答校准映射器", description: "使用API模型根据参考文本校准问答对。", inputs: ["data"], outputs: ["data"] },
          { type: "query_calibration_mapper", label: "查询校准映射器", description: "基于参考文本校准问答对中的查询。", inputs: ["data"], outputs: ["data"] },
          { type: "response_calibration_mapper", label: "响应校准映射器", description: "根据参考文本校准问答对中的回答。", inputs: ["data"], outputs: ["data"] },
          { type: "chinese_convert_mapper", label: "中文繁简转换映射器", description: "映射器在繁体、简体和日文汉字之间转换中文文本。", inputs: ["data"], outputs: ["data"] },
          { type: "copyright_clean_mapper", label: "版权信息清理映射器", description: "清除文本示例开头的版权注释。", inputs: ["data"], outputs: ["data"] },
          { type: "email_clean_mapper", label: "邮箱清理映射器", description: "使用正则表达式从文本示例中清除电子邮件地址。", inputs: ["data"], outputs: ["data"] },
          { type: "html_clean_mapper", label: "HTML清理映射器", description: "从文本示例中清除HTML代码，将HTML转换为纯文本。", inputs: ["data"], outputs: ["data"] },
          { type: "ip_clean_mapper", label: "IP清理映射器", description: "从文本示例中清除IPv4和IPv6地址。", inputs: ["data"], outputs: ["data"] },
          { type: "link_clean_mapper", label: "链接清理映射器", description: "映射器来清理链接，如文本示例中的http/https/ftp。", inputs: ["data"], outputs: ["data"] },
          { type: "dialog_intent_mapper", label: "对话意图检测映射器", description: "通过分析历史记录、查询和响应，在对话框中生成用户的意图标签。", inputs: ["data"], outputs: ["data"] },
          { type: "dialog_sentiment_mapper", label: "对话情感检测映射器", description: "在对话框中为用户查询生成情绪标签和分析。", inputs: ["data"], outputs: ["data"] },
          { type: "dialog_sentiment_intensity_mapper", label: "对话情感强度映射器", description: "Mapper预测用户在对话框中的情绪强度，范围从-5到5。", inputs: ["data"], outputs: ["data"] },
          { type: "dialog_topic_mapper", label: "对话主题检测映射器", description: "在对话框中生成用户的主题标签和分析。", inputs: ["data"], outputs: ["data"] },
          { type: "macro_expand_mapper", label: "宏展开映射器", description: "展开LaTeX示例文档主体中的宏定义。", inputs: ["data"], outputs: ["data"] },
          { type: "entity_attr_extract_mapper", label: "实体属性提取映射器", description: "从文本中提取给定实体的属性，并将其存储在示例的元数据中。", inputs: ["data"], outputs: ["data"] },
          { type: "entity_relation_extract_mapper", label: "实体关系提取映射器", description: "从文本中提取实体和关系以构建知识图谱。", inputs: ["data"], outputs: ["data"] },
          { type: "event_extract_mapper", label: "事件提取映射器", description: "从文本中提取事件和相关字符。", inputs: ["data"], outputs: ["data"] },
          { type: "keyword_extract_mapper", label: "关键词提取映射器", description: "为文本生成关键字。", inputs: ["data"], outputs: ["data"] },
          { type: "nickname_extract_mapper", label: "昵称提取映射器", description: "使用语言模型提取文本中的昵称关系。", inputs: ["data"], outputs: ["data"] },
          { type: "support_text_extract_mapper", label: "支撑文本提取映射器", description: "根据给定的摘要从原始文本中提取支持子文本。", inputs: ["data"], outputs: ["data"] },
          { type: "unicode_fix_mapper", label: "Unicode修复映射器", description: "修复文本示例中的unicode错误。", inputs: ["data"], outputs: ["data"] },
          { type: "en_nlp_aug_mapper", label: "英文NLP增强映射器", description: "使用nlpaug库中的各种方法增强英语文本样本。", inputs: ["data"], outputs: ["data"] },
          { type: "zh_nlp_aug_mapper", label: "中文NLP增强映射器", description: "使用nlpcda库扩充中文文本样本。", inputs: ["data"], outputs: ["data"] },
          { type: "pair_preference_mapper", label: "对偏好映射器", description: "Mapper通过生成拒绝响应及其原因来构造成对的偏好样本。", inputs: ["data"], outputs: ["data"] },
          { type: "punctuation_norm_mapper", label: "标点符号归一化映射器", description: "将unicode标点规范化为文本示例中的英语等效项。", inputs: ["data"], outputs: ["data"] },
          { type: "python_file_mapper", label: "Python文件映射器", description: "对输入数据执行文件中定义的Python函数。", inputs: ["data"], outputs: ["data"] },
          { type: "python_lambda_mapper", label: "PythonLambda映射器", description: "Mapper，用于将Pythonlambda函数应用于数据样本。", inputs: ["data"], outputs: ["data"] },
          { type: "relation_identity_mapper", label: "关系标识映射器", description: "确定给定文本中两个实体之间的关系。", inputs: ["data"], outputs: ["data"] },
          { type: "reference_remove_mapper", label: "参考文献移除映射器", description: "删除LaTeX文档末尾的参考书目部分。", inputs: ["data"], outputs: ["data"] },
          { type: "comment_remove_mapper", label: "注释移除映射器", description: "从文档中删除注释，当前仅支持「文本」格式。", inputs: ["data"], outputs: ["data"] },
          { type: "header_remove_mapper", label: "页眉移除映射器", description: "删除LaTeX示例中文档开头的标题。", inputs: ["data"], outputs: ["data"] },
          { type: "long_word_remove_mapper", label: "长单词移除映射器", description: "映射器删除特定范围内的长词。", inputs: ["data"], outputs: ["data"] },
          { type: "non_chinese_remove_mapper", label: "非中文字符移除映射器", description: "从文本样本中删除非中文字符。", inputs: ["data"], outputs: ["data"] },
          { type: "dup_sentence_remove_mapper", label: "重复句子移除映射器", description: "映射器删除文本样本中的重复句子。", inputs: ["data"], outputs: ["data"] },
          { type: "specified_char_remove_mapper", label: "指定字符移除映射器", description: "从文本示例中删除特定字符。", inputs: ["data"], outputs: ["data"] },
          { type: "table_text_remove_mapper", label: "表格文本移除映射器", description: "映射器从文本样本中删除表文本。", inputs: ["data"], outputs: ["data"] },
          { type: "error_substr_word_remove_mapper", label: "含错误子串单词移除映射器", description: "映射程序删除包含指定的不正确子字符串的单词。", inputs: ["data"], outputs: ["data"] },
          { type: "content_replace_mapper", label: "内容替换映射器", description: "用指定的替换字符串替换与特定正则表达式模式匹配的文本中的内容。", inputs: ["data"], outputs: ["data"] },
          { type: "sentence_split_mapper", label: "句子切分映射器", description: "根据指定的语言将文本样本拆分为单个句子。", inputs: ["data"], outputs: ["data"] },
          { type: "text_chunk_mapper", label: "文本分块映射器", description: "根据指定的条件将输入文本拆分为块。", inputs: ["data"], outputs: ["data"] },
          { type: "whitespace_norm_mapper", label: "空白符归一化映射器", description: "将文本样本中各种类型的空白字符规范化为标准空格。", inputs: ["data"], outputs: ["data"] },
        ]
      },
      {
        name: "格式化", hint: "发现、加载、规范化原始数据", operators: [
          { type: "csv_formatter", label: "CSV格式化器", description: "类用于加载和格式化csv类型的文件。", inputs: ["data"], outputs: ["data"] },
          { type: "empty_formatter", label: "空格式化器", description: "类用于创建空数据。", inputs: [], outputs: ["data"] },
          { type: "local_formatter", label: "本地格式化器", description: "类用于从本地文件或本地目录加载数据集。", inputs: [], outputs: ["data"] },
          { type: "parquet_formatter", label: "Parquet格式化器", description: "该类用于加载和格式化镶木地板类型的文件。", inputs: ["data"], outputs: ["data"] },
          { type: "remote_formatter", label: "远程格式化器", description: "该类用于从huggingfacehub的存储库加载数据集。", inputs: [], outputs: ["data"] },
          { type: "tsv_formatter", label: "TSV格式化器", description: "该类用于加载和格式化tsv类型的文件。", inputs: ["data"], outputs: ["data"] },
        ]
      },
      {
        name: "聚合", hint: "对批量样本进行汇总，如得出总结或结论。", operators: [
          { type: "entity_attr_aggregator", label: "实体属性聚合器", description: "汇总一组文档中实体的给定属性。", inputs: ["data"], outputs: ["data"] },
          { type: "meta_tag_aggregator", label: "元标签聚合器", description: "将类似的元标记合并到一个统一的标记中。", inputs: ["data"], outputs: ["data"] },
          { type: "most_relevant_entity_aggregator", label: "最相关实体聚合器", description: "从提供的文本中提取与给定实体密切相关的实体并对其进行排名。", inputs: ["data"], outputs: ["data"] },
          { type: "nested_aggregator", label: "嵌套聚合器", description: "将多个示例中的嵌套内容聚合到单个摘要中。", inputs: ["data"], outputs: ["data"] },
        ]
      },
      {
        name: "过滤", hint: "过滤低质量样本", operators: [
          { type: "alphanumeric_filter", label: "字母数字过滤器", description: "过滤器，以保持具有特定范围内的字母/数字比率的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "avg_line_length_filter", label: "平均行长度过滤器", description: "过滤器，以保持平均线长度在特定范围内的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "char_repeat_filter", label: "字符重复过滤器", description: "过滤器将具有字符级n-gram重复比的样本保持在特定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "flagged_word_filter", label: "敏感词过滤器", description: "过滤器将标记词比率的样本保留在指定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "lang_id_score_filter", label: "语言识别分数过滤器", description: "过滤器以保留置信度高于阈值的特定语言的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "max_line_length_filter", label: "最大行长度过滤器", description: "筛选器将最大行长度的样本保持在指定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "perplexity_filter", label: "困惑度过滤器", description: "过滤以保持困惑分数在指定范围内的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "special_char_filter", label: "特殊字符过滤器", description: "过滤器，以将具有特殊字符比率的样本保持在特定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "specified_field_filter", label: "指定字段过滤器", description: "根据指定的字段信息筛选样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "specified_numeric_field_filter", label: "指定数值字段过滤器", description: "根据指定的数值字段值筛选样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "stopword_filter", label: "停用词过滤器", description: "过滤器将停止词比率的样本保持在指定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "suffix_filter", label: "后缀过滤器", description: "过滤器以保留具有指定后缀的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "text_action_filter", label: "文本动作过滤器", description: "过滤以保留包含最少数量操作的文本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "text_entity_dep_filter", label: "文本实体依赖过滤器", description: "根据实体依赖关系识别和过滤文本样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "text_length_filter", label: "文本长度过滤器", description: "过滤以保持文本总长度在特定范围内的样本。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "token_num_filter", label: "Token数量过滤器", description: "筛选器将总令牌数的样本保留在指定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "word_repeat_filter", label: "单词重复过滤器", description: "过滤器将单词级n-gram重复比率的样本保持在特定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
          { type: "word_num_filter", label: "单词数量过滤器", description: "过滤器将样本的总字数保持在指定范围内。", inputs: ["data"], outputs: ["data", "rejected"] },
        ]
      },
      {
        name: "选择", hint: "基于排序选取高质量样本", operators: [
          { type: "d_field_selector", label: "D字段选择器", description: "选择器根据指定字段的频率过滤样本。", inputs: ["data"], outputs: ["data"] },
          { type: "random_selector", label: "随机选择器", description: "从数据集中随机选择样本子集。", inputs: ["data"], outputs: ["data"] },
          { type: "range_selector", label: "指定字段范围选择器", description: "根据指定字段的排序值选择采样范围。", inputs: ["data"], outputs: ["data"] },
          { type: "tag_selector", label: "指定字段标签选择器", description: "选择器根据指定字段的标签过滤样本。", inputs: ["data"], outputs: ["data"] },
          { type: "topk_selector", label: "指定字段TopK选择器", description: "根据指定字段的排序值选择顶部样本。", inputs: ["data"], outputs: ["data"] },
        ]
      },
    ]
  },
  {
    name: "图像", icon: Image, types: [
      {
        name: "去重", hint: "识别、删除重复样本。", operators: [
          { type: "image_dedup", label: "图像去重器", description: "通过图像的精确匹配在文档级别删除重复的样本。", inputs: ["images"], outputs: ["images"] },
        ]
      },
      {
        name: "映射", hint: "对数据样本进行编辑和转换", operators: [
          { type: "image_blur_mapper", label: "图像模糊映射器", description: "使用指定的概率和模糊类型对数据集中的图像进行模糊处理。", inputs: ["images"], outputs: ["images"] },
          { type: "image_face_blur_mapper", label: "图像人脸模糊映射器", description: "映射器模糊图像中检测到的人脸。", inputs: ["images"], outputs: ["images"] },
          { type: "image_bg_remove_mapper", label: "图像去背景映射器", description: "映射器删除图像的背景。", inputs: ["images"], outputs: ["images"] },
        ]
      },
      {
        name: "过滤", hint: "过滤低质量样本", operators: [
          { type: "image_aspect_ratio_filter", label: "图像宽高比过滤器", description: "过滤器，以保持样本的图像纵横比在特定范围内。", inputs: ["images"], outputs: ["images", "rejected"] },
          { type: "image_face_count_filter", label: "图像人脸数量过滤器", description: "过滤以保持样本的面数在特定范围内。", inputs: ["images"], outputs: ["images", "rejected"] },
          { type: "image_face_ratio_filter", label: "图像人脸占比过滤器", description: "过滤以保持面面积比在特定范围内的样本。", inputs: ["images"], outputs: ["images", "rejected"] },
          { type: "image_shape_filter", label: "图像形状过滤器", description: "过滤器，以保持样本的图像形状(宽度，高度)在特定的范围内。", inputs: ["images"], outputs: ["images", "rejected"] },
          { type: "image_size_filter", label: "图像大小过滤器", description: "保留图像大小(以字节/KB/MB/...为单位)在特定范围内的数据样本。", inputs: ["images"], outputs: ["images", "rejected"] },
        ]
      },
    ]
  },
  {
    name: "音频", icon: Mic, types: [
      {
        name: "映射", hint: "对数据样本进行编辑和转换", operators: [
          { type: "audio_ffmpeg_mapper", label: "音频FFmpeg封装映射器", description: "包装FFmpeg音频过滤器，用于处理数据集中的音频文件。", inputs: ["audio"], outputs: ["audio"] },
        ]
      },
      {
        name: "过滤", hint: "过滤低质量样本", operators: [
          { type: "audio_duration_filter", label: "音频时长过滤器", description: "保留音频持续时间在指定范围内的数据样本。", inputs: ["audio"], outputs: ["audio", "rejected"] },
          { type: "audio_nmf_snr_filter", label: "音频NMF信噪比过滤器", description: "保留音频信噪比(snr)在指定范围内的数据样本。", inputs: ["audio"], outputs: ["audio", "rejected"] },
          { type: "audio_size_filter", label: "音频大小过滤器", description: "根据音频文件的大小保留数据样本。", inputs: ["audio"], outputs: ["audio", "rejected"] },
        ]
      },
    ]
  },
  {
    name: "视频", icon: Video, types: [
      {
        name: "去重", hint: "识别、删除重复样本。", operators: [
          { type: "video_dedup", label: "视频去重器", description: "使用视频的精确匹配在文档级别删除重复的样本。", inputs: ["video"], outputs: ["video"] },
        ]
      },
      {
        name: "映射", hint: "对数据样本进行编辑和转换", operators: [
          { type: "video_face_blur_mapper", label: "视频人脸模糊映射器", description: "映射器模糊在视频中检测到的人脸。", inputs: ["video"], outputs: ["video"] },
          { type: "video_ffmpeg_mapper", label: "视频FFmpeg封装映射器", description: "包装FFmpeg视频过滤器，用于处理数据集中的视频文件。", inputs: ["video"], outputs: ["video"] },
          { type: "video_watermark_remove_mapper", label: "视频去水印映射器", description: "根据指定区域从视频中删除水印。", inputs: ["video"], outputs: ["video"] },
          { type: "video_aspect_resize_mapper", label: "视频宽高比调整映射器", description: "调整视频大小以适应指定的宽高比范围。", inputs: ["video"], outputs: ["video"] },
          { type: "video_resolution_resize_mapper", label: "视频分辨率调整映射器", description: "根据指定的宽度和高度限制调整视频分辨率。", inputs: ["video"], outputs: ["video"] },
        ]
      },
      {
        name: "过滤", hint: "过滤低质量样本", operators: [
          { type: "video_aspect_ratio_filter", label: "视频宽高比过滤器", description: "过滤器将视频纵横比的样本保持在特定范围内。", inputs: ["video"], outputs: ["video", "rejected"] },
          { type: "video_duration_filter", label: "视频时长过滤器", description: "保留视频持续时间在指定范围内的数据样本。", inputs: ["video"], outputs: ["video", "rejected"] },
          { type: "video_motion_score_filter", label: "视频运动分数过滤器", description: "过滤器将来自OpenCV的视频运动分数的样本保持在特定范围内。", inputs: ["video"], outputs: ["video", "rejected"] },
          { type: "video_resolution_filter", label: "视频分辨率过滤器", description: "保留视频分辨率在指定范围内的数据样本。", inputs: ["video"], outputs: ["video", "rejected"] },
        ]
      },
    ]
  },
  {
    name: "多模态", icon: Layers, types: [
      {
        name: "映射", hint: "对数据样本进行编辑和转换", operators: [
          { type: "video_frame_extract_mapper", label: "视频帧提取映射器", description: "映射器根据指定的方法从视频文件中提取帧。", inputs: ["video"], outputs: ["images"] },
          { type: "video_split_by_duration_mapper", label: "按时长切分视频映射器", description: "根据指定的持续时间将视频拆分为多个片段。", inputs: ["video"], outputs: ["video"] },
          { type: "video_split_by_keyframe_mapper", label: "按关键帧切分视频映射器", description: "根据关键帧将视频分割为多个片段。", inputs: ["video"], outputs: ["video"] },
          { type: "video_split_by_scene_mapper", label: "按场景切分视频映射器", description: "根据检测到的场景变化将视频拆分为场景剪辑。", inputs: ["video"], outputs: ["video"] },
        ]
      },
    ]
  },
  {
    name: "输入节点", icon: Database, types: [
      {
        name: "输入", hint: "配置数据输入源", operators: [
          { type: "dataset_input", label: "数据集输入", description: "从已有数据集中读取数据作为工作流输入。", inputs: [], outputs: ["data"] },
          { type: "file_input", label: "文件输入", description: "从文件系统读取数据作为工作流输入。", inputs: [], outputs: ["data"] },
        ]
      },
    ]
  },
  {
    name: "输出节点", icon: FileOutput, types: [
      {
        name: "输出", hint: "配置数据输出目标", operators: [
          { type: "dataset_output", label: "数据集输出", description: "将处理结果写入目标数据集。", inputs: ["data"], outputs: [] },
          { type: "file_output", label: "文件输出", description: "将处理结果写入文件系统。", inputs: ["data"], outputs: [] },
        ]
      },
    ]
  },
  {
    name: "自定义节点", icon: Wrench, types: [
      {
        name: "自定义", hint: "用户自定义处理逻辑", operators: [
          { type: "custom_node", label: "自定义节点", description: "用户自定义的数据处理节点，支持编写自定义逻辑。", inputs: ["data"], outputs: ["data"] },
        ]
      },
    ]
  },
];

const NODE_W = 180;
const NODE_H = 72;
const PORT_R = 6;

/* ─── Helpers ─── */
let nodeCounter = 0;
const genId = () => `node-${++nodeCounter}`;

const getPortPos = (node: CanvasNode, portName: string, isInput: boolean): Position => {
  const ports = isInput ? node.inputs : node.outputs;
  const idx = ports.indexOf(portName);
  const total = ports.length;
  const spacing = NODE_W / (total + 1);
  return {
    x: node.x + spacing * (idx + 1),
    y: isInput ? node.y : node.y + NODE_H,
  };
};

const catColors: Record<string, string> = {
  "文本": "hsl(var(--primary))",
  "图像": "hsl(280 60% 55%)",
  "音频": "hsl(var(--warning, 38 92% 50%))",
  "视频": "hsl(160 60% 42%)",
  "多模态": "hsl(320 60% 50%)",
  "输入节点": "hsl(200 70% 50%)",
  "输出节点": "hsl(var(--destructive))",
  "自定义节点": "hsl(30 70% 50%)",
};

/* ─── Mock datasets ─── */
const mockDatasets = [
  { id: "ds1", name: "文本清洗数据集", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v1.1" }, { id: "v3", name: "v2.0" }] },
  { id: "ds2", name: "对话语料数据集", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v2.0" }] },
  { id: "ds3", name: "图像标注数据集", versions: [{ id: "v1", name: "v1.0" }] },
  { id: "ds4", name: "音频转写数据集", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v1.1" }] },
];

/* ─── Param Form Renderer ─── */
const ParamFormField = ({ param, value, onChange }: { param: ParamDef; value: any; onChange: (v: any) => void }) => {
  switch (param.type) {
    case "string":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}{param.required && <span className="text-destructive ml-0.5">*</span>}</label>
          {param.description && <p className="text-[9px] text-muted-foreground/70">{param.description}</p>}
          <input value={value ?? param.default ?? ""} onChange={e => onChange(e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
      );
    case "integer":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="flex items-center gap-1 mt-0.5">
            <button onClick={() => onChange(Math.max(param.min ?? -Infinity, (value ?? param.default ?? 0) - (param.step ?? 1)))}
              className="p-0.5 border rounded hover:bg-muted/50"><Minus className="w-3 h-3" /></button>
            <input type="number" value={value ?? param.default ?? 0}
              onChange={e => onChange(parseInt(e.target.value) || 0)}
              min={param.min} max={param.max}
              className="flex-1 px-2 py-1 text-xs border rounded bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <button onClick={() => onChange(Math.min(param.max ?? Infinity, (value ?? param.default ?? 0) + (param.step ?? 1)))}
              className="p-0.5 border rounded hover:bg-muted/50"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      );
    case "float":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="flex items-center gap-2 mt-1">
            <Slider
              value={[value ?? param.default ?? 0]}
              min={param.min ?? 0}
              max={param.max ?? 1}
              step={param.step ?? 0.01}
              onValueChange={([v]) => onChange(v)}
              className="flex-1"
            />
            <input type="number" value={value ?? param.default ?? 0}
              onChange={e => onChange(parseFloat(e.target.value) || 0)}
              step={param.step ?? 0.01} min={param.min} max={param.max}
              className="w-16 px-1.5 py-1 text-xs border rounded bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <Switch checked={value ?? param.default ?? false} onCheckedChange={onChange} />
        </div>
      );
    case "enum":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <select value={value ?? param.default ?? ""}
            onChange={e => onChange(e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
            {param.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case "enum_multi":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {param.options?.map(o => {
              const selected = (value || []).includes(o);
              return (
                <button key={o} onClick={() => {
                  const arr = value || [];
                  onChange(selected ? arr.filter((x: string) => x !== o) : [...arr, o]);
                }}
                  className={`px-1.5 py-0.5 text-[10px] rounded border ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/50"}`}>
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      );
    case "range":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="number" placeholder="最小" value={value?.[0] ?? param.min ?? 0}
              onChange={e => onChange([parseFloat(e.target.value), value?.[1] ?? param.max ?? 100])}
              className="flex-1 px-1.5 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <span className="text-[10px] text-muted-foreground">~</span>
            <input type="number" placeholder="最大" value={value?.[1] ?? param.max ?? 100}
              onChange={e => onChange([value?.[0] ?? param.min ?? 0, parseFloat(e.target.value)])}
              className="flex-1 px-1.5 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>
      );
    case "regex":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}{param.required && <span className="text-destructive ml-0.5">*</span>}</label>
          {param.description && <p className="text-[9px] text-muted-foreground/70">{param.description}</p>}
          <input value={value ?? param.default ?? ""} onChange={e => onChange(e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="/pattern/" />
        </div>
      );
    case "keyvalue":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="mt-1 space-y-1">
            {(value || [{ key: "", value: "" }]).map((kv: { key: string; value: string }, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <input placeholder="键" value={kv.key}
                  onChange={e => { const arr = [...(value || [{ key: "", value: "" }])]; arr[i] = { ...arr[i], key: e.target.value }; onChange(arr); }}
                  className="flex-1 px-1.5 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <input placeholder="值" value={kv.value}
                  onChange={e => { const arr = [...(value || [{ key: "", value: "" }])]; arr[i] = { ...arr[i], value: e.target.value }; onChange(arr); }}
                  className="flex-1 px-1.5 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={() => { const arr = [...(value || [])]; arr.splice(i, 1); onChange(arr.length ? arr : [{ key: "", value: "" }]); }}
                  className="p-0.5 text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => onChange([...(value || []), { key: "", value: "" }])}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" />添加</button>
          </div>
        </div>
      );
    case "file":
      return (
        <div>
          <label className="text-[10px] text-muted-foreground">{param.label}</label>
          <div className="mt-0.5 border rounded px-2 py-2 flex items-center gap-2 bg-background">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{value ? "已上传" : "点击上传文件"}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
};

/* ─── Component ─── */
const WorkflowCanvas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wfName = searchParams.get("name") || "新建工作流";

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ nodeId: string; port: string; pos: Position } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [operatorSearch, setOperatorSearch] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");

  // Accordion state
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["文本"]));
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Workflow global config
  const [wfDesc, setWfDesc] = useState("");
  const [wfMaxParallel, setWfMaxParallel] = useState(4);
  const [wfTimeout, setWfTimeout] = useState(3600);
  const [wfFailStrategy, setWfFailStrategy] = useState<"stop" | "skip" | "retry">("stop");
  const [wfRetryMax, setWfRetryMax] = useState(3);
  const [wfRetryInterval, setWfRetryInterval] = useState(60);

  // Input/Output node config
  const [inputSourceType, setInputSourceType] = useState<"dataset" | "file">("dataset");
  const [inputDataset, setInputDataset] = useState("");
  const [inputVersion, setInputVersion] = useState("");
  const [inputSampleRatio, setInputSampleRatio] = useState(100);
  const [inputSamplingMode, setInputSamplingMode] = useState<"all" | "ratio" | "count">("all");
  const [inputSampleCount, setInputSampleCount] = useState(1000);
  const [outputTargetType, setOutputTargetType] = useState<"new" | "append">("new");
  const [outputDataset, setOutputDataset] = useState("");
  const [outputVersion, setOutputVersion] = useState("");
  const [outputFormat, setOutputFormat] = useState("jsonl");
  const [outputNewName, setOutputNewName] = useState("");
  const [outputWriteMode, setOutputWriteMode] = useState<"append" | "clear">("append");

  // Debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [debugElapsed, setDebugElapsed] = useState(0);
  const [debugNodeStates, setDebugNodeStates] = useState<Record<string, { status: "pending" | "running" | "done" | "error"; count: number; duration: number }>>({});
  const [debugLogs, setDebugLogs] = useState<Record<string, string[]>>({});
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [logNodeId, setLogNodeId] = useState<string | null>(null);
  const debugTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedConnections, setHighlightedConnections] = useState<Set<string>>(new Set());

  // Minimap drag
  const [minimapDragging, setMinimapDragging] = useState(false);
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleType = (key: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  /* convert screen to canvas coords */
  const screenToCanvas = useCallback((sx: number, sy: number): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: sx, y: sy };
    return {
      x: (sx - rect.left - pan.x) / zoom,
      y: (sy - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const getCanvasCenter = useCallback((): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 300, y: 300 };
    return {
      x: (rect.width / 2 - pan.x) / zoom,
      y: (rect.height / 2 - pan.y) / zoom,
    };
  }, [pan, zoom]);

  /* ─── Cycle detection (BFS) ─── */
  const wouldCreateCycle = useCallback((fromId: string, toId: string): boolean => {
    // Check if there's a path from toId to fromId (which would create a cycle)
    const visited = new Set<string>();
    const queue = [toId];
    // Follow existing connections from 'to' downstream
    // But we need to check: can we reach fromId starting from toId?
    // Actually we need to check: is there a path from toId → fromId via existing connections
    const adjacency: Record<string, string[]> = {};
    for (const c of connections) {
      if (!adjacency[c.from]) adjacency[c.from] = [];
      adjacency[c.from].push(c.to);
    }
    // BFS from toId, see if we reach fromId
    const bfsQueue = [toId];
    visited.add(toId);
    while (bfsQueue.length > 0) {
      const curr = bfsQueue.shift()!;
      if (curr === fromId) return true;
      for (const next of adjacency[curr] || []) {
        if (!visited.has(next)) {
          visited.add(next);
          bfsQueue.push(next);
        }
      }
    }
    return false;
  }, [connections]);

  /* Add node at canvas center */
  const addNodeAtCenter = useCallback((op: Operator, categoryName: string, typeName: string) => {
    const center = getCanvasCenter();
    const newNode: CanvasNode = {
      id: genId(),
      type: op.type,
      label: op.label,
      category: categoryName,
      operatorType: typeName,
      x: center.x - NODE_W / 2,
      y: center.y - NODE_H / 2,
      inputs: op.inputs,
      outputs: op.outputs,
      config: {},
      description: op.description,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  }, [getCanvasCenter]);

  /* ─── Drop from palette ─── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/operator");
    if (!data) return;
    const op = JSON.parse(data);
    const pos = screenToCanvas(e.clientX, e.clientY);
    const newNode: CanvasNode = {
      id: genId(),
      type: op.type,
      label: op.label,
      category: op.category,
      operatorType: op.operatorType || "",
      x: pos.x - NODE_W / 2,
      y: pos.y - NODE_H / 2,
      inputs: op.inputs,
      outputs: op.outputs,
      config: {},
      description: op.description,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  }, [screenToCanvas]);

  /* ─── Node drag ─── */
  const startNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    const pos = screenToCanvas(e.clientX, e.clientY);
    setDraggingNode(nodeId);
    setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
    setSelectedNode(nodeId);
    setSelectedConnection(null);
  };

  /* ─── Connection with validation ─── */
  const startConnect = (e: React.MouseEvent, nodeId: string, port: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    const pos = getPortPos(node, port, false);
    setConnecting({ nodeId, port, pos });
  };

  const finishConnect = (nodeId: string, port: string) => {
    if (!connecting) { return; }

    // Rule: no self-connection
    if (connecting.nodeId === nodeId) {
      toast.error("不允许节点连接自身");
      setConnecting(null);
      return;
    }

    // Rule: no duplicate connections
    const exists = connections.some(c =>
      c.from === connecting.nodeId && c.fromPort === connecting.port &&
      c.to === nodeId && c.toPort === port
    );
    if (exists) {
      toast.error("该连接已存在");
      setConnecting(null);
      return;
    }

    // Rule: no cycles
    if (wouldCreateCycle(connecting.nodeId, nodeId)) {
      toast.error("不允许形成循环依赖");
      setConnecting(null);
      return;
    }

    // Rule: type compatibility check
    const compatible = isTypeCompatible(connecting.port, port);

    setConnections(prev => [...prev, {
      id: `conn-${Date.now()}`,
      from: connecting.nodeId,
      fromPort: connecting.port,
      to: nodeId,
      toPort: port,
      compatible,
    }]);

    if (!compatible) {
      toast.warning("端口数据类型不兼容，连线已标红");
    }

    setConnecting(null);
  };

  /* ─── Mouse move ─── */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setMousePos(pos);
      if (draggingNode) {
        setNodes(prev => prev.map(n => n.id === draggingNode
          ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n));
      }
      if (isPanning) {
        setPan(prev => ({
          x: prev.x + (e.clientX - panStart.x),
          y: prev.y + (e.clientY - panStart.y),
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };
    const handleUp = () => {
      setDraggingNode(null);
      setIsPanning(false);
      setMinimapDragging(false);
      if (connecting) setConnecting(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [draggingNode, dragOffset, isPanning, panStart, connecting, screenToCanvas]);

  /* ─── Canvas pan ─── */
  const startPan = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
      setSelectedConnection(null);
    }
  };

  /* ─── Zoom ─── */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(2, Math.max(0.25, prev - e.deltaY * 0.001)));
  };

  /* ─── Delete ─── */
  const deleteSelected = () => {
    if (selectedNode) {
      setNodes(prev => prev.filter(n => n.id !== selectedNode));
      setConnections(prev => prev.filter(c => c.from !== selectedNode && c.to !== selectedNode));
      setSelectedNode(null);
    }
    if (selectedConnection) {
      setConnections(prev => prev.filter(c => c.id !== selectedConnection));
      setSelectedConnection(null);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  /* ─── Connection path ─── */
  const getPath = (from: Position, to: Position) => {
    const dy = Math.abs(to.y - from.y);
    const cp = Math.max(50, dy * 0.5);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + cp}, ${to.x} ${to.y - cp}, ${to.x} ${to.y}`;
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const isInputNode = selectedNodeData?.category === "输入节点";
  const isOutputNode = selectedNodeData?.category === "输出节点";
  const isOperatorNode = selectedNodeData && !isInputNode && !isOutputNode;

  /* ─── Minimap calculations ─── */
  const MINIMAP_W = 180;
  const MINIMAP_H = 120;

  const minimapData = useMemo(() => {
    if (nodes.length === 0) return null;
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - 50;
    const minY = Math.min(...ys) - 50;
    const maxX = Math.max(...xs) + NODE_W + 50;
    const maxY = Math.max(...ys) + NODE_H + 50;
    const worldW = Math.max(maxX - minX, 200);
    const worldH = Math.max(maxY - minY, 200);
    const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);
    return { minX, minY, worldW, worldH, scale };
  }, [nodes]);

  const minimapViewport = useMemo(() => {
    if (!minimapData || !canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const { minX, minY, scale } = minimapData;
    const vx = (-pan.x / zoom - minX) * scale;
    const vy = (-pan.y / zoom - minY) * scale;
    const vw = (rect.width / zoom) * scale;
    const vh = (rect.height / zoom) * scale;
    return { x: vx, y: vy, w: vw, h: vh };
  }, [minimapData, pan, zoom]);

  const handleMinimapMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    setMinimapDragging(true);
    navigateFromMinimap(e);
  };

  const handleMinimapMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapDragging) return;
    navigateFromMinimap(e);
  };

  const navigateFromMinimap = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapData || !canvasRef.current) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { minX, minY, scale } = minimapData;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const targetX = mx / scale + minX;
    const targetY = my / scale + minY;
    setPan({
      x: -(targetX - canvasRect.width / 2 / zoom) * zoom,
      y: -(targetY - canvasRect.height / 2 / zoom) * zoom,
    });
  };

  /* ─── Filter catalog by search ─── */
  const filteredCatalog = operatorSearch
    ? operatorCatalog.map(cat => ({
        ...cat,
        types: cat.types.map(t => ({
          ...t,
          operators: t.operators.filter(op => op.label.includes(operatorSearch) || op.description.includes(operatorSearch)),
        })).filter(t => t.operators.length > 0),
      })).filter(cat => cat.types.length > 0)
    : operatorCatalog;

  /* ─── Get node params ─── */
  const getNodeParams = (node: CanvasNode): ParamDef[] => {
    return operatorParams[node.type] || defaultOperatorParams;
  };

  const updateNodeConfig = (nodeId: string, key: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n));
  };

  /* ─── Auto layout (topological sort + layered positioning) ─── */
  const autoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    // Build adjacency & in-degree
    const inDeg: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
    connections.forEach(c => {
      adj[c.from]?.push(c.to);
      inDeg[c.to] = (inDeg[c.to] || 0) + 1;
    });
    // Topological sort (BFS / Kahn)
    const queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const layers: string[][] = [];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const layer = [...queue];
      layers.push(layer);
      queue.length = 0;
      for (const id of layer) {
        visited.add(id);
        for (const next of adj[id] || []) {
          inDeg[next]--;
          if (inDeg[next] === 0 && !visited.has(next)) queue.push(next);
        }
      }
    }
    // Place unvisited nodes (disconnected) in last layer
    const remaining = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length) layers.push(remaining);

    const H_GAP = 240;
    const V_GAP = 100;
    const startX = 80;
    const startY = 80;
    const posMap: Record<string, Position> = {};
    layers.forEach((layer, li) => {
      layer.forEach((nid, ni) => {
        posMap[nid] = {
          x: startX + li * H_GAP,
          y: startY + ni * V_GAP,
        };
      });
    });
    setNodes(prev => prev.map(n => posMap[n.id] ? { ...n, x: posMap[n.id].x, y: posMap[n.id].y } : n));
    // Reset pan to see layout
    setPan({ x: 0, y: 0 });
    setZoom(1);
    toast.success("已自动排列节点");
  }, [nodes, connections]);

  /* ─── Debug mode ─── */
  const startDebug = useCallback(() => {
    if (nodes.length === 0) { toast.error("画布中没有节点"); return; }
    setDebugMode(true);
    setDebugElapsed(0);
    setShowLogPanel(false);
    setLogNodeId(null);
    // Initialize all nodes as pending
    const initStates: typeof debugNodeStates = {};
    const initLogs: Record<string, string[]> = {};
    nodes.forEach(n => {
      initStates[n.id] = { status: "pending", count: 0, duration: 0 };
      initLogs[n.id] = [];
    });
    setDebugNodeStates(initStates);
    setDebugLogs(initLogs);

    // Build execution order (topological)
    const inDeg: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
    connections.forEach(c => { adj[c.from]?.push(c.to); inDeg[c.to] = (inDeg[c.to] || 0) + 1; });
    const order: string[] = [];
    const queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const visited = new Set<string>();
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      order.push(id);
      for (const next of adj[id] || []) {
        inDeg[next]--;
        if (inDeg[next] === 0) queue.push(next);
      }
    }
    // Add unvisited
    nodes.forEach(n => { if (!visited.has(n.id)) order.push(n.id); });

    // Simulate sequential execution
    let step = 0;
    const simulate = () => {
      if (step < order.length) {
        const nodeId = order[step];
        const mockCount = Math.floor(Math.random() * 10000) + 500;
        const mockDuration = Math.floor(Math.random() * 30) + 2;
        // Set current node running
        setDebugNodeStates(prev => ({
          ...prev,
          [nodeId]: { status: "running", count: 0, duration: 0 },
        }));
        setDebugLogs(prev => ({
          ...prev,
          [nodeId]: [
            ...(prev[nodeId] || []),
            `[${new Date().toLocaleTimeString()}] 开始执行节点...`,
            `[${new Date().toLocaleTimeString()}] 加载数据中...`,
          ],
        }));

        // Finish after mockDuration seconds (compressed to 2-4s)
        const finishDelay = 2000 + Math.random() * 2000;
        setTimeout(() => {
          setDebugNodeStates(prev => ({
            ...prev,
            [nodeId]: { status: "done", count: mockCount, duration: mockDuration },
          }));
          setDebugLogs(prev => ({
            ...prev,
            [nodeId]: [
              ...(prev[nodeId] || []),
              `[${new Date().toLocaleTimeString()}] 处理 ${mockCount} 条数据`,
              `[${new Date().toLocaleTimeString()}] 节点执行完成 (${mockDuration}s)`,
            ],
          }));
          step++;
          simulate();
        }, finishDelay);
      }
    };
    simulate();
    toast.info("工作流调试已启动");
  }, [nodes, connections]);

  const stopDebug = useCallback(() => {
    setDebugMode(false);
    if (debugTimerRef.current) { clearInterval(debugTimerRef.current); debugTimerRef.current = null; }
    setShowLogPanel(false);
    setLogNodeId(null);
    toast.info("调试已停止");
  }, []);

  /* ─── Workflow Validation ─── */
  const validateWorkflow = useCallback((): boolean => {
    const errors: ValidationError[] = [];
    let errIdx = 0;

    // 1. 输入节点配置：至少一个输入节点且必须配置数据源
    const inputNodes = nodes.filter(n => n.category === "输入节点");
    if (inputNodes.length === 0) {
      errors.push({ id: `ve-${errIdx++}`, type: "error", message: "请先配置至少一个输入节点", nodeIds: [] });
    } else {
      // Check each input node has a data source configured
      inputNodes.forEach(n => {
        const hasSource = n.type === "file_input"
          ? !!n.config._fileUploaded
          : !!(n.config._dataset && n.config._version);
        if (!hasSource) {
          errors.push({ id: `ve-${errIdx++}`, type: "error", message: `输入数据源不存在：${n.label}`, nodeIds: [n.id] });
        }
      });
    }

    // 2. 输出节点配置：至少一个输出节点完整配置
    const outputNodes = nodes.filter(n => n.category === "输出节点");
    if (outputNodes.length === 0) {
      errors.push({ id: `ve-${errIdx++}`, type: "error", message: "请先配置至少一个输出节点", nodeIds: [] });
    }

    // 3. 节点连通性：所有非孤立节点必须在 Input→Output 路径上
    if (inputNodes.length > 0 && outputNodes.length > 0) {
      // BFS from all input nodes forward
      const reachableFromInput = new Set<string>();
      const adjForward: Record<string, string[]> = {};
      connections.forEach(c => { if (!adjForward[c.from]) adjForward[c.from] = []; adjForward[c.from].push(c.to); });
      const fwdQueue = inputNodes.map(n => n.id);
      fwdQueue.forEach(id => reachableFromInput.add(id));
      while (fwdQueue.length > 0) {
        const curr = fwdQueue.shift()!;
        for (const next of adjForward[curr] || []) {
          if (!reachableFromInput.has(next)) { reachableFromInput.add(next); fwdQueue.push(next); }
        }
      }
      // BFS from all output nodes backward
      const reachableFromOutput = new Set<string>();
      const adjBackward: Record<string, string[]> = {};
      connections.forEach(c => { if (!adjBackward[c.to]) adjBackward[c.to] = []; adjBackward[c.to].push(c.from); });
      const bwdQueue = outputNodes.map(n => n.id);
      bwdQueue.forEach(id => reachableFromOutput.add(id));
      while (bwdQueue.length > 0) {
        const curr = bwdQueue.shift()!;
        for (const prev of adjBackward[curr] || []) {
          if (!reachableFromOutput.has(prev)) { reachableFromOutput.add(prev); bwdQueue.push(prev); }
        }
      }
      // Nodes that have any connections but are not on an Input→Output path
      const connectedNodeIds = new Set<string>();
      connections.forEach(c => { connectedNodeIds.add(c.from); connectedNodeIds.add(c.to); });
      nodes.forEach(n => {
        if (connectedNodeIds.has(n.id) || n.category === "输入节点" || n.category === "输出节点") {
          if (!reachableFromInput.has(n.id) || !reachableFromOutput.has(n.id)) {
            errors.push({ id: `ve-${errIdx++}`, type: "error", message: `存在未连接节点: ${n.label}`, nodeIds: [n.id] });
          }
        }
      });
      // Truly isolated nodes (no connections at all, not input/output)
      nodes.forEach(n => {
        if (!connectedNodeIds.has(n.id) && n.category !== "输入节点" && n.category !== "输出节点") {
          errors.push({ id: `ve-${errIdx++}`, type: "error", message: `存在未连接节点: ${n.label}`, nodeIds: [n.id] });
        }
      });
    }

    // 4. 必填参数：所有算子的必填参数不为空
    nodes.forEach(n => {
      if (n.category === "输入节点" || n.category === "输出节点") return;
      const params = operatorParams[n.type] || defaultOperatorParams;
      const missing = params.filter(p => p.required && (n.config[p.key] === undefined || n.config[p.key] === ""));
      if (missing.length > 0) {
        errors.push({
          id: `ve-${errIdx++}`, type: "error",
          message: `节点 [${n.label}] 必填参数未填写: ${missing.map(p => p.label).join("、")}`,
          nodeIds: [n.id],
        });
      }
    });

    // 5. 数据类型兼容性
    connections.forEach(c => {
      if (c.compatible === false) {
        const fromNode = nodes.find(n => n.id === c.from);
        const toNode = nodes.find(n => n.id === c.to);
        errors.push({
          id: `ve-${errIdx++}`, type: "error",
          message: `节点 [${fromNode?.label}] 输出类型与节点 [${toNode?.label}] 输入类型不兼容`,
          nodeIds: [c.from, c.to],
          connectionIds: [c.id],
        });
      }
    });

    // 6. 环路检测
    {
      const inDeg: Record<string, number> = {};
      const adj: Record<string, string[]> = {};
      nodes.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
      connections.forEach(c => { adj[c.from]?.push(c.to); inDeg[c.to] = (inDeg[c.to] || 0) + 1; });
      const q = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
      const visited = new Set<string>();
      while (q.length > 0) {
        const id = q.shift()!;
        visited.add(id);
        for (const next of adj[id] || []) { inDeg[next]--; if (inDeg[next] === 0) q.push(next); }
      }
      if (visited.size < nodes.length) {
        errors.push({ id: `ve-${errIdx++}`, type: "error", message: "工作流中存在循环依赖，请检查" });
      }
    }

    // 7. 算子异常（mock: check version status）
    const offlineOperators = ["deprecated_op"];
    nodes.forEach(n => {
      if (offlineOperators.includes(n.type)) {
        errors.push({ id: `ve-${errIdx++}`, type: "error", message: `算子版本已更新请删除后重新添加或算子已下线：${n.label}`, nodeIds: [n.id] });
      }
    });

    setValidationErrors(errors);
    if (errors.length > 0) {
      setShowValidationPanel(true);
      // Highlight all error nodes
      const allNodeIds = new Set<string>();
      const allConnIds = new Set<string>();
      errors.forEach(e => {
        e.nodeIds?.forEach(id => allNodeIds.add(id));
        e.connectionIds?.forEach(id => allConnIds.add(id));
      });
      setHighlightedNodes(allNodeIds);
      setHighlightedConnections(allConnIds);
      return false;
    }
    setShowValidationPanel(false);
    setHighlightedNodes(new Set());
    setHighlightedConnections(new Set());
    return true;
  }, [nodes, connections]);

  const focusValidationError = useCallback((error: ValidationError) => {
    // Clear previous highlights
    setHighlightedNodes(new Set(error.nodeIds || []));
    setHighlightedConnections(new Set(error.connectionIds || []));
    // Select and pan to first related node
    if (error.nodeIds && error.nodeIds.length > 0) {
      const targetNode = nodes.find(n => n.id === error.nodeIds![0]);
      if (targetNode && canvasRef.current) {
        setSelectedNode(targetNode.id);
        const rect = canvasRef.current.getBoundingClientRect();
        setPan({
          x: -(targetNode.x - rect.width / 2 / zoom + NODE_W / 2) * zoom,
          y: -(targetNode.y - rect.height / 2 / zoom + NODE_H / 2) * zoom,
        });
      }
    } else if (error.connectionIds && error.connectionIds.length > 0) {
      setSelectedConnection(error.connectionIds[0]);
    }
  }, [nodes, zoom]);

  // Debug elapsed timer
  useEffect(() => {
    if (debugMode) {
      debugTimerRef.current = setInterval(() => setDebugElapsed(prev => prev + 1), 1000);
      return () => { if (debugTimerRef.current) clearInterval(debugTimerRef.current); };
    }
  }, [debugMode]);

  const debugDoneCount = useMemo(() => Object.values(debugNodeStates).filter(s => s.status === "done").length, [debugNodeStates]);
  const debugRunningCount = useMemo(() => Object.values(debugNodeStates).filter(s => s.status === "running").length, [debugNodeStates]);
  const debugAllDone = debugMode && debugDoneCount === nodes.length && nodes.length > 0;
  const formatElapsed = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  /* ─── JSON representation ─── */
  const workflowJson = useMemo(() => {
    return JSON.stringify({
      name: wfName,
      description: wfDesc,
      config: { maxParallel: wfMaxParallel, timeout: wfTimeout, failStrategy: wfFailStrategy, retryMax: wfRetryMax, retryInterval: wfRetryInterval },
      nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.label, category: n.category, operatorType: n.operatorType, x: n.x, y: n.y, config: n.config })),
      connections: connections.map(c => ({ from: c.from, fromPort: c.fromPort, to: c.to, toPort: c.toPort, compatible: c.compatible })),
    }, null, 2);
  }, [wfName, wfDesc, wfMaxParallel, wfTimeout, wfFailStrategy, wfRetryMax, wfRetryInterval, nodes, connections]);

  /* ─── Right panel: render property panel ─── */
  const renderPropertyPanel = () => {
    if (rightPanelCollapsed) return null;
    const panelWidth = 280;

    // No node selected → workflow global info
    if (!selectedNodeData) {
      return (
        <div className="border-l bg-card shrink-0 flex flex-col overflow-hidden" style={{ width: panelWidth }}>
          <div className="p-3 border-b">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />工作流属性
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Basic info */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">基本信息</p>
              <div>
                <label className="text-[10px] text-muted-foreground">工作流名称</label>
                <input value={wfName} readOnly className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-muted/30 text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">描述</label>
                <textarea value={wfDesc} onChange={e => setWfDesc(e.target.value)} rows={3} maxLength={200}
                  placeholder="工作流描述（最多200字符）"
                  className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <p className="text-[9px] text-muted-foreground text-right">{wfDesc.length}/200</p>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">工作流ID</label>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">wf-20250311-001</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">创建时间</label>
                  <p className="text-xs text-muted-foreground mt-0.5">2025-03-11</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">创建人</label>
                  <p className="text-xs text-muted-foreground mt-0.5">admin</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">最后修改人</label>
                <p className="text-xs text-muted-foreground mt-0.5">admin</p>
              </div>
            </div>

            {/* Execution config */}
            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">执行配置</p>
              <div>
                <label className="text-[10px] text-muted-foreground">最大并行数</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <button onClick={() => setWfMaxParallel(Math.max(1, wfMaxParallel - 1))}
                    className="p-0.5 border rounded hover:bg-muted/50"><Minus className="w-3 h-3" /></button>
                  <input type="number" value={wfMaxParallel} onChange={e => setWfMaxParallel(parseInt(e.target.value) || 1)}
                    min={1} max={64}
                    className="flex-1 px-2 py-1 text-xs border rounded bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  <button onClick={() => setWfMaxParallel(Math.min(64, wfMaxParallel + 1))}
                    className="p-0.5 border rounded hover:bg-muted/50"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">超时时间（秒）</label>
                <input type="number" value={wfTimeout} onChange={e => setWfTimeout(parseInt(e.target.value) || 0)} min={0}
                  className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">失败策略</label>
                <select value={wfFailStrategy} onChange={e => setWfFailStrategy(e.target.value as any)}
                  className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                  <option value="stop">停止</option>
                  <option value="skip">跳过</option>
                  <option value="retry">重试</option>
                </select>
              </div>
              {wfFailStrategy === "retry" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground">最大重试次数</label>
                    <input type="number" value={wfRetryMax} onChange={e => setWfRetryMax(parseInt(e.target.value) || 1)}
                      min={1} max={10}
                      className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">重试间隔（秒）</label>
                    <input type="number" value={wfRetryInterval} onChange={e => setWfRetryInterval(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <div className="border-t pt-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">画布统计</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">节点</span>
                  <span className="float-right font-medium text-foreground">{nodes.length}</span>
                </div>
                <div className="bg-muted/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">连线</span>
                  <span className="float-right font-medium text-foreground">{connections.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Input node selected
    if (isInputNode) {
      const isFileInput = selectedNodeData.type === "file_input";
      return (
        <div className="border-l bg-card shrink-0 flex flex-col overflow-hidden" style={{ width: panelWidth }}>
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" style={{ color: catColors["输入节点"] }} />输入节点配置
            </span>
            <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground">节点名称</label>
              <input value={selectedNodeData.label}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">节点ID</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{selectedNodeData.id}</p>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">数据源配置</p>

              {isFileInput ? (
                /* File input */
                <div>
                  <label className="text-[10px] text-muted-foreground">上传文件</label>
                  <div className="mt-1 border-2 border-dashed rounded-md p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">点击或拖拽文件到此处</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-1">支持 JSON, JSONL, CSV, Parquet 等格式</p>
                  </div>
                </div>
              ) : (
                /* Dataset input */
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground">选择数据集</label>
                    <select value={inputDataset} onChange={e => { setInputDataset(e.target.value); setInputVersion(""); }}
                      className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                      <option value="">请选择数据集</option>
                      {mockDatasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                    </select>
                  </div>
                  {inputDataset && (
                    <div>
                      <label className="text-[10px] text-muted-foreground">选择版本</label>
                      <select value={inputVersion} onChange={e => setInputVersion(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                        <option value="">请选择版本</option>
                        {mockDatasets.find(d => d.id === inputDataset)?.versions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-[10px] text-muted-foreground">数据格式</label>
                <p className="text-xs text-foreground mt-0.5 px-2 py-1 bg-muted/30 rounded">
                  {inputDataset ? "JSONL（自动识别）" : "—"}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">预估数据量</label>
                <p className="text-xs text-foreground mt-0.5 px-2 py-1 bg-muted/30 rounded">
                  {inputDataset && inputVersion ? "约 12,580 条（自动识别）" : "—"}
                </p>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">高级配置</p>
              <div>
                <label className="text-[10px] text-muted-foreground">采样模式</label>
                <div className="flex gap-1 mt-1">
                  {([["all", "全量"], ["ratio", "按比例"], ["count", "按条数"]] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => setInputSamplingMode(mode)}
                      className={`flex-1 px-1.5 py-1 text-[10px] rounded-md border ${inputSamplingMode === mode ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {inputSamplingMode === "ratio" && (
                <div>
                  <label className="text-[10px] text-muted-foreground">采样比例</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider value={[inputSampleRatio]} min={1} max={100} step={1}
                      onValueChange={([v]) => setInputSampleRatio(v)} className="flex-1" />
                    <span className="text-xs text-foreground w-10 text-right">{inputSampleRatio}%</span>
                  </div>
                </div>
              )}
              {inputSamplingMode === "count" && (
                <div>
                  <label className="text-[10px] text-muted-foreground">前N条</label>
                  <input type="number" value={inputSampleCount} onChange={e => setInputSampleCount(parseInt(e.target.value) || 0)}
                    min={1} placeholder="输入条数"
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Output node selected
    if (isOutputNode) {
      const isFileOutput = selectedNodeData.type === "file_output";
      return (
        <div className="border-l bg-card shrink-0 flex flex-col overflow-hidden" style={{ width: panelWidth }}>
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <FileOutput className="w-3.5 h-3.5" style={{ color: catColors["输出节点"] }} />输出节点配置
            </span>
            <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground">节点名称</label>
              <input value={selectedNodeData.label}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">节点ID</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{selectedNodeData.id}</p>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">输出配置</p>

              {isFileOutput ? (
                /* File output */
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">导出格式</label>
                    <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                      <option value="jsonl">JSONL</option>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="parquet">Parquet</option>
                      <option value="tsv">TSV</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Dataset output */
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">输出类型</label>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setOutputTargetType("new")}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md border ${outputTargetType === "new" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"}`}>
                        新建数据集
                      </button>
                      <button onClick={() => setOutputTargetType("append")}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md border ${outputTargetType === "append" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"}`}>
                        追加至已有
                      </button>
                    </div>
                  </div>

                  {outputTargetType === "new" ? (
                    <div>
                      <label className="text-[10px] text-muted-foreground">新数据集名称</label>
                      <input value={outputNewName} onChange={e => setOutputNewName(e.target.value)}
                        placeholder="请输入数据集名称"
                        className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">选择数据集</label>
                        <select value={outputDataset} onChange={e => { setOutputDataset(e.target.value); setOutputVersion(""); }}
                          className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                          <option value="">请选择数据集</option>
                          {mockDatasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                        </select>
                      </div>
                      {outputDataset && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">选择版本</label>
                          <select value={outputVersion} onChange={e => setOutputVersion(e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                            <option value="">请选择版本</option>
                            {mockDatasets.find(d => d.id === outputDataset)?.versions.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                            <option value="__new__">+ 新建版本</option>
                          </select>
                        </div>
                      )}

                      {/* 输出方式 */}
                      <div>
                        <label className="text-[10px] text-muted-foreground">输出方式</label>
                        <div className="flex gap-2 mt-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => setOutputWriteMode("append")}
                                className={`flex-1 px-2 py-1.5 text-xs rounded-md border ${outputWriteMode === "append" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"}`}>
                                追加输出
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px]">直接写入当前数据集的版本，不做任何处理（如去重等）</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => setOutputWriteMode("clear")}
                                className={`flex-1 px-2 py-1.5 text-xs rounded-md border ${outputWriteMode === "clear" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"}`}>
                                清空后输出
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px]">清空当前数据集版本所有数据后输出</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Operator node selected
    if (isOperatorNode) {
      const params = getNodeParams(selectedNodeData);
      const nodeConnections = connections.filter(c => c.from === selectedNode || c.to === selectedNode);
      // Check if operator needs external model
      const needsModel = ["qa_calibration_mapper", "query_calibration_mapper", "response_calibration_mapper",
        "dialog_intent_mapper", "dialog_sentiment_mapper", "dialog_sentiment_intensity_mapper",
        "dialog_topic_mapper", "entity_attr_extract_mapper", "entity_relation_extract_mapper",
        "event_extract_mapper", "keyword_extract_mapper", "nickname_extract_mapper",
        "pair_preference_mapper", "relation_identity_mapper"].includes(selectedNodeData.type);

      return (
        <div className="border-l bg-card shrink-0 flex flex-col overflow-hidden" style={{ width: panelWidth }}>
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: catColors[selectedNodeData.category] }} />
              算子节点配置
            </span>
            <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Top: node info */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground">节点名称（可编辑）</label>
                <input value={selectedNodeData.label}
                  onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                  className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">节点ID</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono bg-muted/30 px-1.5 py-1 rounded truncate">{selectedNodeData.id}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">算子版本</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 bg-muted/30 px-1.5 py-1 rounded">v1.0.0</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">算子名称</label>
                <p className="text-xs text-foreground mt-0.5">{selectedNodeData.category} · {selectedNodeData.operatorType}</p>
              </div>
              {selectedNodeData.description && (
                <div>
                  <label className="text-[10px] text-muted-foreground">算子描述</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{selectedNodeData.description}</p>
                </div>
              )}
            </div>

            {/* Middle: param form */}
            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">参数配置</p>
              {params.map(p => (
                <ParamFormField key={p.key} param={p}
                  value={selectedNodeData.config[p.key]}
                  onChange={v => updateNodeConfig(selectedNodeData.id, p.key, v)} />
              ))}
            </div>

            {/* Dependencies */}
            {needsModel && (
              <div className="border-t pt-3 space-y-3">
                <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">依赖服务</p>
                <div>
                  <label className="text-[10px] text-muted-foreground">模型</label>
                  <select value={selectedNodeData.config._model || ""}
                    onChange={e => updateNodeConfig(selectedNodeData.id, "_model", e.target.value)}
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                    <option value="">请选择模型</option>
                    <option value="gpt-4o">GPT-4o（v2024-08, 可用）</option>
                    <option value="qwen-max">通义千问-Max（v2.5, 可用）</option>
                    <option value="glm-4">GLM-4（v4.0, 可用）</option>
                    <option value="deepseek-v3">DeepSeek-V3（v3.0, 维护中）</option>
                  </select>
                </div>
              </div>
            )}

            {/* Connections */}
            <div className="border-t pt-3">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">连接</label>
              <div className="mt-1 space-y-1">
                {nodeConnections.map(c => {
                  const other = c.from === selectedNode ? nodes.find(n => n.id === c.to) : nodes.find(n => n.id === c.from);
                  const direction = c.from === selectedNode ? "→" : "←";
                  return (
                    <div key={c.id} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${c.compatible === false ? "bg-destructive/10 border border-destructive/30" : "bg-muted/50"}`}>
                      <span className="flex items-center gap-1">
                        {c.compatible === false && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        {direction} {other?.label || "未知"}
                      </span>
                      <button onClick={() => setConnections(prev => prev.filter(cc => cc.id !== c.id))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                {nodeConnections.length === 0 && <p className="text-[10px] text-muted-foreground">暂无连接</p>}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="border-t pt-3 space-y-2">
              <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => toast.success("参数校验通过")}>
                <CheckCircle2 className="w-3 h-3 mr-1" />验证参数
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="flex-1 text-xs h-7">
                  <HelpCircle className="w-3 h-3 mr-1" />查看帮助
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-xs h-7">
                  <Eye className="w-3 h-3 mr-1" />查看示例
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* ─── Toolbar ─── */}
        <div className="h-12 border-b bg-card flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/data-process/workflows")} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground">{wfName}</span>
            {debugMode ? (
              <span className="text-xs text-primary-foreground px-2 py-0.5 bg-primary rounded flex items-center gap-1">
                {debugAllDone ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                {debugAllDone ? "已完成" : "调试中"}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">编辑中</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="撤销"><Undo2 className="w-4 h-4" /></button>
            <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="重做"><Redo2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="放大"><ZoomIn className="w-4 h-4" /></button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="缩小"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="适应画布"><Maximize2 className="w-4 h-4" /></button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowMinimap(!showMinimap)}
                  className={`p-2 rounded-md hover:bg-muted/50 ${showMinimap ? "text-primary" : "text-muted-foreground"}`} title="小地图">
                  <Map className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{showMinimap ? "隐藏小地图" : "显示小地图"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={autoLayout} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="自动排列">
                  <AlignHorizontalDistributeCenter className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>自动排列</TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setViewMode(viewMode === "visual" ? "json" : "visual")}
                  className={`p-2 rounded-md hover:bg-muted/50 ${viewMode === "json" ? "text-primary" : "text-muted-foreground"}`}>
                  {viewMode === "visual" ? <Code2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{viewMode === "visual" ? "切换到 JSON 视图" : "切换到可视化视图"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className={`p-2 rounded-md hover:bg-muted/50 ${rightPanelCollapsed ? "text-muted-foreground" : "text-primary"}`}>
                  {rightPanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{rightPanelCollapsed ? "展开属性面板" : "收起属性面板"}</TooltipContent>
            </Tooltip>
            {(selectedNode || selectedConnection) && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <button onClick={deleteSelected} className="p-2 rounded-md hover:bg-destructive/10 text-destructive" title="删除"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
            <div className="w-px h-5 bg-border mx-1" />
            <button className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted/50 text-muted-foreground flex items-center gap-1.5" disabled={debugMode}><Save className="w-3.5 h-3.5" /> 保存</button>
            {debugMode ? (
              <button onClick={stopDebug} className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5" /> 停止调试
              </button>
            ) : (
              <>
                <button onClick={() => { if (validateWorkflow()) startDebug(); }} className="px-3 py-1.5 text-xs border border-primary text-primary rounded-md hover:bg-primary/10 flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5" /> 调试
                </button>
                <button onClick={() => { if (validateWorkflow()) toast.success("校验通过，提交运行"); }} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> 运行</button>
              </>
            )}
          </div>
        </div>

        {/* ─── Debug Status Bar ─── */}
        {debugMode && (
          <div className="h-9 border-b bg-muted/50 flex items-center justify-between px-4 shrink-0 z-20 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {debugAllDone ? (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                <span className="text-xs font-medium text-foreground">{debugAllDone ? "已完成" : "运行中"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>已耗时 {formatElapsed(debugElapsed)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>进度 {debugDoneCount}/{nodes.length} 节点</span>
              </div>
              {debugRunningCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{debugRunningCount} 个节点执行中</span>
                </div>
              )}
            </div>
            <button onClick={stopDebug} className="px-2.5 py-1 text-xs border border-destructive text-destructive rounded-md hover:bg-destructive/10 flex items-center gap-1">
              <Square className="w-3 h-3" /> 停止运行
            </button>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── Left: Operator panel ─── */}
          <div
            className="border-r bg-card shrink-0 flex flex-col overflow-hidden transition-all duration-200"
            style={{ width: panelCollapsed ? 48 : 260 }}
          >
            {panelCollapsed ? (
              <div className="flex flex-col items-center py-2 gap-1">
                <button onClick={() => setPanelCollapsed(false)} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground mb-2" title="展开算子面板">
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                {operatorCatalog.map(cat => (
                  <Tooltip key={cat.name}>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setPanelCollapsed(false); setExpandedCats(new Set([cat.name])); }}
                        className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground">
                        <cat.icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{cat.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <>
                <div className="p-3 border-b flex items-center gap-2">
                  <button onClick={() => setPanelCollapsed(true)} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground shrink-0" title="折叠面板">
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input value={operatorSearch} onChange={e => setOperatorSearch(e.target.value)}
                      placeholder="搜索算子..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {filteredCatalog.map(cat => {
                    const catExpanded = expandedCats.has(cat.name);
                    return (
                      <div key={cat.name}>
                        <button onClick={() => toggleCat(cat.name)}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 rounded-md">
                          {catExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          <cat.icon className="w-3.5 h-3.5 shrink-0" style={{ color: catColors[cat.name] }} />
                          <span>{cat.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                            {cat.types.reduce((s, t) => s + t.operators.length, 0)}
                          </span>
                        </button>
                        {catExpanded && (
                          <div className="ml-2 space-y-0.5">
                            {cat.types.map(opType => {
                              const typeKey = `${cat.name}-${opType.name}`;
                              const typeExpanded = expandedTypes.has(typeKey) || !!operatorSearch;
                              return (
                                <div key={typeKey}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => toggleType(typeKey)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/30">
                                        {typeExpanded ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 shrink-0" />}
                                        <span>{opType.name}</span>
                                        <span className="ml-auto text-[10px]">{opType.operators.length}</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[200px]">{opType.hint}</TooltipContent>
                                  </Tooltip>
                                  {typeExpanded && (
                                    <div className="ml-3 space-y-0.5 mt-0.5">
                                      {opType.operators.map(op => (
                                        <Tooltip key={op.type}>
                                          <TooltipTrigger asChild>
                                            <div draggable
                                              onDragStart={e => {
                                                e.dataTransfer.setData("application/operator", JSON.stringify({
                                                  ...op, category: cat.name, operatorType: opType.name,
                                                }));
                                                e.dataTransfer.effectAllowed = "copy";
                                              }}
                                              onDoubleClick={() => addNodeAtCenter(op, cat.name, opType.name)}
                                              className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing border border-transparent hover:border-border select-none">
                                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColors[cat.name] || "hsl(var(--primary))" }} />
                                              <span className="truncate">{op.label}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[240px]">{op.description}</TooltipContent>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t text-[10px] text-muted-foreground text-center">
                  拖拽或双击算子添加到画布
                </div>
              </>
            )}
          </div>

          {/* ─── Center: Canvas or JSON ─── */}
          {viewMode === "json" ? (
            <div className="flex-1 relative overflow-hidden bg-background">
              <div className="absolute top-3 left-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> JSON 源码视图
              </div>
              <textarea
                value={workflowJson}
                readOnly
                className="w-full h-full pt-10 px-4 pb-4 text-xs font-mono bg-background text-foreground resize-none focus:outline-none"
                style={{ tabSize: 2 }}
              />
            </div>
          ) : (
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ background: "hsl(var(--muted) / 0.3)" }}
            onMouseDown={startPan}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onWheel={handleWheel}
          >
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
              <defs>
                <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                  x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                  <circle cx="1" cy="1" r="0.8" fill="hsl(var(--muted-foreground) / 0.3)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Nodes & connections layer */}
            <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
              {/* Flow animation defs */}
              <defs>
                <marker id="flowDot" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4">
                  <circle cx="3" cy="3" r="3" fill="hsl(var(--primary))" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* Connections */}
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  const from = getPortPos(fromNode, conn.fromPort, false);
                  const to = getPortPos(toNode, conn.toPort, true);
                  const isSelected = selectedConnection === conn.id;
                  const isIncompatible = conn.compatible === false;

                  // Debug: check if data is flowing on this connection
                  const fromState = debugNodeStates[conn.from];
                  const isFlowing = debugMode && fromState && (fromState.status === "running" || fromState.status === "done");
                  const flowDone = debugMode && fromState?.status === "done";

                  const strokeColor = isIncompatible
                    ? "hsl(var(--destructive))"
                    : isFlowing
                      ? (flowDone ? "hsl(142 71% 45%)" : "hsl(var(--primary))")
                      : isSelected
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.4)";
                  const pathD = getPath(from, to);
                  return (
                    <g key={conn.id}>
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth={12} className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }} />
                      <path d={pathD} fill="none" stroke={strokeColor}
                        strokeWidth={isSelected ? 2.5 : 2}
                        strokeDasharray={isIncompatible ? "6 3" : undefined}
                        className="pointer-events-none transition-colors" />
                      {/* Flow animation dot */}
                      {isFlowing && !flowDone && (
                        <circle r={3} fill="hsl(var(--primary))" className="pointer-events-none">
                          <animateMotion dur="1.5s" repeatCount="indefinite" path={pathD} />
                        </circle>
                      )}
                      {isIncompatible && (
                        <g transform={`translate(${(from.x + to.x) / 2 - 6}, ${(from.y + to.y) / 2 - 6})`}>
                          <circle cx={6} cy={6} r={8} fill="hsl(var(--background))" />
                          <text x={6} y={10} textAnchor="middle" className="text-[10px] fill-destructive font-bold">!</text>
                        </g>
                      )}
                      <circle cx={to.x} cy={to.y} r={3} fill={strokeColor} className="pointer-events-none" />
                    </g>
                  );
                })}

                {/* Connecting line in progress */}
                {connecting && (
                  <path d={getPath(connecting.pos, mousePos)} fill="none" stroke="hsl(var(--primary))"
                    strokeWidth={2} strokeDasharray="6 3" className="pointer-events-none" />
                )}

                {/* Nodes */}
                {nodes.map(node => {
                  const isSelected = selectedNode === node.id;
                  const color = catColors[node.category] || "hsl(var(--primary))";
                  const nodeDebug = debugNodeStates[node.id];
                  const debugBorderColor = debugMode && nodeDebug
                    ? nodeDebug.status === "running" ? "hsl(var(--primary))"
                      : nodeDebug.status === "done" ? "hsl(142 71% 45%)"
                      : nodeDebug.status === "error" ? "hsl(var(--destructive))"
                      : undefined
                    : undefined;
                  return (
                    <g key={node.id}>
                      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H + (debugMode && nodeDebug && nodeDebug.status !== "pending" ? 20 : 0)}>
                        <div className="relative">
                          <div
                            onMouseDown={e => { if (!debugMode) startNodeDrag(e, node.id); }}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedNode(node.id);
                              setSelectedConnection(null);
                              if (debugMode) { setLogNodeId(node.id); setShowLogPanel(true); }
                            }}
                            className={`rounded-lg border-2 bg-card shadow-sm select-none transition-all ${debugMode ? "cursor-pointer" : ""} ${isSelected ? "shadow-lg" : "hover:shadow-md"} ${debugMode && nodeDebug?.status === "running" ? "animate-pulse" : ""}`}
                            style={{
                              borderColor: debugBorderColor || (isSelected ? color : "hsl(var(--border))"),
                              height: NODE_H,
                            }}
                          >
                            <div className="h-1.5 rounded-t-md" style={{ background: debugBorderColor || color }} />
                            <div className="px-3 py-2">
                              <div className="text-xs font-medium text-foreground truncate">{node.label}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{node.category} · {node.operatorType}</div>
                            </div>
                            {/* Debug status icon */}
                            {debugMode && nodeDebug && (
                              <div className="absolute top-1 right-1">
                                {nodeDebug.status === "running" && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                                {nodeDebug.status === "done" && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "hsl(142 71% 45%)" }} />}
                                {nodeDebug.status === "error" && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                              </div>
                            )}
                          </div>
                          {/* Debug stats badge below node */}
                          {debugMode && nodeDebug && nodeDebug.status !== "pending" && (
                            <div className="flex items-center justify-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                              <span>{nodeDebug.count.toLocaleString()} 条</span>
                              <span>·</span>
                              <span>{nodeDebug.duration}s</span>
                            </div>
                          )}
                        </div>
                      </foreignObject>

                      {/* Input ports */}
                      {node.inputs.map(port => {
                        const pos = getPortPos(node, port, true);
                        return (
                          <g key={`in-${port}`} onMouseUp={() => finishConnect(node.id, port)} className="cursor-pointer">
                            <circle cx={pos.x} cy={pos.y} r={PORT_R + 3} fill="transparent" />
                            <circle cx={pos.x} cy={pos.y} r={PORT_R} fill="hsl(var(--background))" stroke={color} strokeWidth={2} />
                            <text x={pos.x} y={pos.y - 10} textAnchor="middle" className="text-[8px] fill-muted-foreground pointer-events-none">{port}</text>
                          </g>
                        );
                      })}

                      {/* Output ports */}
                      {node.outputs.map(port => {
                        const pos = getPortPos(node, port, false);
                        return (
                          <g key={`out-${port}`} onMouseDown={e => startConnect(e, node.id, port)} className="cursor-crosshair">
                            <circle cx={pos.x} cy={pos.y} r={PORT_R + 3} fill="transparent" />
                            <circle cx={pos.x} cy={pos.y} r={PORT_R} fill={color} stroke={color} strokeWidth={2} />
                            <text x={pos.x} y={pos.y + 16} textAnchor="middle" className="text-[8px] fill-muted-foreground pointer-events-none">{port}</text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Boxes className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground/50">从左侧拖拽或双击算子到画布开始编排工作流</p>
                </div>
              </div>
            )}

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 px-2 py-1 rounded bg-card/80 backdrop-blur text-[10px] text-muted-foreground border"
              style={{ bottom: showMinimap && nodes.length > 0 ? MINIMAP_H + 24 : 16 }}>
              节点: {nodes.length} · 连线: {connections.length}
            </div>

            {/* ─── Minimap ─── */}
            {showMinimap && minimapData && minimapViewport && (
              <div className="absolute bottom-3 left-3 rounded-lg border bg-card/90 backdrop-blur shadow-lg overflow-hidden"
                style={{ width: MINIMAP_W, height: MINIMAP_H }}>
                <svg
                  width={MINIMAP_W}
                  height={MINIMAP_H}
                  className="cursor-pointer"
                  onMouseDown={handleMinimapMouseDown}
                  onMouseMove={handleMinimapMouseMove}
                >
                  {/* Background */}
                  <rect width={MINIMAP_W} height={MINIMAP_H} fill="hsl(var(--muted) / 0.5)" />

                  {/* Connections */}
                  {connections.map(conn => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    if (!fromNode || !toNode || !minimapData) return null;
                    const { minX, minY, scale } = minimapData;
                    const fx = (fromNode.x + NODE_W / 2 - minX) * scale;
                    const fy = (fromNode.y + NODE_H / 2 - minY) * scale;
                    const tx = (toNode.x + NODE_W / 2 - minX) * scale;
                    const ty = (toNode.y + NODE_H / 2 - minY) * scale;
                    return (
                      <line key={conn.id} x1={fx} y1={fy} x2={tx} y2={ty}
                        stroke={conn.compatible === false ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground) / 0.3)"}
                        strokeWidth={1} />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map(node => {
                    if (!minimapData) return null;
                    const { minX, minY, scale } = minimapData;
                    const nx = (node.x - minX) * scale;
                    const ny = (node.y - minY) * scale;
                    const nw = NODE_W * scale;
                    const nh = NODE_H * scale;
                    return (
                      <rect key={node.id} x={nx} y={ny} width={Math.max(nw, 4)} height={Math.max(nh, 3)}
                        rx={1}
                        fill={catColors[node.category] || "hsl(var(--primary))"}
                        opacity={selectedNode === node.id ? 1 : 0.7} />
                    );
                  })}

                  {/* Viewport rectangle */}
                  <rect
                    x={Math.max(0, minimapViewport.x)}
                    y={Math.max(0, minimapViewport.y)}
                    width={Math.min(minimapViewport.w, MINIMAP_W)}
                    height={Math.min(minimapViewport.h, MINIMAP_H)}
                    fill="hsl(var(--primary) / 0.1)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    rx={2}
                  />
                </svg>
              </div>
            )}

            {/* ─── Debug Log Panel ─── */}
            {debugMode && showLogPanel && logNodeId && (
              <div className="absolute bottom-0 left-0 right-0 bg-card border-t shadow-lg animate-fade-in" style={{ height: 200 }}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {nodes.find(n => n.id === logNodeId)?.label || logNodeId} — 实时日志
                    </span>
                    {debugNodeStates[logNodeId]?.status === "running" && (
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    )}
                    {debugNodeStates[logNodeId]?.status === "done" && (
                      <CheckCircle2 className="w-3 h-3" style={{ color: "hsl(142 71% 45%)" }} />
                    )}
                  </div>
                  <button onClick={() => setShowLogPanel(false)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-y-auto p-3 font-mono text-[11px] text-foreground/80 space-y-0.5" style={{ height: 160 }}>
                  {(debugLogs[logNodeId] || []).length === 0 ? (
                    <p className="text-muted-foreground">等待执行...</p>
                  ) : (
                    (debugLogs[logNodeId] || []).map((line, i) => (
                      <div key={i} className="leading-relaxed">
                        <span className="text-muted-foreground">{line}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* ─── Right: Properties panel (always visible) ─── */}
          {renderPropertyPanel()}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WorkflowCanvas;

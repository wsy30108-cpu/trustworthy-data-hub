import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Trash2, Boxes, Settings2, ChevronDown, ChevronRight,
  X, PanelLeftClose, PanelLeftOpen, Search,
  Type, Image, Mic, Video, Layers, Database, FileOutput, Wrench
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─── Types ─── */
interface Position { x: number; y: number }
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
  config?: Record<string, string>;
  description?: string;
}
interface Connection { id: string; from: string; fromPort: string; to: string; toPort: string }

interface Operator {
  type: string;
  label: string;
  description: string;
  inputs: string[];
  outputs: string[];
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
          { type: "comment_remove_mapper", label: "注释移除映射器", description: "从文档中删除注释，当前仅支持"文本"格式。", inputs: ["data"], outputs: ["data"] },
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

  // Accordion state: expanded categories and operator types
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["文本"]));
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleCat = (name: string) => {
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

  /* Get canvas center in canvas coords */
  const getCanvasCenter = useCallback((): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 300, y: 300 };
    return {
      x: (rect.width / 2 - pan.x) / zoom,
      y: (rect.height / 2 - pan.y) / zoom,
    };
  }, [pan, zoom]);

  /* Add node at canvas center (double-click) */
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

  /* ─── Output port drag → connection ─── */
  const startConnect = (e: React.MouseEvent, nodeId: string, port: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    const pos = getPortPos(node, port, false);
    setConnecting({ nodeId, port, pos });
  };

  const finishConnect = (nodeId: string, port: string) => {
    if (!connecting || connecting.nodeId === nodeId) { setConnecting(null); return; }
    const exists = connections.some(c => c.from === connecting.nodeId && c.to === nodeId);
    if (!exists) {
      setConnections(prev => [...prev, {
        id: `conn-${Date.now()}`,
        from: connecting.nodeId,
        fromPort: connecting.port,
        to: nodeId,
        toPort: port,
      }]);
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
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
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
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">编辑中</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="撤销"><Undo2 className="w-4 h-4" /></button>
            <button className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="重做"><Redo2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="放大"><ZoomIn className="w-4 h-4" /></button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="缩小"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground" title="适应画布"><Maximize2 className="w-4 h-4" /></button>
            {(selectedNode || selectedConnection) && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <button onClick={deleteSelected} className="p-2 rounded-md hover:bg-destructive/10 text-destructive" title="删除"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
            <div className="w-px h-5 bg-border mx-1" />
            <button className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted/50 text-muted-foreground flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> 保存</button>
            <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> 运行</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ─── Left: Operator panel ─── */}
          <div
            className="border-r bg-card shrink-0 flex flex-col overflow-hidden transition-all duration-200"
            style={{ width: panelCollapsed ? 48 : 260 }}
          >
            {panelCollapsed ? (
              /* Collapsed icon bar */
              <div className="flex flex-col items-center py-2 gap-1">
                <button
                  onClick={() => setPanelCollapsed(false)}
                  className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground mb-2"
                  title="展开算子面板"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                {operatorCatalog.map(cat => (
                  <Tooltip key={cat.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setPanelCollapsed(false); setExpandedCats(new Set([cat.name])); }}
                        className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground"
                      >
                        <cat.icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{cat.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              /* Expanded panel */
              <>
                <div className="p-3 border-b flex items-center gap-2">
                  <button
                    onClick={() => setPanelCollapsed(true)}
                    className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground shrink-0"
                    title="折叠面板"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={operatorSearch}
                      onChange={e => setOperatorSearch(e.target.value)}
                      placeholder="搜索算子..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {filteredCatalog.map(cat => {
                    const catExpanded = expandedCats.has(cat.name);
                    return (
                      <div key={cat.name}>
                        {/* Category header */}
                        <button
                          onClick={() => toggleCat(cat.name)}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 rounded-md"
                        >
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
                                  {/* Operator type header with tooltip */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => toggleType(typeKey)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/30"
                                      >
                                        {typeExpanded ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 shrink-0" />}
                                        <span>{opType.name}</span>
                                        <span className="ml-auto text-[10px]">{opType.operators.length}</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[200px]">
                                      {opType.hint}
                                    </TooltipContent>
                                  </Tooltip>
                                  {typeExpanded && (
                                    <div className="ml-3 space-y-0.5 mt-0.5">
                                      {opType.operators.map(op => (
                                        <Tooltip key={op.type}>
                                          <TooltipTrigger asChild>
                                            <div
                                              draggable
                                              onDragStart={e => {
                                                e.dataTransfer.setData("application/operator", JSON.stringify({
                                                  ...op, category: cat.name, operatorType: opType.name,
                                                }));
                                                e.dataTransfer.effectAllowed = "copy";
                                              }}
                                              onDoubleClick={() => addNodeAtCenter(op, cat.name, opType.name)}
                                              className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing border border-transparent hover:border-border select-none"
                                            >
                                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColors[cat.name] || "hsl(var(--primary))" }} />
                                              <span className="truncate">{op.label}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[240px]">
                                            {op.description}
                                          </TooltipContent>
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

          {/* ─── Center: Canvas ─── */}
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
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* Connections */}
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  const from = getPortPos(fromNode, conn.fromPort, false);
                  const to = getPortPos(toNode, conn.toPort, true);
                  const isSelected = selectedConnection === conn.id;
                  return (
                    <g key={conn.id}>
                      <path d={getPath(from, to)} fill="none" stroke="transparent" strokeWidth={12} className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }} />
                      <path d={getPath(from, to)} fill="none"
                        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                        strokeWidth={isSelected ? 2.5 : 2} className="pointer-events-none transition-colors" />
                      <circle cx={to.x} cy={to.y} r={3}
                        fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"} className="pointer-events-none" />
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
                  return (
                    <g key={node.id}>
                      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
                        <div
                          onMouseDown={e => startNodeDrag(e, node.id)}
                          onClick={e => { e.stopPropagation(); setSelectedNode(node.id); setSelectedConnection(null); }}
                          className={`h-full rounded-lg border-2 bg-card shadow-sm select-none transition-shadow ${isSelected ? "shadow-lg" : "hover:shadow-md"}`}
                          style={{ borderColor: isSelected ? color : "hsl(var(--border))" }}
                        >
                          <div className="h-1.5 rounded-t-md" style={{ background: color }} />
                          <div className="px-3 py-2">
                            <div className="text-xs font-medium text-foreground truncate">{node.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{node.category} · {node.operatorType}</div>
                          </div>
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
            <div className="absolute bottom-4 left-4 px-2 py-1 rounded bg-card/80 backdrop-blur text-[10px] text-muted-foreground border">
              节点: {nodes.length} · 连线: {connections.length}
            </div>
          </div>

          {/* ─── Right: Properties panel ─── */}
          {selectedNodeData && (
            <div className="w-64 border-l bg-card shrink-0 flex flex-col overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">节点属性</span>
                <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">名称</label>
                  <input
                    value={selectedNodeData.label}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                    className="w-full mt-1 px-2 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">类型</label>
                  <p className="text-xs text-foreground mt-1">{selectedNodeData.type}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">分类</label>
                  <p className="text-xs mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: catColors[selectedNodeData.category] }} />
                      {selectedNodeData.category} · {selectedNodeData.operatorType}
                    </span>
                  </p>
                </div>
                {selectedNodeData.description && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">描述</label>
                    <p className="text-xs text-muted-foreground mt-1">{selectedNodeData.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">输入端口</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNodeData.inputs.length > 0 ? selectedNodeData.inputs.map(p => (
                      <span key={p} className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{p}</span>
                    )) : <span className="text-[10px] text-muted-foreground">无</span>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">输出端口</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNodeData.outputs.length > 0 ? selectedNodeData.outputs.map(p => (
                      <span key={p} className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{p}</span>
                    )) : <span className="text-[10px] text-muted-foreground">无</span>}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">连接</label>
                  <div className="mt-1 space-y-1">
                    {connections.filter(c => c.from === selectedNode || c.to === selectedNode).map(c => {
                      const other = c.from === selectedNode ? nodes.find(n => n.id === c.to) : nodes.find(n => n.id === c.from);
                      const direction = c.from === selectedNode ? "→" : "←";
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[10px] px-2 py-1 bg-muted/50 rounded">
                          <span>{direction} {other?.label || "未知"}</span>
                          <button onClick={() => setConnections(prev => prev.filter(cc => cc.id !== c.id))} className="text-muted-foreground hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    {connections.filter(c => c.from === selectedNode || c.to === selectedNode).length === 0 && (
                      <p className="text-[10px] text-muted-foreground">暂无连接</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">参数配置</label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">批大小</label>
                      <input defaultValue="1000" className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">并行度</label>
                      <input defaultValue="4" className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">超时(秒)</label>
                      <input defaultValue="300" className="w-full mt-0.5 px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WorkflowCanvas;

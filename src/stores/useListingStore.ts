import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KVTag {
    key: string;
    value: string;
}

export interface SourceSpace {
    id: string;
    name: string;
}

export interface SourceDataset {
    id: string;
    name: string;
    modality: string;
    description: string;
    versions: string[];
}

export interface Listing {
    id: string;
    datasetName: string;
    datasetId: string;
    version: string;
    modality: string;
    status: '上架审批中' | '已上架' | '已拒绝' | '已下架';
    applyCount: number;
    authorizedUsers: number;
    publishedAt: string;
    publisher: string;
    isOfficial: boolean;
    source: string;
    description?: string;
    purpose?: string;
    tags?: KVTag[];
    versionDesc?: string;
    versionTags?: KVTag[];
    customMetadata?: string;
    applicantOrg?: string;
    technicalDomain?: string[];
    industryDomain?: string[];
}

export interface ListingApproval {
    id: string;
    listingId: string;
    datasetName: string;
    modality: string;
    description: string;
    purpose: string;
    tags: KVTag[];
    version: string;
    versionDesc: string;
    versionTags: KVTag[];
    technicalDomain: string[];
    industryDomain: string[];
    applicant: string;
    applicantOrg: string;
    applyTime: string;
    status: '待审批' | '已通过' | '已拒绝';
    opinion?: string;
    reviewer?: string;
    reviewTime?: string;
    customMetadata?: string;
}

interface ListingState {
    listings: Listing[];
    listingApprovals: ListingApproval[];
    withdrawListing: (id: string) => void;
    approveListing: (id: string, opinion: string, reviewer: string) => void;
    rejectListing: (id: string, opinion: string, reviewer: string) => void;
    deleteListing: (id: string) => void;
    addListing: (listing: Omit<Listing, 'status' | 'isOfficial' | 'publishedAt' | 'publisher'>) => void;
    updateListing: (id: string, updates: Partial<Listing>) => void;
}

const mockListings: Listing[] = [
    { id: "LS-001", datasetName: "中文通用NER标注数据集", datasetId: "M-001", version: "V3.0", modality: "文本", status: "已上架", applyCount: 234, authorizedUsers: 56, source: "自主发布", publisher: "张明", publishedAt: "2026-02-15", isOfficial: false, industryDomain: ["互联网 and 相关服务", "软件和信息技术服务业"] },
    { id: "LS-002", datasetName: "ImageNet-21K精选子集", datasetId: "M-002", version: "V2.0", modality: "图像", status: "已上架", applyCount: 567, authorizedUsers: 120, source: "预置数据集", publisher: "系统", publishedAt: "2026-01-01", isOfficial: true, industryDomain: ["计算机、通信和其他电子设备制造业"] },
    { id: "LS-003", datasetName: "金融行业研报摘要数据", datasetId: "M-003", version: "V1.5", modality: "文本", status: "已上架", applyCount: 189, authorizedUsers: 45, source: "自主发布", publisher: "李芳", publishedAt: "2026-02-20", isOfficial: false, industryDomain: ["货币金融服务", "资本市场服务"] },
    { id: "LS-005", datasetName: "智能制造缺陷检测数据集", datasetId: "M-005", version: "V2.1", modality: "图像", status: "已下架", applyCount: 78, authorizedUsers: 20, source: "自主发布", publisher: "孙伟", publishedAt: "2026-02-10", isOfficial: false, industryDomain: ["通用设备制造业", "汽车制造业"] },
    { id: "LS-006", datasetName: "中文多轮对话数据集", datasetId: "M-006", version: "V1.0", modality: "文本", status: "上架审批中", applyCount: 0, authorizedUsers: 0, source: "自主发布", publisher: "张明", publishedAt: "-", isOfficial: false, industryDomain: ["互联网 and 相关服务"] },
    { id: "LS-004", datasetName: "违规敏感词过滤集", datasetId: "M-004", version: "V1.2", modality: "文本", status: "已拒绝", applyCount: 0, authorizedUsers: 0, source: "自主发布", publisher: "李华", publishedAt: "-", isOfficial: false, industryDomain: ["社交保障"] },
];

const mockApprovals: ListingApproval[] = [
    {
        id: "LAP-001",
        listingId: "LS-006",
        datasetName: "中文语音转写ASR数据集",
        modality: "语音",
        description: "高保真中文语音转写数据集，涵盖多种方言。",
        purpose: "用于语音识别模型训练",
        tags: [{ key: "类型", value: "语音" }, { key: "语言", value: "中文" }, { key: "任务", value: "ASR" }],
        version: "V1.0",
        versionDesc: "初始版本发布",
        versionTags: [{ key: "状态", value: "Stable" }],
        applicant: "系统",
        applicantOrg: "语音实验室",
        technicalDomain: ["语音识别", "深度学习"],
        industryDomain: ["教育", "软件和信息技术服务业"],
        applyTime: "2026-03-10 10:00",
        status: "待审批",
        customMetadata: "{\"sampling_rate\": \"16kHz\", \"format\": \"wav\"}"
    },
    {
        id: "LAP-002",
        listingId: "LS-007",
        datasetName: "电商商品评论数据集",
        modality: "文本",
        description: "包含100万条真实电商评论数据，含情感标签。",
        purpose: "情感分析、推荐系统",
        tags: [{ key: "产业", value: "电商" }, { key: "技术", value: "NLP" }],
        version: "V2.5",
        versionDesc: "增加京东平台数据数据",
        versionTags: [{ key: "规模", value: "Massive" }, { key: "质量", value: "High-Quality" }],
        applicant: "赵丽",
        applicantOrg: "UED中心",
        technicalDomain: ["情感分析", "自然语言处理"],
        industryDomain: ["零售业", "互联网 and 相关服务"],
        applyTime: "2026-03-12 14:30",
        status: "待审批",
        customMetadata: "{\"platform\": \"Taobao, JD\", \"has_label\": true}"
    },
    {
        id: "LAP-003",
        listingId: "LS-008",
        datasetName: "自动驾驶场景图像数据集",
        modality: "图像",
        description: "涵盖雨天、雪天、夜间等极端场景。",
        purpose: "L4级自动驾驶算法研发",
        tags: [{ key: "领域", value: "自动驾驶" }, { key: "技术", value: "CV" }],
        version: "V4.2",
        versionDesc: "优化了夜间场景标注精度",
        versionTags: [{ key: "场景", value: "Night-vision" }, { key: "级别", value: "L4-Ready" }],
        applicant: "钱强",
        applicantOrg: "自研部",
        technicalDomain: ["目标检测", "图像分割"],
        industryDomain: ["土木工程建筑业", "公共设施管理业"],
        applyTime: "2026-03-11 09:00",
        status: "已通过",
        reviewer: "管理员",
        reviewTime: "2026-03-11 11:00",
        opinion: "符合规范，准予上架"
    },
    {
        id: "LAP-004",
        listingId: "LS-009",
        datasetName: "医疗影像诊断数据集 (Demo)",
        modality: "图像",
        description: "脱敏后的肺部CT影像数据。",
        purpose: "辅助医疗诊断模型演示",
        tags: [{ key: "领域", value: "医疗" }, { key: "类型", value: "影像" }],
        version: "V0.9-beta",
        versionDesc: "测试版数据",
        versionTags: [{ key: "状态", value: "Beta" }],
        applicantOrg: "创新实验室",
        technicalDomain: ["医学影像", "深度学习"],
        industryDomain: ["卫生", "医疗"],
        applicant: "孙燕",
        applyTime: "2026-03-13 16:00",
        status: "已拒绝",
        reviewer: "管理员",
        reviewTime: "2026-03-13 17:30",
        opinion: "数据样本量不足，且脱敏处理不彻底"
    },
];

export const useListingStore = create<ListingState>()(
    persist(
        (set) => ({
            listings: mockListings,
            listingApprovals: mockApprovals,
            withdrawListing: (id) => set((state) => ({
                listings: state.listings.map(l => l.id === id ? { ...l, status: '已下架' } : l)
            })),
            approveListing: (id, opinion, reviewer) => set((state) => {
                const approval = state.listingApprovals.find(a => a.id === id);
                if (!approval) return state;
                const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
                return {
                    listingApprovals: state.listingApprovals.map(a => a.id === id ? { ...a, status: '已通过', opinion, reviewer, reviewTime: now } : a),
                    listings: state.listings.map(l => l.id === approval.listingId ? {
                        ...l,
                        status: '已上架',
                        publishedAt: now,
                        opinion,
                        reviewer,
                        reviewTime: now,
                        // Sync metadata if it was modified during approval (mocking sync)
                        description: approval.description,
                        purpose: approval.purpose,
                        tags: approval.tags,
                        versionDesc: approval.versionDesc,
                        versionTags: approval.versionTags,
                        technicalDomain: approval.technicalDomain,
                        industryDomain: approval.industryDomain,
                        customMetadata: approval.customMetadata,
                        applicantOrg: approval.applicantOrg
                    } : l)
                };
            }),
            rejectListing: (id, opinion, reviewer) => set((state) => {
                const approval = state.listingApprovals.find(a => a.id === id);
                if (!approval) return state;
                const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
                return {
                    listingApprovals: state.listingApprovals.map(a => a.id === id ? { ...a, status: '已拒绝', opinion, reviewer, reviewTime: now } : a),
                    listings: state.listings.map(l => l.id === approval.listingId ? {
                        ...l,
                        status: '已拒绝',
                        opinion,
                        reviewer,
                        reviewTime: now,
                        description: approval.description,
                        purpose: approval.purpose,
                        tags: approval.tags,
                        versionDesc: approval.versionDesc,
                        versionTags: approval.versionTags,
                        technicalDomain: approval.technicalDomain,
                        industryDomain: approval.industryDomain,
                        customMetadata: approval.customMetadata,
                        applicantOrg: approval.applicantOrg
                    } : l)
                };
            }),
            deleteListing: (id) => set((state) => ({
                listings: state.listings.filter(l => l.id !== id),
                listingApprovals: state.listingApprovals.filter(a => a.listingId !== id)
            })),
            addListing: (listingData) => set((state) => ({
                listings: [
                    {
                        ...listingData,
                        status: '上架审批中',
                        isOfficial: false,
                        publishedAt: new Date().toISOString().split('T')[0],
                        publisher: '当前用户', // Simplified for mock
                    },
                    ...state.listings
                ],
                listingApprovals: [
                    {
                        id: `APP-NEW-${Math.random().toString(36).substr(2, 9)}`,
                        listingId: listingData.id,
                        datasetName: listingData.datasetName,
                        modality: listingData.modality,
                        description: listingData.description || "",
                        purpose: listingData.purpose || "",
                        tags: listingData.tags || [],
                        version: listingData.version,
                        versionDesc: listingData.versionDesc || "",
                        versionTags: listingData.versionTags || [],
                        technicalDomain: listingData.technicalDomain || [],
                        industryDomain: listingData.industryDomain || [],
                        applicant: '当前用户',
                        applicantOrg: '所属组织',
                        applyTime: new Date().toISOString().split('T')[0],
                        status: '待审批',
                        customMetadata: listingData.customMetadata || "{}"
                    },
                    ...state.listingApprovals
                ]
            })),
            updateListing: (id, updates) => set((state) => ({
                listings: state.listings.map(l => l.id === id ? {
                    ...l,
                    ...updates,
                    status: '上架审批中',
                    opinion: undefined,
                    reviewer: undefined,
                    reviewTime: undefined
                } : l)
            })),
        }),
        {
            name: 'dataset-listing-storage',
        }
    )
);

export const MOCK_SPACES: SourceSpace[] = [
    { id: "WS-001", name: "AI大模型研发组" },
    { id: "WS-002", name: "NLP基础研究团队" },
    { id: "WS-003", name: "北京AI研究院" },
    { id: "WS-005", name: "张明的个人空间" },
];

export const MOCK_SOURCE_DATASETS: Record<string, SourceDataset[]> = {
    "WS-001": [
        { id: "DS-001", name: "中文情感分析训练集", modality: "文本", description: "高品质中文情感分析数据集。", versions: ["V1.0", "V2.0", "V3.0"] },
        { id: "DS-006", name: "语音识别标注数据集", modality: "语音", description: "专业语音识别语料。", versions: ["V1.0", "V2.0"] },
    ],
    "WS-002": [
        { id: "DS-003", name: "多语种平行翻译语料", modality: "文本", description: "大规模翻译语料库。", versions: ["V1.0", "V2.0"] },
    ],
    "WS-003": [
        { id: "DS-002", name: "医疗影像CT扫描数据集", modality: "图像", description: "高质量医疗CT影像。", versions: ["V1.0", "V2.0", "V3.0", "V4.0", "V5.0"] },
    ],
};

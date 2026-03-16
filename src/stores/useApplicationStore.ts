import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Application {
    id: string;
    dataset: string;
    datasetId: string;
    applicantName: string; // 申请人姓名
    phone: string;         // 申请人电话
    creator: string;
    creatorOrg: string;    // 申请人组织
    permission: string;
    reason: string;
    status: '待审批' | '已通过' | '已拒绝' | '已撤回';
    applyTime: string;
    reviewer: string | null;
    reviewTime: string | null;
    opinion: string | null;
    // Metadata for context
    modality?: string;
    industryDomain?: string[];
    technicalDomain?: string[];
    description?: string;
    // Custom fields
    company?: string;
    email?: string;
}

interface ApplicationState {
    applications: Application[];
    addApplication: (app: Omit<Application, 'id' | 'status' | 'applyTime' | 'reviewer' | 'reviewTime' | 'opinion' | 'applicantName' | 'phone'>) => void;
    withdrawApplication: (id: string) => void;
    approveApplication: (id: string, opinion?: string) => void;
    rejectApplication: (id: string, opinion?: string) => void;
    batchApprove: (ids: string[]) => void;
    batchReject: (ids: string[]) => void;
}

const initialApplications: Application[] = [
    { id: "APP-001", dataset: "all-skills-from-skills-sh", datasetId: "M-001", applicantName: "王强", phone: "13800138001", creator: "官方", creatorOrg: "技术部", permission: "读写", reason: "NLP实体识别模型训练", status: "已通过", applyTime: "2026-02-20 10:00", reviewer: "张明", reviewTime: "2026-02-20 14:30", opinion: "已核实，通过", industryDomain: ["互联网和相关服务"], technicalDomain: ["知识蒸馏"], modality: "文本", description: "来源于 skills.sh 网站的所有 skill 数据" },
    { id: "APP-002", dataset: "ImageNet-21K精选子集", datasetId: "M-002", applicantName: "孙伟", phone: "13911223344", creator: "官方", creatorOrg: "算法实验室", permission: "读写", reason: "图像分类模型预训练", status: "待审批", applyTime: "2026-03-05 09:15", reviewer: null, reviewTime: null, opinion: null, company: "飞讯AI", email: "sunwei@feixun.ai", industryDomain: ["软件和信息技术服务业"], technicalDomain: ["多模态"], modality: "图像", description: "ImageNet-21K 的高质量精选子集" },
    { id: "APP-003", dataset: "金融行业研报摘要数据", datasetId: "M-003", applicantName: "周婷", phone: "13511112222", creator: "官方", creatorOrg: "金融服务部", permission: "只读", reason: "金融NLP数据调研", status: "已拒绝", applyTime: "2026-03-01 11:00", reviewer: "李芳", reviewTime: "2026-03-01 16:00", opinion: "申请理由不充分，请补充具体的模型训练计划 and 数据使用范围说明" },
    { id: "APP-004", dataset: "中英文平行语料v3", datasetId: "M-004", applicantName: "李明", phone: "13766554433", creator: "官方", creatorOrg: "翻译中心", permission: "读写", reason: "机器翻译模型训练", status: "已通过", applyTime: "2026-02-15 15:30", reviewer: "张明", reviewTime: "2026-02-15 17:00", opinion: "数据用途合理" },
    { id: "APP-005", dataset: "中文语音转写ASR数据集", datasetId: "M-005", applicantName: "陈刚", phone: "13122334455", creator: "官方", creatorOrg: "语音实验室", permission: "读写", reason: "语音识别模型微调", status: "已撤回", applyTime: "2026-02-28 09:00", reviewer: null, reviewTime: null, opinion: null },
    { id: "APP-006", dataset: "多模态情感分析数据集", datasetId: "M-006", applicantName: "赵丽", phone: "18600001111", creator: "官方", creatorOrg: "UED中心", permission: "只读", reason: "界面情感化设计调研", status: "待审批", applyTime: "2026-03-10 14:00", reviewer: null, reviewTime: null, opinion: null, company: "设计工坊", email: "zhaoli@design.com" },
];

export const useApplicationStore = create<ApplicationState>()(
    persist(
        (set) => ({
            applications: initialApplications,
            addApplication: (app) => set((state) => ({
                applications: [
                    {
                        ...app,
                        applicantName: "当前用户", // 模拟当前登录用户
                        phone: "13800000000",
                        id: `APP-${(state.applications.length + 1).toString().padStart(3, '0')}`,
                        status: '待审批',
                        applyTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
                        reviewer: null,
                        reviewTime: null,
                        opinion: null,
                    } as Application,
                    ...state.applications,
                ],
            })),
            withdrawApplication: (id) => set((state) => ({
                applications: state.applications.map((app) =>
                    app.id === id ? { ...app, status: '已撤回' } : app
                ),
            })),
            approveApplication: (id, opinion) => set((state) => ({
                applications: state.applications.map((app) =>
                    app.id === id ? {
                        ...app,
                        status: '已通过',
                        opinion: opinion || '已通过',
                        reviewer: '管理员',
                        reviewTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    } : app
                ),
            })),
            rejectApplication: (id, opinion) => set((state) => ({
                applications: state.applications.map((app) =>
                    app.id === id ? {
                        ...app,
                        status: '已拒绝',
                        opinion: opinion || '已拒绝',
                        reviewer: '管理员',
                        reviewTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    } : app
                ),
            })),
            batchApprove: (ids) => set((state) => ({
                applications: state.applications.map((app) =>
                    ids.includes(app.id) && app.status === '待审批' ? {
                        ...app,
                        status: '已通过',
                        opinion: '批量通过',
                        reviewer: '管理员',
                        reviewTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    } : app
                ),
            })),
            batchReject: (ids) => set((state) => ({
                applications: state.applications.map((app) =>
                    ids.includes(app.id) && app.status === '待审批' ? {
                        ...app,
                        status: '已拒绝',
                        opinion: '批量拒绝',
                        reviewer: '管理员',
                        reviewTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    } : app
                ),
            })),
        }),
        {
            name: 'dataset-application-storage',
        }
    )
);


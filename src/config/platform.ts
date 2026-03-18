import {
  LayoutDashboard, Database, Workflow, Tags, ShoppingBag,
  Settings, Users, Building2, HardDrive, FolderTree, BarChart3,
  FileSearch, FolderOpen, Share2, ClipboardList, Hammer,
  ListChecks, Trophy, PieChart, Play, BookOpen, Store,
  Boxes, Sparkles, GaugeCircle, FileText, ShieldCheck, Bell,
  Search, Upload, Download,
  Layout,
  UserCheck,
  Cpu,
} from "lucide-react";

export interface SubPlatform {
  id: string;
  name: string;
  routePrefix: string;
  defaultRoute: string;
  icon: any;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  children?: MenuItem[];
}

export const subPlatforms: SubPlatform[] = [
  { id: "003", name: "数据管理", routePrefix: "/data-management", defaultRoute: "/data-management/datasets", icon: Database },
  { id: "004", name: "数据处理", routePrefix: "/data-process", defaultRoute: "/data-process/workflows", icon: Workflow },
  { id: "005", name: "数据标注", routePrefix: "/data-annotation", defaultRoute: "/data-annotation/tasks", icon: Tags },
  { id: "006", name: "数据服务", routePrefix: "/data-service", defaultRoute: "/data-service/marketplace", icon: ShoppingBag },
  { id: "002", name: "控制台", routePrefix: "/console", defaultRoute: "/console/dashboard", icon: LayoutDashboard },
];

export const platformMenus: Record<string, MenuItem[]> = {
  "002": [
    {
      id: "dashboard-group",
      label: "概览",
      icon: BarChart3,
      route: "#",
      children: [
        { id: "dashboard", label: "概览", icon: BarChart3, route: "/console/dashboard" },
      ]
    },
    {
      id: "spaces-group",
      label: "空间管理",
      icon: Boxes,
      route: "#",
      children: [
        { id: "spaces", label: "空间管理", icon: Boxes, route: "/console/spaces" },
      ]
    },
    {
      id: "permission-control",
      label: "权限管控",
      icon: ShieldCheck,
      route: "#",
      children: [
        { id: "orgs", label: "组织管理", icon: Building2, route: "/console/organizations" },
        { id: "members", label: "成员管理", icon: Users, route: "/console/members" },
        { id: "roles", label: "角色管理", icon: ShieldCheck, route: "/console/roles" },
      ]
    },
    {
      id: "data-access",
      label: "数据接入",
      icon: HardDrive,
      route: "#",
      children: [
        { id: "storage", label: "存储管理", icon: HardDrive, route: "/console/storage" },
        { id: "datasource", label: "数据源配置", icon: Database, route: "/console/datasource" },
      ]
    },
    {
      id: "biz-support",
      label: "业务支撑",
      icon: Settings,
      route: "#",
      children: [
        { id: "catalog", label: "数据目录", icon: FolderTree, route: "/console/catalog" },
        { id: "system", label: "系统设置", icon: Settings, route: "/console/system" },
      ]
    },
  ],
  "003": [
    {
      id: "data-mgmt-group",
      label: "数据管理",
      icon: Database,
      route: "#",
      children: [
        { id: "datasets", label: "数据集管理", icon: Database, route: "/data-management/datasets" },
      ]
    },
    {
      id: "data-search-group",
      label: "数据检索",
      icon: FileSearch,
      route: "#",
      children: [
        { id: "file-search", label: "文件检索", icon: FileSearch, route: "/data-management/file-search" },
      ]
    },
    {
      id: "data-catalog-group",
      label: "数据目录",
      icon: FolderOpen,
      route: "#",
      children: [
        { id: "directories", label: "数据目录", icon: FolderOpen, route: "/data-management/directories" },
      ]
    },
  ],
  "004": [
    {
      id: "data-dev",
      label: "数据开发",
      icon: Workflow,
      route: "#",
      children: [
        { id: "workflows", label: "工作流", icon: Workflow, route: "/data-process/workflows" },
        { id: "run-records", label: "运行记录", icon: Play, route: "/data-process/run-records" },
        { id: "templates", label: "工作流模板", icon: BookOpen, route: "/data-process/templates" },
        { id: "operators", label: "算子管理", icon: Boxes, route: "/data-process/operators" },
      ]
    },
    {
      id: "feature-eng",
      label: "特征工程",
      icon: Sparkles,
      route: "#",
      children: [
        { id: "feature-extract", label: "特征抽取", icon: Sparkles, route: "/data-process/feature-extract" },
      ]
    },
    {
      id: "data-quality",
      label: "数据质量",
      icon: GaugeCircle,
      route: "#",
      children: [
        { id: "quality", label: "质量评估", icon: GaugeCircle, route: "/data-process/quality" },
      ]
    },
  ],
  "005": [
    {
      id: "summary",
      label: "标注概览",
      icon: PieChart,
      route: "#",
      children: [
        { id: "statistics", label: "概览", icon: PieChart, route: "/data-annotation/statistics" },
      ]
    },
    {
      id: "project-manage",
      label: "项目管理",
      icon: ClipboardList,
      route: "#",
      children: [
        { id: "tasks", label: "标注任务", icon: ClipboardList, route: "/data-annotation/tasks" },
      ]
    },
    {
      id: "workbench",
      label: "工作台",
      icon: Layout,
      route: "#",
      children: [
        { id: "task-hall", label: "任务大厅", icon: ListChecks, route: "/data-annotation/task-hall" },
        { id: "my-tasks", label: "我的任务", icon: UserCheck, route: "/data-annotation/my-tasks" },
        { id: "performance", label: "我的绩效", icon: Trophy, route: "/data-annotation/performance" },
      ]
    },
    {
      id: "manage-center",
      label: "管理中心",
      icon: Hammer,
      route: "#",
      children: [
        { id: "tools", label: "标注工具", icon: Hammer, route: "/data-annotation/tools" },
      ]
    },
  ],
  "006": [
    {
      id: "supply-group",
      label: "数据供给",
      icon: Upload,
      route: "#",
      children: [
        { id: "listing-mgmt", label: "上架管理", icon: Upload, route: "/data-service/listing" },
      ]
    },
    {
      id: "open-group",
      label: "数据开放",
      icon: ShoppingBag,
      route: "#",
      children: [
        { id: "marketplace", label: "数据集市", icon: ShoppingBag, route: "/data-service/marketplace" },
      ]
    },
    {
      id: "approval-mgmt-group",
      label: "审批管理",
      icon: ShieldCheck,
      route: "#",
      children: [
        { id: "my-applications", label: "我的申请", icon: FileText, route: "/data-service/my-applications" },
        { id: "approval", label: "审批管理", icon: ShieldCheck, route: "/data-service/approval" },
      ]
    },
  ],
};

export const mockWorkspaces = [
  { id: "ws-1", name: "AI数据团队空间", type: "团" as const, desc: "大模型数据处理与标注", members: 24 },
  { id: "ws-2", name: "NLP研发组", type: "团" as const, desc: "自然语言处理研究", members: 18 },
  { id: "ws-3", name: "个人空间", type: "个" as const, desc: "个人实验与探索", members: 1 },
  { id: "ws-4", name: "北京AI研究院", type: "组" as const, desc: "院级数据资产管理", members: 56 },
  { id: "ws-5", name: "计算机视觉实验室", type: "团" as const, desc: "CV模型训练数据管理", members: 15 },
  { id: "ws-6", name: "数据标注中心", type: "团" as const, desc: "标注任务管理与质检", members: 45 },
];

export const mockUser = {
  name: "张明",
  avatar: "",
  role: "平台管理员",
};

import { useLocation } from "react-router-dom";

const PlaceholderPage = () => {
  const location = useLocation();
  const path = location.pathname;
  
  const pageNames: Record<string, string> = {
    "/data-management/file-search": "文件检索",
    "/data-management/directories": "数据目录",
    "/console/spaces": "空间管理",
    "/console/organizations": "组织管理",
    "/console/members": "成员管理",
    "/console/roles": "角色管理",
    "/console/system": "系统设置",
    "/console/storage": "存储管理",
    "/console/datasource": "数据源配置",
    "/console/catalog": "数据目录管理",
    "/data-process/templates": "模板列表",
    "/data-process/template-store": "模板商店",
    "/data-process/run-records": "运行记录",
    "/data-process/operators": "算子管理",
    "/data-process/operator-store": "算子商店",
    "/data-process/feature-extract": "特征抽取",
    "/data-process/quality": "质量评估",
    "/data-annotation/task-hall": "任务大厅",
    "/data-annotation/tools": "标注工具",
    "/data-annotation/performance": "我的绩效",
    "/data-annotation/statistics": "统计分析",
    "/data-service/listing": "上架管理",
    "/data-service/approval": "审批管理",
    "/data-service/my-applications": "我的申请",
  };

  const pageName = pageNames[path] || path;

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{pageName}</h2>
        <p className="text-sm text-muted-foreground">该页面为原型占位页，完整功能开发中...</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;

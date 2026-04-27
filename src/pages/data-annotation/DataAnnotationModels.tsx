import { Brain, ChevronRight } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const DataAnnotationModels = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">模型管理</h1>
          <p className="page-description">分为模型基本信息与模型版本配置两级管理</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-2 flex items-center gap-2">
        {[
          { to: "/data-annotation/models/basic", label: "模型基本信息管理" },
          { to: "/data-annotation/models/versions", label: "模型版本管理" },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`
            }
          >
            <Brain className="w-4 h-4" />
            {item.label}
            <ChevronRight className="w-4 h-4 opacity-60" />
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
};

export default DataAnnotationModels;

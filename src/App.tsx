import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";

const ConsoleDashboard = lazy(() => import("./pages/console/ConsoleDashboard"));
const DataManagementDatasets = lazy(() => import("./pages/data-management/DataManagementDatasets"));
const DataProcessWorkflows = lazy(() => import("./pages/data-process/DataProcessWorkflows"));
const DataAnnotationTasks = lazy(() => import("./pages/data-annotation/DataAnnotationTasks"));
const DataServiceMarketplace = lazy(() => import("./pages/data-service/DataServiceMarketplace"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* 业务子平台 - 共享Shell布局 */}
            <Route element={<PlatformLayout />}>
              {/* 002 控制台 */}
              <Route path="/console/dashboard" element={<ConsoleDashboard />} />
              <Route path="/console/*" element={<PlaceholderPage />} />
              
              {/* 003 数据管理 */}
              <Route path="/data-management/datasets" element={<DataManagementDatasets />} />
              <Route path="/data-management/*" element={<PlaceholderPage />} />
              
              {/* 004 数据处理 */}
              <Route path="/data-process/workflows" element={<DataProcessWorkflows />} />
              <Route path="/data-process/*" element={<PlaceholderPage />} />
              
              {/* 005 数据标注 */}
              <Route path="/data-annotation/tasks" element={<DataAnnotationTasks />} />
              <Route path="/data-annotation/*" element={<PlaceholderPage />} />
              
              {/* 006 数据服务 */}
              <Route path="/data-service/marketplace" element={<DataServiceMarketplace />} />
              <Route path="/data-service/*" element={<PlaceholderPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

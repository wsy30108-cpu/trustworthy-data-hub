import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";

const ConsoleDashboard = lazy(() => import("./pages/console/ConsoleDashboard"));
const ConsoleSpaces = lazy(() => import("./pages/console/ConsoleSpaces"));
const ConsoleAnnotationTeams = lazy(() => import("./pages/console/ConsoleAnnotationTeams"));
const ConsoleOrganizations = lazy(() => import("./pages/console/ConsoleOrganizations"));
const ConsoleOrgMembers = lazy(() => import("./pages/console/ConsoleOrgMembers"));
const ConsoleMembers = lazy(() => import("./pages/console/ConsoleMembers"));
const ConsoleRoles = lazy(() => import("./pages/console/ConsoleRoles"));
const ConsoleSystem = lazy(() => import("./pages/console/ConsoleSystem"));
const ConsoleSystemPageEdit = lazy(() => import("./pages/console/ConsoleSystemPageEdit"));
const ConsoleStorage = lazy(() => import("./pages/console/ConsoleStorage"));
const ConsoleDatasource = lazy(() => import("./pages/console/ConsoleDatasource"));
const ConsoleCatalog = lazy(() => import("./pages/console/ConsoleCatalog"));

const DataManagementDatasets = lazy(() => import("./pages/data-management/DataManagementDatasets"));
const DataManagementFileSearch = lazy(() => import("./pages/data-management/DataManagementFileSearch"));
const DataManagementDirectories = lazy(() => import("./pages/data-management/DataManagementDirectories"));

const DataProcessWorkflows = lazy(() => import("./pages/data-process/DataProcessWorkflows"));
const DataProcessTemplates = lazy(() => import("./pages/data-process/DataProcessTemplates"));
const TemplateDetail = lazy(() => import("./pages/data-process/TemplateDetail"));
const DataProcessRunRecords = lazy(() => import("./pages/data-process/DataProcessRunRecords"));
const DataProcessOperators = lazy(() => import("./pages/data-process/DataProcessOperators"));
const DataProcessFeatureExtract = lazy(() => import("./pages/data-process/DataProcessFeatureExtract"));
const DataProcessQuality = lazy(() => import("./pages/data-process/DataProcessQuality"));
const WorkflowCanvas = lazy(() => import("./pages/data-process/WorkflowCanvas"));

const DataAnnotationTasks = lazy(() => import("./pages/data-annotation/DataAnnotationTasks"));
const DataAnnotationTaskHall = lazy(() => import("./pages/data-annotation/DataAnnotationTaskHall"));
const DataAnnotationMyTasks = lazy(() => import("./pages/data-annotation/DataAnnotationMyTasks"));
const DataAnnotationTools = lazy(() => import("./pages/data-annotation/DataAnnotationTools"));
const DataAnnotationPerformance = lazy(() => import("./pages/data-annotation/DataAnnotationPerformance"));
const DataAnnotationStatistics = lazy(() => import("./pages/data-annotation/DataAnnotationStatistics"));
const AnnotationToolEditor = lazy(() => import("./pages/data-annotation/AnnotationToolEditor"));
const DataAnnotationToolDetail = lazy(() => import("./pages/data-annotation/DataAnnotationToolDetail"));

const DataServiceMarketplace = lazy(() => import("./pages/data-service/DataServiceMarketplace"));
const DatasetDetail = lazy(() => import("./pages/data-service/DatasetDetail"));
const DataServiceListing = lazy(() => import("./pages/data-service/DataServiceListing"));
const DataServiceListingCreate = lazy(() => import("./pages/data-service/DataServiceListingCreate"));
const DataServiceApproval = lazy(() => import("./pages/data-service/DataServiceApproval"));
const DataServiceMyApplications = lazy(() => import("./pages/data-service/DataServiceMyApplications"));

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
        <AuthProvider>
          <AuthModal />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<PlatformLayout />}>
                  {/* 002 控制台 */}
                  <Route path="/console/dashboard" element={<ConsoleDashboard />} />
                  <Route path="/console/spaces" element={<ConsoleSpaces />} />
                  <Route path="/console/annotation-teams" element={<ConsoleAnnotationTeams />} />
                  <Route path="/console/organizations" element={<ConsoleOrganizations />} />
                  <Route path="/console/organizations/:orgId/members" element={<ConsoleOrgMembers />} />
                  <Route path="/console/members" element={<ConsoleMembers />} />
                  <Route path="/console/roles" element={<ConsoleRoles />} />
                  <Route path="/console/system" element={<ConsoleSystem />} />
                  <Route path="/console/system/page/:pageKey" element={<ConsoleSystemPageEdit />} />
                  <Route path="/console/storage" element={<ConsoleStorage />} />
                  <Route path="/console/datasource" element={<ConsoleDatasource />} />
                  <Route path="/console/catalog" element={<ConsoleCatalog />} />

                  {/* 003 数据管理 */}
                  <Route path="/data-management/datasets" element={<DataManagementDatasets />} />
                  <Route path="/data-management/file-search" element={<DataManagementFileSearch />} />
                  <Route path="/data-management/directories" element={<DataManagementDirectories />} />

                  {/* 004 数据处理 */}
                  <Route path="/data-process/workflows" element={<DataProcessWorkflows />} />
                  <Route path="/data-process/workflow-canvas" element={<WorkflowCanvas />} />
                  <Route path="/data-process/templates" element={<DataProcessTemplates />} />
                  <Route path="/data-process/templates/:id" element={<TemplateDetail />} />
                  <Route path="/data-process/run-records" element={<DataProcessRunRecords />} />
                  <Route path="/data-process/operators" element={<DataProcessOperators />} />
                  <Route path="/data-process/feature-extract" element={<DataProcessFeatureExtract />} />
                  <Route path="/data-process/quality" element={<DataProcessQuality />} />

                  {/* 005 数据标注 */}
                  <Route path="/data-annotation/tasks" element={<DataAnnotationTasks />} />
                  <Route path="/data-annotation/task-hall" element={<DataAnnotationTaskHall />} />
                  <Route path="/data-annotation/my-tasks" element={<DataAnnotationMyTasks />} />
                  <Route path="/data-annotation/tools" element={<DataAnnotationTools />} />
                  <Route path="/data-annotation/tools/:id" element={<DataAnnotationToolDetail />} />
                  <Route path="/data-annotation/tool-editor" element={<AnnotationToolEditor />} />
                  <Route path="/data-annotation/performance" element={<DataAnnotationPerformance />} />
                  <Route path="/data-annotation/statistics" element={<DataAnnotationStatistics />} />

                  {/* 006 数据服务 */}
                  <Route path="/data-service/marketplace" element={<DataServiceMarketplace />} />
                  <Route path="/data-service/marketplace/:id" element={<DatasetDetail />} />
                  <Route path="/data-service/listing" element={<DataServiceListing />} />
                  <Route path="/data-service/listing/create" element={<DataServiceListingCreate />} />
                  <Route path="/data-service/approval" element={<DataServiceApproval />} />
                  <Route path="/data-service/my-applications" element={<DataServiceMyApplications />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState } from "react";
import { Search, X, Check, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatasetVersion {
  id: string;
  name: string;
}

interface Dataset {
  id: string;
  name: string;
  module: string;
  versions: DatasetVersion[];
}

interface DatasetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (datasetId: string, versionId: string, datasetName: string, versionName: string) => void;
  currentDatasetId?: string;
  currentVersionId?: string;
}

const mockMyDatasets: Dataset[] = [
  { id: "ds1", name: "文本清洗数据集", module: "文本处理", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v1.1" }, { id: "v3", name: "v2.0" }] },
  { id: "ds2", name: "对话语料数据集", module: "自然语言", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v2.0" }] },
  { id: "ds3", name: "图像标注数据集", module: "图像处理", versions: [{ id: "v1", name: "v1.0" }] },
];

const mockSharedDatasets: Dataset[] = [
  { id: "ds4", name: "音频转写数据集", module: "语音处理", versions: [{ id: "v1", name: "v1.0" }, { id: "v2", name: "v1.1" }] },
  { id: "ds5", name: "医疗影像大数据", module: "医疗健康", versions: [{ id: "v1", name: "v1.0" }] },
];

const modules = ["全部模块", "文本处理", "自然语言", "图像处理", "语音处理", "医疗健康"];

export function DatasetSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentDatasetId,
  currentVersionId,
}: DatasetSelectionModalProps) {
  const [activeTab, setActiveTab] = useState(0); // 0: 我的, 1: 订购, 2: 分享
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});

  const [tempSelection, setTempSelection] = useState<{ dsId: string; verId: string; dsName: string; verName: string } | null>(
    currentDatasetId ? { dsId: currentDatasetId, verId: currentVersionId, dsName: "", verName: "" } : null
  );

  const datasets = activeTab === 0 ? mockMyDatasets : activeTab === 1 ? mockSharedDatasets : mockSharedDatasets; // Simplified for mock

  const filteredDatasets = datasets.filter((ds) => {
    return ds.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectVersion = (datasetId: string, versionId: string) => {
    setSelectedVersions(prev => ({ ...prev, [datasetId]: versionId }));
    if (tempSelection?.dsId === datasetId) {
      const ds = datasets.find(d => d.id === datasetId);
      const ver = ds?.versions.find(v => v.id === versionId);
      setTempSelection({ dsId: datasetId, verId: versionId, dsName: ds?.name || "", verName: ver?.name || "" });
    }
  };

  const currentDataset = datasets.find(d => d.id === (tempSelection?.dsId || currentDatasetId));

  const handleConfirm = () => {
    if (tempSelection) {
      onSelect(tempSelection.dsId, tempSelection.verId, tempSelection.dsName, tempSelection.verName);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[750px] border-none shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-8 py-5 border-b shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold tracking-tight">数据集配置</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">选择与项目类型匹配的数据集，支持选择数据集的一个版本进行处理</p>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Tabs Navigation */}
          <div className="px-8 border-b shrink-0 bg-white">
            <div className="flex gap-8 h-12">
              {["我的数据集", "我订购的", "分享给我的"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    "h-12 px-1 text-sm font-medium transition-all relative",
                    activeTab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-8 py-4 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索数据集..."
                className="w-full h-10 pl-10 pr-4 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              />
            </div>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-3 custom-scrollbar">
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map((ds) => {
                const currentSelectedVerId = selectedVersions[ds.id] || ds.versions[0]?.id;
                const isTempSelected = ds.id === tempSelection?.dsId;

                return (
                  <div
                    key={ds.id}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-xl border transition-all",
                      isTempSelected
                        ? "border-primary bg-primary/[0.03] shadow-sm"
                        : "border-slate-100 bg-white hover:border-primary/40 hover:bg-slate-50/30"
                    )}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{ds.name}</span>
                        <span className="text-xs text-slate-400 font-normal">{ds.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-500 font-bold uppercase tracking-tight">文本类</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span>{12500..toLocaleString()} 文件</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>2.3GB</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>创建人: 张明</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isTempSelected ? (
                        <>
                          <select
                            value={currentSelectedVerId}
                            onChange={(e) => handleSelectVersion(ds.id, e.target.value)}
                            className="px-2.5 py-1.5 text-xs border border-primary/20 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                          >
                            {ds.versions.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <div className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg border border-primary/20 flex items-center gap-1.5 font-bold shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                            已选
                          </div>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const verId = selectedVersions[ds.id] || ds.versions[0]?.id;
                            const ver = ds.versions.find(v => v.id === verId);
                            setTempSelection({ dsId: ds.id, verId, dsName: ds.name, verName: ver?.name || "" });
                          }}
                          className="h-8 px-5 text-xs font-bold border-primary text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          选择
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                <Database className="w-12 h-12 opacity-10" />
                <p className="text-sm font-medium">未找到符合条件的数据集</p>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="px-8 py-5 border-t bg-slate-50/50 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                {tempSelection ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mr-2">当前已选:</span>
                    <div className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-xl text-xs flex items-center gap-2.5 border border-primary/20 font-bold shadow-sm animate-in slide-in-from-left-2 duration-300">
                      <Database className="w-3.5 h-3.5" />
                      <span>{tempSelection.dsName || currentDataset?.name} ({tempSelection.verName || currentVersionId || currentDataset?.versions[0]?.name})</span>
                      <button 
                        onClick={() => setTempSelection(null)} 
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">请从上方列表中选择一个数据集</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onClose} className="px-6 h-9 text-xs font-bold">取消</Button>
                <Button 
                  size="sm" 
                  disabled={!tempSelection} 
                  onClick={handleConfirm}
                  className="px-8 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                >
                  确定
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

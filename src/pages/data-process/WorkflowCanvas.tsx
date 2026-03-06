import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Trash2, Boxes, GripVertical, Settings2, ChevronDown, ChevronRight,
  FileText, Filter, Shuffle, Sparkles, ScanSearch, Type, Image, Mic,
  X, Plus
} from "lucide-react";

/* ─── Types ─── */
interface Position { x: number; y: number }
interface CanvasNode {
  id: string;
  type: string;
  label: string;
  category: string;
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  config?: Record<string, string>;
}
interface Connection { id: string; from: string; fromPort: string; to: string; toPort: string }

/* ─── Operator catalog ─── */
const operatorCategories = [
  {
    name: "数据读取", icon: FileText, operators: [
      { type: "read_csv", label: "CSV读取", inputs: [], outputs: ["data"] },
      { type: "read_json", label: "JSON读取", inputs: [], outputs: ["data"] },
      { type: "read_db", label: "数据库读取", inputs: [], outputs: ["data"] },
      { type: "read_image", label: "图像读取", inputs: [], outputs: ["images"] },
    ]
  },
  {
    name: "数据清洗", icon: Filter, operators: [
      { type: "dedup", label: "去重", inputs: ["data"], outputs: ["data"] },
      { type: "desensitize", label: "脱敏", inputs: ["data"], outputs: ["data"] },
      { type: "format", label: "格式化", inputs: ["data"], outputs: ["data"] },
      { type: "filter_quality", label: "低质过滤", inputs: ["data"], outputs: ["data", "rejected"] },
    ]
  },
  {
    name: "数据增强", icon: Sparkles, operators: [
      { type: "augment_text", label: "文本增强", inputs: ["data"], outputs: ["data"] },
      { type: "augment_image", label: "图像增强", inputs: ["images"], outputs: ["images"] },
      { type: "back_translate", label: "回译增强", inputs: ["data"], outputs: ["data"] },
    ]
  },
  {
    name: "特征处理", icon: ScanSearch, operators: [
      { type: "extract_feature", label: "特征抽取", inputs: ["data"], outputs: ["features"] },
      { type: "embedding", label: "向量化", inputs: ["data"], outputs: ["vectors"] },
      { type: "tokenize", label: "分词", inputs: ["data"], outputs: ["tokens"] },
    ]
  },
  {
    name: "数据输出", icon: Shuffle, operators: [
      { type: "write_csv", label: "CSV输出", inputs: ["data"], outputs: [] },
      { type: "write_db", label: "数据库写入", inputs: ["data"], outputs: [] },
      { type: "write_oss", label: "对象存储输出", inputs: ["data"], outputs: [] },
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
  "数据读取": "hsl(var(--primary))",
  "数据清洗": "hsl(var(--warning, 38 92% 50%))",
  "数据增强": "hsl(280 60% 55%)",
  "特征处理": "hsl(160 60% 42%)",
  "数据输出": "hsl(var(--destructive))",
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
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(operatorCategories.map(c => c.name)));
  const [operatorSearch, setOperatorSearch] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  /* convert screen to canvas coords */
  const screenToCanvas = useCallback((sx: number, sy: number): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: sx, y: sy };
    return {
      x: (sx - rect.left - pan.x) / zoom,
      y: (sy - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

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
      x: pos.x - NODE_W / 2,
      y: pos.y - NODE_H / 2,
      inputs: op.inputs,
      outputs: op.outputs,
      config: {},
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
    // check no duplicate
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

  return (
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
        <div className="w-56 border-r bg-card shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <ScanSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={operatorSearch}
                onChange={e => setOperatorSearch(e.target.value)}
                placeholder="搜索算子..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {operatorCategories.map(cat => {
              const filtered = cat.operators.filter(o => !operatorSearch || o.label.includes(operatorSearch));
              if (filtered.length === 0) return null;
              const expanded = expandedCats.has(cat.name);
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => setExpandedCats(prev => {
                      const next = new Set(prev);
                      next.has(cat.name) ? next.delete(cat.name) : next.add(cat.name);
                      return next;
                    })}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
                  >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.name}
                  </button>
                  {expanded && (
                    <div className="ml-3 space-y-0.5 mt-0.5">
                      {filtered.map(op => (
                        <div
                          key={op.type}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData("application/operator", JSON.stringify({ ...op, category: cat.name }));
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing border border-transparent hover:border-border"
                        >
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColors[cat.name] || "hsl(var(--primary))" }} />
                          {op.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t text-[10px] text-muted-foreground text-center">
            拖拽算子到画布进行编排
          </div>
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
                    <path
                      d={getPath(from, to)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={12}
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }}
                    />
                    <path
                      d={getPath(from, to)}
                      fill="none"
                      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                      strokeWidth={isSelected ? 2.5 : 2}
                      strokeDasharray={isSelected ? "none" : "none"}
                      className="pointer-events-none transition-colors"
                    />
                    {/* Arrow */}
                    <circle cx={to.x} cy={to.y} r={3} fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"} className="pointer-events-none" />
                  </g>
                );
              })}

              {/* Connecting line in progress */}
              {connecting && (
                <path
                  d={getPath(connecting.pos, mousePos)}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  className="pointer-events-none"
                />
              )}

              {/* Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode === node.id;
                const color = catColors[node.category] || "hsl(var(--primary))";
                return (
                  <g key={node.id}>
                    {/* Node body */}
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
                          <div className="text-[10px] text-muted-foreground mt-0.5">{node.category}</div>
                        </div>
                      </div>
                    </foreignObject>

                    {/* Input ports */}
                    {node.inputs.map((port, i) => {
                      const pos = getPortPos(node, port, true);
                      return (
                        <g key={`in-${port}`}
                          onMouseUp={() => finishConnect(node.id, port)}
                          className="cursor-pointer"
                        >
                          <circle cx={pos.x} cy={pos.y} r={PORT_R + 3} fill="transparent" />
                          <circle cx={pos.x} cy={pos.y} r={PORT_R} fill="hsl(var(--background))" stroke={color} strokeWidth={2} className="transition-all hover:r-8" />
                          <text x={pos.x} y={pos.y - 10} textAnchor="middle" className="text-[8px] fill-muted-foreground pointer-events-none">{port}</text>
                        </g>
                      );
                    })}

                    {/* Output ports */}
                    {node.outputs.map((port, i) => {
                      const pos = getPortPos(node, port, false);
                      return (
                        <g key={`out-${port}`}
                          onMouseDown={e => startConnect(e, node.id, port)}
                          className="cursor-crosshair"
                        >
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
                <p className="text-sm text-muted-foreground/50">从左侧拖拽算子到画布开始编排工作流</p>
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
                    {selectedNodeData.category}
                  </span>
                </p>
              </div>
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
  );
};

export default WorkflowCanvas;

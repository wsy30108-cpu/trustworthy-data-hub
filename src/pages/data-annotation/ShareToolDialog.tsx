import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Users, Building2, Globe, CheckCircle2, Search, Check, X, ChevronsUpDown } from "lucide-react";

interface ShareToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    toolName?: string;
}

const workspaces = [
    { id: "personal", name: "个人工作空间" },
    { id: "team-1", name: "XXXXX团队工作空间" },
    { id: "team-2", name: "AI 研发团队工作空间" },
    { id: "team-3", name: "标注测试组工作空间" },
    { id: "team-4", name: "数据标注一组" },
    { id: "team-5", name: "视觉计算实验室" },
    { id: "team-6", name: "自然语言处理中心" },
];

const ShareToolDialog = ({ open, onOpenChange, toolName }: ShareToolDialogProps) => {
    const [shareToTeam, setShareToTeam] = useState(false);
    const [shareToOrg, setShareToOrg] = useState(false);
    const [shareToMarket, setShareToMarket] = useState(false);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(["team-1"]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleConfirm = () => {
        toast.success(`工具 "${toolName}" 已成功分享`);
        onOpenChange(false);
    };

    const toggleWorkspace = (id: string) => {
        setSelectedWorkspaces(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const removeWorkspace = (id: string) => {
        setSelectedWorkspaces(prev => prev.filter(item => item !== id));
    };

    const options = [
        {
            id: "share-team",
            checked: shareToTeam,
            onChange: (val: boolean) => setShareToTeam(val),
            icon: <Users className={cn("w-5 h-5", shareToTeam ? "text-primary" : "text-muted-foreground")} />,
            title: "分享标注工具到团队或个人工作空间内",
            description: "分享后仅该团队空间成员或本人可使用。",
            extra: (
                <div className="mt-4 ml-1" onClick={(e) => e.stopPropagation()}>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                disabled={!shareToTeam}
                                className="w-full max-w-[480px] min-h-[44px] h-auto justify-between bg-background/50 border-muted-foreground/20 hover:border-primary/50 focus:ring-primary/20 px-3 py-2 text-left font-normal transition-all"
                            >
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {selectedWorkspaces.length > 0 ? (
                                        selectedWorkspaces.map(id => {
                                            const ws = workspaces.find(w => w.id === id);
                                            return (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="bg-primary/10 text-primary border-primary/10 hover:bg-primary/20 flex items-center gap-1 py-0.5 px-2 text-xs font-medium"
                                                >
                                                    {ws?.name}
                                                    <X
                                                        className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeWorkspace(id);
                                                        }}
                                                    />
                                                </Badge>
                                            );
                                        })
                                    ) : (
                                        <span className="text-muted-foreground italic">选择一个或多个工作空间...</span>
                                    )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[480px] p-0 shadow-2xl border-primary/10" align="start">
                            <Command className="rounded-lg">
                                <CommandInput placeholder="搜索工作空间..." className="h-11" />
                                <CommandList className="max-h-[220px]">
                                    <CommandEmpty>未找到工作空间</CommandEmpty>
                                    <CommandGroup>
                                        {workspaces.map((ws) => (
                                            <CommandItem
                                                key={ws.id}
                                                value={ws.name}
                                                onSelect={() => toggleWorkspace(ws.id)}
                                                className="flex items-center justify-between py-3 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center rounded border border-primary/30 transition-colors",
                                                        selectedWorkspaces.includes(ws.id) ? "bg-primary border-primary" : "bg-transparent"
                                                    )}>
                                                        {selectedWorkspaces.includes(ws.id) && (
                                                            <Check className="h-3 w-3 text-primary-foreground" />
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm",
                                                        selectedWorkspaces.includes(ws.id) ? "font-semibold text-primary" : "text-foreground"
                                                    )}>
                                                        {ws.name}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className="mt-2 text-[11px] text-muted-foreground/60 italic">支持多选并支持按名称搜索</p>
                </div>
            )
        },
        {
            id: "share-org",
            checked: shareToOrg,
            onChange: (val: boolean) => setShareToOrg(val),
            icon: <Building2 className={cn("w-5 h-5", shareToOrg ? "text-blue-500" : "text-muted-foreground")} />,
            title: "分享标注工具到机构工作空间内",
            description: "分享后所在机构成员可使用。"
        },
        {
            id: "share-market",
            checked: shareToMarket,
            onChange: (val: boolean) => setShareToMarket(val),
            icon: <Globe className={cn("w-5 h-5", shareToMarket ? "text-amber-500" : "text-muted-foreground")} />,
            title: "分享到标注工具市场",
            description: "分享后租户内所有成员均可见并使用该工具。"
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-[720px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-8 py-6 bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold font-plus-jakarta tracking-tight">分享标注工具</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">请选择您想要共享工具的范围</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 py-8 space-y-4">
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => opt.onChange(!opt.checked)}
                            className={cn(
                                "relative group flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                                opt.checked
                                    ? "bg-primary/[0.03] border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]"
                                    : "bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/5 shadow-sm"
                            )}
                        >
                            <div className="pt-0.5">
                                <Checkbox
                                    id={opt.id}
                                    checked={opt.checked}
                                    onCheckedChange={(val) => opt.onChange(!!val)}
                                    className="w-5 h-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <label
                                    htmlFor={opt.id}
                                    className="block cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {opt.icon}
                                        <span className="text-[15px] font-semibold text-foreground tracking-tight">{opt.title}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                                        {opt.description}
                                    </p>
                                </label>
                                {opt.extra}
                            </div>

                            {opt.checked && (
                                <div className="absolute right-4 top-4">
                                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        Selected
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter className="px-8 py-6 bg-muted/10 border-t gap-3 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="px-8 h-11 border-primary/20 text-primary hover:bg-primary/10 transition-colors font-semibold"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="px-12 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] font-semibold"
                    >
                        确认
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ShareToolDialog;

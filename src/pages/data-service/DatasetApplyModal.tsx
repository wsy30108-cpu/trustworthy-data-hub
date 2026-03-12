import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface Dataset {
    id: string;
    name: string;
    version?: string;
}

interface DatasetApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataset: Dataset | null;
    existingApplications: any[];
    userPermissions: Record<string, string>; // datasetId -> permission ("Read" | "ReadWrite" | "None")
}

export const DatasetApplyModal = ({
    isOpen,
    onClose,
    dataset,
    existingApplications,
    userPermissions,
}: DatasetApplyModalProps) => {
    const [permissionType, setPermissionType] = useState("只读");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setPermissionType("只读");
            setReason("");
        }
    }, [isOpen]);

    if (!dataset) return null;

    const currentPermission = userPermissions[dataset.id] || "None";
    const hasPending = existingApplications.some(
        (app) => app.dataset === dataset.name && app.status === "待审批"
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();


        if (reason.length > 200) {
            toast.error("申请理由不能超过200字符");
            return;
        }

        // 防重校验
        if (hasPending) {
            toast.warning(`您已提交过 [${dataset.name}] 的申请，请耐心等待审批`);
            return;
        }

        if (currentPermission === "ReadWrite") {
            toast.error("您已拥有该数据集的最高权限（读写），无需重复申请");
            return;
        }

        if (currentPermission === "Read" && permissionType === "只读") {
            toast.warning("您已拥有该数据集的只读权限，无需再次申请相同权限");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success("申请提交成功，请等待管理员审批");
            onClose();
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] animate-in fade-in zoom-in duration-300">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        申请使用数据集
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">申请数据集</Label>
                            <Input
                                value={dataset.name}
                                readOnly
                                className="col-span-3 bg-muted/50 text-xs h-9"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">数据集版本</Label>
                            <Input
                                value={dataset.version || "v1.0.0"}
                                readOnly
                                className="col-span-3 bg-muted/50 text-xs h-9"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">申请权限类型</Label>
                            <div className="col-span-3">
                                <Select value={permissionType} onValueChange={setPermissionType}>
                                    <SelectTrigger className="text-xs h-9">
                                        <SelectValue placeholder="选择权限类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="只读">只读（仅用于模型训练、质量评估等任务）</SelectItem>
                                        <SelectItem value="读写">读写 (可用于数据处理和标注等任务)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right mt-2 text-xs">申请理由</Label>
                            <div className="col-span-3 flex flex-col gap-1.5">
                                <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="请说明您的数据用途（200字以内）"
                                    className="resize-none text-xs min-h-[100px]"
                                    maxLength={200}
                                />
                                <div className="flex justify-between items-center px-1">
                                    <span className={`text-[10px] ${reason.length > 190 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {reason.length}/200
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-xs h-9">
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="text-xs h-9 px-6 bg-primary shadow-sm hover:shadow-md transition-shadow">
                            {isSubmitting ? "提交中..." : "提交申请"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

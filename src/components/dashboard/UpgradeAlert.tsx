
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Rocket, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export const UpgradeAlert = ({ open, onOpenChange, title, description }: UpgradeDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-b from-background to-primary/5">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-4 rounded-full animate-bounce">
                            <Crown className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        {title || "Desbloqueie todo o potencial"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {description || "Você atingiu o limite do seu plano atual."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-card border rounded-lg shadow-sm">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Benefícios do Plano PRO
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Produtos ilimitados</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Domínio personalizado</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Remoção da marca VitrinePro</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Integração com Pixel e Analytics</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Link to="/dashboard?tab=subscription" onClick={() => onOpenChange(false)} className="w-full">
                        <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20">
                            <Rocket className="mr-2 h-5 w-5" />
                            Fazer Upgrade Agora
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    CreditCard,
    Loader2,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Copy
} from "lucide-react";

interface PaymentSettings {
    // Mercado Pago
    mercadopago_enabled: boolean;
    mercadopago_public_key: string;
    mercadopago_access_token: string;
    mercadopago_webhook_secret: string;
    mercadopago_sandbox: boolean;

    // Asaas
    asaas_enabled: boolean;
    asaas_api_key: string;
    asaas_wallet_id: string;
    asaas_webhook_token: string;
    asaas_sandbox: boolean;
}

const defaultSettings: PaymentSettings = {
    mercadopago_enabled: false,
    mercadopago_public_key: "",
    mercadopago_access_token: "",
    mercadopago_webhook_secret: "",
    mercadopago_sandbox: true,

    asaas_enabled: false,
    asaas_api_key: "",
    asaas_wallet_id: "",
    asaas_webhook_token: "",
    asaas_sandbox: true,
};

export const PaymentSettingsManager = () => {
    const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from("system_settings")
                .select("payment")
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data?.payment) {
                setSettings({ ...defaultSettings, ...(data.payment as PaymentSettings) });
            }
        } catch (err) {
            console.error("Error loading payment settings:", err);
            toast.error("Erro ao carregar configurações de pagamento");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Check if system_settings exists
            const { data: existing } = await supabase
                .from("system_settings")
                .select("id")
                .limit(1)
                .maybeSingle();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from("system_settings")
                    .update({ payment: settings as any, updated_at: new Date().toISOString() })
                    .eq("id", existing.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("system_settings")
                    .insert({ payment: settings as any });

                if (error) throw error;
            }

            toast.success("Configurações de pagamento salvas!");
        } catch (err) {
            console.error("Error saving payment settings:", err);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleShowSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
    };

    const webhookBaseUrl = window.location.origin.replace("localhost:8080", "YOUR_SUPABASE_URL") + "/functions/v1";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Gateways de Pagamento</h2>
                    <p className="text-muted-foreground">Configure os métodos de pagamento para assinaturas</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Configurações
                </Button>
            </div>

            <Tabs defaultValue="mercadopago" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mercadopago" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Mercado Pago
                        {settings.mercadopago_enabled && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Ativo</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="asaas" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Asaas
                        {settings.asaas_enabled && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Ativo</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* MERCADO PAGO */}
                <TabsContent value="mercadopago">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <img src="https://http2.mlstatic.com/frontend-assets/homes-pal498/faviconMeli.ico" alt="MP" className="h-6 w-6" />
                                        Mercado Pago
                                    </CardTitle>
                                    <CardDescription>
                                        Aceite PIX, cartão de crédito e boleto. Ideal para MVP rápido.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="mp-enabled">Ativado</Label>
                                    <Switch
                                        id="mp-enabled"
                                        checked={settings.mercadopago_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, mercadopago_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                <span className="text-sm text-amber-700 dark:text-amber-400">
                                    <strong>Sandbox:</strong> Use credenciais de teste antes de ir para produção.
                                </span>
                                <Switch
                                    checked={settings.mercadopago_sandbox}
                                    onCheckedChange={(checked) => setSettings({ ...settings, mercadopago_sandbox: checked })}
                                />
                                <span className="text-xs font-medium">{settings.mercadopago_sandbox ? "Teste" : "Produção"}</span>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mp-public-key">Public Key</Label>
                                    <div className="relative">
                                        <Input
                                            id="mp-public-key"
                                            placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            value={settings.mercadopago_public_key}
                                            onChange={(e) => setSettings({ ...settings, mercadopago_public_key: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Chave pública para o frontend</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mp-access-token">Access Token</Label>
                                    <div className="relative flex gap-2">
                                        <Input
                                            id="mp-access-token"
                                            type={showSecrets["mp-access-token"] ? "text" : "password"}
                                            placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            value={settings.mercadopago_access_token}
                                            onChange={(e) => setSettings({ ...settings, mercadopago_access_token: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleShowSecret("mp-access-token")}
                                        >
                                            {showSecrets["mp-access-token"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Token secreto para o backend (nunca exponha no frontend!)</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mp-webhook-secret">Webhook Secret (opcional)</Label>
                                    <div className="relative flex gap-2">
                                        <Input
                                            id="mp-webhook-secret"
                                            type={showSecrets["mp-webhook-secret"] ? "text" : "password"}
                                            placeholder="Sua chave de assinatura do webhook"
                                            value={settings.mercadopago_webhook_secret}
                                            onChange={(e) => setSettings({ ...settings, mercadopago_webhook_secret: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleShowSecret("mp-webhook-secret")}
                                        >
                                            {showSecrets["mp-webhook-secret"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="font-medium mb-2">URLs de Webhook</h4>
                                <p className="text-sm text-muted-foreground mb-2">Configure esta URL no painel do Mercado Pago:</p>
                                <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                                    <code className="flex-1 truncate">{webhookBaseUrl}/webhook-mercadopago</code>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(webhookBaseUrl + "/webhook-mercadopago", "URL")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Painel de Desenvolvedores
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ASAAS */}
                <TabsContent value="asaas">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <img src="https://www.asaas.com/favicon.ico" alt="Asaas" className="h-6 w-6" />
                                        Asaas
                                    </CardTitle>
                                    <CardDescription>
                                        Foco Brasil. PIX, boleto e cartão com taxas competitivas.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="asaas-enabled">Ativado</Label>
                                    <Switch
                                        id="asaas-enabled"
                                        checked={settings.asaas_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, asaas_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-blue-700 dark:text-blue-400">
                                    <strong>Recomendado:</strong> Melhor opção para PIX e Boleto no Brasil.
                                </span>
                                <Switch
                                    checked={settings.asaas_sandbox}
                                    onCheckedChange={(checked) => setSettings({ ...settings, asaas_sandbox: checked })}
                                />
                                <span className="text-xs font-medium">{settings.asaas_sandbox ? "Sandbox" : "Produção"}</span>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asaas-api-key">API Key</Label>
                                    <div className="relative flex gap-2">
                                        <Input
                                            id="asaas-api-key"
                                            type={showSecrets["asaas-api-key"] ? "text" : "password"}
                                            placeholder="$aact_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            value={settings.asaas_api_key}
                                            onChange={(e) => setSettings({ ...settings, asaas_api_key: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleShowSecret("asaas-api-key")}
                                        >
                                            {showSecrets["asaas-api-key"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Encontre em: Asaas → Configurações → Integrações → API</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="asaas-wallet-id">Wallet ID (opcional)</Label>
                                    <Input
                                        id="asaas-wallet-id"
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        value={settings.asaas_wallet_id}
                                        onChange={(e) => setSettings({ ...settings, asaas_wallet_id: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">ID da sua carteira para split de pagamentos</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="asaas-webhook-token">Webhook Token</Label>
                                    <div className="relative flex gap-2">
                                        <Input
                                            id="asaas-webhook-token"
                                            type={showSecrets["asaas-webhook-token"] ? "text" : "password"}
                                            placeholder="Token para validar webhooks"
                                            value={settings.asaas_webhook_token}
                                            onChange={(e) => setSettings({ ...settings, asaas_webhook_token: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleShowSecret("asaas-webhook-token")}
                                        >
                                            {showSecrets["asaas-webhook-token"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="font-medium mb-2">URLs de Webhook</h4>
                                <p className="text-sm text-muted-foreground mb-2">Configure esta URL no painel do Asaas:</p>
                                <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                                    <code className="flex-1 truncate">{webhookBaseUrl}/webhook-asaas</code>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(webhookBaseUrl + "/webhook-asaas", "URL")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <a href="https://sandbox.asaas.com/" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Sandbox Asaas
                                    </a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="https://www.asaas.com/login" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Painel Produção
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Status Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${settings.mercadopago_enabled ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-muted"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {settings.mercadopago_enabled ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                                <span className="font-semibold">Mercado Pago</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {settings.mercadopago_enabled
                                    ? `${settings.mercadopago_sandbox ? "Sandbox" : "Produção"} - ${settings.mercadopago_access_token ? "Configurado" : "Sem Access Token"}`
                                    : "Desativado"
                                }
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${settings.asaas_enabled ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-muted"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {settings.asaas_enabled ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                                <span className="font-semibold">Asaas</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {settings.asaas_enabled
                                    ? `${settings.asaas_sandbox ? "Sandbox" : "Produção"} - ${settings.asaas_api_key ? "Configurado" : "Sem API Key"}`
                                    : "Desativado"
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentSettingsManager;

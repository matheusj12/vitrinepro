import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Mail, Lock, User } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("register");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Verificar se o email foi confirmado
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setRegisteredEmail(loginEmail);
        setShowEmailConfirmation(true);
        toast.error("E-mail não confirmado. Verifique sua caixa de entrada.");
        setLoading(false);
        return;
      }

      if (data.session) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email já cadastrado. Faça login.");
          setActiveTab("login");
        } else {
          throw error;
        }
        return;
      }

      // Mostrar tela de confirmação ao invés de logar
      setRegisteredEmail(registerEmail);
      setShowEmailConfirmation(true);
      toast.success("Cadastro criado! Verifique seu e-mail.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-resend-confirmation", {
        body: { email: registeredEmail },
      });

      if (error) throw error;

      toast.success("E-mail reenviado com sucesso!");
    } catch (error: any) {
      toast.error("Não foi possível reenviar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Digite seu email para recuperar a senha.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-forgot-password", {
        body: { email: forgotPasswordEmail },
      });

      if (error) throw error;

      toast.success("E-mail enviado! Verifique sua caixa de entrada.");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="text-6xl">🎉</div>
            <CardTitle className="text-2xl font-bold">Cadastro criado!</CardTitle>
            <CardDescription className="text-base">
              Enviamos um e-mail para <strong>{registeredEmail}</strong>
              <br /><br />
              Clique no link do e-mail para ativar sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResendConfirmation}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reenviar e-mail de confirmação
            </Button>
            <Button
              onClick={() => {
                setShowEmailConfirmation(false);
                setActiveTab("login");
              }}
              variant="ghost"
              className="w-full"
            >
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Esqueci minha senha</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber as instruções de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleForgotPassword} className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar e-mail de recuperação
            </Button>
            <Button
              onClick={() => setShowForgotPassword(false)}
              variant="ghost"
              className="w-full"
            >
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-scale-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">VitrinePro</CardTitle>
          <CardDescription>
            Sua vitrine digital profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register" className="transition-all">Cadastrar</TabsTrigger>
              <TabsTrigger value="login" className="transition-all">Entrar</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="animate-fade-in">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      placeholder="Seu nome"
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      placeholder="seu@email.com"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      placeholder="••••••••"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="pl-9"
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
                <Button type="submit" className="w-full hover-scale" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta grátis
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  7 dias de teste grátis • Sem cartão de crédito
                </p>
              </form>
            </TabsContent>

            <TabsContent value="login" className="animate-fade-in">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      placeholder="seu@email.com"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      placeholder="••••••••"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full hover-scale" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <div className="text-center mt-4">
                  <Button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

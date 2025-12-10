import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Check,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  ChevronRight,
  BarChart3,
  Palette,
  Globe,
  Smartphone,
  Moon,
  Sun
} from "lucide-react";

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return <span>{value.includes('k') ? `${(count / 1000).toFixed(count >= 1000 ? 0 : 1)}k` : count.toLocaleString()}{suffix}</span>;
};

// Floating orbs background
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  </div>
);

// Testimonial data
const testimonials = [
  { name: "Maria Santos", role: "Loja de Roupas", text: "Triplicamos nossas vendas em 2 meses!", avatar: "MS", rating: 5 },
  { name: "João Silva", role: "Restaurante", text: "O melhor investimento para meu negócio.", avatar: "JS", rating: 5 },
  { name: "Ana Costa", role: "Artesanato", text: "Simples, bonito e funciona perfeitamente!", avatar: "AC", rating: 5 },
];

// Feature cards data
const features = [
  { icon: Smartphone, title: "Mobile First", desc: "Vitrine 100% responsiva e otimizada para celular" },
  { icon: Zap, title: "Setup em 5 min", desc: "Configure sua loja completa em menos de 5 minutos" },
  { icon: MessageCircle, title: "WhatsApp Direto", desc: "Orçamentos formatados direto no seu WhatsApp" },
  { icon: BarChart3, title: "Analytics", desc: "Acompanhe visitas e conversões em tempo real" },
  { icon: Palette, title: "Personalizável", desc: "Cores, temas e layout do seu jeito" },
  { icon: Globe, title: "Domínio Próprio", desc: "Use seu domínio ou nosso subdomínio grátis" },
];

const Index = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden transition-colors duration-300">
      {/* Header Premium */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-sm opacity-75" />
              <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              VitrinePro
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium px-6 shadow-lg shadow-violet-500/25"
              >
                Entrar
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section Premium */}
      <section className="relative min-h-screen flex items-center pt-20">
        <FloatingOrbs />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={itemVariants}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-sm font-medium text-violet-600 dark:text-violet-400 mb-6">
                  <Sparkles className="h-4 w-4" />
                  Novo: IA para descrições de produtos
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                Transforme seu WhatsApp em uma{" "}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  máquina de vendas
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Crie seu catálogo digital profissional em minutos.
                Receba pedidos organizados direto no WhatsApp e acompanhe suas vendas em tempo real.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate("/auth")}
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-lg px-8 py-6 shadow-xl shadow-violet-500/30 group"
                  >
                    Começar grátis por 7 dias
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-semibold text-lg px-8 py-6 border-2 group"
                    onClick={() => navigate("/auth")}
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Ver demonstração
                  </Button>
                </motion.div>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-6"
              >
                {[
                  { value: "5000", label: "Lojas ativas", suffix: "+" },
                  { value: "1200000", label: "Orçamentos enviados", suffix: "" },
                  { value: "87", label: "Taxa de conversão", suffix: "%" },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-3xl blur-2xl transform -rotate-3" />

                {/* Main card - Glassmorphism */}
                <div className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-800/50 shadow-2xl p-8 transform hover:scale-[1.02] transition-transform duration-500">
                  {/* Mock storefront header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Minha Loja Virtual</div>
                      <div className="text-sm text-muted-foreground">@minhaloja</div>
                    </div>
                  </div>

                  {/* Mock products grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl aspect-square flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Mock WhatsApp button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="h-6 w-6 text-white" />
                    <span className="font-semibold text-white">Enviar orçamento via WhatsApp</span>
                  </motion.div>
                </div>

                {/* Floating notification */}
                <motion.div
                  initial={{ opacity: 0, y: 20, x: 20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -right-4 top-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Novo orçamento!</div>
                      <div className="text-xs text-muted-foreground">Agora mesmo</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating stats */}
                <motion.div
                  initial={{ opacity: 0, y: -20, x: -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="absolute -left-4 bottom-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">+32% vendas</div>
                      <div className="text-xs text-muted-foreground">Este mês</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof - Logos Carousel */}
      <section className="py-12 border-y border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">
            Mais de <span className="font-semibold text-foreground">5.000 lojas</span> já confiam no VitrinePro
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {["Loja A", "Loja B", "Loja C", "Loja D", "Loja E"].map((logo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-xl font-bold text-muted-foreground"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 mb-4">
              Problemas que resolvemos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Chega de perder vendas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Identificamos os 3 maiores problemas de quem vende pelo WhatsApp
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageCircle,
                title: "Mensagens perdidas",
                desc: "Pedidos se perdem no meio das conversas. Você esquece de responder e perde a venda.",
                color: "from-red-500 to-orange-500"
              },
              {
                icon: ShoppingBag,
                title: "Catálogo desatualizado",
                desc: "Enviar fotos e preços um por um é trabalhoso. Seus clientes não veem tudo que você oferece.",
                color: "from-amber-500 to-yellow-500"
              },
              {
                icon: Users,
                title: "Falta de profissionalismo",
                desc: "Sem uma vitrine organizada, os clientes não levam seu negócio a sério.",
                color: "from-purple-500 to-pink-500"
              },
            ].map((problem, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${problem.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <problem.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
                    <p className="text-muted-foreground">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-secondary/50 to-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm font-medium text-violet-600 dark:text-violet-400 mb-4">
              <Sparkles className="h-4 w-4" />
              Recursos poderosos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais pensadas para pequenos e médios negócios
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-violet-500/20 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-sm font-medium text-green-600 dark:text-green-400 mb-4">
              <Star className="h-4 w-4 fill-current" />
              Avaliações 5 estrelas
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-lg mb-6 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm font-medium text-violet-600 dark:text-violet-400 mb-4">
              Planos flexíveis
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis. Upgrade quando quiser.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Grátis</span>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">R$ 0</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Para testar a plataforma</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {["Até 10 produtos", "1 banner", "Catálogo básico", "Marca VitrinePro"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    Começar grátis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full relative border-2 border-violet-500 hover:shadow-2xl transition-all duration-300 shadow-xl shadow-violet-500/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MAIS POPULAR
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <span className="text-sm font-medium text-violet-600 uppercase tracking-wider">Pro</span>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">R$ 129</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Para quem quer crescer</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {[
                      "Produtos ilimitados",
                      "Banners ilimitados",
                      "Temas premium",
                      "Analytics avançado",
                      "Remoção da marca",
                      "Suporte prioritário"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-violet-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                    onClick={() => navigate("/auth")}
                  >
                    Testar 7 dias grátis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Essential Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Essencial</span>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">R$ 59</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Para começar a vender</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {["Até 50 produtos", "2 banners", "Catálogo completo", "WhatsApp integrado", "1 usuário"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    Testar 7 dias grátis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <FloatingOrbs />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Pronto para transformar suas vendas?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              Crie seu catálogo em menos de 5 minutos. Sem cartão de crédito para começar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-white text-violet-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 shadow-xl group"
                  onClick={() => navigate("/auth")}
                >
                  Começar agora - é grátis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
            <p className="text-sm text-white/60 mt-6">
              ✓ Sem cartão de crédito &nbsp; ✓ Setup em 5 minutos &nbsp; ✓ Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">VitrinePro</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>© 2025 VitrinePro. Todos os direitos reservados.</p>
              <p className="mt-1">Feito com 💜 para empreendedores brasileiros</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

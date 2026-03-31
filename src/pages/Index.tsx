import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Sun,
  ChevronDown,
  Package,
  QrCode,
  Scissors,
  Utensils,
  Camera,
  Shirt,
  Flower2,
  Wrench,
  Clock,
  FileText
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
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  </div>
);

// Testimonial data
const testimonials = [
  {
    name: "Maria Santos",
    role: "Loja de Roupas",
    text: "Triplicamos nossas vendas em 2 meses! Antes eu ficava enviando foto de produto um por um no WhatsApp. Agora só mando o link e os clientes fazem o pedido sozinhos.",
    avatar: "MS",
    rating: 5,
    highlight: "+200% vendas"
  },
  {
    name: "João Silva",
    role: "Restaurante",
    text: "O melhor investimento para meu negócio. Meu cardápio digital ficou lindo e os clientes adoram poder ver os pratos antes de pedir. O pedido chega organizado no WhatsApp!",
    avatar: "JS",
    rating: 5,
    highlight: "Cardápio digital"
  },
  {
    name: "Ana Costa",
    role: "Artesanato",
    text: "Simples, bonito e funciona perfeitamente! Consegui montar minha loja em menos de 30 minutos e no mesmo dia já recebi meu primeiro pedido pelo catálogo.",
    avatar: "AC",
    rating: 5,
    highlight: "30 min para montar"
  },
  {
    name: "Carlos Mendes",
    role: "Barbearia",
    text: "Meus clientes consultam o catálogo de serviços antes de vir. O atendimento ficou muito mais ágil e profissional. Recomendo para todo mundo!",
    avatar: "CM",
    rating: 5,
    highlight: "Atendimento ágil"
  },
  {
    name: "Fernanda Lima",
    role: "Padaria e Confeitaria",
    text: "Antes das festas recebo os pedidos pelo catálogo direto no WhatsApp com todos os detalhes organizados. Zerou o erro nos pedidos e aumentou minha produção.",
    avatar: "FL",
    rating: 5,
    highlight: "Zero erros de pedido"
  },
  {
    name: "Ricardo Souza",
    role: "Distribuidora",
    text: "Minha equipe de vendas agora envia o link do catálogo para os clientes e os pedidos chegam organizados. Economizamos horas por semana em digitação de pedidos.",
    avatar: "RS",
    rating: 5,
    highlight: "Equipe de vendas"
  },
];

// FAQ data
const faqs = [
  {
    question: "Preciso ter conhecimento técnico para criar minha loja?",
    answer: "Não! O VitrinePro foi pensado para que qualquer pessoa possa criar sua vitrine digital em minutos, sem precisar saber programar ou ter conhecimento técnico. Basta cadastrar seus produtos e sua loja está pronta."
  },
  {
    question: "Como funciona o período de teste gratuito?",
    answer: "Você tem 7 dias para testar todas as funcionalidades do plano Pro sem pagar nada e sem precisar cadastrar cartão de crédito. Após o período, você escolhe o plano que melhor se encaixa no seu negócio."
  },
  {
    question: "Como meus clientes fazem pedidos?",
    answer: "Seus clientes acessam sua vitrine pelo link personalizado, navegam pelo catálogo, adicionam produtos ao carrinho e finalizam o pedido. Você recebe um resumo completo diretamente no seu WhatsApp, com nome do cliente, produtos e valores."
  },
  {
    question: "Posso usar meu próprio domínio?",
    answer: "Sim! No plano Pro você pode conectar seu domínio próprio (ex: www.sualoja.com.br). Nos planos menores, você recebe um subdomínio gratuito no formato sualoja.agencia062.com."
  },
  {
    question: "É possível personalizar as cores e o visual da loja?",
    answer: "Sim! Você pode personalizar cores, banners, seções e muito mais pelo painel de Aparência. No plano Pro, você tem acesso a temas premium e ainda mais opções de personalização para deixar sua vitrine com a cara da sua marca."
  },
  {
    question: "Posso gerenciar o estoque pela plataforma?",
    answer: "Sim! O VitrinePro conta com um módulo de gestão de estoque integrado. Você controla as quantidades disponíveis de cada produto e pode receber alertas quando o estoque estiver baixo."
  },
  {
    question: "Funciona para qualquer tipo de negócio?",
    answer: "Sim! O VitrinePro é ideal para lojas de roupas, restaurantes, padarias, barbearias, artesanato, distribuidoras, pet shops, e qualquer negócio que queira vender de forma digital e profissional."
  },
  {
    question: "E se eu tiver dúvidas ou precisar de ajuda?",
    answer: "Nosso suporte está disponível pelo WhatsApp e e-mail para ajudar você a tirar o máximo da plataforma. Clientes Pro têm prioridade no atendimento."
  },
];

// Niches
const niches = [
  { icon: Shirt, label: "Moda e Roupas" },
  { icon: Utensils, label: "Restaurantes" },
  { icon: Scissors, label: "Barbearia e Salão" },
  { icon: Flower2, label: "Floricultura" },
  { icon: Camera, label: "Fotografia" },
  { icon: Package, label: "Distribuidoras" },
  { icon: Wrench, label: "Serviços Gerais" },
  { icon: ShoppingBag, label: "Varejo em Geral" },
];

// FAQ Accordion Item
const FAQItem = ({ faq, isOpen, onToggle }: { faq: { question: string; answer: string }; isOpen: boolean; onToggle: () => void }) => (
  <div className="border border-border/50 rounded-xl overflow-hidden">
    <button
      className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/50 transition-colors"
      onClick={onToggle}
    >
      <span className="font-semibold pr-4">{faq.question}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
      >
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6 text-muted-foreground">
            {faq.answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Feature cards data
const features = [
  { icon: Smartphone, title: "Mobile First", desc: "Vitrine 100% responsiva e otimizada para celular" },
  { icon: Zap, title: "Setup em 5 min", desc: "Configure sua loja completa em menos de 5 minutos" },
  { icon: MessageCircle, title: "WhatsApp Direto", desc: "Orçamentos formatados direto no seu WhatsApp" },
  { icon: BarChart3, title: "Analytics", desc: "Acompanhe visitas e conversões em tempo real" },
  { icon: Palette, title: "Personalizável", desc: "Cores, temas e layout do seu jeito" },
  { icon: Globe, title: "Domínio Próprio", desc: "Use seu domínio ou nosso subdomínio grátis" },
];


// Hero Showcase with real product screenshots
const heroScreenshots = [
  { src: "/screenshot-vitrine.jpeg", label: "Vitrine", badge: "Sua loja online" },
  { src: "/screenshot-gerencia.jpeg", label: "Gerenciar", badge: "Painel simples" },
  { src: "/screenshot-produto.jpeg", label: "Produtos", badge: "Mais vendido" },
  { src: "/screenshot-pedido.jpeg", label: "Pedidos", badge: "No WhatsApp" },
  { src: "/screenshot-menu.jpeg", label: "Cardápio", badge: "Menu digital" },
];

const HeroShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % heroScreenshots.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full flex justify-center">
      {/* Glow de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-3xl blur-3xl transform scale-105" />

      {/* Moldura do celular */}
      <div className="relative w-[280px] sm:w-[300px]">
        {/* Corpo do telefone */}
        <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800">
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
            <div className="w-12 h-1.5 rounded-full bg-gray-700" />
          </div>

          {/* Tela */}
          <div className="relative rounded-[2.4rem] overflow-hidden bg-white" style={{ aspectRatio: "9/19.5" }}>
            {/* Barra de status */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm px-4 pt-8 pb-1 flex justify-between items-center">
              <span className="text-[10px] font-semibold text-gray-800">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 border border-gray-600 rounded-sm relative">
                  <div className="absolute inset-0.5 right-0.5 bg-gray-600 rounded-sm w-2/3" />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.img
                key={activeTab}
                src={heroScreenshots[activeTab].src}
                alt={heroScreenshots[activeTab].label}
                className="w-full h-full object-cover object-top"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              />
            </AnimatePresence>

            {/* Badge de contexto */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-4 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-semibold">{heroScreenshots[activeTab].badge}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Home bar */}
          <div className="flex justify-center mt-2">
            <div className="w-24 h-1 rounded-full bg-gray-600" />
          </div>
        </div>

        {/* Botões laterais */}
        <div className="absolute -right-1.5 top-20 w-1 h-14 bg-gray-700 rounded-r-lg" />
        <div className="absolute -left-1.5 top-16 w-1 h-8 bg-gray-700 rounded-l-lg" />
        <div className="absolute -left-1.5 top-28 w-1 h-8 bg-gray-700 rounded-l-lg" />

        {/* Dots de navegação */}
        <div className="flex justify-center gap-1.5 mt-4">
          {heroScreenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeTab ? "w-5 h-2 bg-orange-500" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating card: Novo pedido */}
      <motion.div
        initial={{ opacity: 0, y: 20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute -right-2 top-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 border border-border/40 min-w-[150px]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-semibold">Novo pedido! 🎉</div>
            <div className="text-xs text-muted-foreground">Agora mesmo</div>
          </div>
        </div>
      </motion.div>

      {/* Floating card: +32% vendas */}
      <motion.div
        initial={{ opacity: 0, y: -20, x: -20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -left-2 bottom-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 border border-border/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <div className="text-xs font-semibold">+32% vendas</div>
            <div className="text-xs text-muted-foreground">Este mês</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-sm opacity-75" />
              <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-2 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
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
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-6 shadow-lg shadow-orange-500/25"
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
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-6">
                  <Sparkles className="h-4 w-4" />
                  Novo: IA para descrições de produtos
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6"
              >
                Transforme seu WhatsApp em uma{" "}
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
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
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold text-lg px-8 py-6 shadow-xl shadow-green-500/30 group"
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
                    onClick={() => window.open("https://www.agencia062.com/loja/matheus", "_blank")}
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
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Visual - Product Screenshots */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <HeroShowcase /></motion.div>
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

      {/* Social Proof - Niches */}
      <section className="py-16 border-y border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-10">
            Mais de <span className="font-semibold text-foreground">5.000 lojas</span> de todos os segmentos já usam o VitrinePro
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {niches.map((niche, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.05 }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-background hover:shadow-md transition-all duration-300 cursor-default group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center group-hover:from-orange-500/20 group-hover:to-amber-500/20 transition-colors">
                  <niche.icon className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">{niche.label}</span>
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
              Veja por que você precisa criar seu Catálogo Digital
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Problemas que você enfrenta <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">todos os dias</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sem um catálogo digital, seu negócio perde vendas e credibilidade
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "Retrabalho",
                desc: "Sem um catálogo digital, você responde as mesmas perguntas repetidamente, envia fotos um por um e explica preços do zero. Isso toma tempo e atrapalha tarefas importantes.",
                color: "from-red-500 to-orange-500"
              },
              {
                icon: ShoppingBag,
                title: "Vendas Perdidas",
                desc: "Se o cliente precisa esperar muito para receber informações, ele desiste e procura outra loja. Sem um catálogo digital, você perde vendas sem nem perceber.",
                color: "from-amber-500 to-yellow-500"
              },
              {
                icon: Users,
                title: "Imagem Amadora",
                desc: "Mandar fotos soltas no WhatsApp passa impressão de improviso. Um catálogo digital valoriza seus produtos e transmite credibilidade.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: MessageCircle,
                title: "Atendimento Lento",
                desc: "Clientes querem rapidez. Se você demora para responder, o cliente já foi para outra loja. Com o catálogo digital, ele tem tudo sozinho.",
                color: "from-blue-500 to-cyan-500"
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
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <problem.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
              <Zap className="h-4 w-4" />
              Simples e rápido
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Pronto em <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">menos de 5 minutos</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sem conhecimento técnico, sem complicação. Siga os 3 passos e sua vitrine digital estará no ar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-orange-500/50 to-amber-500/50 z-0" />

            {[
              {
                step: "01",
                icon: ShoppingBag,
                title: "Cadastre seus produtos",
                desc: "Adicione fotos, descrições, preços e categorias dos seus produtos em poucos cliques. Nossa interface é intuitiva e fácil.",
                color: "from-orange-500 to-amber-500"
              },
              {
                step: "02",
                icon: Palette,
                title: "Personalize sua vitrine",
                desc: "Escolha cores, adicione seu logo e banners. Deixe sua loja com a identidade visual da sua marca em minutos.",
                color: "from-amber-500 to-yellow-500"
              },
              {
                step: "03",
                icon: MessageCircle,
                title: "Receba pedidos no WhatsApp",
                desc: "Compartilhe o link da sua vitrine. Seus clientes fazem pedidos e você recebe tudo organizado diretamente no WhatsApp.",
                color: "from-green-500 to-emerald-500"
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-lg opacity-40`} />
                  <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border-2 border-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA below steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-8 py-4 mb-8">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">Tempo médio para criar sua vitrine: <strong>4 minutos e 32 segundos</strong></span>
            </div>
            <div className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold text-lg px-8 py-6 shadow-xl shadow-green-500/30 group"
                >
                  Criar minha vitrine agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Showcase - Lojas Parceiras */}
      <section className="py-24 bg-gradient-to-b from-secondary/20 to-secondary/50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-sm font-medium text-green-600 dark:text-green-400 mb-4">
              <Star className="h-4 w-4" />
              Lojas Parceiras
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Veja o resultado na <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">prática</span>
            </h2>
          </motion.div>

          {/* Container with Store Info and Carousel */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            
            {/* Store Information Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border border-border">
                {/* Simulated Logo */}
                <span className="font-bold text-2xl text-green-600">L1</span>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold mb-2">Loja 1 Auto Peças</h3>
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full w-max mx-auto lg:mx-0 mb-4">
                  <Check className="w-4 h-4" />
                  Loja Verificada do VitrinePro
                </div>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Um excelente exemplo de catálogo digital no setor automotivo. O lojista exibe fotos dos produtos com valores, permite criar orçamentos facilmente através do carrinho inteligente, e recebe os pedidos padronizados diretamente no WhatsApp.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-green-500/20 group">
                    Acessar Vitrine
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Carousel Mockup */}
            <div className="w-full lg:w-2/3 relative">
              <div className="flex gap-6 overflow-x-auto pb-12 pt-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[1, 2, 3].map((num) => (
                  <motion.div
                    key={num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: num * 0.15, duration: 0.6 }}
                    className="flex-shrink-0 w-[85%] sm:w-[50%] md:w-[45%] lg:w-[40%] snap-center mx-auto relative z-10"
                  >
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-900/10 border-[8px] border-gray-900 bg-gray-900 hover:-translate-y-2 hover:border-gray-800 transition-all duration-500 hover:shadow-green-500/20 group">
                      {/* iPhone Speaker/Camera Details */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 flex items-center justify-center gap-2.5 rounded-b-3xl z-30">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-800/80 shadow-inner" />
                        <div className="w-14 h-1.5 rounded-full bg-gray-800/80 shadow-inner" />
                      </div>
                      
                      {/* Screen Interface with Automatic Scroll */}
                      <div className="relative rounded-[1.8rem] overflow-hidden bg-white aspect-[9/19.5]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                        <motion.img 
                          src={`/showcase-autopecas-${num}.png`} 
                          alt={`Amostra Loja Parceira Auto Peças ${num}`}
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                          animate={{ 
                            objectPosition: ["50% 0%", "50% 100%", "50% 0%"] 
                          }}
                          transition={{ 
                            duration: 16 + (num * 2), // Different durations so they scroll out of sync
                            ease: "linear", 
                            repeat: Infinity,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Seu negócio precisa para vender mais */}
      <section className="py-24 bg-gradient-to-b from-secondary/50 to-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
              <Sparkles className="h-4 w-4" />
              Seu negócio precisa para vender mais
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tudo que você precisa para <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">vender mais</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais pensadas para pequenos e médios negócios
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: "Vitrine Digital Moderna", desc: "Exiba seus produtos de forma organizada e profissional. Tenha uma vitrine digital que valoriza sua marca." },
              { icon: Globe, title: "Venda 24h por Dia", desc: "Seus produtos disponíveis para seus clientes a qualquer momento, todos os dias da semana." },
              { icon: Zap, title: "Atendimento Rápido", desc: "Responda menos perguntas repetitivas e ganhe tempo no WhatsApp com um catálogo digital sempre acessível." },
              { icon: Users, title: "Alcance Novos Clientes", desc: "Expanda suas vendas utilizando a internet e conquiste mais clientes sem esforço." },
              { icon: BarChart3, title: "Organização e Praticidade", desc: "Gerencie seus produtos com facilidade e tenha um controle mais eficiente do seu estoque." },
              { icon: Shield, title: "Gestão Simplificada", desc: "Visualize seu estoque de maneira simples e rápida, evitando surpresas na reposição." },
              { icon: MessageCircle, title: "Pedidos Direto no WhatsApp", desc: "Seu cliente escolhe os produtos no site e você recebe os pedidos diretamente no WhatsApp." },
              { icon: TrendingUp, title: "Parcerias e Credibilidade", desc: "Tenha um site profissional para fechar parcerias e fortalecer sua marca." },
              { icon: Sparkles, title: "Sem Limites, Sem Taxas", desc: "Cadastre quantos produtos quiser, sem restrições e sem cobranças extras.", isNew: true },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/20 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <benefit.icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-bold">{benefit.title}</h3>
                          {benefit.isNew && (
                            <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                              Novidade
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                      </div>
                    </div>
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
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
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/20 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-orange-600" />
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
              Mais de 500 avaliações 5 estrelas
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Quem usa, <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">aprova</span>
            </h2>
            <p className="text-lg text-muted-foreground">Resultados reais de lojistas que transformaram seus negócios</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-orange-500/10 to-transparent w-24 h-24 rounded-bl-3xl" />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 border border-orange-500/20 px-2 py-1 rounded-full">
                        {testimonial.highlight}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-6 text-muted-foreground italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
              Planos flexiveis
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
                    <p className="text-sm text-muted-foreground mt-2">Comece agora, sem pagar nada</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {["Até 10 produtos", "1 banner", "Catálogo básico", "WhatsApp integrado", "Marca VitrinePro"].map((feature, i) => (
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
              <Card className="h-full relative border-2 border-orange-500 hover:shadow-2xl transition-all duration-300 shadow-xl shadow-orange-500/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MAIS POPULAR
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <span className="text-sm font-medium text-orange-600 uppercase tracking-wider">Pro</span>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">R$ 59,90</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Tudo que você precisa para crescer</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {[
                      "Produtos ilimitados",
                      "Banners ilimitados",
                      "Temas premium",
                      "Analytics avançado",
                      "Remoção da marca VitrinePro",
                      "Domínio personalizado",
                      "Suporte prioritário",
                      "Múltiplos usuários"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/25"
                    onClick={() => navigate("/auth")}
                  >
                    Testar 7 dias gratis
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
                      <span className="text-4xl font-bold">R$ 29,90</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Perfeito para começar seu negócio online</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    {["Até 50 produtos", "3 banners personalizáveis", "Catálogo completo", "WhatsApp integrado", "1 usuário", "Suporte por email"].map((feature, i) => (
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

      {/* FAQ Section */}
      <FAQSection navigate={navigate} />

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />

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
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold text-lg px-8 py-6 shadow-xl shadow-green-500/30 group"
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
      <footer className="pt-16 pb-8 border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-sm opacity-50" />
                  <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">VitrinePro</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A plataforma de vitrine digital para empreendedores brasileiros venderem mais pelo WhatsApp.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Produto</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Funcionalidades", href: "#" },
                  { label: "Planos e Preços", href: "#" },
                  { label: "Ver demonstração", href: "/auth" },
                  { label: "Criar minha loja", href: "/auth" },
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors hover:text-orange-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Empresa</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Sobre nós", href: "/sobre" },
                  { label: "Blog", href: "#" },
                  { label: "Contato", href: "/contato" },
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors hover:text-orange-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Termos de Uso", href: "/termos" },
                  { label: "Política de Privacidade", href: "/privacidade" },
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors hover:text-orange-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 VitrinePro. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Feito com 🧡 para empreendedores brasileiros
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// FAQ Section Component
const FAQSection = ({ navigate }: { navigate: (path: string) => void }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
            <FileText className="h-4 w-4" />
            Dúvidas frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">frequentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Respondemos as principais dúvidas sobre o VitrinePro
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <FAQItem
                faq={faq}
                isOpen={openIdx === idx}
                onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/5"
            onClick={() => navigate("/auth")}
          >
            <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
            Falar com o suporte
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Index;

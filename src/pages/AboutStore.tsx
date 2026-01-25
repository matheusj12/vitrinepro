
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant, StoreSettings } from "@/types/database";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { StorefrontBanner } from "@/components/storefront/StorefrontBanner";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { MapPin, Clock, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DAYS_MAP: Record<string, string> = {
    mon: 'Segunda-feira',
    tue: 'Terça-feira',
    wed: 'Quarta-feira',
    thu: 'Quinta-feira',
    fri: 'Sexta-feira',
    sat: 'Sábado',
    sun: 'Domingo',
};

const ORDERED_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const AboutStore = () => {
    const { slug } = useParams<{ slug: string }>();
    const [isLoading, setIsLoading] = useState(true);

    const { data: tenant } = useQuery({
        queryKey: ["tenant-public", slug],
        queryFn: async () => {
            if (!slug) return null;
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .eq("slug", slug)
                .eq("active", true)
                .single();

            if (error) throw error;
            return data as Tenant;
        },
        enabled: !!slug,
    });

    const { data: storeSettings } = useQuery({
        queryKey: ["store-settings-public", tenant?.id],
        queryFn: async () => {
            if (!tenant?.id) return null;
            const { data, error } = await supabase
                .from("store_settings")
                .select("*")
                .eq("tenant_id", tenant.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            return data as StoreSettings;
        },
        enabled: !!tenant?.id,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["categories-public", tenant?.id],
        queryFn: async () => {
            if (!tenant?.id) return [];
            const { data } = await supabase
                .from("categories")
                .select("*")
                .eq("tenant_id", tenant.id)
                .eq("active", true)
                .order("name");
            return data || [];
        },
        enabled: !!tenant?.id,
    });

    const about = storeSettings?.about || {};
    const contact = storeSettings?.contact || {};
    const branding = storeSettings?.branding || {};

    // Fallback image
    const logoUrl = branding.logo_url;
    const floatingIconUrl = storeSettings?.floating_button_icon_url;

    if (!tenant && !isLoading) {
        return <div className="flex h-screen items-center justify-center">Loja não encontrada</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <PublicHeader
                storeName={tenant?.company_name || ""}
                logoUrl={logoUrl}
                whatsappNumber={tenant?.whatsapp_number || ""}
                categories={categories}
                slug={slug!}

                instagramUrl={contact.instagram_url}
                facebookUrl={contact.facebook_url}
                tiktokUrl={contact.tiktok_url}
                youtubeUrl={contact.youtube_url}
                whatsappBusinessUrl={contact.whatsapp_number ? `https://wa.me/${contact.whatsapp_number}` : undefined}
                pinterestUrl={contact.pinterest_url}
                twitterUrl={contact.twitter_url}
                linkedinUrl={contact.linkedin_url}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header da Página */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground">
                            Sobre a {tenant?.company_name}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Conheça um pouco mais sobre nossa história e onde nos encontrar.
                        </p>
                    </div>

                    {/* História */}
                    {about.history && (
                        <div className="prose prose-lg dark:prose-invert mx-auto bg-card p-8 rounded-3xl border shadow-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-2 rounded-lg">📖</span>
                                Nossa História
                            </h3>
                            <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                {about.history}
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Localização */}
                        <div className="flex flex-col h-full bg-card p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-2 rounded-lg"><MapPin className="h-5 w-5" /></span>
                                Onde estamos
                            </h3>

                            <div className="space-y-6 flex-1">
                                {about.location?.address ? (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium">{about.location.address}</p>
                                            <p className="text-muted-foreground">
                                                {about.location.city} - {about.location.state}
                                            </p>
                                            <p className="text-muted-foreground">CEP: {about.location.zip}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Endereço não informado.</p>
                                )}

                                {/* Redes Sociais no Card */}
                                <div className="pt-6 border-t mt-auto">
                                    <h4 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">Siga-nos nas redes</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {contact.instagram_url && <SocialBadge name="Instagram" url={contact.instagram_url} />}
                                        {contact.facebook_url && <SocialBadge name="Facebook" url={contact.facebook_url} />}
                                        {contact.whatsapp_number && <SocialBadge name="WhatsApp" url={`https://wa.me/${contact.whatsapp_number}`} />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Horários */}
                        <div className="flex flex-col h-full bg-card p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-2 rounded-lg"><Clock className="h-5 w-5" /></span>
                                Horário de Funcionamento
                            </h3>

                            <div className="space-y-3">
                                {about.opening_hours?.schedule ? (
                                    ORDERED_DAYS.map((dayKey) => {
                                        const day = about.opening_hours?.schedule[dayKey];
                                        return (
                                            <div key={dayKey} className="flex items-center justify-between text-sm py-2 border-b last:border-0 border-border/50">
                                                <span className="font-medium text-muted-foreground">{DAYS_MAP[dayKey]}</span>
                                                {day?.active ? (
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span>{day.open}</span>
                                                        <span className="text-muted-foreground/50">-</span>
                                                        <span>{day.close}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-600/80 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded text-xs font-medium">Fechado</span>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground italic">Horários não configurados.</p>
                                )}
                            </div>

                            {about.opening_hours?.enabled && (
                                <div className="mt-6 pt-4 border-t">
                                    <div className="bg-secondary/30 p-3 rounded-lg flex gap-3 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                        <span>Nosso atendimento online aceita pedidos apenas nestes horários.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center pt-8">
                        <Link to={`/loja/${slug}`}>
                            <Button size="lg" className="rounded-full px-8 h-12 text-base font-bold shadow-lg hover:scale-105 transition-transform">
                                Ver Produtos
                            </Button>
                        </Link>
                    </div>

                </div>
            </main>

            <footer className="border-t border-border mt-12 bg-secondary/5">
                <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                    <p className="text-sm">
                        {tenant?.company_name} © {new Date().getFullYear()} - Todos os direitos reservados.
                    </p>
                    <div className="mt-2 text-xs">
                        Powered by <a href="https://www.gotisolucoes.com.br" target="_blank" rel="noreferrer" className="hover:text-primary font-medium">Goti Soluções</a>
                    </div>
                </div>
            </footer>

            {(storeSettings as any)?.contact?.whatsapp_number &&
                (storeSettings as any)?.storefront?.show_whatsapp_button !== false && (
                    <FloatingWhatsAppButton
                        whatsappNumber={(storeSettings as any).contact.whatsapp_number}
                        tenantName={tenant?.company_name}
                        iconUrl={floatingIconUrl}
                    />
                )}
        </div>
    );
};

const SocialBadge = ({ name, url }: { name: string; url: string }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium flex items-center gap-1.5">
        {name} <span className="opacity-50">↗</span>
    </a>
)

export default AboutStore;

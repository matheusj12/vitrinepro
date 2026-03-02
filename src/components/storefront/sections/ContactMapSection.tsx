import React from "react";
import { ContactMapConfig } from "@/types/sections";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactMapSectionProps {
    config: ContactMapConfig;
}

export const ContactMapSection = ({ config }: ContactMapSectionProps) => {
    const { title, phones = [], whatsapp, email, address, showMap = true } = config;
    let { mapsEmbedUrl } = config;

    // If user pasted full <iframe> tag, extract just the src URL
    if (mapsEmbedUrl && mapsEmbedUrl.includes("<iframe")) {
        const match = mapsEmbedUrl.match(/src=["']([^"']+)["']/);
        if (match) mapsEmbedUrl = match[1];
    }

    const hasContactInfo = phones.length > 0 || whatsapp || email || address;
    if (!hasContactInfo && !mapsEmbedUrl) return null;

    return (
        <section className="py-14 sm:py-20 px-4 sm:px-6 bg-muted/20 overflow-hidden">
            <div className="container mx-auto">
                {title && (
                    <h3 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10">{title}</h3>
                )}
                <div className={`grid gap-8 ${showMap && mapsEmbedUrl ? "md:grid-cols-2" : "max-w-xl mx-auto"}`}>
                    {/* Contact Info */}
                    {hasContactInfo && (
                        <div className="space-y-6">
                            {phones.map((phone, i) => (
                                <a
                                    key={i}
                                    href={`tel:${phone.replace(/\D/g, "")}`}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all group min-w-0 overflow-hidden"
                                >
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Phone className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground truncate">{phone}</span>
                                </a>
                            ))}

                            {whatsapp && (
                                <a
                                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 hover:shadow-md transition-all group min-w-0 overflow-hidden"
                                >
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <MessageCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-foreground block truncate">{whatsapp}</span>
                                        <span className="text-xs text-muted-foreground">WhatsApp</span>
                                    </div>
                                </a>
                            )}

                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all group min-w-0 overflow-hidden"
                                >
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground break-all min-w-0 text-sm sm:text-base">{email}</span>
                                </a>
                            )}

                            {address && (
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground whitespace-pre-line">{address}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Map */}
                    {showMap && mapsEmbedUrl && (
                        <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-border/50 aspect-square sm:aspect-[4/3]">
                            <iframe
                                src={mapsEmbedUrl}
                                title="Localização"
                                className="w-full h-full"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

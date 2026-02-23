import React, { useState } from "react";
import { NewsletterConfig } from "@/types/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

interface NewsletterSectionProps {
    config: NewsletterConfig;
}

export const NewsletterSection = ({ config }: NewsletterSectionProps) => {
    const {
        title = "Cadastre-se em nossa newsletter",
        subtitle = "Receba promoções e novidades em primeira mão",
        buttonText = "Cadastrar",
        bgColor,
    } = config;

    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        // For now, just show success (backend integration can be added later)
        setSubmitted(true);
        toast.success("E-mail cadastrado com sucesso!");
        setTimeout(() => setSubmitted(false), 5000);
        setEmail("");
    };

    return (
        <section
            className="py-10 sm:py-14 px-6"
            style={{ backgroundColor: bgColor || "hsl(var(--primary))" }}
        >
            <div className="container mx-auto max-w-2xl text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Mail className="h-5 w-5 text-primary-foreground/80" />
                    <h3 className="text-lg sm:text-xl font-heading font-bold text-primary-foreground">
                        {title}
                    </h3>
                </div>
                {subtitle && (
                    <p className="text-sm text-primary-foreground/70 mb-6">{subtitle}</p>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <Input
                        type="email"
                        placeholder="Deixe seu e-mail aqui"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 h-12 bg-white/90 border-0 text-foreground placeholder:text-muted-foreground rounded-xl"
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        size="lg"
                        className="h-12 rounded-xl bg-white text-foreground hover:bg-white/90 font-bold border-0 px-8"
                        disabled={submitted}
                    >
                        {submitted ? (
                            <>
                                <Check className="h-4 w-4 mr-2" /> Cadastrado!
                            </>
                        ) : (
                            buttonText
                        )}
                    </Button>
                </form>
            </div>
        </section>
    );
};

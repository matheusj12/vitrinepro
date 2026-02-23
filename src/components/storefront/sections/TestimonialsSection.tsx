import React from "react";
import { TestimonialsConfig } from "@/types/sections";
import { Star } from "lucide-react";

interface TestimonialsSectionProps {
    config: TestimonialsConfig;
}

export const TestimonialsSection = ({ config }: TestimonialsSectionProps) => {
    const { title, items = [], layout = "cards" } = config;

    if (items.length === 0) return null;

    return (
        <section className="py-20 px-6 bg-slate-50/50">
            <div className="container mx-auto max-w-7xl">
                {title && (
                    <h3 className="text-3xl sm:text-4xl font-heading font-medium text-center mb-16 text-slate-800 tracking-tight">
                        {title}
                    </h3>
                )}

                <div
                    className={
                        layout === "carousel"
                            ? "flex gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 px-4"
                            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8"
                    }
                >
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={`relative bg-white border border-slate-200/60 rounded-xl p-8 pt-12 shadow-sm hover:shadow-md transition-all duration-300 text-center flex flex-col items-center ${layout === "carousel" ? "min-w-[320px] sm:min-w-[380px] snap-center flex-shrink-0" : ""
                                }`}
                        >
                            {/* Avatar (Floating Top Center) */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                <div className="relative h-20 w-20">
                                    {item.avatarUrl ? (
                                        <img
                                            src={item.avatarUrl}
                                            alt={item.name}
                                            className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-slate-400 text-2xl">
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Google Brand Badge Overlay */}
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Author Name */}
                            <h4 className="font-bold text-slate-800 text-lg mb-0.5">{item.name}</h4>

                            {/* Role/Time */}
                            <p className="text-slate-400 text-xs mb-4 uppercase tracking-wider font-medium">
                                {item.role || "Cliente Satisfeito"}
                            </p>

                            {/* Stars */}
                            <div className="flex justify-center gap-0.5 mb-5">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Star
                                        key={j}
                                        className={`h-5 w-5 ${j < (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                            }`}
                                    />
                                ))}
                                {(item as any).source === "google" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-500 ml-1">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>

                            {/* Text */}
                            <p className="text-slate-600 leading-relaxed text-sm italic line-clamp-4 flex-grow">
                                "{item.text}"
                            </p>
                        </div>
                    ))}
                </div>

                {/* Trust Footer */}
                <div className="mt-16 flex justify-center flex-col items-center gap-2">
                    <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm">
                        <span>Verified by VitrinePro</span>
                        <div className="h-4 w-px bg-white/20" />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-widest font-bold">
                        Avaliações 100% Reais de Clientes Google
                    </p>
                </div>
            </div>
        </section>
    );
};


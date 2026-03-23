import { useEffect, useState } from "react";

interface FloatingWhatsAppButtonProps {
  whatsappNumber: string;
  defaultMessage?: string;
  tenantName?: string;
  iconUrl?: string;
}

export const FloatingWhatsAppButton = ({
  whatsappNumber,
  defaultMessage,
  tenantName,
  iconUrl,
}: FloatingWhatsAppButtonProps) => {
  const [showRing, setShowRing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowRing(true);
      setTimeout(() => setShowRing(false), 2200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  const message =
    defaultMessage ||
    `Olá${tenantName ? `, ${tenantName}` : ""}! Vim pela loja online e gostaria de mais informações.`;
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    /* Visível apenas em desktop — no mobile o WhatsApp fica no BottomNav */
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="hidden md:flex fixed bottom-6 right-6 z-[999] items-center gap-3 group"
    >
      {/* Label expandível */}
      <span className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 bg-white text-[#128C7E] font-semibold text-sm px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
        Falar no WhatsApp
      </span>

      {/* Botão circular */}
      <div className="relative flex items-center justify-center w-14 h-14">
        {/* Ring pulsante */}
        {showRing && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40" />
        )}
        <button
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:shadow-[0_4px_28px_rgba(37,211,102,0.7)] hover:scale-110 transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
        >
          {iconUrl ? (
            <img src={iconUrl} alt="WhatsApp" className="w-8 h-8 object-contain" />
          ) : (
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.476 2.027 7.782L0 32l8.456-2.007A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.28 13.28 0 01-6.787-1.856l-.487-.29-5.02 1.192 1.213-4.89-.317-.503A13.27 13.27 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.907c-.397-.199-2.35-1.16-2.715-1.29-.364-.133-.629-.2-.893.2-.265.397-1.026 1.29-1.258 1.556-.232.265-.463.298-.86.1-.397-.2-1.677-.618-3.194-1.972-1.18-1.053-1.977-2.352-2.209-2.75-.232-.397-.025-.611.175-.809.178-.178.397-.464.596-.695.2-.232.265-.397.397-.662.133-.265.066-.497-.033-.695-.1-.2-.893-2.152-1.224-2.947-.322-.773-.65-.668-.893-.68-.231-.012-.497-.014-.762-.014s-.695.1-1.059.497c-.364.397-1.39 1.358-1.39 3.31s1.423 3.84 1.622 4.106c.2.265 2.8 4.276 6.785 5.995.948.41 1.688.654 2.265.837.952.303 1.818.26 2.502.158.763-.114 2.35-.96 2.682-1.888.332-.928.332-1.723.232-1.888-.099-.166-.364-.265-.761-.464z" />
            </svg>
          )}
        </button>
      </div>
    </a>
  );
};

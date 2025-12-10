import { useEffect, useState } from "react";

interface FloatingWhatsAppButtonProps {
  whatsappNumber: string;
  defaultMessage?: string;
  tenantName?: string;
  iconUrl?: string;
}

const DEFAULT_WHATSAPP_ICON = "/images/whatsapp/whta.png"; // Ícone padrão do WhatsApp

export const FloatingWhatsAppButton = ({
  whatsappNumber,
  defaultMessage,
  tenantName,
  iconUrl,
}: FloatingWhatsAppButtonProps) => {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 2000);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  const message =
    defaultMessage ||
    `Olá${tenantName ? ` ${tenantName}` : ""}, gostaria de falar com você!`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  const handleClick = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-5 right-5 
        w-16 h-16
        rounded-full 
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-300
        z-[999]
        hover:scale-110
        ${showPulse ? "animate-pulse" : ""}
      `}
      style={{ background: "hsl(var(--primary))" }}
      aria-label="WhatsApp"
    >
      <img
        src={iconUrl ?? DEFAULT_WHATSAPP_ICON} // Usa o ícone padrão se nenhum for fornecido
        style={{ width: 64, height: 64 }}
        alt="WhatsApp"
      />
    </button>
  );
};
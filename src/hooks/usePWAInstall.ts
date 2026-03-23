// Re-exporta o hook do contexto global para compatibilidade com código existente.
// O evento beforeinstallprompt é capturado uma única vez no PWAInstallProvider (App.tsx),
// garantindo que o botão apareça em TODAS as páginas, inclusive após navegação.
export { usePWAInstallContext as usePWAInstall } from "@/contexts/PWAInstallContext";

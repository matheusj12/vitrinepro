import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  install: async () => {},
});

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallEvent(null);
    }
  };

  return (
    <PWAInstallContext.Provider
      value={{ canInstall: !!installEvent && !isInstalled, isInstalled, install }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstallContext = () => useContext(PWAInstallContext);

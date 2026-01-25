
import { StoreSettings } from "@/types/database";

export const useStoreStatus = (settings?: StoreSettings | null) => {
    if (!settings?.about?.opening_hours?.enabled) {
        return { isOpen: true, message: null };
    }

    const schedule = settings.about.opening_hours.schedule;
    if (!schedule) {
        return { isOpen: true, message: null };
    }

    const now = new Date();
    const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const todaySchedule = schedule[currentDay];

    // Se não estiver ativo hoje, está fechado
    if (!todaySchedule?.active) {
        return {
            isOpen: false,
            message: settings.about.opening_hours.closing_message || "Estamos fechados hoje."
        };
    }

    // Verifica horários
    const openTime = todaySchedule.open;
    const closeTime = todaySchedule.close;

    if (currentTime < openTime || currentTime > closeTime) {
        return {
            isOpen: false,
            message: settings.about.opening_hours.closing_message || `Estamos fechados. Atendimento das ${openTime} às ${closeTime}.`
        };
    }

    return { isOpen: true, message: null };
};


// Helper robusto para checar se uma cor é escura
// Suporta: Hex, RGB, HSL com prefixo, e HSL puro (formato Tailwind: "H S L" ou "H S% L%")
export function isDarkColor(color: string): boolean {
    if (!color) return false;

    // Se for variável CSS, não conseguimos saber, assume false (tema claro)
    if (color.startsWith("var(")) return false;

    const trimmed = color.trim();

    // === HEX ===
    if (trimmed.startsWith("#")) {
        const hex = trimmed.substring(1);
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq < 128;
    }

    // === RGB/RGBA ===
    if (trimmed.startsWith("rgb")) {
        const values = trimmed.match(/[\d.]+/g);
        if (values && values.length >= 3) {
            const r = parseFloat(values[0]);
            const g = parseFloat(values[1]);
            const b = parseFloat(values[2]);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return yiq < 128;
        }
    }

    // === HSL com prefixo hsl() ===
    if (trimmed.startsWith("hsl")) {
        const values = trimmed.match(/[\d.]+/g);
        if (values && values.length >= 3) {
            const l = parseFloat(values[2]);
            // Luminosidade: 0 = preto, 100 = branco
            // Considera escuro se L < 50%
            return l < 50;
        }
    }

    // === HSL puro (formato Tailwind/Shadcn: "210 40% 98%" ou "222.2 84 4.9") ===
    // Tenta parsear como "H S L" ou "H S% L%"
    const hslParts = trimmed.split(/\s+/);
    if (hslParts.length >= 3) {
        // O terceiro valor é a luminosidade
        const lValue = hslParts[2].replace('%', '');
        const l = parseFloat(lValue);
        if (!isNaN(l)) {
            // Luminosidade: 0 = preto, 100 = branco
            // Considera escuro se L < 50%
            return l < 50;
        }
    }

    // Fallback: assume tema claro
    return false;
}

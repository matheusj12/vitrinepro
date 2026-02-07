
// Helper simples para checar se uma cor é escura (usado para setar text-white ou text-black automaticamente)
export function isDarkColor(color: string): boolean {
    if (!color) return false;

    // Se for variável CSS, não conseguimos saber facilmente, assume false
    if (color.startsWith("var(")) return false;

    let r = 0, g = 0, b = 0;

    // Hex
    if (color.startsWith("#")) {
        const hex = color.substring(1);
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
    }
    // RGB
    else if (color.startsWith("rgb")) {
        const values = color.match(/\d+/g);
        if (values && values.length >= 3) {
            r = parseInt(values[0]);
            g = parseInt(values[1]);
            b = parseInt(values[2]);
        }
    }
    // HSL
    else if (color.startsWith("hsl")) {
        const values = color.match(/\d+/g);
        if (values && values.length >= 3) {
            const l = parseInt(values[2]);
            return l < 60; // Se luminosidade menor que 60%, considera escuro
        }
    }

    // Fórmula de luminância relativa (YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
}

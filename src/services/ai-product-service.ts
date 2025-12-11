import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o SDK do Google AI (Gemini)
const getGeminiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY não configurada");
    }
    return new GoogleGenerativeAI(apiKey);
};

export interface AIProductSuggestion {
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    suggestedPrice?: number;
    suggestedCategory?: string;
}

/**
 * Gera uma descrição de produto usando IA
 */
export async function generateProductDescription(
    productName: string,
    category?: string,
    existingDescription?: string
): Promise<AIProductSuggestion> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é um especialista em copywriting para e-commerce brasileiro.
Gere uma descrição de produto atrativa e persuasiva para vender online.

Produto: ${productName}
${category ? `Categoria: ${category}` : ""}
${existingDescription ? `Descrição atual: ${existingDescription}` : ""}

Regras:
- Escreva em português brasileiro
- Seja persuasivo mas natural
- Destaque benefícios, não apenas características
- Use linguagem emocional e sensorial
- Máximo 150 palavras
- NÃO use emojis
- NÃO inclua preço
- Termine com um call-to-action sutil

Responda APENAS com a descrição, sem títulos ou formatação.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const description = response.text().trim();

        return { description };
    } catch (error: any) {
        console.error("Erro ao gerar descrição com IA:", error);
        throw new Error("Não foi possível gerar a descrição. Tente novamente.");
    }
}

/**
 * Gera sugestão completa de produto (descrição + SEO + preço)
 */
export async function generateFullProductSuggestion(
    productName: string,
    category?: string,
    imageBase64?: string
): Promise<AIProductSuggestion> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é um especialista em e-commerce brasileiro.
Analise o produto abaixo e gere sugestões completas.

Produto: ${productName}
${category ? `Categoria: ${category}` : ""}

Responda em JSON válido com a seguinte estrutura:
{
  "description": "Descrição persuasiva do produto (máximo 150 palavras, sem emojis)",
  "seoTitle": "Título SEO otimizado (máximo 60 caracteres)",
  "seoDescription": "Meta description para SEO (máximo 160 caracteres)",
  "suggestedCategory": "Categoria sugerida se não informada"
}

IMPORTANTE: Responda APENAS o JSON, sem markdown, sem \`\`\`, sem texto adicional.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Limpa possíveis caracteres extras
        const cleanJson = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const suggestion = JSON.parse(cleanJson);
        return suggestion;
    } catch (error: any) {
        console.error("Erro ao gerar sugestão com IA:", error);
        throw new Error("Não foi possível gerar as sugestões. Tente novamente.");
    }
}

/**
 * Analisa uma imagem de produto e sugere nome e categoria
 */
export async function analyzeProductImage(
    imageBase64: string
): Promise<{ name: string; category: string; description: string }> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Remove o prefixo data:image/...;base64, se existir
    const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

    const prompt = `Analise esta imagem de produto e responda em JSON:
{
  "name": "Nome sugerido para o produto",
  "category": "Categoria sugerida (ex: Roupas, Eletrônicos, Casa, etc)",
  "description": "Descrição curta do produto (50 palavras)"
}

IMPORTANTE: Responda APENAS o JSON, sem markdown.`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text().trim();
        const cleanJson = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        return JSON.parse(cleanJson);
    } catch (error: any) {
        console.error("Erro ao analisar imagem:", error);
        throw new Error("Não foi possível analisar a imagem. Tente novamente.");
    }
}

/**
 * Gera resposta automática para mensagem de WhatsApp
 */
export async function generateWhatsAppResponse(
    message: string,
    storeName: string,
    products: Array<{ name: string; price: number; description?: string }>
): Promise<{ response: string; intent: string }> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const productList = products
        .slice(0, 10)
        .map((p) => `- ${p.name}: R$ ${p.price?.toFixed(2) || "Sob consulta"}`)
        .join("\n");

    const prompt = `Você é um assistente de vendas da loja "${storeName}".
Responda a mensagem do cliente de forma amigável e profissional.

Mensagem do cliente: "${message}"

Produtos disponíveis:
${productList}

Regras:
1. Seja cordial e prestativo
2. Use linguagem informal mas profissional
3. Se for pergunta sobre produto, ofereça informações
4. Se for intenção de compra, peça confirmação dos itens
5. Máximo 100 palavras na resposta

Responda em JSON:
{
  "response": "Sua resposta ao cliente",
  "intent": "greeting|question|purchase|support|other"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const cleanJson = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        return JSON.parse(cleanJson);
    } catch (error: any) {
        console.error("Erro ao gerar resposta WhatsApp:", error);
        throw new Error("Não foi possível gerar resposta automática.");
    }
}

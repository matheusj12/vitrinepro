import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function resolveUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        return response.url;
    } catch (e) {
        return url;
    }
}

function extractId(input: string): string {
    if (input.startsWith("ChIJ") && input.length > 20) return input;
    const ftidMatch = input.match(/ftid=([^&]+)/);
    if (ftidMatch) return ftidMatch[1];
    const sMatch = input.match(/!1s([^!&]+)/);
    if (sMatch) return sMatch[1];
    const lrdMatch = input.match(/0x[a-f0-9]+:0x[a-f0-9]+/i);
    if (lrdMatch) return lrdMatch[0];
    return input;
}

async function fetchFromHasData(url: string, apiKey: string) {
    const hasDataUrl = `https://api.hasdata.com/google/maps/reviews?url=${encodeURIComponent(url)}&limit=10`;
    const response = await fetch(hasDataUrl, {
        headers: { "x-api-key": apiKey }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`HasData Error: ${err.message || response.statusText}`);
    }

    const data = await response.json();
    return (data.reviews || []).map((r: any) => ({
        name: r.user?.name || "Cliente",
        text: r.snippet || "",
        rating: r.rating || 5,
        avatarUrl: r.user?.thumbnail || "",
        role: r.date || "Google Maps",
        source: "google",
    }));
}

async function fetchFromOutscraper(url: string, apiKey: string) {
    const outscraperUrl = `https://api.app.outscraper.com/maps/reviews-v3?query=${encodeURIComponent(url)}&reviewsLimit=10&async=false`;
    const response = await fetch(outscraperUrl, {
        headers: { "X-API-KEY": apiKey }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Outscraper Error: ${err.message || response.statusText}`);
    }

    const result = await response.json();
    const data = result.data?.[0];

    if (!data?.reviews_data) return [];

    return data.reviews_data.map((r: any) => ({
        name: r.author_title || "Cliente",
        text: r.review_text || "",
        rating: r.review_rating || 5,
        avatarUrl: r.author_image || "",
        role: r.review_datetime_utc || "Google Maps",
        source: "google",
    }));
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

    try {
        const body = await req.json().catch(() => ({}));
        const { input } = body;
        if (!input) throw new Error("Link ou ID ausente no corpo da requisição.");

        const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
        const hasDataApiKey = Deno.env.get("HASDATA_API_KEY");
        const outscraperApiKey = Deno.env.get("OUTSCRAPER_API_KEY");

        let targetUrl = input;
        if (input.includes("maps.app.goo.gl") || input.includes("goo.gl/maps")) {
            targetUrl = await resolveUrl(input);
        }

        // STRATEGY: Try Google first
        if (googleApiKey) {
            try {
                let id = extractId(targetUrl);
                if (!id.startsWith("ChIJ")) {
                    const searchRes = await fetch(`https://places.googleapis.com/v1/places:searchText?key=${googleApiKey}`, {
                        method: 'POST',
                        headers: { "Content-Type": "application/json", "X-Goog-FieldMask": "places.id" },
                        body: JSON.stringify({ textQuery: targetUrl })
                    });
                    const searchData = await searchRes.json();
                    if (searchData.places?.[0]?.id) id = searchData.places[0].id;
                }

                const detailsUrl = `https://places.googleapis.com/v1/places/${id}?fields=displayName,rating,reviews&languageCode=pt-BR&key=${googleApiKey}`;
                const response = await fetch(detailsUrl, { headers: { "X-Goog-FieldMask": "displayName,rating,reviews" } });
                const data = await response.json();

                if (response.ok && !data.error) {
                    return new Response(JSON.stringify({
                        placeName: data.displayName?.text,
                        reviews: (data.reviews || []).map((review: any) => ({
                            name: review.authorAttribution?.displayName || "Cliente",
                            text: review.text?.text || "",
                            rating: review.rating || 5,
                            avatarUrl: review.authorAttribution?.photoUri || "",
                            role: review.relativePublishTimeDescription || "Google Maps",
                            source: "google",
                        })),
                    }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
                }
            } catch (e) {
                console.error("Google API failed, trying fallback...", e);
            }
        }

        // FALLBACK 1: Outscraper (Highly recommended by user)
        if (outscraperApiKey && targetUrl.includes("google.com/maps")) {
            try {
                const reviews = await fetchFromOutscraper(targetUrl, outscraperApiKey);
                return new Response(JSON.stringify({ placeName: "Google Maps", reviews }), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            } catch (e) {
                console.error("Outscraper fallback failed", e);
            }
        }

        // FALLBACK 2: HasData
        if (hasDataApiKey && targetUrl.includes("google.com/maps")) {
            const reviews = await fetchFromHasData(targetUrl, hasDataApiKey);
            return new Response(JSON.stringify({ placeName: "Google Maps", reviews }), {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }

        throw new Error("Não foi possível importar automaticamente. Use a 'Fórmula Grátis' colando o texto diretamente!");

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
    }
});

declare const process: { env: Record<string, string | undefined> };

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type Action = "enrich-itinerary" | "sort-itinerary" | "packing-list" | "nearby-suggestions";

const ITEM_TYPES = ["SIGHTSEEING", "FOOD", "RAMEN", "COFFEE", "ALCOHOL", "TRANSPORT", "SHOPPING", "HOTEL", "MISC"];
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const stringArray = { type: "array", items: { type: "string" } };
const tagSchema = object({
  label: { type: "string" },
  color: { type: "string", enum: ["red", "gold", "gray"] },
});

const schemas: Record<Action, Record<string, unknown>> = {
  "enrich-itinerary": object({
    dayId: { type: "integer" },
    date: { type: "string" },
    weatherSummary: { type: "string" },
    paceAnalysis: { type: "string" },
    logicWarning: { type: "string" },
    forecast: {
      type: "array",
      items: object({ date: { type: "string" }, icon: { type: "string" }, temp: { type: "string" } }),
    },
    items: {
      type: "array",
      items: object({
        id: { type: "string" },
        time: { type: "string" },
        title: { type: "string" },
        location: { type: "string" },
        type: { type: "string", enum: ITEM_TYPES },
        description: { type: "string" },
        tips: stringArray,
        tags: { type: "array", items: tagSchema },
        navQuery: { type: "string" },
      }),
    },
  }),
  "sort-itinerary": object({
    items: { type: "array", items: object({ id: { type: "string" }, time: { type: "string" }, transitInfo: { type: "string" } }) },
  }),
  "packing-list": object({ items: stringArray }),
  "nearby-suggestions": object({
    suggestions: {
      type: "array",
      items: object({ name: { type: "string" }, reason: { type: "string" } }),
    },
  }),
};

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function promptFor(action: Action, body: Record<string, any>): string {
  const language = body.lang === "TC" ? "Traditional Chinese (Hong Kong)" : "English";
  switch (action) {
    case "enrich-itinerary":
      return `You are a practical travel planning assistant. Respond in ${language}. Improve the supplied day's itinerary while keeping every item ID and preserving the user's chosen places. Check for backtracking, suggest useful concise tips, and assess the pace. Do not invent real-time weather: set weatherSummary to "Not available" and forecast to an empty array unless verified weather data is included in the input. Return all required fields. Input: ${JSON.stringify(body.plan)}`;
    case "sort-itinerary":
      return `Reorder these itinerary stops for a sensible, low-backtracking route. Keep every ID exactly once, use 24-hour times, and state concise transit information to the next stop. Do not invent precise travel durations. Respond in ${language}. Input: ${JSON.stringify(body.items)}`;
    case "packing-list":
      return `Create a concise, practical packing checklist for a trip to ${String(body.destination || "the destination").slice(0, 120)}. Respond in ${language}. Return 8 to 16 useful items.`;
    case "nearby-suggestions":
      return `Suggest three plausible places or activities near ${String(body.location || "the location").slice(0, 160)} suitable after ${String(body.time || "the given time").slice(0, 32)}. Respond in ${language}. Be concise and do not claim current opening hours.`;
  }
}

async function generate(action: Action, body: Record<string, any>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      input: promptFor(action, body),
      text: { format: { type: "json_schema", name: action.replace(/-/g, "_"), strict: true, schema: schemas[action] } },
      max_output_tokens: action === "enrich-itinerary" ? 2600 : 1000,
      store: false,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OpenAI API error", response.status, result?.error?.message || "Unknown error");
    throw new Error("GPT request failed. Check the server API key and model settings.");
  }

  const text = result.output_text;
  if (typeof text !== "string" || !text) throw new Error("GPT returned an empty response.");
  return JSON.parse(text);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body." }); }
  }
  if (!isRecord(body) || JSON.stringify(body).length > 80_000) {
    return res.status(400).json({ error: "Invalid or oversized request." });
  }

  if (typeof body.action !== "string" || !Object.prototype.hasOwnProperty.call(schemas, body.action)) {
    return res.status(400).json({ error: "Unsupported AI action." });
  }
  const action = body.action as Action;

  try {
    return res.status(200).json(await generate(action, body));
  } catch (error) {
    console.error("AI route error", error);
    const message = error instanceof Error ? error.message : "AI request failed.";
    return res.status(message.includes("not configured") ? 503 : 502).json({ error: message });
  }
}


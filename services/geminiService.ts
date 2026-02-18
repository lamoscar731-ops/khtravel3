
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

/**
 * Robust JSON parsing that strips potential markdown code block artifacts.
 */
const safeParseJson = (text: string) => {
  try {
    const sanitized = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("JSON Parse Error. Original text:", text);
    throw new Error("Failed to parse AI response as JSON.");
  }
};

export const enrichItineraryWithGemini = async (currentPlan: DayPlan, lang: string = "EN"): Promise<DayPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-pro-preview";

  const schema = {
    type: Type.OBJECT,
    properties: {
      dayId: { type: Type.INTEGER },
      date: { type: Type.STRING },
      weatherSummary: { type: Type.STRING, description: "Today's Temperature and Humidity." },
      paceAnalysis: { type: Type.STRING, description: "Analysis of the day's intensity." },
      logicWarning: { type: Type.STRING, description: "Alert if the route has backtracking or is inefficient." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "Date (e.g., 12/25)" },
             icon: { type: Type.STRING, description: "Weather emoji." },
             temp: { type: Type.STRING, description: "Temp range." }
          }
        },
        description: "7-day forecast starting from the current itinerary date."
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "MATCH THE ORIGINAL ID." },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL, ItemType.MISC] },
            description: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tips. Tip #1 MUST be Business Hours for shops/food." },
            tags: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        color: { type: Type.STRING, enum: ["red", "gold", "gray"] }
                    }
                }
            },
            navQuery: { type: Type.STRING }
          }
        }
      }
    },
    required: ["dayId", "date", "weatherSummary", "items", "forecast"]
  };

  const prompt = `
    Role: Professional Travel Expert [GEMINI].
    Task: Analyze and enhance Day ${currentPlan.dayId} (${currentPlan.date}) itinerary.
    Language: ${lang === "TC" ? "Traditional Chinese (Hong Kong)" : "English"}.
    
    1. Check for backtracking geography.
    2. Provide 7-day forecast.
    3. Ensure shop/restaurant tips start with Opening Hours.
    
    Data: ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = safeParseJson(response.text || "");
    if (currentPlan.backupItems) result.backupItems = currentPlan.backupItems;
    return result as DayPlan;
  } catch (error) {
    console.error("Gemini Failure:", error);
    return currentPlan;
  }
};

export const smartSortItinerary = async (items: ItineraryItem[], lang: string = "EN"): Promise<{items: ItineraryItem[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const schema = {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            time: { type: Type.STRING },
            transitInfo: { type: Type.STRING, description: "Transit to next stop." }
          }
        }
      }
    },
    required: ["items"]
  };

  const prompt = `Optimize travel sequence for minimal travel time. Language: ${lang}. Data: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    });

    const updates = safeParseJson(response.text || "").items;
    const sorted = updates.map((u: any) => {
      const original = items.find(i => i.id === u.id);
      return original ? { ...original, time: u.time, transitInfo: u.transitInfo } : null;
    }).filter(Boolean);

    return { items: sorted.length === items.length ? sorted as ItineraryItem[] : items };
  } catch (error) {
    return { items };
  }
};

export const generatePackingList = async (destination: string, lang: string = "EN"): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Packing checklist for ${destination} in ${lang}. JSON array of strings.`,
      config: { responseMimeType: "application/json" },
    });
    return safeParseJson(response.text || "[]");
  } catch {
    return ["Passport", "Charger"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = "EN"): Promise<AfterPartyRec[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `3 spots near ${location} after ${time} in ${lang}. JSON array of objects {name, reason}.`,
        config: { responseMimeType: "application/json" },
      });
      return safeParseJson(response.text || "[]");
    } catch {
      return [];
    }
  };

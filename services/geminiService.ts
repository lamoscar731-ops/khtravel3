
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

/**
 * Optimized AI client initialization.
 * Always retrieves the most current API key from the environment.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not configured. Please ensure it is set in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const enrichItineraryWithGemini = async (currentPlan: DayPlan, lang: string = 'EN'): Promise<DayPlan> => {
  const ai = getAiClient();
  const modelId = "gemini-3-pro-preview";

  const schema = {
    type: Type.OBJECT,
    properties: {
      dayId: { type: Type.INTEGER },
      date: { type: Type.STRING },
      weatherSummary: { type: Type.STRING, description: "Current day Temperature and Humidity." },
      paceAnalysis: { type: Type.STRING, description: "Analysis of the day's travel intensity." },
      logicWarning: { type: Type.STRING, description: "Alert for backtracking or excessive distances between locations." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "Date (MM/DD)" },
             icon: { type: Type.STRING, description: "Weather emoji." },
             temp: { type: Type.STRING, description: "Temp range." }
          }
        },
        description: "A 7-day weather forecast starting from the current itinerary date."
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "MUST MATCH THE ORIGINAL ITEM ID." },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL, ItemType.MISC] },
            description: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tips. For dining/shopping, Tip #1 must be Opening Hours." },
            tags: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        color: { type: Type.STRING, enum: ['red', 'gold', 'gray'] }
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
    TASK: Act as a travel expert [GEMINI]. Enhance the itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    
    GUIDELINES:
    1. GEOGRAPHY: Check the route for backtracking (挠路). Warn in 'logicWarning' if found.
    2. WEATHER: Provide a consecutive 7-day forecast.
    3. BUSINESS HOURS: For FOOD/RAMEN/SHOPPING items, ensure the first tip is opening hours.
    4. DATA INTEGRITY: Use the exact IDs provided.
    
    ITINERARY DATA:
    ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    
    const result = JSON.parse(text.trim());
    if (currentPlan.backupItems) result.backupItems = currentPlan.backupItems;
    return result as DayPlan;
  } catch (error) {
    console.error("Gemini Enrichment Error:", error);
    return currentPlan;
  }
};

export const smartSortItinerary = async (items: ItineraryItem[], lang: string = 'EN'): Promise<{items: ItineraryItem[]}> => {
  const ai = getAiClient();
  
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
            transitInfo: { type: Type.STRING, description: "Transit to next stop, e.g. '🚶 10m'." }
          }
        }
      }
    },
    required: ["items"]
  };

  const prompt = `Reorder these locations for the most efficient travel route. 
  Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
  Locations: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    });

    const text = response.text;
    if (!text) return { items };
    
    const updates = JSON.parse(text.trim()).items;
    const sorted = updates.map((u: any) => {
      const original = items.find(i => i.id === u.id);
      return original ? { ...original, time: u.time, transitInfo: u.transitInfo } : null;
    }).filter(Boolean);

    return { items: sorted.length === items.length ? sorted as ItineraryItem[] : items };
  } catch (error) {
    console.error("Smart Sort Failure:", error);
    return { items };
  }
};

export const processVoiceCommand = async (base64Audio: string, lang: string = 'EN'): Promise<{type: 'TOGO' | 'NOTE', content: string}> => {
  const ai = getAiClient();
  const prompt = `Transcribe this travel voice note. Classify as 'TOGO' (a place to visit) or 'NOTE'. Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "audio/webm", data: base64Audio } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["TOGO", "NOTE"] },
            content: { type: Type.STRING }
          },
          required: ["type", "content"]
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Voice AI returned empty");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Voice Processing Failure:", error);
    throw error;
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `Generate a travel packing list for ${destination} in ${lang}. JSON array of strings only.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return ["Passport", "Charger", "Clothes"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const ai = getAiClient();
    const prompt = `Recommend 3 spots (bars, ramen, views) near ${location} after ${time} in ${lang}. Return JSON array of objects {name, reason}.`;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  };

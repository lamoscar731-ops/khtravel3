
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not configured in environment variables.");
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
      weatherSummary: { type: Type.STRING, description: "Today's Temperature and Humidity." },
      paceAnalysis: { type: Type.STRING, description: "Analysis of the day's intensity (Relaxed, Busy, etc.)." },
      logicWarning: { type: Type.STRING, description: "Check if the sequence of locations is geographically logical. Warn if there is significant backtracking (挠路) or if travel times are unrealistic." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "Short date (e.g., 11/15)" },
             icon: { type: Type.STRING, description: "Weather emoji representation." },
             temp: { type: Type.STRING, description: "e.g., 18-24°C" }
          }
        },
        description: "Generate a 7-day weather forecast table for the local area."
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL, ItemType.MISC] },
            description: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tips. For FOOD/RAMEN/SHOPPING, the first tip MUST be the business hours." },
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
            weather: { type: Type.STRING },
            navQuery: { type: Type.STRING }
          }
        }
      }
    },
    required: ["dayId", "date", "weatherSummary", "items", "forecast"]
  };

  const prompt = `
    You are a professional travel planner [GEMINI]. 
    Analyze the itinerary for Day ${currentPlan.dayId} (${currentPlan.date}) and provide enhancements.
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong style)' : 'English'}.
    
    CRITICAL TASKS:
    1. GEOGRAPHY CHECK: Evaluate if the locations are in a logical order. If the user is traveling back and forth (backtracking/挠路), explain why it is inefficient in 'logicWarning'.
    2. WEATHER: Provide a 7-day forecast for the destination starting from ${currentPlan.date}.
    3. TIPS: For every restaurant or shop, the FIRST tip MUST be the opening hours (e.g., "Open 11:00-22:00, Closed on Mondays").
    4. PERSISTENCE: Return the same item IDs provided in the input.
    
    CURRENT PLAN:
    ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text!);
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
            transitInfo: { type: Type.STRING, description: "Estimated time to next item, e.g. '🚶 10m'." }
          }
        }
      }
    },
    required: ["items"]
  };

  const prompt = `Optimize the following itinerary items for minimum travel distance. 
  Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
  Items: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    });

    const updates = JSON.parse(response.text!).items;
    const sorted = updates.map((u: any) => {
      const original = items.find(i => i.id === u.id);
      return original ? { ...original, time: u.time, transitInfo: u.transitInfo } : null;
    }).filter(Boolean);

    return { items: sorted.length === items.length ? sorted : items };
  } catch (error) {
    console.error("Smart Sort Error:", error);
    return { items };
  }
};

export const processVoiceCommand = async (base64Audio: string, lang: string = 'EN'): Promise<{type: 'TOGO' | 'NOTE', content: string}> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      contents: [
        { text: `Transcribe this travel voice note. Classify as 'TOGO' or 'NOTE'. Language: ${lang}.` },
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
    return JSON.parse(response.text!);
  } catch (error) {
    console.error("Voice Error:", error);
    throw error;
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a checklist for ${destination} in ${lang}. JSON array of strings only.`,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text!);
  } catch {
    return ["Passport", "Charger"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `3 spots near ${location} after ${time}. Language: ${lang}. Return JSON array of {name, reason}.`,
        config: { responseMimeType: "application/json" },
      });
      return JSON.parse(response.text!);
    } catch {
      return [];
    }
  };

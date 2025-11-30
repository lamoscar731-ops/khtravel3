import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec } from "../types";

const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const enrichItineraryWithGemini = async (currentPlan: DayPlan, lang: string = 'EN'): Promise<DayPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  const modelId = "gemini-2.5-flash";

  const schema = {
    type: Type.OBJECT,
    properties: {
      dayId: { type: Type.INTEGER },
      date: { type: Type.STRING },
      weatherSummary: { type: Type.STRING, description: "Concise weather forecast (Temp, Humidity only)." },
      paceAnalysis: { type: Type.STRING, description: "One word pace analysis (e.g. Relaxed, Packed)" },
      logicWarning: { type: Type.STRING, description: "Warning if locations are too far apart or timing is impossible, else null/empty." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING },
             icon: { type: Type.STRING, description: "Emoji icon" },
             temp: { type: Type.STRING }
          }
        }
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
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            weather: { type: Type.STRING, description: "Temp & Humidity only (e.g. 24°C, 60%)" },
            navQuery: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `
    Analyze this itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong Cantonese style)' : 'English'}.
    
    Rules:
    1. Update 'weatherSummary' (Temp/Humidity).
    2. Enhance descriptions.
    3. **IMPORTANT: Add "tips". For items of type FOOD, RAMEN, COFFEE, or ALCOHOL, the FIRST tip MUST be the Opening Hours and Closing Days (e.g., "Open: 11:00-22:00, Closed Tue").**
    4. DO NOT generate tags.
    5. Set 'paceAnalysis' and 'logicWarning'.
    6. Generate 'forecast' for 7 days.
    
    Current Items:
    ${JSON.stringify(currentPlan.items)}
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

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    const parsedResult = JSON.parse(resultText) as DayPlan;

    // Merge Logic to preserve original URLs and IDs
    const mergedItems = parsedResult.items.map((newItem, index) => {
        let originalItem = currentPlan.items.find(i => i.id === newItem.id);
        if (!originalItem && index < currentPlan.items.length) {
             originalItem = currentPlan.items[index];
        }
        if (!originalItem) return newItem;
        
        return {
            ...newItem,
            id: originalItem.id,
            time: originalItem.time,
            mapsUrl: originalItem.mapsUrl,
            tags: originalItem.tags
        };
    });

    return { ...parsedResult, items: mergedItems };

  } catch (error) {
    console.error("Gemini Enrichment Error:", error);
    return { ...currentPlan, weatherSummary: "Offline" };
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");
  const ai = getAiClient(apiKey);
  const prompt = `Packing checklist for ${destination}. Essentials only. ${lang === 'TC' ? 'Traditional Chinese' : 'English'}. Return JSON array of strings.`;
  const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '[]') as string[];
  } catch (error) { return ["Passport", "Wallet", "Phone"]; }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
    const ai = getAiClient(apiKey);
    const prompt = `
      I am at ${location} at ${time}. Suggest 3 late-night spots (Ramen, Bar, Donki).
      MUST BE OPEN LATE or 24 HOURS.
      ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
      Return JSON array of objects with 'name', 'type', 'reason'.
    `;
    const schema = {
      type: Type.ARRAY,
      items: { 
          type: Type.OBJECT,
          properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              reason: { type: Type.STRING }
          }
      }
    };
    try {
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      return JSON.parse(response.text || '[]') as AfterPartyRec[];
    } catch (error) { return []; }
};

export const generateLocalSOS = async (city: string, lang: string = 'EN'): Promise<any[]> => {
    return []; // Using static data now
};

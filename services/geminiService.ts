import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec } from "../types";

// Initialize the client.
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
    1. Update 'weatherSummary' with just Temperature and Humidity (e.g., "24°C, 65% Humidity"). Do not add descriptive text.
    2. Enhance descriptions briefly.
    3. Add "tips" (Max 3 concise items).
    4. CRITICAL: If item type is FOOD, RAMEN, COFFEE, or ALCOHOL, the FIRST tip MUST be the opening hours and closing days (e.g., "Open 11:00-22:00, Closed Mon").
    5. Tag items.
    6. Provide 'paceAnalysis' and 'logicWarning' if applicable.
    7. Provide a dummy 'forecast' for the next 3 days including today.
    
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
    
    return JSON.parse(resultText) as DayPlan;

  } catch (error) {
    console.error("Gemini Enrichment Error:", error);
    return {
        ...currentPlan,
        weatherSummary: "Offline"
    };
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  const modelId = "gemini-2.5-flash";

  const prompt = `Generate a concise packing checklist for a trip to ${destination}. 
  Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
  Return a JSON array of strings only. Focus on essentials and destination-specific items.`;
  
  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  };

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
    
    return JSON.parse(resultText) as string[];

  } catch (error) {
    console.error("Gemini Packing List Error:", error);
    return ["Passport", "Phone Charger", "Wallet", "Underwear", "Toiletry Bag"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
  
    const ai = getAiClient(apiKey);
    const modelId = "gemini-2.5-flash";
  
    const prompt = `I am at ${location} and it is ${time}. Suggest 3 places to go next (e.g. bars, late night food, scenic spots). 
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    Return JSON array of objects with 'name' and 'reason'.`;
  
    const schema = {
      type: Type.ARRAY,
      items: { 
          type: Type.OBJECT,
          properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING }
          }
      }
    };
  
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
      
      return JSON.parse(resultText) as AfterPartyRec[];
  
    } catch (error) {
      console.error("Gemini AfterParty Error:", error);
      return [];
    }
  };

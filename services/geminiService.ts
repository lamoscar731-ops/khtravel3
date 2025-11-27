import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType } from "../types";

// Initialize the client.
const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const enrichItineraryWithGemini = async (currentPlan: DayPlan): Promise<DayPlan> => {
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
      paceAnalysis: { type: Type.STRING, description: "One word analysis of the schedule pace (e.g. RELAXED, MODERATE, RUSHED)" },
      logicWarning: { type: Type.STRING, description: "Brief warning if route is illogical (e.g. 'Backtracking detected') or null if fine." },
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
    1. Update 'weatherSummary'.
    2. Analyze the 'paceAnalysis' based on number of items and time gaps.
    3. Check location logic for 'logicWarning' (e.g. zigzagging route).
    4. Enhance descriptions and add specific tips (Must Eat / Photo Spot).
    5. Tag items.
    
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

export const generatePackingList = async (destination: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  const modelId = "gemini-2.5-flash";

  const prompt = `Generate a concise packing checklist for a trip to ${destination}. Return a JSON array of strings only. Focus on essentials.`;
  
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
    return JSON.parse(response.text || '[]') as string[];
  } catch (error) {
    return ["Passport", "Wallet", "Phone"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string): Promise<string[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
  
    const ai = getAiClient(apiKey);
    const modelId = "gemini-2.5-flash";
  
    const prompt = `
      I am at ${location} at ${time}. Suggest 3 specific late-night spots nearby (Ramen, Izakaya, Bar, or Donki).
      Return a JSON array of strings. Each string should be "Name - Brief reason".
    `;
    
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
      return JSON.parse(response.text || '[]') as string[];
    } catch (error) {
      return ["Don Quijote (Always Open)", "Ichiran Ramen", "Convenience Store"];
    }
  };

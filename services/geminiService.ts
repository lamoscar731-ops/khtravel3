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
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL] },
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
    1. Update 'weatherSummary' with just Temperature and Humidity (e.g., "24°C, 65% Humidity"). Do not add descriptive text.
    2. Enhance descriptions briefly.
    3. Add "tips".
    4. Tag items.
    
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
  
    const schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    };
  
    const prompt = `
      List 6-8 essential packing items for a trip to ${destination}. 
      Consider the current season. 
      Keep items short (e.g., "Universal Adapter", "Raincoat").
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
      const result = JSON.parse(response.text || '{"items": []}');
      return result.items || [];
    } catch (e) {
      console.error(e);
      return ["Passport", "Chargers", "Cash", "Clothes"];
    }
  };

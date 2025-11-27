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
      forecast: { 
        type: Type.ARRAY,
        description: "7-day weather forecast starting from this day.",
        items: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING, description: "MM/DD format" },
                icon: { type: Type.STRING, description: "Emoji icon only (e.g. ☀️, ☁️, 🌧️)" },
                temp: { type: Type.STRING, description: "Temperature (e.g. 24°)" }
            }
        }
      },
      paceAnalysis: { type: Type.STRING, description: "One word analysis: RELAXED, MODERATE, or RUSHED" },
      logicWarning: { type: Type.STRING, description: "Warning if route is illogical (e.g. 'Backtracking'), else null." },
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
            // Removed tags from generation
            weather: { type: Type.STRING, description: "Temp & Humidity only" },
            navQuery: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `
    Analyze this itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    
    1. **Weather**: Generate a 7-day forecast starting from ${currentPlan.date}. Infer location from items. Return Date (MM/DD), Icon (Emoji), Temp.
    2. **Analysis**: Set 'paceAnalysis' and 'logicWarning'.
    3. **Items**: 
       - Enhance descriptions. 
       - Add specific "tips" (Must Eat / Photo Spot).
       - **DO NOT** generate tags. Keep existing tags if any, but do not add new ones.
    
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

  const prompt = `Generate a concise packing checklist for a trip to ${destination}. Return a JSON array of strings only. Focus on essentials and destination-specific items.`;
  
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
      I am at ${location} at ${time}. Suggest 3 specific late-night spots nearby (Ramen, Bar, Donki).
      Return a JSON array of strings. Each string: "Name - Brief reason".
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
      return ["Don Quijote", "Ichiran Ramen", "Konbini"];
    }
};

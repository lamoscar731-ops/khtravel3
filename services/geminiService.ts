
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec } from "../types";

// Initialize the client.
const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const enrichItineraryWithGemini = async (currentPlan: DayPlan, lang: string = 'EN'): Promise<DayPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  // Use gemini-3-flash-preview for general text tasks
  const modelId = "gemini-3-flash-preview";

  const schema = {
    type: Type.OBJECT,
    properties: {
      dayId: { type: Type.INTEGER },
      date: { type: Type.STRING },
      weatherSummary: { type: Type.STRING, description: "Concise current weather (Temp, Humidity only)." },
      paceAnalysis: { type: Type.STRING },
      logicWarning: { type: Type.STRING },
      forecast: {
        type: Type.ARRAY,
        description: "7-day weather forecast starting from current itinerary date.",
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "MM/DD format" },
             icon: { type: Type.STRING, description: "One weather emoji" },
             temp: { type: Type.STRING, description: "e.g. 22°C" }
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
            type: { type: Type.STRING, enum: Object.values(ItemType) },
            description: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "MAX 2 tips. EACH TIP MUST BE EXTREMELY SHORT (under 8 words). Concise points."
            },
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
    }
  };

  const prompt = `
    Analyze this itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    
    CRITICAL RULES:
    1. TIPS MUST BE EXTREMELY CONCISE. Maximum 2 per item. No long descriptions.
    2. Weather: Provide a 7-day forecast starting from ${currentPlan.date}.
    3. Ensure all titles and locations returned are ALL CAPS.
    4. Business Hours: If it's a shop/restaurant, mention hours as one tiny tip.
    
    Current Plan:
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
    return currentPlan;
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  // Use gemini-3-flash-preview for general text tasks
  const modelId = "gemini-3-flash-preview";

  const prompt = `Generate a concise packing checklist for ${destination}. MAX 10 items.
  Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
  Return JSON array of strings in ALL CAPS.`;
  
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

    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    return ["PASSPORT", "CHARGER", "WALLET"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
  
    const ai = getAiClient(apiKey);
    // Use gemini-3-flash-preview for general text tasks
    const modelId = "gemini-3-flash-preview";
  
    const prompt = `Suggest 3 places near ${location} to go after ${time}. 
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    Return JSON array of objects with 'name' and 'reason'. Ensure names are ALL CAPS.`;
  
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
      return JSON.parse(response.text || "[]") as AfterPartyRec[];
    } catch (error) {
      return [];
    }
  };

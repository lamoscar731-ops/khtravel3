import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, SOSContact } from "../types";

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
      weatherSummary: { type: Type.STRING }, // Legacy
      forecast: { 
        type: Type.ARRAY,
        description: "7-day weather forecast starting from this day.",
        items: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING, description: "MM/DD" },
                icon: { type: Type.STRING, description: "Emoji" },
                temp: { type: Type.STRING, description: "Temp e.g. 24°" }
            }
        }
      },
      paceAnalysis: { type: Type.STRING, description: "Analysis: RELAXED, MODERATE, or RUSHED" },
      logicWarning: { type: Type.STRING, description: "Logic warning e.g. 'Backtracking' or null" },
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
            weather: { type: Type.STRING, description: "Temp & Humidity only" },
            navQuery: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `
    Analyze itinerary Day ${currentPlan.dayId} (${currentPlan.date}).
    1. Generate 7-day forecast (Date, Icon, Temp).
    2. Analyze pace (RELAXED/MODERATE/RUSHED).
    3. Check logic (Backtracking?).
    4. Enhance descriptions & add tips (Must Eat/Photo Spot).
    5. DO NOT generate tags.
    
    Items: ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const resultText = response.text;
    if (!resultText) throw new Error("No response");
    return JSON.parse(resultText) as DayPlan;
  } catch (error) {
    console.error("Enrich Error", error);
    return { ...currentPlan, weatherSummary: "Offline" };
  }
};

export const generatePackingList = async (destination: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");
  const ai = getAiClient(apiKey);
  const prompt = `Packing checklist for ${destination}. JSON array of strings only. Essentials.`;
  const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '[]') as string[];
  } catch (error) { return ["Passport", "Wallet"]; }
};

export const generateAfterPartySuggestions = async (location: string, time: string): Promise<AfterPartyRec[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
    const ai = getAiClient(apiKey);
    const prompt = `
      I am at ${location} at ${time}. Suggest 3 specific late-night spots nearby (Ramen, Bar, Donki, Izakaya) that are OPEN LATE.
      Return JSON array of objects: { name, type, reason }.
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

export const generateLocalSOS = async (city: string): Promise<SOSContact[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
    const ai = getAiClient(apiKey);
    const prompt = `
      Provide 3 emergency contacts for a tourist in ${city}. 
      1. Police
      2. Ambulance/Fire
      3. General Help or Consulate (Generic).
      Return JSON array of objects: { name, number, note }.
    `;
    const schema = {
      type: Type.ARRAY,
      items: {
          type: Type.OBJECT,
          properties: {
              name: { type: Type.STRING },
              number: { type: Type.STRING },
              note: { type: Type.STRING }
          }
      }
    };
    try {
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      return JSON.parse(response.text || '[]') as SOSContact[];
    } catch (error) { return []; }
};

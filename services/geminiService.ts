import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, SOSContact, Language } from "../types";

const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const getLangInstruction = (lang: Language) => 
    lang === 'TC' ? "Reply in Traditional Chinese (Hong Kong usage)." : "Reply in English.";

export const enrichItineraryWithGemini = async (currentPlan: DayPlan, lang: Language): Promise<DayPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const ai = getAiClient(apiKey);
  const modelId = "gemini-2.5-flash";

  const schema = {
    type: Type.OBJECT,
    properties: {
      dayId: { type: Type.INTEGER },
      date: { type: Type.STRING },
      weatherSummary: { type: Type.STRING }, 
      forecast: { 
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING },
                icon: { type: Type.STRING },
                temp: { type: Type.STRING }
            }
        }
      },
      paceAnalysis: { type: Type.STRING },
      logicWarning: { type: Type.STRING },
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
            weather: { type: Type.STRING },
            navQuery: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `
    Analyze itinerary Day ${currentPlan.dayId} (${currentPlan.date}).
    ${getLangInstruction(lang)}
    1. Generate 7-day forecast (Date MM/DD, Icon Emoji, Temp).
    2. Analyze pace (One word: RELAXED/MODERATE/RUSHED).
    3. Check logic (Warning if backtracking, else null).
    4. Enhance descriptions.
    5. **IMPORTANT: Add "tips". For items of type FOOD, RAMEN, COFFEE, or ALCOHOL, the FIRST tip MUST be the Opening Hours and Closing Days.**
    6. DO NOT generate tags.
    
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
    
    const parsedResult = JSON.parse(resultText) as DayPlan;

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
    return { ...currentPlan, weatherSummary: "Offline" };
  }
};

export const generatePackingList = async (destination: string, lang: Language): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");
  const ai = getAiClient(apiKey);
  const prompt = `Packing checklist for ${destination}. Essentials only. ${getLangInstruction(lang)}. Return JSON array of strings.`;
  const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '[]') as string[];
  } catch (error) { return ["Passport", "Wallet"]; }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: Language): Promise<AfterPartyRec[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key");
    const ai = getAiClient(apiKey);
    const prompt = `
      I am at ${location} at ${time}. Suggest 3 late-night spots (Ramen, Bar, Donki).
      MUST BE OPEN LATE or 24 HOURS.
      ${getLangInstruction(lang)}
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

export const generateLocalSOS = async (city: string, lang: Language): Promise<SOSContact[]> => {
    return []; 
};


import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

// Initialize the client right before usage.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");
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
      weatherSummary: { type: Type.STRING, description: "Temperature and Humidity summary (e.g., 24°C, 65%)." },
      paceAnalysis: { type: Type.STRING, description: "Brief analysis of the day's pace (Relaxed/Busy/Impossible)." },
      logicWarning: { type: Type.STRING, description: "Warning if backtracking or unrealistic travel times occur." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING },
             icon: { type: Type.STRING, description: "Emoji representation (☀, ☁, 🌧, etc.)" },
             temp: { type: Type.STRING, description: "e.g. 18-22°C" }
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
            weather: { type: Type.STRING },
            navQuery: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `
    Analyze and enhance the travel itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong style)' : 'English'}.
    
    TASKS:
    1. Provide a dummy 7-day weather forecast (starting from plan date).
    2. Analyze travel logic: check if locations are sequentially efficient. Provide 'logicWarning' if backtracking is detected.
    3. Update 'weatherSummary' for the current day.
    4. For each item:
       - Refine description.
       - Generate 2-3 'tips'. If it's a shop or restaurant, include opening hours.
       - Add appropriate tags.
    
    Current Data:
    ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text!);
    // Ensure we keep the original backupItems if they existed
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
            transitInfo: { type: Type.STRING, description: "Est. travel time to NEXT item, e.g. '🚶 10m' or '🚄 20m'." }
          }
        }
      }
    }
  };

  const prompt = `
    OPTIMIZE ROUTE: Reorder these travel locations to minimize travel time and distance.
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    
    Items: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}
    
    Assign logical times starting from 09:00. Calculate transitInfo for the gap between each item and the next.
  `;

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
      const original = items.find(i => i.id === u.id)!;
      return { ...original, time: u.time, transitInfo: u.transitInfo };
    });

    return { items: sorted };
  } catch (error) {
    console.error("Smart Sort Error:", error);
    return { items };
  }
};

export const processVoiceCommand = async (base64Audio: string, lang: string = 'EN'): Promise<{type: 'TOGO' | 'NOTE', content: string}> => {
  const ai = getAiClient();
  
  const prompt = "Transcribe this travel voice note. Determine if it is a 'TOGO' (a place to visit) or a general 'NOTE'. Respond in " + (lang === 'TC' ? 'Traditional Chinese' : 'English');
  
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
          }
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
  const prompt = `Generate a concise packing checklist for a trip to ${destination}. 
  Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
  Return a JSON array of strings only.`;
  
  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    return ["Passport", "Charger"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const ai = getAiClient();
    const prompt = `Suggest 3 places near ${location} to go after ${time}. 
    Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
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
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      return JSON.parse(response.text);
    } catch (error) {
      return [];
    }
  };

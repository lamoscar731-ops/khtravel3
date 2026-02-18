
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

// Initialize the client right before usage to ensure the freshest API key.
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
      weatherSummary: { type: Type.STRING, description: "Current day Temperature and Humidity (e.g., 22°C, 60%)." },
      paceAnalysis: { type: Type.STRING, description: "Analysis of the day's intensity." },
      logicWarning: { type: Type.STRING, description: "CRITICAL: Warn if backtracking or excessive distance is detected between locations." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "Short date (e.g. 11/15)" },
             icon: { type: Type.STRING, description: "Weather emoji (☀, ☁, 🌧, etc.)" },
             temp: { type: Type.STRING, description: "Range, e.g. 15-20°C" }
          }
        },
        description: "Generate a 7-day weather forecast starting from the plan's date."
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "MUST MATCH THE ORIGINAL ID PROVIDED." },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL, ItemType.MISC] },
            description: { type: Type.STRING, description: "Concise description." },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tips. For FOOD/RAMEN, FIRST tip MUST be opening hours." },
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
    TASK: Deep analysis and enhancement of this travel itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong style)' : 'English'}.
    
    INSTRUCTIONS:
    1. WEATHER: Generate a 7-day forecast starting from ${currentPlan.date}.
    2. GEOGRAPHY: Analyze the sequence of locations. If they are far apart or cause backtracking, put a warning in 'logicWarning'.
    3. TIPS: For every FOOD, RAMEN, COFFEE or ALCOHOL item, the very FIRST tip MUST be the business hours (e.g., "Open 11:00-21:00, Closed Tue").
    4. ID PERSISTENCE: You MUST return the EXACT 'id' for each item provided in the input.
    
    CURRENT ITINERARY:
    ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text!);
    // Preserve internal logic fields if AI missed them
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
            id: { type: Type.STRING, description: "Must match provided input id." },
            time: { type: Type.STRING },
            transitInfo: { type: Type.STRING, description: "Estimated transport to next item, e.g. '🚶 10m' or '🚄 25m'." }
          }
        }
      }
    },
    required: ["items"]
  };

  const prompt = `
    ROLE: Logistics Expert.
    TASK: Reorder the following locations into the most geographically efficient route.
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong)' : 'English'}.
    
    DATA: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}
    
    1. Optimize order to minimize travel distance.
    2. Set logical starting times from 09:00 with 1.5 - 2 hour gaps.
    3. Provide 'transitInfo' for the travel gap leading to the NEXT item.
    4. YOU MUST USE THE ORIGINAL IDs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    });

    const resultData = JSON.parse(response.text!);
    const updates = resultData.items;
    
    // Safety check and merge
    const sorted = updates.map((u: any) => {
      const original = items.find(i => i.id === u.id);
      if (!original) return null;
      return { ...original, time: u.time, transitInfo: u.transitInfo };
    }).filter(Boolean);

    // If AI failed to return all items, fallback to original order to prevent data loss
    if (sorted.length !== items.length) return { items };

    return { items: sorted as ItineraryItem[] };
  } catch (error) {
    console.error("Smart Sort Error:", error);
    return { items };
  }
};

export const processVoiceCommand = async (base64Audio: string, lang: string = 'EN'): Promise<{type: 'TOGO' | 'NOTE', content: string}> => {
  const ai = getAiClient();
  
  const prompt = "Transcribe this travel voice note. Determine if it is a 'TOGO' (a place/shop/restaurant to visit) or a general 'NOTE'. Language: " + (lang === 'TC' ? 'Traditional Chinese' : 'English');
  
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
            content: { type: Type.STRING, description: "The transcribed text content." }
          },
          required: ["type", "content"]
        }
      }
    });

    return JSON.parse(response.text!);
  } catch (error) {
    console.error("Voice Processing Error:", error);
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
    return ["Passport", "Charger", "Toiletries", "Local Currency"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const ai = getAiClient();
    const prompt = `Suggest 3 places (bars, late night ramen, viewpoints) near ${location} to go after ${time}. 
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

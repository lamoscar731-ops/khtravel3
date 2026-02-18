
import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, ItemType, AfterPartyRec, ItineraryItem } from "../types";

// 初始化 AI 客戶端
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
      weatherSummary: { type: Type.STRING, description: "Today's Temperature and Humidity (e.g., 22°C, 60%)." },
      paceAnalysis: { type: Type.STRING, description: "Analyze the intensity of the day." },
      logicWarning: { type: Type.STRING, description: "CRITICAL: Warn if the route is inefficient (backtracking) or if items are too far apart." },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             date: { type: Type.STRING, description: "Short date (e.g. 11/15)" },
             icon: { type: Type.STRING, description: "Weather emoji (☀, ☁, 🌧, etc.)" },
             temp: { type: Type.STRING, description: "High-Low range." }
          }
        },
        description: "Mandatory: Generate a consecutive 7-day forecast starting from current date."
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "MUST MATCH ORIGINAL ID." },
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            type: { type: Type.STRING, enum: [ItemType.SIGHTSEEING, ItemType.FOOD, ItemType.RAMEN, ItemType.COFFEE, ItemType.ALCOHOL, ItemType.TRANSPORT, ItemType.SHOPPING, ItemType.HOTEL, ItemType.MISC] },
            description: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tips. For FOOD/RAMEN, Tip #1 MUST be Business Hours." },
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
    },
    required: ["dayId", "date", "weatherSummary", "items", "forecast"]
  };

  const prompt = `
    ROLE: Premium Travel Consultant (GEMINI).
    TASK: Analyze and enhance the itinerary for Day ${currentPlan.dayId} (${currentPlan.date}).
    Language: ${lang === 'TC' ? 'Traditional Chinese (Hong Kong style)' : 'English'}.
    
    CRITICAL REQUIREMENTS:
    1. WEATHER: Generate a 7-day weather forecast table for the area.
    2. GEOGRAPHY: Check the sequence of locations. If they cause backtracking (挠路) or are too distant, describe it in 'logicWarning'.
    3. TIPS: For every restaurant/cafe/bar, the FIRST tip MUST be their opening hours and holiday info.
    4. PERSISTENCE: Return the exact IDs for each item.
    
    DATA:
    ${JSON.stringify(currentPlan.items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text!);
    if (currentPlan.backupItems) result.backupItems = currentPlan.backupItems;
    return result as DayPlan;
  } catch (error) {
    console.error("Gemini Failure:", error);
    return currentPlan;
  }
};

export const smartSortItinerary = async (items: ItineraryItem[], lang: string = 'EN'): Promise<{items: ItineraryItem[]}> => {
  const ai = getAiClient();
  const modelId = "gemini-3-pro-preview";

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
            transitInfo: { type: Type.STRING, description: "Est. transport to NEXT item, e.g. '🚶 12m'." }
          }
        }
      }
    },
    required: ["items"]
  };

  const prompt = `
    TASK: Geographically optimize this route to minimize travel time.
    Language: ${lang === 'TC' ? 'Traditional Chinese' : 'English'}.
    Data: ${JSON.stringify(items.map(i => ({id: i.id, title: i.title, location: i.location})))}
    
    1. Reorder for maximum efficiency.
    2. Provide transit details (walking/train time) to the next stop.
    3. Keep IDs consistent.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    });

    const resultData = JSON.parse(response.text!);
    const sorted = resultData.items.map((u: any) => {
      const original = items.find(i => i.id === u.id);
      return original ? { ...original, time: u.time, transitInfo: u.transitInfo } : null;
    }).filter(Boolean);

    return { items: sorted.length === items.length ? sorted : items };
  } catch (error) {
    return { items };
  }
};

export const processVoiceCommand = async (base64Audio: string, lang: string = 'EN'): Promise<{type: 'TOGO' | 'NOTE', content: string}> => {
  const ai = getAiClient();
  const prompt = "Transcribe this travel voice note. Classify as 'TOGO' (place) or 'NOTE'. Language: " + (lang === 'TC' ? 'Traditional Chinese' : 'English');
  
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
          },
          required: ["type", "content"]
        }
      }
    });
    return JSON.parse(response.text!);
  } catch (error) {
    throw error;
  }
};

export const generatePackingList = async (destination: string, lang: string = 'EN'): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Packing list for ${destination}. Language: ${lang}. JSON array of strings only.`,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text!);
  } catch {
    return ["Passport", "Charger"];
  }
};

export const generateAfterPartySuggestions = async (location: string, time: string, lang: string = 'EN'): Promise<AfterPartyRec[]> => {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `3 places near ${location} after ${time}. Language: ${lang}. Return JSON array of objects {name, reason}.`,
        config: { responseMimeType: "application/json" },
      });
      return JSON.parse(response.text!);
    } catch {
      return [];
    }
  };

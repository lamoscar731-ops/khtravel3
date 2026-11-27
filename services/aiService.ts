import { AfterPartyRec, DayPlan, ItineraryItem } from "../types";

type AiAction = "enrich-itinerary" | "sort-itinerary" | "packing-list" | "nearby-suggestions";

async function requestAI<T>(action: AiAction, data: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "AI request failed.");
  }
  return result as T;
}

export async function enrichItineraryWithGPT(currentPlan: DayPlan, lang = "EN"): Promise<DayPlan> {
  const result = await requestAI<DayPlan>("enrich-itinerary", { plan: currentPlan, lang });
  const originalItems = new Map(currentPlan.items.map((item) => [item.id, item]));
  return {
    ...currentPlan,
    ...result,
    backupItems: currentPlan.backupItems,
    items: result.items.map((item) => ({ ...originalItems.get(item.id), ...item })),
  };
}

export async function smartSortItinerary(
  items: ItineraryItem[],
  lang = "EN",
): Promise<{ items: ItineraryItem[] }> {
  const result = await requestAI<{ items: Array<{ id: string; time: string; transitInfo: string }> }>(
    "sort-itinerary",
    { items, lang },
  );
  const originalItems = new Map(items.map((item) => [item.id, item]));
  const sorted = result.items
    .map((item) => {
      const original = originalItems.get(item.id);
      return original ? { ...original, time: item.time, transitInfo: item.transitInfo } : null;
    })
    .filter((item): item is ItineraryItem => item !== null);
  return { items: sorted.length === items.length ? sorted : items };
}

export async function generatePackingList(destination: string, lang = "EN"): Promise<string[]> {
  const result = await requestAI<{ items: string[] }>("packing-list", { destination, lang });
  return result.items;
}

export async function generateAfterPartySuggestions(
  location: string,
  time: string,
  lang = "EN",
): Promise<AfterPartyRec[]> {
  const result = await requestAI<{ suggestions: AfterPartyRec[] }>("nearby-suggestions", {
    location,
    time,
    lang,
  });
  return result.suggestions;
}


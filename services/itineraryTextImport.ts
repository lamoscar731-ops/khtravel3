import { DayPlan, ItemType } from "../types";
import { ParsedItineraryDay } from "./aiService";

function localISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDayPlans(parsed: ParsedItineraryDay[], firstDayId: number): DayPlan[] {
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No itinerary stops were found in that text.");
  const days = parsed.slice(0, 14);
  let stopCount = 0;
  const today = new Date();

  return days.map((day, dayIndex) => {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(day.date) && !Number.isNaN(Date.parse(`${day.date}T00:00:00`));
    const date = validDate ? day.date : (() => {
      const fallback = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayIndex);
      return localISODate(fallback);
    })();
    const items = (Array.isArray(day.items) ? day.items : []).slice(0, Math.max(0, 80 - stopCount)).map((item) => {
      stopCount += 1;
      const title = String(item.title || item.location || "Stop").trim();
      const location = String(item.location || "").trim();
      const navQuery = location || title;
      return {
        id: `import-${Date.now()}-${dayIndex}-${stopCount}`,
        time: String(item.time || "").trim(),
        title,
        location,
        type: Object.values(ItemType).includes(item.type) ? item.type : ItemType.SIGHTSEEING,
        description: String(item.description || "").trim(),
        navQuery,
        mapsUrl: navQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navQuery)}` : undefined,
      };
    });
    return { dayId: firstDayId + dayIndex, date, items };
  }).filter((day) => day.items.length > 0);
}

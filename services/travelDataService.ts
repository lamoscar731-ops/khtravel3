import { Currency } from "../types";

export interface ExchangeRateSnapshot {
  rates: Record<string, number>;
  date: string;
  source: string;
}

export interface ForecastDay {
  date: string;
  icon: string;
  temp: string;
}

export interface WeatherSnapshot {
  location: string;
  items: ForecastDay[];
  sourceUrl: string;
}

const EXCHANGE_URL = "https://api.frankfurter.dev/v2/rates?base=HKD&quotes=JPY,USD,TWD,KRW,EUR";
const WEATHER_SOURCE_URL = "https://open-meteo.com/";
const rateCache = new Map<string, { expiresAt: number; value: ExchangeRateSnapshot }>();
const weatherCache = new Map<string, { expiresAt: number; value: any }>();

const COUNTRY_BY_CITY: Record<string, { name: string; code: string }> = {
  TOKYO: { name: "Japan", code: "JP" }, OSAKA: { name: "Japan", code: "JP" }, KYOTO: { name: "Japan", code: "JP" },
  HOKKAIDO: { name: "Japan", code: "JP" }, FUKUOKA: { name: "Japan", code: "JP" },
  SEOUL: { name: "South Korea", code: "KR" }, BUSAN: { name: "South Korea", code: "KR" }, JEJU: { name: "South Korea", code: "KR" },
  TAIPEI: { name: "Taiwan", code: "TW" }, KAOHSIUNG: { name: "Taiwan", code: "TW" }, TAINAN: { name: "Taiwan", code: "TW" },
  BANGKOK: { name: "Thailand", code: "TH" }, "CHIANG MAI": { name: "Thailand", code: "TH" }, PHUKET: { name: "Thailand", code: "TH" },
  "HO CHI MINH": { name: "Vietnam", code: "VN" }, HANOI: { name: "Vietnam", code: "VN" }, "DA NANG": { name: "Vietnam", code: "VN" },
};

const COUNTRY_BY_FLAG: Record<string, { name: string; code: string }> = {
  "🇯🇵": { name: "Japan", code: "JP" }, "🇰🇷": { name: "South Korea", code: "KR" }, "🇹🇼": { name: "Taiwan", code: "TW" },
  "🇨🇳": { name: "China", code: "CN" }, "🇭🇰": { name: "Hong Kong", code: "HK" }, "🇹🇭": { name: "Thailand", code: "TH" },
  "🇻🇳": { name: "Vietnam", code: "VN" }, "🇸🇬": { name: "Singapore", code: "SG" }, "🇺🇸": { name: "United States", code: "US" },
  "🇬🇧": { name: "United Kingdom", code: "GB" }, "🇦🇺": { name: "Australia", code: "AU" }, "🇨🇦": { name: "Canada", code: "CA" },
  "🇫🇷": { name: "France", code: "FR" }, "🇮🇹": { name: "Italy", code: "IT" }, "🇪🇸": { name: "Spain", code: "ES" },
};

export async function fetchExchangeRates(): Promise<ExchangeRateSnapshot> {
  const cached = rateCache.get("hkd");
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetch(EXCHANGE_URL);
  if (!response.ok) throw new Error(`Exchange rate service returned ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Exchange rate service returned no rates.");

  const rates: Record<string, number> = { [Currency.HKD]: 1 };
  for (const row of rows) {
    if (typeof row?.quote === "string" && typeof row?.rate === "number" && row.rate > 0) {
      rates[row.quote] = 1 / row.rate;
    }
  }
  const required = [Currency.JPY, Currency.USD, Currency.TWD, Currency.KRW, Currency.EUR];
  if (required.some((currency) => !Number.isFinite(rates[currency]))) {
    throw new Error("Exchange rate service returned an incomplete rate set.");
  }

  const snapshot = { rates, date: String(rows[0].date || ""), source: "Frankfurter" };
  rateCache.set("hkd", { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value: snapshot });
  return snapshot;
}

function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function countryFor(destination: string, flag: string) {
  const normalized = destination.trim().toUpperCase();
  const known = Object.entries(COUNTRY_BY_CITY).find(([city]) => normalized.includes(city));
  return known?.[1] || COUNTRY_BY_FLAG[flag] || null;
}

export async function fetchDestinationForecast(
  destination: string,
  flag: string,
  targetDate: string,
  language: "EN" | "TC",
): Promise<WeatherSnapshot> {
  const country = countryFor(destination, flag);
  const geocodeName = country ? `${destination}, ${country.name}` : destination;
  const cacheKey = `${geocodeName.toLowerCase()}|${language}`;
  let raw = weatherCache.get(cacheKey)?.value;

  if (!raw || weatherCache.get(cacheKey)!.expiresAt <= Date.now()) {
    const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodeUrl.searchParams.set("name", geocodeName);
    geocodeUrl.searchParams.set("count", "10");
    geocodeUrl.searchParams.set("language", language === "TC" ? "zh" : "en");
    geocodeUrl.searchParams.set("format", "json");

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) throw new Error(`Location lookup returned ${geocodeResponse.status}.`);
    const geocodeData = await geocodeResponse.json();
    const candidates = Array.isArray(geocodeData.results) ? geocodeData.results : [];
    const location = (country && candidates.find((item: any) => item.country_code === country.code)) || candidates[0];
    if (!location) throw new Error("Could not locate this destination for a weather forecast.");

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(location.latitude));
    forecastUrl.searchParams.set("longitude", String(location.longitude));
    forecastUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    forecastUrl.searchParams.set("forecast_days", "16");
    forecastUrl.searchParams.set("timezone", "auto");

    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error(`Weather service returned ${forecastResponse.status}.`);
    const forecast = await forecastResponse.json();
    raw = { location: location.name, country: location.country, daily: forecast.daily };
    weatherCache.set(cacheKey, { expiresAt: Date.now() + 30 * 60 * 1000, value: raw });
  }

  const daily = raw.daily;
  const dates: string[] = daily?.time || [];
  const targetIndex = dates.indexOf(targetDate);
  if (targetIndex < 0) return { location: `${raw.location}, ${raw.country}`, items: [], sourceUrl: WEATHER_SOURCE_URL };

  const start = Math.max(0, Math.min(targetIndex - 3, dates.length - 7));
  const items = dates.slice(start, start + 7).map((date, index) => {
    const i = start + index;
    const high = daily.temperature_2m_max?.[i];
    const low = daily.temperature_2m_min?.[i];
    return {
      date: date.slice(5).replace("-", "/"),
      icon: weatherIcon(Number(daily.weather_code?.[i] ?? 3)),
      temp: Number.isFinite(high) && Number.isFinite(low) ? `${Math.round(high)}°/${Math.round(low)}°C` : "—",
    };
  });
  return { location: `${raw.location}, ${raw.country}`, items, sourceUrl: WEATHER_SOURCE_URL };
}

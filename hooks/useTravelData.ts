import { useEffect, useState } from "react";
import { EXCHANGE_RATES } from "../constants";
import { fetchDestinationForecast, fetchExchangeRates, WeatherSnapshot } from "../services/travelDataService";

export function useTravelData(destination: string, flag: string, targetDate: string, language: "EN" | "TC") {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(EXCHANGE_RATES);
  const [exchangeRateDate, setExchangeRateDate] = useState("");
  const [forecast, setForecast] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchExchangeRates()
      .then((snapshot) => {
        if (cancelled) return;
        setExchangeRates(snapshot.rates);
        setExchangeRateDate(snapshot.date);
      })
      .catch((error) => console.warn("Using fallback exchange rates.", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setForecast(null);
    if (!destination.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return;

    fetchDestinationForecast(destination, flag, targetDate, language)
      .then((snapshot) => { if (!cancelled) setForecast(snapshot); })
      .catch((error) => {
        if (!cancelled) console.warn("Weather forecast unavailable.", error);
      });
    return () => { cancelled = true; };
  }, [destination, flag, targetDate, language]);

  return { exchangeRates, exchangeRateDate, forecast };
}

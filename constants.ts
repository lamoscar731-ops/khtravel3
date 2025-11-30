import { DayPlan, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from './types';

export const EXCHANGE_RATES: Record<string, number> = {
  [Currency.JPY]: 0.053,
  [Currency.USD]: 7.82,
  [Currency.TWD]: 0.25,
  [Currency.KRW]: 0.006,
  [Currency.EUR]: 8.5,
  [Currency.HKD]: 1
};

export const AIRPORT_CODES: Record<string, string> = {
    "TOKYO": "HND / NRT",
    "OSAKA": "KIX",
    "FUKUOKA": "FUK",
    "SAPPORO": "CTS",
    "NAGOYA": "NGO",
    "OKINAWA": "OKA",
    "SEOUL": "ICN / GMP",
    "BUSAN": "PUS",
    "TAIPEI": "TPE / TSA",
    "KAOHSIUNG": "KHH",
    "HONG KONG": "HKG",
    "BANGKOK": "BKK / DMK",
    "SINGAPORE": "SIN",
    "LONDON": "LHR / LGW",
    "PARIS": "CDG / ORY",
    "NEW YORK": "JFK / EWR",
    "LOS ANGELES": "LAX",
    "SAN FRANCISCO": "SFO",
    "TORONTO": "YYZ",
    "VANCOUVER": "YVR",
    "SYDNEY": "SYD",
    "MELBOURNE": "MEL"
};

export const INITIAL_ITINERARY: DayPlan[] = [
  {
    dayId: 1,
    date: '2023-11-15 (Wed)',
    weatherSummary: '', 
    items: []
  }
];

export const INITIAL_BUDGET: BudgetProps[] = [];
export const INITIAL_FLIGHTS: FlightInfo[] = [];
export const INITIAL_HOTELS: HotelInfo[] = [];
export const INITIAL_CONTACTS: EmergencyContact[] = [];

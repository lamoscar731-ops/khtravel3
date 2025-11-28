import { DayPlan, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from './types';

export const EXCHANGE_RATES: Record<string, number> = {
  [Currency.JPY]: 0.053,
  [Currency.USD]: 7.82,
  [Currency.TWD]: 0.25,
  [Currency.KRW]: 0.006,
  [Currency.EUR]: 8.5,
  [Currency.HKD]: 1
};

export const COUNTRY_CITIES: Record<string, string[]> = {
    "JAPAN": ["TOKYO", "OSAKA", "KYOTO", "FUKUOKA", "SAPPORO", "OKINAWA", "NAGOYA"],
    "TAIWAN": ["TAIPEI", "KAOHSIUNG", "TAICHUNG", "TAINAN"],
    "SOUTH KOREA": ["SEOUL", "BUSAN", "JEJU"],
    "THAILAND": ["BANGKOK", "CHIANG MAI", "PHUKET"],
    "VIETNAM": ["HO CHI MINH CITY", "HANOI", "DA NANG"],
    "SINGAPORE": ["SINGAPORE"],
    "CHINA": ["HONG KONG", "SHANGHAI", "BEIJING", "SHENZHEN"],
    "UK": ["LONDON", "EDINBURGH", "MANCHESTER"],
    "EUROPE": ["PARIS", "ROME", "BARCELONA", "AMSTERDAM", "BERLIN", "PRAGUE", "VIENNA"],
    "USA": ["NEW YORK", "LOS ANGELES", "SAN FRANCISCO", "LAS VEGAS"],
    "AUSTRALIA": ["SYDNEY", "MELBOURNE", "BRISBANE"],
    "CANADA": ["TORONTO", "VANCOUVER"],
    "OTHERS": [] // Allows custom input via search bar
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

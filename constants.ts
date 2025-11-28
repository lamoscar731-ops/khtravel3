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
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Fukuoka", "Sapporo", "Okinawa", "Nagoya"],
    "Taiwan": ["Taipei", "Kaohsiung", "Taichung", "Tainan"],
    "South Korea": ["Seoul", "Busan", "Jeju"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
    "Singapore": ["Singapore"],
    "China": ["Hong Kong", "Shanghai", "Beijing", "Shenzhen"],
    "UK": ["London", "Edinburgh", "Manchester"],
    "Europe": ["Paris", "Rome", "Barcelona", "Amsterdam", "Berlin", "Prague", "Vienna"],
    "USA": ["New York", "Los Angeles", "San Francisco", "Las Vegas"],
    "Australia": ["Sydney", "Melbourne", "Brisbane"],
    "Canada": ["Toronto", "Vancouver"]
};

export const INITIAL_ITINERARY: DayPlan[] = [
  {
    dayId: 1,
    date: '2023-11-15 (Wed)',
    items: []
  }
];

export const INITIAL_BUDGET: BudgetProps[] = [];
export const INITIAL_FLIGHTS: FlightInfo[] = [];
export const INITIAL_HOTELS: HotelInfo[] = [];
export const INITIAL_CONTACTS: EmergencyContact[] = [];

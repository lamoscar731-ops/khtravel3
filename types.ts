export enum ItemType {
  SIGHTSEEING = 'SIGHTSEEING',
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  HOTEL = 'HOTEL'
}

export enum Currency {
  JPY = 'JPY',
  USD = 'USD',
  TWD = 'TWD',
  KRW = 'KRW',
  EUR = 'EUR',
  HKD = 'HKD'
}

export interface Tag {
  label: string;
  color: 'red' | 'gold' | 'gray';
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  location: string;
  type: ItemType;
  description?: string;
  tips?: string[];
  tags?: Tag[];
  weather?: string;
  navQuery: string;
}

export interface DayPlan {
  dayId: number;
  date: string;
  weatherSummary?: string;
  items: ItineraryItem[];
}

export interface BudgetProps {
  id: string;
  item: string;
  cost: number;
  category: string;
  currency: string;
}

export interface FlightInfo {
  id: string;
  flightNumber: string;
  departureTime: string;
  departureDate: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalDate: string;
  arrivalAirport: string;
  gate?: string;
  terminal?: string;
}

export interface HotelInfo {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  bookingRef: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  note: string;
}
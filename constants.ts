import { DayPlan, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from './types';

export const EXCHANGE_RATES: Record<string, number> = {
  [Currency.JPY]: 0.053,
  [Currency.USD]: 7.82,
  [Currency.TWD]: 0.25,
  [Currency.KRW]: 0.006,
  [Currency.EUR]: 8.5,
  [Currency.HKD]: 1
};

export const INITIAL_ITINERARY: DayPlan[] = [
  {
    dayId: 1,
    date: '2023-11-15 (Wed)',
    weatherSummary: '', 
    items: [
      {
        id: '1-1',
        time: '09:00',
        title: 'Senso-ji Temple',
        location: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
        type: ItemType.SIGHTSEEING,
        navQuery: 'Senso-ji Temple Asakusa',
        description: 'Tokyo\'s oldest temple. Enter through the Kaminarimon (Thunder Gate).',
        tips: ['Get a fortune (Omikuji).', 'Try the melon pan nearby.'],
        tags: [{ label: 'Cultural Heritage', color: 'red' }]
      },
      {
        id: '1-2',
        time: '12:00',
        title: 'Unagi Irokawa',
        location: '1 Chome-4-4 Kaminarimon, Taito City',
        type: ItemType.FOOD,
        navQuery: 'Unagi Irokawa Asakusa',
        description: 'Famous grilled eel rice restaurant.',
        tips: ['Queue starts early.'],
        tags: [{ label: 'Must Eat', color: 'gold' }, { label: 'Michelin Bib', color: 'gray' }]
      },
      {
        id: '1-3',
        time: '14:00',
        title: 'Tokyo Skytree',
        location: '1 Chome-1-2 Oshiage, Sumida City',
        type: ItemType.TRANSPORT,
        navQuery: 'Tokyo Skytree',
        description: 'Observation deck for panoramic views.',
        tags: []
      }
    ]
  },
  {
    dayId: 2,
    date: '2023-11-16 (Thu)',
    weatherSummary: '',
    items: [
      {
        id: '2-1',
        time: '10:00',
        title: 'Tsukiji Outer Market',
        location: '4 Chome-13 Tsukiji, Chuo City',
        type: ItemType.FOOD,
        navQuery: 'Tsukiji Outer Market',
        description: 'Fresh seafood breakfast.',
        tips: ['Try the Tamagoyaki (egg omelet).', 'Cash is preferred.'],
        tags: [{ label: 'Breakfast', color: 'gold' }]
      },
      {
        id: '2-2',
        time: '13:00',
        title: 'Ginza Shopping District',
        location: 'Ginza, Chuo City',
        type: ItemType.SHOPPING,
        navQuery: 'Ginza Six',
        description: 'Luxury shopping and architecture.',
        tags: [{ label: 'Tax Free', color: 'gray' }]
      }
    ]
  }
];

export const INITIAL_BUDGET: BudgetProps[] = [
  { id: '1', item: 'Flight Ticket', cost: 120000, category: 'Transport', currency: Currency.JPY },
  { id: '2', item: 'Hotel Deposit', cost: 50000, category: 'Stay', currency: Currency.JPY },
  { id: '3', item: 'Disney Ticket', cost: 9400, category: 'Activity', currency: Currency.JPY },
];

export const INITIAL_FLIGHTS: FlightInfo[] = [
  {
    id: 'f1',
    flightNumber: 'JL 098',
    departureDate: '2023-11-15',
    departureTime: '08:30',
    departureAirport: 'HND',
    arrivalDate: '2023-11-15',
    arrivalTime: '11:15',
    arrivalAirport: 'TSA',
    terminal: '3',
    gate: '142'
  }
];

export const INITIAL_HOTELS: HotelInfo[] = [
  {
    id: 'h1',
    name: 'Hotel Aman Tokyo',
    address: 'The Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo',
    checkIn: '2023-11-15',
    checkOut: '2023-11-20',
    bookingRef: 'RES-882910'
  }
];

export const INITIAL_CONTACTS: EmergencyContact[] = [
    { id: '1', name: 'Ambulance / Fire', number: '119', note: 'Medical Emergency' },
    { id: '2', name: 'Police', number: '110', note: 'Police' },
    { id: '3', name: 'Embassy', number: '03-3224-5000', note: 'US Embassy' }
];
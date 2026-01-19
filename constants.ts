import { DayPlan, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from './types';

export const EXCHANGE_RATES: Record<string, number> = {
  [Currency.JPY]: 0.052,
  [Currency.USD]: 7.82,
  [Currency.TWD]: 0.24,
  [Currency.KRW]: 0.0056,
  [Currency.EUR]: 8.35,
  [Currency.HKD]: 1
};

export const COUNTRY_CITIES: Record<string, string[]> = {
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Hokkaido", "Fukuoka"],
  "South Korea": ["Seoul", "Busan", "Jeju"],
  "Taiwan": ["Taipei", "Kaohsiung", "Tainan"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
  "Vietnam": ["Ho Chi Minh", "Hanoi", "Da Nang"],
  "OTHERS": []
};

export const TRANSLATIONS = {
  SETTINGS: { EN: 'Settings', TC: '設定' },
  TRIP_COVER: { EN: 'Trip Cover', TC: '封面' },
  UPLOAD: { EN: 'Upload', TC: '上傳' },
  SYNC_SHARE: { EN: 'Sync & Share', TC: '同步與分享' },
  COPY_CODE: { EN: 'Copy Trip Code', TC: '複製行程碼' },
  LOAD: { EN: 'Load', TC: '讀取' },
  EXPORT_ICS: { EN: 'Export to Calendar', TC: '匯出日曆' },
  COPY_TEXT: { EN: 'Copy as Text', TC: '複製文字' },
  DANGER_ZONE: { EN: 'Danger Zone', TC: '危險區域' },
  DELETE_TRIP: { EN: 'Delete Trip', TC: '刪除行程' },
  NEARBY_GEMS: { EN: 'Nearby Gems', TC: '附近好去處' },
  SEARCH_MAPS: { EN: 'Open in Maps', TC: '在地圖開啟' },
  SELECT_DEST: { EN: 'Select Destination', TC: '選擇目的地' },
  SELECT_COUNTRY: { EN: 'Select Country', TC: '選擇國家' },
  QUICK_NOTES: { EN: 'Quick Notes', TC: '速記' },
  TRIP_TO: { EN: 'Trip To', TC: '前往' },
  DAY: { EN: 'Day', TC: '第' }, 
  DAYS: { EN: 'Days', TC: '天' },
  NIGHTS: { EN: 'Nights', TC: '晚' },
  ITINERARY: { EN: 'Itinerary', TC: '行程' },
  DELETE: { EN: 'Delete', TC: '刪除' },
  MAP_ROUTE: { EN: 'Map Route', TC: '地圖路線' },
  AI_CHECK: { EN: 'AI Check', TC: 'AI 檢查' },
  RESET: { EN: 'Reset', TC: '重置' },
  ADD_ACTIVITY: { EN: 'Add Activity', TC: '新增活動' },
  NEXT_STOP: { EN: 'Where Next?', TC: '下一站去哪?' },
  WALLET: { EN: 'Wallet', TC: '錢包' },
  MY_TRIPS: { EN: 'My Trips', TC: '我的行程' },
  NEW_TRIP: { EN: 'New Trip', TC: '新行程' },
  ACTIVE: { EN: 'Active', TC: '進行中' },
  FLIGHTS: { EN: 'Flights', TC: '航班' },
  COPYRIGHT: { EN: 'COPYRIGHT KH 2025', TC: 'COPYRIGHT KH 2025' },
  SCHEDULE: { EN: 'Schedule', TC: '日程' },
  CHECKIN_IN: { EN: 'In', TC: '還有' },
  DAYS_LEFT: { EN: 'Days', TC: '天' },
  TODAY: { EN: 'Today', TC: '今天' }
};

export const EMERGENCY_DATA: Record<string, {name: string, number: string, note: string}[]> = {
  "Japan": [{ name: 'Police', number: '110', note: 'Police' }, { name: 'Fire/Ambulance', number: '119', note: 'Emergency' }],
  "South Korea": [{ name: 'Police', number: '112', note: 'Police' }, { name: 'Fire/Ambulance', number: '119', note: 'Emergency' }],
  "Taiwan": [{ name: 'Police', number: '110', note: 'Police' }, { name: 'Fire/Ambulance', number: '119', note: 'Emergency' }],
  "Thailand": [{ name: 'Tourist Police', number: '1155', note: 'English Spoken' }, { name: 'Ambulance', number: '1669', note: 'Medical' }]
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
      }
    ]
  }
];

export const INITIAL_BUDGET: BudgetProps[] = [
  { id: '1', item: 'Flight Ticket', cost: 120000, category: 'Transport', currency: Currency.JPY }
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
    arrivalAirport: 'TSA'
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
    { id: '2', name: 'Police', number: '110', note: 'Police' }
];

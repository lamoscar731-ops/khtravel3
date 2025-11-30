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

export const COUNTRY_CITIES: Record<string, string[]> = {
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Hokkaido", "Fukuoka", "Sapporo", "Okinawa", "Nagoya"],
  "South Korea": ["Seoul", "Busan", "Jeju"],
  "Taiwan": ["Taipei", "Kaohsiung", "Tainan", "Taichung"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
  "Singapore": ["Singapore"],
  "China": ["Hong Kong", "Shanghai", "Beijing", "Shenzhen"],
  "UK": ["London", "Edinburgh", "Manchester"],
  "Europe": ["Paris", "Rome", "Barcelona", "Amsterdam", "Berlin", "Prague", "Vienna"],
  "USA": ["New York", "Los Angeles", "San Francisco", "Las Vegas"],
  "Australia": ["Sydney", "Melbourne", "Brisbane"],
  "Canada": ["Toronto", "Vancouver"],
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
  ITINERARY: { EN: 'Itinerary', TC: '行程' },
  DELETE: { EN: 'DEL', TC: '刪除' },
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
  ACCOMMODATION: { EN: 'Accommodation', TC: '住宿' },
  EMERGENCY: { EN: 'Emergency', TC: '緊急聯絡' },
  PACKING_LIST: { EN: 'Packing List', TC: '行李清單' },
  BUDGET_TRACKER: { EN: 'Budget Tracker', TC: '預算追蹤' },
  AI_SUGGEST: { EN: 'AI SUGGEST', TC: 'AI 建議' },
  ADD: { EN: 'ADD', TC: '新增' },
  ADD_EXPENSE: { EN: 'ADD EXPENSE', TC: '新增支出' },
  SAVE: { EN: 'SAVE', TC: '儲存' },
  CANCEL: { EN: 'CANCEL', TC: '取消' },
  DONE: { EN: 'DONE', TC: '完成' },
  NAVIGATE: { EN: 'NAVIGATE', TC: '導航' },
  SHOW: { EN: 'SHOW', TC: '展示' },
  COPYRIGHT: { EN: '© 2025 KH.TRAVEL', TC: '© 2025 KH.TRAVEL' },
  SCHEDULE: { EN: 'Schedule', TC: '日程' },
  NIGHTS: { EN: 'NIGHTS', TC: '晚' }
};

export const EMERGENCY_DATA: Record<string, {name: string, number: string, note: string}[]> = {
  "Japan": [{ name: 'POLICE', number: '110', note: 'POLICE' }, { name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' }],
  "South Korea": [{ name: 'POLICE', number: '112', note: 'POLICE' }, { name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' }],
  "Taiwan": [{ name: 'POLICE', number: '110', note: 'POLICE' }, { name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' }],
  "Thailand": [{ name: 'TOURIST POLICE', number: '1155', note: 'ENGLISH SPOKEN' }, { name: 'AMBULANCE', number: '1669', note: 'MEDICAL' }]
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

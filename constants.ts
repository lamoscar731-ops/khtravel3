
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
  "JAPAN": ["TOKYO", "OSAKA", "KYOTO", "HOKKAIDO", "FUKUOKA"],
  "SOUTH KOREA": ["SEOUL", "BUSAN", "JEJU"],
  "TAIWAN": ["TAIPEI", "KAOHSIUNG", "TAINAN"],
  "THAILAND": ["BANGKOK", "CHIANG MAI", "PHUKET"],
  "VIETNAM": ["HO CHI MINH", "HANOI", "DA NANG"],
  "OTHERS": []
};

export const TRANSLATIONS = {
  SETTINGS: { EN: "SETTINGS", TC: "設定" },
  TRIP_COVER: { EN: "TRIP COVER", TC: "封面" },
  UPLOAD: { EN: "UPLOAD", TC: "上傳" },
  SYNC_SHARE: { EN: "SYNC & SHARE", TC: "同步與分享" },
  COPY_CODE: { EN: "COPY TRIP CODE", TC: "複製行程碼" },
  LOAD: { EN: "LOAD", TC: "讀取" },
  EXPORT_ICS: { EN: "EXPORT CALENDAR", TC: "匯出日曆" },
  COPY_TEXT: { EN: "COPY AS TEXT", TC: "複製文字" },
  DANGER_ZONE: { EN: "DANGER ZONE", TC: "危險區域" },
  DELETE_TRIP: { EN: "DELETE TRIP", TC: "刪除行程" },
  NEARBY_GEMS: { EN: "NEARBY GEMS", TC: "附近好去處" },
  SEARCH_MAPS: { EN: "OPEN IN MAPS", TC: "在地圖開啟" },
  SELECT_DEST: { EN: "SELECT DESTINATION", TC: "選擇目的地" },
  SELECT_COUNTRY: { EN: "SELECT COUNTRY", TC: "選擇國家" },
  QUICK_NOTES: { EN: "QUICK NOTES", TC: "速記" },
  TRIP_TO: { EN: "TRIP TO", TC: "前往" },
  DAY: { EN: "DAY", TC: "第" }, 
  DAYS: { EN: "DAYS", TC: "天" },
  NIGHTS: { EN: "NIGHTS", TC: "晚" },
  ITINERARY: { EN: "ITINERARY", TC: "行程" },
  DELETE: { EN: "DELETE", TC: "刪除" },
  MAP_ROUTE: { EN: "MAP ROUTE", TC: "地圖路線" },
  AI_CHECK: { EN: "[GEMINI]", TC: "[GEMINI]" },
  RESET: { EN: "RESET", TC: "重置" },
  ADD_ACTIVITY: { EN: "ADD ACTIVITY", TC: "新增活動" },
  NEXT_STOP: { EN: "WHERE NEXT?", TC: "下一站去哪?" },
  WALLET: { EN: "WALLET", TC: "錢包" },
  MY_TRIPS: { EN: "MY TRIPS", TC: "我的行程" },
  NEW_TRIP: { EN: "NEW TRIP", TC: "新行程" },
  ACTIVE: { EN: "ACTIVE", TC: "進行中" },
  FLIGHTS: { EN: "FLIGHTS", TC: "航班" },
  COPYRIGHT: { EN: "COPYRIGHT KH 2025", TC: "COPYRIGHT KH 2025" },
  SCHEDULE: { EN: "SCHEDULE", TC: "日程" },
  CHECKIN_IN: { EN: "IN", TC: "還有" },
  DAYS_LEFT: { EN: "DAYS", TC: "天" },
  TODAY: { EN: "TODAY", TC: "今天" },
  TOGO: { EN: "TO GO", TC: "待去清單" },
  IMPORT_TOGO: { EN: "IMPORT TO GO", TC: "從 TO GO 加入" }
};

export const EMERGENCY_DATA: Record<string, {name: string, number: string, note: string}[]> = {
  "JAPAN": [{ name: "POLICE", number: "110", note: "POLICE" }, { name: "FIRE/AMBULANCE", number: "119", note: "EMERGENCY" }],
  "SOUTH KOREA": [{ name: "POLICE", number: "112", note: "POLICE" }, { name: "FIRE/AMBULANCE", number: "119", note: "EMERGENCY" }],
  "TAIWAN": [{ name: "POLICE", number: "110", note: "POLICE" }, { name: "FIRE/AMBULANCE", number: "119", note: "EMERGENCY" }],
  "THAILAND": [{ name: "TOURIST POLICE", number: "1155", note: "ENGLISH SPOKEN" }, { name: "AMBULANCE", number: "1669", note: "MEDICAL" }]
};

export const INITIAL_ITINERARY: DayPlan[] = [
  {
    dayId: 1,
    date: "2024-11-15 (WED)",
    weatherSummary: "", 
    items: [
      {
        id: "1-1",
        time: "09:00",
        title: "SENSO-JI TEMPLE",
        location: "2 CHOME-3-1 ASAKUSA, TAITO CITY, TOKYO",
        type: ItemType.SIGHTSEEING,
        navQuery: "SENSO-JI TEMPLE ASAKUSA",
        description: "TOKYO'S OLDEST TEMPLE. ENTER THROUGH THE KAMINARIMON (THUNDER GATE).",
        tips: ["GET A FORTUNE.", "TRY MELON PAN."],
        tags: [{ label: "CULTURAL", color: "red" }]
      }
    ]
  }
];

export const INITIAL_BUDGET: BudgetProps[] = [
  { id: "1", item: "FLIGHT TICKET", cost: 120000, category: "TRANSPORT", currency: Currency.JPY }
];

export const INITIAL_FLIGHTS: FlightInfo[] = [
  {
    id: "f1",
    flightNumber: "JL 098",
    departureDate: "2024-11-15",
    departureTime: "08:30",
    departureAirport: "HND",
    arrivalDate: "2024-11-15",
    arrivalTime: "11:15",
    arrivalAirport: "TSA",
    terminal: "3",
    gate: "142"
  }
];

export const INITIAL_HOTELS: HotelInfo[] = [
  {
    id: "h1",
    name: "HOTEL AMAN TOKYO",
    address: "THE OTEMACHI TOWER, 1-5-6 OTEMACHI, CHIYODA-KU, TOKYO",
    checkIn: "2024-11-15",
    checkOut: "2024-11-20",
    bookingRef: "RES-882910"
  }
];

export const INITIAL_CONTACTS: EmergencyContact[] = [
  { id: "1", name: "AMBULANCE / FIRE", number: "119", note: "MEDICAL EMERGENCY" },
  { id: "2", name: "POLICE", number: "110", note: "POLICE" }
];

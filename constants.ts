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
    "OTHERS": []
};

export const EMERGENCY_DATA: Record<string, EmergencyContact[]> = {
    "JAPAN": [
        { id: 'e1', name: 'POLICE', number: '110', note: 'EMERGENCY' },
        { id: 'e2', name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' },
        { id: 'e3', name: 'CONSULATE', number: '', note: 'CHECK LOCALLY' }
    ],
    "TAIWAN": [
        { id: 'e1', name: 'POLICE', number: '110', note: 'EMERGENCY' },
        { id: 'e2', name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' }
    ],
    "SOUTH KOREA": [
        { id: 'e1', name: 'POLICE', number: '112', note: 'EMERGENCY' },
        { id: 'e2', name: 'FIRE/AMBULANCE', number: '119', note: 'EMERGENCY' }
    ],
    "THAILAND": [
        { id: 'e1', name: 'TOURIST POLICE', number: '1155', note: 'ENGLISH SPOKEN' },
        { id: 'e2', name: 'AMBULANCE', number: '1669', note: 'EMERGENCY' }
    ],
    "USA": [
        { id: 'e1', name: 'EMERGENCY', number: '911', note: 'ALL SERVICES' }
    ],
    "UK": [
        { id: 'e1', name: 'EMERGENCY', number: '999', note: 'ALL SERVICES' }
    ],
    "EUROPE": [
        { id: 'e1', name: 'EMERGENCY', number: '112', note: 'EU WIDE' }
    ]
};

export const TRANSLATIONS = {
    SCHEDULE: { EN: 'SCHEDULE', TC: '行程' },
    MY_TRIPS: { EN: 'MY TRIPS', TC: '我的旅程' },
    WALLET: { EN: 'WALLET', TC: '錢包' },
    TRIP_TO: { EN: 'TRIP TO', TC: '前往' },
    DAY: { EN: 'DAY', TC: '第' }, 
    ITINERARY: { EN: 'ITINERARY', TC: '行程表' },
    MAP_ROUTE: { EN: 'MAP ROUTE', TC: '路線導航' },
    AI_CHECK: { EN: 'AI GUIDE CHECK', TC: 'AI 智能檢查' },
    RESET: { EN: 'RESET', TC: '還原' },
    ADD_ACTIVITY: { EN: 'ADD ACTIVITY', TC: '新增行程' },
    NEXT_STOP: { EN: 'NEXT STOP?', TC: '下一站去哪？' },
    FLIGHTS: { EN: 'FLIGHTS', TC: '航班' },
    ACCOMMODATION: { EN: 'ACCOMMODATION', TC: '住宿' },
    EMERGENCY: { EN: 'EMERGENCY', TC: '緊急聯絡' },
    PACKING_LIST: { EN: 'PACKING LIST', TC: '行李清單' },
    BUDGET_TRACKER: { EN: 'BUDGET TRACKER', TC: '預算追蹤' },
    AI_SUGGEST: { EN: 'AI SUGGEST', TC: 'AI 建議' },
    ADD: { EN: 'ADD', TC: '新增' },
    ADD_EXPENSE: { EN: 'ADD EXPENSE', TC: '新增支出' },
    SETTINGS: { EN: 'SETTINGS', TC: '設定' },
    SYNC_SHARE: { EN: 'SYNC / SHARE TRIP', TC: '同步 / 分享' },
    COPY_CODE: { EN: 'COPY TRIP DATA', TC: '複製行程代碼' },
    LOAD: { EN: 'LOAD', TC: '匯入' },
    EXPORT_ICS: { EN: 'EXPORT .ICS', TC: '匯出行事曆' },
    COPY_TEXT: { EN: 'COPY TEXT', TC: '複製純文字' },
    DANGER_ZONE: { EN: 'DANGER ZONE', TC: '危險區域' },
    DELETE_TRIP: { EN: 'DELETE TRIP', TC: '刪除此旅程' },
    TRIP_COVER: { EN: 'TRIP COVER IMAGE', TC: '封面照片' },
    UPLOAD: { EN: 'UPLOAD', TC: '上傳' },
    SELECT_DEST: { EN: 'SELECT DESTINATION', TC: '選擇目的地' },
    SELECT_COUNTRY: { EN: 'SELECT COUNTRY', TC: '選擇國家' },
    QUICK_NOTES: { EN: 'QUICK NOTES', TC: '隨手筆記' },
    NEARBY_GEMS: { EN: 'NEARBY GEMS', TC: '附近好去處' },
    SEARCH_MAPS: { EN: 'OPEN GOOGLE MAPS', TC: '開啟 GOOGLE MAPS' },
    NEW_TRIP: { EN: 'NEW TRIP', TC: '新旅程' },
    ACTIVE: { EN: 'ACTIVE', TC: '進行中' },
    SAVE: { EN: 'SAVE', TC: '儲存' },
    CANCEL: { EN: 'CANCEL', TC: '取消' },
    DELETE: { EN: 'DEL', TC: '刪除' },
    DONE: { EN: 'DONE', TC: '完成' },
    NAVIGATE: { EN: 'NAVIGATE', TC: '導航' },
    SHOW: { EN: 'SHOW', TC: '展示' },
    COPYRIGHT: { EN: 'COPYRIGHT KH 2025', TC: 'COPYRIGHT KH 2025' },
    LANGUAGE: { EN: 'LANGUAGE', TC: '語言' }
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

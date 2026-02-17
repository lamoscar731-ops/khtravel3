
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CITIES, TRANSLATIONS, EMERGENCY_DATA } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip, ChecklistItem, AfterPartyRec, Language, ToGoItem, ToBuyItem } from './types';
import { enrichItineraryWithGemini, generatePackingList, generateAfterPartySuggestions } from './services/geminiService';

enum Tab { ITINERARY = 'ITINERARY', TRIPS = 'TRIPS', UTILITIES = 'UTILITIES' }

const FLAGS = ['🇯🇵', '🇰🇷', '🇹🇼', '🇨🇳', '🇭🇰', '🇹🇭', '🇻🇳', '🇸🇬', '🇺🇸', '🇬🇧', '🇪🇺', '🇦🇺', '🇨🇦', '🇫🇷', '🇮🇹', '🇪🇸', '🌍'];

const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); 
    }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [now, setNow] = useState(new Date());
  
  // --- Language State ---
  const [lang, setLang] = useState<Language>(() => {
      return (localStorage.getItem('kuro_lang') as Language) || 'EN';
  });
  const T = TRANSLATIONS;

  useEffect(() => {
      localStorage.setItem('kuro_lang', lang);
  }, [lang]);

  // --- Clock for Live Mode ---
  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 60000); 
      return () => clearInterval(timer);
  }, []);
  
  // --- Fetch Real-time Rates ---
  useEffect(() => {
      fetch('https://api.exchangerate-api.com/v4/latest/HKD')
        .then(res => res.json())
        .then(data => {
            if (data && data.rates) {
                const newRates: Record<string, number> = {};
                Object.keys(DEFAULT_RATES).forEach(key => {
                    if (data.rates[key]) {
                        newRates[key] = 1 / data.rates[key];
                    } else {
                        newRates[key] = DEFAULT_RATES[key];
                    }
                });
                newRates[Currency.HKD] = 1;
                setExchangeRates(newRates);
            }
        })
        .catch(() => console.log("Using default rates"));
  }, []);

  // --- Multi-Trip State Management (Preserved and Enhanced with ToGoList) ---
  const [trips, setTrips] = useState<Trip[]>(() => {
      const savedTrips = localStorage.getItem('kuro_trips');
      if (savedTrips) return JSON.parse(savedTrips);
      return [{
          id: `trip-${Date.now()}`,
          destination: 'TOKYO',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: INITIAL_ITINERARY,
          flights: INITIAL_FLIGHTS,
          hotels: INITIAL_HOTELS,
          budget: INITIAL_BUDGET,
          contacts: INITIAL_CONTACTS,
          toGoList: [],
          toBuyList: [],
          totalBudget: 20000,
          checklist: [],
          notes: '',
          coverImage: ''
      }];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
      return localStorage.getItem('kuro_active_trip_id') || (trips.length > 0 ? trips[0].id : '');
  });

  const [selectedDay, setSelectedDay] = useState<number>(1); // 0 will be for POOL
  const [destination, setDestination] = useState<string>('TOKYO');
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [budget, setBudget] = useState<BudgetProps[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [tripNotes, setTripNotes] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [toGoList, setToGoList] = useState<ToGoItem[]>([]);
  const [toBuyList, setToBuyList] = useState<ToBuyItem[]>([]);

  const [userFlag, setUserFlag] = useState<string>(() => {
    return localStorage.getItem('kuro_flag') || "🇯🇵";
  });

  // --- Load Active Trip Data ---
  useEffect(() => {
      const currentTrip = trips.find(t => t.id === activeTripId);
      if (currentTrip) {
          setDestination(currentTrip.destination);
          setItinerary(currentTrip.itinerary);
          setFlights(currentTrip.flights);
          setHotels(currentTrip.hotels);
          setBudget(currentTrip.budget);
          setContacts(currentTrip.contacts);
          setTotalBudget(currentTrip.totalBudget || 20000);
          setChecklist(currentTrip.checklist || []);
          setTripNotes(currentTrip.notes || '');
          setCoverImage(currentTrip.coverImage || '');
          setToGoList(currentTrip.toGoList || []);
          setToBuyList(currentTrip.toBuyList || []);
          if (selectedDay !== 0 && selectedDay > currentTrip.itinerary.length) setSelectedDay(1);
          setIsSelectMode(false);
          setSelectedItemIds(new Set());
      }
      localStorage.setItem('kuro_active_trip_id', activeTripId);
  }, [activeTripId]);

  // --- Sync Changes Back ---
  useEffect(() => {
      setTrips(prevTrips => {
          const newTrips = prevTrips.map(t => {
              if (t.id === activeTripId) {
                  return { 
                      ...t, destination, itinerary, flights, hotels, budget, contacts, totalBudget, checklist,
                      notes: tripNotes, coverImage, toGoList, toBuyList
                  };
              }
              return t;
          });
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          return newTrips;
      });
  }, [destination, itinerary, flights, hotels, budget, contacts, totalBudget, checklist, tripNotes, coverImage, toGoList, toBuyList]);

  useEffect(() => { localStorage.setItem('kuro_flag', userFlag); }, [userFlag]);

  const currentDayPlan = useMemo(() => {
      return itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });
  }, [itinerary, selectedDay]);

  // --- Live Mode Helper ---
  const isLiveItem = (item: ItineraryItem, index: number, items: ItineraryItem[]) => {
      if (selectedDay === 0) return false;
      const dateStr = currentDayPlan.date.split(' ')[0]; 
      const planDate = new Date(dateStr);
      const isSameDate = planDate.getFullYear() === now.getFullYear() &&
                         planDate.getMonth() === now.getMonth() &&
                         planDate.getDate() === now.getDate();
      
      if (!isSameDate) return false;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const itemTimeParts = item.time.split(':');
      const itemMinutes = parseInt(itemTimeParts[0]) * 60 + parseInt(itemTimeParts[1]);

      let nextItemMinutes = 24 * 60; 
      if (index < items.length - 1) {
          const nextParts = items[index + 1].time.split(':');
          nextItemMinutes = parseInt(nextParts[0]) * 60 + parseInt(nextParts[1]);
      } else {
          nextItemMinutes = itemMinutes + 120; 
      }

      return currentMinutes >= itemMinutes && currentMinutes < nextItemMinutes;
  };

  // --- Handlers (Full Logic Preserved) ---
  const handleCreateTrip = () => {
      vibrate();
      const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: 'NEW TRIP',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: [{ dayId: 1, date: new Date().toISOString().split('T')[0], items: [] }],
          flights: [], hotels: [], budget: [], contacts: [], toGoList: [], toBuyList: [],
          totalBudget: 20000, checklist: [], notes: '', coverImage: ''
      };
      setTrips(prev => [...prev, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
  };

  const handleDeleteTrip = () => {
      vibrate();
      if (trips.length <= 1) { alert("You must have at least one trip."); return; }
      if (confirm("Delete this trip? This cannot be undone.")) {
          const newTrips = trips.filter(t => t.id !== activeTripId);
          setTrips(newTrips);
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          setActiveTripId(newTrips[0].id);
          setShowSettings(false);
      }
  };

  const handleExportCalendar = () => {
      vibrate();
      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//kh.travel//Trip Planner//EN\n";
      itinerary.forEach(day => {
          day.items.forEach(item => {
              if (item.title && item.time) {
                  const dateStr = day.date.split(' ')[0].replace(/-/g, ''); 
                  const timeStr = item.time.replace(':', '') + '00'; 
                  const startDateTime = `${dateStr}T${timeStr}`;
                  let endHour = parseInt(item.time.split(':')[0]) + 1;
                  const endTimeStr = (endHour < 10 ? '0' + endHour : endHour) + item.time.split(':')[1] + '00';
                  const endDateTime = `${dateStr}T${endTimeStr}`;
                  icsContent += "BEGIN:VEVENT\n";
                  icsContent += `SUMMARY:${item.title}\n`;
                  icsContent += `DTSTART:${startDateTime}\n`;
                  icsContent += `DTEND:${endDateTime}\n`;
                  if (item.location) icsContent += `LOCATION:${item.location}\n`;
                  if (item.description) icsContent += `DESCRIPTION:${item.description}\n`;
                  icsContent += "END:VEVENT\n";
              }
          });
      });
      icsContent += "END:VCALENDAR";
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trip_${destination}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyText = () => {
      vibrate();
      let text = `✈️ TRIP TO ${destination}\n\n`;
      itinerary.forEach(day => {
          text += `📅 DAY ${day.dayId} (${day.date})\n`;
          day.items.forEach(item => {
              text += `${item.time} ${item.title}\n`;
              if(item.location) text += `📍 ${item.location}\n`;
              text += `\n`;
          });
          text += `----------------\n`;
      });
      navigator.clipboard.writeText(text).then(() => alert("Itinerary copied to clipboard!"));
  };

  const handleEnrichItinerary = async () => {
    vibrate();
    setIsLoading(true);
    try {
        const enrichedPlan = await enrichItineraryWithGemini(currentDayPlan, lang);
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enrichedPlan : day));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleInsertToGo = (item: ToGoItem, targetDayId: number) => {
    vibrate();
    const newItem: ItineraryItem = {
      id: `i-pool-${Date.now()}`,
      time: '12:00',
      title: item.place,
      location: item.place,
      type: ItemType.SIGHTSEEING,
      description: item.remarks,
      navQuery: item.place
    };
    setItinerary(prev => prev.map(day => day.dayId === targetDayId ? {
      ...day, items: [...day.items, newItem].sort((a,b) => a.time.localeCompare(b.time))
    } : day));
    setToGoList(prev => prev.filter(i => i.id !== item.id));
    setSelectedDay(targetDayId);
  };

  // --- UI State ---
  const [showSettings, setShowSettings] = useState(false);
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDestSelector, setShowDestSelector] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-black pb-24 text-neutral-200 font-sans relative overflow-x-hidden">
      {/* Header Preserved with POOL Toggle */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-2 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2" onClick={() => setShowDestSelector(true)}>
             <span className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider">{T.TRIP_TO[lang]}</span>
             <h1 className="text-lg font-bold tracking-widest text-white cursor-pointer uppercase">
                 {destination} <span className="text-[8px] text-neutral-600">▼</span>
             </h1>
          </div>
          <div className="flex gap-4 items-center">
              <button onClick={() => setShowNotes(true)} className="text-neutral-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </button>
              <button onClick={() => setShowSettings(true)} className="text-neutral-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 2 2 2 2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 2 2 2 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
              <div onClick={() => setShowFlagSelector(true)} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center cursor-pointer text-lg shadow-glow">{userFlag}</div>
          </div>
        </div>
        
        {activeTab === Tab.ITINERARY && (
            <div className="flex px-5 pb-3 overflow-x-auto no-scrollbar gap-2.5 items-center">
                <button 
                  onClick={() => { vibrate(); setSelectedDay(0); }} 
                  className={`flex flex-col items-center min-w-[58px] py-2 rounded-xl border transition-all ${selectedDay === 0 ? 'bg-amber-100 text-black border-amber-100 shadow-xl' : 'bg-neutral-900 text-amber-500/60 border-amber-900/20 border-dashed hover:border-amber-500/40'}`}
                >
                    <span className="text-[8px] uppercase font-black tracking-widest">POOL</span>
                    <span className="text-xs font-black font-mono mt-0.5">TO GO</span>
                </button>
                {itinerary.map(day => (
                    <button key={day.dayId} onClick={() => { vibrate(); setSelectedDay(day.dayId); }} className={`flex flex-col items-center min-w-[44px] py-1.5 rounded-lg transition-all border ${selectedDay === day.dayId ? 'bg-neutral-100 text-black border-neutral-100 shadow-xl' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                        <span className="text-[8px] uppercase font-bold">{T.DAY[lang]} {day.dayId}</span>
                        <span className="text-xs font-black font-mono">{day.date.split(' ')[0].slice(-5) || '--'}</span>
                    </button>
                ))}
                <button onClick={() => { vibrate(); const ndId = itinerary.length + 1; setItinerary([...itinerary, { dayId: ndId, date: 'TBD', items: [] }]); setSelectedDay(ndId); }} className="min-w-[40px] h-[45px] rounded-xl border border-dashed border-neutral-800 text-neutral-700 hover:text-white transition-all flex items-center justify-center font-bold">+</button>
            </div>
        )}
      </header>

      {/* Main Content Area (Day POOL or Itinerary) */}
      <main className="px-4 pt-[145px] max-w-lg mx-auto min-h-screen">
        {activeTab === Tab.ITINERARY ? (
            selectedDay === 0 ? (
                /* --- TO GO POOL (JAPANESE MAGAZINE STYLE) --- */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end mb-6 px-1">
                        <div className="flex flex-col">
                            <h2 className="text-[10px] font-black text-amber-500 tracking-[0.4em] uppercase">TO GO POOL</h2>
                            <p className="text-[9px] text-neutral-600 mt-1 uppercase font-bold tracking-widest">Inspiration Bucket</p>
                        </div>
                        <button 
                          onClick={() => { vibrate(); setToGoList([...toGoList, { id: `tg-${Date.now()}`, place: '', remarks: '' }]); }} 
                          className="bg-amber-500/10 text-amber-500 text-[10px] px-5 py-2 rounded-full uppercase font-black border border-amber-500/20 active:scale-95 transition-transform"
                        >
                          + New Memory
                        </button>
                    </div>
                    <div className="space-y-6 pb-20">
                        {toGoList.map(item => (
                            <div key={item.id} className="bg-[#F9F9F9] rounded-[32px] p-6 flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white relative overflow-hidden group">
                                <div className="flex-1">
                                    <input 
                                      className="w-full bg-transparent border-none text-[#1A1A1A] font-black text-xl uppercase placeholder-neutral-300 focus:outline-none tracking-tighter" 
                                      value={item.place} 
                                      placeholder="SHOP / MUSEUM / CAFE" 
                                      onChange={e => setToGoList(prev => prev.map(i => i.id === item.id ? {...i, place: e.target.value} : i))} 
                                    />
                                    <div className="h-px w-full bg-[#1A1A1A]/10 my-3"></div>
                                    <textarea 
                                      className="w-full bg-transparent border-none text-[#1A1A1A]/60 text-[11px] normal-case placeholder-neutral-300 focus:outline-none resize-none leading-relaxed font-bold tracking-wide" 
                                      value={item.remarks} 
                                      rows={2} 
                                      placeholder="Why go here? Opening times or must-buy items..." 
                                      onChange={e => setToGoList(prev => prev.map(i => i.id === item.id ? {...i, remarks: e.target.value} : i))} 
                                    />
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <div className="relative flex-1 group/btn">
                                        <button className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2">
                                          Insert To Schedule <span className="opacity-30">→</span>
                                        </button>
                                        <div className="absolute left-0 bottom-full mb-3 w-full bg-white border border-neutral-100 rounded-[24px] shadow-2xl opacity-0 translate-y-3 pointer-events-none group-hover/btn:opacity-100 group-hover/btn:translate-y-0 group-hover/btn:pointer-events-auto transition-all z-[60] p-3 grid grid-cols-2 gap-2">
                                            {itinerary.map(day => (
                                                <button 
                                                  key={day.dayId} 
                                                  onClick={() => handleInsertToGo(item, day.dayId)} 
                                                  className="px-4 py-3 bg-neutral-50 hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[10px] font-black uppercase rounded-xl transition-all border border-neutral-100"
                                                >
                                                  Day {day.dayId}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => { vibrate(); setToGoList(prev => prev.filter(i => i.id !== item.id)); }} 
                                      className="bg-neutral-200 text-neutral-400 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                      ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                        {toGoList.length === 0 && (
                            <div className="text-center py-32 flex flex-col items-center opacity-20">
                                <div className="text-5xl mb-6">🏯</div>
                                <p className="text-[10px] font-black tracking-[0.5em] uppercase">Pool is empty</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* --- ITINERARY LIST --- */
                <div className="animate-in fade-in duration-500">
                    <div className="flex gap-3 mb-6">
                        <button onClick={handleEnrichItinerary} disabled={isLoading} className="flex-1 bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all">
                            {isLoading ? 'Processing...' : `✨ ${T.AI_CHECK[lang]}`}
                        </button>
                    </div>
                    <div className="relative pl-1">
                        {currentDayPlan.items.map((item, index) => (
                            <ItineraryCard 
                              key={item.id} 
                              item={item} 
                              isLast={index === currentDayPlan.items.length - 1} 
                              onSave={handleUpdateItem} 
                              onDelete={id => setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, items: d.items.filter(i => i.id !== id) } : d))} 
                              isSelectMode={false} 
                              isSelected={false} 
                              onSelect={() => {}} 
                              isActive={isLiveItem(item, index, currentDayPlan.items)} 
                              lang={lang} 
                            />
                        ))}
                        <button 
                          onClick={() => { vibrate(); const ni: ItineraryItem = { id: `i-${Date.now()}`, time: '12:00', title: 'New Destination', location: 'TBD', type: ItemType.SIGHTSEEING, navQuery: '' }; setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, items: [...d.items, ni].sort((a,b) => a.time.localeCompare(b.time)) } : d)) }} 
                          className="w-full py-6 border border-dashed border-neutral-800 rounded-[24px] text-neutral-700 text-[10px] font-black uppercase tracking-[0.4em] mt-6 hover:text-white hover:border-neutral-500 transition-all active:bg-neutral-900"
                        >
                          + Add Activity
                        </button>
                    </div>
                </div>
            )
        ) : activeTab === Tab.TRIPS ? (
            /* --- TRIP LIST Preserved --- */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">My Journeys</h2>
                    <button onClick={handleCreateTrip} className="bg-neutral-100 text-black text-[10px] font-black px-5 py-2 rounded-xl uppercase shadow-lg">+ Create New</button>
                </div>
                <div className="grid gap-4">
                    {trips.map(trip => (
                        <div 
                          key={trip.id} 
                          onClick={() => { vibrate(); setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} 
                          className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer flex flex-col ${activeTripId === trip.id ? 'border-white bg-neutral-900 shadow-xl' : 'border-neutral-900 bg-neutral-950 opacity-50 grayscale'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-black uppercase text-white tracking-tighter leading-none">{trip.destination}</h3>
                                {activeTripId === trip.id && <span className="bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-[11px] text-neutral-500 font-mono tracking-wider">{trip.itinerary?.length || 0} Days · Starts {trip.startDate}</p>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            /* --- UTILITIES Preserved --- */
            <Utilities 
                budget={budget} flights={flights} hotels={hotels} contacts={contacts} totalBudget={totalBudget} rates={exchangeRates} checklist={checklist} lang={lang}
                onAddFlight={handleAddFlight} onUpdateFlight={handleUpdateFlight} onDeleteFlight={handleDeleteFlight}
                onAddHotel={handleAddHotel} onUpdateHotel={handleUpdateHotel} onDeleteHotel={handleDeleteHotel}
                onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget}
                onAddContact={handleAddContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact}
                onUpdateTotalBudget={setTotalBudget} 
                onAddChecklist={handleAddChecklist} onToggleChecklist={handleToggleChecklist} onDeleteChecklist={handleDeleteChecklist}
                onAiChecklist={() => { vibrate(); setIsLoadingAi(true); generatePackingList(destination, lang).then(items => { setChecklist(prev => [...prev, ...items.map(text => ({ id: `ai-${Date.now()}`, text, checked: false }))]); setIsLoadingAi(false); }); }} 
                isLoadingAi={isLoadingAi}
                toBuyList={toBuyList}
                onAddToBuy={() => { vibrate(); setToBuyList([...toBuyList, { id: `tb-${Date.now()}`, shop: '', address: '', item: '', website: '', checked: false }]); }}
                onUpdateToBuy={item => setToBuyList(prev => prev.map(i => i.id === item.id ? item : i))}
                onDeleteToBuy={id => setToBuyList(toBuyList.filter(i => i.id !== id))}
                onToggleToBuy={id => setToBuyList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))}
            />
        )}
      </main>

      {/* Navigation Preserved */}
      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-2xl border-t border-neutral-900 pb-safe-bottom z-[100]">
        <div className="flex justify-around items-center h-[75px] max-w-lg mx-auto px-4">
            <button onClick={() => { vibrate(); setActiveTab(Tab.ITINERARY); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-700 hover:text-neutral-400'}`}>
                <div className={`w-8 h-1 rounded-full mb-1 ${activeTab === Tab.ITINERARY ? 'bg-white' : 'bg-transparent'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{T.SCHEDULE[lang]}</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.TRIPS); }} className={`w-14 h-14 rounded-full flex items-center justify-center -mt-8 transition-all duration-500 shadow-2xl relative border-4 border-black ${activeTab === Tab.TRIPS ? 'bg-white text-black scale-110' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}>
                <span className="text-3xl">🌏</span>
                {activeTab === Tab.TRIPS && <div className="absolute inset-0 rounded-full animate-ping bg-white/20"></div>}
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.UTILITIES); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-700 hover:text-neutral-400'}`}>
                <div className={`w-8 h-1 rounded-full mb-1 ${activeTab === Tab.UTILITIES ? 'bg-white' : 'bg-transparent'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{T.WALLET[lang]}</span>
            </button>
        </div>
      </nav>

      {/* Custom Modals (Search, Flag, Settings, etc.) */}
      {showDestSelector && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col p-6 pt-[calc(env(safe-area-inset-top)+20px)] animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">{T.SELECT_DEST[lang]}</h3>
                  <button onClick={() => setShowDestSelector(false)} className="text-neutral-500 p-2 text-xl">✕</button>
              </div>
              <input className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-white mb-4 outline-none" placeholder="Search city..." value={destSearch} onChange={e => setDestSearch(e.target.value)} />
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                   {Object.entries(COUNTRY_CITIES).map(([country, cities]) => (
                       <div key={country}>
                           <h4 className="text-[10px] text-neutral-500 font-bold mb-2 uppercase">{country}</h4>
                           <div className="grid grid-cols-2 gap-2">
                               {(cities as string[]).filter(c => c.toLowerCase().includes(destSearch.toLowerCase())).map(city => (
                                   <button key={city} onClick={() => { setDestination(city); setShowDestSelector(false); }} className="text-left p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white uppercase">{city}</button>
                               ))}
                           </div>
                       </div>
                   ))}
              </div>
          </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-y-auto max-h-[80vh]">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500">✕</button>
                  <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">{T.SETTINGS[lang]}</h3>
                  <div className="space-y-4">
                      <button onClick={handleExportCalendar} className="w-full bg-neutral-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest">📅 {T.EXPORT_ICS[lang]}</button>
                      <button onClick={handleCopyText} className="w-full bg-neutral-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest">📝 {T.COPY_TEXT[lang]}</button>
                      <button onClick={handleDeleteTrip} className="w-full border border-red-900/50 bg-red-950/20 text-red-400 py-3 rounded-xl text-xs font-bold uppercase">🗑️ {T.DELETE_TRIP[lang]}</button>
                  </div>
              </div>
          </div>
      )}

      {showNotes && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white uppercase">{T.QUICK_NOTES[lang]}</h3>
                  <button onClick={() => setShowNotes(false)} className="text-neutral-500 text-xl">✕</button>
              </div>
              <textarea className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 focus:outline-none resize-none" placeholder="Type notes..." value={tripNotes} onChange={e => setTripNotes(e.target.value)} autoFocus />
          </div>
      )}

      {showFlagSelector && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6">
               <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-xs relative">
                   <button onClick={() => setShowFlagSelector(false)} className="absolute top-3 right-3">✕</button>
                   <div className="grid grid-cols-5 gap-3">
                       {FLAGS.map(f => <button key={f} onClick={() => { setUserFlag(f); setShowFlagSelector(false); }} className="text-2xl">{f}</button>)}
                   </div>
               </div>
          </div>
      )}
    </div>
  );

  // --- Helper array update functions (Preserved from original) ---
  function handleAddFlight() { vibrate(); setFlights([...flights, { id:`f-${Date.now()}`, flightNumber:'--', departureDate:'', departureTime:'', departureAirport:'', arrivalDate:'', arrivalTime:'', arrivalAirport:'' }]); }
  function handleUpdateFlight(f: FlightInfo) { setFlights(prev => prev.map(i => i.id === f.id ? f : i)); }
  function handleDeleteFlight(id: string) { setFlights(flights.filter(f => f.id !== id)); }
  function handleAddHotel() { vibrate(); setHotels([...hotels, { id:`h-${Date.now()}`, name:'', address:'', checkIn:'', checkOut:'', bookingRef:'' }]); }
  function handleUpdateHotel(h: HotelInfo) { setHotels(prev => prev.map(i => i.id === h.id ? h : i)); }
  function handleDeleteHotel(id: string) { setHotels(hotels.filter(h => h.id !== id)); }
  function handleAddBudget() { vibrate(); setBudget([...budget, { id:`b-${Date.now()}`, item:'New Expense', cost:0, category:'MISC', currency: Currency.JPY }]); }
  function handleUpdateBudget(b: BudgetProps) { setBudget(prev => prev.map(i => i.id === b.id ? b : i)); }
  function handleDeleteBudget(id: string) { setBudget(budget.filter(b => b.id !== id)); }
  function handleAddContact() { vibrate(); setContacts([...contacts, { id:`c-${Date.now()}`, name:'', number:'', note:'' }]); }
  function handleUpdateContact(c: EmergencyContact) { setContacts(prev => prev.map(i => i.id === c.id ? c : i)); }
  function handleDeleteContact(id: string) { setContacts(contacts.filter(c => c.id !== id)); }
  function handleAddChecklist(text: string) { vibrate(); setChecklist([...checklist, { id: `cl-${Date.now()}`, text, checked: false }]); }
  function handleToggleChecklist(id: string) { setChecklist(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)); }
  function handleDeleteChecklist(id: string) { setChecklist(checklist.filter(i => i.id !== id)); }
};

export default App;

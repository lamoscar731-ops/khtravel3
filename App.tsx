
import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CITIES, TRANSLATIONS, EMERGENCY_DATA } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip, ChecklistItem, Language, ToBuyItem } from './types';
import { enrichItineraryWithGemini, generatePackingList } from './services/geminiService';

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

  // --- Multi-Trip State Management ---
  const [trips, setTrips] = useState<Trip[]>(() => {
      const savedTrips = localStorage.getItem('kuro_trips');
      if (savedTrips) return JSON.parse(savedTrips);
      return [{
          id: `trip-${Date.now()}`,
          destination: 'TOKYO',
          startDate: '2024-01-01',
          itinerary: INITIAL_ITINERARY,
          flights: INITIAL_FLIGHTS,
          hotels: INITIAL_HOTELS,
          budget: INITIAL_BUDGET,
          contacts: INITIAL_CONTACTS,
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

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [destination, setDestination] = useState<string>('TOKYO');
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [budget, setBudget] = useState<BudgetProps[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [toBuyList, setToBuyList] = useState<ToBuyItem[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [tripNotes, setTripNotes] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');

  const [userFlag, setUserFlag] = useState<string>(() => {
    return localStorage.getItem('kuro_flag') || "🇯🇵";
  });

  // --- Load Active Trip Data ---
  useEffect(() => {
      const currentTrip = trips.find(t => t.id === activeTripId);
      if (currentTrip) {
          setDestination(currentTrip.destination);
          setItinerary(currentTrip.itinerary || []);
          setFlights(currentTrip.flights || []);
          setHotels(currentTrip.hotels || []);
          setBudget(currentTrip.budget || []);
          setContacts(currentTrip.contacts || []);
          setToBuyList(currentTrip.toBuyList || []);
          setTotalBudget(currentTrip.totalBudget || 20000);
          setChecklist(currentTrip.checklist || []);
          setTripNotes(currentTrip.notes || '');
          setCoverImage(currentTrip.coverImage || '');
          if (selectedDay > (currentTrip.itinerary?.length || 0)) setSelectedDay(1);
      }
      localStorage.setItem('kuro_active_trip_id', activeTripId);
  }, [activeTripId]);

  // --- Sync Changes Back ---
  useEffect(() => {
      setTrips(prevTrips => {
          const newTrips = prevTrips.map(t => {
              if (t.id === activeTripId) {
                  return { 
                      ...t, 
                      destination, 
                      itinerary, 
                      flights, 
                      hotels, 
                      budget, 
                      contacts, 
                      toBuyList,
                      totalBudget, 
                      checklist,
                      notes: tripNotes,
                      coverImage
                  };
              }
              return t;
          });
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          return newTrips;
      });
  }, [destination, itinerary, flights, hotels, budget, contacts, toBuyList, totalBudget, checklist, tripNotes, coverImage]);

  useEffect(() => { localStorage.setItem('kuro_flag', userFlag); }, [userFlag]);

  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });

  // --- Handlers ---
  const handleCreateTrip = () => {
      vibrate();
      const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: 'NEW TRIP',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: [{ dayId: 1, date: new Date().toISOString().split('T')[0], items: [] }],
          flights: [],
          hotels: [],
          budget: [],
          contacts: [],
          toBuyList: [],
          totalBudget: 20000,
          checklist: [],
          notes: '',
          coverImage: ''
      };
      setTrips(prev => [...prev, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDestSelector, setShowDestSelector] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const handleFlagClick = () => { vibrate(); setShowFlagSelector(true); };
  const handleSelectFlag = (flag: string) => { vibrate(); setUserFlag(flag); setShowFlagSelector(false); };

  const handleSelectDestination = (city: string) => {
      vibrate();
      setDestination(city.toUpperCase());
      setShowDestSelector(false);
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 600; 
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  setCoverImage(canvas.toDataURL('image/jpeg', 0.5));
              }
          };
          if(event.target?.result) img.src = event.target.result as string;
      };
      reader.readAsDataURL(file);
  };

  const handleEnrichItinerary = async () => {
    vibrate();
    setIsLoading(true);
    try {
        const enriched = await enrichItineraryWithGemini(currentDayPlan, lang);
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enriched : day));
    } catch (e) { alert("AI OFFLINE"); } finally { setIsLoading(false); }
  };

  const handleUpdateItem = (updated: ItineraryItem) => {
    setItinerary(prev => prev.map(day => day.dayId === selectedDay ? { ...day, items: day.items.map(i => i.id === updated.id ? updated : i).sort((a,b) => a.time.localeCompare(b.time)) } : day));
  };

  const handleAddItem = () => {
    vibrate();
    const newItem: ItineraryItem = { id: `${selectedDay}-${Date.now()}`, time: '12:00', title: 'NEW ACTIVITY', location: 'TBD', type: ItemType.SIGHTSEEING, description: '', navQuery: destination, tags: [] };
    setItinerary(prev => prev.map(day => day.dayId === selectedDay ? { ...day, items: [...day.items, newItem].sort((a,b) => a.time.localeCompare(b.time)) } : day));
  };

  const handleAddDay = () => { vibrate(); const newDayId = itinerary.length + 1; let nextDate = new Date(); if (itinerary.length > 0) { const lastDateStr = itinerary[itinerary.length - 1].date.split(' ')[0]; const lastDate = new Date(lastDateStr); if (!isNaN(lastDate.getTime())) { lastDate.setDate(lastDate.getDate() + 1); nextDate = lastDate; } } const newDay: DayPlan = { dayId: newDayId, date: nextDate.toISOString().split('T')[0], items: [] }; setItinerary(prev => [...prev, newDay]); setSelectedDay(newDayId); };

  return (
    <div className="min-h-screen bg-black pb-24 text-neutral-200 font-sans relative overflow-x-hidden">
      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-y-auto max-h-[80vh]">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">✕</button>
                  <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">{T.SETTINGS[lang]}</h3>
                  
                  <div className="space-y-6">
                      <div>
                          <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">{T.TRIP_COVER[lang]}</h4>
                          <button onClick={() => coverInputRef.current?.click()} className="w-full bg-neutral-800 border border-neutral-700 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest">{T.UPLOAD[lang]}</button>
                          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverImageUpload} />
                      </div>
                      <div className="pt-4 border-t border-neutral-800">
                          <button onClick={() => { vibrate(); const code = prompt("PASTE TRIP CODE"); if(code){ try{ const data = JSON.parse(atob(code)); setTrips([...trips, {...data, id:`imp-${Date.now()}`}]); }catch(e){alert("INVALID");}} }} className="w-full border border-neutral-700 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest">{T.LOAD[lang]}</button>
                      </div>
                      <div className="pt-4 border-t border-neutral-800">
                          <button onClick={() => { if(confirm("DELETE TRIP?")){ setTrips(trips.filter(t=>t.id!==activeTripId)); if(trips.length>1) setActiveTripId(trips[0].id); setShowSettings(false); } }} className="w-full border border-red-900/50 text-red-500 py-3 rounded-lg text-xs font-bold uppercase tracking-widest">{T.DELETE_TRIP[lang]}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Destination Selector */}
      {showDestSelector && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col p-6 animate-fade-in pt-[calc(env(safe-area-inset-top)+20px)]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white uppercase tracking-wider">{T.SELECT_DEST[lang]}</h3>
                   <button onClick={() => setShowDestSelector(false)} className="text-neutral-500 hover:text-white p-2 text-xl">✕</button>
               </div>
               <input autoFocus className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-white mb-4 outline-none focus:border-white uppercase" placeholder="SEARCH..." value={destSearch} onChange={(e) => setDestSearch(e.target.value)} />
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                   {Object.entries(COUNTRY_CITIES).map(([country, cities]) => (
                       <div key={country}>
                           <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">{country}</h4>
                           <div className="grid grid-cols-2 gap-2">
                               {(cities as string[]).filter(c => c.toLowerCase().includes(destSearch.toLowerCase())).map(city => (
                                   <button key={city} onClick={() => handleSelectDestination(city)} className="text-left p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-500 transition-all text-xs font-bold text-white">{city}</button>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-2 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2" onClick={() => setShowDestSelector(true)}>
             <span className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider">{T.TRIP_TO[lang]}</span>
             <h1 className="text-lg font-bold tracking-widest text-white cursor-pointer uppercase flex items-center gap-1">
                 {destination} <span className="text-[8px] text-neutral-600">▼</span>
             </h1>
          </div>
          <div className="flex gap-4 items-center">
              <button onClick={() => setShowNotes(true)} className="text-neutral-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </button>
              {/* FIXED SETTINGS ICON */}
              <button onClick={() => setShowSettings(true)} className="text-neutral-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
              <div onClick={handleFlagClick} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg">{userFlag}</div>
          </div>
        </div>
        
        {activeTab === Tab.ITINERARY && (
            <div className="flex flex-col gap-2 pb-2">
                <div className="flex px-5 overflow-x-auto no-scrollbar gap-2 items-center">
                    {itinerary.map(day => (
                        <button key={day.dayId} onClick={() => { vibrate(); setSelectedDay(day.dayId); }} className={`flex flex-col items-center min-w-[44px] p-1.5 rounded-lg border transition-all ${selectedDay === day.dayId ? 'bg-white text-black border-white shadow-glow' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                            <span className="text-[8px] uppercase font-bold">{T.DAY[lang]} {day.dayId}</span>
                            <span className="text-xs font-bold font-mono">{day.date.split(' ')[0].slice(-5)}</span>
                        </button>
                    ))}
                    <button onClick={handleAddDay} className="min-w-[36px] h-[40px] rounded-lg border border-dashed border-neutral-700 text-neutral-500 font-bold">+</button>
                </div>
                
                {/* 7-DAY WEATHER STRIP */}
                {currentDayPlan.forecast && currentDayPlan.forecast.length > 0 && (
                    <div className="flex px-5 overflow-x-auto no-scrollbar gap-5 py-1.5 bg-neutral-950/60 border-y border-neutral-900">
                        {currentDayPlan.forecast.map((f, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[42px] gap-0.5 animate-fade-in">
                                <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-tight">{f.date}</span>
                                <span className="text-lg leading-none py-0.5">{f.icon}</span>
                                <span className="text-[9px] text-neutral-300 font-mono font-bold tracking-tighter">{f.temp}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </header>

      <main className="px-3 pt-[160px] max-w-lg mx-auto">
        {activeTab === Tab.ITINERARY ? (
            <>
                <div className="flex gap-2 mb-4">
                    <button onClick={handleEnrichItinerary} disabled={isLoading} className="flex-1 bg-neutral-100 text-black py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        {isLoading ? 'THINKING...' : `✨ ${T.AI_CHECK[lang]}`}
                    </button>
                </div>
                <div className="relative">
                    {currentDayPlan.items.map((item, index) => (
                        <ItineraryCard key={item.id} item={item} isLast={index === currentDayPlan.items.length - 1} onSave={handleUpdateItem} onDelete={() => {}} isSelectMode={false} isSelected={false} onSelect={() => {}} isActive={false} lang={lang} />
                    ))}
                    <div className="flex gap-2 mb-4 mt-2 relative group">
                        <div className="absolute left-[13px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
                        <div className="flex flex-col items-center min-w-[28px] z-10 opacity-50"><div className="w-7 h-7 rounded-full border border-neutral-800 border-dashed flex items-center justify-center"><span className="text-neutral-500 text-[10px]">+</span></div></div>
                        <button onClick={handleAddItem} className="flex-1 h-10 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all active:scale-95 uppercase text-[9px] font-bold tracking-widest">+ {T.ADD_ACTIVITY[lang]}</button>
                    </div>
                </div>
            </>
        ) : activeTab === Tab.UTILITIES ? (
            <Utilities 
                budget={budget} flights={flights} hotels={hotels} contacts={contacts} checklist={checklist} totalBudget={totalBudget} rates={exchangeRates} 
                onAddFlight={()=>{}} onAddHotel={()=>{}} onAddBudget={()=>{}} onAddContact={()=>{}} onUpdateFlight={()=>{}} onUpdateHotel={()=>{}} onUpdateBudget={()=>{}} onUpdateContact={()=>{}} onDeleteFlight={()=>{}} onDeleteHotel={()=>{}} onDeleteBudget={()=>{}} onDeleteContact={()=>{}} onUpdateTotalBudget={()=>{}} onAddChecklist={()=>{}} onToggleChecklist={()=>{}} onDeleteChecklist={()=>{}} onAiChecklist={()=>{}} isLoadingAi={false} lang={lang}
                toBuyList={toBuyList} onAddToBuy={()=>{}} onUpdateToBuy={()=>{}} onDeleteToBuy={()=>{}} onToggleToBuy={()=>{}}
            />
        ) : (
            <div className="grid gap-2">
                {trips.map(trip => (
                    <div key={trip.id} onClick={() => { vibrate(); setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} className={`p-4 rounded-xl border transition-all ${activeTripId === trip.id ? 'border-white bg-neutral-900/50' : 'border-neutral-800 bg-neutral-900 opacity-60'}`}>
                         <h3 className="text-xl font-black uppercase text-white">{trip.destination}</h3>
                         <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{trip.itinerary?.length || 0} {T.DAYS[lang]} . {Math.max(0, (trip.itinerary?.length || 1) - 1)} {T.NIGHTS[lang]}</div>
                    </div>
                ))}
            </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
            <button onClick={() => { vibrate(); setActiveTab(Tab.ITINERARY); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">{T.SCHEDULE[lang]}</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.TRIPS); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.TRIPS ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">{T.MY_TRIPS[lang]}</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.UTILITIES); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">{T.WALLET[lang]}</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

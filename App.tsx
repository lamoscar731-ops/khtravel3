
import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CITIES, TRANSLATIONS, EMERGENCY_DATA } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip, ChecklistItem, Language, ToBuyItem } from './types';
import { enrichItineraryWithGemini, generatePackingList } from './services/geminiService';

enum Tab { ITINERARY = 'ITINERARY', TRIPS = 'TRIPS', UTILITIES = 'UTILITIES' }

const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); 
    }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('kuro_lang') as Language) || 'TC');
  const T = TRANSLATIONS;

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
      .catch(() => console.log("Using fallback rates"));
  }, []);

  const [trips, setTrips] = useState<Trip[]>(() => {
      const saved = localStorage.getItem('kuro_trips');
      return saved ? JSON.parse(saved) : [{
          id: `trip-${Date.now()}`,
          destination: 'TOKYO',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: INITIAL_ITINERARY,
          flights: INITIAL_FLIGHTS,
          hotels: INITIAL_HOTELS,
          budget: INITIAL_BUDGET,
          contacts: INITIAL_CONTACTS,
          toBuyList: [],
          totalBudget: 20000,
          checklist: [],
          notes: ''
      }];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => localStorage.getItem('kuro_active_trip_id') || trips[0].id);
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
  const [userFlag, setUserFlag] = useState<string>(() => localStorage.getItem('kuro_flag') || "🇯🇵");

  const [showDestSelector, setShowDestSelector] = useState(false);
  const [destSearch, setDestSearch] = useState('');

  useEffect(() => {
      const trip = trips.find(t => t.id === activeTripId);
      if (trip) {
          setDestination(trip.destination);
          setItinerary(trip.itinerary);
          setFlights(trip.flights);
          setHotels(trip.hotels);
          setBudget(trip.budget);
          setContacts(trip.contacts);
          setToBuyList(trip.toBuyList || []);
          setTotalBudget(trip.totalBudget || 20000);
          setChecklist(trip.checklist || []);
          setTripNotes(trip.notes || '');
      }
      localStorage.setItem('kuro_active_trip_id', activeTripId);
  }, [activeTripId]);

  useEffect(() => {
      const updatedTrips = trips.map(t => t.id === activeTripId ? { ...t, destination, itinerary, flights, hotels, budget, contacts, toBuyList, totalBudget, checklist, notes: tripNotes } : t);
      setTrips(updatedTrips);
      localStorage.setItem('kuro_trips', JSON.stringify(updatedTrips));
  }, [destination, itinerary, flights, hotels, budget, contacts, toBuyList, totalBudget, checklist, tripNotes]);

  const handleSelectDestination = (city: string) => {
      vibrate();
      setDestination(city);
      setShowDestSelector(false);
  };

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
          notes: ''
      };
      setTrips([...trips, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
  };

  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });

  const handleEnrichItinerary = async () => {
    vibrate();
    setIsLoading(true);
    try {
        const enriched = await enrichItineraryWithGemini(currentDayPlan, lang);
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enriched : day));
    } catch (e) { alert("AI 暫時離線"); }
    finally { setIsLoading(false); }
  };

  const handleAddDay = () => {
      vibrate();
      const newDay: DayPlan = { dayId: itinerary.length + 1, date: 'TBD', items: [] };
      setItinerary([...itinerary, newDay]);
  };

  const handleUpdateItem = (updatedItem: ItineraryItem) => {
    setItinerary(prev => prev.map(day => day.dayId === selectedDay ? { ...day, items: day.items.map(i => i.id === updatedItem.id ? updatedItem : i).sort((a,b) => a.time.localeCompare(b.time)) } : day));
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-neutral-200 font-sans relative">
      {showDestSelector && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col p-6 animate-fade-in pt-[calc(env(safe-area-inset-top)+20px)]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white uppercase tracking-wider">{T.SELECT_DEST[lang]}</h3>
                   <button onClick={() => setShowDestSelector(false)} className="text-neutral-500 hover:text-white p-2 text-xl">✕</button>
               </div>
               <input autoFocus className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-white mb-4 outline-none focus:border-white transition-all" placeholder="搜尋城市..." value={destSearch} onChange={(e) => setDestSearch(e.target.value)} />
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                   {Object.entries(COUNTRY_CITIES).map(([country, cities]) => (
                       <div key={country}>
                           <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">{country}</h4>
                           <div className="grid grid-cols-2 gap-2">
                               {cities.filter(c => c.toLowerCase().includes(destSearch.toLowerCase())).map(city => (
                                   <button key={city} onClick={() => handleSelectDestination(city)} className="text-left p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white hover:border-neutral-500 transition-all">
                                       {city}
                                   </button>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}

      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-2 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2" onClick={() => setShowDestSelector(true)}>
             <span className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider">{T.TRIP_TO[lang]}</span>
             <h1 className="text-lg font-bold tracking-widest text-white cursor-pointer uppercase">
                 {destination} <span className="text-[8px] text-neutral-600 ml-1">▼</span>
             </h1>
          </div>
          <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg">{userFlag}</div>
          </div>
        </div>
        {activeTab === Tab.ITINERARY && (
            <div className="flex px-5 pb-2 overflow-x-auto no-scrollbar gap-2 items-center">
                {itinerary.map(day => (
                    <button key={day.dayId} onClick={() => { vibrate(); setSelectedDay(day.dayId); }} className={`flex flex-col items-center min-w-[44px] p-1.5 rounded-lg border transition-all ${selectedDay === day.dayId ? 'bg-neutral-100 text-black border-neutral-100 shadow-glow' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                        <span className="text-[8px] uppercase font-bold">{T.DAY[lang]} {day.dayId}</span>
                        <span className="text-xs font-bold font-mono">{day.date.split(' ')[0].slice(-5)}</span>
                    </button>
                ))}
                <button onClick={handleAddDay} className="min-w-[36px] h-[40px] rounded-lg border border-dashed border-neutral-700 text-neutral-500 hover:text-white transition-all">+</button>
            </div>
        )}
      </header>

      <main className="px-3 pt-[130px] max-w-lg mx-auto">
        {activeTab === Tab.ITINERARY ? (
            <>
                <div className="flex gap-2 mb-4">
                    <button onClick={handleEnrichItinerary} disabled={isLoading} className="flex-1 bg-neutral-100 text-black py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 shadow-lg">
                        {isLoading ? 'Thinking...' : `✨ ${T.AI_CHECK[lang]}`}
                    </button>
                </div>
                <div className="relative">
                    {currentDayPlan.items.map((item, index) => (
                        <ItineraryCard key={item.id} item={item} isLast={index === currentDayPlan.items.length - 1} onSave={handleUpdateItem} onDelete={() => {}} isSelectMode={false} isSelected={false} onSelect={() => {}} isActive={false} lang={lang} />
                    ))}
                    {currentDayPlan.items.length === 0 && <div className="text-center py-20 text-neutral-800 text-[10px] tracking-widest">PLANNING...</div>}
                </div>
            </>
        ) : activeTab === Tab.TRIPS ? (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">{T.MY_TRIPS[lang]}</h2>
                    <button onClick={handleCreateTrip} className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-tighter shadow-glow">+ {T.NEW_TRIP[lang]}</button>
                </div>
                <div className="grid gap-3">
                    {trips.map(trip => (
                        <div key={trip.id} onClick={() => { vibrate(); setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} className={`p-5 rounded-xl border transition-all ${activeTripId === trip.id ? 'border-white bg-neutral-900/50' : 'border-neutral-800 bg-neutral-900 opacity-60'}`}>
                             <div className="flex justify-between items-start mb-4">
                                 <h3 className="text-2xl font-black uppercase text-white tracking-tighter">{trip.destination}</h3>
                                 {activeTripId === trip.id && <span className="bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded-full">{T.ACTIVE[lang]}</span>}
                             </div>
                             <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                 {trip.itinerary.length} {T.DAYS[lang]} . {Math.max(0, trip.itinerary.length - 1)} {T.NIGHTS[lang]}
                             </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            <Utilities 
                budget={budget} flights={flights} hotels={hotels} contacts={contacts} totalBudget={totalBudget} rates={exchangeRates} 
                onUpdateFlight={(f)=>setFlights(prev=>prev.map(i=>i.id===f.id?f:i))} onUpdateHotel={(h)=>setHotels(prev=>prev.map(i=>i.id===h.id?h:i))} 
                onAddFlight={()=>setFlights([...flights,{id:`f-${Date.now()}`,flightNumber:'FLIGHT',departureDate:'2024-01-01',departureTime:'00:00',departureAirport:'DEP',arrivalDate:'2024-01-01',arrivalTime:'00:00',arrivalAirport:'ARR'}])} 
                onAddHotel={()=>setHotels([...hotels,{id:`h-${Date.now()}`,name:'HOTEL',address:'ADDRESS',checkIn:'2024-01-01',checkOut:'2024-01-02',bookingRef:''}])} 
                onDeleteFlight={(id)=>setFlights(flights.filter(f=>f.id!==id))} onDeleteHotel={(id)=>setHotels(hotels.filter(h=>h.id!==id))} 
                onAddBudget={()=>setBudget([...budget,{id:`b-${Date.now()}`,item:'Expense',cost:0,category:'MISC',currency:'JPY'}])} 
                onUpdateBudget={(b)=>setBudget(prev=>prev.map(i=>i.id===b.id?b:i))} onDeleteBudget={(id)=>setBudget(budget.filter(b=>b.id!==id))} 
                onAddContact={()=>setContacts([...contacts,{id:`c-${Date.now()}`,name:'CONTACT',number:'',note:''}])} 
                onUpdateContact={(c)=>setContacts(prev=>prev.map(i=>i.id===c.id?c:i))} onDeleteContact={(id)=>setContacts(contacts.filter(c=>c.id!==id))} 
                onUpdateTotalBudget={setTotalBudget} onAddChecklist={(t)=>setChecklist([...checklist,{id:`cl-${Date.now()}`,text:t,checked:false}])} 
                onToggleChecklist={(id)=>setChecklist(prev=>prev.map(i=>i.id===id?{...i,checked:!i.checked}:i))} onDeleteChecklist={(id)=>setChecklist(checklist.filter(i=>i.id!==id))} 
                onAiChecklist={()=>{}} isLoadingAi={false} checklist={checklist} lang={lang}
                toBuyList={toBuyList}
                onAddToBuy={() => setToBuyList([...toBuyList, { id: `tb-${Date.now()}`, shop: '', address: '', item: '', website: '', checked: false }])}
                onUpdateToBuy={(item) => setToBuyList(prev => prev.map(i => i.id === item.id ? item : i))}
                onDeleteToBuy={(id) => setToBuyList(toBuyList.filter(i => i.id !== id))}
                onToggleToBuy={(id) => setToBuyList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))}
            />
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[70px] max-w-lg mx-auto">
            <button onClick={() => { vibrate(); setActiveTab(Tab.ITINERARY); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <span className="text-[9px] font-bold uppercase tracking-widest">{T.SCHEDULE[lang]}</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.TRIPS); }} className={`w-12 h-12 rounded-full flex items-center justify-center -mt-6 transition-all shadow-xl ${activeTab === Tab.TRIPS ? 'bg-white text-black shadow-white/10' : 'bg-neutral-800 text-neutral-400'}`}>
                <span className="text-2xl">🌍</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.UTILITIES); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-600'}`}>
                <span className="text-[9px] font-bold uppercase tracking-widest">{T.WALLET[lang]}</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

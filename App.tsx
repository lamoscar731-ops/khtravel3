import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS, EXCHANGE_RATES as DEFAULT_RATES } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip, ChecklistItem } from './types';
import { enrichItineraryWithGemini, generatePackingList } from './services/geminiService';

enum Tab { ITINERARY = 'ITINERARY', TRIPS = 'TRIPS', UTILITIES = 'UTILITIES' }

const FLAGS = ['🇯🇵', '🇰🇷', '🇹🇼', '🇨🇳', '🇭🇰', '🇹🇭', '🇻🇳', '🇸🇬', '🇺🇸', '🇬🇧', '🇪🇺', '🇦🇺', '🇨🇦', '🇫🇷', '🇮🇹', '🇪🇸', '🌍'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  
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
      const oldItinerary = localStorage.getItem('kuro_itinerary');
      // Migration for old data or fresh start
      if (oldItinerary) {
          const migratedTrip: Trip = {
              id: `trip-${Date.now()}`,
              destination: localStorage.getItem('kuro_destination') || 'TOKYO',
              startDate: '2023-11-15',
              itinerary: JSON.parse(oldItinerary),
              flights: JSON.parse(localStorage.getItem('kuro_flights') || JSON.stringify(INITIAL_FLIGHTS)),
              hotels: JSON.parse(localStorage.getItem('kuro_hotels') || JSON.stringify(INITIAL_HOTELS)),
              budget: JSON.parse(localStorage.getItem('kuro_budget') || JSON.stringify(INITIAL_BUDGET)),
              contacts: JSON.parse(localStorage.getItem('kuro_contacts') || JSON.stringify(INITIAL_CONTACTS)),
              totalBudget: 20000,
              checklist: []
          };
          return [migratedTrip];
      }
      return [{
          id: `trip-${Date.now()}`,
          destination: 'TOKYO',
          startDate: '2024-01-01',
          itinerary: INITIAL_ITINERARY,
          flights: INITIAL_FLIGHTS,
          hotels: INITIAL_HOTELS,
          budget: INITIAL_BUDGET,
          contacts: INITIAL_CONTACTS,
          totalBudget: 20000,
          checklist: []
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
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // User Flag
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
          if (selectedDay > currentTrip.itinerary.length) setSelectedDay(1);
      }
      localStorage.setItem('kuro_active_trip_id', activeTripId);
  }, [activeTripId]);

  // --- Sync Changes Back ---
  useEffect(() => {
      setTrips(prevTrips => {
          const newTrips = prevTrips.map(t => {
              if (t.id === activeTripId) {
                  return { ...t, destination, itinerary, flights, hotels, budget, contacts, totalBudget, checklist };
              }
              return t;
          });
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          return newTrips;
      });
  }, [destination, itinerary, flights, hotels, budget, contacts, totalBudget, checklist]);

  useEffect(() => { localStorage.setItem('kuro_flag', userFlag); }, [userFlag]);

  const [isEditingDest, setIsEditingDest] = useState<boolean>(false);
  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });

  // --- Handlers ---
  const handleCreateTrip = () => {
      const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: 'NEW TRIP',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: [{ dayId: 1, date: new Date().toISOString().split('T')[0], items: [] }],
          flights: [],
          hotels: [],
          budget: [],
          contacts: [],
          totalBudget: 20000,
          checklist: []
      };
      setTrips(prev => [...prev, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
  };

  const handleDeleteTrip = () => {
      if (trips.length <= 1) { alert("You must have at least one trip."); return; }
      if (confirm("Delete this trip? This cannot be undone.")) {
          const newTrips = trips.filter(t => t.id !== activeTripId);
          setTrips(newTrips);
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          setActiveTripId(newTrips[0].id);
          setShowSettings(false);
      }
  };

  // --- Settings / Sync / Flag ---
  const [showSettings, setShowSettings] = useState(false);
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [importData, setImportData] = useState('');
  
  const handleFlagClick = () => setShowFlagSelector(true);
  const handleSelectFlag = (flag: string) => { setUserFlag(flag); setShowFlagSelector(false); };

  const handleExport = () => {
      const currentTrip = trips.find(t => t.id === activeTripId);
      if (!currentTrip) return;
      const jsonStr = JSON.stringify(currentTrip);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      navigator.clipboard.writeText(encoded).then(() => alert("Trip code copied!"));
  };

  const handleImport = () => {
      if (!importData) return;
      try {
          const jsonStr = decodeURIComponent(escape(atob(importData)));
          const data = JSON.parse(jsonStr);
          if (!data.itinerary || !data.destination) throw new Error("Invalid");
          const newTrip: Trip = { ...data, id: `trip-imported-${Date.now()}`, destination: data.destination + ' (Imp)' };
          setTrips(prev => [...prev, newTrip]);
          setActiveTripId(newTrip.id);
          setShowSettings(false);
          setImportData('');
          alert("Imported!");
      } catch (e) { alert("Invalid code."); }
  };

  // --- AI Enrichment & Reset ---
  const handleEnrichItinerary = async () => {
    setIsLoading(true);
    try {
        const itemsBackup = JSON.parse(JSON.stringify(currentDayPlan.items));
        const planToEnrich = { ...currentDayPlan };
        const enrichedPlan = await enrichItineraryWithGemini(planToEnrich);
        enrichedPlan.backupItems = itemsBackup;
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enrichedPlan : day));
    } catch (e) {
        console.error("Failed to enrich", e);
        alert("Offline.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetDay = () => {
      if (!currentDayPlan.backupItems) return;
      const restoredItems = currentDayPlan.backupItems;
      setItinerary(prev => prev.map(day => {
          if (day.dayId === selectedDay) {
              const { backupItems, ...rest } = day;
              return { ...rest, items: restoredItems, weatherSummary: '' };
          }
          return day;
      }));
  };

  const handleAiChecklist = async () => {
      setIsLoading(true);
      try {
          const suggestions = await generatePackingList(destination);
          const newItems: ChecklistItem[] = suggestions.map(text => ({
              id: `cl-${Date.now()}-${Math.random()}`,
              text,
              checked: false
          }));
          // Merge avoiding duplicates
          setChecklist(prev => {
              const existingTexts = new Set(prev.map(i => i.text.toLowerCase()));
              const uniqueNew = newItems.filter(i => !existingTexts.has(i.text.toLowerCase()));
              return [...prev, ...uniqueNew];
          });
      } catch (e) {
          alert("AI Offline");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Map Route ---
  const handleMapRoute = () => {
      const validItems = currentDayPlan.items.filter(i => 
          i.location && i.location.trim() !== '' && !i.location.includes('TBD') && !i.location.includes('Location TBD')
      );
      if (validItems.length === 0) { alert("Add locations to map."); return; }
      if (validItems.length === 1) {
           const query = encodeURIComponent(validItems[0].location);
           window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
           return;
      }
      const origin = encodeURIComponent(validItems[0].location);
      const destination = encodeURIComponent(validItems[validItems.length - 1].location);
      const waypoints = validItems.slice(1, -1).slice(0, 9).map(i => encodeURIComponent(i.location)).join('|');
      let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`;
      if (waypoints) url += `&waypoints=${waypoints}`;
      window.open(url, '_blank');
  };

  // --- Auto-Sort Logic ---
  const sortItems = (items: ItineraryItem[]) => [...items].sort((a, b) => a.time.localeCompare(b.time));
  const handleUpdateItem = (updatedItem: ItineraryItem) => {
    setItinerary(prev => prev.map(day => {
      if (day.dayId !== selectedDay) return day;
      const newItems = day.items.map(item => item.id === updatedItem.id ? updatedItem : item);
      return { ...day, items: sortItems(newItems) };
    }));
  };
  const handleDeleteItem = (itemId: string) => {
    setItinerary(prev => prev.map(day => {
        if (day.dayId !== selectedDay) return day;
        return { ...day, items: day.items.filter(item => item.id !== itemId) };
    }));
  };
  const handleAddItem = () => {
    const newItem: ItineraryItem = {
        id: `${selectedDay}-${Date.now()}`,
        time: '12:00',
        title: 'New Activity',
        location: 'TBD',
        type: ItemType.SIGHTSEEING,
        description: 'Description...',
        navQuery: 'Tokyo',
        tags: []
    };
    setItinerary(prev => prev.map(day => {
        if (day.dayId !== selectedDay) return day;
        const newItems = [...day.items, newItem];
        return { ...day, items: sortItems(newItems) };
    }));
  };

  // --- Day/Util Handlers ---
  const handleAddDay = () => {
      const newDayId = itinerary.length + 1;
      let nextDate = new Date();
      if (itinerary.length > 0) {
          const lastDateStr = itinerary[itinerary.length - 1].date.split(' ')[0];
          const lastDate = new Date(lastDateStr);
          if (!isNaN(lastDate.getTime())) { lastDate.setDate(lastDate.getDate() + 1); nextDate = lastDate; }
      }
      const newDay: DayPlan = { dayId: newDayId, date: nextDate.toISOString().split('T')[0], items: [] };
      setItinerary(prev => [...prev, newDay]);
      setSelectedDay(newDayId);
  };
  const handleDeleteDay = () => {
      if (itinerary.length <= 1) { alert("Keep one day."); return; }
      const reindexed = itinerary.filter(d => d.dayId !== selectedDay).map((day, index) => ({ ...day, dayId: index + 1 }));
      setItinerary(reindexed);
      setSelectedDay(1);
  };
  const handleUpdateDayDate = (newDate: string) => setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, date: newDate } : d));

  const handleAddFlight = () => setFlights(prev => [...prev, { id: `f-${Date.now()}`, flightNumber: 'FL 000', departureDate: '2024-01-01', departureTime: '00:00', departureAirport: 'DEP', arrivalDate: '2024-01-01', arrivalTime: '00:00', arrivalAirport: 'ARR' }]);
  const handleUpdateFlight = (u: FlightInfo) => setFlights(prev => prev.map(f => f.id === u.id ? u : f));
  const handleDeleteFlight = (id: string) => setFlights(prev => prev.filter(f => f.id !== id));
  const handleAddHotel = () => setHotels(prev => [...prev, { id: `h-${Date.now()}`, name: 'New Hotel', address: 'Address', checkIn: '2024-01-01', checkOut: '2024-01-05', bookingRef: '' }]);
  const handleUpdateHotel = (u: HotelInfo) => setHotels(prev => prev.map(h => h.id === u.id ? u : h));
  const handleDeleteHotel = (id: string) => setHotels(prev => prev.filter(h => h.id !== id));
  const handleAddBudget = () => setBudget(prev => [...prev, { id: `b-${Date.now()}`, item: 'Expense', cost: 0, category: 'Misc', currency: Currency.JPY }]);
  const handleUpdateBudget = (u: BudgetProps) => setBudget(prev => prev.map(b => b.id === u.id ? u : b));
  const handleDeleteBudget = (id: string) => setBudget(prev => prev.filter(b => b.id !== id));
  const handleAddContact = () => setContacts(prev => [...prev, { id: `c-${Date.now()}`, name: 'Contact', number: '', note: '' }]);
  const handleUpdateContact = (u: EmergencyContact) => setContacts(prev => prev.map(c => c.id === u.id ? u : c));
  const handleDeleteContact = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));
  
  // Checklist Handlers
  const handleAddChecklist = (text: string) => setChecklist(prev => [...prev, { id: `cl-${Date.now()}`, text, checked: false }]);
  const handleToggleChecklist = (id: string) => setChecklist(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const handleDeleteChecklist = (id: string) => setChecklist(prev => prev.filter(i => i.id !== id));

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const startEditingDate = () => { setTempDate(currentDayPlan.date.split(' ')[0]); setIsEditingDate(true); };
  const saveDate = () => { if(tempDate) handleUpdateDayDate(tempDate); setIsEditingDate(false); };
  const getFormattedDate = (dateStr: string) => {
      if (!dateStr) return "N/A";
      const parts = dateStr.split(' ')[0].split('-');
      if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
      return dateStr;
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-neutral-200 font-sans relative">
      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">✕</button>
                  <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">Settings</h3>
                  <div className="space-y-6">
                      <div>
                          <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Sync / Share Trip</h4>
                          <p className="text-[9px] text-neutral-400 mb-3 leading-relaxed">Copy the code below.</p>
                          <button onClick={handleExport} className="w-full bg-white text-black py-2 rounded-lg text-xs font-bold mb-4 active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase"><span>📋 Copy Trip Data</span></button>
                          <div className="relative">
                              <input value={importData} onChange={(e) => setImportData(e.target.value)} placeholder="Paste code..." className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:border-white outline-none pr-16" />
                              <button onClick={handleImport} disabled={!importData} className="absolute right-1 top-1 bottom-1 bg-neutral-800 text-white px-3 rounded text-[10px] font-bold disabled:opacity-50 hover:bg-neutral-700">LOAD</button>
                          </div>
                      </div>
                      
                      <div className="border-t border-neutral-800 pt-4 mt-4">
                        <h4 className="text-[10px] text-red-500 font-bold uppercase mb-2">Danger Zone</h4>
                        <button onClick={handleDeleteTrip} className="w-full border border-red-900/50 bg-red-950/20 text-red-400 py-3 rounded-lg text-xs font-bold hover:bg-red-900/40 uppercase transition-colors">
                            🗑️ Delete Current Trip
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Flag Selector Modal */}
      {showFlagSelector && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl relative">
                   <button onClick={() => setShowFlagSelector(false)} className="absolute top-3 right-3 text-neutral-500 hover:text-white">✕</button>
                   <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-center">Select Country</h3>
                   <div className="grid grid-cols-5 gap-3">
                       {FLAGS.map(flag => (
                           <button key={flag} onClick={() => handleSelectFlag(flag)} className="text-2xl hover:scale-125 transition-transform p-1">{flag}</button>
                       ))}
                   </div>
               </div>
          </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-2 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider">Trip to</span>
             {isEditingDest ? (
                 <input autoFocus className="bg-transparent text-lg font-bold text-white tracking-widest w-[100px] border-b border-white outline-none uppercase" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} onBlur={() => setIsEditingDest(false)} />
             ) : (
                <h1 onClick={() => setIsEditingDest(true)} className="text-lg font-bold tracking-widest text-white cursor-pointer active:opacity-50 border-b border-transparent hover:border-neutral-700 transition-all uppercase">{destination}</h1>
             )}
          </div>
          <div className="flex gap-3 items-center">
              <button onClick={() => setShowSettings(true)} className="text-neutral-500 hover:text-white text-[10px] uppercase">SHARE</button>
              <div onClick={handleFlagClick} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center cursor-pointer active:opacity-70 transition-transform hover:scale-105 shadow-glow text-lg">
                {userFlag}
              </div>
          </div>
        </div>
        
        {/* Day Selector */}
        {activeTab === Tab.ITINERARY && (
            <div className="flex px-5 pb-2 overflow-x-auto no-scrollbar gap-2 items-center">
                {itinerary.map(day => (
                    <button key={day.dayId} onClick={() => setSelectedDay(day.dayId)} className={`flex flex-col items-center min-w-[44px] p-1.5 rounded-lg transition-all border ${selectedDay === day.dayId ? 'bg-neutral-100 text-black border-neutral-100 shadow-glow' : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider">Day {day.dayId}</span>
                        <span className="text-xs font-bold font-mono">{getFormattedDate(day.date)}</span>
                    </button>
                ))}
                <button onClick={handleAddDay} className="flex flex-col items-center justify-center min-w-[36px] h-[40px] rounded-lg border border-dashed border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500 transition"><span className="text-base font-bold">+</span></button>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-3 pt-[130px] max-w-lg mx-auto">
        {activeTab === Tab.ITINERARY ? (
            <>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-white uppercase tracking-tight">Itinerary</h2>
                             {isEditingDate ? (
                                <div className="flex items-center gap-1">
                                    <input type="date" className="bg-neutral-800 text-[10px] text-white p-1 rounded border border-neutral-700 outline-none w-[100px] [color-scheme:dark]" value={tempDate} onChange={e => setTempDate(e.target.value)} />
                                    <button onClick={saveDate} className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded">OK</button>
                                </div>
                            ) : (
                                <button onClick={startEditingDate} className="flex items-center gap-1 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded hover:border-neutral-600 transition-colors group">
                                    <span className="font-mono text-[10px] text-neutral-400">{currentDayPlan.date.split(' ')[0]}</span> 
                                    <span className="text-neutral-600 text-[8px] group-hover:text-white transition-colors">✎</span>
                                </button>
                            )}
                        </div>
                        {itinerary.length > 1 && (<button onClick={handleDeleteDay} className="mt-1 text-[9px] text-red-900 hover:text-red-500 transition-colors flex items-center gap-1 uppercase">🗑️ Delete Day</button>)}
                    </div>
                    {currentDayPlan.weatherSummary && (
                         <div className="text-right pt-0.5"><div className="text-lg">☁️</div><div className="text-[9px] text-neutral-400 max-w-[80px] leading-tight mt-0.5">{currentDayPlan.weatherSummary}</div></div>
                    )}
                </div>

                <div className="flex gap-2 mb-4">
                    <button onClick={handleMapRoute} className="flex-1 bg-neutral-100 border border-white text-black py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-neutral-300 transition-all active:scale-[0.98] uppercase">
                        🗺️ MAP ROUTE
                    </button>
                    <button onClick={handleEnrichItinerary} disabled={isLoading} className="flex-1 bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700 text-neutral-300 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold hover:border-neutral-500 transition-all active:scale-[0.98] uppercase">
                        {isLoading ? <span className="animate-pulse">Analyzing...</span> : <><span>✨ AI GUIDE CHECK</span></>}
                    </button>
                    {currentDayPlan.backupItems && (
                        <button onClick={handleResetDay} className="w-16 bg-neutral-900 border border-neutral-800 text-red-400 py-2 rounded-lg text-[10px] font-bold hover:border-red-900 hover:bg-red-950/20 uppercase">RESET</button>
                    )}
                </div>

                <div className="relative pl-0.5">
                    {currentDayPlan.items.map((item, index) => (
                        <ItineraryCard key={item.id} item={item} isLast={index === currentDayPlan.items.length - 1} onSave={handleUpdateItem} onDelete={handleDeleteItem} />
                    ))}
                    <div className="flex gap-2 mb-8 mt-2 relative group">
                        <div className="absolute left-[13px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
                        <div className="flex flex-col items-center min-w-[28px] z-10 opacity-50"><div className="w-7 h-7 rounded-full border border-neutral-800 border-dashed flex items-center justify-center"><span className="text-neutral-500 text-[10px]">+</span></div></div>
                        <button onClick={handleAddItem} className="flex-1 h-10 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all active:scale-95 uppercase text-[9px] font-bold tracking-widest">+ ADD ACTIVITY</button>
                    </div>
                </div>
            </>
        ) : activeTab === Tab.UTILITIES ? (
            <>
                 <h2 className="text-base font-bold text-white mb-3 uppercase tracking-tight">Trip Utilities</h2>
                 <Utilities 
                    budget={budget} 
                    flights={flights} 
                    hotels={hotels} 
                    contacts={contacts} 
                    checklist={checklist}
                    totalBudget={totalBudget}
                    rates={exchangeRates} 
                    onUpdateFlight={handleUpdateFlight} 
                    onUpdateHotel={handleUpdateHotel} 
                    onAddFlight={handleAddFlight} 
                    onAddHotel={handleAddHotel} 
                    onDeleteFlight={handleDeleteFlight} 
                    onDeleteHotel={handleDeleteHotel} 
                    onAddBudget={handleAddBudget} 
                    onUpdateBudget={handleUpdateBudget} 
                    onDeleteBudget={handleDeleteBudget} 
                    onAddContact={handleAddContact} 
                    onUpdateContact={handleUpdateContact} 
                    onDeleteContact={handleDeleteContact}
                    onUpdateTotalBudget={setTotalBudget}
                    onAddChecklist={handleAddChecklist}
                    onToggleChecklist={handleToggleChecklist}
                    onDeleteChecklist={handleDeleteChecklist}
                    onAiChecklist={handleAiChecklist}
                    isLoadingAi={isLoading}
                />
            </>
        ) : (
            <>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">My Trips</h2>
                    <button onClick={handleCreateTrip} className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded active:scale-95 transition-transform uppercase">+ New Trip</button>
                </div>
                <div className="grid gap-2">
                    {trips.map(trip => (
                        <div key={trip.id} onClick={() => { setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} className={`relative p-4 rounded-xl border transition-all cursor-pointer group overflow-hidden ${activeTripId === trip.id ? 'bg-neutral-100 border-white' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'}`}>
                             <div className={`absolute -right-4 -bottom-4 text-[60px] font-black opacity-5 pointer-events-none ${activeTripId === trip.id ? 'text-black' : 'text-white'}`}>
                                 {trip.destination.substring(0, 3).toUpperCase()}
                             </div>
                             <div className="relative z-10 flex justify-between items-start">
                                 <div>
                                     <div className={`text-[9px] font-bold tracking-widest mb-0.5 ${activeTripId === trip.id ? 'text-neutral-500' : 'text-neutral-500'}`}>{trip.startDate}</div>
                                     <h3 className={`text-xl font-black uppercase tracking-tight leading-none mb-0.5 ${activeTripId === trip.id ? 'text-black' : 'text-white'}`}>{trip.destination}</h3>
                                     <div className={`text-[9px] font-medium ${activeTripId === trip.id ? 'text-neutral-600' : 'text-neutral-400'}`}>{trip.itinerary.length} Days • {trip.flights.length} Flights</div>
                                 </div>
                                 {activeTripId === trip.id && <span className="bg-black text-white text-[8px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                             </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </main>

      <div className="fixed bottom-[70px] w-full text-center pointer-events-none z-0">
          <span className="text-[8px] text-neutral-500 font-mono tracking-widest uppercase opacity-50">COPYRIGHT KH 2025</span>
      </div>

      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
            <button onClick={() => setActiveTab(Tab.ITINERARY)} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[8px] font-medium uppercase tracking-wider">Schedule</span>
            </button>
            <button onClick={() => setActiveTab(Tab.TRIPS)} className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg active:scale-95 transition-all ${activeTab === Tab.TRIPS ? 'bg-white text-black shadow-white/20' : 'bg-neutral-800 text-neutral-400 shadow-black border border-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </button>
            <button onClick={() => setActiveTab(Tab.UTILITIES)} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-[8px] font-medium uppercase tracking-wider">Wallet</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

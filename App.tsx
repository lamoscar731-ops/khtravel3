
import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CITIES, TRANSLATIONS, EMERGENCY_DATA } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip, ChecklistItem, AfterPartyRec, SOSContact, Language, ToGoItem } from './types';
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

  // --- Date/View Control ---
  // selectedDay 0 is reserved for "TO GO" view
  const [selectedDay, setSelectedDay] = useState<number>(1);

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
          totalBudget: 20000,
          checklist: [],
          toGoList: [],
          notes: '',
          coverImage: ''
      }];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
      return localStorage.getItem('kuro_active_trip_id') || (trips.length > 0 ? trips[0].id : '');
  });

  const [destination, setDestination] = useState<string>('TOKYO');
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [budget, setBudget] = useState<BudgetProps[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [toGoList, setToGoList] = useState<ToGoItem[]>([]);
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
          setToGoList(currentTrip.toGoList || []);
          setTotalBudget(currentTrip.totalBudget || 20000);
          setChecklist(currentTrip.checklist || []);
          setTripNotes(currentTrip.notes || '');
          setCoverImage(currentTrip.coverImage || '');
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
                      ...t, 
                      destination, 
                      itinerary, 
                      flights, 
                      hotels, 
                      budget, 
                      contacts, 
                      toGoList,
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
  }, [destination, itinerary, flights, hotels, budget, contacts, toGoList, totalBudget, checklist, tripNotes, coverImage]);

  useEffect(() => { localStorage.setItem('kuro_flag', userFlag); }, [userFlag]);

  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });

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
          totalBudget: 20000,
          checklist: [],
          toGoList: [],
          notes: '',
          coverImage: ''
      };
      setTrips(prev => [...prev, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
      setSelectedDay(1);
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

  const [showSettings, setShowSettings] = useState(false);
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDestSelector, setShowDestSelector] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [importData, setImportData] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const handleFlagClick = () => { vibrate(); setShowFlagSelector(true); };
  const handleSelectFlag = (flag: string) => { vibrate(); setUserFlag(flag); setShowFlagSelector(false); };

  const handleSelectDestination = (city: string) => {
      vibrate();
      setDestination(city);
      setShowDestSelector(false);
      let foundCountry = '';
      for (const [country, cities] of Object.entries(COUNTRY_CITIES)) {
          if (cities.includes(city)) {
              foundCountry = country;
              break;
          }
      }
      if (foundCountry && EMERGENCY_DATA[foundCountry]) {
          const staticContacts = EMERGENCY_DATA[foundCountry];
          setContacts(prev => {
              const existingNums = new Set(prev.map(c => c.number));
              const newContacts = staticContacts.filter(c => !existingNums.has(c.number)).map(c => ({
                  id: `sos-${Date.now()}-${Math.random()}`,
                  ...c
              }));
              return [...prev, ...newContacts];
          });
      }
  };

  const handleEnrichItinerary = async () => {
    vibrate();
    setIsLoading(true);
    try {
        const itemsBackup = JSON.parse(JSON.stringify(currentDayPlan.items));
        const planToEnrich = { ...currentDayPlan };
        const enrichedPlan = await enrichItineraryWithGemini(planToEnrich, lang);
        enrichedPlan.backupItems = itemsBackup;
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enrichedPlan : day));
    } catch (e) {
        alert("AI Offline.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleMapRoute = () => {
      vibrate();
      let validItems = currentDayPlan.items.filter(i => i.location && i.location.trim() !== '' && !i.location.includes('TBD'));
      if (isSelectMode && selectedItemIds.size > 0) validItems = validItems.filter(item => selectedItemIds.has(item.id));
      if (validItems.length === 0) { alert("Select items with locations."); return; }
      if (validItems.length === 1) { const query = encodeURIComponent(validItems[0].location); window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank'); return; }
      const origin = encodeURIComponent(validItems[0].location);
      const destinationLoc = encodeURIComponent(validItems[validItems.length - 1].location);
      const waypoints = validItems.slice(1, -1).slice(0, 9).map(i => encodeURIComponent(i.location)).join('|');
      let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destinationLoc}&travelmode=walking`; 
      if (waypoints) url += `&waypoints=${waypoints}`;
      window.open(url, '_blank');
  };

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
    vibrate();
    const newItem: ItineraryItem = { id: `${selectedDay}-${Date.now()}`, time: '12:00', title: lang === 'TC' ? '新活動' : 'New Activity', location: 'TBD', type: ItemType.SIGHTSEEING, description: '...', navQuery: destination, tags: [] };
    setItinerary(prev => prev.map(day => { if (day.dayId !== selectedDay) return day; const newItems = [...day.items, newItem]; return { ...day, items: sortItems(newItems) }; }));
  };

  const handleAddDay = () => { vibrate(); const newDayId = itinerary.length + 1; let nextDate = new Date(); if (itinerary.length > 0) { const lastDateStr = itinerary[itinerary.length - 1].date.split(' ')[0]; const lastDate = new Date(lastDateStr); if (!isNaN(lastDate.getTime())) { lastDate.setDate(lastDate.getDate() + 1); nextDate = lastDate; } } const newDay: DayPlan = { dayId: newDayId, date: nextDate.toISOString().split('T')[0], items: [] }; setItinerary(prev => [...prev, newDay]); setSelectedDay(newDayId); };
  const handleDeleteDay = () => { vibrate(); if (itinerary.length <= 1) { alert("Keep one day."); return; } const reindexed = itinerary.filter(d => d.dayId !== selectedDay).map((day, index) => ({ ...day, dayId: index + 1 })); setItinerary(reindexed); setSelectedDay(1); };
  
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const startEditingDate = () => { setTempDate(currentDayPlan.date.split(' ')[0]); setIsEditingDate(true); };
  const saveDate = () => { if(tempDate) setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, date: tempDate } : d)); setIsEditingDate(false); };
  
  const getFormattedDate = (dateStr: string) => { if (!dateStr || dateStr === 'N/A') return "N/A"; const parts = dateStr.split(' ')[0].split('-'); if (parts.length >= 3) return `${parts[1]}/${parts[2]}`; return dateStr; };

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const handleToggleItemSelection = (id: string) => { vibrate(); const newSet = new Set(selectedItemIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedItemIds(newSet); };

  // --- TO GO Handlers ---
  const [newToGo, setNewToGo] = useState({ place: '', remarks: '' });
  const handleAddToGo = () => {
      if (!newToGo.place.trim()) return;
      vibrate();
      setToGoList(prev => [...prev, { id: `togo-${Date.now()}`, ...newToGo }]);
      setNewToGo({ place: '', remarks: '' });
  };
  const handleDeleteToGo = (id: string) => {
      vibrate();
      setToGoList(prev => prev.filter(item => item.id !== id));
  };
  const handleInsertToGo = (item: ToGoItem, targetDayId: number) => {
      vibrate();
      const newItem: ItineraryItem = {
          id: `${targetDayId}-${Date.now()}`,
          time: '12:00',
          title: item.place,
          location: item.place,
          type: ItemType.SIGHTSEEING,
          description: item.remarks,
          navQuery: item.place,
          tags: [{ label: 'Imported', color: 'gray' }]
      };
      setItinerary(prev => prev.map(day => {
          if (day.dayId === targetDayId) {
              return { ...day, items: sortItems([...day.items, newItem]) };
          }
          return day;
      }));
      setToGoList(prev => prev.filter(i => i.id !== item.id));
      setSelectedDay(targetDayId);
  };

  // --- Utility Handlers ---
  const handleAddFlight = () => {
    vibrate();
    const newFlight: FlightInfo = {
      id: `f-${Date.now()}`,
      flightNumber: 'Flight No',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '00:00',
      departureAirport: 'DEP',
      arrivalDate: new Date().toISOString().split('T')[0],
      arrivalTime: '00:00',
      arrivalAirport: 'ARR'
    };
    setFlights(prev => [...prev, newFlight]);
  };
  const handleUpdateFlight = (data: FlightInfo) => setFlights(prev => prev.map(f => f.id === data.id ? data : f));
  const handleDeleteFlight = (id: string) => setFlights(prev => prev.filter(f => f.id !== id));

  const handleAddHotel = () => {
    vibrate();
    const newHotel: HotelInfo = {
      id: `h-${Date.now()}`,
      name: 'New Hotel',
      address: 'Address',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date().toISOString().split('T')[0],
      bookingRef: 'REF-000'
    };
    setHotels(prev => [...prev, newHotel]);
  };
  const handleUpdateHotel = (data: HotelInfo) => setHotels(prev => prev.map(h => h.id === data.id ? data : h));
  const handleDeleteHotel = (id: string) => setHotels(prev => prev.filter(h => h.id !== id));

  const handleAddBudget = () => {
    vibrate();
    const newItem: BudgetProps = {
      id: `b-${Date.now()}`,
      item: 'New Expense',
      cost: 0,
      category: 'Misc',
      currency: Currency.HKD
    };
    setBudget(prev => [...prev, newItem]);
  };
  const handleUpdateBudget = (item: BudgetProps) => setBudget(prev => prev.map(b => b.id === item.id ? item : b));
  const handleDeleteBudget = (id: string) => setBudget(prev => prev.filter(b => b.id !== id));

  const handleAddContact = () => {
    vibrate();
    const newContact: EmergencyContact = {
      id: `c-${Date.now()}`,
      name: 'New Contact',
      number: '000',
      note: 'Note'
    };
    setContacts(prev => [...prev, newContact]);
  };
  const handleUpdateContact = (item: EmergencyContact) => setContacts(prev => prev.map(c => c.id === item.id ? item : c));
  const handleDeleteContact = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));

  const handleAddChecklist = (text: string) => {
    const newItem: ChecklistItem = { id: `cl-${Date.now()}`, text, checked: false };
    setChecklist(prev => [...prev, newItem]);
  };
  const handleToggleChecklist = (id: string) => setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  const handleDeleteChecklist = (id: string) => setChecklist(prev => prev.filter(item => item.id !== id));

  const handleAiChecklist = async () => {
      vibrate();
      setIsLoading(true);
      try {
          const suggestions = await generatePackingList(destination, lang);
          const newItems = suggestions.map(text => ({ id: `ai-cl-${Date.now()}-${Math.random()}`, text, checked: false }));
          setChecklist(prev => [...prev, ...newItems]);
      } catch (e) {
          console.error(e);
          alert("AI Error");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-neutral-200 font-sans relative">
      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-y-auto max-h-[80vh]">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">✕</button>
                  <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">{T.SETTINGS[lang]}</h3>
                  <div className="absolute top-4 left-6 flex gap-2">
                      <button onClick={() => { vibrate(); setLang('EN'); }} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${lang === 'EN' ? 'bg-white text-black' : 'text-neutral-500 border border-neutral-700'}`}>EN</button>
                      <button onClick={() => { vibrate(); setLang('TC'); }} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${lang === 'TC' ? 'bg-white text-black' : 'text-neutral-500 border border-neutral-700'}`}>繁</button>
                  </div>
                  <div className="space-y-6 mt-4">
                      <div>
                          <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">{T.TRIP_COVER[lang]}</h4>
                          <div className="flex gap-2 h-10">
                              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="URL..." className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 text-xs text-white placeholder-neutral-600 focus:border-white outline-none h-full" />
                              <button onClick={() => coverInputRef.current?.click()} className="bg-neutral-800 border border-neutral-700 text-white px-4 rounded-lg text-[10px] font-bold whitespace-nowrap h-full flex items-center justify-center">{T.UPLOAD[lang]}</button>
                              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setCoverImage(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                  }
                              }} />
                          </div>
                      </div>
                      <div>
                          <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">{T.SYNC_SHARE[lang]}</h4>
                          <button onClick={() => { vibrate(); navigator.clipboard.writeText(btoa(JSON.stringify(trips.find(t => t.id === activeTripId)))).then(() => alert("Copied!")); }} className="w-full bg-white text-black py-2 rounded-lg text-xs font-bold mb-4 active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase"><span>📋 {T.COPY_CODE[lang]}</span></button>
                          <div className="relative mb-4 h-10">
                              <input value={importData} onChange={(e) => setImportData(e.target.value)} placeholder="Paste code..." className="w-full h-full bg-black border border-neutral-700 rounded-lg px-3 text-xs text-white placeholder-neutral-600 focus:border-white outline-none pr-16" />
                              <button onClick={() => { vibrate(); try { const d = JSON.parse(atob(importData)); setTrips(prev => [...prev, { ...d, id: `trip-imp-${Date.now()}` }]); alert("Imported!"); setShowSettings(false); } catch(e){alert("Error");} }} className="absolute right-1 top-1 bottom-1 bg-neutral-800 text-white px-3 rounded-lg text-[10px] font-bold disabled:opacity-50 hover:bg-neutral-700 flex items-center">{T.LOAD[lang]}</button>
                          </div>
                      </div>
                      <div className="border-t border-neutral-800 pt-4 mt-4">
                        <button onClick={handleDeleteTrip} className="w-full border border-red-900/50 bg-red-950/20 text-red-400 py-3 rounded-lg text-xs font-bold hover:bg-red-900/40 uppercase transition-colors">🗑️ {T.DELETE_TRIP[lang]}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-2 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2" onClick={() => { vibrate(); setShowDestSelector(true); }}>
             <span className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider">{T.TRIP_TO[lang]}</span>
             <h1 className="text-lg font-bold tracking-widest text-white cursor-pointer active:opacity-50 border-b border-transparent hover:border-neutral-700 transition-all uppercase flex items-center gap-1">
                 {destination} <span className="text-[8px] text-neutral-600">▼</span>
             </h1>
          </div>
          <div className="flex gap-4 items-center">
              <button onClick={() => setShowSettings(true)} className="text-neutral-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
              <div onClick={handleFlagClick} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center cursor-pointer active:opacity-70 transition-transform hover:scale-105 shadow-glow text-lg">
                {userFlag}
              </div>
          </div>
        </div>
        
        {activeTab === Tab.ITINERARY && (
            <div className="flex px-5 pb-2 overflow-x-auto no-scrollbar gap-2 items-center">
                {/* TO GO Tab Button - ALWAYS FIRST */}
                <button 
                  onClick={() => { vibrate(); setSelectedDay(0); }} 
                  className={`flex flex-col items-center min-w-[48px] p-1.5 rounded-lg transition-all border ${selectedDay === 0 ? 'bg-amber-100 text-black border-amber-100 shadow-glow' : 'bg-neutral-900 text-amber-500 border-amber-900/50 hover:border-amber-700'}`}
                >
                    <span className="text-[8px] uppercase font-bold tracking-widest">TO GO</span>
                    <span className="text-xs font-bold font-mono">POOL</span>
                </button>

                {itinerary.map(day => (
                    <button key={day.dayId} onClick={() => { vibrate(); setSelectedDay(day.dayId); }} className={`flex flex-col items-center min-w-[44px] p-1.5 rounded-lg transition-all border ${selectedDay === day.dayId ? 'bg-neutral-100 text-black border-neutral-100 shadow-glow' : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider">{T.DAY[lang]} {day.dayId}</span>
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
            selectedDay === 0 ? (
                /* --- TO GO VIEW --- */
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold text-amber-500 uppercase tracking-tight">Bucket List (To Go)</h2>
                    </div>
                    
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6">
                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] text-neutral-500 uppercase font-bold mb-1 block">Place Name</label>
                                <input 
                                    value={newToGo.place} 
                                    onChange={e => setNewToGo({...newToGo, place: e.target.value})} 
                                    className="w-full bg-black border-b border-neutral-800 text-white text-xs py-1 focus:outline-none focus:border-amber-500" 
                                    placeholder="e.g. Ichiran Ramen Shibuya"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-neutral-500 uppercase font-bold mb-1 block">Remarks</label>
                                <input 
                                    value={newToGo.remarks} 
                                    onChange={e => setNewToGo({...newToGo, remarks: e.target.value})} 
                                    className="w-full bg-black border-b border-neutral-800 text-neutral-400 text-xs py-1 focus:outline-none focus:border-amber-500" 
                                    placeholder="e.g. Open 24h, queue is long"
                                />
                            </div>
                            <button 
                                onClick={handleAddToGo} 
                                className="w-full bg-amber-500 text-black py-2 rounded-lg text-[10px] font-bold uppercase active:scale-95 transition-transform"
                            >
                                + Add to Pool
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {toGoList.length === 0 ? (
                            <div className="text-center py-20 text-neutral-800 text-[10px] tracking-widest uppercase">Bucket is empty</div>
                        ) : (
                            toGoList.map(item => (
                                <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center group">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm font-bold text-white truncate">{item.place}</h4>
                                        <p className="text-[10px] text-neutral-500 truncate">{item.remarks || "No remarks"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative group/insert">
                                            <button className="bg-neutral-100 text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase active:scale-90 transition-all flex items-center gap-1">
                                                INSERT
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"></path><path d="M12 19V5"></path></svg>
                                            </button>
                                            {/* Quick Dropdown for Day Selection */}
                                            <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl opacity-0 group-hover/insert:opacity-100 pointer-events-none group-hover/insert:pointer-events-auto transition-all z-[100] min-w-[80px] p-1">
                                                {itinerary.map(day => (
                                                    <button 
                                                      key={day.dayId} 
                                                      onClick={() => handleInsertToGo(item, day.dayId)}
                                                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 rounded text-[9px] font-bold text-neutral-300"
                                                    >
                                                        DAY {day.dayId}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteToGo(item.id)} className="p-2 text-neutral-700 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                /* --- ITINERARY VIEW --- */
                <>
                    <div className="flex flex-col mb-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-white uppercase tracking-tight">{T.ITINERARY[lang]}</h2>
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
                                {itinerary.length > 1 && (<button onClick={handleDeleteDay} className="mt-1 text-[9px] text-red-900 hover:text-red-500 transition-colors flex items-center gap-1 uppercase">🗑️ {T.DELETE[lang]} Day</button>)}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button onClick={handleMapRoute} className="flex-1 bg-neutral-100 border border-white text-black py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-neutral-300 transition-all active:scale-[0.98] uppercase">
                            🗺️ {T.MAP_ROUTE[lang]}
                        </button>
                        <button onClick={handleEnrichItinerary} disabled={isLoading} className="flex-1 bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700 text-neutral-300 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold hover:border-neutral-500 transition-all active:scale-[0.98] uppercase">
                            {isLoading ? <span className="animate-pulse">Thinking...</span> : <><span>✨ {T.AI_CHECK[lang]}</span></>}
                        </button>
                    </div>

                    <div className="relative pl-0.5">
                        {currentDayPlan.items.map((item, index) => (
                            <ItineraryCard 
                                key={item.id} 
                                item={item} 
                                isLast={index === currentDayPlan.items.length - 1} 
                                onSave={handleUpdateItem} 
                                onDelete={handleDeleteItem} 
                                isSelectMode={isSelectMode}
                                isSelected={selectedItemIds.has(item.id)}
                                onSelect={handleToggleItemSelection}
                                isActive={isLiveItem(item, index, currentDayPlan.items)}
                                lang={lang}
                            />
                        ))}
                        
                        <div className="flex flex-col gap-2 mb-4 mt-2 relative">
                            <div className="absolute left-[13px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
                            <div className="flex gap-2">
                                <button onClick={handleAddItem} className="flex-1 h-10 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all active:scale-95 uppercase text-[9px] font-bold tracking-widest">+ {T.ADD_ACTIVITY[lang]}</button>
                                
                                {toGoList.length > 0 && (
                                    <button 
                                        onClick={() => { vibrate(); setSelectedDay(0); }} 
                                        className="px-4 h-10 border border-dashed border-amber-900 text-amber-500 rounded-lg flex items-center justify-center hover:bg-amber-900/10 transition-all active:scale-95 uppercase text-[9px] font-bold tracking-widest"
                                    >
                                        IMPORT FROM TO GO ({toGoList.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
        ) : activeTab === Tab.UTILITIES ? (
            <>
                 <h2 className="text-base font-bold text-white mb-3 uppercase tracking-tight">{T.WALLET[lang]} / {T.ITINERARY[lang]}</h2>
                 <Utilities 
                    budget={budget} flights={flights} hotels={hotels} contacts={contacts} checklist={checklist} totalBudget={totalBudget} rates={exchangeRates} 
                    onUpdateFlight={handleUpdateFlight} onUpdateHotel={handleUpdateHotel} onAddFlight={handleAddFlight} onAddHotel={handleAddHotel} onDeleteFlight={handleDeleteFlight} onDeleteHotel={handleDeleteHotel} 
                    onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} onAddContact={handleAddContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact}
                    onUpdateTotalBudget={setTotalBudget} onAddChecklist={handleAddChecklist} onToggleChecklist={handleToggleChecklist} onDeleteChecklist={handleDeleteChecklist} onAiChecklist={handleAiChecklist} isLoadingAi={isLoading} lang={lang}
                />
            </>
        ) : (
            <>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">{T.MY_TRIPS[lang]}</h2>
                    <button onClick={handleCreateTrip} className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded active:scale-95 transition-transform uppercase">+ {T.NEW_TRIP[lang]}</button>
                </div>
                <div className="grid gap-2">
                    {trips.map(trip => (
                        <div key={trip.id} onClick={() => { vibrate(); setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} className={`relative p-4 rounded-xl border transition-all cursor-pointer group overflow-hidden h-32 flex flex-col justify-between ${activeTripId === trip.id ? 'border-white' : 'border-neutral-800 hover:border-neutral-600'}`} style={trip.coverImage ? { backgroundImage: `url(${trip.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                             <div className={`absolute inset-0 ${trip.coverImage ? 'bg-black/60' : 'bg-neutral-900'} z-0`}></div>
                             <div className="relative z-10 flex justify-between items-start">
                                 <div>
                                     <div className="text-[9px] font-bold tracking-widest mb-0.5 text-neutral-400">{trip.startDate}</div>
                                     <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-0.5 text-white">{trip.destination}</h3>
                                 </div>
                                 {activeTripId === trip.id && <span className="bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded-full">{T.ACTIVE[lang]}</span>}
                             </div>
                             <div className="relative z-10 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{trip.itinerary?.length || 0} {T.DAYS[lang]} . {Math.max(0, (trip.itinerary?.length || 1) - 1)} {T.NIGHTS[lang]}</div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </main>

      {/* Flag Selector Selector Modal */}
      {showFlagSelector && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl relative">
                   <button onClick={() => setShowFlagSelector(false)} className="absolute top-3 right-3 text-neutral-500 hover:text-white">✕</button>
                   <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-center">{T.SELECT_COUNTRY[lang]}</h3>
                   <div className="grid grid-cols-5 gap-3">
                       {FLAGS.map(flag => (
                           <button key={flag} onClick={() => handleSelectFlag(flag)} className="text-2xl hover:scale-125 transition-transform p-1">{flag}</button>
                       ))}
                   </div>
               </div>
          </div>
      )}

      {/* Destination Selector Modal */}
      {showDestSelector && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col p-6 animate-fade-in pt-[calc(env(safe-area-inset-top)+20px)]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white uppercase tracking-wider">{T.SELECT_DEST[lang]}</h3>
                   <button onClick={() => setShowDestSelector(false)} className="text-neutral-500 hover:text-white p-2 text-xl">✕</button>
               </div>
               <input autoFocus className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-white mb-4 w-full outline-none focus:border-white" placeholder="Search city..." value={destSearch} onChange={(e) => setDestSearch(e.target.value)} />
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                   {Object.entries(COUNTRY_CITIES).map(([country, cities]) => {
                       const filteredCities = cities.filter(c => c.toLowerCase().includes(destSearch.toLowerCase()));
                       if (filteredCities.length === 0 && destSearch && country !== "OTHERS") return null;
                       return (
                           <div key={country}>
                               <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2 sticky top-0 bg-black py-1">{country}</h4>
                               {country === "OTHERS" ? (
                                   <button onClick={() => handleSelectDestination(destSearch || "OTHERS")} className="w-full text-left p-3 rounded-lg bg-neutral-800 text-white text-xs font-bold">{destSearch ? `Use "${destSearch}"` : "Type Custom Destination Above"}</button>
                               ) : (
                                   <div className="grid grid-cols-2 gap-2">
                                       {filteredCities.map(city => (
                                           <button key={city} onClick={() => handleSelectDestination(city)} className="text-left p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-xs text-white font-medium active:scale-95 transition-all">{city}</button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       )
                   })}
               </div>
          </div>
      )}

      {showNotes && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col px-6 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      {T.QUICK_NOTES[lang]}
                  </h3>
                  <button onClick={() => setShowNotes(false)} className="text-neutral-500 hover:text-white p-2 text-xl">✕</button>
              </div>
              <textarea className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700 resize-none leading-relaxed placeholder-neutral-700" placeholder="Type anything here..." value={tripNotes} onChange={(e) => setTripNotes(e.target.value)} autoFocus />
          </div>
      )}

      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
            <button onClick={() => { vibrate(); setActiveTab(Tab.ITINERARY); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[8px] font-medium uppercase tracking-wider">{T.SCHEDULE[lang]}</span>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.TRIPS); }} className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg active:scale-95 transition-all ${activeTab === Tab.TRIPS ? 'bg-white text-black shadow-white/20' : 'bg-neutral-800 text-neutral-400 shadow-black border border-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </button>
            <button onClick={() => { vibrate(); setActiveTab(Tab.UTILITIES); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-[8px] font-medium uppercase tracking-wider">{T.WALLET[lang]}</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

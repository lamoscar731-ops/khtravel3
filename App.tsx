import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, Trip } from './types';
import { enrichItineraryWithGemini } from './services/geminiService';

enum Tab { ITINERARY = 'ITINERARY', TRIPS = 'TRIPS', UTILITIES = 'UTILITIES' }

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // --- Multi-Trip State Management ---
  const [trips, setTrips] = useState<Trip[]>(() => {
      // 1. Try to load new multi-trip data
      const savedTrips = localStorage.getItem('kuro_trips');
      if (savedTrips) return JSON.parse(savedTrips);
      
      // 2. Migration Logic: If no trips exist but old single-trip data exists, migrate it.
      const oldItinerary = localStorage.getItem('kuro_itinerary');
      if (oldItinerary) {
          const migratedTrip: Trip = {
              id: `trip-${Date.now()}`,
              destination: localStorage.getItem('kuro_destination') || 'TOKYO',
              startDate: '2023-11-15', // Fallback or extract from itinerary
              itinerary: JSON.parse(oldItinerary),
              flights: JSON.parse(localStorage.getItem('kuro_flights') || JSON.stringify(INITIAL_FLIGHTS)),
              hotels: JSON.parse(localStorage.getItem('kuro_hotels') || JSON.stringify(INITIAL_HOTELS)),
              budget: JSON.parse(localStorage.getItem('kuro_budget') || JSON.stringify(INITIAL_BUDGET)),
              contacts: JSON.parse(localStorage.getItem('kuro_contacts') || JSON.stringify(INITIAL_CONTACTS)),
          };
          return [migratedTrip];
      }

      // 3. Fresh start
      return [{
          id: `trip-${Date.now()}`,
          destination: 'TOKYO',
          startDate: '2024-01-01',
          itinerary: INITIAL_ITINERARY,
          flights: INITIAL_FLIGHTS,
          hotels: INITIAL_HOTELS,
          budget: INITIAL_BUDGET,
          contacts: INITIAL_CONTACTS
      }];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
      return localStorage.getItem('kuro_active_trip_id') || (trips.length > 0 ? trips[0].id : '');
  });

  // --- Active Trip State (Derived from trips, but kept in state for fast UI updates) ---
  // When activeTripId changes, we load data into these states.
  // When these states change, we sync back to the `trips` array.
  
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [destination, setDestination] = useState<string>('TOKYO');
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [budget, setBudget] = useState<BudgetProps[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // User Avatar (Global)
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('kuro_avatar') || "https://ui-avatars.com/api/?name=User&background=222&color=666";
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
          // Reset day selection if out of bounds
          if (selectedDay > currentTrip.itinerary.length) setSelectedDay(1);
      }
      localStorage.setItem('kuro_active_trip_id', activeTripId);
  }, [activeTripId]);

  // --- Sync Changes Back to Trips Array & LocalStorage ---
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
                      contacts
                  };
              }
              return t;
          });
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          return newTrips;
      });
  }, [destination, itinerary, flights, hotels, budget, contacts]); // Dependency on all data parts

  // Save Avatar Separately
  useEffect(() => { localStorage.setItem('kuro_avatar', userAvatar); }, [userAvatar]);


  // --- UI Helpers ---
  const [isEditingDest, setIsEditingDest] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || (itinerary[0] || { dayId: 1, date: 'N/A', items: [] });

  // --- Handlers ---

  const handleCreateTrip = () => {
      const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: 'NEW TRIP',
          startDate: new Date().toISOString().split('T')[0],
          itinerary: INITIAL_ITINERARY, // Start with template
          flights: [],
          hotels: [],
          budget: [],
          contacts: []
      };
      setTrips(prev => [...prev, newTrip]);
      setActiveTripId(newTrip.id);
      setActiveTab(Tab.ITINERARY);
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (trips.length <= 1) {
          alert("You must have at least one trip.");
          return;
      }
      if (confirm("Delete this trip? This cannot be undone.")) {
          const newTrips = trips.filter(t => t.id !== id);
          setTrips(newTrips);
          localStorage.setItem('kuro_trips', JSON.stringify(newTrips));
          if (activeTripId === id) {
              setActiveTripId(newTrips[0].id);
          }
      }
  };

  // --- Avatar / Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [importData, setImportData] = useState('');
  
  const handleAvatarClick = () => setShowSettings(true);
  const triggerFileUpload = () => fileInputRef.current?.click();
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setUserAvatar(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleExport = () => {
      const currentTrip = trips.find(t => t.id === activeTripId);
      if (!currentTrip) return;
      const jsonStr = JSON.stringify(currentTrip);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      navigator.clipboard.writeText(encoded).then(() => alert("Current trip code copied!"));
  };

  const handleImport = () => {
      if (!importData) return;
      try {
          const jsonStr = decodeURIComponent(escape(atob(importData)));
          const data = JSON.parse(jsonStr);
          // Basic validation
          if (!data.itinerary || !data.destination) throw new Error("Invalid format");
          
          const newTrip: Trip = {
              ...data,
              id: `trip-imported-${Date.now()}`, // Force new ID to avoid conflict
              destination: data.destination + ' (Imported)'
          };
          
          setTrips(prev => [...prev, newTrip]);
          setActiveTripId(newTrip.id);
          setShowSettings(false);
          setImportData('');
          alert("Trip imported successfully!");
      } catch (e) {
          alert("Invalid data code.");
      }
  };

  // --- AI Enrichment ---
  const handleEnrichItinerary = async () => {
    setIsLoading(true);
    try {
        const planToEnrich = { ...currentDayPlan };
        const enrichedPlan = await enrichItineraryWithGemini(planToEnrich);
        setItinerary(prev => prev.map(day => day.dayId === selectedDay ? enrichedPlan : day));
    } catch (e) {
        console.error("Failed to enrich", e);
        alert("AI Assistant is offline. Please check your network or API Key.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- Itinerary CRUD ---
  const handleUpdateItem = (updatedItem: ItineraryItem) => {
    setItinerary(prev => prev.map(day => {
      if (day.dayId !== selectedDay) return day;
      return { ...day, items: day.items.map(item => item.id === updatedItem.id ? updatedItem : item) };
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
        return { ...day, items: [...day.items, newItem] };
    }));
  };

  // --- Day Management ---
  const handleAddDay = () => {
      const newDayId = itinerary.length + 1;
      let nextDate = new Date();
      if (itinerary.length > 0) {
          const lastDateStr = itinerary[itinerary.length - 1].date.split(' ')[0];
          const lastDate = new Date(lastDateStr);
          if (!isNaN(lastDate.getTime())) {
              lastDate.setDate(lastDate.getDate() + 1);
              nextDate = lastDate;
          }
      }
      const dateString = nextDate.toISOString().split('T')[0];
      const newDay: DayPlan = { dayId: newDayId, date: dateString, items: [] };
      setItinerary(prev => [...prev, newDay]);
      setSelectedDay(newDayId);
  };

  const handleDeleteDay = () => {
      if (itinerary.length <= 1) {
          alert("Keep at least one day.");
          return;
      }
      const updatedItinerary = itinerary.filter(d => d.dayId !== selectedDay);
      const reindexed = updatedItinerary.map((day, index) => ({ ...day, dayId: index + 1 }));
      setItinerary(reindexed);
      setSelectedDay(1);
  };

  const handleUpdateDayDate = (newDate: string) => {
      setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, date: newDate } : d));
  };

  // --- Utilities CRUD ---
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

  // --- Date Edit Logic ---
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
                  <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-center">Settings</h3>
                  <div className="space-y-6">
                      <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 mx-auto mb-3 overflow-hidden">
                             <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                          </div>
                          <button onClick={triggerFileUpload} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full font-bold">Change Avatar</button>
                      </div>
                      <hr className="border-neutral-800" />
                      <div>
                          <h4 className="text-xs text-neutral-500 font-bold uppercase mb-2">Sync / Share Trip</h4>
                          <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">Share current trip ({destination}) with others.</p>
                          <button onClick={handleExport} className="w-full bg-white text-black py-3 rounded-lg text-sm font-bold mb-4 active:scale-95 transition-transform flex items-center justify-center gap-2"><span>📋 Copy Trip Code</span></button>
                          <div className="relative">
                              <input value={importData} onChange={(e) => setImportData(e.target.value)} placeholder="Paste code to import..." className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:border-white outline-none pr-16" />
                              <button onClick={handleImport} disabled={!importData} className="absolute right-1 top-1 bottom-1 bg-neutral-800 text-white px-3 rounded text-[10px] font-bold disabled:opacity-50 hover:bg-neutral-700">LOAD</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900 pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-3 mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-neutral-500 text-xs font-normal uppercase tracking-wider">Trip to</span>
             {isEditingDest ? (
                 <input autoFocus className="bg-transparent text-lg font-bold text-white tracking-widest w-[100px] border-b border-white outline-none uppercase" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} onBlur={() => setIsEditingDest(false)} />
             ) : (
                <h1 onClick={() => setIsEditingDest(true)} className="text-lg font-bold tracking-widest text-white cursor-pointer active:opacity-50 border-b border-transparent hover:border-neutral-700 transition-all uppercase">{destination}</h1>
             )}
          </div>
          <div onClick={handleAvatarClick} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden cursor-pointer active:opacity-70 transition-transform hover:scale-105 shadow-glow">
            <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>
        
        {/* Day Selector - Only visible on Itinerary Tab */}
        {activeTab === Tab.ITINERARY && (
            <div className="flex px-5 pb-2 overflow-x-auto no-scrollbar gap-3 items-center">
                {itinerary.map(day => (
                    <button key={day.dayId} onClick={() => setSelectedDay(day.dayId)} className={`flex flex-col items-center min-w-[50px] p-1.5 rounded-lg transition-all border ${selectedDay === day.dayId ? 'bg-neutral-100 text-black border-neutral-100 shadow-glow' : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}>
                        <span className="text-[9px] uppercase font-bold tracking-wider">Day {day.dayId}</span>
                        <span className="text-sm font-bold font-mono">{getFormattedDate(day.date)}</span>
                    </button>
                ))}
                <button onClick={handleAddDay} className="flex flex-col items-center justify-center min-w-[40px] h-[48px] rounded-lg border border-dashed border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500 transition"><span className="text-lg font-bold">+</span></button>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 pt-[130px] max-w-lg mx-auto">
        {activeTab === Tab.ITINERARY ? (
            <>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Itinerary</h2>
                             {isEditingDate ? (
                                <div className="flex items-center gap-1">
                                    <input type="date" className="bg-neutral-800 text-xs text-white p-1 rounded border border-neutral-700 outline-none w-[110px] [color-scheme:dark]" value={tempDate} onChange={e => setTempDate(e.target.value)} />
                                    <button onClick={saveDate} className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded">OK</button>
                                </div>
                            ) : (
                                <button onClick={startEditingDate} className="flex items-center gap-1 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded hover:border-neutral-600 transition-colors group">
                                    <span className="font-mono text-xs text-neutral-400">{currentDayPlan.date.split(' ')[0]}</span> 
                                    <span className="text-neutral-600 text-[10px] group-hover:text-white transition-colors">✎</span>
                                </button>
                            )}
                        </div>
                        {itinerary.length > 1 && (<button onClick={handleDeleteDay} className="mt-2 text-[10px] text-red-900 hover:text-red-500 transition-colors flex items-center gap-1">🗑️ Delete Day</button>)}
                    </div>
                    <div className="text-right pt-0.5"><div className="text-xl">☁️</div><div className="text-[9px] text-neutral-400 max-w-[80px] leading-tight mt-0.5">{currentDayPlan.weatherSummary || "Tap AI Check"}</div></div>
                </div>

                <button onClick={handleEnrichItinerary} disabled={isLoading} className="w-full mb-6 bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700 text-neutral-300 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-medium hover:border-neutral-500 transition-all active:scale-[0.98]">
                    {isLoading ? <span className="animate-pulse">Analyzing...</span> : <><span>✨ AI Guide Check</span></>}
                </button>

                <div className="relative pl-0.5">
                    {currentDayPlan.items.map((item, index) => (
                        <ItineraryCard key={item.id} item={item} isLast={index === currentDayPlan.items.length - 1} onSave={handleUpdateItem} onDelete={handleDeleteItem} />
                    ))}
                    <div className="flex gap-3 mb-8 mt-4 relative group">
                        <div className="absolute left-[15px] top-0 bottom-10 w-[2px] bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
                        <div className="flex flex-col items-center min-w-[32px] z-10 opacity-50"><div className="w-8 h-8 rounded-full border border-neutral-800 border-dashed flex items-center justify-center"><span className="text-neutral-500 text-xs">+</span></div></div>
                        <button onClick={handleAddItem} className="flex-1 h-12 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all active:scale-95 uppercase text-[10px] font-bold tracking-widest">+ Add Activity</button>
                    </div>
                </div>
            </>
        ) : activeTab === Tab.UTILITIES ? (
            <>
                 <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-tight">Trip Utilities</h2>
                 <Utilities budget={budget} flights={flights} hotels={hotels} contacts={contacts} onUpdateFlight={handleUpdateFlight} onUpdateHotel={handleUpdateHotel} onAddFlight={handleAddFlight} onAddHotel={handleAddHotel} onDeleteFlight={handleDeleteFlight} onDeleteHotel={handleDeleteHotel} onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} onAddContact={handleAddContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} />
            </>
        ) : (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">My Trips</h2>
                    <button onClick={handleCreateTrip} className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">+ New Trip</button>
                </div>
                <div className="grid gap-3">
                    {trips.map(trip => (
                        <div key={trip.id} onClick={() => { setActiveTripId(trip.id); setActiveTab(Tab.ITINERARY); }} className={`relative p-4 rounded-xl border transition-all cursor-pointer group overflow-hidden ${activeTripId === trip.id ? 'bg-neutral-100 border-white' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'}`}>
                             {/* Background Text Art */}
                             <div className={`absolute -right-4 -bottom-4 text-[80px] font-black opacity-5 pointer-events-none ${activeTripId === trip.id ? 'text-black' : 'text-white'}`}>
                                 {trip.destination.substring(0, 3).toUpperCase()}
                             </div>
                             
                             <div className="relative z-10 flex justify-between items-start">
                                 <div>
                                     <div className={`text-[10px] font-bold tracking-widest mb-1 ${activeTripId === trip.id ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                         {trip.startDate}
                                     </div>
                                     <h3 className={`text-2xl font-black uppercase tracking-tight leading-none mb-1 ${activeTripId === trip.id ? 'text-black' : 'text-white'}`}>
                                         {trip.destination}
                                     </h3>
                                     <div className={`text-[10px] font-medium ${activeTripId === trip.id ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                         {trip.itinerary.length} Days • {trip.flights.length} Flights
                                     </div>
                                 </div>
                                 
                                 {activeTripId === trip.id ? (
                                     <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                                 ) : (
                                     <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="text-neutral-600 hover:text-red-500 p-1 rounded-full border border-transparent hover:border-red-900/30 transition-colors z-20">🗑️</button>
                                 )}
                             </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
            <button onClick={() => setActiveTab(Tab.ITINERARY)} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[9px] font-medium uppercase tracking-wider">Schedule</span>
            </button>
            <button onClick={() => setActiveTab(Tab.TRIPS)} className={`w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg active:scale-95 transition-all ${activeTab === Tab.TRIPS ? 'bg-white text-black shadow-white/20' : 'bg-neutral-800 text-neutral-400 shadow-black border border-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </button>
            <button onClick={() => setActiveTab(Tab.UTILITIES)} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.UTILITIES ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-[9px] font-medium uppercase tracking-wider">Wallet</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

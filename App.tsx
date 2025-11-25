import React, { useState, useEffect, useRef } from 'react';
import { ItineraryCard } from './components/ItineraryCard';
import { Utilities } from './components/Utilities';
import { INITIAL_ITINERARY, INITIAL_BUDGET, INITIAL_FLIGHTS, INITIAL_HOTELS, INITIAL_CONTACTS } from './constants';
import { DayPlan, ItineraryItem, ItemType, BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from './types';
import { enrichItineraryWithGemini } from './services/geminiService';

enum Tab { ITINERARY = 'ITINERARY', UTILITIES = 'UTILITIES' }

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- Persistence Logic ---
  const [itinerary, setItinerary] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem('kuro_itinerary');
    return saved ? JSON.parse(saved) : INITIAL_ITINERARY;
  });

  const [destination, setDestination] = useState<string>(() => {
    return localStorage.getItem('kuro_destination') || "TOKYO";
  });

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('kuro_avatar') || "https://ui-avatars.com/api/?name=User&background=222&color=666";
  });

  const [flights, setFlights] = useState<FlightInfo[]>(() => {
    const saved = localStorage.getItem('kuro_flights');
    return saved ? JSON.parse(saved) : INITIAL_FLIGHTS;
  });

  const [hotels, setHotels] = useState<HotelInfo[]>(() => {
    const saved = localStorage.getItem('kuro_hotels');
    return saved ? JSON.parse(saved) : INITIAL_HOTELS;
  });

  const [budget, setBudget] = useState<BudgetProps[]>(() => {
    const saved = localStorage.getItem('kuro_budget');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('kuro_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  // --- Save to LocalStorage ---
  useEffect(() => { localStorage.setItem('kuro_itinerary', JSON.stringify(itinerary)); }, [itinerary]);
  useEffect(() => { localStorage.setItem('kuro_destination', destination); }, [destination]);
  useEffect(() => { localStorage.setItem('kuro_avatar', userAvatar); }, [userAvatar]);
  useEffect(() => { localStorage.setItem('kuro_flights', JSON.stringify(flights)); }, [flights]);
  useEffect(() => { localStorage.setItem('kuro_hotels', JSON.stringify(hotels)); }, [hotels]);
  useEffect(() => { localStorage.setItem('kuro_budget', JSON.stringify(budget)); }, [budget]);
  useEffect(() => { localStorage.setItem('kuro_contacts', JSON.stringify(contacts)); }, [contacts]);

  const [isEditingDest, setIsEditingDest] = useState<boolean>(false);
  
  // --- Settings / Sync Logic ---
  const [showSettings, setShowSettings] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentDayPlan = itinerary.find(d => d.dayId === selectedDay) || itinerary[0];

  // --- Avatar Upload ---
  const handleAvatarClick = () => {
      // Toggle settings modal instead of direct upload
      setShowSettings(true);
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setUserAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Export / Import ---
  const handleExport = () => {
      const data = {
          itinerary, destination, flights, hotels, budget, contacts
      };
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr))); // Simple base64 encoding
      navigator.clipboard.writeText(encoded).then(() => {
          alert("Trip data copied to clipboard! Send this code to your partner.");
      });
  };

  const handleImport = () => {
      if (!importData) return;
      try {
          const jsonStr = decodeURIComponent(escape(atob(importData)));
          const data = JSON.parse(jsonStr);
          
          if (confirm("This will overwrite your current trip data. Are you sure?")) {
              if (data.itinerary) setItinerary(data.itinerary);
              if (data.destination) setDestination(data.destination);
              if (data.flights) setFlights(data.flights);
              if (data.hotels) setHotels(data.hotels);
              if (data.budget) setBudget(data.budget);
              if (data.contacts) setContacts(data.contacts);
              setShowSettings(false);
              setImportData('');
              alert("Trip loaded successfully!");
          }
      } catch (e) {
          alert("Invalid data code. Please check and try again.");
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
        location: 'Location TBD',
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
          alert("You must have at least one day in your itinerary.");
          return;
      }
      const updatedItinerary = itinerary.filter(d => d.dayId !== selectedDay);
      const reindexedItinerary = updatedItinerary.map((day, index) => ({
          ...day,
          dayId: index + 1
      }));
      setItinerary(reindexedItinerary);
      setSelectedDay(1);
  };

  const handleUpdateDayDate = (newDate: string) => {
      setItinerary(prev => prev.map(d => d.dayId === selectedDay ? { ...d, date: newDate } : d));
  };

  // --- Utilities CRUD ---
  const handleAddFlight = () => setFlights(prev => [...prev, { id: `f-${Date.now()}`, flightNumber: 'JL 000', departureDate: '2024-01-01', departureTime: '00:00', departureAirport: 'DEP', arrivalDate: '2024-01-01', arrivalTime: '00:00', arrivalAirport: 'ARR' }]);
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

  // --- Date Editing UI Logic ---
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');
  
  const startEditingDate = () => { 
      const cleanDate = currentDayPlan.date.split(' ')[0];
      setTempDate(cleanDate); 
      setIsEditingDate(true); 
  };
  
  const saveDate = () => { 
      if(tempDate) handleUpdateDayDate(tempDate); 
      setIsEditingDate(false); 
  };
  
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
                  <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-center">Trip Settings</h3>
                  
                  <div className="space-y-6">
                      {/* Avatar Section */}
                      <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 mx-auto mb-3 overflow-hidden">
                             <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                          </div>
                          <button onClick={triggerFileUpload} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full font-bold">Change Avatar</button>
                      </div>

                      <hr className="border-neutral-800" />

                      {/* Sync Section */}
                      <div>
                          <h4 className="text-xs text-neutral-500 font-bold uppercase mb-2">Sync Trip Data</h4>
                          <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">To share your itinerary, click "Export" and send the code to your partner. They can paste it below to sync.</p>
                          
                          <button onClick={handleExport} className="w-full bg-white text-black py-3 rounded-lg text-sm font-bold mb-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
                              <span>📋 Copy Trip Code</span>
                          </button>

                          <div className="relative">
                              <input 
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                                placeholder="Paste code here to import..." 
                                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:border-white outline-none pr-16"
                              />
                              <button 
                                onClick={handleImport}
                                disabled={!importData}
                                className="absolute right-1 top-1 bottom-1 bg-neutral-800 text-white px-3 rounded text-[10px] font-bold disabled:opacity-50 hover:bg-neutral-700"
                              >
                                  LOAD
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

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

      <main className="px-4 pt-[130px] max-w-lg mx-auto">
        {activeTab === Tab.ITINERARY ? (
            <>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Itinerary</h2>
                             {/* Date Editor */}
                             {isEditingDate ? (
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="date" 
                                        className="bg-neutral-800 text-xs text-white p-1 rounded border border-neutral-700 outline-none w-[110px] [color-scheme:dark]" 
                                        value={tempDate} 
                                        onChange={e => setTempDate(e.target.value)} 
                                    />
                                    <button onClick={saveDate} className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded">OK</button>
                                </div>
                            ) : (
                                <button onClick={startEditingDate} className="flex items-center gap-1 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded hover:border-neutral-600 transition-colors group">
                                    <span className="font-mono text-xs text-neutral-400">{currentDayPlan.date.split(' ')[0]}</span> 
                                    <span className="text-neutral-600 text-[10px] group-hover:text-white transition-colors">✎</span>
                                </button>
                            )}
                        </div>
                        
                        {itinerary.length > 1 && (
                             <button onClick={handleDeleteDay} className="mt-2 text-[10px] text-red-900 hover:text-red-500 transition-colors flex items-center gap-1">
                                🗑️ Delete Day
                            </button>
                        )}
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
        ) : (
            <>
                 <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-tight">Trip Utilities</h2>
                 <Utilities budget={budget} flights={flights} hotels={hotels} contacts={contacts} onUpdateFlight={handleUpdateFlight} onUpdateHotel={handleUpdateHotel} onAddFlight={handleAddFlight} onAddHotel={handleAddHotel} onDeleteFlight={handleDeleteFlight} onDeleteHotel={handleDeleteHotel} onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} onAddContact={handleAddContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} />
            </>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-safe-bottom z-50">
        <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
            <button onClick={() => setActiveTab(Tab.ITINERARY)} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === Tab.ITINERARY ? 'text-white' : 'text-neutral-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[9px] font-medium uppercase tracking-wider">Schedule</span>
            </button>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center -mt-6 shadow-lg shadow-white/10 active:scale-95 transition-transform text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

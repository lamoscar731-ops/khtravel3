import React, { useState, useEffect, useRef } from 'react';
import { BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, ChecklistItem, ItemType, Language } from '../types';
import { TRANSLATIONS, AIRPORT_CODES } from '../constants';

interface UtilitiesProps {
    budget?: BudgetProps[];
    flights?: FlightInfo[];
    hotels?: HotelInfo[];
    contacts?: EmergencyContact[];
    rates: Record<string, number>; 
    onAddFlight: () => void;
    onUpdateFlight: (data: FlightInfo) => void;
    onDeleteFlight: (id: string) => void;
    onAddHotel: () => void;
    onUpdateHotel: (data: HotelInfo) => void;
    onDeleteHotel: (id: string) => void;
    onAddBudget: () => void;
    onUpdateBudget: (item: BudgetProps) => void;
    onDeleteBudget: (id: string) => void;
    onAddContact: () => void;
    onUpdateContact: (item: EmergencyContact) => void;
    onDeleteContact: (id: string) => void;
    onUpdateTotalBudget: (amount: number) => void;
    onAddChecklist: (text: string) => void;
    onToggleChecklist: (id: string) => void;
    onDeleteChecklist: (id: string) => void;
    onAiChecklist: () => void;
    isLoadingAi: boolean;
    checklist?: ChecklistItem[];
    totalBudget?: number;
    lang: Language;
}

const vibrate = () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10); };

const InputField = ({ label, value, onChange, placeholder, list }: { label: string, value: string | number, onChange: (val: string) => void, placeholder?: string, list?: string }) => (
    <div className="mb-2">
        <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-0.5">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={list} className="w-full bg-transparent border-b border-neutral-700 text-white text-xs py-0.5 focus:outline-none focus:border-neutral-400 uppercase" />
    </div>
);

const FileUploadButton = ({ onUpload, hasFile }: { onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, hasFile: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex items-center mt-2">
            <button onClick={() => inputRef.current?.click()} className={`text-[10px] font-bold px-2 py-1 rounded border w-full ${hasFile ? 'bg-green-900/30 text-green-400 border-green-800' : 'text-neutral-400 border-neutral-700 hover:text-white hover:bg-neutral-800'}`}>
                {hasFile ? '📎 FILE ATTACHED (CHANGE)' : '📎 UPLOAD PDF / IMAGE'}
            </button>
            <input type="file" ref={inputRef} className="hidden" accept="image/*,application/pdf" onChange={onUpload} />
        </div>
    );
};

const FlightItem: React.FC<{ flight: FlightInfo, onUpdate: (f: FlightInfo) => void, onDelete: (id: string) => void, lang: Language }> = ({ flight, onUpdate, onDelete, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(flight);
    useEffect(() => { setFormData(flight); }, [flight]);
    const handleSave = () => { vibrate(); onUpdate(formData); setIsEditing(false); };
    const T = TRANSLATIONS;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setFormData(prev => ({ ...prev, attachment: event.target!.result as string, attachmentType: file.type.includes('pdf') ? 'pdf' : 'image' }));
            }
        };
        reader.readAsDataURL(file);
    };

    const viewAttachment = () => {
        if (formData.attachment) {
            const win = window.open();
            if (win) {
                if (formData.attachmentType === 'pdf') win.document.write(`<iframe src="${formData.attachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                else win.document.write(`<img src="${formData.attachment}" style="width:100%">`);
            }
        }
    };
    const airportListId = `airports-${flight.id}`;

    if (isEditing) {
        return (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl ring-1 ring-neutral-700 mb-3">
                <datalist id={airportListId}>{Object.entries(AIRPORT_CODES).map(([city, code]) => <option key={city} value={code}>{city}</option>)}</datalist>
                <h3 className="text-white text-xs font-bold mb-3 flex justify-between items-center">Edit Flight
                    <div className="flex gap-2">
                         <button onClick={() => { vibrate(); onDelete(flight.id); }} className="text-red-400 text-[10px] border border-red-900/50 px-1.5 rounded">{T.DELETE[lang]}</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-[10px] hover:text-white">{T.CANCEL[lang]}</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-2 py-0.5 rounded text-[10px] font-bold">{T.SAVE[lang]}</button>
                    </div>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Flight No" value={formData.flightNumber} onChange={v => setFormData({...formData, flightNumber: v})} />
                    <InputField label="Gate" value={formData.gate || ''} onChange={v => setFormData({...formData, gate: v})} />
                    <InputField label="Dep Date" value={formData.departureDate} onChange={v => setFormData({...formData, departureDate: v})} />
                    <InputField label="Dep Time" value={formData.departureTime} onChange={v => setFormData({...formData, departureTime: v})} />
                    <InputField label="Dep Airport" value={formData.departureAirport} onChange={v => setFormData({...formData, departureAirport: v})} list={airportListId} />
                    <div />
                    <InputField label="Arr Date" value={formData.arrivalDate} onChange={v => setFormData({...formData, arrivalDate: v})} />
                    <InputField label="Arr Time" value={formData.arrivalTime} onChange={v => setFormData({...formData, arrivalTime: v})} />
                    <InputField label="Arr Airport" value={formData.arrivalAirport} onChange={v => setFormData({...formData, arrivalAirport: v})} list={airportListId} />
                    <InputField label="Terminal" value={formData.terminal || ''} onChange={v => setFormData({...formData, terminal: v})} />
                </div>
                <FileUploadButton onUpload={handleFileUpload} hasFile={!!formData.attachment} />
            </div>
        );
    }
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm relative mb-3 group">
             <button onClick={() => { vibrate(); setIsEditing(true); }} className="absolute top-2 right-2 text-neutral-600 hover:text-white text-[10px] opacity-50 hover:opacity-100 p-1">✎</button>
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-3">
                <div className="text-center"><span className="text-xl font-bold text-white block">{flight.departureAirport}</span><span className="text-[9px] text-neutral-500">{flight.departureTime}</span></div>
                <div className="flex flex-col items-center w-full px-4"><span className="text-[9px] text-neutral-500 tracking-widest mb-0.5">{flight.flightNumber}</span><div className="w-full h-[1px] bg-neutral-600 relative flex items-center justify-between"><div className="w-1 h-1 bg-neutral-400 rounded-full"></div><div className="text-[8px] text-neutral-600 absolute top-1.5 w-full text-center">{flight.departureDate === flight.arrivalDate ? 'Same Day' : '+1 Day'}</div><div className="w-1.5 h-1.5 bg-neutral-200 rounded-full"></div></div></div>
                <div className="text-center"><span className="text-xl font-bold text-white block">{flight.arrivalAirport}</span><span className="text-[9px] text-neutral-500">{flight.arrivalTime}</span></div>
            </div>
            <div className="flex justify-between text-xs text-neutral-400 items-end">
                <div><div className="text-[9px] text-neutral-600 uppercase">Date</div><div className="text-white text-[10px]">{flight.departureDate}</div></div>
                {formData.attachment && (<button onClick={viewAttachment} className="text-[9px] bg-neutral-800 text-blue-400 px-2 py-0.5 rounded border border-neutral-700 ml-2">VIEW TICKET</button>)}
                <div className="text-right flex-1"><div className="text-[9px] text-neutral-600 uppercase">Gate / Terminal</div><div className="text-white text-[10px]">{flight.gate || '-'} / {flight.terminal || '-'}</div></div>
            </div>
        </div>
    );
};

const HotelItem: React.FC<{ hotel: HotelInfo, onUpdate: (h: HotelInfo) => void, onDelete: (id: string) => void, lang: Language }> = ({ hotel, onUpdate, onDelete, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showCard, setShowCard] = useState(false);
    const [formData, setFormData] = useState(hotel);
    useEffect(() => { setFormData(hotel); }, [hotel]);
    const handleSave = () => { vibrate(); onUpdate(formData); setIsEditing(false); };
    const T = TRANSLATIONS;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) setFormData(prev => ({ ...prev, attachment: event.target!.result as string, attachmentType: file.type.includes('pdf') ? 'pdf' : 'image' }));
        };
        reader.readAsDataURL(file);
    };
    const viewAttachment = () => {
        if (formData.attachment) {
            const win = window.open();
            if (win) {
                if (formData.attachmentType === 'pdf') win.document.write(`<iframe src="${formData.attachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                else win.document.write(`<img src="${formData.attachment}" style="width:100%">`);
            }
        }
    };

    // Duration Logic
    const start = new Date(hotel.checkIn);
    const end = new Date(hotel.checkOut);
    const nights = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const now = new Date();
    const isTonight = now >= start && now < end;
    const isCheckoutTmr = new Date(now.getTime() + 86400000) >= end && now < end;

    if (showCard) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-center p-8 animate-fade-in" onClick={() => setShowCard(false)}>
                <div className="text-center space-y-8">
                    <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Hotel</p><h1 className="text-4xl font-bold text-white leading-tight">{formData.name}</h1></div>
                    <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Address</p><p className="text-2xl text-white leading-relaxed">{formData.address}</p></div>
                    {formData.bookingRef && (<div className="pt-8 border-t border-neutral-800"><p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Booking Ref</p><p className="text-3xl font-mono text-amber-400 tracking-widest">{formData.bookingRef}</p></div>)}
                    <p className="text-[10px] text-neutral-600 mt-12">Tap to close</p>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
             <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl ring-1 ring-neutral-700 mb-3">
                 <h3 className="text-white text-xs font-bold mb-3 flex justify-between items-center">Edit Hotel
                    <div className="flex gap-2">
                        <button onClick={() => { vibrate(); onDelete(hotel.id); }} className="text-red-400 text-[10px] border border-red-900/50 px-1.5 rounded">{T.DELETE[lang]}</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-[10px] hover:text-white">{T.CANCEL[lang]}</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-2 py-0.5 rounded text-[10px] font-bold">{T.SAVE[lang]}</button>
                    </div>
                </h3>
                <div className="space-y-2">
                    <InputField label="Hotel Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                    <InputField label="Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
                    <div className="grid grid-cols-2 gap-2">
                        <InputField label="Check In" value={formData.checkIn} onChange={v => setFormData({...formData, checkIn: v})} />
                        <InputField label="Check Out" value={formData.checkOut} onChange={v => setFormData({...formData, checkOut: v})} />
                    </div>
                     <InputField label="Booking Ref" value={formData.bookingRef} onChange={v => setFormData({...formData, bookingRef: v})} />
                </div>
                <FileUploadButton onUpload={handleFileUpload} hasFile={!!formData.attachment} />
            </div>
        );
    }
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm mb-3 relative group">
             <div className="absolute top-2 right-2 flex gap-2">
                 <button onClick={() => { vibrate(); setShowCard(true); }} className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                 <button onClick={() => { vibrate(); setIsEditing(true); }} className="text-neutral-600 hover:text-white text-[10px] opacity-50 hover:opacity-100 p-1">✎</button>
             </div>
            <div className="flex justify-between items-start mb-1 pr-16">
                <div>
                    <h3 className="text-sm text-white font-medium">{formData.name}</h3>
                    <div className="flex gap-2 mt-1 items-center">
                         {nights > 0 && <span className="bg-neutral-800 text-neutral-300 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">{nights} {T.NIGHTS[lang]}</span>}
                         {isTonight && <span className="bg-indigo-900/50 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap animate-pulse">TONIGHT</span>}
                         {isCheckoutTmr && <span className="bg-amber-900/50 text-amber-300 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">CHECK-OUT TMRW</span>}
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">{formData.address}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-2 items-end">
                <div><div className="text-[9px] text-neutral-600 uppercase">Check In</div><div className="text-xs text-white">{formData.checkIn}</div></div>
                <div className="flex justify-end">
                    {formData.attachment && (
                        <button onClick={viewAttachment} className="text-[9px] bg-neutral-800 text-blue-400 px-2 py-0.5 rounded border border-neutral-700">VIEW BOOKING</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ContactItem and BudgetItem (No changes but included for completeness)
const ContactItem: React.FC<{ item: EmergencyContact, onUpdate: (c: EmergencyContact) => void, onDelete: (id: string) => void, lang: Language }> = ({ item, onUpdate, onDelete, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    useEffect(() => { setData(item); }, [item]);
    const handleSave = () => { vibrate(); onUpdate(data); setIsEditing(false); };
    const T = TRANSLATIONS;
    if(isEditing) {
        return (
            <div className="bg-neutral-800 border border-neutral-700 p-2 rounded-lg flex flex-col gap-1 relative">
                <input className="bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none uppercase" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                <input className="bg-transparent border-b border-neutral-600 text-white font-mono text-sm font-bold focus:outline-none" value={data.number} onChange={e => setData({...data, number: e.target.value})} placeholder="Phone Number" />
                <input className="bg-transparent border-b border-neutral-600 text-neutral-400 text-[10px] focus:outline-none uppercase" value={data.note} onChange={e => setData({...data, note: e.target.value})} placeholder="Note" />
                <div className="flex justify-end gap-2 mt-1"><button onClick={() => { vibrate(); onDelete(item.id); }} className="text-red-400 text-[10px] px-1">{T.DELETE[lang]}</button><button onClick={handleSave} className="bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold">{T.DONE[lang]}</button></div>
            </div>
        )
    }
    return (
        <button onClick={() => { vibrate(); setIsEditing(true); }} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col items-center justify-center gap-0.5 active:bg-neutral-800 transition relative group"><div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[9px] text-neutral-600">✎</span></div><span className="text-xl">{item.name.toLowerCase().includes('police') ? '👮' : item.name.toLowerCase().includes('ambulance') ? '🚑' : '📞'}</span><span className="text-sm text-white font-bold font-mono">{item.number}</span><span className="text-[9px] text-neutral-500 uppercase">{item.name}</span></button>
    );
}

const BudgetItem: React.FC<{ item: BudgetProps, onUpdate: (b: BudgetProps) => void, onDelete: (id: string) => void, rates: Record<string, number>, lang: Language }> = ({ item, onUpdate, onDelete, rates, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    useEffect(() => { setData(item); }, [item]);
    const handleSave = () => { vibrate(); onUpdate({...data, cost: Number(data.cost)}); setIsEditing(false); };
    const T = TRANSLATIONS;
    const rate = rates[item.currency] || 1;
    const hkdAmount = Math.round(item.cost * rate);
    if(isEditing) {
        return (
             <div className="p-3 border-b border-neutral-800 bg-neutral-800/50"><div className="grid grid-cols-6 gap-2 mb-1"><div className="col-span-4"><input className="w-full bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none uppercase" value={data.item} onChange={e => setData({...data, item: e.target.value})} placeholder="Item" /></div><div className="col-span-2"><select className="w-full bg-neutral-900 text-white text-[10px] border border-neutral-600 rounded p-0.5" value={data.currency} onChange={(e) => setData({...data, currency: e.target.value})}>{Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div><div className="flex gap-2 mb-1"><input className="bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none flex-1 text-right" type="number" value={data.cost} onChange={e => setData({...data, cost: Number(e.target.value)})} placeholder="Cost" /></div><div className="flex justify-between items-center"><select value={data.category} onChange={(e) => setData({...data, category: e.target.value})} className="bg-transparent border-b border-neutral-600 text-neutral-400 text-[10px] focus:outline-none w-1/2 appearance-none uppercase">{Object.values(ItemType).map(t => <option key={t} value={t} className="bg-neutral-900 text-white">{t}</option>)}</select><div className="flex gap-2"><button onClick={() => { vibrate(); onDelete(item.id); }} className="text-red-400 text-[10px] px-2 border border-red-900/50 rounded">{T.DELETE[lang]}</button><button onClick={handleSave} className="bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold">OK</button></div></div></div>
        )
    }
    return (
        <div onClick={() => { vibrate(); setIsEditing(true); }} className="p-3 flex justify-between items-center border-b border-neutral-800 hover:bg-neutral-800/30 transition cursor-pointer group"><div><div className="text-xs text-neutral-200 group-hover:text-white uppercase">{item.item}</div><div className="text-[9px] text-neutral-500 uppercase">{item.category}</div></div><div className="text-right"><div className="text-xs text-neutral-300 font-mono group-hover:text-white">{item.currency === Currency.JPY ? '¥' : item.currency === Currency.USD ? '$' : item.currency} {item.cost.toLocaleString()}</div>{item.currency !== Currency.HKD && (<div className="text-[9px] text-neutral-500 font-mono">≈ HK${hkdAmount.toLocaleString()}</div>)}</div></div>
    )
}

export const Utilities: React.FC<UtilitiesProps> = ({ 
    budget = [], flights = [], hotels = [], contacts = [], checklist = [], totalBudget = 20000, rates,
    onAddFlight, onUpdateFlight, onDeleteFlight, 
    onAddHotel, onUpdateHotel, onDeleteHotel, 
    onAddBudget, onUpdateBudget, onDeleteBudget, 
    onAddContact, onUpdateContact, onDeleteContact,
    onUpdateTotalBudget, onAddChecklist, onToggleChecklist, onDeleteChecklist, onAiChecklist, isLoadingAi, lang
}) => {
  const T = TRANSLATIONS;
  const [newChecklistText, setNewChecklistText] = useState('');
  const totalBudgetHkd = budget.reduce((acc, curr) => { const rate = rates[curr.currency] || 1; return acc + (curr.cost * rate); }, 0);
  const budgetProgress = totalBudget ? Math.min((totalBudgetHkd / totalBudget) * 100, 100) : 0;
  let progressColor = 'bg-white'; if (budgetProgress >= 100) progressColor = 'bg-red-500'; else if (budgetProgress >= 80) progressColor = 'bg-amber-400';
  const handleAddChecklistKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && newChecklistText.trim()) { vibrate(); onAddChecklist(newChecklistText); setNewChecklistText(''); } };

  return (
    <div className="space-y-4 pb-24">
      <section>
          <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">{T.FLIGHTS[lang]}</h2><button onClick={onAddFlight} className="text-neutral-400 hover:text-white text-[10px]">+ {T.ADD[lang]}</button></div>
          {flights.map(f => <FlightItem key={f.id} flight={f} onUpdate={onUpdateFlight} onDelete={onDeleteFlight} lang={lang} />)}
          {flights.length === 0 && <div className="text-center py-4 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-[10px]">No flights added</div>}
      </section>
      <section>
          <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">{T.ACCOMMODATION[lang]}</h2><button onClick={onAddHotel} className="text-neutral-400 hover:text-white text-[10px]">+ {T.ADD[lang]}</button></div>
          {hotels.map(h => <HotelItem key={h.id} hotel={h} onUpdate={onUpdateHotel} onDelete={onDeleteHotel} lang={lang} />)}
          {hotels.length === 0 && <div className="text-center py-4 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-[10px]">No hotels added</div>}
      </section>
      <section>
        <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">{T.EMERGENCY[lang]}</h2><button onClick={onAddContact} className="text-neutral-400 hover:text-white text-[10px]">+ {T.ADD[lang]}</button></div>
        <div className="grid grid-cols-2 gap-2">{contacts.map(contact => <ContactItem key={contact.id} item={contact} onUpdate={onUpdateContact} onDelete={onDeleteContact} lang={lang} />)}</div>
      </section>
      <section>
        <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">{T.BUDGET_TRACKER[lang]}</h2></div>
        <div className="mb-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3"><div className="flex justify-between text-[9px] text-neutral-500 mb-1 font-bold tracking-wider"><span>SPENT: HK${Math.round(totalBudgetHkd).toLocaleString()}</span><span>GOAL: <input type="number" className="bg-transparent border-b border-neutral-700 w-[60px] text-right text-white focus:outline-none" value={totalBudget || ''} onChange={(e) => onUpdateTotalBudget(Number(e.target.value))} placeholder="Set" /></span></div><div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${progressColor}`} style={{ width: `${budgetProgress}%` }}></div></div>{budgetProgress >= 100 && <div className="text-[9px] text-red-500 text-right mt-1 font-bold">OVER BUDGET!</div>}</div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">{budget.map((item) => <BudgetItem key={item.id} item={item} onUpdate={onUpdateBudget} onDelete={onDeleteBudget} rates={rates} lang={lang} />)}<button onClick={onAddBudget} className="w-full py-2 text-[10px] text-neutral-500 hover:text-white hover:bg-neutral-800 transition border-b border-neutral-800">+ {T.ADD_EXPENSE[lang]}</button></div>
      </section>
      <section>
          <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">{T.PACKING_LIST[lang]}</h2><button onClick={onAiChecklist} disabled={isLoadingAi} className="text-amber-200 hover:text-amber-100 text-[10px] flex items-center gap-1 uppercase">{isLoadingAi ? <span className="animate-pulse">Thinking...</span> : <><span>✨ {T.AI_SUGGEST[lang]}</span></>}</button></div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"><div className="p-2 border-b border-neutral-800 flex gap-2"><input className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-neutral-600" placeholder="Add item..." value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} onKeyDown={handleAddChecklistKey} /><button onClick={handleAddItem} className="text-neutral-500 text-[10px] font-bold">+</button></div><div>{checklist?.map(item => (<div key={item.id} className="flex items-center gap-3 p-3 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 group"><button onClick={() => onToggleChecklist(item.id)} className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${item.checked ? 'bg-white border-white' : 'border-neutral-600 hover:border-neutral-400'}`}>{item.checked && <span className="text-black text-[10px] font-bold">✓</span>}</button><span className={`text-xs flex-1 ${item.checked ? 'text-neutral-600 line-through' : 'text-neutral-200'}`}>{item.text}</span><button onClick={() => { vibrate(); onDeleteChecklist(item.id); }} className="text-neutral-700 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button></div>))}{checklist.length === 0 && <div className="text-center py-4 text-neutral-600 text-[10px]">List is empty</div>}</div></div>
      </section>
    </div>
  );
};

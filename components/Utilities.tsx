import React, { useState, useEffect } from 'react';
import { BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency, ChecklistItem, Language } from '../types';

interface UtilitiesProps {
    budget: BudgetProps[];
    flights: FlightInfo[];
    hotels: HotelInfo[];
    contacts: EmergencyContact[];
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
    checklist: ChecklistItem[];
    totalBudget: number;
    lang: Language;
}

const InputField = ({ label, value, onChange, placeholder }: { label: string, value: string | number, onChange: (val: string) => void, placeholder?: string }) => (
    <div className="mb-2">
        <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-0.5">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent border-b border-neutral-700 text-white text-xs py-0.5 focus:outline-none focus:border-neutral-400" />
    </div>
);

const FlightItem: React.FC<{ flight: FlightInfo, onUpdate: (f: FlightInfo) => void, onDelete: (id: string) => void }> = ({ flight, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(flight);
    useEffect(() => { setFormData(flight); }, [flight]);
    const handleSave = () => { onUpdate(formData); setIsEditing(false); };

    if (isEditing) {
        return (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl ring-1 ring-neutral-700 mb-3">
                <h3 className="text-white text-xs font-bold mb-3 flex justify-between items-center">Edit Flight
                    <div className="flex gap-2">
                         <button onClick={() => onDelete(flight.id)} className="text-red-400 text-[10px] border border-red-900/50 px-1.5 rounded">Del</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-[10px] hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-2 py-0.5 rounded text-[10px] font-bold">Save</button>
                    </div>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Flight No" value={formData.flightNumber} onChange={v => setFormData({...formData, flightNumber: v})} />
                    <InputField label="Gate" value={formData.gate || ''} onChange={v => setFormData({...formData, gate: v})} />
                    <InputField label="Dep Date" value={formData.departureDate} onChange={v => setFormData({...formData, departureDate: v})} />
                    <InputField label="Dep Time" value={formData.departureTime} onChange={v => setFormData({...formData, departureTime: v})} />
                    <InputField label="Dep Airport" value={formData.departureAirport} onChange={v => setFormData({...formData, departureAirport: v})} />
                    <div />
                    <InputField label="Arr Date" value={formData.arrivalDate} onChange={v => setFormData({...formData, arrivalDate: v})} />
                    <InputField label="Arr Time" value={formData.arrivalTime} onChange={v => setFormData({...formData, arrivalTime: v})} />
                    <InputField label="Arr Airport" value={formData.arrivalAirport} onChange={v => setFormData({...formData, arrivalAirport: v})} />
                    <InputField label="Terminal" value={formData.terminal || ''} onChange={v => setFormData({...formData, terminal: v})} />
                </div>
            </div>
        );
    }
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm relative mb-3 group">
             <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 text-neutral-600 hover:text-white text-[10px] opacity-50 hover:opacity-100 p-1">✎</button>
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-3">
                <div className="text-center"><span className="text-xl font-bold text-white block">{flight.departureAirport}</span><span className="text-[9px] text-neutral-500">{flight.departureTime}</span></div>
                <div className="flex flex-col items-center w-full px-4"><span className="text-[9px] text-neutral-500 tracking-widest mb-0.5">{flight.flightNumber}</span><div className="w-full h-[1px] bg-neutral-600 relative flex items-center justify-between"><div className="w-1 h-1 bg-neutral-400 rounded-full"></div><div className="text-[8px] text-neutral-600 absolute top-1.5 w-full text-center">{flight.departureDate === flight.arrivalDate ? 'Same Day' : '+1 Day'}</div><div className="w-1.5 h-1.5 bg-neutral-200 rounded-full"></div></div></div>
                <div className="text-center"><span className="text-xl font-bold text-white block">{flight.arrivalAirport}</span><span className="text-[9px] text-neutral-500">{flight.arrivalTime}</span></div>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
                <div><div className="text-[9px] text-neutral-600 uppercase">Date</div><div className="text-white text-[10px]">{flight.departureDate}</div></div>
                <div className="text-right"><div className="text-[9px] text-neutral-600 uppercase">Gate / Terminal</div><div className="text-white text-[10px]">{flight.gate || '-'} / {flight.terminal || '-'}</div></div>
            </div>
        </div>
    );
};

const HotelItem: React.FC<{ hotel: HotelInfo, onUpdate: (h: HotelInfo) => void, onDelete: (id: string) => void }> = ({ hotel, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(hotel);
    useEffect(() => { setFormData(hotel); }, [hotel]);
    const handleSave = () => { onUpdate(formData); setIsEditing(false); };

    if (isEditing) {
        return (
             <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl ring-1 ring-neutral-700 mb-3">
                 <h3 className="text-white text-xs font-bold mb-3 flex justify-between items-center">Edit Hotel
                    <div className="flex gap-2">
                        <button onClick={() => onDelete(hotel.id)} className="text-red-400 text-[10px] border border-red-900/50 px-1.5 rounded">Del</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-[10px] hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-2 py-0.5 rounded text-[10px] font-bold">Save</button>
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
            </div>
        );
    }
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm mb-3 relative group">
             <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 text-neutral-600 hover:text-white text-[10px] opacity-50 hover:opacity-100 p-1">✎</button>
            <div className="flex justify-between items-start mb-1 pr-6">
                <h3 className="text-sm text-white font-medium pr-4">{formData.name}</h3>
                <span className="bg-neutral-800 text-neutral-300 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">Confirmed</span>
            </div>
            <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">{formData.address}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-2">
                <div><div className="text-[9px] text-neutral-600 uppercase">Check In</div><div className="text-xs text-white">{formData.checkIn}</div></div>
                <div><div className="text-[9px] text-neutral-600 uppercase">Booking Ref</div><div className="text-xs text-amber-200 font-mono">{formData.bookingRef}</div></div>
            </div>
        </div>
    );
};

const ContactItem: React.FC<{ item: EmergencyContact, onUpdate: (c: EmergencyContact) => void, onDelete: (id: string) => void }> = ({ item, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    useEffect(() => { setData(item); }, [item]);
    const handleSave = () => { onUpdate(data); setIsEditing(false); };

    if(isEditing) {
        return (
            <div className="bg-neutral-800 border border-neutral-700 p-2 rounded-lg flex flex-col gap-1 relative">
                <input className="bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                <input className="bg-transparent border-b border-neutral-600 text-white font-mono text-sm font-bold focus:outline-none" value={data.number} onChange={e => setData({...data, number: e.target.value})} placeholder="Phone Number" />
                <input className="bg-transparent border-b border-neutral-600 text-neutral-400 text-[10px] focus:outline-none" value={data.note} onChange={e => setData({...data, note: e.target.value})} placeholder="Note" />
                <div className="flex justify-end gap-2 mt-1">
                     <button onClick={() => onDelete(item.id)} className="text-red-400 text-[10px] px-1">Delete</button>
                     <button onClick={handleSave} className="bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold">Done</button>
                </div>
            </div>
        )
    }
    return (
        <button onClick={() => setIsEditing(true)} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col items-center justify-center gap-0.5 active:bg-neutral-800 transition relative group">
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[9px] text-neutral-600">✎</span></div>
            <span className="text-xl">{item.name.toLowerCase().includes('police') ? '👮' : item.name.toLowerCase().includes('ambulance') ? '🚑' : '📞'}</span>
            <span className="text-sm text-white font-bold font-mono">{item.number}</span>
            <span className="text-[9px] text-neutral-500">{item.name}</span>
        </button>
    );
}

const BudgetItem: React.FC<{ item: BudgetProps, onUpdate: (b: BudgetProps) => void, onDelete: (id: string) => void, rates: Record<string, number> }> = ({ item, onUpdate, onDelete, rates }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    useEffect(() => { setData(item); }, [item]);
    const handleSave = () => { onUpdate({...data, cost: Number(data.cost)}); setIsEditing(false); };
    
    // Calculate using passed real-time rates
    const rate = rates[item.currency] || 1;
    const hkdAmount = Math.round(item.cost * rate);

    if(isEditing) {
        return (
             <div className="p-3 border-b border-neutral-800 bg-neutral-800/50">
                <div className="grid grid-cols-6 gap-2 mb-1">
                    <div className="col-span-4"><input className="w-full bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none" value={data.item} onChange={e => setData({...data, item: e.target.value})} placeholder="Item" /></div>
                    <div className="col-span-2"><select className="w-full bg-neutral-900 text-white text-[10px] border border-neutral-600 rounded p-0.5" value={data.currency} onChange={(e) => setData({...data, currency: e.target.value})}>{Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex gap-2 mb-1"><input className="bg-transparent border-b border-neutral-600 text-white text-xs focus:outline-none flex-1 text-right" type="number" value={data.cost} onChange={e => setData({...data, cost: Number(e.target.value)})} placeholder="Cost" /></div>
                <div className="flex justify-between items-center"><input className="bg-transparent border-b border-neutral-600 text-neutral-400 text-[10px] focus:outline-none w-1/2" value={data.category} onChange={e => setData({...data, category: e.target.value})} placeholder="Category" /><div className="flex gap-2"><button onClick={() => onDelete(item.id)} className="text-red-400 text-[10px] px-2 border border-red-900/50 rounded">Del</button><button onClick={handleSave} className="bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold">OK</button></div></div>
             </div>
        )
    }
    return (
        <div onClick={() => setIsEditing(true)} className="p-3 flex justify-between items-center border-b border-neutral-800 hover:bg-neutral-800/30 transition cursor-pointer group">
            <div><div className="text-xs text-neutral-200 group-hover:text-white">{item.item}</div><div className="text-[9px] text-neutral-500">{item.category}</div></div>
            <div className="text-right">
                <div className="text-xs text-neutral-300 font-mono group-hover:text-white">{item.currency === Currency.JPY ? '¥' : item.currency === Currency.USD ? '$' : item.currency} {item.cost.toLocaleString()}</div>
                {item.currency !== Currency.HKD && (<div className="text-[9px] text-neutral-500 font-mono">≈ HK${hkdAmount.toLocaleString()}</div>)}
            </div>
        </div>
    )
}

export const Utilities: React.FC<UtilitiesProps> = ({ 
    budget, flights, hotels, contacts, rates,
    onAddFlight, onUpdateFlight, onDeleteFlight,
    onAddHotel, onUpdateHotel, onDeleteHotel,
    onAddBudget, onUpdateBudget, onDeleteBudget,
    onAddContact, onUpdateContact, onDeleteContact,
    onUpdateTotalBudget, onAddChecklist, onToggleChecklist, onDeleteChecklist, onAiChecklist, isLoadingAi, checklist, totalBudget, lang
}) => {
  const totalBudgetHkd = budget.reduce((acc, curr) => {
      const rate = rates[curr.currency] || 1;
      return acc + (curr.cost * rate);
  }, 0);

  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = () => {
      if(newItemText.trim()) {
          onAddChecklist(newItemText);
          setNewItemText('');
      }
  };

  return (
    <div className="space-y-4 pb-24">
      <section>
          <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">Flights</h2><button onClick={onAddFlight} className="text-neutral-400 hover:text-white text-[10px]">+ Add</button></div>
          {flights.map(f => <FlightItem key={f.id} flight={f} onUpdate={onUpdateFlight} onDelete={onDeleteFlight} />)}
          {flights.length === 0 && <div className="text-center py-4 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-[10px]">No flights added</div>}
      </section>
      <section>
          <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">Accommodation</h2><button onClick={onAddHotel} className="text-neutral-400 hover:text-white text-[10px]">+ Add</button></div>
          {hotels.map(h => <HotelItem key={h.id} hotel={h} onUpdate={onUpdateHotel} onDelete={onDeleteHotel} />)}
          {hotels.length === 0 && <div className="text-center py-4 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-[10px]">No hotels added</div>}
      </section>
      <section>
        <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">Emergency</h2><button onClick={onAddContact} className="text-neutral-400 hover:text-white text-[10px]">+ Add</button></div>
        <div className="grid grid-cols-2 gap-2">{contacts.map(contact => <ContactItem key={contact.id} item={contact} onUpdate={onUpdateContact} onDelete={onDeleteContact} />)}</div>
      </section>

      {/* Checklist Section */}
      <section>
        <div className="flex justify-between items-end mb-2 ml-1">
            <h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">Packing Checklist</h2>
            <button onClick={onAiChecklist} disabled={isLoadingAi} className="text-neutral-400 hover:text-white text-[10px] active:scale-95 transition-transform">
                {isLoadingAi ? 'Generating...' : '✨ AI Suggest'}
            </button>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
             {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3 mb-2 group">
                    <button onClick={() => onToggleChecklist(item.id)} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-white border-white' : 'border-neutral-600 hover:border-neutral-400'}`}>
                        {item.checked && <span className="text-black text-[10px] font-bold">✓</span>}
                    </button>
                    <span className={`text-xs flex-1 transition-opacity ${item.checked ? 'text-neutral-600 line-through' : 'text-neutral-300'}`}>{item.text}</span>
                    <button onClick={() => onDeleteChecklist(item.id)} className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition px-2">×</button>
                </div>
            ))}
            {checklist.length === 0 && <div className="text-center text-[10px] text-neutral-600 py-2">List is empty</div>}
            <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-800">
                 <input 
                    type="text" 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add item..." 
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder-neutral-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                 />
                 <button onClick={handleAddItem} disabled={!newItemText.trim()} className="text-[10px] font-bold text-neutral-500 hover:text-white disabled:opacity-30">+</button>
            </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-2 ml-1"><h2 className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">Budget Tracker</h2></div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
             {/* Total Budget Input */}
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/30">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Trip Limit (HKD)</span>
                <input 
                    type="number" 
                    value={totalBudget} 
                    onChange={(e) => onUpdateTotalBudget(Number(e.target.value))} 
                    className="bg-transparent text-right text-sm font-bold text-white outline-none w-24 border-b border-transparent focus:border-neutral-600 transition-colors" 
                />
            </div>
            {budget.map((item) => <BudgetItem key={item.id} item={item} onUpdate={onUpdateBudget} onDelete={onDeleteBudget} rates={rates} />)}
            <button onClick={onAddBudget} className="w-full py-2 text-[10px] text-neutral-500 hover:text-white hover:bg-neutral-800 transition border-b border-neutral-800">+ Add Expense</button>
            <div className="bg-neutral-950/50 p-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400">TOTAL EST. (HKD)</span>
                <span className={`text-sm font-bold font-mono ${totalBudgetHkd > totalBudget ? 'text-red-400' : 'text-white'}`}>HK${Math.round(totalBudgetHkd).toLocaleString()}</span>
            </div>
            {/* Remaining */}
            <div className="bg-neutral-950/50 px-3 pb-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400">REMAINING</span>
                <span className={`text-sm font-bold font-mono ${totalBudget - totalBudgetHkd < 0 ? 'text-red-400' : 'text-emerald-400'}`}>HK${Math.round(totalBudget - totalBudgetHkd).toLocaleString()}</span>
            </div>
        </div>
      </section>
    </div>
  );
};

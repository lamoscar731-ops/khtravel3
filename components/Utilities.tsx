import React, { useState } from 'react';
import { BudgetProps, FlightInfo, HotelInfo, EmergencyContact, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';

interface UtilitiesProps {
    budget: BudgetProps[];
    flights: FlightInfo[];
    hotels: HotelInfo[];
    contacts: EmergencyContact[];
    
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
}

const InputField = ({ label, value, onChange, placeholder }: { label: string, value: string | number, onChange: (val: string) => void, placeholder?: string }) => (
    <div className="mb-2">
        <label className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-1 focus:outline-none focus:border-neutral-400" />
    </div>
);

const FlightItem: React.FC<{ flight: FlightInfo, onUpdate: (f: FlightInfo) => void, onDelete: (id: string) => void }> = ({ flight, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(flight);
    const handleSave = () => { onUpdate(formData); setIsEditing(false); };

    if (isEditing) {
        return (
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 shadow-xl ring-1 ring-neutral-700 mb-4">
                <h3 className="text-white font-bold mb-4 flex justify-between items-center">Edit Flight
                    <div className="flex gap-2">
                         <button onClick={() => onDelete(flight.id)} className="text-red-400 text-xs border border-red-900/50 px-2 rounded">Del</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-xs hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-3 py-1 rounded text-xs font-bold">Save</button>
                    </div>
                </h3>
                <div className="grid grid-cols-2 gap-3">
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm relative mb-4 group">
             <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 text-neutral-600 hover:text-white text-xs opacity-50 hover:opacity-100 p-2">✎</button>
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-4">
                <div className="text-center"><span className="text-2xl font-bold text-white block">{flight.departureAirport}</span><span className="text-[10px] text-neutral-500">{flight.departureTime}</span></div>
                <div className="flex flex-col items-center w-full px-4"><span className="text-[10px] text-neutral-500 tracking-widest mb-1">{flight.flightNumber}</span><div className="w-full h-[1px] bg-neutral-600 relative flex items-center justify-between"><div className="w-1 h-1 bg-neutral-400 rounded-full"></div><div className="text-[8px] text-neutral-600 absolute top-2 w-full text-center">{flight.departureDate === flight.arrivalDate ? 'Same Day' : '+1 Day'}</div><div className="w-1.5 h-1.5 bg-neutral-200 rounded-full"></div></div></div>
                <div className="text-center"><span className="text-2xl font-bold text-white block">{flight.arrivalAirport}</span><span className="text-[10px] text-neutral-500">{flight.arrivalTime}</span></div>
            </div>
            <div className="flex justify-between text-sm text-neutral-400">
                <div><div className="text-[10px] text-neutral-600 uppercase">Date</div><div className="text-white text-xs">{flight.departureDate}</div></div>
                <div className="text-right"><div className="text-[10px] text-neutral-600 uppercase">Gate / Terminal</div><div className="text-white text-xs">{flight.gate || '-'} / {flight.terminal || '-'}</div></div>
            </div>
        </div>
    );
};

const HotelItem: React.FC<{ hotel: HotelInfo, onUpdate: (h: HotelInfo) => void, onDelete: (id: string) => void }> = ({ hotel, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(hotel);
    const handleSave = () => { onUpdate(formData); setIsEditing(false); };

    if (isEditing) {
        return (
             <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 shadow-xl ring-1 ring-neutral-700 mb-4">
                 <h3 className="text-white font-bold mb-4 flex justify-between items-center">Edit Hotel
                    <div className="flex gap-2">
                        <button onClick={() => onDelete(hotel.id)} className="text-red-400 text-xs border border-red-900/50 px-2 rounded">Del</button>
                        <button onClick={() => setIsEditing(false)} className="text-neutral-500 text-xs hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-neutral-950 bg-white px-3 py-1 rounded text-xs font-bold">Save</button>
                    </div>
                </h3>
                <div className="space-y-3">
                    <InputField label="Hotel Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                    <InputField label="Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Check In" value={formData.checkIn} onChange={v => setFormData({...formData, checkIn: v})} />
                        <InputField label="Check Out" value={formData.checkOut} onChange={v => setFormData({...formData, checkOut: v})} />
                    </div>
                     <InputField label="Booking Ref" value={formData.bookingRef} onChange={v => setFormData({...formData, bookingRef: v})} />
                </div>
            </div>
        );
    }
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm mb-4 relative group">
             <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 text-neutral-600 hover:text-white text-xs opacity-50 hover:opacity-100 p-2">✎</button>
            <div className="flex justify-between items-start mb-2 pr-6">
                <h3 className="text-lg text-white font-medium pr-4">{formData.name}</h3>
                <span className="bg-neutral-800 text-neutral-300 text-[10px] px-2 py-1 rounded whitespace-nowrap">Confirmed</span>
            </div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{formData.address}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-3">
                <div><div className="text-[10px] text-neutral-600 uppercase">Check In</div><div className="text-sm text-white">{formData.checkIn}</div></div>
                <div><div className="text-[10px] text-neutral-600 uppercase">Booking Ref</div><div className="text-sm text-amber-200 font-mono">{formData.bookingRef}</div></div>
            </div>
        </div>
    );
};

const ContactItem: React.FC<{ item: EmergencyContact, onUpdate: (c: EmergencyContact) => void, onDelete: (id: string) => void }> = ({ item, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    const handleSave = () => { onUpdate(data); setIsEditing(false); };

    if(isEditing) {
        return (
            <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-xl flex flex-col gap-2 relative">
                <input className="bg-transparent border-b border-neutral-600 text-white text-sm focus:outline-none" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                <input className="bg-transparent border-b border-neutral-600 text-white font-mono text-lg font-bold focus:outline-none" value={data.number} onChange={e => setData({...data, number: e.target.value})} placeholder="Phone Number" />
                <input className="bg-transparent border-b border-neutral-600 text-neutral-400 text-xs focus:outline-none" value={data.note} onChange={e => setData({...data, note: e.target.value})} placeholder="Note" />
                <div className="flex justify-end gap-2 mt-2">
                     <button onClick={() => onDelete(item.id)} className="text-red-400 text-xs px-2">Delete</button>
                     <button onClick={handleSave} className="bg-white text-black text-xs px-3 py-1 rounded font-bold">Done</button>
                </div>
            </div>
        )
    }
    return (
        <button onClick={() => setIsEditing(true)} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-1 active:bg-neutral-800 transition relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-neutral-600">✎</span></div>
            <span className="text-2xl">{item.name.toLowerCase().includes('police') ? '👮' : item.name.toLowerCase().includes('ambulance') ? '🚑' : '📞'}</span>
            <span className="text-lg text-white font-bold font-mono">{item.number}</span>
            <span className="text-[10px] text-neutral-500">{item.name}</span>
        </button>
    );
}

const BudgetItem: React.FC<{ item: BudgetProps, onUpdate: (b: BudgetProps) => void, onDelete: (id: string) => void }> = ({ item, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(item);
    const handleSave = () => { onUpdate({...data, cost: Number(data.cost)}); setIsEditing(false); };
    const rate = EXCHANGE_RATES[item.currency] || 1;
    const hkdAmount = Math.round(item.cost * rate);

    if(isEditing) {
        return (
             <div className="p-4 border-b border-neutral-800 bg-neutral-800/50">
                <div className="grid grid-cols-6 gap-2 mb-2">
                    <div className="col-span-4"><input className="w-full bg-transparent border-b border-neutral-600 text-white text-sm focus:outline-none" value={data.item} onChange={e => setData({...data, item: e.target.value})} placeholder="Item" /></div>
                    <div className="col-span-2"><select className="w-full bg-neutral-900 text-white text-xs border border-neutral-600 rounded p-1" value={data.currency} onChange={(e) => setData({...data, currency: e.target.value})}>{Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex gap-2 mb-2"><input className="bg-transparent border-b border-neutral-600 text-white text-sm focus:outline-none flex-1 text-right" type="number" value={data.cost} onChange={e => setData({...data, cost: Number(e.target.value)})} placeholder="Cost" /></div>
                <div className="flex justify-between items-center"><input className="bg-transparent border-b border-neutral-600 text-neutral-400 text-xs focus:outline-none w-1/2" value={data.category} onChange={e => setData({...data, category: e.target.value})} placeholder="Category" /><div className="flex gap-2"><button onClick={() => onDelete(item.id)} className="text-red-400 text-xs px-2 border border-red-900/50 rounded">Del</button><button onClick={handleSave} className="bg-white text-black text-xs px-3 py-1 rounded font-bold">OK</button></div></div>
             </div>
        )
    }
    return (
        <div onClick={() => setIsEditing(true)} className="p-4 flex justify-between items-center border-b border-neutral-800 hover:bg-neutral-800/30 transition cursor-pointer group">
            <div><div className="text-sm text-neutral-200 group-hover:text-white">{item.item}</div><div className="text-[10px] text-neutral-500">{item.category}</div></div>
            <div className="text-right">
                <div className="text-sm text-neutral-300 font-mono group-hover:text-white">{item.currency === Currency.JPY ? '¥' : item.currency === Currency.USD ? '$' : item.currency} {item.cost.toLocaleString()}</div>
                {item.currency !== Currency.HKD && (<div className="text-[10px] text-neutral-500 font-mono">≈ HK${hkdAmount.toLocaleString()}</div>)}
            </div>
        </div>
    )
}

export const Utilities: React.FC<UtilitiesProps> = ({ budget, flights, hotels, contacts, onAddFlight, onUpdateFlight, onDeleteFlight, onAddHotel, onUpdateHotel, onDeleteHotel, onAddBudget, onUpdateBudget, onDeleteBudget, onAddContact, onUpdateContact, onDeleteContact }) => {
  const totalBudgetHkd = budget.reduce((acc, curr) => {
      const rate = EXCHANGE_RATES[curr.currency] || 1;
      return acc + (curr.cost * rate);
  }, 0);

  return (
    <div className="space-y-6 pb-24">
      <section>
          <div className="flex justify-between items-end mb-3 ml-1"><h2 className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Flights</h2><button onClick={onAddFlight} className="text-neutral-400 hover:text-white text-xs">+ Add</button></div>
          {flights.map(f => <FlightItem key={f.id} flight={f} onUpdate={onUpdateFlight} onDelete={onDeleteFlight} />)}
          {flights.length === 0 && <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-xs">No flights added</div>}
      </section>
      <section>
          <div className="flex justify-between items-end mb-3 ml-1"><h2 className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Accommodation</h2><button onClick={onAddHotel} className="text-neutral-400 hover:text-white text-xs">+ Add</button></div>
          {hotels.map(h => <HotelItem key={h.id} hotel={h} onUpdate={onUpdateHotel} onDelete={onDeleteHotel} />)}
          {hotels.length === 0 && <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-xs">No hotels added</div>}
      </section>
      <section>
        <div className="flex justify-between items-end mb-3 ml-1"><h2 className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Emergency</h2><button onClick={onAddContact} className="text-neutral-400 hover:text-white text-xs">+ Add</button></div>
        <div className="grid grid-cols-2 gap-3">{contacts.map(contact => <ContactItem key={contact.id} item={contact} onUpdate={onUpdateContact} onDelete={onDeleteContact} />)}</div>
      </section>
      <section>
        <div className="flex justify-between items-end mb-3 ml-1"><h2 className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Budget Tracker</h2></div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {budget.map((item) => <BudgetItem key={item.id} item={item} onUpdate={onUpdateBudget} onDelete={onDeleteBudget} />)}
            <button onClick={onAddBudget} className="w-full py-3 text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 transition border-b border-neutral-800">+ Add Expense</button>
            <div className="bg-neutral-950/50 p-4 flex justify-between items-center"><span className="text-xs font-bold text-neutral-400">TOTAL EST. (HKD)</span><span className="text-lg font-bold text-white font-mono">HK${Math.round(totalBudgetHkd).toLocaleString()}</span></div>
        </div>
      </section>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ItineraryItem, ItemType, Tag, Language } from '../types';

interface Props {
  item: ItineraryItem;
  isLast: boolean;
  onSave: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isActive: boolean;
  lang: Language;
}

const TypeIcon: React.FC<{ type: ItemType }> = ({ type }) => {
  switch (type) {
    case ItemType.FOOD: return <span className="text-base">🍽️</span>;
    case ItemType.RAMEN: return <span className="text-base">🍜</span>;
    case ItemType.COFFEE: return <span className="text-base">☕</span>;
    case ItemType.ALCOHOL: return <span className="text-base">🍺</span>;
    case ItemType.TRANSPORT: return <span className="text-base">🚄</span>;
    case ItemType.SHOPPING: return <span className="text-base">🛍️</span>;
    case ItemType.HOTEL: return <span className="text-base">🏨</span>;
    default: return <span className="text-base">⛩️</span>;
  }
};

export const ItineraryCard: React.FC<Props> = ({ item, isLast, onSave, onDelete, isSelectMode, isSelected, onSelect, isActive, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ItineraryItem>(item);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<'red' | 'gold' | 'gray'>('gray');

  useEffect(() => { setFormData(item); }, [item]);

  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.mapsUrl && item.mapsUrl.trim().length > 0) {
        window.open(item.mapsUrl, '_blank');
    } else {
        const query = encodeURIComponent(item.navQuery || item.location);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleMapUrlPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      let newTitle = formData.title;
      let newLocation = formData.location;
      const placeMatch = url.match(/\/(?:place|search)\/([^/?]+)/);
      if (placeMatch && placeMatch[1]) {
          try {
              let extractedName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
              extractedName = extractedName.split('@')[0].trim();
              if (extractedName && extractedName.length > 0) {
                  if (formData.title === 'New Activity' || !formData.title) newTitle = extractedName;
                  if (formData.location === 'Location TBD' || !formData.location || formData.location === 'TBD') newLocation = extractedName;
              }
          } catch (err) { }
      }
      setFormData(prev => ({ ...prev, mapsUrl: url, title: newTitle, location: newLocation }));
  };

  const handleSave = () => {
    onSave({ ...formData, navQuery: formData.location });
    setIsEditing(false);
  };

  const handleChange = (field: keyof ItineraryItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearTips = () => {
      setFormData(prev => ({ ...prev, tips: [] }));
  };

  if (isEditing) {
    return (
        <div className="flex gap-3 mb-2 relative">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
            <div className="flex flex-col items-center min-w-[32px] z-10">
                <div className="text-xs text-neutral-500 mb-1 opacity-50">{formData.time}</div>
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center relative shadow-inner">
                    <TypeIcon type={formData.type} />
                </div>
            </div>
            <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl mb-3 relative ring-1 ring-neutral-700">
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-1">
                            <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Time</label>
                            <input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none [color-scheme:dark]" />
                        </div>
                        <div className="col-span-2">
                             <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Type</label>
                             <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none appearance-none bg-neutral-900">
                                {Object.values(ItemType).map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white font-bold text-sm py-0.5 focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Location</label>
                        <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-neutral-300 text-[10px] py-0.5 focus:outline-none" />
                    </div>
                    
                    {formData.tips && formData.tips.length > 0 && (
                        <div className="relative mt-2 p-2 bg-neutral-950/40 rounded border border-neutral-800">
                            <button onClick={handleClearTips} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-neutral-800 text-neutral-500 hover:text-red-400 rounded-full text-[10px] transition-all">✕</button>
                            <label className="text-[9px] text-neutral-600 font-bold block mb-1 uppercase tracking-widest">Guide Notes</label>
                            <ul className="list-disc pl-3 text-[9px] text-neutral-500 space-y-0.5">
                                {formData.tips.map((tip, idx) => (
                                    <li key={idx} className="leading-tight">{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave} className="flex-1 bg-neutral-100 text-black py-1.5 rounded text-[10px] font-bold uppercase">SAVE</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-neutral-300 py-1.5 rounded text-[10px] font-bold uppercase">CANCEL</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-2 relative group ${isActive ? 'opacity-100' : 'opacity-90'}`} onClick={() => isSelectMode && onSelect(item.id)}>
      {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
      <div className="flex flex-col items-center min-w-[32px] z-10">
        <div className={`text-xs mb-0.5 tracking-tight ${isActive ? 'text-white font-bold' : 'text-neutral-500'}`}>{item.time}</div>
        <div className={`w-8 h-8 rounded-full bg-neutral-900 border flex items-center justify-center shadow-sm relative transition-all ${isActive ? 'border-white shadow-glow' : 'border-neutral-800'}`}>
          <TypeIcon type={item.type} />
        </div>
      </div>
      <div className={`flex-1 bg-neutral-900 border rounded-lg p-3 shadow-sm mb-3 relative transition-colors ${isActive ? 'border-neutral-600' : 'border-neutral-800'}`}>
        {!isSelectMode && (
             <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute top-2 right-2 p-1.5 text-neutral-600 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
             </button>
        )}
        <div className="flex justify-between items-start mb-1 pr-6">
            <h3 className="text-base font-bold text-neutral-200 leading-tight tracking-wide">{item.title}</h3>
            <div className="flex flex-col items-end gap-1">
                {item.tags?.map((tag, idx) => (
                    <span key={idx} className={`text-[8px] px-1.5 py-0.5 rounded border tracking-wider ${tag.color === 'gold' ? 'text-amber-200 border-amber-900 bg-amber-950/30' : tag.color === 'red' ? 'text-red-300 border-red-900 bg-red-950/30' : 'text-neutral-400 border-neutral-700 bg-neutral-800'}`}>{tag.label}</span>
                ))}
            </div>
        </div>
        
        {item.tips && item.tips.length > 0 && (
            <div className="mb-2 bg-neutral-950/50 p-2 rounded border border-neutral-800/50">
                <p className="text-[8px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">Guide Notes</p>
                <ul className="list-none space-y-0.5 max-h-[3.8em] overflow-hidden">
                    {item.tips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-[9px] text-neutral-400 flex items-start gap-1.5">
                             <span className="text-amber-500 mt-[1px]">✦</span> 
                             <span className="truncate">{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
            <span className="text-[9px] text-neutral-600 truncate flex-1 mr-4">{item.location}</span>
            <button onClick={handleNavClick} className="flex items-center justify-center bg-neutral-100 text-black w-8 h-8 rounded-full hover:bg-neutral-300 transition-colors shadow-sm active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

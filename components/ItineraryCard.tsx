
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

  const handleSave = () => {
    onSave({ ...formData, navQuery: formData.location });
    setIsEditing(false);
  };

  const handleChange = (field: keyof ItineraryItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
      if (!newTagLabel.trim()) return;
      const newTag: Tag = { label: newTagLabel, color: newTagColor };
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
      setNewTagLabel('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
      setFormData(prev => ({ ...prev, tags: prev.tags?.filter((_, index) => index !== indexToRemove) }));
  };

  if (isEditing) {
    return (
        <div className="flex gap-3 mb-2 relative">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
            <div className="flex flex-col items-center min-w-[32px] z-10">
                <div className="text-xs text-neutral-500 mb-1 opacity-50 font-mono">{formData.time}</div>
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center relative shadow-inner">
                    <TypeIcon type={formData.type} />
                </div>
            </div>
            <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl mb-3 relative ring-1 ring-neutral-700">
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-1">
                            <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 tracking-tighter">Time</label>
                            <input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none focus:border-neutral-400 [color-scheme:dark]" />
                        </div>
                        <div className="col-span-2">
                             <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 tracking-tighter">Type</label>
                             <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none appearance-none bg-neutral-900">
                                {Object.values(ItemType).map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 tracking-tighter">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white font-bold text-sm py-0.5 focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 tracking-tighter">Location</label>
                        <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-neutral-300 text-[10px] py-0.5 focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 tracking-tighter">Tags</label>
                        <div className="flex flex-wrap gap-1 mb-1">
                            {formData.tags?.map((tag, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300">
                                    <span className={`w-1.5 h-1.5 rounded-full ${tag.color === 'gold' ? 'bg-amber-400' : tag.color === 'red' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                                    {tag.label}
                                    <button onClick={() => handleRemoveTag(idx)} className="ml-0.5 w-3 h-3 rounded-full bg-neutral-700 text-white flex items-center justify-center">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-1 items-center bg-neutral-800/50 p-1 rounded border border-neutral-700/50">
                            <input type="text" value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} placeholder="Add" className="flex-1 bg-transparent text-white text-[10px] focus:outline-none" />
                            <button onClick={handleAddTag} className="text-[10px] bg-neutral-700 px-2 py-0.5 rounded text-white font-bold">+</button>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave} className="flex-1 bg-neutral-100 text-black py-1.5 rounded text-[10px] font-bold uppercase">SAVE</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-neutral-300 py-1.5 rounded text-[10px] font-bold uppercase">CANCEL</button>
                        <button onClick={() => onDelete(item.id)} className="w-8 bg-red-950/30 text-red-400 border border-red-900/50 rounded flex items-center justify-center text-[10px]">🗑️</button>
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
        <div className={`text-xs mb-0.5 tracking-tight font-mono ${isActive ? 'text-white font-bold' : 'text-neutral-500'}`}>{item.time}</div>
        <div className={`w-8 h-8 rounded-full bg-neutral-900 border flex items-center justify-center shadow-sm relative transition-all ${isActive ? 'border-white shadow-glow' : 'border-neutral-800'}`}>
          {isSelectMode && isSelected ? <span className="text-black font-bold">✓</span> : <TypeIcon type={item.type} />}
        </div>
      </div>
      <div className={`flex-1 bg-neutral-900 border rounded-xl p-4 shadow-sm mb-4 relative transition-colors ${isActive ? 'border-neutral-600' : 'border-neutral-800'}`}>
        {!isSelectMode && (
             <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute top-2 right-2 p-1.5 text-neutral-600 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
             </button>
        )}
        <div className="mb-2 pr-6">
            <h3 className="text-base font-bold text-neutral-200 leading-tight tracking-tight uppercase">{item.title}</h3>
            <div className="flex flex-wrap gap-1 mt-1.5">
                {item.tags?.map((tag, idx) => (
                    <span key={idx} className={`text-[8px] px-1.5 py-0.5 rounded border tracking-widest font-bold ${tag.color === 'gold' ? 'text-amber-300 border-amber-900 bg-amber-950/20' : tag.color === 'red' ? 'text-red-400 border-red-900 bg-red-950/20' : 'text-neutral-500 border-neutral-800 bg-neutral-900/40'}`}>{tag.label}</span>
                ))}
            </div>
        </div>
        
        {item.tips && item.tips.length > 0 && (
            <div className="mb-3 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/50">
                <ul className="list-none space-y-1 max-h-[4.5em] overflow-hidden">
                    {item.tips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-[10px] text-neutral-400 flex items-start gap-1.5 leading-snug">
                             <span className="text-neutral-700 mt-0.5">·</span> 
                             <span className="truncate">{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-800/60">
            <span className="text-[10px] text-neutral-600 truncate flex-1 pr-6 font-medium">{item.location}</span>
            <button onClick={handleNavClick} className="flex items-center justify-center bg-white text-black w-8 h-8 rounded-full hover:bg-neutral-200 transition-all shadow-lg active:scale-90 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

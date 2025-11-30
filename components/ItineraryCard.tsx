import React, { useState, useEffect } from 'react';
import { ItineraryItem, ItemType, Tag, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  item: ItineraryItem;
  isLast: boolean;
  onSave: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isActive?: boolean;
  lang: Language;
}

const vibrate = () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10); };

const TypeIcon: React.FC<{ type: ItemType }> = ({ type }) => {
  switch (type) {
    case ItemType.FOOD: return <span className="text-base">🍽️</span>;
    case ItemType.RAMEN: return <span className="text-base">🍜</span>;
    case ItemType.COFFEE: return <span className="text-base">☕</span>;
    case ItemType.ALCOHOL: return <span className="text-base">🍺</span>;
    case ItemType.TRANSPORT: return <span className="text-base">🚄</span>;
    case ItemType.SHOPPING: return <span className="text-base">🛍️</span>;
    case ItemType.HOTEL: return <span className="text-base">🏨</span>;
    case ItemType.MISC: return <span className="text-base">🧩</span>;
    case ItemType.SIGHTSEEING: default: return <span className="text-base">⛩️</span>;
  }
};

export const ItineraryCard: React.FC<Props> = ({ item, isLast, onSave, onDelete, isSelectMode, isSelected, onSelect, isActive, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [formData, setFormData] = useState<ItineraryItem>(item);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<'red' | 'gold' | 'gray'>('gray');
  const [showCopied, setShowCopied] = useState(false);

  const T = TRANSLATIONS;

  useEffect(() => { setFormData(item); }, [item]);

  const handleNavClick = () => {
    vibrate();
    if (item.mapsUrl && item.mapsUrl.trim().length > 0) {
        window.open(item.mapsUrl, '_blank');
    } else {
        const query = encodeURIComponent(item.navQuery || item.location);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleLocationClick = () => {
      vibrate();
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(item.location).then(() => {
              setShowCopied(true);
              setTimeout(() => setShowCopied(false), 2000);
          }).catch(err => console.error('Failed to copy', err));
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
          } catch (err) { console.log("Map parse error"); }
      }
      setFormData(prev => ({ ...prev, mapsUrl: url, title: newTitle, location: newLocation }));
  };

  const handleSave = () => { vibrate(); onSave({ ...formData, navQuery: formData.location }); setIsEditing(false); };
  const handleChange = (field: keyof ItineraryItem, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleAddTag = () => { if (!newTagLabel.trim()) return; vibrate(); const newTag: Tag = { label: newTagLabel, color: newTagColor }; setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] })); setNewTagLabel(''); };
  const handleRemoveTag = (indexToRemove: number) => { vibrate(); setFormData(prev => ({ ...prev, tags: prev.tags?.filter((_, index) => index !== indexToRemove) })); };
  
  const handleRemoveTip = (indexToRemove: number) => {
      vibrate();
      setFormData(prev => ({ ...prev, tips: prev.tips?.filter((_, index) => index !== indexToRemove) }));
  };

  if (showCard) {
      return (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-center p-8 animate-fade-in" onClick={() => setShowCard(false)}>
              <div className="text-center space-y-8">
                  <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Location</p><h1 className="text-4xl font-bold text-white leading-tight">{formData.title}</h1></div>
                  <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Address</p><p className="text-2xl text-white leading-relaxed">{formData.location}</p></div>
                  <p className="text-[10px] text-neutral-600 mt-12">Tap to close</p>
              </div>
          </div>
      );
  }

  if (isEditing) {
    return (
        <div className="flex gap-3 mb-2 relative">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
            <div className="flex flex-col items-center min-w-[32px] z-10">
                <div className="text-xs text-neutral-500 mb-1 opacity-50">{formData.time}</div>
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center relative shadow-inner"><TypeIcon type={formData.type} /></div>
            </div>
            <div className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl mb-3 relative ring-1 ring-neutral-700">
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-1"><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Time</label><input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none focus:border-neutral-400 [color-scheme:dark]" /></div>
                        <div className="col-span-2"><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Type</label><select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-sm py-0.5 focus:outline-none focus:border-neutral-400 appearance-none bg-neutral-900">{Object.values(ItemType).map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}</select></div>
                    </div>
                    <div><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Google Maps Link</label><input type="text" value={formData.mapsUrl || ''} onChange={handleMapUrlPaste} placeholder="Paste URL" className="w-full bg-transparent border-b border-neutral-700 text-blue-300 text-[10px] py-0.5 focus:outline-none focus:border-neutral-400" /></div>
                    <div><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Title</label><input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white font-bold text-sm py-0.5 focus:outline-none focus:border-neutral-400" /></div>
                    <div><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Location</label><input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-neutral-300 text-[10px] py-0.5 focus:outline-none focus:border-neutral-400" /></div>
                    <div>
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Tags</label>
                        <div className="flex flex-wrap gap-1 mb-1">
                            {formData.tags?.map((tag, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300">
                                    <span className={`w-1.5 h-1.5 rounded-full ${tag.color === 'gold' ? 'bg-amber-400' : tag.color === 'red' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                                    {tag.label}
                                    <button onClick={() => handleRemoveTag(idx)} className="ml-0.5 w-3 h-3 rounded-full bg-neutral-700 text-white flex items-center justify-center hover:bg-neutral-600">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-1 items-center bg-neutral-800/50 p-1.5 rounded border border-neutral-700/50">
                            <input type="text" value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} placeholder="Add tag" className="flex-1 bg-transparent text-white text-[10px] placeholder-neutral-600 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
                            <button onClick={handleAddTag} className="text-[10px] bg-neutral-700 hover:bg-neutral-600 px-2 py-0.5 rounded text-white font-bold ml-1">+</button>
                        </div>
                    </div>
                    <div><label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Description</label><textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={2} className="w-full bg-transparent border-b border-neutral-700 text-neutral-400 text-[10px] py-0.5 focus:outline-none focus:border-neutral-400 resize-none leading-relaxed normal-case" placeholder="Desc..." /></div>
                    {/* Guide Notes Editor */}
                    {formData.tips && formData.tips.length > 0 && (
                        <div>
                            <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">Guide Notes</label>
                            <ul className="space-y-1">
                                {formData.tips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[10px] text-neutral-300">
                                        <span className="flex-1 bg-transparent border-b border-neutral-800 py-0.5">{tip}</span>
                                        <button onClick={() => handleRemoveTip(idx)} className="text-red-500 hover:text-white px-1">×</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave} className="flex-1 bg-neutral-100 text-black py-1.5 rounded text-[10px] font-bold hover:bg-white uppercase">{T.SAVE[lang]}</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-neutral-300 py-1.5 rounded text-[10px] font-bold hover:bg-neutral-700 uppercase">{T.CANCEL[lang]}</button>
                        <button onClick={() => { vibrate(); onDelete(item.id); }} className="w-8 bg-red-950/30 text-red-400 border border-red-900/50 rounded flex items-center justify-center hover:bg-red-900/50 text-[10px]">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex gap-3 mb-2 relative group">
      {!isLast && !isSelectMode && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
      
      {isSelectMode && (
          <div className="flex flex-col items-center justify-center min-w-[20px] z-20">
              <button onClick={() => onSelect && onSelect(item.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-neutral-600 bg-black'}`}>
                  {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </button>
          </div>
      )}

      <div className="flex flex-col items-center min-w-[32px] z-10">
        {isActive && <div className="absolute -left-[3px] top-[14px] w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-glow-red z-30"></div>}
        <div className={`text-xs mb-0.5 tracking-tight ${isActive ? 'text-white font-bold' : 'text-neutral-500'}`}>{item.time}</div>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm relative transition-all ${isActive ? 'bg-neutral-800 border-red-500 shadow-glow-red' : 'bg-neutral-900 border-neutral-800'}`}><TypeIcon type={item.type} /></div>
      </div>

      <div 
        className={`flex-1 min-w-0 bg-neutral-900 border rounded-lg p-3 shadow-sm mb-3 relative transition-all ${!isSelectMode ? 'hover:border-neutral-700' : ''} ${isActive ? 'border-red-900/50 shadow-glow-red-sm' : 'border-neutral-800'}`}
        onClick={() => { if(isSelectMode && onSelect) onSelect(item.id); }}
      >
        {!isSelectMode && (
            <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); vibrate(); setShowCard(true); }} className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                <button onClick={(e) => { e.stopPropagation(); vibrate(); setIsEditing(true); }} className="text-neutral-600 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1">✎</button>
            </div>
        )}
        
        <div className="flex justify-between items-start mb-1 pr-16">
            <div>
                <h3 className={`text-base font-bold leading-tight tracking-wide flex items-center gap-2 ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                    {item.title}
                    {isActive && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">LIVE</span>}
                </h3>
                {item.weather && <div className="text-[10px] text-blue-300 mt-0.5 flex items-center gap-1">☁️ {item.weather}</div>}
            </div>
        </div>
        <p className="text-[10px] text-neutral-400 leading-relaxed mb-2 whitespace-pre-wrap">{item.description}</p>
        {item.tips && item.tips.length > 0 && (
            <div className="mb-2 bg-neutral-950/50 p-2 rounded border border-neutral-800/50">
                <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1 font-bold">Guide Notes</p>
                <ul className="list-none space-y-0.5">
                    {/* Limit to 3 items */}
                    {item.tips.slice(0, 3).map((tip, idx) => <li key={idx} className="text-[9px] text-neutral-300 flex items-start gap-1.5"><span className="text-amber-500 mt-[1px]">✦</span> <span dangerouslySetInnerHTML={{__html: tip.replace(/(Must Eat|Important|Reservation)/gi, '<b>$1</b>')}} /></li>)}
                </ul>
            </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
            <span onClick={(e) => { e.stopPropagation(); handleLocationClick(); }} className="text-[9px] text-neutral-600 truncate flex-1 min-w-0 mr-4 cursor-pointer hover:text-neutral-400 active:text-white transition-colors relative">
                {showCopied ? <span className="text-green-400 font-bold">COPIED!</span> : item.location}
            </span>
            <button onClick={(e) => { e.stopPropagation(); handleNavClick(); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 text-black hover:bg-neutral-300 transition-colors shadow-glow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

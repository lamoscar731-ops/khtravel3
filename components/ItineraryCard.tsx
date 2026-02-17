
import React, { useState, useEffect } from 'react';
import { ItineraryItem, ItemType, Language } from '../types';

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

  useEffect(() => { setFormData(item); }, [item]);

  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 增量邏輯：優先使用手動輸入的地圖網址
    if (item.mapsUrl) {
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

  const handleRemoveTip = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips?.filter((_, i) => i !== idx)
    }));
  };

  if (isEditing) {
    return (
        <div className="flex gap-3 mb-2 relative max-w-full">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-900 z-0"></div>}
            <div className="flex flex-col items-center min-w-[32px] z-10">
                <div className="text-[10px] text-neutral-600 mb-1 font-mono uppercase">{formData.time}</div>
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center relative shadow-inner">
                    <TypeIcon type={formData.type} />
                </div>
            </div>
            <div className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-xl mb-3 relative ring-1 ring-neutral-800">
                <div className="space-y-3">
                    <div>
                        <label className="text-[9px] text-neutral-600 font-bold block mb-0.5 uppercase tracking-tighter">TIME</label>
                        <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-transparent border-b border-neutral-800 text-white text-xs py-0.5 focus:outline-none [color-scheme:dark]" />
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-600 font-bold block mb-0.5 uppercase tracking-tighter">TITLE</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-neutral-800 text-white font-bold text-xs py-0.5 focus:outline-none" />
                    </div>
                    
                    {/* 增量添加：MAPS URL & ADDRESS */}
                    <div>
                        <label className="text-[9px] text-neutral-600 font-bold block mb-0.5 uppercase tracking-tighter">ADDRESS</label>
                        <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-transparent border-b border-neutral-800 text-white text-[10px] py-0.5 focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] text-neutral-600 font-bold block mb-0.5 uppercase tracking-tighter">MAPS LINK</label>
                        <input type="text" value={formData.mapsUrl || ''} onChange={(e) => setFormData({...formData, mapsUrl: e.target.value})} placeholder="https://goo.gl/maps/..." className="w-full bg-transparent border-b border-neutral-800 text-white text-[9px] py-0.5 focus:outline-none" />
                    </div>

                    {/* Tips Management in Edit Mode */}
                    {formData.tips && formData.tips.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] text-neutral-600 font-bold block uppercase tracking-tighter">AI TIPS</label>
                        {formData.tips.map((tip, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-neutral-800/50 p-2 rounded border border-neutral-700/50">
                            <span className="text-[10px] text-neutral-300 flex-1 break-all whitespace-normal">{tip}</span>
                            <button onClick={() => handleRemoveTip(idx)} className="text-red-500 font-bold px-1.5 active:scale-90">✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave} className="flex-1 bg-white text-black py-1.5 rounded-sm text-[10px] font-bold uppercase active:scale-95 transition-all">SAVE</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-neutral-400 py-1.5 rounded-sm text-[10px] font-bold uppercase active:scale-95 transition-all">CANCEL</button>
                        <button onClick={() => { if(confirm("DELETE?")) onDelete(item.id); }} className="px-2 text-red-500">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-2 relative group max-w-full ${isActive ? 'opacity-100' : 'opacity-90'}`} onClick={() => isSelectMode && onSelect(item.id)}>
      {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-neutral-900 z-0"></div>}
      <div className="flex flex-col items-center min-w-[32px] z-10">
        <div className={`text-[10px] mb-0.5 font-mono ${isActive ? 'text-white font-bold' : 'text-neutral-600'}`}>{item.time}</div>
        <div className={`w-8 h-8 rounded-full bg-neutral-950 border flex items-center justify-center shadow-sm relative transition-all ${isActive ? 'border-white shadow-glow' : 'border-neutral-900'}`}>
          {isSelectMode && isSelected ? <span className="text-black font-bold">✓</span> : <TypeIcon type={item.type} />}
        </div>
      </div>
      <div className={`flex-1 min-w-0 bg-neutral-950 border rounded-xl p-4 shadow-sm mb-4 relative transition-colors ${isActive ? 'border-neutral-700' : 'border-neutral-900'}`}>
        {!isSelectMode && (
             <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute top-3 right-3 p-1.5 text-neutral-800 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
             </button>
        )}
        <div className="mb-2 pr-6">
            <h3 className="text-base font-bold text-neutral-100 leading-tight tracking-tight uppercase break-all whitespace-normal">{item.title}</h3>
        </div>
        
        {item.tips && item.tips.length > 0 && (
            <div className="mb-3 bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-900/50 overflow-hidden">
                <ul className="list-none space-y-1.5">
                    {item.tips.map((tip, idx) => (
                        <li key={idx} className="text-[10px] text-neutral-500 flex items-start gap-2 leading-snug">
                             <span className="text-neutral-700 mt-0.5 flex-shrink-0">·</span> 
                             <span className="break-all whitespace-normal flex-1">{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* 增量添加：顯示備註內容 */}
        {item.description && item.description !== '...' && (
          <p className="text-[10px] text-neutral-400 mt-2 italic leading-relaxed break-words">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-900/60">
            <span className="text-[10px] text-neutral-600 truncate flex-1 pr-4 font-medium uppercase">{item.location}</span>
            <button onClick={handleNavClick} className="flex items-center justify-center bg-white text-black w-8 h-8 rounded-full hover:bg-neutral-200 transition-all shadow-lg active:scale-90 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ItineraryItem, ItemType, Tag } from '../types';

interface Props {
  item: ItineraryItem;
  isLast: boolean;
  onSave: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
}

const TypeIcon: React.FC<{ type: ItemType }> = ({ type }) => {
  switch (type) {
    case ItemType.FOOD: return <span className="text-xl">🥢</span>;
    case ItemType.TRANSPORT: return <span className="text-xl">🚄</span>;
    case ItemType.SHOPPING: return <span className="text-xl">🛍️</span>;
    case ItemType.HOTEL: return <span className="text-xl">🏨</span>;
    default: return <span className="text-xl">⛩️</span>;
  }
};

export const ItineraryCard: React.FC<Props> = ({ item, isLast, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ItineraryItem>(item);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<'red' | 'gold' | 'gray'>('gray');

  useEffect(() => { setFormData(item); }, [item]);

  const handleNavClick = () => {
    const query = encodeURIComponent(item.navQuery || item.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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
        <div className="flex gap-4 mb-2 relative">
            {!isLast && <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
            <div className="flex flex-col items-center min-w-[40px] z-10">
                <div className="text-lg text-neutral-500 mb-1 opacity-50">{formData.time}</div>
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center relative shadow-inner">
                    <TypeIcon type={formData.type} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neutral-800 rounded-full border border-neutral-600 flex items-center justify-center">
                        <span className="text-[8px]">✎</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl p-4 shadow-xl mb-4 relative ring-1 ring-neutral-700">
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-1">
                            <label className="text-[10px] text-neutral-500 font-bold block mb-1">Time</label>
                            <input type="text" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-lg py-1 focus:outline-none focus:border-neutral-400" />
                        </div>
                        <div className="col-span-2">
                             <label className="text-[10px] text-neutral-500 font-bold block mb-1">Type</label>
                             <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white text-lg py-1 focus:outline-none focus:border-neutral-400 appearance-none bg-neutral-900">
                                {Object.values(ItemType).map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-white font-bold text-xl py-1 focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div>
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">Location</label>
                        <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-transparent border-b border-neutral-700 text-neutral-300 text-sm py-1 focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div>
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">Tags / Remarks</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags?.map((tag, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-300">
                                    <span className={`w-2 h-2 rounded-full ${tag.color === 'gold' ? 'bg-amber-400' : tag.color === 'red' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                                    {tag.label}
                                    <button onClick={() => handleRemoveTag(idx)} className="ml-1 w-4 h-4 rounded-full bg-neutral-700 text-white flex items-center justify-center hover:bg-neutral-600">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center bg-neutral-800/50 p-2 rounded-lg border border-neutral-700/50">
                            <input type="text" value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} placeholder="Add tag" className="flex-1 bg-transparent text-white text-xs placeholder-neutral-600 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
                            <div className="flex gap-1 border-l border-neutral-700 pl-2">
                                {(['gray', 'gold', 'red'] as const).map(c => (
                                    <button key={c} onClick={() => setNewTagColor(c)} className={`w-4 h-4 rounded-full border transition-all ${newTagColor === c ? 'border-white scale-110 shadow-glow' : 'border-transparent opacity-40 hover:opacity-100'} ${c === 'gold' ? 'bg-amber-400' : c === 'red' ? 'bg-red-400' : 'bg-gray-400'}`} />
                                ))}
                            </div>
                            <button onClick={handleAddTag} className="text-xs bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded text-white font-bold ml-1">+</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">Description</label>
                        <textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="w-full bg-transparent border-b border-neutral-700 text-neutral-400 text-sm py-1 focus:outline-none focus:border-neutral-400 resize-none leading-relaxed normal-case" placeholder="Description..." />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSave} className="flex-1 bg-neutral-100 text-black py-2 rounded-lg text-sm font-bold hover:bg-white">Save</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-neutral-300 py-2 rounded-lg text-sm font-bold hover:bg-neutral-700">Cancel</button>
                        <button onClick={() => onDelete(item.id)} className="w-10 bg-red-950/30 text-red-400 border border-red-900/50 rounded-lg flex items-center justify-center hover:bg-red-900/50">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex gap-4 mb-2 relative group">
      {!isLast && <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-neutral-800 z-0"></div>}
      <div className="flex flex-col items-center min-w-[40px] z-10">
        <div className="text-lg text-neutral-500 mb-1 tracking-tight">{item.time}</div>
        <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-sm relative">
          <TypeIcon type={item.type} />
        </div>
      </div>
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm mb-4 relative transition-colors hover:border-neutral-700">
        <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-2 text-neutral-600 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
        <div className="flex justify-between items-start mb-2 pr-8">
            <div>
                <h3 className="text-xl font-bold text-neutral-200 leading-tight tracking-wide">{item.title}</h3>
                {item.weather && <div className="text-sm text-blue-300 mt-1 flex items-center gap-1">☁️ {item.weather}</div>}
            </div>
            <div className="flex flex-col items-end gap-1">
                {item.tags?.map((tag, idx) => (
                    <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border tracking-wider ${tag.color === 'gold' ? 'text-amber-200 border-amber-900 bg-amber-950/30' : tag.color === 'red' ? 'text-red-300 border-red-900 bg-red-950/30' : 'text-neutral-400 border-neutral-700 bg-neutral-800'}`}>{tag.label}</span>
                ))}
            </div>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed mb-3 whitespace-pre-wrap">{item.description}</p>
        {item.tips && item.tips.length > 0 && (
            <div className="mb-4 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-bold">Guide Notes</p>
                <ul className="list-none space-y-1">
                    {item.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                             <span className="text-amber-500 mt-0.5">✦</span> 
                             <span dangerouslySetInnerHTML={{__html: tip.replace(/(Must Eat|Important|Reservation)/gi, '<b>$1</b>')}} />
                        </li>
                    ))}
                </ul>
            </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-600 truncate max-w-[150px]">{item.location}</span>
            <button onClick={handleNavClick} className="flex items-center gap-2 bg-neutral-100 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-neutral-300 transition-colors">
                <span>Navigate</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from "react";
import { Language } from "../types";

interface Props {
  lang: Language;
  onImport: (text: string) => Promise<void>;
}

export const PasteItineraryImport: React.FC<Props> = ({ lang, onImport }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const tc = lang === "TC";

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onImport(text.trim());
      setText("");
    } catch {
      // The parent presents the request error; retain the pasted text for retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-neutral-800 pt-4">
      <h5 className="mb-1 text-[10px] font-bold uppercase text-neutral-400">{tc ? "貼上文字匯入行程" : "Paste text to import itinerary"}</h5>
      <p className="mb-2 text-[9px] text-neutral-600">{tc ? "保留已列明的地點和時間；沒有日期的日子會由今天起順序安排。" : "Keeps stated places and times. Days without dates start from today."}</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={20000}
        rows={4}
        placeholder={tc ? "貼上行程文字…" : "Paste itinerary text…"}
        className="w-full resize-y rounded-lg border border-neutral-700 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-400"
      />
      <button onClick={submit} disabled={!text.trim() || busy} className="mt-2 w-full rounded-lg bg-neutral-800 py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
        {busy ? (tc ? "整理中…" : "Parsing…") : (tc ? "加入行程" : "Add to itinerary")}
      </button>
    </div>
  );
};

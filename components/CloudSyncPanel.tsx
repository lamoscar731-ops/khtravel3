import React, { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Trip } from "../types";
import {
  acceptCloudInvite, cloudSyncConfigured, CloudTripRow, createCloudInvite, createCloudTrip,
  getCloudTrip, sendCloudSignInLink, subscribeToCloudTrip, supabase, toCloudTripData, updateCloudTrip,
} from "../services/cloudSyncService";

interface Props {
  trip: Trip | null;
  lang: "EN" | "TC";
  onAttach: (cloudId: string) => void;
  onJoin: (trip: Trip, cloudId: string) => void;
  onReplace: (trip: Trip) => void;
}

export const CloudSyncPanel: React.FC<Props> = ({ trip, lang, onAttach, onJoin, onReplace }) => {
  const tc = lang === "TC";
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [cloudRow, setCloudRow] = useState<CloudTripRow | null>(null);
  const [conflictRow, setConflictRow] = useState<CloudTripRow | null>(null);
  const appliedRemote = useRef(false);
  const saving = useRef(false);
  const inviteStarted = useRef(false);
  const tripRef = useRef(trip);
  const cloudRowRef = useRef(cloudRow);
  tripRef.current = trip;
  cloudRowRef.current = cloudRow;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("tripInvite") || localStorage.getItem("kuro_pending_trip_invite");
    if (token) {
      setInviteToken(token);
      localStorage.setItem("kuro_pending_trip_invite", token);
      params.delete("tripInvite");
      const suffix = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash}`);
    }
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) { setCloudRow(null); setConflictRow(null); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !inviteToken || inviteStarted.current) return;
    inviteStarted.current = true;
    setBusy(true);
    void (async () => {
      try {
        const cloudId = await acceptCloudInvite(inviteToken);
        const row = await getCloudTrip(cloudId);
        setCloudRow(row);
        onJoin({ ...(row.trip_data as Trip), id: `shared-${cloudId}`, cloudId }, cloudId);
        setInviteToken("");
        localStorage.removeItem("kuro_pending_trip_invite");
        setMessage(tc ? "已加入共享行程。" : "Joined the shared trip.");
      } catch (error) {
        inviteStarted.current = false;
        setMessage(error instanceof Error ? error.message : (tc ? "邀請無效或已過期。" : "Invite is invalid or expired."));
      } finally { setBusy(false); }
    })();
  }, [user, inviteToken, tc]);

  useEffect(() => {
    if (!user || !trip?.cloudId) { setCloudRow(null); return; }
    let cancelled = false;
    void getCloudTrip(trip.cloudId).then((row) => {
      if (cancelled) return;
      setCloudRow(row);
      if (JSON.stringify(toCloudTripData(trip)) !== JSON.stringify(row.trip_data)) {
        setConflictRow(row);
        setMessage(tc ? "本機和雲端版本不同，請選擇要保留的版本。" : "Local and cloud versions differ. Choose which one to keep.");
      }
    }).catch((error) => {
      if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load shared trip.");
    });
    return () => { cancelled = true; };
  }, [user, trip?.cloudId]);

  useEffect(() => {
    if (!user || !trip?.cloudId) return;
    return subscribeToCloudTrip(trip.cloudId, () => {
      void getCloudTrip(trip.cloudId!).then((row) => {
        const current = tripRef.current;
        if (!current) return;
        if (saving.current) return;
        const localData = JSON.stringify(toCloudTripData(current));
        const cloudData = JSON.stringify(row.trip_data);
        const previous = cloudRowRef.current;
        if (previous?.updated_at === row.updated_at) return;
        if (previous && JSON.stringify(previous.trip_data) !== localData) {
          setConflictRow(row);
          setMessage(tc ? "雲端行程同時有更新，請選擇保留哪個版本。" : "The cloud trip changed too. Choose which version to keep.");
          return;
        }
        if (localData !== cloudData) {
          appliedRemote.current = true;
          onReplace({ ...(row.trip_data as Trip), id: current.id, cloudId: row.id });
        }
        setCloudRow(row);
        setMessage(tc ? "已同步最新行程。" : "Latest trip changes synced.");
      }).catch((error) => setMessage(error instanceof Error ? error.message : "Could not refresh shared trip."));
    });
  }, [user, trip?.cloudId, tc, onReplace]);

  useEffect(() => {
    if (!user || !trip?.cloudId || !cloudRow || conflictRow) return;
    if (appliedRemote.current) { appliedRemote.current = false; return; }
    if (JSON.stringify(toCloudTripData(trip)) === JSON.stringify(cloudRow.trip_data)) return;
    const timer = window.setTimeout(() => {
      saving.current = true;
      void updateCloudTrip(cloudRow, trip).then((result) => {
        if (result.applied) {
          setCloudRow(result.row);
          setMessage(tc ? "已儲存至共享行程。" : "Saved to shared trip.");
        } else {
          setConflictRow(result.row);
          setMessage(tc ? "另一部裝置同時修改了行程。" : "The trip changed on another device.");
        }
      }).catch((error) => setMessage(error instanceof Error ? error.message : "Cloud save failed.")).finally(() => { saving.current = false; });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [user, trip, cloudRow, conflictRow, tc]);

  const signIn = async () => {
    setBusy(true);
    try {
      await sendCloudSignInLink(email.trim());
      setMessage(tc ? "登入連結已寄出，請查看電郵。" : "Sign-in link sent. Check your email.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not send sign-in link."); }
    finally { setBusy(false); }
  };

  const enableSync = async () => {
    if (!trip) return;
    setBusy(true);
    try {
      const row = await createCloudTrip(trip);
      setCloudRow(row);
      onAttach(row.id);
      setMessage(tc ? "已建立雲端行程。" : "Cloud trip created.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not enable cloud sync."); }
    finally { setBusy(false); }
  };

  const makeInvite = async () => {
    if (!trip?.cloudId) return;
    setBusy(true);
    try {
      const token = await createCloudInvite(trip.cloudId);
      setInviteUrl(`${window.location.origin}${window.location.pathname}?tripInvite=${token}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create invite."); }
    finally { setBusy(false); }
  };

  const resolveConflict = async (useCloud: boolean) => {
    if (!conflictRow || !trip) return;
    if (useCloud) {
      onReplace({ ...(conflictRow.trip_data as Trip), id: trip.id, cloudId: conflictRow.id });
      setCloudRow(conflictRow);
      setConflictRow(null);
      setMessage(tc ? "已使用雲端版本。" : "Using the cloud version.");
      return;
    }
    setBusy(true);
    try {
      saving.current = true;
      const result = await updateCloudTrip(conflictRow, tripRef.current || trip);
      if (result.applied) { setCloudRow(result.row); setConflictRow(null); setMessage(tc ? "已保留本機版本並同步。" : "Kept this version and synced it."); }
      else setConflictRow(result.row);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not resolve the update."); }
    finally { saving.current = false; setBusy(false); }
  };

  const signOut = async () => { await supabase?.auth.signOut(); setInviteUrl(""); setMessage(""); };
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setMessage(tc ? "邀請連結已複製。" : "Invite link copied."); }
    catch { setMessage(tc ? "複製失敗，請手動複製連結。" : "Copy failed. Select and copy the invite link."); }
  };

  return (
    <div className="mt-4 border-t border-neutral-800 pt-4">
      <h5 className="mb-1 text-[10px] font-bold uppercase text-neutral-400">{tc ? "兩人雲端同步" : "Shared cloud sync"}</h5>
      {!cloudSyncConfigured ? <p className="text-[9px] text-neutral-600">{tc ? "尚未設定雲端連線；需先建立 Supabase 專案並設定 Vercel 環境變數。" : "Cloud connection is not configured yet. Set up a Supabase project and Vercel environment variables first."}</p> : !user ? (
        <div className="space-y-2">
          {inviteToken && <p className="text-[9px] text-amber-600">{tc ? "請登入以接受共享行程邀請。" : "Sign in to accept the shared-trip invite."}</p>}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={tc ? "你的電郵地址" : "Your email address"} className="h-9 w-full rounded-lg border border-neutral-700 bg-black px-3 text-xs text-white outline-none focus:border-neutral-400" />
          <button onClick={signIn} disabled={!email.includes("@") || busy} className="w-full rounded-lg bg-neutral-800 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">{busy ? (tc ? "處理中…" : "Working…") : (tc ? "電郵登入連結" : "Email me a sign-in link")}</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[9px] text-neutral-500">{tc ? "已登入：" : "Signed in: "}{user.email}</p>
          {inviteToken ? <p className="text-[9px] text-amber-500">{busy ? (tc ? "正在加入行程…" : "Joining trip…") : (tc ? "正在接受邀請。" : "Accepting invite.")}</p> : !trip ? <p className="text-[9px] text-neutral-600">{tc ? "先選擇一個行程。" : "Select a trip first."}</p> : !trip.cloudId ? (
            <button onClick={enableSync} disabled={busy} className="w-full rounded-lg bg-neutral-800 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">{busy ? "…" : (tc ? "將此行程同步至雲端" : "Enable cloud sync for this trip")}</button>
          ) : <>
            <p className="text-[9px] text-emerald-700">{tc ? "此行程已同步；更新會自動分享。" : "This trip is synced; changes are shared automatically."}</p>
            <button onClick={makeInvite} disabled={busy} className="w-full rounded-lg bg-neutral-800 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">{tc ? "建立女朋友邀請連結" : "Create partner invite link"}</button>
            {inviteUrl && <div className="space-y-1"><input readOnly value={inviteUrl} onFocus={(event) => event.target.select()} className="h-9 w-full rounded-lg border border-neutral-700 bg-black px-2 text-[9px] text-neutral-300" /><button onClick={copyInvite} className="w-full rounded-lg border border-neutral-700 py-1.5 text-[9px] text-neutral-300">{tc ? "複製連結" : "Copy invite link"}</button><p className="text-[8px] text-neutral-600">{tc ? "連結限時 7 日並只可使用一次。" : "Link expires in 7 days and can be used once."}</p></div>}
          </>}
          {conflictRow && <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-2"><p className="mb-2 text-[9px] text-amber-500">{message}</p><div className="flex gap-2"><button onClick={() => void resolveConflict(true)} className="flex-1 rounded bg-neutral-800 py-1.5 text-[9px] text-white">{tc ? "使用雲端版本" : "Use cloud version"}</button><button onClick={() => void resolveConflict(false)} disabled={busy} className="flex-1 rounded bg-white py-1.5 text-[9px] font-bold text-black">{tc ? "保留我的版本" : "Keep my version"}</button></div></div>}
          {message && !conflictRow && <p className="text-[9px] text-neutral-500">{message}</p>}
          <button onClick={() => void signOut()} className="text-[9px] text-neutral-700 underline">{tc ? "登出雲端" : "Sign out"}</button>
        </div>
      )}
    </div>
  );
};

import { createClient } from "@supabase/supabase-js";
import type { Trip } from "../types";

const env = import.meta.env as ImportMetaEnv & {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

export const cloudSyncConfigured = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const supabase = cloudSyncConfigured
  ? createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_PUBLISHABLE_KEY!)
  : null;

export interface CloudTripRow {
  id: string;
  trip_data: Omit<Trip, "id" | "cloudId">;
  updated_at: string;
}

export function toCloudTripData(trip: Trip): CloudTripRow["trip_data"] {
  const { id: _localId, cloudId: _cloudId, ...data } = trip;
  return data;
}

function client() {
  if (!supabase) throw new Error("Cloud sync is not configured for this app yet.");
  return supabase;
}

export async function sendCloudSignInLink(email: string) {
  const { error } = await client().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function createCloudTrip(trip: Trip): Promise<CloudTripRow> {
  const api = client();
  const { data: auth } = await api.auth.getUser();
  if (!auth.user) throw new Error("Sign in before enabling cloud sync.");
  const { data, error } = await api.from("shared_trips").insert({ owner_id: auth.user.id, trip_data: toCloudTripData(trip) }).select("id,trip_data,updated_at").single();
  if (error) throw error;
  return data as CloudTripRow;
}

export async function getCloudTrip(id: string): Promise<CloudTripRow> {
  const { data, error } = await client().from("shared_trips").select("id,trip_data,updated_at").eq("id", id).single();
  if (error) throw error;
  return data as CloudTripRow;
}

export async function createCloudInvite(id: string): Promise<string> {
  const { data, error } = await client().rpc("create_shared_trip_invite", { p_trip_id: id });
  if (error) throw error;
  return data as string;
}

export async function acceptCloudInvite(token: string): Promise<string> {
  const { data, error } = await client().rpc("accept_shared_trip_invite", { p_token: token });
  if (error) throw error;
  return data as string;
}

export async function updateCloudTrip(row: CloudTripRow, trip: Trip): Promise<{ applied: boolean; row: CloudTripRow }> {
  const { data, error } = await client().rpc("update_shared_trip_if_current", {
    p_trip_id: row.id,
    p_trip_data: toCloudTripData(trip),
    p_expected_updated_at: row.updated_at,
  });
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return { applied: Boolean(result.applied), row: { id: row.id, trip_data: result.trip_data, updated_at: result.updated_at } as CloudTripRow };
}

export function subscribeToCloudTrip(id: string, onChange: () => void) {
  const api = client();
  const channel = api.channel(`shared-trip-${id}`).on("postgres_changes", {
    event: "UPDATE", schema: "public", table: "shared_trips", filter: `id=eq.${id}`,
  }, onChange).subscribe();
  return () => { void api.removeChannel(channel); };
}

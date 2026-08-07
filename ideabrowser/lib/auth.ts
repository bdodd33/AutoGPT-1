import "server-only";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  email: string | null;
  role: "user" | "admin";
  plan: "free" | "starter" | "pro";
  skills: string[] | null;
  capital: string | null;
  time_commitment: string | null;
  interests: string[] | null;
}

// Current signed-in user, or null (also null in seed-data mode).
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Current user's profile row, or null.
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

// Curated titles a rep can pick from in Settings. Mirrors the
// public.profile_title Postgres enum (see supabase/migrations/0042…).
// Adding a new option requires both:
//   1. a migration: alter type public.profile_title add value '<new>';
//   2. updating the array below so the UI offers it.

import type { Database } from "@/lib/supabase/types"

export type ProfileTitle = Database["public"]["Enums"]["profile_title"]

export const PROFILE_TITLES: readonly ProfileTitle[] = [
  "Founder",
  "Co-Founder",
  "CEO",
  "President",
  "Partner",
  "Sales Lead",
  "Account Executive",
  "Business Development",
  "Marketing Lead",
]

export function isProfileTitle(value: string): value is ProfileTitle {
  return (PROFILE_TITLES as readonly string[]).includes(value)
}

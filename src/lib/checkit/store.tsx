import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserProfile } from "./rules";

const KEY = "checkit-profile-v1";

interface Ctx {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
  setScreening: (
    id: string,
    patch: NonNullable<UserProfile["screenings"]>[string],
  ) => void;
  reset: () => void;
}

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);

  const update = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));
  const setScreening: Ctx["setScreening"] = (id, patch) =>
    setProfile((p) => ({
      ...p,
      screenings: { ...(p.screenings ?? {}), [id]: { ...(p.screenings?.[id] ?? {}), ...patch } },
    }));
  const reset = () => setProfile({});

  return <ProfileContext.Provider value={{ profile, update, setScreening, reset }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

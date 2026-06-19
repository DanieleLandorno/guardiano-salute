import { createContext, useContext, useState, type ReactNode } from "react";
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

function persist(p: Partial<UserProfile>) {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Partial<UserProfile>>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const update = (patch: Partial<UserProfile>) =>
    setProfile((p) => {
      const next = { ...p, ...patch };
      persist(next);
      return next;
    });

  const setScreening: Ctx["setScreening"] = (id, patch) =>
    setProfile((p) => {
      const next = {
        ...p,
        screenings: { ...(p.screenings ?? {}), [id]: { ...(p.screenings?.[id] ?? {}), ...patch } },
      };
      persist(next);
      return next;
    });

  const reset = () => {
    setProfile({});
    persist({});
  };

  return <ProfileContext.Provider value={{ profile, update, setScreening, reset }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

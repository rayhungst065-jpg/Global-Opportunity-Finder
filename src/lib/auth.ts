import { createContext, createElement, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const UserContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });

/** One identity boundary: discard caches before publishing a different account,
 * and remount descendants so drafts, previews and account-specific state reset. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const identity = useRef<string | null>(null);
  const qc = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let revision = 0;
    function publish(next: User | null) {
      if (!active) return;
      if (identity.current !== (next?.id ?? null)) {
        qc.clear();
        identity.current = next?.id ?? null;
      }
      setUser(next);
      setReady(true);
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      revision += 1;
      // Handle identity changes even on refresh/initial-session events, but do
      // not refetch on routine token refreshes.
      publish(session?.user ?? null);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void qc.invalidateQueries();
    });
    const initialRevision = revision;
    void supabase.auth.getUser().then(({ data }) => {
      if (revision === initialRevision) publish(data.user ?? null);
    }).catch(() => {
      if (revision === initialRevision) publish(null);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [qc, router]);

  return createContextProvider({ user, ready }, children);
}

function createContextProvider(value: { user: User | null; ready: boolean }, children: ReactNode) {
  // This .ts module uses createElement rather than JSX.
  return createElement(UserContext.Provider, { value }, createElement(Fragment, { key: value.user?.id ?? "signed-out" }, children));
}

/** Current signed-in identity shared by every account-owned query. */
export function useUser() {
  return useContext(UserContext);
}

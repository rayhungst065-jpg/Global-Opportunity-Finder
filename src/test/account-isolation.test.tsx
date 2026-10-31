import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const auth = vi.hoisted(() => ({
  listener: undefined as undefined | ((event: string, session: { user: User } | null) => void),
  resolve: undefined as undefined | ((value: { data: { user: User | null } }) => void),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  onAuthStateChange: vi.fn((listener) => { auth.listener = listener; return { data: { subscription: { unsubscribe: auth.unsubscribe } } }; }),
  getUser: vi.fn(() => new Promise((resolve) => { auth.resolve = resolve; })),
} } }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
const router = { invalidate: vi.fn() };
import { AuthProvider, useUser } from "@/lib/auth";

function student(id: string) { return { id } as User; }
function Child() {
  const { user } = useUser();
  const [draft, setDraft] = useState("");
  return <><span data-testid="identity">{user?.id ?? "none"}</span><input aria-label="private draft" value={draft} onChange={(e) => setDraft(e.target.value)} /></>;
}
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><AuthProvider><Child /></AuthProvider></QueryClientProvider>);
  return { client, ...view };
}
function transition(id: string | null, event = "SIGNED_IN") {
  if (!auth.listener) throw new Error("Listener not installed");
  auth.listener(event, id ? { user: student(id) } : null);
}
beforeEach(() => { auth.listener = undefined; auth.resolve = undefined; vi.clearAllMocks(); });
describe("Account transition privacy", () => {
  it("clears old personal queries before showing the next account", async () => {
    const view = mount();
    act(() => transition("A"));
    view.client.setQueryData(["personal-records"], ["Account A private data"]);
    act(() => transition("B"));
    await waitFor(() => expect(view.getByTestId("identity").textContent).toBe("B"));
    expect(view.client.getQueryData(["personal-records"])).toBeUndefined();
  });
  it("remounts private form drafts across account changes", async () => {
    const view = mount();
    act(() => transition("A"));
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(view.getByLabelText("private draft"), { target: { value: "A secret draft" } });
    expect((view.getByLabelText("private draft") as HTMLInputElement).value).toBe("A secret draft");
    act(() => transition("B"));
    expect((view.getByLabelText("private draft") as HTMLInputElement).value).toBe("");
  });
  it("does not let a delayed initial identity overwrite a newer account", async () => {
    const view = mount();
    act(() => transition("B"));
    await act(async () => { auth.resolve?.({ data: { user: student("A") } }); });
    expect(view.getByTestId("identity").textContent).toBe("B");
  });
  it("clears personal data when signing out", () => {
    const view = mount();
    act(() => transition("A"));
    view.client.setQueryData(["personal-records"], ["private"]);
    act(() => transition(null, "SIGNED_OUT"));
    expect(view.client.getQueryData(["personal-records"])).toBeUndefined();
    expect(view.getByTestId("identity").textContent).toBe("none");
  });
  it("retains current-account data on routine token refresh", () => {
    const view = mount();
    act(() => transition("A"));
    view.client.setQueryData(["personal-records"], ["A"]);
    router.invalidate.mockClear();
    act(() => transition("A", "TOKEN_REFRESHED"));
    expect(view.client.getQueryData(["personal-records"])).toEqual(["A"]);
    expect(router.invalidate).not.toHaveBeenCalled();
  });
});
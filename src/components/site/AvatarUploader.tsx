import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { AVATAR_TYPES, useAvatarActions, validateAvatar } from "@/lib/avatar";
import { Button } from "@/components/ui/button";

/** Pick → preview → save, plus replace and remove. */
export function AvatarUploader({ userId, path, name }: { userId: string; path: string | null; name: string | null }) {
  const { upload, remove } = useAvatarActions(userId, path);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    setMsg(null);
    if (!f) return;
    const bad = validateAvatar(f);
    if (bad) return setMsg({ ok: false, text: bad });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  function cancel() { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }
  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true); setMsg(null);
    try { await fn(); cancel(); setMsg({ ok: true, text: ok }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  const btn = "rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50";
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Profile picture</h2>
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <Avatar path={path} name={name} size="lg" src={preview ?? undefined} />
        <div className="space-y-3">
          <input ref={fileRef} id="avatar-file" type="file" accept={AVATAR_TYPES.join(",")} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => run(() => upload(file), "Picture saved.")} className={btn}>{busy ? "Saving…" : "Save picture"}</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={cancel} className={`${btn} text-muted-foreground`}>Cancel</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <label htmlFor="avatar-file" className={`${btn} cursor-pointer border border-border hover:bg-accent focus-within:ring-4`}>{path ? "Replace picture" : "Upload picture"}</label>
              {path && <Button type="button" variant="ghost" disabled={busy} onClick={() => run(remove, "Picture removed.")} className={`${btn} text-muted-foreground hover:text-destructive`}>Remove</Button>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 8 MB. Stored privately.</p>
          {msg && <p role="status" className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
        </div>
      </div>
    </section>
  );
}

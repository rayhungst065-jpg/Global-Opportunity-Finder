import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { Avatar } from "@/components/site/Avatar";
import { sendRequest, respondRequest, type StudentCard, type ConnectionRow } from "@/lib/connections.functions";

const btn = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-50";
const ns = <span className="text-muted-foreground">Not specified</span>;

/** Add Friend / Request Sent / Accept Request / Friends, based on the real connection row. */
export function ConnectButton({ studentId, rows }: { studentId: string; rows: ConnectionRow[] }) {
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const row = rows.find((r) => (r.outgoing ? r.addressee_id : r.requester_id) === studentId);
  const done = { onSuccess: () => { setErr(""); qc.invalidateQueries({ queryKey: ["my-connections"] }); }, onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Something went wrong.") };
  const send = useMutation({ mutationFn: () => sendRequest({ data: { to: studentId } }), ...done });
  const accept = useMutation({ mutationFn: (id: string) => respondRequest({ data: { id, accept: true } }), ...done });

  let el: React.ReactNode;
  if (row?.status === "accepted") el = <span className={`${btn} bg-teal-soft text-teal`}><Check className="h-3.5 w-3.5" /> Friends</span>;
  else if (row?.status === "pending" && row.outgoing) el = <span className={`${btn} border border-border text-muted-foreground`}>Request Sent</span>;
  else if (row?.status === "pending") el = <button disabled={accept.isPending} onClick={() => accept.mutate(row.id)} className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}><Check className="h-3.5 w-3.5" /> Accept Request</button>;
  else if (row?.status === "declined" && !row.outgoing) el = <span className={`${btn} border border-border text-muted-foreground`}>Request declined</span>;
  else el = <button disabled={send.isPending} onClick={() => send.mutate()} className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}><UserPlus className="h-3.5 w-3.5" /> {send.isPending ? "Sending…" : "Add Friend"}</button>;
  return <div>{el}{err && <p role="alert" className="mt-1.5 text-xs text-destructive">{err}</p>}</div>;
}

/** Compact discovery card: Name, Country, Intended Major, Interests. No bio. */
export function StudentCardView({ s, action }: { s: StudentCard; action?: React.ReactNode }) {
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <Link to="/students/$id" params={{ id: s.id }} className="flex items-center gap-3 hover:opacity-80">
        <Avatar path={s.avatar_path} name={s.display_name} size="sm" />
        <p className="min-w-0 truncate font-medium">{s.display_name}</p>
      </Link>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted-foreground">Country</dt><dd className="min-w-0 truncate">{s.country_region || ns}</dd></div>
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted-foreground">Intended Major</dt><dd className="min-w-0 truncate">{s.intended_major || ns}</dd></div>
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted-foreground">Interests</dt>
          <dd className="flex min-w-0 flex-wrap gap-1.5">{s.interests.length ? s.interests.slice(0, 4).map((i) => <span key={i} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-accent-foreground">{i}</span>) : ns}</dd></div>
      </dl>
      {action && <div className="mt-auto pt-4">{action}</div>}
    </li>
  );
}

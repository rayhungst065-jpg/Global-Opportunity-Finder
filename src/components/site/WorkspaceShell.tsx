import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Compass, Sparkles, Bookmark, CalendarClock,
  Users, Handshake, GraduationCap, Settings, ChevronDown,
  UserRound, Pencil, LogOut, Home, MessageCircle,
} from "lucide-react";
import { LogoSymbol } from "./SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./Avatar";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

/** Avatar + name at the top of the sidebar; opens the profile menu. */
function SidebarUser() {
  const { user } = useUser();
  const p = useProfile(user?.id).data;
  const signOut = useSignOut();
  if (!user) return null;
  const name = p?.display_name || "Add your name";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-soft transition hover:bg-accent">
        <Avatar path={p?.avatar_path} name={p?.display_name ?? user.email} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground">My account</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile"><UserRound className="h-4 w-4" /> View Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" search={{ edit: true }}><Pencil className="h-4 w-4" /> Edit Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/meet-students"><Handshake className="h-4 w-4" /> My Connections</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings"><Settings className="h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4" /> Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Opportunity Assistant", icon: MessageCircle },
  { to: "/opportunities", label: "Explore Opportunities", icon: Compass },
  { to: "/recommended", label: "Recommended for Me", icon: Sparkles },
  { to: "/saved", label: "Saved Opportunities", icon: Bookmark },
  { to: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { to: "/communities", label: "Communities", icon: Users },
  { to: "/meet-students", label: "Meet Students", icon: Handshake },
  { to: "/college-match", label: "College Research", icon: GraduationCap },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

/** Logged-in student workspace: left sidebar on desktop, scrollable tab bar on mobile. */
export function WorkspaceShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const link = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground";
  const active = { className: "bg-primary-soft font-medium text-accent-foreground" };
  return (
    <div className="min-h-screen bg-surface md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background px-4 py-6 md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-2"><LogoSymbol /></div>
        <SidebarUser />
        <nav className="mt-6 space-y-0.5" aria-label="Student workspace">
          {items.map((i) => (
            <Link key={i.to} to={i.to} className={link} activeProps={active}>
              <i.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <Link to="/" className={link}><Home className="h-4 w-4 shrink-0" /> Back to homepage</Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border bg-background md:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <LogoSymbol className="h-8" />
            <div className="flex items-center gap-3 text-sm">
              <Link to="/profile" className="text-muted-foreground">Profile</Link>
              <Link to="/" className="text-muted-foreground">Home</Link>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Student workspace">
            {items.map((i) => (
              <Link key={i.to} to={i.to} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground" activeProps={active}>
                <i.icon className="h-3.5 w-3.5" />
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10">
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

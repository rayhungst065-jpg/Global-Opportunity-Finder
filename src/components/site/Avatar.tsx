import { useAvatarUrl } from "@/lib/avatar";

const sizes = { sm: "h-9 w-9 text-sm", md: "h-14 w-14 text-lg", lg: "h-24 w-24 text-3xl" } as const;

/** Profile picture with an initial-letter fallback. */
export function Avatar({ path, name, size = "md", src }: { path?: string | null; name?: string | null; size?: keyof typeof sizes; src?: string }) {
  const url = useAvatarUrl(src ? null : path);
  const img = src ?? url.data;
  const initial = (name?.trim()[0] ?? "?").toUpperCase();
  return (
    <span className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-accent-foreground ring-2 ring-background ${sizes[size]}`}>
      {img ? <img src={img} alt={name ? `${name}'s profile picture` : "Profile picture"} className="h-full w-full object-cover" /> : <span aria-hidden>{initial}</span>}
    </span>
  );
}

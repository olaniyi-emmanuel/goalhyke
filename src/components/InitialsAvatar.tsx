"use client";

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string) {
  const safe = (name ?? "").trim();
  if (!safe) return "?";

  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

const palette = [
  { from: "#4169e1", to: "#7655fb" },
  { from: "#7655fb", to: "#4169e1" },
  { from: "#2b2b44", to: "#7655fb" },
  { from: "#4169e1", to: "#2b2b44" },
];

export default function InitialsAvatar({
  name,
  src,
  size = 40,
  seed,
  className = "",
}: {
  name?: string;
  src?: string | null;
  size?: number;
  seed?: string;
  className?: string;
}) {
  const initials = getInitials(name);
  const index = hashSeed(seed ?? name ?? "goalhyke") % palette.length;
  const colors = palette[index];

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={name ?? "Avatar"}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }}
      aria-label={name ? `${name} avatar` : "Avatar"}
    >
      <span
        className="font-secondary font-bold"
        style={{ fontSize: Math.max(12, Math.round(size * 0.38)) }}
      >
        {initials}
      </span>
    </div>
  );
}

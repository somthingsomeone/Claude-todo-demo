import type { Doctor, SpecialtySlug } from "@/lib/doctors";

const TINTS: Record<SpecialtySlug, [string, string, string]> = {
  // [light, deep, accent]
  dermatology: ["#E3EEFF", "#A9C7FF", "#5B8CFF"],
  cosmetic: ["#F0E8FF", "#C8B4FF", "#8B6CF0"],
  eyes: ["#DFF5FF", "#A0D9F8", "#2C9ADB"],
  dental: ["#E2F7F0", "#A4DEC9", "#2FA37C"],
  physio: ["#FFEDE2", "#FFC6A3", "#F07E3A"],
};

/**
 * Doctor photo. Without a permitted photo we show the first letter of the name on a soft
 * tint — never a stock photo pretending to be the doctor.
 */
export function Avatar({ doctor, className }: { doctor: Doctor; className?: string }) {
  if (doctor.photo) {
    return <img src={doctor.photo} alt={`صورة ${doctor.name}`} className={`avatar ${className ?? ""}`} />;
  }
  const [light, deep, accent] = TINTS[doctor.specialty];
  const id = `av-${doctor.slug}`;
  return (
    <svg
      viewBox="0 0 160 200"
      preserveAspectRatio="xMidYMid slice"
      className={`avatar ${className ?? ""}`}
      role="img"
      aria-label="لا توجد صورة للطبيب"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <rect width="160" height="200" fill={`url(#${id}-bg)`} />
      <circle cx="80" cy="200" r="110" fill="#fff" opacity="0.2" />
      <circle cx="80" cy="92" r="44" fill="#fff" opacity="0.7" />
      <text x="80" y="92" textAnchor="middle" dominantBaseline="central" fontSize="44" fontWeight="600" fill={accent}>
        {doctor.name.charAt(0)}
      </text>
    </svg>
  );
}

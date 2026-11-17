import type { Doctor } from "@/lib/doctors";

/**
 * The doctor's photo (shown only after the doctor approved it). Until the owner adds one,
 * a quiet circle with the first letter of the name holds its place.
 */
export function DoctorPhoto({
  doctor,
  size = "md",
  decorative = false,
}: {
  doctor: Pick<Doctor, "name" | "photo">;
  size?: "md" | "lg";
  /** true where the name is already written beside the photo */
  decorative?: boolean;
}) {
  const cls = `avatar avatar--${size}`;
  if (doctor.photo) {
    return <img className={cls} src={doctor.photo} alt={decorative ? "" : `صورة ${doctor.name}`} loading={size === "lg" ? "eager" : "lazy"} />;
  }
  return (
    <span className={`${cls} avatar--empty`} aria-hidden="true">
      {doctor.name.trim().charAt(0)}
    </span>
  );
}

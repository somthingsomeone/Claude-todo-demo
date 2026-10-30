/** A blank the owner must fill in before launch (highlighted so it can't be missed). */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <mark className="placeholder">[{children}]</mark>;
}

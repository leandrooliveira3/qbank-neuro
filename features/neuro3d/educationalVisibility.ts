interface IllustrativeVessel { id: string; variant: boolean; embryonic: boolean }
interface VisibilityOptions {
  illustrations: boolean;
  variants: boolean;
  embryonic: boolean;
  selected: string | null;
  family: ReadonlySet<string>;
}

/** An embryonic variant always requires its explicit checkbox. */
export function hideEducationalVessel(row: IllustrativeVessel, options: VisibilityOptions) {
  if (row.embryonic) return !options.embryonic;
  const selected = row.id === options.selected;
  return (!options.illustrations && !selected && !options.family.has(row.id)) ||
    (row.variant && !options.variants && !selected);
}

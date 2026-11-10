// src/common/constants/form.ts
// Shared form constants + static Tailwind span maps.
// The maps are written out long-hand so Tailwind's scanner sees every
// possible class — never build span classes with template literals.

export const FORM_CONTROL_TYPES = {
  INPUT: "input",
  TEXTAREA: "textarea",
  SELECT: "select",
  RICHTEXT: "richtext"
} as const;

/** Grid config on a form control (12-column grid, mobile-first) */
export type FormControlGrid = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
};

const SPAN = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12"
} as const;

const SM_SPAN = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
  9: "sm:col-span-9",
  10: "sm:col-span-10",
  11: "sm:col-span-11",
  12: "sm:col-span-12"
} as const;

const MD_SPAN = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12"
} as const;

const LG_SPAN = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12"
} as const;

/** Turn a control's grid config into static Tailwind classes */
export const gridSpanClasses = (grid: FormControlGrid = {}): string => {
  const { xs = 12, sm, md, lg } = grid;
  return [
    SPAN[xs as keyof typeof SPAN] ?? SPAN[12],
    sm ? SM_SPAN[sm as keyof typeof SM_SPAN] : "",
    md ? MD_SPAN[md as keyof typeof MD_SPAN] : "",
    lg ? LG_SPAN[lg as keyof typeof LG_SPAN] : ""
  ]
    .filter(Boolean)
    .join(" ");
};

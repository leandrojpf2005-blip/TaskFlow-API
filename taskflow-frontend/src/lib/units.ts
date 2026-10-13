// Unit conversion. The backend always stores kg and cm; the user's preference
// only changes what is shown and typed.

export type WeightUnit = "kg" | "lb";
export type LengthUnit = "cm" | "in";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export const kgTo = (kg: number, u: WeightUnit) => (u === "kg" ? kg : kg / KG_PER_LB);
export const toKg = (v: number, u: WeightUnit) => (u === "kg" ? v : v * KG_PER_LB);
export const cmTo = (cm: number, u: LengthUnit) => (u === "cm" ? cm : cm / CM_PER_IN);
export const toCm = (v: number, u: LengthUnit) => (u === "cm" ? v : v * CM_PER_IN);

/** Smallest sensible step for lifting weights in each unit. */
export const liftStep = (u: WeightUnit) => (u === "kg" ? 2.5 : 5);

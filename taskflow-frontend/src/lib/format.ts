// Round a macro gram value to a single decimal place. Trailing .0 is dropped
// (160, not 160.0) while fractional values keep one place (261.3).
export const round1 = (n: number) => Math.round(n * 10) / 10;

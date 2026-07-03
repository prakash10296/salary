// Fixed conversion rates to USD for comparative analytics.
// Deliberately static (documented in requirements): live FX adds an external
// dependency without improving the insight quality for this use case.
export const FX_TO_USD: Record<string, number> = {
    USD: 1,
    INR: 0.012,
    EUR: 1.09,
    GBP: 1.27,
    SGD: 0.74,
    BRL: 0.18,
};
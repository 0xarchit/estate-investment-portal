export function checkoutGuard(input: {
  min: number;
  max: number;
  units: number;
  unitPrice: number;
  balance: number;
  kyc: string;
  status: string;
  terms: boolean;
}) {
  const amount = input.units * input.unitPrice;
  const shortfall = Math.max(0, amount - input.balance);
  const reason =
    input.kyc !== "APPROVED"
      ? "Complete KYC before investing."
      : input.status !== "LIVE"
        ? "Funding is closed for this property."
        : input.max < input.min
          ? "No eligible units are available within your ownership limit."
          : !Number.isSafeInteger(input.units) ||
              input.units < input.min ||
              input.units > input.max
            ? `Choose ${input.min}–${input.max} whole units.`
            : !Number.isSafeInteger(amount)
              ? "Investment amount is invalid."
              : shortfall > 0
                ? "Add funds to cover your investment."
                : !input.terms
                  ? "Accept the risk disclosure to continue."
                  : "";
  return { amount, shortfall, reason, eligible: reason === "" };
}

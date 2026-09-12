export const PAYMENT_METHODS = {
  CASH: "Tunai",
  QRIS: "QRIS",
  CARD: "Kartu Debit/Kredit",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_METHOD_LIST = Object.entries(PAYMENT_METHODS).map(
  ([value, label]) => ({ value: value as PaymentMethod, label })
);

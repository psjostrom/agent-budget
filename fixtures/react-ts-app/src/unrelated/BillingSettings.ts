export type BillingSettings = {
  plan: "free" | "team";
  invoiceEmail: string;
};

export function updateBillingSettings(settings: BillingSettings): BillingSettings {
  return { ...settings, invoiceEmail: settings.invoiceEmail.trim().toLowerCase() };
}

import { z } from "zod";
import { cuid, email } from "./common";

export const donationIntentSchema = z.object({
  provider: z.enum(["STRIPE", "PAYPAL", "MOBILE_MONEY"]),
  amountCents: z.number().int().min(100, "Minimum donation is 1.00").max(100_000_000),
  currency: z.string().length(3),
  campaignSlug: z.string().optional(),
  donorEmail: email,
  donorName: z.string().trim().max(200).optional(),
  recurring: z.boolean().default(false),
});

export const donationRefundSchema = z.object({ id: cuid });

export type DonationIntentInput = z.infer<typeof donationIntentSchema>;

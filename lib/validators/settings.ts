import { z } from "zod";

export const siteSettingsUpdateSchema = z.object({
  siteName: z.string().trim().min(1).max(120),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  loginBgUrl: z.string().trim().max(500).optional().nullable(),
  contact: z
    .object({
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().trim().max(40).optional(),
      address: z.string().trim().max(300).optional(),
    })
    .default({}),
  socials: z
    .object({
      twitter: z.string().trim().max(200).optional(),
      facebook: z.string().trim().max(200).optional(),
      instagram: z.string().trim().max(200).optional(),
      linkedin: z.string().trim().max(200).optional(),
      youtube: z.string().trim().max(200).optional(),
    })
    .default({}),
  seo: z
    .object({
      defaultTitle: z.string().trim().max(120).optional(),
      defaultDescription: z.string().trim().max(300).optional(),
      ogImageUrl: z.string().trim().max(500).optional(),
    })
    .default({}),
});

import { db } from "@/lib/db";

export type SubscriberPreferences = {
  newsletters: boolean;
  campaigns: boolean;
  events: boolean;
};

const DEFAULT_PREFS: SubscriberPreferences = {
  newsletters: true,
  campaigns: true,
  events: true,
};

export async function getSubscriberByToken(token: string) {
  return db.subscriber.findUnique({
    where: { unsubToken: token },
    select: { id: true, email: true, name: true, status: true, preferences: true },
  });
}

export function parsePreferences(raw: unknown): SubscriberPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_PREFS;
  const obj = raw as Record<string, unknown>;
  return {
    newsletters: obj.newsletters !== false,
    campaigns: obj.campaigns !== false,
    events: obj.events !== false,
  };
}

export async function updateSubscriberPreferences(
  token: string,
  preferences: SubscriberPreferences,
) {
  const sub = await db.subscriber.findUnique({ where: { unsubToken: token } });
  if (!sub) throw new Error("Invalid token");
  if (sub.status === "UNSUBSCRIBED") throw new Error("Already unsubscribed");

  // If all preferences are off, unsubscribe entirely
  const allOff = !preferences.newsletters && !preferences.campaigns && !preferences.events;

  await db.subscriber.update({
    where: { id: sub.id },
    data: {
      preferences,
      ...(allOff ? { status: "UNSUBSCRIBED" } : {}),
    },
  });

  return { ok: true, unsubscribed: allOff };
}

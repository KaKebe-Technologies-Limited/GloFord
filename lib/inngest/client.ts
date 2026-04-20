import { Inngest, EventSchemas } from "inngest";
import type { GloforEvents } from "./events";

export const inngest = new Inngest({
  id: "gloford",
  schemas: new EventSchemas().fromRecord<GloforEvents>(),
});

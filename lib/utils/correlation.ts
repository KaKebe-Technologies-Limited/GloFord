import { randomBytes } from "node:crypto";

export function newCorrelationId(): string {
  return `cor_${randomBytes(8).toString("hex")}`;
}

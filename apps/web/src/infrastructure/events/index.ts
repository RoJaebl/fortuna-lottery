import { token } from "@lib/di";
import { DomainEvents } from "./DomainEvents";

export { DomainEvents };
export const DOMAIN_EVENTS = token<DomainEvents>("DOMAIN_EVENTS");

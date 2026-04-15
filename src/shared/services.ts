/**
 * Singleton service instances shared across the app.
 * Import from here to avoid creating duplicate instances.
 */
import { db } from "./firebase"
import { eventBus } from "./EventBus"
import { OutboxService } from "./OutboxService"

export const outboxService = new OutboxService(db, eventBus)

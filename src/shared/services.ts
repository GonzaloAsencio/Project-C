/**
 * Singleton service instances shared across the app.
 * Import from here to avoid creating duplicate instances.
 */
import { db } from "./firebase"
import { eventBus } from "./EventBus"
import { OutboxService } from "./OutboxService"
import { FirestoreProgressRepo } from "../gamification/infrastructure/FirestoreProgressRepo"
import { AttendanceService } from "../academic/application/AttendanceService"

export const outboxService = new OutboxService(db, eventBus)
export const progressRepo = new FirestoreProgressRepo()
export const attendanceService = new AttendanceService(progressRepo)

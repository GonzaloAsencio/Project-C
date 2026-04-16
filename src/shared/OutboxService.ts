import type {
  Firestore,
  CollectionReference,
  DocumentData,
} from "firebase/firestore"
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore"
import type { EventBus } from "./EventBus"

interface OutboxDocument {
  id: string
  type: string
  payload: unknown
  status: "pending" | "processed"
  createdAt: number
}

interface DomainEvent {
  type: string
  [key: string]: unknown
}

export class OutboxService {
  private readonly db: Firestore
  private readonly bus: EventBus
  private outboxRef: CollectionReference<DocumentData>

  constructor(db: Firestore, bus: EventBus) {
    this.db = db
    this.bus = bus
    this.outboxRef = collection(this.db, "outbox")
  }

  async enqueue(event: DomainEvent): Promise<void> {
    const id = crypto.randomUUID()
    const { type, ...payload } = event
    const docData: OutboxDocument = {
      id,
      type,
      payload,
      status: "pending",
      createdAt: Date.now(),
    }
    console.log('[OutboxService] Enqueuing event:', type, payload)
    await setDoc(doc(this.outboxRef, id), docData)
    await this.processAll()
  }

  async processAll(): Promise<void> {
    const q = query(this.outboxRef, where("status", "==", "pending"))
    const snapshot = await getDocs(q)
    console.log('[OutboxService] Processing', snapshot.docs.length, 'pending events')
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as OutboxDocument
      console.log('[OutboxService] Emitting event:', data.type, data.payload)
      this.bus.emit(data.type, data.payload)
      await updateDoc(doc(this.outboxRef, data.id), { status: "processed" })
    }
  }

  async recoverPending(): Promise<void> {
    await this.processAll()
  }
}

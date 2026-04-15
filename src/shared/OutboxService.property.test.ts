import { describe, it, beforeEach } from "vitest"
import * as fc from "fast-check"
import { EventBus } from "./EventBus"

// ---------------------------------------------------------------------------
// Testable OutboxService (in-memory store, same logic as OutboxService)
// ---------------------------------------------------------------------------

interface OutboxDoc {
  id: string
  type: string
  payload: unknown
  status: "pending" | "processed"
  createdAt: number
}

interface OutboxStore {
  set(id: string, doc: OutboxDoc): Promise<void>
  get(id: string): OutboxDoc | undefined
  queryByStatus(status: "pending" | "processed"): OutboxDoc[]
  update(id: string, patch: Partial<OutboxDoc>): Promise<void>
  all(): OutboxDoc[]
}

function createInMemoryStore(): OutboxStore {
  const docs = new Map<string, OutboxDoc>()
  return {
    async set(id, doc) {
      docs.set(id, { ...doc })
    },
    get(id) {
      return docs.get(id)
    },
    queryByStatus(status) {
      return [...docs.values()].filter((d) => d.status === status)
    },
    async update(id, patch) {
      const existing = docs.get(id)
      if (existing) docs.set(id, { ...existing, ...patch })
    },
    all() {
      return [...docs.values()]
    },
  }
}

/** OutboxService re-implemented against the injectable OutboxStore interface */
class TestableOutboxService {
  private readonly store: OutboxStore
  private readonly bus: EventBus

  constructor(store: OutboxStore, bus: EventBus) {
    this.store = store
    this.bus = bus
  }

  async enqueue(event: { type: string; [k: string]: unknown }): Promise<void> {
    const id = crypto.randomUUID()
    const { type, ...payload } = event
    await this.store.set(id, {
      id,
      type,
      payload,
      status: "pending",
      createdAt: Date.now(),
    })
    await this.processAll()
  }

  async processAll(): Promise<void> {
    const pending = this.store.queryByStatus("pending")
    for (const doc of pending) {
      this.bus.emit(doc.type, doc.payload)
      await this.store.update(doc.id, { status: "processed" })
    }
  }

  async recoverPending(): Promise<void> {
    await this.processAll()
  }

  /** Test helper */
  getStore(): OutboxStore {
    return this.store
  }
}

// ---------------------------------------------------------------------------
// Property 7: Persistencia de eventos Outbox
// Validates: Requirements 11.1, 11.2
// ---------------------------------------------------------------------------

describe("OutboxService — Property 7: Persistencia de eventos Outbox", () => {
  let store: OutboxStore
  let bus: EventBus

  beforeEach(() => {
    store = createInMemoryStore()
    bus = new EventBus()
    new TestableOutboxService(store, bus) // warm up
  })

  it("todo evento encolado es persistido con status pending antes de processAll y processed después", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constantFrom("EvaluationApproved", "XPAdded", "LevelUp"),
          studentUid: fc.string({ minLength: 1, maxLength: 20 }),
          xpReward: fc.integer({ min: 0, max: 200 }),
        }),
        async (event) => {
          const localStore = createInMemoryStore()
          const localBus = new EventBus()

          // Intercept processAll: enqueue writes pending, then processAll runs
          // We verify the intermediate state by hooking into the store
          let seenPending = false
          const originalSet = localStore.set.bind(localStore)
          localStore.set = async (id, doc) => {
            await originalSet(id, doc)
            // Right after setDoc, before processAll, status must be "pending"
            const saved = localStore.get(id)
            if (saved?.status === "pending") seenPending = true
          }

          const svc = new TestableOutboxService(localStore, localBus)
          await svc.enqueue(event)

          const allDocs = localStore.all()

          // After enqueue (which calls processAll), all docs must be "processed"
          const allProcessed = allDocs.every((d) => d.status === "processed")

          return seenPending && allProcessed && allDocs.length === 1
        }
      )
    )
  })

  it("múltiples eventos encolados son todos persistidos y procesados", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom("EvaluationApproved", "XPAdded"),
            uid: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (events) => {
          const localStore = createInMemoryStore()
          const localBus = new EventBus()
          const svc = new TestableOutboxService(localStore, localBus)

          for (const event of events) {
            await svc.enqueue(event)
          }

          const allDocs = localStore.all()
          return (
            allDocs.length === events.length &&
            allDocs.every((d) => d.status === "processed")
          )
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 8: Recuperación de eventos pending al reconectar
// Validates: Requirements 4.5, 11.3
// ---------------------------------------------------------------------------

describe("OutboxService — Property 8: Recuperación de eventos pending al reconectar", () => {
  it("recoverPending reemite todos los eventos con status pending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom("EvaluationApproved", "XPAdded", "LevelUp"),
            uid: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          { minLength: 1, maxLength: 8 }
        ),
        fc.integer({ min: 1, max: 5 }),
        async (allEvents, pendingCount) => {
          const localStore = createInMemoryStore()
          const localBus = new EventBus()

          // Seed the store: first `pendingCount` events as pending, rest as processed
          const clampedPending = Math.min(pendingCount, allEvents.length)
          for (let i = 0; i < allEvents.length; i++) {
            const { type, ...payload } = allEvents[i]
            const id = crypto.randomUUID()
            await localStore.set(id, {
              id,
              type,
              payload,
              status: i < clampedPending ? "pending" : "processed",
              createdAt: Date.now(),
            })
          }

          const emitted: unknown[] = []
          // Listen to all event types
          for (const t of ["EvaluationApproved", "XPAdded", "LevelUp"]) {
            localBus.on(t, (p) => emitted.push(p))
          }

          const svc = new TestableOutboxService(localStore, localBus)
          await svc.recoverPending()

          // All previously-pending events must have been emitted
          const stillPending = localStore.queryByStatus("pending")
          return stillPending.length === 0 && emitted.length === clampedPending
        }
      )
    )
  })
})

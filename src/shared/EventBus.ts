type Handler<T = unknown> = (payload: T) => void

class EventBus {
  private listeners: Map<string, Handler[]> = new Map()

  on<T>(event: string, handler: Handler<T>): void {
    const handlers = this.listeners.get(event) ?? []
    handlers.push(handler as Handler)
    this.listeners.set(event, handlers)
  }

  off<T>(event: string, handler: Handler<T>): void {
    const handlers = this.listeners.get(event) ?? []
    this.listeners.set(
      event,
      handlers.filter((h) => h !== (handler as Handler))
    )
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners.get(event) ?? []
    for (const handler of handlers) {
      handler(payload)
    }
  }
}

export const eventBus = new EventBus()
export { EventBus }

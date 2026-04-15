import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { eventBus } from './shared/EventBus'
import { outboxService } from './shared/services'
import { FirestoreProgressRepo } from './gamification/infrastructure/FirestoreProgressRepo'
import { AddXP } from './gamification/application/AddXP'

// --- Wiring: instantiate adapters and use cases ---
const progressRepo = new FirestoreProgressRepo()

// Register AddXP handler on the EventBus (subscribes to "EvaluationApproved")
new AddXP(progressRepo, eventBus)

// Recover any pending outbox events on reconnect (Requirement 4.5, 11.3)
window.addEventListener('online', () => {
  outboxService.recoverPending()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

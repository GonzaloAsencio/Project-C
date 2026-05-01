# Project C

Interactive academic platform with RPG-inspired progression, split into student and teacher experiences.

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

---

## Description

Project C is a gamified classroom management app where:

- Students track evaluations, attendance, XP, and level progression.
- Teachers manage grades, attendance sessions, and evaluation columns in real time.
- Domain rules (status transitions, idempotent XP claims, role access) are enforced through app logic and Firestore constraints.

The project focuses on making academic progress visible and motivating while keeping teacher operations scalable for larger classes.

---

## Core Features

- Role-based application flow (student / teacher) with protected routes.
- Real-time gradebook backed by Firestore.
- Attendance sessions with self-registration windows.
- RPG-like progression system (XP + levels + cinematic victory/defeat/level-up moments).
- Idempotent XP awarding to prevent duplicate rewards.
- Teacher evaluation management (create, edit, delete, reset).
- Property-based testing for key business invariants.

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router 7, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4, CSS Modules, clsx |
| Backend Services | Firebase Auth, Firestore |
| UI Utilities | Lucide, Framer Motion, Recharts, canvas-confetti |
| Quality | ESLint, Vitest, fast-check |

---

## Project Structure

The codebase is organized by bounded contexts:

- `src/identity/`: authentication, onboarding, student-facing identity flows.
- `src/academic/`: teacher panel, evaluations, attendance domain/application.
- `src/gamification/`: XP, level progression, cinematic modals and effects.
- `src/shared/`: auth context, route guards, Firebase setup, reusable services.

---

## Installation

### 1. Clone repository

```bash
git clone https://github.com/GonzaloAsencio/Project-C.git
cd Project-C
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

These values are required by `src/shared/firebase.ts`.

---

## Usage

### Development server

```bash
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

### Build for production

```bash
npm run build
```

### Run test suite

```bash
npm run test
```

### Lint code

```bash
npm run lint
```

---

## What to Expect When Running

- `/login`: authentication entry point.
- `/student`: student dashboard (evaluations, attendance, progression).
- `/teacher`: teacher dashboard (gradebook + attendance operations).

Route access is role-guarded via application auth context and route guards.

---

## Contributing

Contributions are welcome. A recommended workflow:

1. Fork the repository.
2. Create a feature branch.
3. Implement your change with tests.
4. Run lint + tests locally.
5. Open a pull request with clear context and screenshots for UI changes.

Example:

```bash
git checkout -b feat/improve-teacher-attendance-ux
npm run lint
npm run test
git commit -m "feat: improve teacher attendance UX"
```

---

## License

MIT is recommended for this project.

If you want to publish under MIT, add a `LICENSE` file at the repository root.

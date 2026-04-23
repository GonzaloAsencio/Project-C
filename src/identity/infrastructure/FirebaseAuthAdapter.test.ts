import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
  deleteUserMock: vi.fn(),
  getAuthMock: vi.fn(),
  getAppsMock: vi.fn(),
  initializeAppMock: vi.fn(),
  writeBatchMock: vi.fn(),
  docMock: vi.fn(),
  batch: {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(),
  },
}))

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPasswordMock,
  signOut: mocks.signOutMock,
  onAuthStateChanged: vi.fn(),
  deleteUser: mocks.deleteUserMock,
  getAuth: mocks.getAuthMock,
}))

vi.mock("firebase/app", () => ({
  getApps: mocks.getAppsMock,
  initializeApp: mocks.initializeAppMock,
}))

vi.mock("firebase/firestore", () => ({
  doc: mocks.docMock,
  getDoc: vi.fn(),
  writeBatch: mocks.writeBatchMock,
}))

vi.mock("../../shared/firebase", () => ({
  app: { options: { projectId: "test" } },
  auth: { name: "primary-auth" },
  db: { name: "db" },
}))

import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"

describe("FirebaseAuthAdapter.createStudentByTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.batch.set.mockReset()
    mocks.batch.update.mockReset()
    mocks.batch.commit.mockReset()

    mocks.getAppsMock.mockReturnValue([])
    mocks.initializeAppMock.mockReturnValue({ name: "project-c-teacher-creator" })
    mocks.getAuthMock.mockReturnValue({ name: "secondary-auth" })
    mocks.writeBatchMock.mockReturnValue(mocks.batch)

    mocks.docMock.mockImplementation((_db: unknown, collectionName: string, id: string) => ({
      path: `${collectionName}/${id}`,
    }))
  })

  it("creates student profile + seeded evaluations and signs out secondary auth", async () => {
    mocks.createUserWithEmailAndPasswordMock.mockResolvedValue({ user: { uid: "student-1" } })
    mocks.batch.commit.mockResolvedValue(undefined)
    mocks.signOutMock.mockResolvedValue(undefined)

    const adapter = new FirebaseAuthAdapter()
    const result = await adapter.createStudentByTeacher({
      displayName: "Alumno",
      email: "alumno@escuela.com",
      password: "123456",
    })

    expect(result.uid).toBe("student-1")
    expect(mocks.batch.set).toHaveBeenCalledTimes(5)

    const userWrite = mocks.batch.set.mock.calls.find((call) => call[0]?.path === "users/student-1")
    expect(userWrite?.[1]).toMatchObject({
      displayName: "Alumno",
      email: "alumno@escuela.com",
      role: "student",
      avatarClass: null,
    })

    const evaluationWrites = mocks.batch.set.mock.calls.filter((call) => String(call[0]?.path).startsWith("evaluations/"))
    expect(evaluationWrites.map((call) => call[0].path).sort()).toEqual([
      "evaluations/student-1_parcial1",
      "evaluations/student-1_parcial2",
      "evaluations/student-1_tp1",
      "evaluations/student-1_tp2",
    ])

    expect(mocks.deleteUserMock).not.toHaveBeenCalled()
    expect(mocks.signOutMock).toHaveBeenCalledTimes(1)
    expect(mocks.signOutMock).toHaveBeenCalledWith({ name: "secondary-auth" })
  })

  it("deletes created auth user if batch commit fails", async () => {
    const commitError = new Error("commit failed")
    const createdUser = { uid: "student-2" }
    mocks.createUserWithEmailAndPasswordMock.mockResolvedValue({ user: createdUser })
    mocks.batch.commit.mockRejectedValue(commitError)
    mocks.deleteUserMock.mockResolvedValue(undefined)
    mocks.signOutMock.mockResolvedValue(undefined)

    const adapter = new FirebaseAuthAdapter()

    await expect(
      adapter.createStudentByTeacher({
        displayName: "Alumno",
        email: "alumno2@escuela.com",
        password: "123456",
      })
    ).rejects.toThrow("commit failed")

    expect(mocks.deleteUserMock).toHaveBeenCalledTimes(1)
    expect(mocks.deleteUserMock).toHaveBeenCalledWith(createdUser)
    expect(mocks.signOutMock).toHaveBeenCalledTimes(1)
  })

  it("preserves original commit error even if cleanup deleteUser fails", async () => {
    const commitError = new Error("commit failed")
    const createdUser = { uid: "student-3" }
    mocks.createUserWithEmailAndPasswordMock.mockResolvedValue({ user: createdUser })
    mocks.batch.commit.mockRejectedValue(commitError)
    mocks.deleteUserMock.mockRejectedValue(new Error("cleanup failed"))
    mocks.signOutMock.mockResolvedValue(undefined)

    const adapter = new FirebaseAuthAdapter()

    await expect(
      adapter.createStudentByTeacher({
        displayName: "Alumno",
        email: "alumno3@escuela.com",
        password: "123456",
      })
    ).rejects.toThrow("commit failed")

    expect(mocks.deleteUserMock).toHaveBeenCalledTimes(1)
    expect(mocks.signOutMock).toHaveBeenCalledTimes(1)
  })
})

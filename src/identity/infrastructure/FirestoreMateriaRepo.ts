import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { Materia } from "../domain/Materia"

export class FirestoreMateriaRepo {
  async createMateria(input: {
    name: string
    year: number
    teacherUid: string
  }): Promise<Materia> {
    const createdAt = new Date()
    const ref = await addDoc(collection(db, "materias"), {
      name: input.name,
      year: input.year,
      teacherUid: input.teacherUid,
      createdAt: Timestamp.fromDate(createdAt),
    })
    return { id: ref.id, ...input, createdAt }
  }

  async getMateriaById(id: string): Promise<Materia | null> {
    const snap = await getDoc(doc(db, "materias", id))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      id: snap.id,
      name: data.name as string,
      year: data.year as number,
      teacherUid: data.teacherUid as string,
      createdAt: (data.createdAt as Timestamp).toDate(),
    }
  }

  async assignTeacher(materiaId: string, teacherUid: string): Promise<void> {
    await updateDoc(doc(db, "users", teacherUid), { materiaId })
  }
}

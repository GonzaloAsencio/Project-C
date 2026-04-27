import { FirestoreMateriaRepo } from "../infrastructure/FirestoreMateriaRepo"
import type { Materia } from "../domain/Materia"

const materiaRepo = new FirestoreMateriaRepo()

export async function createMateria(input: {
  name: string
  year: number
  teacherUid: string
}): Promise<Materia> {
  const materia = await materiaRepo.createMateria(input)
  await materiaRepo.assignTeacher(materia.id, input.teacherUid)
  return materia
}

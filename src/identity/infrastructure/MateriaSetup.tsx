import { useState } from "react"
import { createMateria } from "../application/CreateMateria"
import styles from "./MateriaSetup.module.css"

interface MateriaSetupProps {
  teacherUid: string
  onCreated: () => void
}

export default function MateriaSetup({ teacherUid, onCreated }: MateriaSetupProps) {
  const currentYear = new Date().getFullYear()
  const [name, setName] = useState("")
  const [year, setYear] = useState(currentYear)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createMateria({ name: name.trim(), year, teacherUid })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la materia")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.heading}>Configurar materia</h1>
        <p className={styles.sub}>
          Antes de comenzar, configurá tu materia. Cada año podés crear una nueva instancia
          para separar alumnos y evaluaciones.
        </p>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="materia-name">Nombre de la materia</label>
            <input
              id="materia-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Paradigmas de Programación"
              disabled={saving}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="materia-year">Año</label>
            <input
              id="materia-year"
              className={styles.input}
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2100}
              disabled={saving}
              required
            />
          </div>
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}

        <button className={styles.btn} type="submit" disabled={saving || !name.trim()}>
          {saving ? "Creando materia…" : "Crear materia"}
        </button>
      </form>
    </div>
  )
}

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "./firebase"

export interface EvalColumn {
  key: string
  label: string
  type: "TP" | "Parcial"
  index: number
}

export const DEFAULT_COLUMNS: EvalColumn[] = [
  { key: "tp1",      label: "TP 1",      type: "TP",      index: 1 },
  { key: "tp2",      label: "TP 2",      type: "TP",      index: 2 },
  { key: "parcial1", label: "Parcial 1", type: "Parcial", index: 1 },
  { key: "parcial2", label: "Parcial 2", type: "Parcial", index: 2 },
]

const CONFIG_DOC = doc(db, "config", "evalColumns")

export function useEvalColumns(): { columns: EvalColumn[]; loading: boolean } {
  const [columns, setColumns] = useState<EvalColumn[]>(DEFAULT_COLUMNS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      CONFIG_DOC,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { columns: EvalColumn[] }
          setColumns(data.columns ?? DEFAULT_COLUMNS)
        } else {
          setColumns(DEFAULT_COLUMNS)
        }
        setLoading(false)
      },
      () => {
        setColumns(DEFAULT_COLUMNS)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { columns, loading }
}

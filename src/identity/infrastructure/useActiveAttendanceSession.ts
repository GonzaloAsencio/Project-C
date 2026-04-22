import { useEffect, useState } from "react"
import { attendanceService } from "../../shared/services"
import type { ClassSession } from "../../academic/application/AttendanceService"

export function useActiveAttendanceSession() {
  const [session, setSession] = useState<ClassSession | null>(null)

  useEffect(() => {
    return attendanceService.subscribeToTodayActiveSession(setSession)
  }, [])

  const now = new Date()
  const isWithinWindow =
    session?.selfRegistration === true &&
    session.windowStart != null &&
    session.windowEnd != null &&
    now >= session.windowStart &&
    now <= session.windowEnd

  return { session, isWithinWindow }
}

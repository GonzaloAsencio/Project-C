import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./shared/AuthContext"
import { RouteGuard } from "./shared/RouteGuard"
import AuthUI from "./identity/infrastructure/AuthUI"

const StudentPanel = lazy(() => import("./identity/infrastructure/StudentPanel"))
const TeacherPanel = lazy(() => import("./academic/infrastructure/TeacherPanel"))

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthUI />} />
            <Route
              path="/student"
              element={
                <RouteGuard requiredRole="student">
                  <StudentPanel />
                </RouteGuard>
              }
            />
            <Route
              path="/teacher"
              element={
                <RouteGuard requiredRole="teacher">
                  <TeacherPanel />
                </RouteGuard>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./shared/AuthContext"
import { RouteGuard } from "./shared/RouteGuard"
import { LoadingScreen } from "./shared/LoadingScreen"
import { ErrorBoundary } from "./shared/ErrorBoundary"
import AuthUI from "./identity/infrastructure/AuthUI"

const StudentPanel = lazy(() => import("./identity/infrastructure/StudentPanel"))
const TeacherPanel = lazy(() => import("./academic/infrastructure/TeacherPanel"))

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthUI />} />
            <Route
              path="/student"
              element={
                <RouteGuard requiredRole="student">
                  <ErrorBoundary>
                    <StudentPanel />
                  </ErrorBoundary>
                </RouteGuard>
              }
            />
            <Route
              path="/teacher"
              element={
                <RouteGuard requiredRole="teacher">
                  <ErrorBoundary>
                    <TeacherPanel />
                  </ErrorBoundary>
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

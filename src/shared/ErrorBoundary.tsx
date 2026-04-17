import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100svh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            background: "#f8fafc",
          }}
        >
          <span style={{ fontSize: "3rem" }}>💥</span>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem", fontWeight: 800 }}>
            Algo salió mal
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", maxWidth: "360px" }}>
            {this.state.error?.message ?? "Error inesperado. Recargá la página."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 1.75rem",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

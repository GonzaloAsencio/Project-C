export function LoadingScreen({ message = "Cargando…" }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        fontSize: "1rem",
        color: "#6b7280",
        background: "#f8fafc",
      }}
    >
      {message}
    </div>
  )
}

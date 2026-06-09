import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{
      borderBottom: "1px solid var(--border)",
      background: "rgba(12,17,25,0.85)",
      backdropFilter: "blur(6px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em",
          textDecoration: "none", color: "var(--text)" }}>
          <span style={{ color: "var(--accent)" }}>Prep</span>wise
        </Link>
        <Link href="/interview/new" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }}>
          New Interview
        </Link>
      </div>
    </nav>
  );
}

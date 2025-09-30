export default function Footer() {
  return (
    <footer style={{ padding: "1rem", borderTop: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
        © {new Date().getFullYear()} RetroTrade. All rights reserved.
      </div>
    </footer>
  );
}
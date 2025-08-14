import { useEffect, useState } from "react";

export function App() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    // Try calling the Worker API when running via vite dev (proxy) or wrangler
    fetch("/api/hello")
      .then((r) => r.json() as Promise<{ message: string }>)
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Welcome to Story Forge"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Story Forge</h1>
      <p>{message}</p>
    </main>
  );
}


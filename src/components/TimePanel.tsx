import { useEffect, useId, useState } from "react";
import { apiFetch } from "../lib/api";

type TimeResponse = { time: string };

export function TimePanel() {
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const statusId = useId();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiFetch<TimeResponse>("/api/time")
      .then((data) => {
        if (!active) return;
        setTime(data.time);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = typeof err === "object" && err && "message" in (err as any)
          ? String((err as any).message)
          : "Failed to load time";
        setError(msg);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="time-heading" className="panel">
      <h2 id="time-heading">Server Time</h2>
      <p id={statusId} aria-live="polite" className="muted">
        {loading ? "Loading current time…" : error ? "Error loading time" : "Loaded"}
      </p>
      {error ? (
        <p className="error" role="alert">{error}</p>
      ) : (
        <p>{time ? new Date(time).toLocaleString() : null}</p>
      )}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => {
            // re-trigger fetch
            setLoading(true);
            setError(null);
            apiFetch<TimeResponse>("/api/time")
              .then((data) => setTime(data.time))
              .catch(() => setError("Failed to load time"))
              .finally(() => setLoading(false));
          }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </section>
  );
}


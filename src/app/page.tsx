'use client';

import { useEffect, useState } from 'react';
import type { AgendaItem } from '@/types/agenda';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/agenda`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load agenda');
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading agenda items…</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <main className="container">
      <h1>Agenda Items</h1>
      <table>
        <thead>
          <tr>
            <th>Agenda Name</th>
            <th>Script Name</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.agendaName}</td>
              <td>{item.scriptName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

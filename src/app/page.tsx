'use client';

import Link from 'next/link';
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
        if (!res.ok) throw new Error('案件の読み込みに失敗しました');
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">読み込み中…</div>;
  if (error) return <div className="error">エラー: {error}</div>;

  return (
    <main className="container">
      <div className="page-header">
        <h1>案件一覧</h1>
        <Link href="/register" className="btn btn-primary">新規登録</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>案件名</th>
            <th>スクリプト名</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.agendaName}</td>
              <td>{item.scriptName}</td>
              <td>
                <Link href={`#`} className="btn btn-primary btn-sm">詳細</Link>
                {' '}
                <Link href={`/agenda/${item.id}/analysis`} className="btn btn-secondary btn-sm">分析</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

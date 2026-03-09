'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgendaItem {
  id: string;
  agendaName: string;
  scriptName: string;
}

export default function DetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [agenda, setAgenda] = useState<AgendaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/agenda/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('案件の取得に失敗しました');
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error('案件が見つかりません');
        setAgenda(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">読み込み中…</div>;
  if (error) return <div className="error">エラー: {error}</div>;
  if (!agenda) return null;

  return (
    <main className="container">
      <div className="page-header">
        <h1>案件詳細</h1>
        <Link href="/" className="btn btn-secondary">一覧に戻る</Link>
      </div>
      <div className="analysis-info">
        <p><strong>案件名:</strong> {agenda.agendaName}</p>
        <p><strong>スクリプト名:</strong> {agenda.scriptName}</p>
      </div>
      <div className="form-actions">
        <Link href={`/agenda/${id}/analysis`} className="btn btn-primary">分析</Link>
      </div>
    </main>
  );
}

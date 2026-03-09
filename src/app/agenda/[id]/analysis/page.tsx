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

interface UserMatchingRate {
  userName: string;
  matchingRate: number;
}

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [agenda, setAgenda] = useState<AgendaItem | null>(null);
  const [matchingRates, setMatchingRates] = useState<UserMatchingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_BASE}/agenda/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('案件の取得に失敗しました')))),
      fetch(`${API_BASE}/agenda/${id}/matching-rates`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('合致率の取得に失敗しました')))),
    ])
      .then(([agendaData, ratesData]) => {
        if (agendaData.error) throw new Error('案件が見つかりません');
        setAgenda(agendaData);
        setMatchingRates(ratesData);
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
        <h1>案件分析</h1>
        <Link href="/" className="btn btn-secondary">一覧に戻る</Link>
      </div>
      <div className="analysis-info">
        <p><strong>案件名:</strong> {agenda.agendaName}</p>
        <p><strong>スクリプト名:</strong> {agenda.scriptName}</p>
      </div>
      <h2 className="section-title">ユーザー別合致率</h2>
      <table>
        <thead>
          <tr>
            <th>ユーザー名</th>
            <th>合致率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {matchingRates.map((item) => (
            <tr key={item.userName}>
              <td>{item.userName}</td>
              <td>{(item.matchingRate * 100).toFixed(1)}%</td>
              <td>
                <Link href={`/agenda/${id}/user?userName=${encodeURIComponent(item.userName)}`} className="btn btn-primary btn-sm">詳細</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AgendaItem } from '@/types/agenda';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<AgendaItem | null>(null);

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

  const openDetail = (item: AgendaItem) => {
    fetch(`${API_BASE}/agenda/${item.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('取得に失敗しました'))))
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDetailModal(data);
      })
      .catch(() => setDetailModal(item));
  };

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
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openDetail(item)}>詳細</button>
                {' '}
                <Link href={`/agenda/${item.id}/analysis`} className="btn btn-secondary btn-sm">分析</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detailModal && (
        <div className="dialog-overlay" onClick={() => setDetailModal(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>案件詳細</h3>
            <div className="detail-content">
              <p><strong>案件名:</strong> {detailModal.agendaName}</p>
              <p><strong>スクリプト名:</strong> {detailModal.scriptName}</p>
              <p><strong>メイントーク:</strong></p>
              <div className="detail-text">{detailModal.mainTalk || '—'}</div>
              <p><strong>サブトーク:</strong></p>
              <div className="detail-text">{detailModal.subTalk || '—'}</div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(null)}>閉じる</button>
              <Link href={`/agenda/${detailModal.id}/analysis`} className="btn btn-primary" onClick={() => setDetailModal(null)}>分析</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

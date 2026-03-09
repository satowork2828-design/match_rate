'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AgendaRegistrationPayload } from '@/types/agenda';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const [agendaNames, setAgendaNames] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AgendaRegistrationPayload>({
    agendaName: '',
    scriptName: '',
    mainTalk: '',
    subTalk: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/agenda/names`)
      .then((res) => {
        if (!res.ok) throw new Error('案件名リストの取得に失敗しました');
        return res.json();
      })
      .then((data: string[]) => setAgendaNames(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingNames(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agendaName.trim()) {
      setError('案件名を選択してください');
      return;
    }
    setSubmitting(true);
    setError(null);
    fetch(`${API_BASE}/agenda/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((res) => {
        if (!res.ok) throw new Error('登録に失敗しました');
        router.push('/');
      })
      .catch((err) => {
        setError(err.message);
        setSubmitting(false);
      });
  };

  if (loadingNames) return <div className="loading">読み込み中…</div>;

  return (
    <main className="container">
      <h1>案件登録</h1>
      {error && <div className="error" style={{ marginBottom: '1rem' }}>エラー: {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="agendaName">案件名</label>
          <select
            id="agendaName"
            value={form.agendaName}
            onChange={(e) => setForm((f) => ({ ...f, agendaName: e.target.value }))}
            required
          >
            <option value="">選択してください</option>
            {agendaNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="scriptName">スクリプト名</label>
          <input
            id="scriptName"
            type="text"
            value={form.scriptName}
            onChange={(e) => setForm((f) => ({ ...f, scriptName: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="mainTalk">メイントーク</label>
          <textarea
            id="mainTalk"
            value={form.mainTalk}
            onChange={(e) => setForm((f) => ({ ...f, mainTalk: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="subTalk">サブトーク</label>
          <textarea
            id="subTalk"
            value={form.subTalk}
            onChange={(e) => setForm((f) => ({ ...f, subTalk: e.target.value }))}
          />
        </div>
        <div className="form-actions">
          <Link href="/" className="btn btn-secondary">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '登録中…' : '登録'}
          </button>
        </div>
      </form>
    </main>
  );
}

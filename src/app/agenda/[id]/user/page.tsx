'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgendaItem {
  id: string;
  agendaName: string;
  scriptName: string;
}

interface ConversationResult {
  conversation_id: string;
  completionRate: number;
  status: string;
  responseTime: string;
}

export default function UserAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agendaId = params.id as string;
  const userName = searchParams.get('userName') ?? '';

  const [agenda, setAgenda] = useState<AgendaItem | null>(null);
  const [avgRate, setAvgRate] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const now = new Date();
  const [searchYear, setSearchYear] = useState('');
  const [searchMonth, setSearchMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  const [searchDay, setSearchDay] = useState(now.getDate().toString().padStart(2, '0'));
  const [searchHour, setSearchHour] = useState('00');
  const [searchMinute, setSearchMinute] = useState('00');

  const fetchConversations = useCallback(
    (filters?: { status?: string; responseTime?: string; keywords?: string }) => {
      const sp = new URLSearchParams();
      sp.set('userName', userName);
      if (filters?.status?.trim()) sp.set('status', filters.status.trim());
      if (filters?.responseTime?.trim()) sp.set('responseTime', filters.responseTime.trim());
      if (filters?.keywords?.trim()) sp.set('keywords', filters.keywords.trim());
      return fetch(`${API_BASE}/agenda/${agendaId}/conversations?${sp}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('会話データの取得に失敗しました'))))
        .then((data: ConversationResult[]) => {
          setConversations(data);
          setError(null);
        });
    },
    [agendaId, userName],
  );

  useEffect(() => {
    if (!agendaId || !userName) {
      setLoading(false);
      setError('ユーザー名が指定されていません');
      return;
    }
    Promise.all([
      fetch(`${API_BASE}/agenda/${agendaId}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('案件の取得に失敗しました')))),
      fetch(`${API_BASE}/agenda/${agendaId}/matching-rates`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('合致率の取得に失敗しました')))),
    ])
      .then(([agendaData, ratesData]) => {
        if (agendaData.error) throw new Error('案件が見つかりません');
        setAgenda(agendaData);
        const userRate = ratesData.find((r: { userName: string }) => r.userName === userName);
        setAvgRate(userRate?.matchingRate ?? 0);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      })
      .then(() => fetchConversations())
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [agendaId, userName, fetchConversations]);

  const buildResponseTimeFromPickers = () => {
    if (!searchYear) return '';
    const y = searchYear;
    const m = searchMonth.padStart(2, '0') || '01';
    const d = searchDay.padStart(2, '0') || '01';
    const h = searchHour.padStart(2, '0') || '00';
    const min = searchMinute.padStart(2, '0') || '00';
    return `${y}-${m}-${d}T${h}:${min}:00`;
  };

  const handleSearch = () => {
    setDialogOpen(false);
    setLoading(true);
    const responseTime = buildResponseTimeFromPickers();
    fetchConversations({
      status: searchStatus,
      responseTime,
      keywords: searchKeywords,
    })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && conversations.length === 0) return <div className="loading">読み込み中…</div>;
  if (error && !agenda) return <div className="error">エラー: {error}</div>;
  if (!agenda || !userName) return null;

  return (
    <main className="container">
      <div className="page-header">
        <h1>ユーザー案件分析</h1>
        <Link href={`/agenda/${agendaId}/analysis`} className="btn btn-secondary">分析に戻る</Link>
      </div>
      <div className="analysis-info">
        <p><strong>案件名:</strong> {agenda.agendaName}</p>
        <p><strong>スクリプト名:</strong> {agenda.scriptName}</p>
        <p><strong>ユーザー名:</strong> {userName}</p>
        <p><strong>平均合致率:</strong> {avgRate != null ? `${(avgRate * 100).toFixed(1)}%` : '-'}</p>
      </div>
      <div className="section-header">
        <h2 className="section-title">会話データ</h2>
        <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)}>検索</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>合致率</th>
            <th>ステータス</th>
            <th>応答日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((c) => (
            <tr key={c.conversation_id}>
              <td>{(c.completionRate * 100).toFixed(1)}%</td>
              <td>{c.status}</td>
              <td>{formatDateTime(c.responseTime)}</td>
              <td>
                <Link href={`/agenda/${agendaId}/user/conversation/${encodeURIComponent(c.conversation_id)}?userName=${encodeURIComponent(userName)}`} className="btn btn-primary btn-sm">詳細</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {dialogOpen && (
        <div className="dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>検索条件</h3>
            <div className="form-group">
              <label htmlFor="searchStatus">ステータス</label>
              <select id="searchStatus" value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
                <option value="">指定なし</option>
                <option value="エスカレ">エスカレ</option>
                <option value="架電禁止">架電禁止</option>
                <option value="報告">報告</option>
                <option value="対応完了">対応完了</option>
              </select>
            </div>
            <div className="form-group">
              <label>応答日時（これより前）</label>
              <div className="datetime-picker-ja">
                <select
                  aria-label="年"
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                >
                  <option value="">指定なし</option>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  aria-label="月"
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>{parseInt(m, 10)}月</option>
                  ))}
                </select>
                <select
                  aria-label="日"
                  value={searchDay}
                  onChange={(e) => setSearchDay(e.target.value)}
                >
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) => (
                    <option key={d} value={d}>{parseInt(d, 10)}日</option>
                  ))}
                </select>
                <span className="datetime-sep"> </span>
                <select
                  aria-label="時"
                  value={searchHour}
                  onChange={(e) => setSearchHour(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>{parseInt(h, 10)}時</option>
                  ))}
                </select>
                <select
                  aria-label="分"
                  value={searchMinute}
                  onChange={(e) => setSearchMinute(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>{parseInt(m, 10)}分</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="searchKeywords">キーワード（カンマ区切り）</label>
              <input
                id="searchKeywords"
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="例: レビュー, 目標"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDialogOpen(false)}>閉じる</button>
              <button type="button" className="btn btn-primary" onClick={handleSearch}>検索</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

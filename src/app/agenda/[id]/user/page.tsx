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
  const STATUS_OPTIONS = ['エスカレ', '架電禁止', '報告', '対応完了'] as const;
  const [searchStatuses, setSearchStatuses] = useState<Record<string, boolean>>({
    エスカレ: false,
    架電禁止: false,
    報告: false,
    対応完了: false,
  });
  const [searchKeywordTags, setSearchKeywordTags] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchTime, setSearchTime] = useState('00:00');

  const fetchConversations = useCallback(
    (filters?: { status?: string; responseTime?: string; keywords?: string }) => {
      const sp = new URLSearchParams();
      sp.set('userName', userName);
      if (filters?.status?.trim()) sp.set('status', filters.status);
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
    if (!searchDate) return '';
    return `${searchDate}T${searchTime || '00:00'}`;
  };

  const handleSearch = () => {
    setDialogOpen(false);
    setLoading(true);
    const responseTime = buildResponseTimeFromPickers();
    const status = Object.entries(searchStatuses)
      .filter(([, checked]) => checked)
      .map(([s]) => s)
      .join(',');
    fetchConversations({
      status,
      responseTime,
      keywords: searchKeywordTags.join(','),
    })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const addKeywordTag = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !searchKeywordTags.includes(trimmed)) {
      setSearchKeywordTags((prev) => [...prev, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeywordTag = (tag: string) => {
    setSearchKeywordTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '、') {
      e.preventDefault();
      addKeywordTag();
    }
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
        <p><strong>合致率:</strong> {avgRate != null ? `${(avgRate * 100).toFixed(1)}%` : '-'}</p>
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
              <label>ステータス</label>
              <div className="checkbox-group">
                {STATUS_OPTIONS.map((status) => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={searchStatuses[status] ?? false}
                      onChange={(e) => setSearchStatuses((prev) => ({ ...prev, [status]: e.target.checked }))}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="searchDate">対応日時</label>
              <div className="calendar-picker">
                <input
                  id="searchDate"
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  min="2020-01-01"
                  max="2030-12-31"
                />
                <input
                  id="searchTime"
                  type="time"
                  value={searchTime}
                  onChange={(e) => setSearchTime(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="searchKeywords">キーワード</label>
              <div className="tag-input">
                <div className="tag-list">
                  {searchKeywordTags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeKeywordTag(tag)} aria-label={`${tag}を削除`}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  id="searchKeywords"
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={addKeywordTag}
                  placeholder="キーワードを入力してEnter"
                />
              </div>
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

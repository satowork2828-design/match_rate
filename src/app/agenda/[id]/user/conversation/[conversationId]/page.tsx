'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConversationDetail {
  conversation_id: string;
  userName: string;
  matchingRate: number;
  status: string;
  responseTime: string;
  keywords: string[];
}

export default function ConversationEvaluationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agendaId = params.id as string;
  const conversationId = decodeURIComponent(params.conversationId as string);
  const userName = searchParams.get('userName') ?? '';

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'match' | 'summary' | 'original' | 'customer'>('match');

  useEffect(() => {
    if (!conversationId) return;
    fetch(`${API_BASE}/agenda/conversation/${encodeURIComponent(conversationId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('会話データの取得に失敗しました'))))
      .then((data) => {
        if (data.error) throw new Error('会話が見つかりません');
        setConversation(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [conversationId]);

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

  if (loading) return <div className="loading">読み込み中…</div>;
  if (error) return <div className="error">エラー: {error}</div>;
  if (!conversation) return null;

  return (
    <main className="container">
      <div className="page-header">
        <h1>ユーザー会話評価</h1>
        <Link href={`/agenda/${agendaId}/user?userName=${encodeURIComponent(userName)}`} className="btn btn-secondary">会話一覧に戻る</Link>
      </div>
      <div className="analysis-info">
        {/* <p><strong>会話ID:</strong> {conversation.conversation_id}</p> */}
        <p><strong>ユーザー名:</strong> {conversation.userName}</p>
        <p><strong>ステータス:</strong> {conversation.status}</p>
        <p><strong>応答日時:</strong> {formatDateTime(conversation.responseTime)}</p>
      </div>
      <div className="button-row">
        <button
          type="button"
          className={`btn ${activeTab === 'match' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('match')}
        >
          合致率分析
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('summary')}
        >
          要約
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'original' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('original')}
        >
          元テキス
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('customer')}
        >
          顧客データ
        </button>
      </div>
      <div className="content-row" style={{display: 'flex'}}>
        <h2 className="section-title" style={{marginTop: '4px'}}>合致率</h2>
        <p className="match-rate-value" style={{marginLeft: '10px'}}>{(conversation.matchingRate * 100).toFixed(1)}%</p>
      </div>
      <div className="content">
        <p>今の営業スタイル、正直限界を感じていませんか？ 競争が激化する今の時代、市場の変化は<span className="highlight">驚くほど速くなっています</span>。 かつての成功体験や従来の営業手法が、もう通用しなくなっているんです。</p>
        <p>
        そこで今、求められているのが、テクノロジーを駆使した『未来の営業組織』への変革。 そう、『<span className="highlight">営業DX</span>』の実現です！ 最新テクノロジーを活用することで、組織としての持続的な成功が可能になります。
        </p>
        <p>
          変革のための手法は主に3つ。 特に重要なのが、<span className="highlight">営業プロセスの自動化と、デジタルツールの戦略的な活用</span>です。 無駄を省き、人間が本来注力すべき業務に集中できる環境を整えます。
        </p>
      </div>
    </main>
  );
}

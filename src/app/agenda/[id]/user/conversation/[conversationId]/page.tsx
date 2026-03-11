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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) return <div className="loading">読み込み中…</div>;
  if (error) return <div className="error">エラー: {error}</div>;
  if (!conversation) return null;

  return (
    <main className="container">
      <style jsx>{`
          .content{
            background-color:rgb(156, 197, 238);
            padding: 20px;
          }
          .content .content-box{
            background-color: #fff;
            padding: 10px;
          }
          .content .content-box .item-title{
            font-weight: bold;
          }
          .content .content-box .item-value{
            font-size: 14px;
            margin-left: 10px;
          }
       `}
       </style>
      <div className="page-header">
        <h1>ユーザー会話評価</h1>
        <Link href={`/agenda/${agendaId}/user?userName=${encodeURIComponent(userName)}`} className="btn btn-secondary">会話一覧に戻る</Link>
      </div>
      <div className="analysis-info">
        {/* <p><strong>会話ID:</strong> {conversation.conversation_id}</p> */}
        <p><strong>ユーザー名:</strong> {conversation.userName}</p>
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
        <div className='content-box'>
          <div className='item-title'>電話番号</div>
          <div className='item-value'>0242-22-2929</div>
          <div className='item-title'>会社名</div>
          <div className='item-value'>株式会社ジーエスピー</div>
          <div className='item-title'>名前</div>
          <div className='item-value'>稲本勝彦</div>
          <div className='item-title'>メールアドレス</div>
          <div className='item-value'>yasukazu@gs-p.co.jp</div>
          <div className='item-title'>部署名</div>
          <div className='item-value'>-</div>
        </div>
        
      </div>
      <div className="analysis-info">
        <p><strong>ステータス:</strong> {conversation.status}</p>
        <p><strong>対応日時":</strong> {formatDate(conversation.responseTime)}</p>
      </div>
    </main>
  );
}

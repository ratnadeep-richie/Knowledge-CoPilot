import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DocumentStore, runRAGPipeline, summarizeDocument, summarizeAnswer } from './ragPipeline';
import './App.css';

// ── Singleton store ───────────────────────────────────────────
const store = new DocumentStore();

// ── Stage metadata ────────────────────────────────────────────
const STAGES = [
  { id: 1, label: 'Query Rewrite',   short: 'L1', color: 'blue'   },
  { id: 2, label: 'HyDE',            short: 'L2', color: 'purple' },
  { id: 3, label: 'Hybrid Retrieval',short: 'L3', color: 'cyan'   },
  { id: 4, label: 'Reranking',       short: 'L4', color: 'orange' },
  { id: 5, label: 'Generation',      short: 'L5', color: 'green'  },
  { id: 6, label: 'Faithfulness',    short: 'L6', color: 'red'    },
];

// ── Icons ─────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    key: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    chevron: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    doc: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    thumb_up: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
    thumb_down: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.67 2L22 6l-2.33.67L19 9l-.67-2.33L16 6l2.33-.67z"/></svg>,
    loader: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  };
  return icons[name] || null;
};

// ── Stage Indicator ───────────────────────────────────────────
function StageIndicator({ stages, activeStage, completedStages }) {
  return (
    <div className="stage-track">
      {STAGES.map((s) => {
        const active = activeStage === s.id;
        const done = completedStages.includes(s.id);
        return (
          <div key={s.id} className={`stage-dot ${active ? 'active' : ''} ${done ? 'done' : ''} color-${s.color}`}>
            <div className="stage-dot-inner">
              {done ? <Icon name="check" size={10} /> : <span>{s.short}</span>}
            </div>
            <span className="stage-dot-label">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Trace Viewer ──────────────────────────────────────────────
function TraceViewer({ trace, onClose }) {
  if (!trace) return null;
  return (
    <div className="trace-overlay" onClick={onClose}>
      <div className="trace-panel" onClick={e => e.stopPropagation()}>
        <div className="trace-header">
          <span>Pipeline Trace</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="trace-body">
          {Object.entries(trace).map(([key, val]) => (
            <div key={key} className="trace-section">
              <div className="trace-key">{key}</div>
              <pre className="trace-val">{JSON.stringify(val, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────
function Message({ msg }) {
  const [showTrace, setShowTrace] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (msg.role === 'user') {
    return (
      <div className="msg msg-user">
        <div className="msg-bubble">{msg.content}</div>
      </div>
    );
  }

  if (msg.role === 'system') {
    return (
      <div className="msg msg-system">
        <span className="msg-system-text">{msg.content}</span>
      </div>
    );
  }

  // assistant
  return (
    <div className="msg msg-assistant">
      {msg.stages && (
        <StageIndicator
          activeStage={msg.activeStage}
          completedStages={msg.completedStages || []}
        />
      )}

      {msg.isDocSummary && (
        <div className="doc-summary-header">
          <Icon name="doc" size={13} />
          <span>Document Summary — <strong>{msg.docName}</strong></span>
        </div>
      )}

      <div className="msg-bubble assistant-bubble">
        {msg.streaming && !msg.content && (
          <span className="typing-cursor" />
        )}
        <div className="msg-text">{msg.content}</div>
        {msg.faithfulness && (
          <div className={`faith-badge ${msg.faithfulness.score >= 80 ? 'faith-high' : msg.faithfulness.score >= 50 ? 'faith-mid' : 'faith-low'}`}>
            <span className="faith-score">{msg.faithfulness.score}%</span>
            <span className="faith-label">Faithfulness — {msg.faithfulness.verdict}</span>
          </div>
        )}
        {msg.tldr && (
          <div className="tldr-badge">
            <span className="tldr-label">⚡ TL;DR</span>
            <span className="tldr-text">{msg.tldr}</span>
          </div>
        )}
      </div>

      {msg.sources && msg.sources.length > 0 && (
        <div className="sources">
          {msg.sources.map((s, i) => (
            <div key={i} className="source-chip">
              <Icon name="doc" size={11} />
              <span>[{i + 1}] {s.source}</span>
            </div>
          ))}
        </div>
      )}

      {msg.trace && (
        <div className="msg-actions">
          <button className="action-btn" onClick={() => setShowTrace(true)}>
            <Icon name="eye" size={12} />
            Pipeline trace
          </button>
          <button
            className={`action-btn ${feedback === 'up' ? 'active-green' : ''}`}
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          >
            <Icon name="thumb_up" size={12} />
          </button>
          <button
            className={`action-btn ${feedback === 'down' ? 'active-red' : ''}`}
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          >
            <Icon name="thumb_down" size={12} />
          </button>
        </div>
      )}

      {showTrace && <TraceViewer trace={msg.trace} onClose={() => setShowTrace(false)} />}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ apiKey, setApiKey, docs, onUpload, onDelete, options, setOptions, visible, onClose }) {
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const result = store.addDocument(file.name, text);
    onUpload({ id: result.docId, name: file.name, chunks: result.chunkCount, text });
    e.target.value = '';
  };

  return (
    <>
      <div className={`sidebar-overlay ${visible ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${visible ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <Icon name="sparkle" size={14} />
            Knowledge Copilot
          </span>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">
            <Icon name="key" size={12} />
            API Key
          </label>
          <input
            type="password"
            className="sidebar-input"
            placeholder="AIza..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <p className="sidebar-hint">Use your Gemini API key from Google AI Studio.</p>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">
            <Icon name="upload" size={12} />
            Documents
          </label>
          <button className="upload-btn" onClick={() => fileRef.current.click()}>
            Upload .txt or .md
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleFile} />
          <div className="doc-list">
            {docs.map((d) => (
              <div key={d.id} className="doc-item">
                <div className="doc-item-main">
                  <Icon name="doc" size={12} />
                  <span className="doc-name" title={d.name}>{d.name}</span>
                  <span className="doc-chunks">{d.chunks}c</span>
                </div>
                <button
                  className="doc-remove"
                  title={`Delete ${d.name}`}
                  onClick={() => onDelete(d.id)}
                >
                  <Icon name="x" size={11} />
                </button>
              </div>
            ))}
            {docs.length === 0 && <div className="sidebar-hint">No documents loaded.</div>}
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Pipeline Options</label>
          {[
            { key: 'useHyde', label: 'HyDE', desc: 'Hypothetical doc embedding' },
            { key: 'useReranking', label: 'Reranking', desc: 'Cross-encoder rerank' },
            { key: 'useFaithfulness', label: 'Faithfulness', desc: 'Post-gen verification' },
          ].map(opt => (
            <label key={opt.key} className="toggle-row">
              <div>
                <div className="toggle-label">{opt.label}</div>
                <div className="toggle-desc">{opt.desc}</div>
              </div>
              <button
                className={`toggle ${options[opt.key] ? 'on' : 'off'}`}
                onClick={() => setOptions(o => ({ ...o, [opt.key]: !o[opt.key] }))}
              >
                <span className="toggle-thumb" />
              </button>
            </label>
          ))}
        </div>

        <div className="sidebar-section sidebar-stages">
          <label className="sidebar-label">RAG Levels</label>
          {STAGES.map(s => (
            <div key={s.id} className={`stage-row color-${s.color}`}>
              <span className="stage-row-id">{s.short}</span>
              <span className="stage-row-label">{s.label}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

// ── Input Bar ─────────────────────────────────────────────────
// ── Input Bar ─────────────────────────────────────────────────
function InputBar({ onSend, loading }) {
  const [text, setText] = useState('');
  const ref = useRef();

  const send = () => {
    const q = text.trim();
    if (!q || loading) return;
    onSend(q);
    setText('');
    ref.current.style.height = 'auto';
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div className="input-bar">
      <div className="input-wrap">
        <textarea
          ref={ref}
          className="input-field"
          placeholder="Ask anything about your documents…"
          value={text}
          onChange={onInput}
          onKeyDown={onKey}
          rows={1}
          disabled={loading}
        />
        <button className={`send-btn ${loading ? 'loading' : ''}`} onClick={send} disabled={loading}>
          {loading
            ? <span className="spin"><Icon name="loader" size={16} /></span>
            : <Icon name="send" size={16} />
          }
        </button>
      </div>
    </div>
  );
}

// ── Suggestions ───────────────────────────────────────────────
const SUGGESTIONS = [
  'What is HyDE and how does it improve retrieval?',
  'Explain hybrid retrieval vs dense-only search',
  'How does faithfulness verification work?',
  'What chunking strategies are most effective?',
  'Compare BM25 and vector similarity scoring',
];

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [docs, setDocs] = useState(store.getDocuments());
  const [options, setOptions] = useState({ useHyde: true, useReranking: true, useFaithfulness: true });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef();
  const msgIdRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateMsg = useCallback((id, patchOrUpdater) => {
    setMessages(ms => ms.map(m => {
      if (m.id !== id) return m;
      const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(m) : patchOrUpdater;
      return { ...m, ...patch };
    }));
  }, []);

  const handleSend = async (query) => {
    if (!apiKey.trim()) {
      setMessages(ms => [...ms, {
        id: ++msgIdRef.current, role: 'system',
        content: '⚠ Please enter your Gemini API key in the sidebar first.',
      }]);
      setSidebarOpen(true);
      return;
    }

    const userMsg = { id: ++msgIdRef.current, role: 'user', content: query };
    const assistantId = ++msgIdRef.current;
    const assistantMsg = {
      id: assistantId, role: 'assistant', content: '',
      streaming: true, stages: true,
      activeStage: null, completedStages: [],
    };
    setMessages(ms => [...ms, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const result = await runRAGPipeline(
        query, store, apiKey.trim(), options,
        {
          onStageStart: (id) => {
            updateMsg(assistantId, { activeStage: id });
          },
          onStageComplete: (id) => {
            updateMsg(assistantId, prev => ({
              activeStage: null,
              completedStages: [...(prev?.completedStages || []), id],
            }));
          },
          onStreamChunk: (partial) => {
            updateMsg(assistantId, { content: partial });
          },
        }
      );

      updateMsg(assistantId, {
        content: result.answer,
        streaming: false,
        sources: result.sources,
        faithfulness: result.faithfulness,
        trace: result.trace,
        activeStage: null,
        completedStages: STAGES.map(s => s.id),
      });

      // Generate TL;DR summary of the answer
      try {
        const tldr = await summarizeAnswer(result.answer, apiKey.trim());
        if (tldr) {
          updateMsg(assistantId, { tldr: tldr.trim() });
        }
      } catch {
        // silently skip if summary fails
      }
    } catch (err) {
      updateMsg(assistantId, {
        content: `Error: ${err.message}`,
        streaming: false,
        activeStage: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (doc) => {
    setDocs(d => [...d, { id: doc.id, name: doc.name, chunks: doc.chunks }]);

    // Auto-summarize if API key is present
    if (!apiKey.trim() || !doc.text) return;

    const noticeId = ++msgIdRef.current;
    const summaryId = ++msgIdRef.current;

    setMessages(ms => [
      ...ms,
      {
        id: noticeId,
        role: 'system',
        content: `📄 Document uploaded: "${doc.name}" (${doc.chunks} chunks). Generating summary…`,
      },
      {
        id: summaryId,
        role: 'assistant',
        content: '',
        streaming: true,
        isDocSummary: true,
        docName: doc.name,
      },
    ]);

    try {
      const summary = await summarizeDocument(doc.name, doc.text, apiKey.trim());
      updateMsg(summaryId, { content: summary, streaming: false });
    } catch (err) {
      updateMsg(summaryId, {
        content: `Could not generate summary: ${err.message}`,
        streaming: false,
      });
    }
  };

  const handleDelete = (id) => {
    store.removeDocument(id);
    setDocs(d => d.filter(doc => doc.id !== id));
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <Sidebar
        apiKey={apiKey}
        setApiKey={setApiKey}
        docs={docs}
        onUpload={handleUpload}
        onDelete={handleDelete}
        options={options}
        setOptions={setOptions}
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(s => !s)}>
            <Icon name="menu" />
          </button>
          <span className="topbar-title">
            <Icon name="sparkle" size={14} />
            Knowledge Copilot
          </span>
          <div className="topbar-status">
            <span className={`status-dot ${apiKey ? 'connected' : 'disconnected'}`} />
            <span className="status-text">{apiKey ? 'Connected' : 'No API key'}</span>
          </div>
        </header>

        <div className="chat-area">
          {empty ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="sparkle" size={28} /></div>
              <h2 className="empty-title">Knowledge Copilot</h2>
              <p className="empty-sub">6-level RAG pipeline · Grounded answers · Live citations</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map(msg => <Message key={msg.id} msg={msg} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <InputBar onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}

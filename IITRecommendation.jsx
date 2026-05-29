import React, { useState, useEffect } from 'react';
import { getIITRecommendation, getStreams, getCategories } from '../api';

const DEFAULT_STREAMS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Electronics',
  'Aerospace', 'Data Science', 'Mathematics', 'Physics',
];

const DEFAULT_CATEGORIES = [
  'General', 'OBC-NCL', 'SC', 'ST', 'EWS',
  'OBC-NCL-PwD', 'SC-PwD', 'ST-PwD', 'OPEN-PwD',
];

const CHANCE_ICON = { High: '[High]', Good: '[Good]', Moderate: '[Mod]', Low: '[Low]', Difficult: '[Difficult]' };

// ── Category banner ──────────────────────────────────────
function CategoryBanner({ category, rank, score, categoryRank, categoryLabel }) {
  if (!category) return null;
  const showCatRank = categoryLabel && categoryLabel !== 'General' && categoryRank;
  return (
    <div style={{
      background: `${category.color}12`,
      border: `1.5px solid ${category.color}40`,
      borderLeft: `4px solid ${category.color}`,
      borderRadius: 12,
      padding: '1.1rem 1.4rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 180 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: category.color }}>
          {category.label}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
          Your Performance Category
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', flex: 1 }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: category.color }}>
            {rank.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {score != null ? 'Estimated CRL Rank' : 'CRL Rank'}
          </div>
        </div>
        {showCatRank && (
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>
              ~{categoryRank.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{categoryLabel} Rank (est.)</div>
          </div>
        )}
        {score != null && (
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#374151' }}>
              {score}/360
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>JEE Score</div>
          </div>
        )}
      </div>
      {showCatRank && (
        <div style={{
          width: '100%',
          fontSize: '0.82rem',
          color: '#374151',
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: 8,
          padding: '0.5rem 0.9rem',
        }}>
          ℹ️ Cutoff comparison uses your estimated <strong>{categoryLabel} category rank (~{categoryRank.toLocaleString()})</strong>, not your CRL rank. Category ranks are lower because fewer students compete for reserved seats.
        </div>
      )}
      <div style={{
        width: '100%',
        fontSize: '0.85rem',
        color: '#374151',
        background: `${category.color}0d`,
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
      }}>
        {category.detail}
      </div>
    </div>
  );
}

export default function IITRecommendation() {
  const [inputMode, setInputMode] = useState('rank');
  const [rank, setRank]       = useState('');
  const [score, setScore]     = useState('');
  const [stream, setStream]   = useState('Computer Science');
  const [category, setCategory] = useState('General');
  const [streams, setStreams]   = useState(DEFAULT_STREAMS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    getStreams()
      .then((r) => setStreams(r.data.streams || DEFAULT_STREAMS))
      .catch(() => {});
    getCategories()
      .then((r) => setCategories(r.data.categories || DEFAULT_CATEGORIES))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMode === 'rank' && (!rank || isNaN(rank) || Number(rank) <= 0)) {
      setError('Please enter a valid positive JEE rank (e.g. 5000).');
      return;
    }
    if (inputMode === 'score' && (!score || isNaN(score) || Number(score) < 0 || Number(score) > 360)) {
      setError('Please enter a valid JEE Advanced score between 0 and 360.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await getIITRecommendation(
        inputMode === 'rank'  ? Number(rank)  : null,
        inputMode === 'score' ? Number(score) : null,
        stream,
        category,
      );
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Server error. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>IIT Recommendation</h1>
        <p>
          Enter your JEE rank <em>or</em> score, choose your stream and reservation category —
          our AI predicts 2025 cutoffs from 7 years of historical data to find the best-fit IITs for you.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="card" style={{ maxWidth: 600, marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>

          {/* Toggle: Rank or Score */}
          <div className="form-group">
            <label>I want to enter my</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
              {['rank', 'score'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setInputMode(mode); setError(''); setResult(null); }}
                  style={{
                    padding: '0.55rem 1.4rem',
                    borderRadius: 8,
                    border: `1.5px solid ${inputMode === mode ? '#2563eb' : '#d1d5db'}`,
                    background: inputMode === mode ? '#2563eb' : 'white',
                    color: inputMode === mode ? 'white' : '#6b7280',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {mode === 'rank' ? 'JEE Rank' : 'JEE Score'}
                </button>
              ))}
            </div>
          </div>

          {/* Rank OR Score input */}
          {inputMode === 'rank' ? (
            <div className="form-group">
              <label htmlFor="rank">JEE Advanced Rank (CRL)</label>
              <input
                id="rank"
                type="number"
                className="form-input"
                placeholder="e.g. 5000"
                min="1" max="500000"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
              />
              <div style={{ fontSize: '0.77rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                Enter your Common Rank List (CRL) rank from JEE Advanced
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="score">JEE Advanced Score</label>
              <input
                id="score"
                type="number"
                className="form-input"
                placeholder="e.g. 210  (max 360)"
                min="0" max="360"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
              <div style={{ fontSize: '0.77rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                Total marks out of 360 — we'll estimate your rank automatically
              </div>
            </div>
          )}

          {/* Stream */}
          <div className="form-group">
            <label htmlFor="stream">Preferred Stream / Branch</label>
            <select
              id="stream"
              className="form-select"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
            >
              {streams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Reservation Category</label>
            <select
              id="category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.77rem', color: '#9ca3af', marginTop: '0.3rem' }}>
              Select your JEE Advanced reservation category (General = OPEN)
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Analyzing...' : 'Find IITs for Me'}
          </button>
        </form>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="spinner-wrapper">
          <div className="spinner" />
          <span>Predicting 2025 cutoffs using ML model...</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="results-section">

          {/* Performance banner */}
          <CategoryBanner
            category={result.category_info}
            rank={result.rank}
            score={result.score}
            categoryRank={result.category_rank}
            categoryLabel={result.category}
          />

          {/* Reservation category badge */}
          {result.category && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 20,
              padding: '0.3rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1d4ed8',
              marginBottom: '1rem',
            }}>
              Category: {result.category}
            </div>
          )}

          {/* Info alert */}
          <div className={`alert ${result.iits && result.iits.length === 0 ? 'alert-warn' : 'alert-info'}`}>
            {result.message}
          </div>

          {result.iits && result.iits.length > 0 && (
            <>
              <div className="section-title">
                Top IIT Recommendations — {stream}
              </div>

              {result.iits.map((item, i) => {
                const chanceColors = {
                  High:      { border: '#16a34a', bg: '#f0fdf4' },
                  Good:      { border: '#2563eb', bg: '#eff6ff' },
                  Moderate:  { border: '#ea580c', bg: '#fff7ed' },
                  Low:       { border: '#dc2626', bg: '#fef2f2' },
                  Difficult: { border: '#9f1239', bg: '#fff1f2' },
                };
                const accent = chanceColors[item.chance] || chanceColors.Low;
                return (
                <div className="iit-card" key={i} style={{ borderLeftColor: accent.border, borderLeft: `4px solid ${accent.border}` }}>
                  <div className="iit-rank-badge">#{i + 1}</div>

                  <div className="iit-info">
                    <div className="iit-name">{item.institute}</div>
                    <div className="iit-program">{item.program}</div>
                    <span className={`chance-badge chance-${item.chance}`}>
                      {item.chance === 'High' ? '✓ ' : item.chance === 'Good' ? '↑ ' : item.chance === 'Difficult' ? '✗ ' : ''}{item.chance} Chance
                    </span>
                  </div>

                  <div className="iit-stats">
                    <div className="iit-cutoff">
                      {item.predicted_closing_rank.toLocaleString()}
                    </div>
                    <div className="iit-cutoff-label">Predicted 2025 Closing Rank</div>
                    {item.rank_margin !== undefined && (
                      <div style={{ fontSize: '0.75rem', color: item.chance === 'Difficult' ? '#dc2626' : '#15803d', marginTop: 4, fontWeight: 500 }}>
                        {item.chance === 'Difficult'
                          ? `⚠ Gap: ${Math.abs(item.rank_margin).toLocaleString()} ranks`
                          : `✓ Buffer: ${item.rank_margin.toLocaleString()} ranks`}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}

              <div style={{
                marginTop: '1.5rem', padding: '1rem',
                background: '#f8fafc', borderRadius: 10,
                fontSize: '0.82rem', color: '#6b7280',
              }}>
                <strong>How this works:</strong> Trained on 7 years of JEE Advanced cutoffs (2016–2022)
                using a 500-tree Random Forest model. Predictions are for {result.category || 'General'} category,
                Gender-Neutral seat.
                {result.score != null && (
                  <> Score→Rank conversion uses historical percentile mapping.</>
                )}
                {' '}Use as a guide, not a guarantee.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

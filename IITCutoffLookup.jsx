import React, { useState, useEffect } from 'react';
import { getIITNames, getIITPrograms, getIITCutoffLookup, getCategories } from '../api';

const DEFAULT_CATEGORIES = [
  'General', 'OBC-NCL', 'SC', 'ST', 'EWS',
  'OBC-NCL-PwD', 'SC-PwD', 'ST-PwD', 'OPEN-PwD',
];

// Fallback IIT list — used if the backend /iit-names call fails
const FALLBACK_IIT_NAMES = [
  'Indian Institute of Technology (BHU) Varanasi',
  'Indian Institute of Technology (ISM) Dhanbad',
  'Indian Institute of Technology Bhilai',
  'Indian Institute of Technology Bhubaneswar',
  'Indian Institute of Technology Bombay',
  'Indian Institute of Technology Delhi',
  'Indian Institute of Technology Dharwad',
  'Indian Institute of Technology Gandhinagar',
  'Indian Institute of Technology Goa',
  'Indian Institute of Technology Guwahati',
  'Indian Institute of Technology Hyderabad',
  'Indian Institute of Technology Indore',
  'Indian Institute of Technology Jammu',
  'Indian Institute of Technology Jodhpur',
  'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur',
  'Indian Institute of Technology Madras',
  'Indian Institute of Technology Mandi',
  'Indian Institute of Technology Palakkad',
  'Indian Institute of Technology Patna',
  'Indian Institute of Technology Roorkee',
  'Indian Institute of Technology Ropar',
  'Indian Institute of Technology Tirupati',
];

const TREND_META = {
  increasing: {
    label: '↑ Cutoff Rising',
    color: '#dc2626',
    bg: '#fef2f2',
    tip: 'Competition increasing — harder to get in over time.',
  },
  decreasing: {
    label: '↓ Cutoff Falling',
    color: '#16a34a',
    bg: '#f0fdf4',
    tip: 'Competition easing — may be easier in 2025.',
  },
  stable: {
    label: '→ Stable',
    color: '#2563eb',
    bg: '#eff6ff',
    tip: 'Cutoff has been fairly consistent across years.',
  },
};

const th = {
  padding: '0.55rem 0.9rem',
  textAlign: 'left',
  fontWeight: 600,
  color: '#6b7280',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: '1px solid #e5e7eb',
};
const td = { padding: '0.55rem 0.9rem' };

// ─── YearlyTable ──────────────────────────────────────────
function YearlyTable({ yearly, predicted2025 }) {
  const allRows = [
    ...yearly,
    ...(predicted2025
      ? [{ year: 2025, opening_rank: null, closing_rank: predicted2025, predicted: true }]
      : []),
  ];
  return (
    <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={th}>Year</th>
            <th style={th}>Opening Rank</th>
            <th style={th}>Closing Rank</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row) => (
            <tr
              key={row.year}
              style={{
                background: row.predicted ? '#fefce8' : 'white',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <td style={{ ...td, fontWeight: row.predicted ? 700 : 500, color: row.predicted ? '#ca8a04' : '#111827' }}>
                {row.year}{row.predicted ? ' ✦ predicted' : ''}
              </td>
              <td style={{ ...td, color: '#374151' }}>
                {row.opening_rank != null ? row.opening_rank.toLocaleString() : '—'}
              </td>
              <td style={{ ...td, fontWeight: 600, color: row.predicted ? '#ca8a04' : '#1d4ed8' }}>
                {row.closing_rank.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MiniChart ────────────────────────────────────────────
function MiniChart({ yearly, predicted2025 }) {
  const allPts = [
    ...yearly.map((r) => ({ year: r.year, val: r.closing_rank, predicted: false })),
    ...(predicted2025 ? [{ year: 2025, val: predicted2025, predicted: true }] : []),
  ];
  if (allPts.length < 2) return null;

  const W = 420, H = 90, PAD = { top: 12, right: 16, bottom: 24, left: 48 };
  const vals = allPts.map((p) => p.val);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const years = allPts.map((p) => p.year);
  const minY = Math.min(...years), maxY = Math.max(...years);
  const yRange = maxY - minY || 1;

  const x = (yr) => PAD.left + ((yr - minY) / yRange) * (W - PAD.left - PAD.right);
  const y = (v) =>  PAD.top  + ((maxV - v)  / range)  * (H - PAD.top  - PAD.bottom);

  const points = allPts.map((p) => `${x(p.year)},${y(p.val)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 90, marginTop: 8 }}>
      <line
        x1={PAD.left} y1={y((minV + maxV) / 2)} x2={W - PAD.right} y2={y((minV + maxV) / 2)}
        stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,3"
      />
      <polygon
        points={`${x(minY)},${H - PAD.bottom} ${points} ${x(maxY)},${H - PAD.bottom}`}
        fill="#dbeafe" fillOpacity="0.5"
      />
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {allPts.map((p) => (
        <circle
          key={p.year}
          cx={x(p.year)} cy={y(p.val)}
          r={p.predicted ? 5 : 3.5}
          fill={p.predicted ? '#ca8a04' : '#2563eb'}
          stroke="white" strokeWidth="1.5"
        />
      ))}
      {allPts.map((p) => (
        <text key={p.year} x={x(p.year)} y={H - 6} textAnchor="middle"
          fontSize="9" fill={p.predicted ? '#ca8a04' : '#9ca3af'} fontWeight={p.predicted ? 700 : 400}>
          {p.year}
        </text>
      ))}
      <text x={PAD.left - 4} y={y(minV) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
        {minV.toLocaleString()}
      </text>
      <text x={PAD.left - 4} y={y(maxV) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
        {maxV.toLocaleString()}
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function IITCutoffLookup() {
  const [iitNames,    setIITNames]    = useState([]);
  const [programs,    setPrograms]    = useState([]);
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES);
  const [institute,   setInstitute]   = useState('');
  const [stream,      setStream]      = useState('');
  const [category,    setCategory]    = useState('General');
  const [loading,     setLoading]     = useState(false);
  const [progLoading, setProgLoading] = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [expanded,    setExpanded]    = useState({});
  const [backendOk,   setBackendOk]   = useState(null); // null=unknown, true/false

  // ── On mount: load IIT names, categories, check backend ──
  useEffect(() => {
    // Check if backend is reachable
    getIITNames()
      .then((r) => {
        setIITNames(r.data.iit_names || []);
        setBackendOk(true);
      })
      .catch(() => {
        setBackendOk(false);
        // Fallback list still shown — user can try to look up
        setIITNames(FALLBACK_IIT_NAMES);
      });

    getCategories()
      .then((r) => setCategories(r.data.categories || DEFAULT_CATEGORIES))
      .catch(() => {});
  }, []);

  // ── Fetch programs when IIT changes ──────────────────────
  useEffect(() => {
    if (!institute) {
      setPrograms([]);
      setStream('');
      return;
    }
    setProgLoading(true);
    setStream('');
    setPrograms([]);
    getIITPrograms(institute)
      .then((r) => setPrograms(r.data.programs || []))
      .catch(() => {})
      .finally(() => setProgLoading(false));
  }, [institute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institute.trim()) { setError('Please select an IIT.'); return; }
    if (!stream.trim())    { setError('Please select or enter a course / branch.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setExpanded({});
    try {
      const res = await getIITCutoffLookup(institute, stream, category);
      setResult(res.data);
      if (res.data.results && res.data.results.length > 0) {
        setExpanded({ 0: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg) {
        setError(msg);
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        setError(
          'Cannot reach the backend server. Make sure you started it with: cd backend && python app.py'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <h1>IIT Cutoff Lookup</h1>
        <p>
          Enter an IIT and stream to see historical opening &amp; closing ranks
          (2016–2022) across all categories, plus our 2025 ML prediction.
        </p>
      </div>

      {/* Backend status banner */}
      {backendOk === false && (
        <div className="alert alert-warn" style={{ maxWidth: 600, marginBottom: '1rem' }}>
          ⚠️ <strong>Backend server not detected.</strong> Start it with:&nbsp;
          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
            cd backend &amp;&amp; python app.py
          </code>
          &nbsp;— then refresh. IIT name list is using offline fallback.
        </div>
      )}

      {/* Form */}
      <div className="card" style={{ maxWidth: 600, marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>

          {/* IIT selector */}
          <div className="form-group">
            <label htmlFor="institute">IIT Name</label>
            <select
              id="institute"
              className="form-select"
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
            >
              <option value="">— Select an IIT —</option>
              {(iitNames.length > 0 ? iitNames : FALLBACK_IIT_NAMES).map((n) => (
                <option key={n} value={n}>
                  {n.replace('Indian Institute of Technology', 'IIT').trim()}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.77rem', color: '#9ca3af', marginTop: '0.3rem' }}>
              Select any IIT from the list
            </div>
          </div>

          {/* Course / Stream */}
          <div className="form-group">
            <label htmlFor="stream">Course / Branch</label>
            {programs.length > 0 ? (
              <select
                id="stream"
                className="form-select"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                disabled={progLoading}
              >
                <option value="">— Select a course —</option>
                {programs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                id="stream"
                className="form-input"
                placeholder={
                  progLoading
                    ? 'Loading courses...'
                    : institute
                    ? 'Type a branch keyword (e.g. Computer)'
                    : 'Select an IIT above to load its courses'
                }
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                disabled={progLoading}
              />
            )}
            <div style={{ fontSize: '0.77rem', color: '#9ca3af', marginTop: '0.3rem' }}>
              {programs.length > 0
                ? `${programs.length} courses available at this IIT`
                : 'Select an IIT above to load its courses'}
            </div>
          </div>

          {/* Reservation Category */}
          <div className="form-group">
            <label htmlFor="cat">Reservation Category</label>
            <select
              id="cat"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Fetching cutoff data...' : 'Look Up Cutoff Ranks'}
          </button>
        </form>
      </div>

      {/* Spinner */}
      {loading && (
        <div className="spinner-wrapper">
          <div className="spinner" />
          <span>Scanning 7 years of JEE Advanced data...</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="results-section">

          {/* Summary banner */}
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: 12,
            padding: '1rem 1.4rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3a8a' }}>
                {result.institute}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: 2 }}>
                Stream: <strong>{result.stream}</strong> &nbsp;·&nbsp;
                Category: <strong>{result.category}</strong>
              </div>
            </div>
            <div style={{
              background: '#dbeafe',
              borderRadius: 20,
              padding: '0.3rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#1d4ed8',
            }}>
              {result.results.length} program{result.results.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {result.results.length === 0 && (
            <div className="alert alert-warn">
              No data found for the selected combination. Try a broader stream keyword
              (e.g. "Computer" instead of a full program name).
            </div>
          )}

          {result.results.map((item, i) => {
            const trend  = TREND_META[item.trend] || TREND_META.stable;
            const latest = item.yearly_data[item.yearly_data.length - 1];
            const isOpen = expanded[i];

            return (
              <div
                key={i}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  marginBottom: '0.85rem',
                  overflow: 'hidden',
                  boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.07)' : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Card header */}
                <div
                  onClick={() => toggle(i)}
                  style={{
                    padding: '1.1rem 1.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    borderLeft: `4px solid ${trend.color}`,
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    color: 'white', fontWeight: 700, fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>#{i + 1}</div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>
                      {item.program}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                      {item.seat_type} · Gender-Neutral
                    </div>
                  </div>

                  {latest && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>
                            {latest.opening_rank.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            Opening ({latest.year})
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8' }}>
                            {latest.closing_rank.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            Closing ({latest.year})
                          </div>
                        </div>
                        {item.predicted_2025 && (
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ca8a04' }}>
                              ~{item.predicted_2025.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                              Predicted 2025
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{
                      background: trend.bg, color: trend.color,
                      border: `1px solid ${trend.color}40`,
                      borderRadius: 20, padding: '0.2rem 0.7rem',
                      fontSize: '0.75rem', fontWeight: 600,
                    }}>{trend.label}</span>
                    <span style={{
                      color: '#9ca3af', fontSize: '1rem',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}>▼</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '0 1.4rem 1.2rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{
                      marginTop: '0.9rem',
                      background: trend.bg,
                      border: `1px solid ${trend.color}30`,
                      borderRadius: 8,
                      padding: '0.5rem 0.9rem',
                      fontSize: '0.8rem',
                      color: trend.color,
                      fontWeight: 500,
                    }}>
                      ℹ️ {trend.tip}
                    </div>

                    <MiniChart yearly={item.yearly_data} predicted2025={item.predicted_2025} />
                    <YearlyTable yearly={item.yearly_data} predicted2025={item.predicted_2025} />

                    {item.predicted_2025 && (
                      <div style={{
                        marginTop: '0.9rem',
                        background: '#fefce8',
                        border: '1px solid #fde68a',
                        borderRadius: 10,
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>✦</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>
                            Predicted 2025 Closing Rank: {item.predicted_2025.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#a16207', marginTop: 2 }}>
                            ML prediction using 500-tree Random Forest trained on 2016–2022 data.
                            Use as a guide, not a guarantee.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

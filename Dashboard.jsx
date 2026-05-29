import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [meData,  setMeData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pf,      setPf]      = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(r => { if (r.data.success) setMeData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const startEdit = () => {
    setPf({ fullName: user?.fullName, className: user?.className, schoolName: user?.schoolName });
    setEditing(true); setSaveMsg('');
  };
  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await updateProfile(pf);
      if (res.success) { setSaveMsg('Profile updated!'); setEditing(false); }
      else setSaveMsg(res.error || 'Error saving.');
    } catch { setSaveMsg('Failed to save.'); }
    finally { setSaving(false); }
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={s.spinner} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const quickActions = [
    { label: 'IIT Finder',      sub: 'Check JEE eligibility',   path: '/iit' },
    { label: 'Cutoff Lookup',   sub: 'Explore IIT cutoffs',      path: '/iit-cutoff' },
    { label: 'College + Course', sub: 'Find matching colleges',   path: '/college' },
  ];

  const features = [
    {
      icon: null, title: 'JEE Prediction',
      desc: 'Enter your JEE rank or score to get personalised IIT branch recommendations based on real cutoff data.',
      color: '#4f46e5', path: '/iit', btnLabel: 'Try IIT Finder',
    },
    {
      icon: null, title: 'IIT Cutoff Lookup',
      desc: 'Browse official JEE Advanced cutoffs for every IIT, branch, and category across multiple years.',
      color: '#4f46e5', path: '/iit-cutoff', btnLabel: 'Browse Cutoffs',
    },
    {
      icon: null, title: 'Course Recommendation',
      desc: 'Pick subjects you love and your preferred location to discover the best-matched colleges and courses.',
      color: '#7c3aed', path: '/college', btnLabel: 'Explore Colleges',
    },
  ];

  // Visualization data
  const cutoffTrends = [
    { year: '16', rank: 202 },
    { year: '17', rank: 165 },
    { year: '18', rank: 189 },
    { year: '19', rank: 214 },
    { year: '20', rank: 198 },
    { year: '21', rank: 225 },
    { year: '22', rank: 241 },
  ];
  const maxRank = Math.max(...cutoffTrends.map(d => d.rank));
  const chartH = 80, chartW = 260;
  const pts = cutoffTrends.map((d, i) => ({
    x: (i / (cutoffTrends.length - 1)) * chartW,
    y: chartH - (d.rank / (maxRank + 20)) * chartH,
    ...d,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${pts[0].x},${chartH} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},${chartH} Z`;

  const categoryData = [
    { cat: 'General',  pct: 42, color: '#4f46e5' },
    { cat: 'OBC-NCL',  pct: 27, color: '#0891b2' },
    { cat: 'SC',       pct: 18, color: '#7c3aed' },
    { cat: 'ST',       pct: 13, color: '#f59e0b' },
  ];

  const topIITs = [
    { name: 'IIT Bombay',     score: 98, color: '#4f46e5' },
    { name: 'IIT Delhi',      score: 95, color: '#0891b2' },
    { name: 'IIT Madras',     score: 92, color: '#7c3aed' },
    { name: 'IIT Kanpur',     score: 88, color: '#f59e0b' },
    { name: 'IIT Kharagpur',  score: 85, color: '#10b981' },
  ];

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drawLine{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        .dc{animation:fadeUp 0.32s ease both}
        input:focus{outline:none!important;border-color:#4f46e5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.12)!important}
        .qa-btn{display:flex;align-items:center;gap:0.8rem;background:white;border:1.5px solid #e5e7eb;border-radius:12px;padding:0.88rem 1.1rem;cursor:pointer;transition:all 0.16s;box-shadow:0 1px 6px rgba(0,0,0,0.05);text-align:left;}
        .qa-btn:hover{background:#ede9fe!important;border-color:#c4b5fd!important;transform:translateY(-1px);box-shadow:0 4px 14px rgba(79,70,229,0.15)!important}
        .feat-card{transition:transform 0.2s,box-shadow 0.2s}
        .feat-card:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.1)!important}
        .viz-card{background:white;border-radius:16px;padding:1.25rem;box-shadow:0 1px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb;transition:transform 0.2s,box-shadow 0.2s}
        .viz-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,0.09)!important}
        .chart-line{stroke-dasharray:1000;stroke-dashoffset:1000;animation:drawLine 1.6s ease forwards 0.5s}
        @media(max-width:700px){
          .quick-row{grid-template-columns:1fr!important}
          .feat-row{grid-template-columns:1fr!important}
          .viz-row{grid-template-columns:1fr!important}
          .profile-strip{flex-direction:column;align-items:flex-start}
        }
      `}</style>

      {/* HERO */}
      <div style={s.hero}>
        <div style={s.orb1}/><div style={s.orb2}/>
        <div style={s.heroTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <p style={s.greeting}>Welcome back</p>
              <h1 style={s.heroName}>{user?.fullName || 'Student'}</h1>
            </div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign Out</button>
        </div>

        <div className="profile-strip" style={s.profileStrip}>
          {[
            { icon: null, label: 'Email',            value: user?.email },
            { icon: null, label: 'Class / Year',     value: user?.className },
            { icon: null, label: 'School / College', value: user?.schoolName },
          ].map(f => (
            <div key={f.label} style={s.pchip}>
              {f.icon && <span style={{ fontSize: '1rem' }}>{f.icon}</span>}
              <div>
                <div style={s.chipLabel}>{f.label}</div>
                <div style={s.chipValue}>{f.value || '—'}</div>
              </div>
            </div>
          ))}
          {/* Edit Profile — single location, only in hero */}
          <button onClick={startEdit} style={s.editBtn}>Edit Profile</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={s.overlay} onClick={() => setEditing(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()} className="dc">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Edit Profile</h2>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            {saveMsg && (
              <div style={{ padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem', display: 'inline-block',
                background: saveMsg.includes('!') ? '#dcfce7' : '#fef2f2',
                color:      saveMsg.includes('!') ? '#15803d' : '#dc2626' }}>
                {saveMsg}
              </div>
            )}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {[
                { key: 'fullName',   lbl: 'Full Name' },
                { key: 'className',  lbl: 'Class / Year' },
                { key: 'schoolName', lbl: 'School / College' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                  <label style={{ fontSize: '0.77rem', fontWeight: 700, color: '#374151' }}>{f.lbl}</label>
                  <input value={pf[f.key] || ''} onChange={e => setPf(p => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.55rem', marginTop: '0.2rem' }}>
                <button type="submit" disabled={saving} style={s.saveBtn}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={s.body}>

        {/* Quick Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead title="Quick Actions" />
          <div className="quick-row" style={s.quickRow}>
            {quickActions.map(a => (
              <button key={a.path} className="qa-btn" onClick={() => navigate(a.path)}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{a.label}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.74rem', marginTop: 2 }}>{a.sub}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#a78bfa', fontSize: '1rem' }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead title="Explore Features" />
          <div className="feat-row" style={s.featRow}>
            {features.map(f => (
              <div key={f.path} className="feat-card dc" style={s.featCard}>
                {f.icon && (
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '1rem' }}>
                  {f.icon}
                </div>
                )}
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{f.title}</h3>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.83rem', color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</p>
                {/* All buttons use navigate(f.path) — IIT Cutoff correctly goes to /iit-cutoff */}
                <button onClick={() => navigate(f.path)} style={{ ...s.featBtn, background: f.color }}>
                  {f.btnLabel} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* JEE Insights Visualizations */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead title="JEE Insights" />
          <div className="viz-row" style={s.vizRow}>

            {/* Chart 1 — Cutoff Trend Line */}
            <div className="viz-card dc">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>IIT Bombay CSE — Opening Rank</div>
                  <div style={{ fontSize: '0.71rem', color: '#9ca3af', marginTop: 1 }}>General category · 2016–2022</div>
                </div>
                <span style={{ background: '#ede9fe', color: '#4f46e5', borderRadius: 20, padding: '0.12rem 0.55rem', fontSize: '0.68rem', fontWeight: 700 }}>JEE Adv</span>
              </div>
              <svg viewBox={`-4 -8 ${chartW + 8} ${chartH + 28}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((t, i) => (
                  <line key={i} x1={0} y1={chartH * (1-t)} x2={chartW} y2={chartH * (1-t)} stroke="#f1f5f9" strokeWidth="1" />
                ))}
                <path d={areaPath} fill="url(#ag)" />
                <polyline className="chart-line" points={polyline} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="#4f46e5" strokeWidth="2" />
                    <text x={p.x} y={chartH + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">{p.year}</text>
                    <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="7.5" fill="#4f46e5" fontWeight="700">{p.rank}</text>
                  </g>
                ))}
              </svg>
              <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: '0.3rem', textAlign: 'center' }}>
                Rank trending upward → tougher competition each year
              </div>
            </div>

            {/* Chart 2 — Category Seat Distribution */}
            <div className="viz-card dc">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>Seat Distribution by Category</div>
                  <div style={{ fontSize: '0.71rem', color: '#9ca3af', marginTop: 1 }}>All IITs combined · 2022</div>
                </div>
                <span style={{ background: '#e0f2fe', color: '#0891b2', borderRadius: 20, padding: '0.12rem 0.55rem', fontSize: '0.68rem', fontWeight: 700 }}>Seats</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg viewBox="0 0 80 80" width="80" height="80" style={{ flexShrink: 0 }}>
                  {(() => {
                    let offset = 0;
                    const r = 28, cx = 40, cy = 40, circ = 2 * Math.PI * r;
                    return categoryData.map((d) => {
                      const dash = (d.pct / 100) * circ;
                      const el = (
                        <circle key={d.cat} cx={cx} cy={cy} r={r}
                          fill="none" stroke={d.color} strokeWidth="13"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeDashoffset={-(offset / 100) * circ + circ * 0.25}
                        />
                      );
                      offset += d.pct;
                      return el;
                    });
                  })()}
                  <text x="40" y="43" textAnchor="middle" fontSize="8" fontWeight="800" fill="#374151">2022</text>
                </svg>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {categoryData.map(d => (
                    <div key={d.cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>{d.cat}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: d.color }}>{d.pct}%</span>
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: animated ? `${d.pct}%` : '0%',
                          background: d.color,
                          borderRadius: 99,
                          transition: 'width 1.1s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 3 — Top IITs NIRF */}
            <div className="viz-card dc">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>Top IITs — NIRF Score</div>
                  <div style={{ fontSize: '0.71rem', color: '#9ca3af', marginTop: 1 }}>National ranking index · 2022</div>
                </div>
                <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '0.12rem 0.55rem', fontSize: '0.68rem', fontWeight: 700 }}>NIRF</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {topIITs.map((iit, i) => (
                  <div key={iit.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: iit.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: iit.color, flexShrink: 0 }}>
                      #{i+1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#374151' }}>{iit.name}</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: iit.color }}>{iit.score}</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: animated ? `${iit.score}%` : '0%',
                          background: `linear-gradient(90deg,${iit.color}88,${iit.color})`,
                          borderRadius: 99,
                          transition: `width ${0.9 + i * 0.12}s cubic-bezier(0.34,1.56,0.64,1)`,
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/iit-cutoff')} style={{ ...s.featBtn, background: '#4f46e5', marginTop: '1rem', width: '100%', textAlign: 'center', padding: '0.5rem', display: 'block' }}>
                View Full Cutoffs →
              </button>
            </div>

          </div>
        </div>

        {/* Profile Summary — Edit Profile removed here (single location in hero) */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead title="Profile Summary" />
          <div style={s.card} className="dc">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ ...s.avatar, width: 64, height: 64, fontSize: '1.4rem', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: '3px solid #e0e7ff' }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{user?.fullName || '—'}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{user?.email}</div>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  {user?.className  && <span style={s.tag}>{user.className}</span>}
                  {user?.schoolName && <span style={s.tag}>{user.schoolName}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div style={s.tipsCard} className="dc">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></div>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a' }}>
            Getting the most out of College Compass
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#3b82f6', lineHeight: 1.7 }}>
            Use <strong>IIT Finder</strong> to check your JEE eligibility → explore <strong>Cutoff Lookup</strong> for specific branches → then find your perfect match with <strong>College + Course Recommendation</strong>.
          </p>
        </div>

      </div>
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.9rem' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }} />
      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{title}</span>
    </div>
  );
}

const s = {
  page: { background: '#f1f5f9', minHeight: '100vh' },
  hero: { background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 45%,#4338ca 100%)', padding: '1.6rem 0 0', position: 'relative', overflow: 'hidden' },
  orb1: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,102,241,0.22)', filter: 'blur(40px)', pointerEvents: 'none' },
  orb2: { position: 'absolute', bottom: 0, left: '30%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(56,189,248,0.1)', filter: 'blur(35px)', pointerEvents: 'none' },
  heroTop: { maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(255,255,255,0.32),rgba(255,255,255,0.12))', border: '2px solid rgba(255,255,255,0.42)', color: 'white', fontWeight: 900, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  greeting: { margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 500 },
  heroName: { margin: '0.08rem 0 0', color: 'white', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.4px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.26)', color: 'rgba(255,255,255,0.88)', padding: '0.42rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
  profileStrip: { maxWidth: 1140, margin: '0 auto', padding: '0.7rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' },
  pchip: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.17)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '0.48rem 0.8rem' },
  chipLabel: { fontSize: '0.66rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 },
  chipValue: { fontSize: '0.83rem', color: 'white', fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  editBtn: { marginLeft: 'auto', background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.28)', color: 'white', borderRadius: 8, padding: '0.42rem 0.88rem', fontSize: '0.79rem', fontWeight: 700, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, padding: '1.65rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  input: { padding: '0.52rem 0.78rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.88rem', color: '#111827', background: '#fafafa', width: '100%', boxSizing: 'border-box' },
  saveBtn: { flex: 1, padding: '0.62rem', background: 'linear-gradient(135deg,#1d4ed8,#4338ca)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  cancelBtn: { padding: '0.62rem 1rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  body: { maxWidth: 1140, margin: '0 auto', padding: '1.65rem 1.5rem 3rem' },
  quickRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.8rem' },
  featRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' },
  featCard: { background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' },
  featBtn: { color: 'white', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', display: 'inline-block' },
  vizRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' },
  card: { background: 'white', borderRadius: 14, padding: '1.3rem', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' },
  tag: { background: '#f0f4ff', color: '#4338ca', border: '1px solid #e0e7ff', borderRadius: 20, fontSize: '0.72rem', padding: '0.18rem 0.65rem', fontWeight: 600 },
  tipsCard: { background: 'linear-gradient(135deg,#eff6ff,#eef2ff)', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: '1.4rem 1.6rem', textAlign: 'center' },
  spinner: { width: 36, height: 36, border: '4px solid #e5e7eb', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.75s linear infinite' },
};

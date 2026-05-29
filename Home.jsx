import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'JEE / IIT Prediction',
    desc: 'Enter your JEE rank and preferred stream. Get top IITs you can realistically target based on 2025 predicted cutoffs.',
    path: '/iit',
    cta: 'Find IITs',
  },
  {
    title: 'IIT Cutoff Lookup',
    desc: 'Browse official JEE Advanced cutoffs for every IIT, branch, and category across multiple years of historical data.',
    path: '/iit-cutoff',
    cta: 'Browse Cutoffs',
  },
  {
    title: 'Course + College Finder',
    desc: 'Select subjects you love and your preferred location. Get matching courses and top NIRF-ranked Government & Private colleges.',
    path: '/college',
    cta: 'Explore Colleges',
  },
];

const stats = [
  { value: '2,200+', label: 'NIRF Colleges' },
  { value: '7 Years', label: 'JEE Data (2016–2022)' },
  { value: 'AI/ML',  label: 'Powered Predictions' },
  { value: '23 IITs', label: 'Covered' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <h1>Your AI-Powered<br />JEE Career Guide</h1>
        <p>
          Find the right IIT, course, and college based on your JEE rank and academic interests —
          powered by real data from 2016–2022 JEE cutoffs and NIRF rankings.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/iit')}>
            IIT Finder
          </button>
          <button
            className="btn btn-lg"
            style={{ background: 'white', color: '#1d4ed8' }}
            onClick={() => navigate('/college')}
          >
            College Finder
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="page-wrapper">
        {/* Stats */}
        <div className="stats-row" style={{ marginTop: 0 }}>
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.4rem' }}>
          What can College Compass do?
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Three powerful modules to guide your JEE journey
        </p>

        <div className="card-grid">
          {features.map((f) => (
            <div
              className="feature-card"
              key={f.title}
              onClick={() => navigate(f.path)}
            >
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <p style={{ marginTop: '1rem', color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
                {f.cta} &rarr;
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="card" style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem' }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Enter your JEE Rank', desc: 'Input your actual or expected JEE Advanced rank.' },
              { step: '02', title: 'Choose Stream or Subjects', desc: 'Pick preferred engineering stream or academic subjects.' },
              { step: '03', title: 'AI Analysis', desc: 'Our ML model trained on 7 years of JEE data predicts 2025 cutoffs.' },
              { step: '04', title: 'Get Recommendations', desc: 'Receive ranked IITs & NIRF colleges with admission chances.' },
            ].map((item) => (
              <div key={item.step}>
                <div style={{
                  fontSize: '1.8rem', fontWeight: 800,
                  background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>{item.step}</div>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.3rem' }}>{item.title}</div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '2.5rem' }}>
          College Compass — Built with React + Flask + scikit-learn | Data: JEE 2016–2022 & NIRF 2025
        </p>
      </div>
    </>
  );
}

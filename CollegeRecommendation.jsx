import React, { useState, useEffect } from 'react';
import { getCollegeRecommendation, getSubjects, getLocations } from '../api';

export default function CollegeRecommendation() {
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState('state');
  const [activeTab, setActiveTab] = useState('govt');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubjects().then((r) => setAllSubjects(r.data.subjects || [])).catch(() => {});
    getLocations()
      .then((r) => {
        setStates(r.data.states || []);
        setCities(r.data.cities || []);
      })
      .catch(() => {});
  }, []);

  const toggleSubject = (s) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await getCollegeRecommendation(subjects, location || null, locationType);
      setResult(res.data);
      setActiveTab('govt');
    } catch (err) {
      setError(err?.response?.data?.error || 'Server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const locationOptions = locationType === 'state' ? states : cities;

  const CollegeTable = ({ colleges }) => {
    if (!colleges || colleges.length === 0)
      return (
        <div className="empty-state">
          
          <p>No colleges found. Try changing the location or subjects.</p>
        </div>
      );

    return (
      <div className="college-table-wrapper">
        <table className="college-table">
          <thead>
            <tr>
              <th>#</th>
              <th>College</th>
              <th>Branch</th>
              <th>Location</th>
              <th>NIRF</th>
              <th>Avg. Package</th>
              <th>JEE Cutoff</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr key={i}>
                <td><span className="nirf-badge">{i + 1}</span></td>
                <td>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{c.college_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{c.course}</div>
                </td>
                <td style={{ color: '#4b5563', fontSize: '0.82rem' }}>{c.branch}</td>
                <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>{c.city}, {c.state}</td>
                <td>
                  <span className="nirf-badge">#{c.nirf_rank}</span>
                </td>
                <td style={{ fontWeight: 600, color: '#15803d' }}>
                  ₹{c.avg_package.toFixed(1)} LPA
                </td>
                <td style={{ color: '#1d4ed8', fontWeight: 600 }}>
                  {c.jee_cutoff.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <h1>Course + College Finder</h1>
        <p>
          Select subjects you enjoy, choose your preferred location, and get AI-matched courses
          and NIRF-ranked colleges — separated by Government and Private.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Subject multi-select */}
          <div className="form-group">
            <label>
              Select Subjects <span style={{ color: '#9ca3af', fontWeight: 400 }}>(pick one or more)</span>
            </label>
            <div className="multi-select-grid">
              {allSubjects.map((s) => (
                <div
                  key={s}
                  className={`multi-select-chip ${subjects.includes(s) ? 'selected' : ''}`}
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                </div>
              ))}
            </div>
            {subjects.length > 0 && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#6b7280' }}>
                Selected: {subjects.join(', ')}
              </div>
            )}
          </div>

          {/* Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Filter by</label>
              <select
                className="form-select"
                value={locationType}
                onChange={(e) => { setLocationType(e.target.value); setLocation(''); }}
              >
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>{locationType === 'state' ? 'State' : 'City'} (optional)</label>
              <select
                className="form-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">All India</option>
                {locationOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {loading ? 'Searching...' : 'Find Courses & Colleges'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="spinner-wrapper">
          <div className="spinner" />
          <span>Searching NIRF database and ranking colleges...</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="results-section">
          {/* Summary banner */}
          <div className="alert alert-info">
            Found <strong>{result.courses?.length || 0} courses</strong>, &nbsp;
            <strong>{result.govt?.length || 0} government colleges</strong> and &nbsp;
            <strong>{result.private?.length || 0} private colleges</strong>
            {result.location !== 'All India' ? ` in ${result.location}` : ' across India'}
          </div>

          {/* Courses section */}
          {result.courses && result.courses.length > 0 && (
            <>
              <div className="section-title">Recommended Courses</div>
              <div className="course-grid">
                {result.courses.map((c, i) => (
                  <div className="course-card" key={i}>
                    <div className="course-name">{c.name}</div>
                    <div className="course-desc">{c.description}</div>
                    <div className="course-subjects">
                      {c.subjects.map((s) => (
                        <span className="subject-tag" key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Colleges tabs */}
          <div className="section-title" style={{ marginTop: '2rem' }}>Colleges</div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'govt' ? 'active' : ''}`}
              onClick={() => setActiveTab('govt')}
            >
              Government ({result.govt?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Private ({result.private?.length || 0})
            </button>
          </div>

          {activeTab === 'govt' && <CollegeTable colleges={result.govt} />}
          {activeTab === 'private' && <CollegeTable colleges={result.private} />}

          {/* Legend */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 10, fontSize: '0.82rem', color: '#6b7280' }}>
            <strong>How colleges are ranked:</strong> Colleges are sorted by NIRF rank (lower = better).
            Average package and JEE cutoff are indicative values from the NIRF dataset.
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, clearToken } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStats, setSelectedStats] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadUrls();
  }, []);

  async function loadUrls() {
    try {
      const data = await api.listUrls();
      setUrls(data.urls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this link? This cannot be undone.')) return;
    try {
      await api.deleteUrl(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(id, current) {
    try {
      await api.toggleUrl(id, !current);
      setUrls((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleViewStats(id) {
    try {
      const data = await api.getStats(id);
      setSelectedStats(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  if (loading) return <p>Loading your links...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Your links</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>
      <p className="subtitle">{urls.length} link{urls.length === 1 ? '' : 's'} created so far</p>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        {urls.length === 0 ? (
          <p>You haven't created any links yet. Head to the home page to make your first one.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Short link</th>
                <th>Destination</th>
                <th>Clicks</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {urls.map((u) => (
                <tr key={u.id}>
                  <td><a href={u.shortUrl} target="_blank" rel="noreferrer">{u.shortCode}</a></td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.originalUrl}
                  </td>
                  <td>{u.clickCount}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'active' : 'disabled'}
                    </span>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => handleViewStats(u.id)}>stats</button>
                    <button className="link-btn" onClick={() => handleToggle(u.id, u.isActive)}>
                      {u.isActive ? 'disable' : 'enable'}
                    </button>
                    <button className="link-btn" onClick={() => handleDelete(u.id)}>delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedStats && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>Stats for {selectedStats.url.shortCode}</h3>
          <p className="subtitle">{selectedStats.url.totalClicks} total clicks</p>

          <h4>Clicks by browser</h4>
          {selectedStats.browsers.length === 0 ? (
            <p>No clicks recorded yet.</p>
          ) : (
            <ul>
              {selectedStats.browsers.map((b, i) => (
                <li key={i}>{b.browser || 'Unknown'}: {b.count}</li>
              ))}
            </ul>
          )}

          <h4>Recent activity</h4>
          {selectedStats.recentClicks.length === 0 ? (
            <p>Nothing yet — share your link to start seeing activity here.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Browser</th><th>OS</th><th>Referrer</th><th>When</th></tr>
              </thead>
              <tbody>
                {selectedStats.recentClicks.map((c, i) => (
                  <tr key={i}>
                    <td>{c.browser || '—'}</td>
                    <td>{c.os || '—'}</td>
                    <td>{c.referrer || 'direct'}</td>
                    <td>{new Date(c.clicked_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

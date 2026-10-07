'use client';

import { useState } from 'react';
import { api, getToken } from '../lib/api';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const authed = Boolean(getToken());
      const data = await api.shorten({ url, customCode: customCode || undefined }, authed);
      setResult(data);
      setUrl('');
      setCustomCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Shorten a link</h1>
      <p className="subtitle">
        Paste a long URL below. Create a free account to track clicks and manage your links.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="https://example.com/your-really-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="custom-code (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten'}
            </button>
          </div>
        </form>

        {result && (
          <div className="result">
            <a href={result.shortUrl} target="_blank" rel="noreferrer">
              {result.shortUrl}
            </a>
            <button
              className="link-btn"
              onClick={() => navigator.clipboard.writeText(result.shortUrl)}
            >
              Copy
            </button>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}

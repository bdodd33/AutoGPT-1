import { useState, useEffect } from 'react';

interface FaviconProps {
  url?: string;
  fallback?: string;
  size?: number;
}

export default function Favicon({ url, fallback = '🔑', size = 32 }: FaviconProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!url) { setStatus('error'); return; }
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      if (!domain || domain.length < 3) { setStatus('error'); return; }
      setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
      setStatus('loading');
    } catch {
      setStatus('error');
    }
  }, [url]);

  if (status === 'error' || !url) {
    return (
      <div
        className="favicon-wrap"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      className="favicon-wrap"
      style={{ width: size, height: size }}
    >
      {status === 'loading' && (
        <div className="shimmer" style={{ width: size, height: size, borderRadius: 8 }} />
      )}
      <img
        src={src}
        alt=""
        style={{
          width: size * 0.65,
          height: size * 0.65,
          objectFit: 'contain',
          display: status === 'loaded' ? 'block' : 'none',
        }}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}

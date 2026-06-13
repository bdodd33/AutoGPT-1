import { useMemo } from 'react';
import { X, RefreshCw, AlertTriangle, Clock, Shield, Copy } from 'lucide-react';
import type { VaultEntry, Category } from '../types';
import Favicon from './Favicon';
import { measurePasswordStrength } from '../crypto';

interface HealthDashboardProps {
  entries: VaultEntry[];
  categories: Category[];
  onSelectEntry: (entry: VaultEntry) => void;
  onClose: () => void;
}

export default function HealthDashboard({ entries, categories, onSelectEntry, onClose }: HealthDashboardProps) {
  const active = useMemo(() => entries.filter((e) => !e.isArchived), [entries]);

  const analysis = useMemo(() => {
    const weak: VaultEntry[] = [];
    const reused: VaultEntry[] = [];
    const old: VaultEntry[] = [];
    const compromised: VaultEntry[] = [];
    const pwCounts = new Map<string, number>();

    for (const e of active) {
      if (e.password) {
        pwCounts.set(e.password, (pwCounts.get(e.password) || 0) + 1);
      }
    }

    const now = Date.now();
    for (const e of active) {
      if (!e.password) continue;
      if (measurePasswordStrength(e.password).score < 40) weak.push(e);
      if ((pwCounts.get(e.password) || 0) > 1) reused.push(e);
      const ref = e.passwordHistory[0]?.changedAt || e.updatedAt;
      if (ref && (now - new Date(ref).getTime()) > 90 * 86400000) old.push(e);
      if (e.isCompromised) compromised.push(e);
    }

    const totalIssues = weak.length + reused.length + compromised.length;
    const score = active.length === 0
      ? 100
      : Math.max(0, Math.round(100 - (totalIssues / active.length) * 100));

    return { weak, reused, old, compromised, score };
  }, [active]);

  const { score, weak, reused, old, compromised } = analysis;

  const scoreColor =
    score >= 80 ? 'var(--green)' :
    score >= 60 ? 'var(--amber)' :
    'var(--red)';

  const scoreLabel =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Fair' :
    'Needs Attention';

  const R = 44;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - score / 100);

  const cat = (e: VaultEntry) => categories.find((c) => c.id === e.category) || categories[0];

  const Section = ({ title, items, icon, color, desc }: {
    title: string; items: VaultEntry[]; icon: React.ReactNode; color: string; desc: string;
  }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ color }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>
              {title} <span style={{ color, fontWeight: 700 }}>{items.length}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{desc}</div>
          </div>
        </div>
        {items.map((e) => (
          <div
            key={e.id}
            className="entry-row"
            style={{ border: '1px solid var(--b1)', borderRadius: 'var(--radius-sm)', marginBottom: 6, cursor: 'pointer' }}
            onClick={() => { onSelectEntry(e); onClose(); }}
          >
            <Favicon url={e.url} fallback={cat(e).icon} size={28} />
            <div className="entry-row-info">
              <div className="entry-row-title">{e.title}</div>
              <div className="entry-row-sub">{e.username || e.email || e.url}</div>
            </div>
            <RefreshCw size={14} color="var(--t3)" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-bd" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <div className="modal-hd">
          <Shield size={20} color="var(--blue)" />
          <div style={{ flex: 1 }}>
            <div className="modal-hd-title">Vault Health</div>
            <div className="modal-hd-sub">{active.length} active entries</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Score ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={100} height={100} className="health-ring">
                <circle cx={50} cy={50} r={R} fill="none" stroke="var(--b2)" strokeWidth={8} />
                <circle
                  cx={50} cy={50} r={R}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4, lineHeight: 1.6 }}>
                {weak.length + reused.length + compromised.length === 0
                  ? 'Your vault looks great! Keep it up.'
                  : `${weak.length + reused.length + compromised.length} issue${weak.length + reused.length + compromised.length !== 1 ? 's' : ''} found. Click any entry to fix it.`}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="health-stat-cards">
            {[
              { label: 'Weak', count: weak.length, color: 'var(--red)' },
              { label: 'Reused', count: reused.length, color: 'var(--amber)' },
              { label: 'Compromised', count: compromised.length, color: 'var(--red)' },
              { label: 'Old (90d+)', count: old.length, color: 'var(--t3)' },
            ].map(({ label, count, color }) => (
              <div key={label} className="health-stat">
                <div className="health-stat-num" style={{ color: count > 0 ? color : 'var(--green)' }}>
                  {count}
                </div>
                <div className="health-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <Section
            title="Compromised — "
            items={compromised}
            icon={<AlertTriangle size={16} />}
            color="var(--red)"
            desc="Manually flagged as compromised — change immediately."
          />
          <Section
            title="Weak passwords — "
            items={weak}
            icon={<Shield size={16} />}
            color="var(--red)"
            desc="Strength score below 40. Consider using the password generator."
          />
          <Section
            title="Reused passwords — "
            items={reused}
            icon={<Copy size={16} />}
            color="var(--amber)"
            desc="Same password used on multiple sites."
          />
          <Section
            title="Old passwords — "
            items={old}
            icon={<Clock size={16} />}
            color="var(--t3)"
            desc="Not changed in 90+ days. Not counted against score."
          />

          {weak.length + reused.length + compromised.length + old.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">No issues found!</div>
              <div className="empty-state-desc">All your passwords are strong and unique.</div>
            </div>
          )}
        </div>

        <div className="modal-ft">
          <button className="pill-btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

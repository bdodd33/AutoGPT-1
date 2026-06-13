import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check, Zap } from 'lucide-react';
import { generatePassword, measurePasswordStrength } from '../crypto';
import type { PasswordOptions } from '../types';

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;
  inline?: boolean;
  defaultOptions?: Partial<PasswordOptions>;
}

const DEFAULT_OPTS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  pronounceable: false,
  passphrase: false,
  wordCount: 4,
};

export default function PasswordGenerator({ onUse, inline, defaultOptions }: PasswordGeneratorProps) {
  const [opts, setOpts] = useState<PasswordOptions>({ ...DEFAULT_OPTS, ...defaultOptions });
  const [mode, setMode] = useState<'random' | 'readable' | 'passphrase'>('random');
  const [password, setPassword] = useState(() =>
    generatePassword({ ...DEFAULT_OPTS, ...defaultOptions })
  );
  const [copied, setCopied] = useState(false);

  const getOpts = useCallback((m: typeof mode, o: PasswordOptions): PasswordOptions => ({
    ...o,
    pronounceable: m === 'readable',
    passphrase: m === 'passphrase',
  }), []);

  const refresh = useCallback((m = mode, o = opts) => {
    setPassword(generatePassword(getOpts(m, o)));
  }, [mode, opts, getOpts]);

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setPassword(generatePassword(getOpts(m, opts)));
  };

  const update = (patch: Partial<PasswordOptions>) => {
    const next = { ...opts, ...patch };
    setOpts(next);
    setPassword(generatePassword(getOpts(mode, next)));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const strength = measurePasswordStrength(password);

  return (
    <div style={{ padding: inline ? '0' : '0' }}>
      {/* Mode selector */}
      <div className="gen-modes">
        {(['random', 'readable', 'passphrase'] as const).map((m) => (
          <button
            key={m}
            className={`gen-mode-btn${mode === m ? ' active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {m === 'random' ? 'Random' : m === 'readable' ? 'Readable' : 'Passphrase'}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="gen-output">{password}</div>

      {/* Strength */}
      {mode !== 'passphrase' && (
        <div style={{ marginBottom: 14 }}>
          <div className="str-info">
            <span className="str-label" style={{ color: strength.color }}>{strength.label}</span>
            <span className="str-length">{password.length} chars</span>
          </div>
          <div className="str-track">
            <div className="str-fill" style={{ width: `${strength.score}%`, background: strength.color }} />
          </div>
        </div>
      )}

      {/* Options */}
      {mode === 'random' && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div className="field-label">Length: {opts.length}</div>
            <input
              type="range" min={8} max={64} value={opts.length}
              className="range-input" style={{ width: '100%' }}
              onChange={(e) => update({ length: Number(e.target.value) })}
            />
          </div>
          <div className="gen-option-grid">
            {[
              { key: 'uppercase', label: 'Uppercase A–Z' },
              { key: 'lowercase', label: 'Lowercase a–z' },
              { key: 'numbers', label: 'Numbers 0–9' },
              { key: 'symbols', label: 'Symbols !@#…' },
              { key: 'excludeAmbiguous', label: 'No ambiguous' },
            ].map(({ key, label }) => (
              <label key={key} className="gen-option">
                <input
                  type="checkbox"
                  checked={opts[key as keyof PasswordOptions] as boolean}
                  onChange={(e) => update({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </>
      )}

      {mode === 'readable' && (
        <div style={{ marginBottom: 14 }}>
          <div className="field-label">Length: {opts.length}</div>
          <input
            type="range" min={8} max={32} value={opts.length}
            className="range-input" style={{ width: '100%' }}
            onChange={(e) => update({ length: Number(e.target.value) })}
          />
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>
            Consonant/vowel pattern — easier to remember, ends with digit + symbol.
          </p>
        </div>
      )}

      {mode === 'passphrase' && (
        <div style={{ marginBottom: 14 }}>
          <div className="field-label">Word count: {opts.wordCount}</div>
          <input
            type="range" min={2} max={8} value={opts.wordCount}
            className="range-input" style={{ width: '100%' }}
            onChange={(e) => update({ wordCount: Number(e.target.value) })}
          />
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>
            Random words joined by hyphens — highly memorable.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pill-btn secondary" style={{ flex: 1 }} onClick={() => refresh()}>
          <RefreshCw size={14} /> Regenerate
        </button>
        <button className="pill-btn secondary" onClick={copy}>
          {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        {onUse && (
          <button className="pill-btn primary" onClick={() => onUse(password)}>
            <Zap size={14} /> Use
          </button>
        )}
      </div>
    </div>
  );
}

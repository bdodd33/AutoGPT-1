import { useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { measurePasswordStrength } from '../crypto';

interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: (password: string, hint: string, decoy?: string) => Promise<void>;
  isFirstTime: boolean;
  isLoading: boolean;
  fails: number;
  lockout: number | null;
  masterHint: string;
}

export default function LockScreen({
  onUnlock, onSetup, isFirstTime, isLoading, fails, lockout, masterHint,
}: LockScreenProps) {
  // Unlock state
  const [unlockPw, setUnlockPw] = useState('');
  const [showUnlockPw, setShowUnlockPw] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Setup: completely isolated state per step
  const [step, setStep] = useState(1);
  const [s1pw, setS1pw] = useState('');
  const [s1conf, setS1conf] = useState('');
  const [s1showPw, setS1showPw] = useState(false);
  const [s1showConf, setS1showConf] = useState(false);
  const [s2hint, setS2hint] = useState('');
  const [s3decoy, setS3decoy] = useState('');
  const [s3decoyConf, setS3decoyConf] = useState('');
  const [s3showDecoy, setS3showDecoy] = useState(false);
  const [setupError, setSetupError] = useState('');

  const strength = measurePasswordStrength(s1pw);

  const handleUnlock = async () => {
    setUnlockError('');
    const ok = await onUnlock(unlockPw);
    if (!ok) {
      setUnlockError('Incorrect password. Please try again.');
      setUnlockPw('');
    }
  };

  const handleStep1Next = () => {
    setSetupError('');
    if (s1pw.length < 8) { setSetupError('Password must be at least 8 characters.'); return; }
    if (s1pw !== s1conf) { setSetupError('Passwords do not match.'); return; }
    setStep(2);
  };

  const handleStep3Finish = async () => {
    setSetupError('');
    if (s3decoy && s3decoy !== s3decoyConf) {
      setSetupError('Decoy passwords do not match.');
      return;
    }
    if (s3decoy && s3decoy === s1pw) {
      setSetupError('Decoy password must differ from your master password.');
      return;
    }
    await onSetup(s1pw, s2hint, s3decoy || undefined);
  };

  const isLocked = lockout && Date.now() < lockout;
  const lockSeconds = lockout ? Math.ceil((lockout - Date.now()) / 1000) : 0;

  if (isFirstTime) {
    return (
      <div className="lock-bg">
        <div className="lock-card" style={{ maxWidth: 420 }}>
          <div className="lock-logo">
            <span className="lock-logo-icon">🔐</span>
            <div className="lock-logo-title">VaultX</div>
            <div className="lock-logo-sub">Your encrypted password vault</div>
          </div>

          {/* Step dots */}
          <div className="step-dots">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`step-dot ${s < step ? 'done' : s === step ? 'active' : 'idle'}`}
              />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="fade-up">
              <div className="step-title">Create Master Password</div>
              <div className="step-desc">
                This password encrypts your vault. If you lose it, your data cannot be recovered.
              </div>

              <div className="lock-input-wrap">
                <input
                  type={s1showPw ? 'text' : 'password'}
                  className="lock-input"
                  placeholder="Master password"
                  value={s1pw}
                  onChange={(e) => setS1pw(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && s1conf && handleStep1Next()}
                />
                <button className="lock-input-action" onClick={() => setS1showPw(!s1showPw)}>
                  {s1showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {s1pw && (
                <div style={{ marginBottom: 12 }}>
                  <div className="str-info">
                    <span className="str-label" style={{ color: strength.color }}>{strength.label}</span>
                    <span className="str-length">{s1pw.length} chars</span>
                  </div>
                  <div className="str-track">
                    <div className="str-fill" style={{ width: `${strength.score}%`, background: strength.color }} />
                  </div>
                  {strength.suggestions.length > 0 && (
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 6 }}>
                      {strength.suggestions[0]}
                    </div>
                  )}
                </div>
              )}

              <div className="lock-input-wrap">
                <input
                  type={s1showConf ? 'text' : 'password'}
                  className="lock-input"
                  placeholder="Confirm password"
                  value={s1conf}
                  onChange={(e) => setS1conf(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStep1Next()}
                />
                <button className="lock-input-action" onClick={() => setS1showConf(!s1showConf)}>
                  {s1showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {setupError && (
                <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{setupError}</p>
              )}

              <button className="lock-btn" onClick={handleStep1Next}>
                Continue <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="fade-up">
              <div className="step-title">Password Hint</div>
              <div className="step-desc">
                Optional — helps you remember your password. Stored inside the encrypted vault,
                not visible until you click "Show hint" on the lock screen.
              </div>

              <div className="lock-input-wrap">
                <input
                  type="text"
                  className="lock-input lock-input-text"
                  placeholder="e.g. My first pet + birth year"
                  value={s2hint}
                  onChange={(e) => setS2hint(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && setStep(3)}
                  maxLength={120}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 20, marginTop: -4 }}>
                Do NOT write your actual password here.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="lock-btn" style={{ background: 'var(--s5)', color: 'var(--t2)', flex: '0 0 auto', width: 'auto', padding: '0 20px', boxShadow: 'none' }} onClick={() => setStep(1)}>
                  <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back
                </button>
                <button className="lock-btn" style={{ flex: 1 }} onClick={() => setStep(3)}>
                  {s2hint ? 'Continue' : 'Skip'} <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="fade-up">
              <div className="step-title">Decoy Vault</div>
              <div className="step-desc">
                Optional — a different password that opens an empty vault. Use if you're ever
                forced to reveal your password under duress.
              </div>

              <div className="lock-input-wrap">
                <input
                  type={s3showDecoy ? 'text' : 'password'}
                  className="lock-input"
                  placeholder="Decoy password (optional)"
                  value={s3decoy}
                  onChange={(e) => setS3decoy(e.target.value)}
                  autoFocus
                />
                <button className="lock-input-action" onClick={() => setS3showDecoy(!s3showDecoy)}>
                  {s3showDecoy ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {s3decoy && (
                <div className="lock-input-wrap">
                  <input
                    type={s3showDecoy ? 'text' : 'password'}
                    className="lock-input"
                    placeholder="Confirm decoy password"
                    value={s3decoyConf}
                    onChange={(e) => setS3decoyConf(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep3Finish()}
                  />
                </div>
              )}

              {setupError && (
                <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{setupError}</p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="lock-btn" style={{ background: 'var(--s5)', color: 'var(--t2)', flex: '0 0 auto', width: 'auto', padding: '0 20px', boxShadow: 'none' }} onClick={() => setStep(2)}>
                  <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back
                </button>
                <button
                  className="lock-btn"
                  style={{ flex: 1 }}
                  onClick={handleStep3Finish}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="vault-spinner" style={{ width: 20, height: 20, borderWidth: 2, display: 'inline-block' }} />
                  ) : (
                    <><ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Create Vault</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unlock screen
  return (
    <div className="lock-bg">
      <div className="lock-card">
        <div className="lock-logo">
          {isLoading ? (
            <div className="vault-spinner" style={{ margin: '0 auto 12px' }} />
          ) : (
            <span className="lock-logo-icon">🔐</span>
          )}
          <div className="lock-logo-title">VaultX</div>
          <div className="lock-logo-sub">
            {isLoading ? 'Decrypting vault…' : 'Enter your master password'}
          </div>
        </div>

        {isLocked ? (
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <p style={{ color: 'var(--red)', fontSize: 14, marginBottom: 8 }}>
              Account locked due to failed attempts.
            </p>
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>
              Try again in {lockSeconds}s
            </p>
          </div>
        ) : (
          <>
            <div className="lock-input-wrap">
              <input
                type={showUnlockPw ? 'text' : 'password'}
                className="lock-input"
                placeholder="Master password"
                value={unlockPw}
                onChange={(e) => { setUnlockPw(e.target.value); setUnlockError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleUnlock()}
                autoFocus
                disabled={isLoading}
              />
              <button className="lock-input-action" onClick={() => setShowUnlockPw(!showUnlockPw)}>
                {showUnlockPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {unlockError && (
              <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{unlockError}</p>
            )}

            {fails >= 3 && (
              <p style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 10 }}>
                {5 - fails} attempt{5 - fails !== 1 ? 's' : ''} remaining before lockout.
              </p>
            )}

            <button
              className="lock-btn"
              onClick={handleUnlock}
              disabled={isLoading || !unlockPw}
            >
              {isLoading ? (
                <span className="vault-spinner" style={{ width: 20, height: 20, borderWidth: 2, display: 'inline-block' }} />
              ) : 'Unlock Vault'}
            </button>

            {masterHint && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {showHint ? (
                  <p style={{ fontSize: 13, color: 'var(--t2)', background: 'var(--s4)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--b2)' }}>
                    💡 {masterHint}
                  </p>
                ) : (
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setShowHint(true)}
                  >
                    Show hint
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

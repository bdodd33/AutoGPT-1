import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { useVault } from './store';
import LockScreen from './components/LockScreen';
import App from './App';

function Root() {
  const v = useVault();

  if (v.mode === 'locked' || v.mode === 'setup') {
    return (
      <LockScreen
        onUnlock={v.unlock}
        onSetup={v.setupVault}
        isFirstTime={v.isFirst}
        isLoading={v.loading}
        fails={v.fails}
        lockout={v.lockout}
        masterHint={v.vault.settings.masterHint}
      />
    );
  }

  return (
    <App
      vault={v.vault}
      onAddEntry={v.addEntry}
      onUpdateEntry={v.updateEntry}
      onDeleteEntry={v.deleteEntry}
      onTouchEntry={v.touchEntry}
      onUpdateSettings={v.updateSettings}
      onExportVault={v.exportVault}
      onImportVault={v.importVault}
      onExportCSV={v.exportCSV}
      onImportCSV={v.importCSV}
      onLock={v.lock}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

import type { CSSProperties } from 'react';
import { navBack, navForward } from './navStore';
import { useNavState } from './useNavState';

const btn: CSSProperties = {
  background: 'rgba(30, 36, 42, 0.92)',
  color: '#e8e4d4',
  border: '1px solid #6a7278',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
};

export function NavHistoryButtons() {
  const { historyIndex, history } = useNavState();
  return (
    <>
      <button
        type="button"
        style={{ ...btn, opacity: historyIndex <= 0 ? 0.45 : 1 }}
        disabled={historyIndex <= 0}
        onClick={() => navBack()}
      >
        ← Back
      </button>
      <button
        type="button"
        style={{ ...btn, opacity: historyIndex >= history.length - 1 ? 0.45 : 1 }}
        disabled={historyIndex >= history.length - 1}
        onClick={() => navForward()}
      >
        Forward →
      </button>
    </>
  );
}

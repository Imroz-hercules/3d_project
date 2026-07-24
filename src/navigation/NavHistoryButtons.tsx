import { navBack, navForward } from './navStore';
import { useNavState } from './useNavState';

export function NavHistoryButtons() {
  const { historyIndex, history } = useNavState();
  return (
    <>
      <button
        type="button"
        className="stwin-btn"
        disabled={historyIndex <= 0}
        onClick={() => navBack()}
      >
        ← Back
      </button>
      <button
        type="button"
        className="stwin-btn"
        disabled={historyIndex >= history.length - 1}
        onClick={() => navForward()}
      >
        Forward →
      </button>
    </>
  );
}

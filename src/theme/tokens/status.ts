/**
 * Semantic status colors — identical in Night and Day.
 * Operators build muscle memory around these; never theme them.
 */
export const STATUS = Object.freeze({
  running: '#43C7A0',
  alarm: '#E5544B',
  warning: '#F2B45B',
  amber: '#F0A64E',
  ai: '#35C0D6',
  energy: '#A995F7',
  done: '#43C7A0',
  stopped: '#5C6B7A',
  alertPin: '#FF5C68',
});

export type StatusColors = typeof STATUS;

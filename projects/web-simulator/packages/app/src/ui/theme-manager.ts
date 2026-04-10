// ── 테마 관리 (라이트/다크) ───────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
  }
}

/** 저장된 설정 또는 시스템 기본값으로 테마 초기화 */
export function initTheme(): void {
  const saved = localStorage.getItem('sim-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  // 초기 버튼 아이콘 반영
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';

  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
}

/** 다크 ↔ 라이트 테마 토글 */
export function toggleTheme(): void {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') ?? 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sim-theme', next);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
  // Monaco 테마 동기화
  if (window.monaco) {
    window.monaco.editor.setTheme(next === 'dark' ? 'vs-dark' : 'vs');
  }
}

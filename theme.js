(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem('worlds-theme'); } catch {}
  if (preference !== 'light' && preference !== 'dark') preference = null;

  function applyTheme() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#121212' : '#f2f0e9';
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  }

  applyTheme();
  system.addEventListener('change', () => { if (!preference) applyTheme(); });
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      button.addEventListener('click', () => {
        preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('worlds-theme', preference); } catch {}
        applyTheme();
      });
    }
  });
})();

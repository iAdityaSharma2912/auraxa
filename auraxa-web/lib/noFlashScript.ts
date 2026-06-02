// ── No-flash theme script ─────────────────────────────────
// Inline this in <head> via layout.tsx to apply theme before paint,
// preventing a flash of the wrong theme on load.

export const noFlashScript = `
(function() {
  try {
    var themes = {
      cosmic: {
        light: { bg:'#f6f4ff',bg2:'#ece8fb',surface:'#ffffff',surfaceAlt:'#f3f0fc',text:'#1a1335',muted:'#6b6390',line:'rgba(124,58,237,.14)',primary:'#7c3aed',secondary:'#d4af37',accent:'#e879f9' },
        dark:  { bg:'#030309',bg2:'#0a0a22',surface:'#10102e',surfaceAlt:'#16163a',text:'#f4f2ff',muted:'#9b93c0',line:'rgba(124,58,237,.20)',primary:'#a78bfa',secondary:'#d4af37',accent:'#e879f9' },
        radius:{base:'16px',small:'10px',large:'24px'},
        fonts:{display:'Cinzel',body:'Plus Jakarta Sans',mono:'JetBrains Mono'}
      },
      tesla: {
        light: { bg:'#ffffff',bg2:'#f4f4f4',surface:'#fafafa',surfaceAlt:'#efefef',text:'#171a20',muted:'#5c5e62',line:'rgba(0,0,0,.10)',primary:'#171a20',secondary:'#3457d5',accent:'#cc0000' },
        dark:  { bg:'#0d0e10',bg2:'#16181b',surface:'#1a1c1f',surfaceAlt:'#212327',text:'#f4f4f5',muted:'#9ca0a6',line:'rgba(255,255,255,.10)',primary:'#ffffff',secondary:'#5b7cf0',accent:'#ff4d4d' },
        radius:{base:'5px',small:'4px',large:'8px'},
        fonts:{display:'Montserrat',body:'Inter',mono:'JetBrains Mono'}
      },
      roam: {
        light: { bg:'#f4fbfb',bg2:'#e6f4f5',surface:'#ffffff',surfaceAlt:'#eef8f8',text:'#0f2a30',muted:'#5a7d83',line:'rgba(14,165,180,.16)',primary:'#0ea5b4',secondary:'#ff8a5b',accent:'#1f7ae0' },
        dark:  { bg:'#071417',bg2:'#0a1c20',surface:'#0e2429',surfaceAlt:'#123036',text:'#e8f6f7',muted:'#7da8af',line:'rgba(14,165,180,.22)',primary:'#14c4d6',secondary:'#ff9d72',accent:'#3b92f0' },
        radius:{base:'18px',small:'12px',large:'24px'},
        fonts:{display:'Montserrat',body:'Inter',mono:'JetBrains Mono'}
      }
    };
    var themeId = localStorage.getItem('auraxa-theme') || 'cosmic';
    var mode    = localStorage.getItem('auraxa-mode')  || 'dark';
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var theme = themes[themeId] || themes.cosmic;
    var c = theme[mode] || theme.dark;
    var root = document.documentElement;
    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--bg-2', c.bg2);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-alt', c.surfaceAlt);
    root.style.setProperty('--text', c.text);
    root.style.setProperty('--muted', c.muted);
    root.style.setProperty('--line', c.line);
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--secondary', c.secondary);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--radius', theme.radius.base);
    root.style.setProperty('--radius-sm', theme.radius.small);
    root.style.setProperty('--radius-lg', theme.radius.large);
    root.style.setProperty('--font-display', "'" + theme.fonts.display + "', sans-serif");
    root.style.setProperty('--font-body', "'" + theme.fonts.body + "', sans-serif");
    root.style.setProperty('--font-mono', "'" + theme.fonts.mono + "', monospace");
    root.setAttribute('data-theme', themeId);
    root.setAttribute('data-mode', mode);
    if (mode === 'dark') root.classList.add('dark');
  } catch (e) {}
})();
`;

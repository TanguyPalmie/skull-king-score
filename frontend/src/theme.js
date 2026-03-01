import { createTheme } from '@mui/material/styles';

// ═══════════════════════════════════════════════════════════════════════
//  Utilitaires couleur (evite d'importer une lib externe)
// ═══════════════════════════════════════════════════════════════════════
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function alpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ═══════════════════════════════════════════════════════════════════════
//  Fabrique de theme
// ═══════════════════════════════════════════════════════════════════════
export function createGameTheme({
  primary = '#a99786',
  secondary = '#6b8fa3',
  background = '#1b1b2f',
  paper = '#1f1f38',
  navBg = '#14142b',
  titleFont = '"Fredoka", "Nunito", "Segoe UI", sans-serif',
  bodyFont = '"Nunito", "Segoe UI", Roboto, sans-serif',
} = {}) {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: { main: primary, contrastText: '#fff' },
      secondary: { main: secondary, contrastText: '#ffffff' },
      background: { default: background, paper },
      text: { primary: '#f0f0f0', secondary: '#a0a8b8' },
      error: { main: '#e74c3c' },
      success: { main: '#2ecc71' },
      warning: { main: '#f39c12' },
    },
    typography: {
      fontFamily: bodyFont,
      h1: { fontWeight: 700, fontSize: '2rem', fontFamily: titleFont },
      h2: { fontWeight: 700, fontSize: '1.6rem', fontFamily: titleFont },
      h3: { fontWeight: 600, fontSize: '1.3rem', fontFamily: titleFont },
      h4: { fontWeight: 600, fontSize: '1.15rem', fontFamily: titleFont },
      h5: { fontWeight: 600, fontSize: '1.05rem', fontFamily: titleFont },
      h6: { fontWeight: 600, fontSize: '1rem', fontFamily: titleFont },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.9rem', lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.25s ease',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primary} 0%, ${darken(primary, 0.15)} 100%)`,
            boxShadow: `0 4px 12px ${alpha(primary, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${lighten(primary, 0.1)} 0%, ${primary} 100%)`,
              boxShadow: `0 6px 16px ${alpha(primary, 0.4)}`,
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${secondary} 0%, ${darken(secondary, 0.2)} 100%)`,
            boxShadow: `0 4px 12px ${alpha(secondary, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${lighten(secondary, 0.1)} 0%, ${secondary} 100%)`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(primary, 0.15)}`,
            backgroundImage: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { backgroundColor: navBg, borderTop: `2px solid ${alpha(primary, 0.5)}` },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: { color: '#7a8599', '&.Mui-selected': { color: primary } },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: alpha(primary, 0.25) },
              '&:hover fieldset': { borderColor: alpha(primary, 0.5) },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: paper,
            border: `1px solid ${alpha(primary, 0.3)}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  Theme par defaut : Jeu de societe — convivial, chaleureux
//  Beige sombre + bleu ardoise, fond sombre mais pas austere
// ═══════════════════════════════════════════════════════════════════════
const defaultTheme = createGameTheme();

export default defaultTheme;

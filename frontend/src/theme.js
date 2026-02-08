import { createTheme } from '@mui/material/styles';

const pirateTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d4af37', contrastText: '#1a1a2e' },
    secondary: { main: '#c0392b', contrastText: '#ffffff' },
    background: { default: '#1a1a2e', paper: '#16213e' },
    text: { primary: '#eaeaea', secondary: '#d4af37' },
    error: { main: '#e74c3c' },
    success: { main: '#2ecc71' },
    warning: { main: '#f39c12' },
  },
  typography: {
    fontFamily: '"Georgia", "Times New Roman", serif',
    h1: { fontWeight: 700, fontSize: '2rem' },
    h2: { fontWeight: 700, fontSize: '1.6rem' },
    h3: { fontWeight: 600, fontSize: '1.3rem' },
    h4: { fontWeight: 600, fontSize: '1.15rem' },
    h5: { fontWeight: 600, fontSize: '1.05rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '10px 20px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
          color: '#1a1a2e',
          '&:hover': { background: 'linear-gradient(135deg, #e6c347 0%, #d4af37 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid rgba(212, 175, 55, 0.2)', backgroundImage: 'none' },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: '#0f3460', borderTop: '2px solid #d4af37' },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: '#8899aa', '&.Mui-selected': { color: '#d4af37' } },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.3)' },
            '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.6)' },
          },
        },
      },
    },
  },
});

export default pirateTheme;

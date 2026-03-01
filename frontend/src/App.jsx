import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation.jsx';
import ProfilesPage from './pages/ProfilesPage.jsx';
import GameSelectPage from './pages/GameSelectPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import LiveGamePage from './pages/LiveGamePage.jsx';
import ScoresIndexPage from './pages/ScoresIndexPage.jsx';
import NewGamePage from './pages/NewGamePage.jsx';
import { getGameById } from './games/registry.jsx';
import { getSelectedProfiles, getProfiles } from './storage/profileStorage.js';
import { GameProvider, useGameContext } from './contexts/GameContext.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { useEffect } from 'react';

function GameThemeSync() {
  const location = useLocation();
  const { setActiveGame, clearActiveGame } = useGameContext();

  useEffect(() => {
    const match = location.pathname.match(/^\/(game|scores)\/([^/]+)/);
    if (match) {
      setActiveGame(match[2]);
    } else {
      clearActiveGame();
    }
  }, [location.pathname, setActiveGame, clearActiveGame]);

  return null;
}

function GameRoute() {
  const { gameId } = useParams();
  const location = useLocation();
  const game = getGameById(gameId);
  if (!game) return <Box sx={{ p: 4, textAlign: 'center' }}>Jeu introuvable.</Box>;

  const isNew = location.state?.newGame === true;
  const selectedIds = getSelectedProfiles();
  const allProfiles = getProfiles();
  const players = allProfiles.filter((p) => selectedIds.includes(p.id));

  const GameComponent = game.component;
  return <GameComponent players={players} isNew={isNew} />;
}

function ScoresRoute() {
  const { gameId } = useParams();
  const game = getGameById(gameId);
  if (!game) return <Box sx={{ p: 4, textAlign: 'center' }}>Jeu introuvable.</Box>;
  const ScoresComponent = game.scoresComponent;
  return <ScoresComponent />;
}

/** Protege les routes : redirige vers /login si non connecte */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Redirige vers / si deja connecte (pour login/register) */
function GuestOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <GameThemeSync />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '80px' }}>
        <Routes>
          {/* Routes publiques (guests) */}
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

          {/* Routes protegees */}
          <Route path="/" element={<RequireAuth><ProfilesPage /></RequireAuth>} />
          <Route path="/games" element={<RequireAuth><GameSelectPage /></RequireAuth>} />
          <Route path="/games/new" element={<RequireAuth><NewGamePage /></RequireAuth>} />
          <Route path="/game/:gameId" element={<RequireAuth><GameRoute /></RequireAuth>} />
          <Route path="/scores" element={<RequireAuth><ScoresIndexPage /></RequireAuth>} />
          <Route path="/scores/:gameId" element={<RequireAuth><ScoresRoute /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
          <Route path="/live" element={<RequireAuth><LiveGamePage /></RequireAuth>} />
          <Route path="/live/:code" element={<RequireAuth><LiveGamePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
        </Routes>
      </Box>
      <AuthAwareNavigation />
    </>
  );
}

/** N'affiche la nav que si l'utilisateur est connecte */
function AuthAwareNavigation() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return <Navigation />;
}

function ThemedApp() {
  const { theme } = useGameContext();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <ThemedApp />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

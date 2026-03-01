import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GameIcon,
  EmojiEvents as ScoresIcon,
  GroupAdd as FriendsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const tabs = [
    { label: 'Joueurs', path: '/', icon: <PeopleIcon /> },
    { label: 'Jeux', path: '/games', icon: <GameIcon /> },
    { label: 'Scores', path: '/scores', icon: <ScoresIcon /> },
    { label: 'Amis', path: '/friends', icon: <FriendsIcon /> },
    { label: 'Reglages', path: '/settings', icon: <SettingsIcon /> },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: <AdminIcon /> }] : []),
  ];

  let currentIndex = tabs.findIndex((t) => t.path === location.pathname);
  if (currentIndex < 0) {
    if (location.pathname.startsWith('/game/')) currentIndex = 1;
    else if (location.pathname.startsWith('/scores/')) currentIndex = 2;
    else if (location.pathname === '/friends') currentIndex = tabs.findIndex((t) => t.path === '/friends');
    else if (location.pathname.startsWith('/admin')) currentIndex = tabs.findIndex((t) => t.path === '/admin');
  }

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={8}>
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newValue) => navigate(tabs[newValue].path)}
        showLabels
        sx={{
          height: { xs: 64, sm: 72 },
          '& .MuiBottomNavigationAction-label': { fontSize: { xs: '0.6rem', sm: '0.75rem' } },
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  SportsEsports as GameIcon,
  EmojiEvents as ScoresIcon,
  MenuBook as RulesIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const e = React.createElement;

const tabs = [
  { label: 'Accueil', path: '/', icon: HomeIcon },
  { label: 'Partie', path: '/game', icon: GameIcon },
  { label: 'Scores', path: '/scores', icon: ScoresIcon },
  { label: 'Règles', path: '/rules', icon: RulesIcon },
  { label: 'Paramètres', path: '/settings', icon: SettingsIcon },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = tabs.findIndex((t) => t.path === location.pathname);

  return e(
    Paper,
    {
      sx: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 },
      elevation: 8,
    },
    e(
      BottomNavigation,
      {
        value: currentIndex >= 0 ? currentIndex : 0,
        onChange: (_: unknown, newValue: number) => {
          navigate(tabs[newValue].path);
        },
        showLabels: true,
        sx: {
          height: { xs: 64, sm: 72 },
          '& .MuiBottomNavigationAction-label': {
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
          },
        },
      },
      ...tabs.map((tab) =>
        e(BottomNavigationAction, {
          key: tab.path,
          label: tab.label,
          icon: e(tab.icon, null),
        })
      )
    )
  );
}

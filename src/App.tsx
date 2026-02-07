import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import pirateTheme from './theme';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ScoresPage from './pages/ScoresPage';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';

const e = React.createElement;

export default function App() {
  return e(
    ThemeProvider,
    { theme: pirateTheme },
    e(CssBaseline, null),
    e(
      BrowserRouter,
      null,
      e(
        Box,
        { sx: { minHeight: '100vh', bgcolor: 'background.default', pb: '80px' } },
        e(
          Routes,
          null,
          e(Route, { path: '/', element: e(HomePage, null) }),
          e(Route, { path: '/game', element: e(GamePage, null) }),
          e(Route, { path: '/scores', element: e(ScoresPage, null) }),
          e(Route, { path: '/rules', element: e(RulesPage, null) }),
          e(Route, { path: '/settings', element: e(SettingsPage, null) })
        )
      ),
      e(Navigation, null)
    )
  );
}

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import ChatBot from '../components/ChatBot';

const e = React.createElement;

function RulesContent() {
  return e(
    Box,
    { sx: { pb: 2 } },

    // Overview
    e(Typography, { variant: 'h5', color: 'primary.main', gutterBottom: true }, 'Règles de Skull King'),
    e(
      Typography,
      { variant: 'body1', sx: { mb: 2 } },
      "Skull King est un jeu de plis (tricks) avec un thème pirate. Le but est de prédire exactement le nombre de plis que vous allez gagner à chaque manche."
    ),

    // Player count
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, 'Joueurs'),
        e(Typography, { variant: 'body2' }, 'De 2 à 12 joueurs (meilleur à 4-5 joueurs). À chaque manche R, chaque joueur reçoit R cartes.')
      )
    ),

    // Card hierarchy
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, 'Hiérarchie des Cartes'),
        e(
          'ol',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Skull King'), ' — bat tout sauf la Sirène'),
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Sirène (Mermaid)'), ' — bat le Skull King, perd contre les Pirates'),
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Pirates'), ' — battent les cartes numérotées et les Sirènes'),
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Cartes numérotées'), " — la couleur d'atout (noir ☠️) bat les autres"),
          e('li', null, e('strong', null, 'Escape (Fugitif)'), ' — perd toujours')
        ),
        e(
          Typography,
          { variant: 'body2', sx: { mt: 1, fontStyle: 'italic' } },
          "En cas d'égalité de rang, la première carte jouée l'emporte."
        )
      )
    ),

    // Scoring
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, 'Calcul des Scores'),
        e(Typography, { variant: 'subtitle2', color: 'text.secondary', sx: { mb: 1 } }, "R = numéro de la manche"),

        e(Typography, { variant: 'body2', fontWeight: 600, sx: { mt: 1 } }, 'Annonce réussie (plis = annonce) :'),
        e(
          'ul',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 4 } }, 'Annonce > 0 : +20 × annonce'),
          e('li', null, 'Annonce = 0 : +10 × R')
        ),

        e(Typography, { variant: 'body2', fontWeight: 600, sx: { mt: 1.5 } }, 'Annonce ratée (plis ≠ annonce) :'),
        e(
          'ul',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 4 } }, 'Annonce > 0 : -10 × |plis - annonce|'),
          e('li', null, 'Annonce = 0 : -10 × R')
        )
      )
    ),

    // Bonuses
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, 'Bonus'),
        e(
          Typography,
          { variant: 'body2', sx: { mb: 1 } },
          "Les bonus s'appliquent toujours, même si l'annonce est ratée."
        ),
        e(
          'ul',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Skull King capture des Pirates'), ' : +30 points par Pirate capturé'),
          e('li', null, e('strong', null, 'Sirène bat le Skull King'), ' : +50 points')
        )
      )
    ),

    // Special cards
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, 'Cartes Spéciales (Extensions)'),

        e(Typography, { variant: 'body2', fontWeight: 600, sx: { mt: 1 } }, 'Baleine Blanche (White Whale)'),
        e(
          Typography,
          { variant: 'body2', sx: { mb: 1.5 } },
          "Annule le pli en cours : personne ne le remporte. Les cartes sont retirées et le meneur recommence. Pas d'impact direct sur le score."
        ),

        e(Typography, { variant: 'body2', fontWeight: 600 }, 'Escape (Fugitif)'),
        e(
          Typography,
          { variant: 'body2', sx: { mb: 1.5 } },
          "Perd toujours. Si tous les joueurs jouent un Escape, le premier Escape joué remporte le pli."
        ),

        e(Typography, { variant: 'body2', fontWeight: 600 }, 'Cartes Butin (Loot) — Optionnel'),
        e(
          Typography,
          { variant: 'body2' },
          "Extension optionnelle activable dans les Paramètres. Valeurs : +20, +30 ou -10 points. Les points de butin s'ajoutent au score du round."
        )
      )
    ),

    // Game flow
    e(
      Card,
      null,
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'primary.main', gutterBottom: true }, "Déroulement d'une Manche"),
        e(
          'ol',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Distribution'), ' : au round R, chaque joueur reçoit R cartes.'),
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Annonces'), " : chaque joueur annonce le nombre de plis qu'il pense gagner (0 à R)."),
          e('li', { style: { marginBottom: 8 } }, e('strong', null, 'Jeu'), ' : les joueurs jouent leurs cartes tour par tour.'),
          e('li', null, e('strong', null, 'Décompte'), " : l'application calcule automatiquement les scores.")
        ),
        e(
          Typography,
          { variant: 'body2', sx: { mt: 1.5, fontStyle: 'italic' } },
          'Le jeu se joue en 10 manches par défaut (modifiable dans les Paramètres).'
        )
      )
    )
  );
}

export default function RulesPage() {
  const [tab, setTab] = useState(0);

  return e(
    Container,
    { maxWidth: 'sm', sx: { py: 2, pb: 10 } },
    e(
      Tabs,
      {
        value: tab,
        onChange: (_: unknown, val: number) => setTab(val),
        variant: 'fullWidth',
        sx: {
          mb: 2,
          '& .MuiTab-root': { fontWeight: 600 },
          '& .Mui-selected': { color: 'primary.main' },
        },
      },
      e(Tab, { label: 'Règles' }),
      e(Tab, { label: 'Assistant' })
    ),
    tab === 0 ? e(RulesContent, null) : e(ChatBot, null)
  );
}

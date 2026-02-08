import { useState } from 'react';
import { Box, Typography, Container, Card, CardContent, Tabs, Tab } from '@mui/material';
import ChatBot from '../components/ChatBot.jsx';

function RulesContent() {
  return (
    <Box sx={{ pb: 2 }}>
      <Typography variant="h5" color="primary.main" gutterBottom>Règles de Skull King</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Skull King est un jeu de plis avec un thème pirate. Le but est de prédire exactement le nombre de plis que vous allez gagner à chaque manche.
      </Typography>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Joueurs</Typography>
        <Typography variant="body2">De 2 à 12 joueurs. À chaque manche R, chaque joueur reçoit R cartes.</Typography>
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Hiérarchie des Cartes</Typography>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}><strong>Skull King</strong> — bat tout sauf la Sirène</li>
          <li style={{ marginBottom: 8 }}><strong>Sirène (Mermaid)</strong> — bat le Skull King, perd contre les Pirates</li>
          <li style={{ marginBottom: 8 }}><strong>Pirates</strong> — battent les cartes numérotées et les Sirènes</li>
          <li style={{ marginBottom: 8 }}><strong>Cartes numérotées</strong> — la couleur d'atout (noir ☠️) bat les autres</li>
          <li><strong>Escape (Fugitif)</strong> — perd toujours</li>
        </ol>
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Calcul des Scores</Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>R = numéro de la manche</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Annonce réussie :</Typography>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Annonce &gt; 0 : +20 × annonce</li>
          <li>Annonce = 0 : +10 × R</li>
        </ul>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 1.5 }}>Annonce ratée :</Typography>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Annonce &gt; 0 : -10 × |plis - annonce|</li>
          <li>Annonce = 0 : -10 × R</li>
        </ul>
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Bonus</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Les bonus s'appliquent toujours, même si l'annonce est ratée.</Typography>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}><strong>Skull King capture des Pirates</strong> : +30 par Pirate capturé</li>
          <li><strong>Sirène bat le Skull King</strong> : +50 points</li>
        </ul>
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Cartes Spéciales (Extensions)</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Baleine Blanche (White Whale)</Typography>
        <Typography variant="body2" sx={{ mb: 1.5 }}>Annule le pli en cours. Les cartes sont retirées et le meneur recommence.</Typography>
        <Typography variant="body2" fontWeight={600}>Escape (Fugitif)</Typography>
        <Typography variant="body2" sx={{ mb: 1.5 }}>Perd toujours. Si tous jouent un Escape, le premier joué gagne.</Typography>
        <Typography variant="body2" fontWeight={600}>Cartes Butin (Loot) — Optionnel</Typography>
        <Typography variant="body2">Valeurs : +20, +30 ou -10 points. Activable dans les Paramètres.</Typography>
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant="h6" color="primary.main" gutterBottom>Déroulement d'une Manche</Typography>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}><strong>Distribution</strong> : au round R, chaque joueur reçoit R cartes.</li>
          <li style={{ marginBottom: 8 }}><strong>Annonces</strong> : chaque joueur annonce le nombre de plis (0 à R).</li>
          <li style={{ marginBottom: 8 }}><strong>Jeu</strong> : les joueurs jouent leurs cartes tour par tour.</li>
          <li><strong>Décompte</strong> : l'application calcule automatiquement les scores.</li>
        </ol>
        <Typography variant="body2" sx={{ mt: 1.5, fontStyle: 'italic' }}>Le jeu se joue en 10 manches par défaut.</Typography>
      </CardContent></Card>
    </Box>
  );
}

export default function RulesPage() {
  const [tab, setTab] = useState(0);
  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 600 }, '& .Mui-selected': { color: 'primary.main' } }}>
        <Tab label="Règles" />
        <Tab label="Assistant" />
      </Tabs>
      {tab === 0 ? <RulesContent /> : <ChatBot />}
    </Container>
  );
}

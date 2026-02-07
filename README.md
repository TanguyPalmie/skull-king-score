# Skull King Game Master

Application web mobile-first pour compter les points du jeu de cartes **Skull King**.

## Fonctionnalités

- **2 à 12 joueurs** avec profils (nom + photo)
- Calcul automatique des scores selon les règles officielles
- Bonus : Skull King capture des Pirates (+30/pirate), Sirène bat le Skull King (+50)
- Cartes spéciales : Baleine Blanche, Escape, Butin (optionnel)
- Classement en temps réel avec positions
- Sauvegarde locale automatique + reprise de partie
- Chatbot intégré (100% hors-ligne) pour les règles
- Thème pirate sombre avec contraste élevé
- Interface entièrement en français
- PWA-ready (installable sur mobile)

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:5173`.

## Build de production

```bash
pnpm build
```

Les fichiers seront générés dans le dossier `dist/`.

## Tests

```bash
pnpm test
```

## Structure du projet

```
src/
├── main.tsx              # Point d'entrée
├── App.tsx               # Routage principal
├── types.ts              # Types TypeScript
├── theme.ts              # Thème MUI pirate
├── engine/
│   ├── scoring.ts        # Moteur de calcul des scores
│   └── scoring.test.ts   # Tests unitaires du scoring
├── storage/
│   └── localStorage.ts   # Persistance locale
├── chatbot/
│   ├── knowledgeBase.ts  # Base de connaissances en français
│   └── engine.ts         # Moteur de recherche par mots-clés
├── components/
│   ├── Navigation.tsx     # Navigation par onglets
│   ├── Scoreboard.tsx     # Tableau des scores
│   └── ChatBot.tsx        # Interface du chatbot
└── pages/
    ├── HomePage.tsx       # Accueil
    ├── GamePage.tsx       # Gestion de la partie
    ├── ScoresPage.tsx     # Détails des scores
    ├── RulesPage.tsx      # Règles + chatbot
    └── SettingsPage.tsx   # Paramètres
```

## Règles de scoring

| Condition | Score |
|-----------|-------|
| Annonce > 0 réussie | +20 × annonce |
| Annonce = 0 réussie | +10 × n° du round |
| Annonce > 0 ratée | -10 × \|plis - annonce\| |
| Annonce = 0 ratée | -10 × n° du round |
| SK capture des Pirates | +30 par pirate |
| Sirène bat le SK | +50 |

Les bonus s'appliquent toujours, même si l'annonce est ratée.

# Skull King Game Master

Application web full-stack pour compter les points du jeu de cartes **Skull King**.

## Fonctionnalites

- **2 a 12 joueurs** avec profils (nom + photo)
- Calcul automatique des scores selon les regles officielles
- Bonus : Skull King capture des Pirates (+30/pirate), Sirene bat le Skull King (+50)
- Cartes speciales : Baleine Blanche, Escape, Butin (optionnel)
- Classement en temps reel avec positions
- Chatbot integre (100% hors-ligne) pour les regles
- Theme pirate sombre avec contraste eleve
- Interface entierement en francais
- PWA-ready (installable sur mobile)
- **Authentification** : creation de compte email/mot de passe, cookie securise (token 24h + refresh 7j)
- **Base de donnees PostgreSQL** pour la persistance

## Lancement avec Docker Compose

```bash
docker compose up --build
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001/api

Pour arreter :
```bash
docker compose down
```

Pour tout reinitialiser (y compris la base) :
```bash
docker compose down -v
```

## Developpement sans Docker

### Pre-requis

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- PostgreSQL 16+

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### Backend

```bash
cd backend
pnpm install
DATABASE_URL=postgres://user:pass@localhost:5432/skullking JWT_SECRET=secret node src/index.js
```

### Tests

```bash
cd frontend
pnpm test
```

## Structure du projet

```
skull-king-score/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx              # Point d'entree
│       ├── App.jsx               # Routage + auth
│       ├── theme.js              # Theme MUI pirate
│       ├── api.js                # Client API (fetch + refresh auto)
│       ├── auth/
│       │   └── AuthContext.jsx   # Contexte d'authentification
│       ├── engine/
│       │   ├── scoring.js        # Moteur de scoring
│       │   └── scoring.test.js   # Tests unitaires
│       ├── storage/
│       │   └── localStorage.js   # Persistance locale (fallback)
│       ├── chatbot/
│       │   ├── knowledgeBase.js  # Base de connaissances FR
│       │   └── engine.js         # Moteur mots-cles
│       ├── components/
│       │   ├── Navigation.jsx
│       │   ├── Scoreboard.jsx
│       │   └── ChatBot.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── HomePage.jsx
│           ├── GamePage.jsx
│           ├── ScoresPage.jsx
│           ├── RulesPage.jsx
│           └── SettingsPage.jsx
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── init.sql                  # Schema PostgreSQL
    └── src/
        ├── index.js              # Serveur Express
        ├── db.js                 # Pool PostgreSQL
        ├── auth.js               # JWT + cookies
        ├── middleware/
        │   └── authenticate.js   # Middleware d'auth
        └── routes/
            ├── auth.js           # Register, login, refresh, logout
            ├── games.js          # CRUD parties
            └── settings.js       # CRUD parametres
```

## Regles de scoring

| Condition | Score |
|-----------|-------|
| Annonce > 0 reussie | +20 x annonce |
| Annonce = 0 reussie | +10 x n du round |
| Annonce > 0 ratee | -10 x |plis - annonce| |
| Annonce = 0 ratee | -10 x n du round |
| SK capture des Pirates | +30 par pirate |
| Sirene bat le SK | +50 |

Les bonus s'appliquent toujours, meme si l'annonce est ratee.

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  Stack,
  TextField,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Grow,
  Checkbox,
  Snackbar,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import { Delete, Add, CheckCircle, RadioButtonUnchecked, PersonAdd, Person } from '@mui/icons-material';
import { keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { pirateAvatars, getAvatarEmoji } from '../data/pirateAvatars.js';
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  addFriendProfile,
  getSelectedProfiles,
  setSelectedProfiles,
} from '../storage/profileStorage.js';
import { getFriends } from '../api.js';

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export default function ProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(getProfiles);
  const [selected, setSelected] = useState(getSelectedProfiles);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('skull');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [snack, setSnack] = useState('');

  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const refreshProfiles = useCallback(() => setProfiles(getProfiles()), []);

  const handleCreate = useCallback(() => {
    try {
      saveProfile({ name: newName, avatar: newAvatar });
      refreshProfiles();
      setNewName('');
      setNewAvatar('skull');
      setShowCreate(false);
      setError('');
      setSnack('Joueur cree !');
    } catch (err) {
      setError(err.message);
    }
  }, [newName, newAvatar, refreshProfiles]);

  const handleDelete = useCallback(
    (id) => {
      deleteProfile(id);
      refreshProfiles();
      setSelected((prev) => {
        const next = prev.filter((sid) => sid !== id);
        setSelectedProfiles(next);
        return next;
      });
      setConfirmDelete(null);
      setSnack('Joueur supprime.');
    },
    [refreshProfiles],
  );

  const handleAddFriend = useCallback(
    (friend) => {
      try {
        addFriendProfile({ userId: friend.id, pseudo: friend.pseudo });
        refreshProfiles();
        setSnack(`${friend.pseudo} ajoute !`);
      } catch (err) {
        setSnack(err.message);
      }
    },
    [refreshProfiles],
  );

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const data = await getFriends();
      setFriends(data);
    } catch {
      setFriends([]);
    }
    setFriendsLoading(false);
  }, []);

  const openAddFriend = useCallback(() => {
    setShowAddFriend(true);
    loadFriends();
  }, [loadFriends]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id];
      setSelectedProfiles(next);
      return next;
    });
  }, []);

  const canPlay = selected.length >= 2;

  // Amis deja ajoutes comme profils
  const addedFriendUserIds = profiles.filter((p) => p.type === 'friend').map((p) => p.userId);

  return (
    <Fade in timeout={400}>
      <Container maxWidth="sm" sx={{ py: 3, textAlign: 'center' }}>
        {/* Header */}
        <Box sx={{ mb: 3, animation: `${slideUp} 0.5s ease` }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.5rem' },
              color: 'primary.main',
              mb: 0.5,
            }}
          >
            Game Master
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Compteur de points pour jeux de societe
          </Typography>
        </Box>

        {/* Actions */}
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => setShowCreate(true)}
              sx={{ py: 1.5 }}
            >
              Nouveau Joueur
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PersonAdd />}
              onClick={openAddFriend}
              sx={{ py: 1.5 }}
            >
              Ajouter un Ami
            </Button>
          </Stack>
          <Button
            variant="contained"
            fullWidth
            size="large"
            color="secondary"
            onClick={() => navigate('/games/new')}
            disabled={!canPlay}
            sx={{ py: 1.5 }}
          >
            Jouer ({selected.length})
          </Button>
        </Stack>

        {!canPlay && profiles.length > 0 && (
          <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(169,151,134,0.1)', color: 'text.primary' }}>
            Selectionnez au moins 2 joueurs pour commencer
          </Alert>
        )}

        {/* Liste des profils */}
        {profiles.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Aucun joueur
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Creez des joueurs ou ajoutez des amis pour commencer !
            </Typography>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {profiles.map((profile, idx) => {
              const isSelected = selected.includes(profile.id);
              const isFriend = profile.type === 'friend';
              return (
                <Grow in timeout={200 + idx * 80} key={profile.id}>
                  <Card
                    onClick={() => toggleSelect(profile.id)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'rgba(169,151,134,0.08)' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: isSelected ? 'primary.main' : 'rgba(169,151,134,0.4)' },
                      '&:active': { transform: 'scale(0.98)' },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Checkbox
                        checked={isSelected}
                        icon={<RadioButtonUnchecked />}
                        checkedIcon={<CheckCircle />}
                        color="primary"
                        sx={{ p: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelect(profile.id)}
                      />
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: isSelected ? 'primary.main' : 'rgba(169,151,134,0.2)',
                          color: isSelected ? 'primary.contrastText' : 'primary.main',
                          fontSize: '1.5rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {getAvatarEmoji(profile.avatar)}
                      </Avatar>
                      <Box sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 600 }}>{profile.name}</Typography>
                        {isFriend && (
                          <Chip
                            icon={<Person sx={{ fontSize: 14 }} />}
                            label="Ami"
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ mt: 0.5, height: 22, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(profile);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Card>
                </Grow>
              );
            })}
          </Stack>
        )}

        {/* Dialog creation joueur invite */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ color: 'primary.main' }}>Nouveau Joueur</DialogTitle>
          <DialogContent>
            <TextField
              label="Nom du joueur"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) handleCreate();
              }}
              fullWidth
              autoFocus
              sx={{ mt: 1, mb: 2 }}
              error={!!error}
              helperText={error || 'Pas besoin de compte — juste un nom pour compter les points'}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Choisissez un avatar :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {pirateAvatars.map((avatar) => (
                <Avatar
                  key={avatar.id}
                  onClick={() => setNewAvatar(avatar.id)}
                  sx={{
                    width: 52,
                    height: 52,
                    fontSize: '1.6rem',
                    cursor: 'pointer',
                    bgcolor: newAvatar === avatar.id ? 'primary.main' : 'rgba(169,151,134,0.15)',
                    color: newAvatar === avatar.id ? 'primary.contrastText' : 'text.primary',
                    border: '2px solid',
                    borderColor: newAvatar === avatar.id ? 'primary.main' : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': { transform: 'scale(1.1)', borderColor: 'primary.main' },
                  }}
                >
                  {avatar.emoji}
                </Avatar>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
              Creer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog ajout ami */}
        <Dialog open={showAddFriend} onClose={() => setShowAddFriend(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ color: 'primary.main' }}>Ajouter un Ami</DialogTitle>
          <DialogContent>
            {friendsLoading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : friends.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">Aucun ami pour le moment.</Typography>
                <Button
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setShowAddFriend(false);
                    navigate('/friends');
                  }}
                >
                  Ajouter des amis
                </Button>
              </Box>
            ) : (
              <List sx={{ pt: 0 }}>
                {friends.map((friend) => {
                  const alreadyAdded = addedFriendUserIds.includes(friend.id);
                  return (
                    <ListItem key={friend.id} disablePadding>
                      <ListItemButton
                        onClick={() => !alreadyAdded && handleAddFriend(friend)}
                        disabled={alreadyAdded}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {friend.pseudo?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={friend.pseudo}
                          secondary={alreadyAdded ? 'Deja ajoute' : 'Cliquer pour ajouter'}
                        />
                        {alreadyAdded && <CheckCircle color="success" />}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddFriend(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog suppression */}
        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <DialogTitle>Supprimer ce joueur ?</DialogTitle>
          <DialogContent>
            <Typography>
              Voulez-vous supprimer <strong>{confirmDelete?.name}</strong> ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button onClick={() => handleDelete(confirmDelete.id)} color="error" variant="contained">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!snack}
          autoHideDuration={2000}
          onClose={() => setSnack('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSnack('')}>
            {snack}
          </Alert>
        </Snackbar>
      </Container>
    </Fade>
  );
}

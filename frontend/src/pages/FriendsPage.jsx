import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  IconButton,
  Alert,
  Chip,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  Delete as RemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import * as api from '../api.js';

export default function FriendsPage() {
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [f, p, s] = await Promise.all([api.getFriends(), api.getPendingRequests(), api.getSentRequests()]);
      setFriends(f);
      setPending(p);
      setSent(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const results = await api.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (pseudo) => {
    setError('');
    setSuccess('');
    try {
      await api.sendFriendRequest(pseudo);
      setSuccess(`Demande envoyee a ${pseudo}`);
      setSearchResults([]);
      setSearchQuery('');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.acceptFriend(requestId);
      setSuccess('Ami accepte !');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.rejectFriend(requestId);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (friendId) => {
    if (!confirm('Supprimer cet ami ?')) return;
    try {
      await api.removeFriend(friendId);
      setSuccess('Ami supprime');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h1" color="primary.main" sx={{ mb: 2, textAlign: 'center' }}>
        Amis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Recherche */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary.main" sx={{ mb: 1.5 }}>
            Ajouter un ami
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Pseudo"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2}>
              {searching ? '...' : 'Chercher'}
            </Button>
          </Stack>
          {searchResults.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1.5 }}>
              {searchResults.map((u) => (
                <Stack key={u.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5 }}>
                  <Typography>{u.pseudo}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleSendRequest(u.pseudo)}
                  >
                    Ajouter
                  </Button>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Amis</span>
              {friends.length > 0 && <Chip label={friends.length} size="small" color="primary" />}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Recues</span>
              {pending.length > 0 && <Chip label={pending.length} size="small" color="warning" />}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Envoyees</span>
              {sent.length > 0 && <Chip label={sent.length} size="small" />}
            </Stack>
          }
        />
      </Tabs>

      {/* Amis acceptes */}
      {tab === 0 && (
        <Stack spacing={1}>
          {friends.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              Pas encore d'amis. Recherche un pseudo ci-dessus !
            </Typography>
          )}
          {friends.map((f) => (
            <Card key={f.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{f.pseudo}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.email}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleRemove(f.id)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Demandes recues */}
      {tab === 1 && (
        <Stack spacing={1}>
          {pending.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              Aucune demande en attente.
            </Typography>
          )}
          {pending.map((r) => (
            <Card key={r.request_id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{r.pseudo}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.email}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="success" onClick={() => handleAccept(r.request_id)}>
                      <AcceptIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleReject(r.request_id)}>
                      <RejectIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Demandes envoyees */}
      {tab === 2 && (
        <Stack spacing={1}>
          {sent.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              Aucune demande envoyee.
            </Typography>
          )}
          {sent.map((r) => (
            <Card key={r.request_id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography fontWeight={600}>{r.pseudo}</Typography>
                  <Chip label="En attente" size="small" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

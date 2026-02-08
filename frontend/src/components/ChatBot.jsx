import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, IconButton, Chip, Paper, Stack } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { processQuery } from '../chatbot/engine.js';
import { defaultSuggestions } from '../chatbot/knowledgeBase.js';
import { generateId } from '../storage/localStorage.js';

const WELCOME = {
  id: 'welcome',
  sender: 'bot',
  text: "Ahoy moussaillon ! Je suis votre assistant Skull King. Posez-moi vos questions sur les règles, le scoring, les cartes spéciales ou les stratégies.",
};

export default function ChatBot() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { id: generateId(), sender: 'user', text: trimmed };
    const result = processQuery(trimmed);
    const botMsg = { id: generateId(), sender: 'bot', text: result.answer };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100vh - 260px)', sm: 'calc(100vh - 300px)' }, minHeight: 300 }}>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 1, py: 2 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.sender === 'bot' ? 'flex-start' : 'flex-end', mb: 1.5 }}>
            <Paper
              elevation={1}
              sx={{
                px: 2, py: 1.5, maxWidth: '85%',
                bgcolor: msg.sender === 'bot' ? 'background.paper' : 'primary.main',
                color: msg.sender === 'bot' ? 'text.primary' : 'primary.contrastText',
                borderRadius: msg.sender === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                border: msg.sender === 'bot' ? '1px solid rgba(212,175,55,0.2)' : 'none',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {msg.text}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
      <Box sx={{ px: 1, py: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {defaultSuggestions.map((s) => (
          <Chip key={s} label={s} size="small" variant="outlined" color="primary"
            onClick={() => sendMessage(s)} sx={{ fontSize: '0.75rem' }} />
        ))}
      </Box>
      <Stack direction="row" spacing={1} sx={{ px: 1, pb: 1 }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Posez votre question..."
          size="small" fullWidth variant="outlined"
        />
        <IconButton color="primary" onClick={() => sendMessage(input)} disabled={!input.trim()}>
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}

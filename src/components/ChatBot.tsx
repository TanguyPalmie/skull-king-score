import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { ChatMessage } from '../types';
import { processQuery } from '../chatbot/engine';
import { defaultSuggestions } from '../chatbot/knowledgeBase';
import { generateId } from '../storage/localStorage';

const e = React.createElement;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'bot',
  text: "Ahoy moussaillon ! Je suis votre assistant Skull King. Posez-moi vos questions sur les règles, le scoring, les cartes spéciales ou les stratégies. Vous pouvez aussi cliquer sur les suggestions ci-dessous.",
  timestamp: Date.now(),
};

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        sender: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };

      const result = processQuery(trimmed);

      const botMsg: ChatMessage = {
        id: generateId(),
        sender: 'bot',
        text: result.answer,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput('');
    },
    []
  );

  const handleSend = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const renderMessage = (msg: ChatMessage) => {
    const isBot = msg.sender === 'bot';
    return e(
      Box,
      {
        key: msg.id,
        sx: {
          display: 'flex',
          justifyContent: isBot ? 'flex-start' : 'flex-end',
          mb: 1.5,
        },
      },
      e(
        Paper,
        {
          elevation: 1,
          sx: {
            px: 2,
            py: 1.5,
            maxWidth: '85%',
            bgcolor: isBot ? 'background.paper' : 'primary.main',
            color: isBot ? 'text.primary' : 'primary.contrastText',
            borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
            border: isBot ? '1px solid rgba(212,175,55,0.2)' : 'none',
          },
        },
        e(
          Typography,
          {
            variant: 'body2',
            sx: { whiteSpace: 'pre-line', lineHeight: 1.6 },
          },
          msg.text
        )
      )
    );
  };

  return e(
    Box,
    {
      sx: {
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'calc(100vh - 260px)', sm: 'calc(100vh - 300px)' },
        minHeight: 300,
      },
    },
    // Messages area
    e(
      Box,
      {
        ref: scrollRef,
        sx: {
          flex: 1,
          overflowY: 'auto',
          px: 1,
          py: 2,
        },
      },
      ...messages.map(renderMessage)
    ),

    // Suggestion chips
    e(
      Box,
      {
        sx: {
          px: 1,
          py: 1,
          overflowX: 'auto',
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap',
        },
      },
      ...defaultSuggestions.map((suggestion) =>
        e(Chip, {
          key: suggestion,
          label: suggestion,
          size: 'small',
          variant: 'outlined',
          color: 'primary',
          onClick: () => sendMessage(suggestion),
          sx: { fontSize: '0.75rem' },
        })
      )
    ),

    // Input area
    e(
      Stack,
      { direction: 'row', spacing: 1, sx: { px: 1, pb: 1 } },
      e(TextField, {
        value: input,
        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setInput(ev.target.value),
        onKeyDown: handleKeyDown,
        placeholder: 'Posez votre question...',
        size: 'small',
        fullWidth: true,
        variant: 'outlined',
      }),
      e(
        IconButton,
        {
          color: 'primary',
          onClick: handleSend,
          disabled: !input.trim(),
        },
        e(SendIcon, null)
      )
    )
  );
}

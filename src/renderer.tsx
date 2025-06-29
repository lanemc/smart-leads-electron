import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './renderer/App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Royals-themed MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#004687', // Royals Blue
      light: '#336699',
      dark: '#002855'
    },
    secondary: {
      main: '#BD9B60', // Royals Gold
      light: '#D4B896',
      dark: '#9A7B4F'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
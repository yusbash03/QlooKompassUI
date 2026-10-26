import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { listenForInstallPrompt } from '@/features/pwa/install-store';
import '@/styles/index.css';
import { App } from './App';
import { Providers } from './providers';
import { applyTheme } from './theme';

applyTheme();
listenForInstallPrompt();

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);

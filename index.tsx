
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { localDB } from './services/localDB';
import { mediaService } from './services/mediaService';

// An open course tab can outlive the build that served its module URLs.
let retryingCourse = false;
window.addEventListener('vite:preloadError', (event) => {
  const [route, query] = window.location.hash.slice(1).split('?');
  if (retryingCourse || !navigator.onLine || route !== '/tools/neuro3d'
    || new URLSearchParams(query).get('tab') !== 'curso') return;
  try {
    const key = 'qbank-nri-course-reload';
    const previous = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - previous < 30_000) return;
    sessionStorage.setItem(key, String(Date.now()));
    retryingCourse = true;
    event.preventDefault();
    window.location.reload();
  } catch {
    // Storage may be blocked. The course still exposes a manual reload.
  }
});

// Inicializar Banco Local antes de montar o App
const initApp = async () => {
  try {
    await localDB.init();
    console.log("LocalDB pronto.");
  } catch (e) {
    console.error("Falha ao iniciar LocalDB:", e);
  }

  // Registro do Service Worker (Global)
  if ('serviceWorker' in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.debug('SW registrado com sucesso:', reg.scope);
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nova versão disponível do aplicativo.');
                }
              };
            }
          };
        })
        .catch(() => {
          navigator.serviceWorker.register('./sw.js').catch(err => {
            console.warn('SW falha no registro:', err);
          });
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const RootApp = () => {
    useEffect(() => {
      return () => {
        mediaService.clearMemory();
      };
    }, []);

    return (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  };

  const root = ReactDOM.createRoot(rootElement);
  root.render(<RootApp />);
};

initApp();

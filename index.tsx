
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { localDB } from './services/localDB';
import { mediaService } from './services/mediaService';

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
    window.addEventListener('load', () => {
      // Usar './sw.js' sem escopo explícito permite que o navegador infira o escopo correto
      // baseado na localização do arquivo, evitando erros de segurança em alguns ambientes.
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.debug('SW registrado com sucesso:', reg.scope);
          // Força atualização se houver nova versão
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('Nova versão disponível. Recarregue.');
                  }
                }
              };
            }
          };
        })
        .catch(err => {
          console.warn('SW falha no registro:', err);
        });
    });
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

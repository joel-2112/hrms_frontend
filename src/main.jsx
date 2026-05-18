import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store.js';
import './index.css'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.js';
import App from './App.jsx';

const Fallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">Loading application...</p>
    </div>
  </div>
);
//this os comment
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={<Fallback />}>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Provider>
  </React.Suspense>
);


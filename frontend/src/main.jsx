import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { setupMockApi } from './mockApi.js';

// Connect directly to the Python backend; mock API is only for standalone offline fallback
if (import.meta.env.VITE_USE_MOCK === "true") {
  console.info("Using standalone offline mock API adapter");
  setupMockApi();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

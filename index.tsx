
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/hud.css';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log("Application Entry Point - Mounting Root");
try {
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
  console.log("Application Render Triggered");
} catch (e) {
  console.error("Critical Render Error:", e);
}

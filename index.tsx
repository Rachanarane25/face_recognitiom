import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../style.css'; // Adjust path depending on where style.css is located

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

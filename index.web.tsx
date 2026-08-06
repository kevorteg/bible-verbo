import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("index.tsx is executing...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}
console.log("Found root element, creating React root...");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
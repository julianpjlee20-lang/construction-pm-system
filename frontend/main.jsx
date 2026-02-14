import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Mock 資料（開發用，後端 API 完成後移除）
// import './mockData';  // ← 已註解，現在使用真實 API (http://localhost:8096)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

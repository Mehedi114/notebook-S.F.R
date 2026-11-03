import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090B10',
            color: '#F4F4F6',
            padding: '24px',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <img
            src="/brand/sfr-logo.png"
            alt="S.F.R"
            style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #FF6B00' }}
          />
          <h2 style={{ margin: 0, fontSize: 18 }}>SUMON FROM RANGPUR</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#A1A1AA', maxWidth: 360 }}>
            {String(this.state.error?.message || 'একটি সাময়িক সমস্যা হয়েছে।')}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: '#FF6B00',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            রিলোড করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafeErrorBoundary>
      <App />
    </SafeErrorBoundary>
  </React.StrictMode>
);

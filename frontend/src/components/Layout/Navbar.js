import React from 'react';
import { Globe } from 'lucide-react';

const Navbar = ({ language, toggleLanguage }) => {
  return (
    <header className="app-header">
      <div className="live-badge">
        SYSTEM ACTIVE
      </div>

      <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '800', letterSpacing: '1px', color: '#e6edf3' }}>
        {language === 'en' ? 'AGRO-RESILIENCE' : 'कृषि-लचीलापन'}
      </h1>

      <button 
        onClick={toggleLanguage}
        style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #233023',
            color: '#c9d1d9',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s'
        }}
      >
        <Globe size={16} />
        {language === 'en' ? 'HI' : 'EN'}
      </button>
    </header>
  );
};

export default Navbar;
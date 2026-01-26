import React from 'react';

const Spinner = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
      <div className="spinner-icon">🔄</div>
      <p>Analyzing agricultural data...</p>
    </div>
  );
};

export default Spinner;
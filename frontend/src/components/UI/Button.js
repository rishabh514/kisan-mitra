import React from 'react';

const Button = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{
        padding: '10px 20px',
        backgroundColor: disabled ? '#ccc' : '#2e7d32',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 'bold'
      }}
    >
      {children}
    </button>
  );
};

export default Button;
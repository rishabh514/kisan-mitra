import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Volume2, StopCircle } from 'lucide-react';

const Message = ({ sender, text, onSpeak, isSpeakingThisMsg }) => {
  const isUser = sender === 'user';

  return (
    <div className={`msg-row ${sender}`} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: '20px'
    }}>
      <span className="sender-label" style={{ 
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px', color: '#8b949e' 
      }}>
        {sender === 'user' ? 'YOU' : 'AGRO-BOT'}
      </span>

      <div className="msg-bubble" style={{
        padding: '1.2rem',
        borderRadius: '12px',
        backgroundColor: isUser ? '#2e7d32' : '#161b22',
        color: isUser ? 'white' : '#e6edf3',
        border: isUser ? 'none' : '1px solid #30363d',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {isUser ? (
            text
        ) : (
            <div className="markdown-body" style={{ lineHeight: '1.6' }}>
                <ReactMarkdown
                    components={{
                        // Styling for Markdown Elements
                        p: ({node, ...props}) => <p style={{ marginBottom: '10px' }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ paddingLeft: '20px', marginBottom: '10px' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ paddingLeft: '20px', marginBottom: '10px' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: '5px' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ color: '#4caf50', fontWeight: 'bold' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: '1.1rem', color: '#4caf50', marginTop: '15px', marginBottom: '10px' }} {...props} />
                    }}
                >
                    {text}
                </ReactMarkdown>
            </div>
        )}

        {/* Speaker Button inside bubble */}
        {!isUser && (
            <button 
                onClick={() => onSpeak(text)}
                style={{ 
                    position: 'absolute', bottom: '-25px', left: '0',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e'
                }}
            >
                <Volume2 size={16} />
            </button>
        )}
      </div>
    </div>
  );
};

export default Message;